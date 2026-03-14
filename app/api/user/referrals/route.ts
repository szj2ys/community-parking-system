import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { maskPhoneNumber } from "@/lib/privacy";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, message: "未登录" },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    // Get user with referral info
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        referralCode: true,
        referralRewards: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, message: "用户不存在" },
        { status: 404 }
      );
    }

    // Get invited users with their info
    const referrals = await prisma.referralRecord.findMany({
      where: { referrerId: userId },
      include: {
        referee: {
          select: {
            id: true,
            name: true,
            phone: true,
            createdAt: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const invitedUsers = referrals.map((ref) => ({
      id: ref.referee.id,
      name: ref.referee.name,
      phone: maskPhoneNumber(ref.referee.phone),
      createdAt: ref.referee.createdAt.toISOString(),
      rewardAmount: Number(ref.rewardAmount),
    }));

    return NextResponse.json({
      success: true,
      data: {
        referralCode: user.referralCode ?? "",
        referralRewards: Number(user.referralRewards),
        invitedCount: referrals.length,
        invitedUsers,
      },
    });
  } catch (error) {
    console.error("获取邀请统计失败:", error);
    return NextResponse.json(
      { success: false, message: "获取邀请统计失败" },
      { status: 500 }
    );
  }
}
