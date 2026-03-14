import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { POST } from './route';
import { prisma } from '@/lib/prisma';
import { verifyWebhookSignature, decryptNotification, getWeChatPayConfig } from '@/lib/payment';

// Mock dependencies
vi.mock('@/lib/payment', () => ({
  verifyWebhookSignature: vi.fn(),
  decryptNotification: vi.fn(),
  getWeChatPayConfig: vi.fn(() => ({
    apiKey: 'test_api_key',
    appId: 'wx_test_app',
    mchId: '1234567890',
    notifyUrl: 'https://test.app/api/webhooks/wechat-pay',
  })),
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    order: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  },
}));

describe('POST /api/webhooks/wechat-pay', () => {
  const mockOrder = {
    id: 'order_123',
    tenantId: 'user_123',
    status: 'PENDING',
    totalPrice: 50.00,
    spot: {
      id: 'spot_123',
      title: 'Test Parking Spot',
      address: 'Test Address',
      owner: {
        id: 'owner_123',
        name: 'Owner Name',
        phone: '13800138000',
      },
    },
    tenant: {
      id: 'user_123',
      name: 'Tenant Name',
      phone: '13900139000',
    },
  };

  const mockDecryptedData = {
    out_trade_no: 'order_123',
    transaction_id: 'wx_transaction_123',
    trade_state: 'SUCCESS',
    amount: { total: 5000 }, // 50.00 yuan in cents
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should return 400 when required headers are missing', async () => {
    const request = new Request('http://localhost/api/webhooks/wechat-pay', {
      method: 'POST',
      body: '{}',
    });

    const response = await POST(request as any);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toBe('MISSING_HEADERS');
  });

  it('should return 401 when signature is invalid', async () => {
    (verifyWebhookSignature as any).mockResolvedValue(false);

    const request = new Request('http://localhost/api/webhooks/wechat-pay', {
      method: 'POST',
      headers: {
        'Wechatpay-Signature': 'invalid_signature',
        'Wechatpay-Timestamp': '1600000000',
        'Wechatpay-Nonce': 'test_nonce',
      },
      body: '{}',
    });

    const response = await POST(request as any);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.success).toBe(false);
    expect(data.error).toBe('INVALID_SIGNATURE');
  });

  it('should return 400 when request body is invalid JSON', async () => {
    (verifyWebhookSignature as any).mockResolvedValue(true);

    const request = new Request('http://localhost/api/webhooks/wechat-pay', {
      method: 'POST',
      headers: {
        'Wechatpay-Signature': 'valid_signature',
        'Wechatpay-Timestamp': '1600000000',
        'Wechatpay-Nonce': 'test_nonce',
      },
      body: 'not valid json',
    });

    const response = await POST(request as any);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toBe('INVALID_BODY');
  });

  it('should acknowledge non-success events without processing', async () => {
    (verifyWebhookSignature as any).mockResolvedValue(true);

    const request = new Request('http://localhost/api/webhooks/wechat-pay', {
      method: 'POST',
      headers: {
        'Wechatpay-Signature': 'valid_signature',
        'Wechatpay-Timestamp': '1600000000',
        'Wechatpay-Nonce': 'test_nonce',
      },
      body: JSON.stringify({
        id: 'notification_123',
        create_time: '2024-01-01T00:00:00Z',
        event_type: 'TRANSACTION.REFUND', // Not a success event
        resource: {
          algorithm: 'AEAD_AES_256_GCM',
          ciphertext: 'encrypted_data',
          associated_data: 'test',
          nonce: 'test_nonce',
        },
      }),
    });

    const response = await POST(request as any);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.message).toContain('acknowledged');
  });

  it('should return 404 when order does not exist', async () => {
    (verifyWebhookSignature as any).mockResolvedValue(true);
    (decryptNotification as any).mockResolvedValue(mockDecryptedData);
    (prisma.order.findUnique as any).mockResolvedValue(null);

    const request = new Request('http://localhost/api/webhooks/wechat-pay', {
      method: 'POST',
      headers: {
        'Wechatpay-Signature': 'valid_signature',
        'Wechatpay-Timestamp': '1600000000',
        'Wechatpay-Nonce': 'test_nonce',
      },
      body: JSON.stringify({
        id: 'notification_123',
        create_time: '2024-01-01T00:00:00Z',
        event_type: 'TRANSACTION.SUCCESS',
        resource: {
          algorithm: 'AEAD_AES_256_GCM',
          ciphertext: 'encrypted_data',
          associated_data: 'test',
          nonce: 'test_nonce',
        },
      }),
    });

    const response = await POST(request as any);
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.success).toBe(false);
    expect(data.error).toBe('ORDER_NOT_FOUND');
  });

  it('should acknowledge already processed orders (idempotency)', async () => {
    (verifyWebhookSignature as any).mockResolvedValue(true);
    (decryptNotification as any).mockResolvedValue(mockDecryptedData);
    (prisma.order.findUnique as any).mockResolvedValue({
      ...mockOrder,
      status: 'CONFIRMED', // Already confirmed
    });

    const request = new Request('http://localhost/api/webhooks/wechat-pay', {
      method: 'POST',
      headers: {
        'Wechatpay-Signature': 'valid_signature',
        'Wechatpay-Timestamp': '1600000000',
        'Wechatpay-Nonce': 'test_nonce',
      },
      body: JSON.stringify({
        id: 'notification_123',
        create_time: '2024-01-01T00:00:00Z',
        event_type: 'TRANSACTION.SUCCESS',
        resource: {
          algorithm: 'AEAD_AES_256_GCM',
          ciphertext: 'encrypted_data',
          associated_data: 'test',
          nonce: 'test_nonce',
        },
      }),
    });

    const response = await POST(request as any);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.message).toContain('already processed');
  });

  it('should return 400 when order status is not PENDING', async () => {
    (verifyWebhookSignature as any).mockResolvedValue(true);
    (decryptNotification as any).mockResolvedValue(mockDecryptedData);
    (prisma.order.findUnique as any).mockResolvedValue({
      ...mockOrder,
      status: 'CANCELLED',
    });

    const request = new Request('http://localhost/api/webhooks/wechat-pay', {
      method: 'POST',
      headers: {
        'Wechatpay-Signature': 'valid_signature',
        'Wechatpay-Timestamp': '1600000000',
        'Wechatpay-Nonce': 'test_nonce',
      },
      body: JSON.stringify({
        id: 'notification_123',
        create_time: '2024-01-01T00:00:00Z',
        event_type: 'TRANSACTION.SUCCESS',
        resource: {
          algorithm: 'AEAD_AES_256_GCM',
          ciphertext: 'encrypted_data',
          associated_data: 'test',
          nonce: 'test_nonce',
        },
      }),
    });

    const response = await POST(request as any);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toBe('INVALID_ORDER_STATUS');
  });

  it('should update order status on successful payment callback', async () => {
    (verifyWebhookSignature as any).mockResolvedValue(true);
    (decryptNotification as any).mockResolvedValue(mockDecryptedData);
    (prisma.order.findUnique as any).mockResolvedValue(mockOrder);
    (prisma.order.update as any).mockResolvedValue({
      ...mockOrder,
      status: 'CONFIRMED',
    });

    const request = new Request('http://localhost/api/webhooks/wechat-pay', {
      method: 'POST',
      headers: {
        'Wechatpay-Signature': 'valid_signature',
        'Wechatpay-Timestamp': '1600000000',
        'Wechatpay-Nonce': 'test_nonce',
      },
      body: JSON.stringify({
        id: 'notification_123',
        create_time: '2024-01-01T00:00:00Z',
        event_type: 'TRANSACTION.SUCCESS',
        resource: {
          algorithm: 'AEAD_AES_256_GCM',
          ciphertext: 'encrypted_data',
          associated_data: 'test',
          nonce: 'test_nonce',
        },
      }),
    });

    const response = await POST(request as any);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.orderId).toBe('order_123');
    expect(data.data.status).toBe('CONFIRMED');
    expect(data.data.transactionId).toBe('wx_transaction_123');
    expect(data.data.amount).toBe(50);

    // Verify order was updated
    expect(prisma.order.update).toHaveBeenCalledWith({
      where: { id: 'order_123' },
      data: { status: 'CONFIRMED' },
      include: {
        spot: { select: { id: true, title: true, address: true } },
        tenant: { select: { id: true, name: true } },
      },
    });
  });

  it('should handle payment amount mismatch gracefully', async () => {
    (verifyWebhookSignature as any).mockResolvedValue(true);
    (decryptNotification as any).mockResolvedValue({
      ...mockDecryptedData,
      amount: { total: 6000 }, // Different amount (60.00 instead of 50.00)
    });
    (prisma.order.findUnique as any).mockResolvedValue(mockOrder);
    (prisma.order.update as any).mockResolvedValue({
      ...mockOrder,
      status: 'CONFIRMED',
    });

    const request = new Request('http://localhost/api/webhooks/wechat-pay', {
      method: 'POST',
      headers: {
        'Wechatpay-Signature': 'valid_signature',
        'Wechatpay-Timestamp': '1600000000',
        'Wechatpay-Nonce': 'test_nonce',
      },
      body: JSON.stringify({
        id: 'notification_123',
        create_time: '2024-01-01T00:00:00Z',
        event_type: 'TRANSACTION.SUCCESS',
        resource: {
          algorithm: 'AEAD_AES_256_GCM',
          ciphertext: 'encrypted_data',
          associated_data: 'test',
          nonce: 'test_nonce',
        },
      }),
    });

    const response = await POST(request as any);
    const data = await response.json();

    // Should still succeed but with warning logged
    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.amount).toBe(60); // Returns actual paid amount
  });

  it('should return success for non-SUCCESS trade state', async () => {
    (verifyWebhookSignature as any).mockResolvedValue(true);
    (decryptNotification as any).mockResolvedValue({
      ...mockDecryptedData,
      trade_state: 'PAYERROR', // Payment error
    });

    const request = new Request('http://localhost/api/webhooks/wechat-pay', {
      method: 'POST',
      headers: {
        'Wechatpay-Signature': 'valid_signature',
        'Wechatpay-Timestamp': '1600000000',
        'Wechatpay-Nonce': 'test_nonce',
      },
      body: JSON.stringify({
        id: 'notification_123',
        create_time: '2024-01-01T00:00:00Z',
        event_type: 'TRANSACTION.SUCCESS',
        resource: {
          algorithm: 'AEAD_AES_256_GCM',
          ciphertext: 'encrypted_data',
          associated_data: 'test',
          nonce: 'test_nonce',
        },
      }),
    });

    const response = await POST(request as any);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.message).toContain('not successful');
  });
});
