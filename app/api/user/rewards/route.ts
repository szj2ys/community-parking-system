import { auth } from "@/lib/auth";
import { getReferralRewardsSummary } from "@/lib/referral";
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

    // Get referral rewards summary
    const summary = await getReferralRewardsSummary(userId);

    return NextResponse.json({
      success: true,
      data: summary,
    });
  } catch (error) {
    console.error("获取奖励明细失败:", error);
    return NextResponse.json(
      { success: false, message: "获取奖励明细失败" },
      { status: 500 }
    );
  }
}
