/**
 * Mask a phone number for privacy protection
 * Formats: 138****8888
 * @param phone - Full phone number
 * @returns Masked phone number or undefined if input is undefined
 */
export function maskPhoneNumber(phone: string | undefined | null): string | undefined {
  if (!phone) return undefined;
  if (phone.length !== 11) return phone; // Return as-is if not standard Chinese phone

  return `${phone.slice(0, 3)}****${phone.slice(7)}`;
}

/**
 * Mask phone numbers in a user object
 * @param user - User object with phone property
 * @returns User object with masked phone
 */
export function maskUserPhone<T extends { phone?: string | null }>(user: T): T {
  return {
    ...user,
    phone: maskPhoneNumber(user.phone),
  };
}
