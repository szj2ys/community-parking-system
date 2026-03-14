import { NextRequest, NextResponse } from "next/server";
import { successResponse, errorResponse } from "@/lib/api-response";
import { prisma } from "@/lib/prisma";
import {
  verifyWebhookSignature,
  decryptNotification,
  getWeChatPayConfig,
} from "@/lib/payment";

/**
 * POST /api/webhooks/wechat-pay
 * Handle WeChat Pay payment notification callback
 * This endpoint receives payment status updates from WeChat Pay
 */
export async function POST(request: NextRequest) {
  try {
    // Get raw request body
    const rawBody = await request.text();

    // Get signature from headers
    const signature = request.headers.get("Wechatpay-Signature");
    const timestamp = request.headers.get("Wechatpay-Timestamp");
    const nonce = request.headers.get("Wechatpay-Nonce");
    const serial = request.headers.get("Wechatpay-Serial");

    // Validate required headers
    if (!signature || !timestamp || !nonce) {
      console.error("Missing WeChat Pay webhook headers");
      return NextResponse.json(
        errorResponse("MISSING_HEADERS", "Missing required headers"),
        { status: 400 }
      );
    }

    // Get WeChat Pay configuration
    let config;
    try {
      config = getWeChatPayConfig();
    } catch (error) {
      console.error("WeChat Pay configuration error:", error);
      return NextResponse.json(
        errorResponse("CONFIG_ERROR", "Payment configuration error"),
        { status: 500 }
      );
    }

    // Verify webhook signature
    const isValidSignature = await verifyWebhookSignature(
      timestamp,
      nonce,
      rawBody,
      signature,
      config.apiKey
    );

    if (!isValidSignature) {
      console.error("Invalid WeChat Pay webhook signature");
      return NextResponse.json(
        errorResponse("INVALID_SIGNATURE", "Invalid signature"),
        { status: 401 }
      );
    }

    // Parse the notification
    let notification;
    try {
      notification = JSON.parse(rawBody);
    } catch (error) {
      console.error("Invalid JSON in webhook body:", error);
      return NextResponse.json(
        errorResponse("INVALID_BODY", "Invalid JSON"),
        { status: 400 }
      );
    }

    // Check if it's a payment success notification
    const eventType = notification.event_type;
    if (eventType !== "TRANSACTION.SUCCESS") {
      // Not a success event, acknowledge but do nothing
      return NextResponse.json(successResponse(null, "Event acknowledged"));
    }

    // Decrypt the resource
    const resource = notification.resource;
    if (!resource) {
      console.error("Missing resource in notification");
      return NextResponse.json(
        errorResponse("MISSING_RESOURCE", "Missing resource"),
        { status: 400 }
      );
    }

    let decryptedData;
    try {
      decryptedData = await decryptNotification(
        resource.ciphertext,
        resource.associated_data,
        resource.nonce,
        config.apiKey
      );
    } catch (error) {
      console.error("Failed to decrypt notification:", error);
      return NextResponse.json(
        errorResponse("DECRYPT_ERROR", "Failed to decrypt notification"),
        { status: 500 }
      );
    }

    const { out_trade_no, transaction_id, trade_state, amount: paymentAmount } = decryptedData;

    // Only process successful payments
    if (trade_state !== "SUCCESS") {
      console.log(`Payment ${out_trade_no} is not successful: ${trade_state}`);
      return NextResponse.json(
        successResponse(null, "Payment not successful, acknowledged")
      );
    }

    // Find the order
    const order = await prisma.order.findUnique({
      where: { id: out_trade_no },
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
      console.error(`Order ${out_trade_no} not found`);
      return NextResponse.json(
        errorResponse("ORDER_NOT_FOUND", "Order not found"),
        { status: 404 }
      );
    }

    // Check if order is already processed (idempotency)
    if (order.status === "CONFIRMED" || order.status === "IN_PROGRESS") {
      console.log(`Order ${out_trade_no} is already confirmed/processed`);
      return NextResponse.json(
        successResponse(null, "Order already processed")
      );
    }

    // Validate order status
    if (order.status !== "PENDING") {
      console.error(`Order ${out_trade_no} is not in PENDING status: ${order.status}`);
      return NextResponse.json(
        errorResponse("INVALID_ORDER_STATUS", "Order is not pending"),
        { status: 400 }
      );
    }

    // Validate payment amount
    const expectedAmount = Math.round(Number(order.totalPrice) * 100); // Convert to cents
    if (paymentAmount.total !== expectedAmount) {
      console.error(
        `Payment amount mismatch for order ${out_trade_no}: expected ${expectedAmount}, got ${paymentAmount.total}`
      );
      // Still process but log the discrepancy
    }

    // Update order status to CONFIRMED
    const updatedOrder = await prisma.order.update({
      where: { id: out_trade_no },
      data: {
        status: "CONFIRMED",
        // Store transaction ID for reference
        // Note: You may need to add a transactionId field to the Order model
      },
      include: {
        spot: {
          select: { id: true, title: true, address: true },
        },
        tenant: {
          select: { id: true, name: true },
        },
      },
    });

    // Send notification to owner (this would call T1-notifications service)
    // For now, we log the notification
    console.log(`Payment successful for order ${out_trade_no}. Notifying owner ${order.spot.ownerId}`);

    // TODO: Integrate with T1-notifications service
    // await sendPaymentNotification({
    //   userId: order.spot.ownerId,
    //   type: 'PAYMENT_RECEIVED',
    //   title: '收到新订单支付',
    //   content: `订单 #${order.id.slice(-6)} 已支付 ¥${order.totalPrice}`,
    //   orderId: order.id,
    // });

    return NextResponse.json(
      successResponse(
        {
          orderId: updatedOrder.id,
          status: updatedOrder.status,
          transactionId: transaction_id,
          amount: paymentAmount.total / 100, // Convert back to yuan
        },
        "Payment processed successfully"
      )
    );
  } catch (error) {
    console.error("WeChat Pay webhook processing error:", error);
    return NextResponse.json(
      errorResponse("INTERNAL_ERROR", "Internal server error"),
      { status: 500 }
    );
  }
}
