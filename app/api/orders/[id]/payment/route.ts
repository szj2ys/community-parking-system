import { NextRequest, NextResponse } from "next/server";
import { successResponse, errorResponse } from "@/lib/api-response";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import {
  createUnifiedOrder,
  generateTimestamp,
  generateNonceStr,
  generatePaySign,
  getWeChatPayConfig,
} from "@/lib/payment";

/**
 * POST /api/orders/[id]/payment
 * Create payment for an order
 * Returns WeChat Pay JSAPI parameters
 */
export async function POST(
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

    // Fetch order with spot and owner information
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        spot: {
          include: {
            owner: {
              select: { id: true, name: true, wxOpenid: true },
            },
          },
        },
        tenant: {
          select: { id: true, name: true, wxOpenid: true },
        },
      },
    });

    if (!order) {
      return NextResponse.json(errorResponse("NOT_FOUND", "订单不存在"), {
        status: 404,
      });
    }

    // Check if user is the tenant (only tenant can pay for their order)
    if (order.tenantId !== session.user.id) {
      return NextResponse.json(errorResponse("FORBIDDEN", "无权操作此订单"), {
        status: 403,
      });
    }

    // Validate order status - only PENDING orders can be paid
    if (order.status !== "PENDING") {
      return NextResponse.json(
        errorResponse("INVALID_STATUS", `订单状态为${order.status}，无法支付`),
        { status: 400 }
      );
    }

    // Check if order is expired (30 minutes from creation)
    const orderTime = new Date(order.createdAt).getTime();
    const now = Date.now();
    const thirtyMinutes = 30 * 60 * 1000;

    if (now - orderTime > thirtyMinutes) {
      return NextResponse.json(
        errorResponse("ORDER_EXPIRED", "订单已过期，请重新预订"),
        { status: 400 }
      );
    }

    // Get tenant's WeChat OpenID
    const openid = order.tenant?.wxOpenid;

    if (!openid) {
      // For testing/development without real WeChat integration, return mock payment params
      if (process.env.NODE_ENV === "development" || !process.env.WECHAT_MCH_ID) {
        const config = getWeChatPayConfig();
        const timestamp = generateTimestamp();
        const nonceStr = generateNonceStr();
        const prepayId = `mock_prepay_${order.id}`;
        const paySign = await generatePaySign(config.appId, timestamp, nonceStr, prepayId, config.apiKey);

        return NextResponse.json(
          successResponse(
            {
              paymentParams: {
                appId: config.appId,
                timeStamp: timestamp,
                nonceStr: nonceStr,
                package: `prepay_id=${prepayId}`,
                signType: "HMAC-SHA256",
                paySign: paySign,
              },
              orderId: order.id,
              amount: Number(order.totalPrice),
              isMock: true,
            },
            "支付参数生成成功（测试模式）"
          )
        );
      }

      return NextResponse.json(
        errorResponse("NO_WECHAT_OPENID", "请先绑定微信"),
        { status: 400 }
      );
    }

    // Create unified order with WeChat Pay
    try {
      const result = await createUnifiedOrder({
        id: order.id,
        totalPrice: Number(order.totalPrice),
        description: `车位预订 - ${order.spot.title}`,
        openid: openid,
      });

      return NextResponse.json(
        successResponse(
          {
            paymentParams: result.paymentParams,
            orderId: order.id,
            amount: Number(order.totalPrice),
          },
          "支付参数生成成功"
        )
      );
    } catch (paymentError: any) {
      console.error("WeChat Pay API error:", paymentError);

      // For development/testing, return mock params on error
      if (process.env.NODE_ENV === "development") {
        const config = getWeChatPayConfig();
        const timestamp = generateTimestamp();
        const nonceStr = generateNonceStr();
        const prepayId = `mock_prepay_${order.id}`;
        const paySign = await generatePaySign(config.appId, timestamp, nonceStr, prepayId, config.apiKey);

        return NextResponse.json(
          successResponse(
            {
              paymentParams: {
                appId: config.appId,
                timeStamp: timestamp,
                nonceStr: nonceStr,
                package: `prepay_id=${prepayId}`,
                signType: "HMAC-SHA256",
                paySign: paySign,
              },
              orderId: order.id,
              amount: Number(order.totalPrice),
              isMock: true,
            },
            "支付参数生成成功（测试模式）"
          )
        );
      }

      return NextResponse.json(
        errorResponse("PAYMENT_INIT_FAILED", "支付初始化失败，请重试"),
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("创建支付订单失败:", error);
    return NextResponse.json(
      errorResponse("INTERNAL_ERROR", "系统错误，请稍后重试"),
      { status: 500 }
    );
  }
}
