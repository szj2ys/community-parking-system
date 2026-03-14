// Rate limiting implementation using in-memory store
// In production, replace with Redis or similar distributed store

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

// Clean up expired entries periodically (every 5 minutes)
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetTime < now) {
      rateLimitStore.delete(key);
    }
  }
}, 5 * 60 * 1000);

/**
 * Check if a request should be rate limited
 * @param key - Unique identifier (e.g., phone number or IP address)
 * @param maxRequests - Maximum number of requests allowed in the window
 * @param windowMs - Time window in milliseconds
 * @returns Object with allowed status and remaining time if limited
 */
export function checkRateLimit(
  key: string,
  maxRequests: number,
  windowMs: number
): { allowed: boolean; retryAfterMs?: number } {
  const now = Date.now();
  const entry = rateLimitStore.get(key);

  if (!entry || entry.resetTime < now) {
    // First request or window expired, create new entry
    rateLimitStore.set(key, {
      count: 1,
      resetTime: now + windowMs,
    });
    return { allowed: true };
  }

  if (entry.count >= maxRequests) {
    // Rate limit exceeded
    return {
      allowed: false,
      retryAfterMs: entry.resetTime - now,
    };
  }

  // Increment count
  entry.count++;
  return { allowed: true };
}

/**
 * Rate limit configuration for SMS verification codes
 */
export const SMS_RATE_LIMITS = {
  // Per phone number: 1 request per 5 minutes
  PHONE: {
    maxRequests: 1,
    windowMs: 5 * 60 * 1000, // 5 minutes
  },
  // Per IP: 10 requests per hour
  IP: {
    maxRequests: 10,
    windowMs: 60 * 60 * 1000, // 1 hour
  },
};

/**
 * Check SMS rate limits for both phone and IP
 * @param phone - Phone number
 * @param ip - IP address
 * @returns Result object with allowed status and error message if limited
 */
export function checkSMSRateLimit(
  phone: string,
  ip: string
): { allowed: boolean; error?: string; retryAfterSec?: number } {
  // Check phone number rate limit
  const phoneKey = `sms:phone:${phone}`;
  const phoneResult = checkRateLimit(
    phoneKey,
    SMS_RATE_LIMITS.PHONE.maxRequests,
    SMS_RATE_LIMITS.PHONE.windowMs
  );

  if (!phoneResult.allowed) {
    const retryAfterSec = Math.ceil((phoneResult.retryAfterMs || 0) / 1000);
    return {
      allowed: false,
      error: `请等待 ${Math.ceil(retryAfterSec / 60)} 分钟后重试`,
      retryAfterSec,
    };
  }

  // Check IP rate limit
  const ipKey = `sms:ip:${ip}`;
  const ipResult = checkRateLimit(
    ipKey,
    SMS_RATE_LIMITS.IP.maxRequests,
    SMS_RATE_LIMITS.IP.windowMs
  );

  if (!ipResult.allowed) {
    const retryAfterSec = Math.ceil((ipResult.retryAfterMs || 0) / 1000);
    return {
      allowed: false,
      error: `该设备请求过于频繁，请等待 ${Math.ceil(retryAfterSec / 60)} 分钟后重试`,
      retryAfterSec,
    };
  }

  return { allowed: true };
}
