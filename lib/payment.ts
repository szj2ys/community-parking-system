/**
 * WeChat Pay SDK wrapper
 * 封装微信支付 v3 API 调用
 */

import { nanoid } from 'nanoid';

// WeChat Pay configuration
interface WeChatPayConfig {
  mchId: string;
  apiKey: string;
  appId: string;
  notifyUrl: string;
}

// Payment parameters for JSAPI
export interface PaymentParams {
  appId: string;
  timeStamp: string;
  nonceStr: string;
  package: string;
  signType: 'RSA' | 'HMAC-SHA256';
  paySign: string;
}

// Unified order response
export interface UnifiedOrderResponse {
  prepayId: string;
  paymentParams: PaymentParams;
}

// Order info for payment
export interface OrderInfo {
  id: string;
  totalPrice: number;
  description: string;
  openid: string;
}

/**
 * Get WeChat Pay configuration from environment variables
 */
export function getWeChatPayConfig(): WeChatPayConfig {
  const mchId = process.env.WECHAT_MCH_ID;
  const apiKey = process.env.WECHAT_API_KEY;
  const appId = process.env.WECHAT_APP_ID;
  const notifyUrl = process.env.WECHAT_NOTIFY_URL || `${process.env.NEXT_PUBLIC_APP_URL || 'https://parking.app'}/api/webhooks/wechat-pay`;

  if (!mchId || !apiKey || !appId) {
    throw new Error('Missing WeChat Pay configuration: WECHAT_MCH_ID, WECHAT_API_KEY, WECHAT_APP_ID');
  }

  return { mchId, apiKey, appId, notifyUrl };
}

/**
 * Generate a random nonce string
 */
export function generateNonceStr(): string {
  return nanoid(32);
}

/**
 * Generate timestamp in seconds
 */
export function generateTimestamp(): string {
  return Math.floor(Date.now() / 1000).toString();
}

/**
 * Build message for signature
 * Following WeChat Pay v3 API signature format
 */
export function buildSignMessage(
  method: string,
  url: string,
  timestamp: string,
  nonceStr: string,
  body: string
): string {
  return `${method}\n${url}\n${timestamp}\n${nonceStr}\n${body}\n`;
}

/**
 * Generate WeChat Pay v3 API signature
 * Using HMAC-SHA256 with API key
 */
export async function generateSignature(message: string, apiKey: string): Promise<string> {
  const crypto = await import('crypto');
  return crypto.createHmac('sha256', apiKey).update(message).digest('hex');
}

/**
 * Generate payment signature for JSAPI (paySign)
 * This is the signature returned to client for WeChat JSAPI payment
 */
export async function generatePaySign(
  appId: string,
  timestamp: string,
  nonceStr: string,
  prepayId: string,
  apiKey: string
): Promise<string> {
  const crypto = await import('crypto');
  const message = `${appId}\n${timestamp}\n${nonceStr}\nprepay_id=${prepayId}\n`;
  return crypto.createHmac('sha256', apiKey).update(message).digest('hex');
}

/**
 * Verify WeChat Pay callback signature
 * @param timestamp - Timestamp from header
 * @param nonceStr - Nonce string from header
 * @param body - Raw request body
 * @param signature - Signature from header
 * @param apiKey - WeChat Pay API key
 */
export async function verifyWebhookSignature(
  timestamp: string,
  nonceStr: string,
  body: string,
  signature: string,
  apiKey: string
): Promise<boolean> {
  try {
    const crypto = await import('crypto');
    const message = `${timestamp}\n${nonceStr}\n${body}\n`;
    const expectedSignature = crypto.createHmac('sha256', apiKey).update(message).digest('hex');
    return signature === expectedSignature;
  } catch (error) {
    console.error('Signature verification failed:', error);
    return false;
  }
}

/**
 * Create unified order for WeChat Pay JSAPI
 * This function creates a payment order and returns parameters needed for frontend JSAPI call
 */
export async function createUnifiedOrder(orderInfo: OrderInfo): Promise<UnifiedOrderResponse> {
  const config = getWeChatPayConfig();
  const timestamp = generateTimestamp();
  const nonceStr = generateNonceStr();

  // Generate unique out_trade_no (order ID)
  const outTradeNo = orderInfo.id;

  // Build request body
  const requestBody = {
    appid: config.appId,
    mchid: config.mchId,
    description: orderInfo.description || '车位预订',
    out_trade_no: outTradeNo,
    notify_url: config.notifyUrl,
    amount: {
      total: Math.round(orderInfo.totalPrice * 100), // Convert to cents
      currency: 'CNY',
    },
    payer: {
      openid: orderInfo.openid,
    },
  };

  const bodyString = JSON.stringify(requestBody);

  // Build signature
  const signMessage = buildSignMessage('POST', '/v3/pay/transactions/jsapi', timestamp, nonceStr, bodyString);
  const signature = await generateSignature(signMessage, config.apiKey);

  // Make API request to WeChat Pay
  const url = 'https://api.mch.weixin.qq.com/v3/pay/transactions/jsapi';
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `WECHATPAY2-SHA256-RSA2048 mchid="${config.mchId}",nonce_str="${nonceStr}",timestamp="${timestamp}",serial_no="${config.mchId}",signature="${signature}"`,
    },
    body: bodyString,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    console.error('WeChat Pay API error:', errorData);
    throw new Error(`WeChat Pay API error: ${response.status}`);
  }

  const data = await response.json() as { prepay_id: string };
  const prepayId = data.prepay_id;

  // Generate payment parameters for JSAPI
  const payTimestamp = generateTimestamp();
  const payNonceStr = generateNonceStr();
  const paySign = await generatePaySign(config.appId, payTimestamp, payNonceStr, prepayId, config.apiKey);

  const paymentParams: PaymentParams = {
    appId: config.appId,
    timeStamp: payTimestamp,
    nonceStr: payNonceStr,
    package: `prepay_id=${prepayId}`,
    signType: 'HMAC-SHA256',
    paySign,
  };

  return {
    prepayId,
    paymentParams,
  };
}

/**
 * Parse WeChat Pay notification (webhook callback)
 */
export function parsePaymentNotification(body: string): {
  success: boolean;
  orderId: string | null;
  transactionId: string | null;
  amount: number;
} {
  try {
    const data = JSON.parse(body) as {
      id: string;
      create_time: string;
      resource: {
        algorithm: string;
        ciphertext: string;
        associated_data: string;
        nonce: string;
      };
    };

    // Decrypt the resource (simplified - in production, use proper decryption)
    // For now, we assume the body is already decrypted or we use the direct response format
    // In WeChat Pay v3, the notification requires AES-GCM decryption

    return {
      success: true,
      orderId: null, // Would be extracted from decrypted data
      transactionId: null,
      amount: 0,
    };
  } catch (error) {
    console.error('Failed to parse payment notification:', error);
    return {
      success: false,
      orderId: null,
      transactionId: null,
      amount: 0,
    };
  }
}

/**
 * Decrypt WeChat Pay notification ciphertext
 * Using AES-256-GCM decryption
 */
export async function decryptNotification(
  ciphertext: string,
  associatedData: string,
  nonce: string,
  apiKey: string
): Promise<{
  out_trade_no: string;
  transaction_id: string;
  trade_state: string;
  amount: { total: number };
}> {
  const crypto = await import('crypto');

  // Derive key from API key (MD5 hash, take first 32 chars for AES-256)
  const key = crypto.createHash('md5').update(apiKey).digest('hex').substring(0, 32);

  // Decode ciphertext from Base64
  const encryptedData = Buffer.from(ciphertext, 'base64');

  // Extract auth tag (last 16 bytes for GCM)
  const authTag = encryptedData.slice(-16);
  const encrypted = encryptedData.slice(0, -16);

  // Create decipher
  const decipher = crypto.createDecipherGCM('aes-256-gcm', Buffer.from(key), Buffer.from(nonce));
  decipher.setAuthTag(authTag);
  decipher.setAAD(Buffer.from(associatedData));

  // Decrypt
  let decrypted = decipher.update(encrypted, undefined, 'utf8');
  decrypted += decipher.final('utf8');

  return JSON.parse(decrypted);
}

/**
 * Close order (for orders not paid within time limit)
 */
export async function closeOrder(orderId: string): Promise<boolean> {
  try {
    const config = getWeChatPayConfig();
    const timestamp = generateTimestamp();
    const nonceStr = generateNonceStr();

    const requestBody = {
      mchid: config.mchId,
      out_trade_no: orderId,
    };

    const bodyString = JSON.stringify(requestBody);
    const signMessage = buildSignMessage('POST', `/v3/pay/transactions/out-trade-no/${orderId}/close`, timestamp, nonceStr, bodyString);
    const signature = await generateSignature(signMessage, config.apiKey);

    const url = `https://api.mch.weixin.qq.com/v3/pay/transactions/out-trade-no/${orderId}/close`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `WECHATPAY2-SHA256-RSA2048 mchid="${config.mchId}",nonce_str="${nonceStr}",timestamp="${timestamp}",serial_no="${config.mchId}",signature="${signature}"`,
      },
      body: bodyString,
    });

    return response.ok;
  } catch (error) {
    console.error('Failed to close order:', error);
    return false;
  }
}

/**
 * Query order status
 */
export async function queryOrder(orderId: string): Promise<{
  success: boolean;
  status?: string;
  tradeState?: string;
  amount?: number;
}> {
  try {
    const config = getWeChatPayConfig();
    const timestamp = generateTimestamp();
    const nonceStr = generateNonceStr();

    const url = `https://api.mch.weixin.qq.com/v3/pay/transactions/out-trade-no/${orderId}?mchid=${config.mchId}`;
    const signMessage = buildSignMessage('GET', `/v3/pay/transactions/out-trade-no/${orderId}?mchid=${config.mchId}`, timestamp, nonceStr, '');
    const signature = await generateSignature(signMessage, config.apiKey);

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `WECHATPAY2-SHA256-RSA2048 mchid="${config.mchId}",nonce_str="${nonceStr}",timestamp="${timestamp}",serial_no="${config.mchId}",signature="${signature}"`,
      },
    });

    if (!response.ok) {
      return { success: false };
    }

    const data = await response.json() as {
      trade_state: string;
      amount: { total: number };
    };

    return {
      success: true,
      status: data.trade_state,
      tradeState: data.trade_state,
      amount: data.amount.total / 100, // Convert from cents
    };
  } catch (error) {
    console.error('Failed to query order:', error);
    return { success: false };
  }
}
