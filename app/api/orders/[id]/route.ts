import { NextRequest, NextResponse } from "next/server";
import { successResponse, errorResponse } from "@/lib/api-response";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { calculateReferralReward } from "@/lib/referral";
import { maskPhoneNumber } from "@/lib/privacy";

// 确认订单
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    const { id } = await params;

    if (!session?.user) {
      return NextResponse.json(errorResponse("UNAUTHORIZED", "请先登录"), {
        status: 401,
      });
    }

    const body = await request.json();
    const { action } = body; // "confirm" | "reject" | "cancel"

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        spot: {
          select: { ownerId: true, title: true },
        },
      },
    });

    if (!order) {
      return NextResponse.json(errorResponse("NOT_FOUND", "订单不存在"), {
        status: 404,
      });
    }

    const userRole = (session.user as any).role;
    const userId = session.user.id;

    let newStatus = order.status;

    if (action === "confirm") {
      // 只有业主可以确认
      if (userRole !== "OWNER" || order.spot.ownerId !== userId) {
        return NextResponse.json(errorResponse("FORBIDDEN", "无权操作"), {
          status: 403,
        });
      }
      if (order.status !== "PENDING") {
        return NextResponse.json(errorResponse("INVALID_STATUS", "订单状态不正确"), {
          status: 400,
        });
      }
      newStatus = "CONFIRMED";
    } else if (action === "reject") {
      // 只有业主可以拒绝
      if (userRole !== "OWNER" || order.spot.ownerId !== userId) {
        return NextResponse.json(errorResponse("FORBIDDEN", "无权操作"), {
          status: 403,
        });
      }
      if (order.status !== "PENDING") {
        return NextResponse.json(errorResponse("INVALID_STATUS", "订单状态不正确"), {
          status: 400,
        });
      }
      newStatus = "REJECTED";
    } else if (action === "cancel") {
      // 租户可以取消自己的订单
      if (order.tenantId !== userId) {
        return NextResponse.json(errorResponse("FORBIDDEN", "无权操作"), {
          status: 403,
        });
      }
      if (order.status !== "PENDING" && order.status !== "CONFIRMED") {
        return NextResponse.json(errorResponse("INVALID_STATUS", "订单状态不正确"), {
          status: 400,
        });
      }
      newStatus = "CANCELLED";
    } else if (action === "complete") {
      // 业主可以标记完成
      if (userRole !== "OWNER" || order.spot.ownerId !== userId) {
        return NextResponse.json(errorResponse("FORBIDDEN", "无权操作"), {
          status: 403,
        });
      }
      if (order.status !== "IN_PROGRESS") {
        return NextResponse.json(errorResponse("INVALID_STATUS", "订单状态不正确"), {
          status: 400,
        });
      }
      newStatus = "COMPLETED";
    }

    const updatedOrder = await prisma.order.update({
      where: { id },
      data: { status: newStatus },
      include: {
        spot: {
          select: { id: true, title: true, address: true },
        },
        tenant: {
          select: { id: true, name: true, phone: true },
        },
      },
    });

    // 如果订单完成，触发邀请奖励
    if (newStatus === "COMPLETED") {
      try {
        const tenantId = order.tenantId;
        const orderAmount = Number(order.totalPrice);

        // 查找该租户是否有待处理的邀请记录
        const referralRecord = await prisma.referralRecord.findUnique({
          where: { refereeId: tenantId },
        });

        if (referralRecord && referralRecord.status === "pending") {
          const rewardAmount = calculateReferralReward(orderAmount);

          // 使用事务更新邀请记录和推荐人奖励
          await prisma.$transaction(async (tx) => {
            await tx.referralRecord.update({
              where: { id: referralRecord.id },
              data: {
                status: "rewarded",
                rewardAmount,
                triggeredByOrderId: id,
                rewardedAt: new Date(),
              },
            });

            await tx.user.update({
              where: { id: referralRecord.referrerId },
              data: {
                referralRewards: {
                  increment: rewardAmount,
                },
              },
            });
          });
        }
      } catch (rewardError) {
        // 奖励发放失败不影响订单完成，记录错误即可
        console.error("发放邀请奖励失败:", rewardError);
      }
    }

    // Mask phone number in response
    const maskedOrder = {
      ...updatedOrder,
      tenant: updatedOrder.tenant
        ? {
            ...updatedOrder.tenant,
            phone: maskPhoneNumber(updatedOrder.tenant.phone),
          }
        : null,
    };

    return NextResponse.json(
      successResponse(maskedOrder, "操作成功")
    );
  } catch (error) {
    console.error("更新订单失败:", error);
    return NextResponse.json(errorResponse("UPDATE_FAILED", "操作失败"), {
      status: 500,
    });
  }
}

// 获取订单详情
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    const { id } = await params;

    if (!session?.user) {
      return NextResponse.json(errorResponse("UNAUTHORIZED", "请先登录"), {
        status: 401,
      });
    }

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        spot: {
          include: {
            owner: {
              select: { id: true, name: true, phone: true },
            },
          },
        },
        tenant: {
          select: { id: true, name: true, phone: true },
        },
      },
    });

    if (!order) {
      return NextResponse.json(errorResponse("NOT_FOUND", "订单不存在"), {
        status: 404,
      });
    }

    // 检查权限（租户或业主可以查看）
    const userId = session.user.id;
    const userRole = (session.user as any).role;

    if (
      order.tenantId !== userId &&
      !(userRole === "OWNER" && order.spot.ownerId === userId)
    ) {
      return NextResponse.json(errorResponse("FORBIDDEN", "无权查看"), {
        status: 403,
      });
    }

    // Mask phone numbers in response
    const maskedOrder = {
      ...order,
      spot: {
        ...order.spot,
        owner: {
          ...order.spot.owner,
          phone: maskPhoneNumber(order.spot.owner.phone),
        },
      },
      tenant: order.tenant
        ? {
            ...order.tenant,
            phone: maskPhoneNumber(order.tenant.phone),
          }
        : null,
    };

    return NextResponse.json(successResponse(maskedOrder));
  } catch (error) {
    console.error("获取订单详情失败:", error);
    return NextResponse.json(
      errorResponse("FETCH_FAILED", "获取订单详情失败"),
      { status: 500 }
    );
  }
}
