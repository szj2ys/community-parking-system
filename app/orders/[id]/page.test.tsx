import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import OrderDetailPage from './page';

// Mock dependencies
vi.mock('next/navigation', () => ({
  useParams: () => ({ id: 'order_123' }),
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

vi.mock('@/components/PaymentButton', () => ({
  PaymentButton: ({ orderId, amount, onSuccess, disabled }: {
    orderId: string;
    amount: number;
    onSuccess?: () => void;
    disabled?: boolean;
  }) => (
    <button
      data-testid="payment-button"
      data-order-id={orderId}
      data-amount={amount}
      disabled={disabled}
      onClick={() => onSuccess?.()}
    >
      支付 ¥{amount}
    </button>
  ),
}));

describe('OrderDetailPage', () => {
  const mockOrder = {
    id: 'order_123',
    spotId: 'spot_123',
    tenantId: 'user_123',
    status: 'PENDING',
    totalPrice: 50.00,
    startTime: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
    endTime: new Date(Date.now() + 90000000).toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    note: 'Test note',
    spot: {
      id: 'spot_123',
      title: 'Test Parking Spot',
      address: '123 Test St',
      pricePerHour: 10,
    },
  };

  beforeEach(() => {
    global.fetch = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should show loading state initially', () => {
    (fetch as any).mockImplementation(() => new Promise(() => {}));

    render(<OrderDetailPage />);

    expect(screen.getByText('加载中...')).toBeInTheDocument();
  });

  it('should display order details after loading', async () => {
    (fetch as any).mockResolvedValueOnce({
      json: () => Promise.resolve({ success: true, data: mockOrder }),
    });

    render(<OrderDetailPage />);

    await waitFor(() => {
      expect(screen.getByText('订单详情')).toBeInTheDocument();
    });

    expect(screen.getByText('Test Parking Spot')).toBeInTheDocument();
    expect(screen.getByText('123 Test St')).toBeInTheDocument();
    // Use getAllByText since price appears in two places
    expect(screen.getAllByText(/¥50/).length).toBeGreaterThanOrEqual(1);
  });

  it('should show payment button for pending orders', async () => {
    (fetch as any).mockResolvedValueOnce({
      json: () => Promise.resolve({ success: true, data: mockOrder }),
    });

    render(<OrderDetailPage />);

    await waitFor(() => {
      expect(screen.getByTestId('payment-button')).toBeInTheDocument();
    });
  });

  it('should not show payment button for non-pending orders', async () => {
    (fetch as any).mockResolvedValueOnce({
      json: () => Promise.resolve({
        success: true,
        data: { ...mockOrder, status: 'CONFIRMED' },
      }),
    });

    render(<OrderDetailPage />);

    await waitFor(() => {
      expect(screen.getByText('已确认')).toBeInTheDocument();
    });

    expect(screen.queryByTestId('payment-button')).not.toBeInTheDocument();
  });

  it('should show countdown timer for pending orders', async () => {
    (fetch as any).mockResolvedValueOnce({
      json: () => Promise.resolve({ success: true, data: mockOrder }),
    });

    render(<OrderDetailPage />);

    await waitFor(() => {
      expect(screen.getByText('支付倒计时')).toBeInTheDocument();
    });
  });

  it('should show expired message for expired orders', async () => {
    const expiredOrder = {
      ...mockOrder,
      createdAt: new Date(Date.now() - 31 * 60 * 1000).toISOString(), // 31 minutes ago
    };

    (fetch as any).mockResolvedValueOnce({
      json: () => Promise.resolve({ success: true, data: expiredOrder }),
    });

    render(<OrderDetailPage />);

    await waitFor(() => {
      expect(screen.getByText('订单已过期')).toBeInTheDocument();
    });

    expect(screen.getByText('该订单已超过支付时限，请重新预订')).toBeInTheDocument();
  });

  it('should refresh order status after successful payment', async () => {
    (fetch as any)
      .mockResolvedValueOnce({
        json: () => Promise.resolve({ success: true, data: mockOrder }),
      })
      .mockResolvedValueOnce({
        json: () => Promise.resolve({
          success: true,
          data: { ...mockOrder, status: 'CONFIRMED' },
        }),
      });

    render(<OrderDetailPage />);

    await waitFor(() => {
      expect(screen.getByTestId('payment-button')).toBeInTheDocument();
    });

    // Simulate payment success
    const paymentButton = screen.getByTestId('payment-button');
    fireEvent.click(paymentButton);

    // Wait for refresh
    await waitFor(() => {
      expect(screen.getByText('支付成功！订单已确认')).toBeInTheDocument();
    });
  });

  it('should show error message when order not found', async () => {
    (fetch as any).mockResolvedValueOnce({
      json: () => Promise.resolve({ success: false, message: '订单不存在' }),
    });

    render(<OrderDetailPage />);

    await waitFor(() => {
      expect(screen.getByText('订单不存在')).toBeInTheDocument();
    });
  });

  it('should show cancelled order message', async () => {
    (fetch as any).mockResolvedValueOnce({
      json: () => Promise.resolve({
        success: true,
        data: { ...mockOrder, status: 'CANCELLED' },
      }),
    });

    render(<OrderDetailPage />);

    await waitFor(() => {
      expect(screen.getByText('订单已取消')).toBeInTheDocument();
    });

    expect(screen.getByText('该订单已被取消')).toBeInTheDocument();
  });

  it('should show rejected order message', async () => {
    (fetch as any).mockResolvedValueOnce({
      json: () => Promise.resolve({
        success: true,
        data: { ...mockOrder, status: 'REJECTED' },
      }),
    });

    render(<OrderDetailPage />);

    await waitFor(() => {
      expect(screen.getByText('订单已拒绝')).toBeInTheDocument();
    });

    expect(screen.getByText('业主拒绝了该订单')).toBeInTheDocument();
  });

  it('should show confirmed order status', async () => {
    (fetch as any).mockResolvedValueOnce({
      json: () => Promise.resolve({
        success: true,
        data: { ...mockOrder, status: 'CONFIRMED' },
      }),
    });

    render(<OrderDetailPage />);

    await waitFor(() => {
      expect(screen.getByText('订单已确认')).toBeInTheDocument();
    });

    expect(screen.getByText('支付成功，订单已确认。请按时使用车位。')).toBeInTheDocument();
  });

  it('should display correct order information', async () => {
    (fetch as any).mockResolvedValueOnce({
      json: () => Promise.resolve({ success: true, data: mockOrder }),
    });

    render(<OrderDetailPage />);

    await waitFor(() => {
      expect(screen.getByText('订单详情')).toBeInTheDocument();
    });

    // Check order details
    expect(screen.getByText('订单编号')).toBeInTheDocument();
    expect(screen.getByText('车位信息')).toBeInTheDocument();
    expect(screen.getByText('预订信息')).toBeInTheDocument();
    expect(screen.getByText('Test note')).toBeInTheDocument();
  });
});
