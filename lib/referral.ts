/**
 * Referral system utilities
 * 邀请码生成与验证工具
 */

import { customAlphabet } from "nanoid";
import { prisma } from "./prisma";
import { sendRewardNotificationAsync } from "./notifications";

// 使用易读字符集（排除容易混淆的字符如 0, O, 1, I）
const ALPHABET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
const generateCode = customAlphabet(ALPHABET, 8);

const REFERRAL_CODE_PREFIX = "CP";
const REFERRAL_CODE_STORAGE_KEY = "referral_code";

/**
 * Generate a unique referral code for a user
 * 为用户生成唯一邀请码
 */
export function generateReferralCode(): string {
  const code = generateCode();
  return `${REFERRAL_CODE_PREFIX}${code}`;
}

/**
 * Get the full referral link with the code
 * 获取完整的邀请链接
 */
export function getReferralLink(referralCode: string): string {
  return `${process.env.NEXT_PUBLIC_APP_URL || "https://parking.app"}/auth/login?ref=${referralCode}`;
}

/**
 * Validate referral code format
 * 验证邀请码格式
 */
export function isValidReferralCodeFormat(code: string): boolean {
  // Format: CP + 8 alphanumeric characters (excluding confusing ones)
  return /^CP[23456789ABCDEFGHJKLMNPQRSTUVWXYZ]{8}$/.test(code);
}

/**
 * Extract referral code from URL
 * 从 URL 中提取邀请码
 */
export function extractReferralCode(url: string): string | null {
  try {
    const parsedUrl = new URL(url);
    const ref = parsedUrl.searchParams.get("ref");
    if (ref && isValidReferralCodeFormat(ref)) {
      return ref;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Calculate referral reward amount
 * 计算邀请奖励金额
 * @param orderAmount - 订单金额
 * @returns 奖励金额（订单金额的10%，最高50元）
 */
export function calculateReferralReward(orderAmount: number): number {
  const REWARD_RATE = 0.1;
  const MAX_REWARD = 50;

  const reward = Math.floor(orderAmount * REWARD_RATE);
  return Math.min(reward, MAX_REWARD);
}

/**
 * Store referral code in localStorage
 * 将邀请码存储在 localStorage 中
 */
export function storeReferralCode(code: string): void {
  if (typeof window !== "undefined" && typeof localStorage !== "undefined") {
    localStorage.setItem(REFERRAL_CODE_STORAGE_KEY, code);
  }
}

/**
 * Get stored referral code from localStorage
 * 从 localStorage 获取存储的邀请码
 */
export function getStoredReferralCode(): string | null {
  if (typeof window !== "undefined" && typeof localStorage !== "undefined") {
    return localStorage.getItem(REFERRAL_CODE_STORAGE_KEY);
  }
  return null;
}

/**
 * Clear stored referral code from localStorage
 * 清除 localStorage 中的邀请码
 */
export function clearStoredReferralCode(): void {
  if (typeof window !== "undefined" && typeof localStorage !== "undefined") {
    localStorage.removeItem(REFERRAL_CODE_STORAGE_KEY);
  }
}

/**
 * Process referral reward when order is completed
 * 订单完成时处理推荐奖励
 * @param orderId - 订单ID
 * @param tenantId - 租户ID（被邀请人）
 * @param orderAmount - 订单金额
 * @returns 奖励发放结果
 */
export async function processReferralReward(
  orderId: string,
  tenantId: string,
  orderAmount: number
): Promise<{
  success: boolean;
  rewardAmount?: number;
  referrerId?: string;
  message: string;
}> {
  try {
    // 查找该用户是否有推荐记录（被邀请人）
    const referralRecord = await prisma.referralRecord.findUnique({
      where: { refereeId: tenantId },
    });

    if (!referralRecord) {
      return { success: false, message: "No referral record found" };
    }

    // 检查是否已经发放过奖励
    if (referralRecord.status === "rewarded") {
      return { success: false, message: "Reward already granted" };
    }

    // 检查是否是首单（通过检查是否已有其他已完成的订单）
    const completedOrdersCount = await prisma.order.count({
      where: {
        tenantId: tenantId,
        status: "COMPLETED",
        id: { not: orderId }, // 排除当前订单
      },
    });

    if (completedOrdersCount > 0) {
      return { success: false, message: "Not first order" };
    }

    // 计算奖励金额
    const rewardAmount = calculateReferralReward(orderAmount);

    if (rewardAmount <= 0) {
      return { success: false, message: "Invalid reward amount" };
    }

    // 更新推荐记录状态和邀请人奖励总额（并行执行）
    await Promise.all([
      prisma.referralRecord.update({
        where: { id: referralRecord.id },
        data: {
          status: "rewarded",
          rewardAmount: rewardAmount,
          rewardedAt: new Date(),
          triggeredByOrderId: orderId,
        },
      }),
      prisma.user.update({
        where: { id: referralRecord.referrerId },
        data: {
          referralRewards: {
            increment: rewardAmount,
          },
        },
      }),
    ]);

    // 获取被邀请人信息（用于通知）
    const referee = await prisma.user.findUnique({
      where: { id: tenantId },
      select: { name: true },
    });

    // 异步发送奖励通知（不阻塞主流程）
    sendRewardNotificationAsync(
      referralRecord.referrerId,
      rewardAmount,
      referee?.name ?? null,
      orderAmount,
      orderId
    );

    return {
      success: true,
      rewardAmount,
      referrerId: referralRecord.referrerId,
      message: "Reward granted successfully",
    };
  } catch (error) {
    console.error("[Referral] Failed to process reward:", error);
    return { success: false, message: "Internal error" };
  }
}

/**
 * Get referral rewards summary for a user
 * 获取用户的推荐奖励汇总
 * @param userId - 用户ID
 * @returns 奖励汇总信息
 */
export async function getReferralRewardsSummary(userId: string): Promise<{
  totalRewards: number;
  rewardedCount: number;
  pendingCount: number;
  referrals: Array<{
    id: string;
    refereeName: string | null;
    rewardAmount: number;
    status: string;
    rewardedAt: Date | null;
  }>;
}> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      referralRewards: true,
    },
  });

  if (!user) {
    return {
      totalRewards: 0,
      rewardedCount: 0,
      pendingCount: 0,
      referrals: [],
    };
  }

  const referrals = await prisma.referralRecord.findMany({
    where: { referrerId: userId },
    include: {
      referee: {
        select: {
          name: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // 单次遍历计算各状态数量
  let rewardedCount = 0;
  let pendingCount = 0;
  for (const r of referrals) {
    if (r.status === "rewarded") rewardedCount++;
    else if (r.status === "pending") pendingCount++;
  }

  return {
    totalRewards: Number(user.referralRewards),
    rewardedCount,
    pendingCount,
    referrals: referrals.map((r) => ({
      id: r.id,
      refereeName: r.referee.name,
      rewardAmount: Number(r.rewardAmount),
      status: r.status,
      rewardedAt: r.rewardedAt,
    })),
  };
}

/**
 * Check if order qualifies for referral reward
 * 检查订单是否符合推荐奖励条件
 * @param orderId - 订单ID
 * @param tenantId - 租户ID
 * @returns 是否符合条件
 */
export async function checkReferralRewardEligibility(
  orderId: string,
  tenantId: string
): Promise<{
  eligible: boolean;
  referrerId?: string;
  reason?: string;
}> {
  // 查找推荐记录
  const referralRecord = await prisma.referralRecord.findUnique({
    where: { refereeId: tenantId },
  });

  if (!referralRecord) {
    return { eligible: false, reason: "No referral record" };
  }

  if (referralRecord.status === "rewarded") {
    return { eligible: false, reason: "Already rewarded" };
  }

  // 检查是否是首单
  const completedOrdersCount = await prisma.order.count({
    where: {
      tenantId: tenantId,
      status: "COMPLETED",
      id: { not: orderId },
    },
  });

  if (completedOrdersCount > 0) {
    return { eligible: false, reason: "Not first order" };
  }

  return { eligible: true, referrerId: referralRecord.referrerId };
}
