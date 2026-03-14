import { NextRequest, NextResponse } from "next/server";
import { successResponse, errorResponse } from "@/lib/api-response";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { maskPhoneNumber } from "@/lib/privacy";
import { z } from "zod";

const createOrderSchema = z.object({
  spotId: z.string().min(1, "请选择车位"),
  startTime: z.string().min(1, "请选择开始时间"),
  endTime: z.string().min(1, "请选择结束时间"),
  note: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json(errorResponse("UNAUTHORIZED", "请先登录"), {
        status: 401,
      });
    }

    if ((session.user as any).role !== "TENANT") {
      return NextResponse.json(
        errorResponse("FORBIDDEN", "只有租户可以预订车位"),
        { status: 403 }
      );
    }

    const body = await request.json();
    const parsed = createOrderSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        errorResponse("INVALID_DATA", "数据格式错误"),
        { status: 400 }
      );
    }

    const { spotId, startTime, endTime, note } = parsed.data;

    // 检查车位是否存在且可租
    const spot = await prisma.parkingSpot.findUnique({
      where: { id: spotId },
    });

    if (!spot) {
      return NextResponse.json(errorResponse("NOT_FOUND", "车位不存在"), {
        status: 404,
      });
    }

    if (spot.status !== "AVAILABLE") {
      return NextResponse.json(
        errorResponse("SPOT_UNAVAILABLE", "车位暂不可租"),
        { status: 400 }
      );
    }

    // 不能预订自己的车位
    if (spot.ownerId === session.user.id) {
      return NextResponse.json(
        errorResponse("CANNOT_BOOK_OWN", "不能预订自己的车位"),
        { status: 400 }
      );
    }

    const start = new Date(startTime);
    const end = new Date(endTime);

    // 验证时间
    if (start >= end) {
      return NextResponse.json(
        errorResponse("INVALID_TIME", "结束时间必须晚于开始时间"),
        { status: 400 }
      );
    }

    if (start < new Date()) {
      return NextResponse.json(
        errorResponse("INVALID_TIME", "不能预订过去的时间"),
        { status: 400 }
      );
    }

    // 计算价格
    const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
    const totalPrice = Math.ceil(hours * Number(spot.pricePerHour));

    // 使用事务创建订单，防止并发预订冲突
    const order = await prisma.$transaction(async (tx) => {
      // 检查是否有时间重叠的已确认/进行中/待确认的订单
      const overlappingOrders = await tx.order.findMany({
        where: {
          spotId,
          status: { in: ["PENDING", "CONFIRMED", "IN_PROGRESS"] },
          // 时间重叠检查：新订单的开始时间早于现有订单的结束时间，且新订单的结束时间晚于现有订单的开始时间
          AND: [
            { startTime: { lt: end } },
            { endTime: { gt: start } },
          ],
        },
      });

      if (overlappingOrders.length > 0) {
        throw new Error("TIME_SLOT_BOOKED");
      }

      // 创建订单
      return await tx.order.create({
        data: {
          spotId,
          tenantId: session.user.id!,
          startTime: start,
          endTime: end,
          totalPrice,
          note,
          status: "PENDING",
        },
        include: {
          spot: {
            include: {
              owner: {
                select: { id: true, name: true, phone: true },
              },
            },
          },
        },
      });
    });

    // Mask phone number in response
    const maskedOrder = {
      ...order,
      spot: {
        ...order.spot,
        owner: {
          ...order.spot.owner,
          phone: maskPhoneNumber(order.spot.owner.phone),
        },
      },
    };

    return NextResponse.json(successResponse(maskedOrder, "预订申请已提交"));
  } catch (error: any) {
    if (error.message === "TIME_SLOT_BOOKED") {
      return NextResponse.json(
        errorResponse("TIME_SLOT_BOOKED", "该时段已被预订"),
        { status: 409 }
      );
    }
    console.error("创建订单失败:", error);
    return NextResponse.json(errorResponse("CREATE_FAILED", "预订失败"), {
      status: 500,
    });
  }
}

// 获取我的订单（租户视角）
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json(errorResponse("UNAUTHORIZED", "请先登录"), {
        status: 401,
      });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const role = (session.user as any).role;

    const where: Record<string, unknown> = {};

    if (role === "TENANT") {
      where.tenantId = session.user.id;
    } else if (role === "OWNER") {
      // 业主查看收到自己车位的订单
      where.spot = {
        ownerId: session.user.id,
      };
    }

    if (status) {
      where.status = status;
    }

    const orders = await prisma.order.findMany({
      where,
      include: {
        spot: {
          select: {
            id: true,
            title: true,
            address: true,
            pricePerHour: true,
          },
        },
        tenant: {
          select: { id: true, name: true, phone: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Mask phone numbers in response
    const maskedOrders = orders.map((order) => ({
      ...order,
      tenant: order.tenant
        ? {
            ...order.tenant,
            phone: maskPhoneNumber(order.tenant.phone),
          }
        : null,
    }));

    return NextResponse.json(successResponse(maskedOrders));
  } catch (error) {
    console.error("获取订单失败:", error);
    return NextResponse.json(errorResponse("FETCH_FAILED", "获取订单失败"), {
      status: 500,
    });
  }
}
