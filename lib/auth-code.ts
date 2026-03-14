/**
 * SMS Code generation and verification
 * 短信验证码生成与验证
 */

// 模拟验证码存储 (生产环境使用 Redis)
const codeStore = new Map<string, string>();

/**
 * Generate a 6-digit verification code for a phone number
 * 生成6位数字验证码
 */
export function generateCode(phone: string): string {
  const code = Math.random().toString().slice(2, 8);
  codeStore.set(phone, code);
  // 5分钟后过期
  setTimeout(() => codeStore.delete(phone), 5 * 60 * 1000);
  return code;
}

/**
 * Verify a code for a phone number
 * 验证手机号对应的验证码
 */
export function verifyCode(phone: string, code: string): boolean {
  return codeStore.get(phone) === code;
}
