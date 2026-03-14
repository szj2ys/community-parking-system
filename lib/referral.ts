/**
 * Referral system utilities
 * 邀请码生成与验证工具
 */

import { customAlphabet } from "nanoid";

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
