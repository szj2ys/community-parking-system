import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  generateNonceStr,
  generateTimestamp,
  buildSignMessage,
  generateSignature,
  generatePaySign,
  verifyWebhookSignature,
  getWeChatPayConfig,
} from './payment';

describe('payment', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    // Set up environment variables for testing
    process.env = {
      ...originalEnv,
      WECHAT_MCH_ID: '1234567890',
      WECHAT_API_KEY: 'test_api_key_1234567890',
      WECHAT_APP_ID: 'wx_test_app_id',
    };
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.restoreAllMocks();
  });

  describe('getWeChatPayConfig', () => {
    it('should return config when all env variables are set', () => {
      const config = getWeChatPayConfig();
      expect(config.mchId).toBe('1234567890');
      expect(config.apiKey).toBe('test_api_key_1234567890');
      expect(config.appId).toBe('wx_test_app_id');
    });

    it('should throw error when WECHAT_MCH_ID is missing', () => {
      delete process.env.WECHAT_MCH_ID;
      expect(() => getWeChatPayConfig()).toThrow('Missing WeChat Pay configuration');
    });

    it('should throw error when WECHAT_API_KEY is missing', () => {
      delete process.env.WECHAT_API_KEY;
      expect(() => getWeChatPayConfig()).toThrow('Missing WeChat Pay configuration');
    });

    it('should throw error when WECHAT_APP_ID is missing', () => {
      delete process.env.WECHAT_APP_ID;
      expect(() => getWeChatPayConfig()).toThrow('Missing WeChat Pay configuration');
    });
  });

  describe('generateNonceStr', () => {
    it('should generate string of 32 characters', () => {
      const nonce = generateNonceStr();
      expect(nonce).toHaveLength(32);
    });

    it('should generate different nonces on each call', () => {
      const nonce1 = generateNonceStr();
      const nonce2 = generateNonceStr();
      expect(nonce1).not.toBe(nonce2);
    });

    it('should generate URL-safe string', () => {
      const nonce = generateNonceStr();
      expect(nonce).toMatch(/^[A-Za-z0-9_-]+$/);
    });
  });

  describe('generateTimestamp', () => {
    it('should return numeric string', () => {
      const timestamp = generateTimestamp();
      expect(timestamp).toMatch(/^\d+$/);
    });

    it('should return timestamp in seconds', () => {
      const now = Math.floor(Date.now() / 1000);
      const timestamp = parseInt(generateTimestamp(), 10);
      expect(timestamp).toBeGreaterThanOrEqual(now - 1);
      expect(timestamp).toBeLessThanOrEqual(now + 1);
    });
  });

  describe('buildSignMessage', () => {
    it('should build correct sign message format', () => {
      const message = buildSignMessage('POST', '/v3/pay/transactions/jsapi', '1600000000', 'nonce123', '{"key":"value"}');
      expect(message).toBe('POST\n/v3/pay/transactions/jsapi\n1600000000\nnonce123\n{"key":"value"}\n');
    });

    it('should handle empty body', () => {
      const message = buildSignMessage('GET', '/v3/pay/transactions/native', '1600000000', 'nonce456', '');
      expect(message).toBe('GET\n/v3/pay/transactions/native\n1600000000\nnonce456\n\n');
    });

    it('should include newlines between components', () => {
      const message = buildSignMessage('POST', '/test', '123', 'abc', '{}');
      const parts = message.split('\n');
      expect(parts).toHaveLength(6); // 5 components + empty after last newline
      expect(parts[0]).toBe('POST');
      expect(parts[1]).toBe('/test');
      expect(parts[2]).toBe('123');
      expect(parts[3]).toBe('abc');
      expect(parts[4]).toBe('{}');
    });
  });

  describe('generateSignature', () => {
    it('should generate valid HMAC-SHA256 signature when called with correct parameters', async () => {
      const message = 'test message';
      const key = 'secret_key';
      const signature = await generateSignature(message, key);

      expect(signature).toBeDefined();
      expect(signature).toHaveLength(64); // SHA256 hex is 64 chars
      expect(signature).toMatch(/^[a-f0-9]+$/); // hex format
    });

    it('should generate consistent signature for same input', async () => {
      const message = 'test message';
      const key = 'secret_key';
      const sig1 = await generateSignature(message, key);
      const sig2 = await generateSignature(message, key);
      expect(sig1).toBe(sig2);
    });

    it('should generate different signatures for different messages', async () => {
      const key = 'secret_key';
      const sig1 = await generateSignature('message1', key);
      const sig2 = await generateSignature('message2', key);
      expect(sig1).not.toBe(sig2);
    });

    it('should generate different signatures for different keys', async () => {
      const message = 'test message';
      const sig1 = await generateSignature(message, 'key1');
      const sig2 = await generateSignature(message, 'key2');
      expect(sig1).not.toBe(sig2);
    });

    it('should handle empty message', async () => {
      const signature = await generateSignature('', 'key');
      expect(signature).toBeDefined();
      expect(signature).toHaveLength(64);
    });

    it('should handle unicode characters', async () => {
      const message = '微信支付测试';
      const key = '密钥';
      const signature = await generateSignature(message, key);
      expect(signature).toBeDefined();
      expect(signature).toHaveLength(64);
    });
  });

  describe('generatePaySign', () => {
    it('should generate paySign for JSAPI', async () => {
      const appId = 'wx_app_id';
      const timestamp = '1600000000';
      const nonceStr = 'nonce_string';
      const prepayId = 'prepay_id_123';
      const apiKey = 'api_key_secret';

      const paySign = await generatePaySign(appId, timestamp, nonceStr, prepayId, apiKey);

      expect(paySign).toBeDefined();
      expect(paySign).toHaveLength(64);
    });

    it('should include prepay_id in signature calculation', async () => {
      const appId = 'wx_app_id';
      const timestamp = '1600000000';
      const nonceStr = 'nonce_string';
      const apiKey = 'api_key_secret';

      const paySign1 = await generatePaySign(appId, timestamp, nonceStr, 'prepay_id_1', apiKey);
      const paySign2 = await generatePaySign(appId, timestamp, nonceStr, 'prepay_id_2', apiKey);

      expect(paySign1).not.toBe(paySign2);
    });

    it('should generate consistent signature for same parameters', async () => {
      const paySign1 = await generatePaySign('app', '123', 'nonce', 'prepay', 'key');
      const paySign2 = await generatePaySign('app', '123', 'nonce', 'prepay', 'key');
      expect(paySign1).toBe(paySign2);
    });
  });

  describe('verifyWebhookSignature', () => {
    it('should return true for valid signature', async () => {
      const timestamp = '1600000000';
      const nonceStr = 'nonce_test';
      const body = '{"event":"payment"}';
      const apiKey = 'webhook_secret';

      const crypto = await import('crypto');
      const expectedSig = crypto.createHmac('sha256', apiKey)
        .update(`${timestamp}\n${nonceStr}\n${body}\n`)
        .digest('hex');

      const isValid = await verifyWebhookSignature(timestamp, nonceStr, body, expectedSig, apiKey);
      expect(isValid).toBe(true);
    });

    it('should return false for invalid signature', async () => {
      const isValid = await verifyWebhookSignature(
        '1600000000',
        'nonce',
        '{}',
        'invalid_signature',
        'secret'
      );
      expect(isValid).toBe(false);
    });

    it('should return false when signature does not match', async () => {
      const timestamp = '1600000000';
      const nonceStr = 'nonce';
      const body = '{}';
      const apiKey = 'secret';

      const isValid = await verifyWebhookSignature(timestamp, nonceStr, body, 'wrong_signature', apiKey);
      expect(isValid).toBe(false);
    });

    it('should return false when body is modified', async () => {
      const timestamp = '1600000000';
      const nonceStr = 'nonce';
      const body = '{"amount":100}';
      const apiKey = 'secret';

      const crypto = await import('crypto');
      const validSig = crypto.createHmac('sha256', apiKey)
        .update(`${timestamp}\n${nonceStr}\n${body}\n`)
        .digest('hex');

      // Verify against tampered body
      const isValid = await verifyWebhookSignature(timestamp, nonceStr, '{"amount":200}', validSig, apiKey);
      expect(isValid).toBe(false);
    });

    it('should handle empty body', async () => {
      const timestamp = '1600000000';
      const nonceStr = 'nonce';
      const apiKey = 'secret';

      const crypto = await import('crypto');
      const signature = crypto.createHmac('sha256', apiKey)
        .update(`${timestamp}\n${nonceStr}\n\n`)
        .digest('hex');

      const isValid = await verifyWebhookSignature(timestamp, nonceStr, '', signature, apiKey);
      expect(isValid).toBe(true);
    });
  });

  describe('integration', () => {
    it('should generate valid payment signature when called with correct parameters', async () => {
      // Simulate the full flow of generating a payment signature
      const config = getWeChatPayConfig();
      const timestamp = generateTimestamp();
      const nonceStr = generateNonceStr();

      // Build sign message for unified order
      const method = 'POST';
      const url = '/v3/pay/transactions/jsapi';
      const requestBody = JSON.stringify({
        appid: config.appId,
        mchid: config.mchId,
        description: 'Test order',
      });

      const signMessage = buildSignMessage(method, url, timestamp, nonceStr, requestBody);
      const apiSignature = await generateSignature(signMessage, config.apiKey);

      expect(apiSignature).toBeDefined();
      expect(apiSignature).toHaveLength(64);
      expect(apiSignature).toMatch(/^[a-f0-9]+$/);

      // Generate paySign for JSAPI
      const prepayId = 'wx_prepay_id_test';
      const paySign = await generatePaySign(config.appId, timestamp, nonceStr, prepayId, config.apiKey);

      expect(paySign).toBeDefined();
      expect(paySign).toHaveLength(64);

      // Verify webhook signature handling
      const webhookTimestamp = timestamp;
      const webhookNonce = nonceStr;
      const webhookBody = '{"id":"test","create_time":"2024-01-01"}';

      const crypto = await import('crypto');
      const webhookSig = crypto.createHmac('sha256', config.apiKey)
        .update(`${webhookTimestamp}\n${webhookNonce}\n${webhookBody}\n`)
        .digest('hex');

      const isValidWebhook = await verifyWebhookSignature(
        webhookTimestamp,
        webhookNonce,
        webhookBody,
        webhookSig,
        config.apiKey
      );
      expect(isValidWebhook).toBe(true);
    });
  });
});
