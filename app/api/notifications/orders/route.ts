import { NextRequest, NextResponse } from "next/server";
import { successResponse, errorResponse } from "@/lib/api-response";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import {
  sendNotificationAsync,
  formatTemplateVariables,
} from "@/lib/notifications";
import { NotificationType } from "@/lib/notification-templates";
import { z } from "zod";
import { z } from "zod";

const sendNotificationSchema = z.object({
  orderId: z.string().min(1, "订单ID不能为空"),
  type: z.enum(["NEW_ORDER", "PAYMENT_SUCCESS", "ORDER_CANCELLED"], {
    errorMap: () => ({ message: "无效的通知类型" }),
  }),
});

/**
 * POST /api/notifications/orders
 * 发送订单通知给车位主
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json(errorResponse("UNAUTHORIZED", "请先登录"), {
        status: 401,
      });
    }

    const body = await request.json();
    const parsed = sendNotificationSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        errorResponse("INVALID_DATA", parsed.error.errors[0]?.message || "数据格式错误"),
        { status: 400 }
      );
    }

    const { orderId, type } = parsed.data;

    // 查询订单信息
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        spot: {
          include: {
            owner: {
              select: {
                id: true,
                phone: true,
                wxOpenid: true,
              },
            },
          },
        },
      },
    });

    if (!order) {
      return NextResponse.json(errorResponse("NOT_FOUND", "订单不存在"), {
        status: 404,
      });
    }

    // 权限检查：只有订单相关的租户或车位主可以触发通知
    const userId = (session.user as { id: string }).id;
    if (order.tenantId !== userId && order.spot.ownerId !== userId) {
      return NextResponse.json(
        errorResponse("FORBIDDEN", "无权为此订单发送通知"),
        { status: 403 }
      );
    }

    // 格式化模板变量
    const vars = formatTemplateVariables(
      order.spot.address,
      order.startTime,
      order.endTime,
      Number(order.totalPrice),
      order.id
    );

    // 异步发送通知（不阻塞响应）
    sendNotificationAsync(
      order.spot.owner.id,
      order.id,
      type as NotificationType,
      vars,
      order.spot.owner.phone,
      order.spot.owner.wxOpenid || undefined
    );

    return NextResponse.json(
      successResponse({ orderId, type }, "通知已加入发送队列")
    );
  } catch (error) {
    console.error("发送订单通知失败:", error);
    return NextResponse.json(errorResponse("SEND_FAILED", "通知发送失败"), {
      status: 500,
    });
  }
}
