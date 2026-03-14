import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { calculateReferralReward } from "@/lib/referral";
import { NextResponse } from "next/server";
import { z } from "zod";

const rewardSchema = z.object({
  orderId: z.string(),
});

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, message: "未登录" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const parsed = rewardSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, message: "参数错误" },
        { status: 400 }
      );
    }

    const { orderId } = parsed.data;

    // Get order details
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        tenant: true,
      },
    });

    if (!order) {
      return NextResponse.json(
        { success: false, message: "订单不存在" },
        { status: 404 }
      );
    }

    if (order.status !== "COMPLETED") {
      return NextResponse.json(
        { success: false, message: "订单未完成" },
        { status: 400 }
      );
    }

    // Check if this user has a referrer
    const referralRecord = await prisma.referralRecord.findUnique({
      where: { refereeId: order.tenantId },
    });

    if (!referralRecord) {
      return NextResponse.json({
        success: true,
        message: "无邀请记录",
        data: { rewarded: false },
      });
    }

    // Already rewarded
    if (referralRecord.status === "rewarded") {
      return NextResponse.json({
        success: true,
        message: "奖励已发放",
        data: { rewarded: true, amount: Number(referralRecord.rewardAmount) },
      });
    }

    // Calculate reward
    const orderAmount = Number(order.totalPrice);
    const rewardAmount = calculateReferralReward(orderAmount);

    // Update referral record and referrer's rewards in a transaction
    await prisma.$transaction(async (tx) => {
      // Update referral record
      await tx.referralRecord.update({
        where: { id: referralRecord.id },
        data: {
          status: "rewarded",
          rewardAmount,
          triggeredByOrderId: orderId,
          rewardedAt: new Date(),
        },
      });

      // Update referrer's rewards balance
      await tx.user.update({
        where: { id: referralRecord.referrerId },
        data: {
          referralRewards: {
            increment: rewardAmount,
          },
        },
      });
    });

    return NextResponse.json({
      success: true,
      message: "奖励发放成功",
      data: {
        rewarded: true,
        amount: rewardAmount,
        referrerId: referralRecord.referrerId,
      },
    });
  } catch (error) {
    console.error("发放邀请奖励失败:", error);
    return NextResponse.json(
      { success: false, message: "发放邀请奖励失败" },
      { status: 500 }
    );
  }
}
