import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { POST } from './route';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

// Mock dependencies
vi.mock('@/lib/auth', () => ({
  auth: vi.fn(),
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    order: {
      findUnique: vi.fn(),
    },
  },
}));

vi.mock('@/lib/payment', () => ({
  createUnifiedOrder: vi.fn(),
  generateTimestamp: vi.fn(() => '1600000000'),
  generateNonceStr: vi.fn(() => 'test_nonce_string'),
  generatePaySign: vi.fn(() => 'mock_pay_sign'),
  getWeChatPayConfig: vi.fn(() => ({
    appId: 'wx_test_app',
    apiKey: 'test_key',
  })),
}));

describe('POST /api/orders/[id]/payment', () => {
  const mockOrder = {
    id: 'order_123',
    tenantId: 'user_123',
    status: 'PENDING',
    totalPrice: 50.00,
    createdAt: new Date().toISOString(),
    spot: {
      id: 'spot_123',
      title: 'Test Parking Spot',
      owner: {
        id: 'owner_123',
        name: 'Owner Name',
        wxOpenid: 'owner_openid',
      },
    },
    tenant: {
      id: 'user_123',
      name: 'Tenant Name',
      wxOpenid: 'tenant_openid',
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should return 401 when user is not authenticated', async () => {
    (auth as any).mockResolvedValue(null);

    const request = new Request('http://localhost/api/orders/order_123/payment', {
      method: 'POST',
    });

    const response = await POST(request as any, { params: Promise.resolve({ id: 'order_123' }) });
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.success).toBe(false);
    expect(data.error).toBe('UNAUTHORIZED');
  });

  it('should return 404 when order does not exist', async () => {
    (auth as any).mockResolvedValue({ user: { id: 'user_123' } });
    (prisma.order.findUnique as any).mockResolvedValue(null);

    const request = new Request('http://localhost/api/orders/nonexistent/payment', {
      method: 'POST',
    });

    const response = await POST(request as any, { params: Promise.resolve({ id: 'nonexistent' }) });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.success).toBe(false);
    expect(data.error).toBe('NOT_FOUND');
  });

  it('should return 403 when user is not the tenant', async () => {
    (auth as any).mockResolvedValue({ user: { id: 'other_user' } });
    (prisma.order.findUnique as any).mockResolvedValue({
      ...mockOrder,
      tenantId: 'user_123', // Different from authenticated user
    });

    const request = new Request('http://localhost/api/orders/order_123/payment', {
      method: 'POST',
    });

    const response = await POST(request as any, { params: Promise.resolve({ id: 'order_123' }) });
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.success).toBe(false);
    expect(data.error).toBe('FORBIDDEN');
  });

  it('should return 400 when order status is not PENDING', async () => {
    (auth as any).mockResolvedValue({ user: { id: 'user_123' } });
    (prisma.order.findUnique as any).mockResolvedValue({
      ...mockOrder,
      status: 'CONFIRMED',
    });

    const request = new Request('http://localhost/api/orders/order_123/payment', {
      method: 'POST',
    });

    const response = await POST(request as any, { params: Promise.resolve({ id: 'order_123' }) });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toBe('INVALID_STATUS');
  });

  it('should return 400 when order is expired', async () => {
    (auth as any).mockResolvedValue({ user: { id: 'user_123' } });
    (prisma.order.findUnique as any).mockResolvedValue({
      ...mockOrder,
      createdAt: new Date(Date.now() - 31 * 60 * 1000).toISOString(), // 31 minutes ago
    });

    const request = new Request('http://localhost/api/orders/order_123/payment', {
      method: 'POST',
    });

    const response = await POST(request as any, { params: Promise.resolve({ id: 'order_123' }) });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toBe('ORDER_EXPIRED');
  });

  it('should return payment params for valid pending order', async () => {
    const { createUnifiedOrder } = await import('@/lib/payment');

    (auth as any).mockResolvedValue({ user: { id: 'user_123' } });
    (prisma.order.findUnique as any).mockResolvedValue(mockOrder);
    (createUnifiedOrder as any).mockResolvedValue({
      prepayId: 'wx_prepay_123',
      paymentParams: {
        appId: 'wx_test_app',
        timeStamp: '1600000000',
        nonceStr: 'test_nonce',
        package: 'prepay_id=wx_prepay_123',
        signType: 'RSA',
        paySign: 'test_sign',
      },
    });

    const request = new Request('http://localhost/api/orders/order_123/payment', {
      method: 'POST',
    });

    const response = await POST(request as any, { params: Promise.resolve({ id: 'order_123' }) });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data).toBeDefined();
    expect(data.data.paymentParams).toBeDefined();
    expect(data.data.paymentParams.appId).toBe('wx_test_app');
    expect(data.data.orderId).toBe('order_123');
    expect(data.data.amount).toBe(50.00);
  });

  it('should include correct payment parameters in response', async () => {
    const { createUnifiedOrder } = await import('@/lib/payment');

    (auth as any).mockResolvedValue({ user: { id: 'user_123' } });
    (prisma.order.findUnique as any).mockResolvedValue(mockOrder);
    (createUnifiedOrder as any).mockResolvedValue({
      prepayId: 'wx_prepay_123',
      paymentParams: {
        appId: 'wx_test_app',
        timeStamp: '1600000000',
        nonceStr: 'test_nonce',
        package: 'prepay_id=wx_prepay_123',
        signType: 'RSA',
        paySign: 'test_sign',
      },
    });

    const request = new Request('http://localhost/api/orders/order_123/payment', {
      method: 'POST',
    });

    const response = await POST(request as any, { params: Promise.resolve({ id: 'order_123' }) });
    const data = await response.json();

    expect(data.success).toBe(true);
    expect(data.data.paymentParams).toHaveProperty('appId');
    expect(data.data.paymentParams).toHaveProperty('timeStamp');
    expect(data.data.paymentParams).toHaveProperty('nonceStr');
    expect(data.data.paymentParams).toHaveProperty('package');
    expect(data.data.paymentParams).toHaveProperty('signType');
    expect(data.data.paymentParams).toHaveProperty('paySign');
  });

  it('should handle missing wxOpenid gracefully in development mode', async () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';

    (auth as any).mockResolvedValue({ user: { id: 'user_123' } });
    (prisma.order.findUnique as any).mockResolvedValue({
      ...mockOrder,
      tenant: {
        ...mockOrder.tenant,
        wxOpenid: null, // No WeChat OpenID
      },
    });

    const request = new Request('http://localhost/api/orders/order_123/payment', {
      method: 'POST',
    });

    const response = await POST(request as any, { params: Promise.resolve({ id: 'order_123' }) });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.isMock).toBe(true);
    expect(data.data.paymentParams).toBeDefined();

    process.env.NODE_ENV = originalEnv;
  });
});
