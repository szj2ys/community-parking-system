import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { PaymentButton } from './PaymentButton';

describe('PaymentButton', () => {
  const mockFetch = vi.fn();
  const mockOnSuccess = vi.fn();
  const mockOnError = vi.fn();
  const mockOnCancel = vi.fn();

  beforeEach(() => {
    global.fetch = mockFetch;
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    // Clean up WeixinJSBridge mock
    delete (global as any).WeixinJSBridge;
  });

  it('should render payment button with correct amount', () => {
    render(<PaymentButton orderId="order_123" amount={50} />);

    expect(screen.getByText('微信支付 ¥50')).toBeInTheDocument();
  });

  it('should be disabled when disabled prop is true', () => {
    render(<PaymentButton orderId="order_123" amount={50} disabled />);

    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('should invoke WeChat payment when clicked', async () => {
    mockFetch.mockResolvedValueOnce({
      json: () => Promise.resolve({
        success: true,
        data: {
          paymentParams: {
            appId: 'wx_test_app',
            timeStamp: '1600000000',
            nonceStr: 'test_nonce',
            package: 'prepay_id=test_prepay',
            signType: 'RSA',
            paySign: 'test_sign',
          },
          orderId: 'order_123',
          amount: 50,
        },
      }),
    });

    render(<PaymentButton orderId="order_123" amount={50} onSuccess={mockOnSuccess} />);

    await act(async () => {
      const button = screen.getByRole('button');
      fireEvent.click(button);
    });

    // Should show loading state
    expect(screen.getByText('支付中...')).toBeInTheDocument();

    // Wait for async operations
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/orders/order_123/payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
    });

    // Wait for success callback
    await waitFor(() => {
      expect(mockOnSuccess).toHaveBeenCalled();
    }, { timeout: 3000 });
  });

  it('should call onSuccess callback when payment succeeds', async () => {
    mockFetch.mockResolvedValueOnce({
      json: () => Promise.resolve({
        success: true,
        data: {
          paymentParams: {
            appId: 'wx_test_app',
            timeStamp: '1600000000',
            nonceStr: 'test_nonce',
            package: 'prepay_id=test_prepay',
            signType: 'RSA',
            paySign: 'test_sign',
          },
          orderId: 'order_123',
          amount: 50,
        },
      }),
    });

    render(<PaymentButton orderId="order_123" amount={50} onSuccess={mockOnSuccess} />);

    await act(async () => {
      fireEvent.click(screen.getByRole('button'));
    });

    await waitFor(() => {
      expect(mockOnSuccess).toHaveBeenCalledTimes(1);
    }, { timeout: 3000 });
  });

  it('should call onCancel callback when user cancels payment', async () => {
    // Mock WeChat environment
    const mockWeixinJSBridge = {
      invoke: vi.fn((apiName: string, params: unknown, callback: (res: { err_msg: string }) => void) => {
        callback({ err_msg: 'get_brand_wcpay_request:cancel' });
      }),
    };
    (global as any).WeixinJSBridge = mockWeixinJSBridge;

    mockFetch.mockResolvedValueOnce({
      json: () => Promise.resolve({
        success: true,
        data: {
          paymentParams: {
            appId: 'wx_test_app',
            timeStamp: '1600000000',
            nonceStr: 'test_nonce',
            package: 'prepay_id=test_prepay',
            signType: 'RSA',
            paySign: 'test_sign',
          },
          orderId: 'order_123',
          amount: 50,
        },
      }),
    });

    render(<PaymentButton orderId="order_123" amount={50} onCancel={mockOnCancel} />);

    await act(async () => {
      fireEvent.click(screen.getByRole('button'));
    });

    await waitFor(() => {
      expect(mockOnCancel).toHaveBeenCalled();
    }, { timeout: 3000 });
  });

  it('should call onError callback when payment fails', async () => {
    // Mock WeChat environment with error
    const mockWeixinJSBridge = {
      invoke: vi.fn((apiName: string, params: unknown, callback: (res: { err_msg: string }) => void) => {
        callback({ err_msg: 'get_brand_wcpay_request:fail' });
      }),
    };
    (global as any).WeixinJSBridge = mockWeixinJSBridge;

    mockFetch.mockResolvedValueOnce({
      json: () => Promise.resolve({
        success: true,
        data: {
          paymentParams: {
            appId: 'wx_test_app',
            timeStamp: '1600000000',
            nonceStr: 'test_nonce',
            package: 'prepay_id=test_prepay',
            signType: 'RSA',
            paySign: 'test_sign',
          },
          orderId: 'order_123',
          amount: 50,
        },
      }),
    });

    render(<PaymentButton orderId="order_123" amount={50} onError={mockOnError} />);

    await act(async () => {
      fireEvent.click(screen.getByRole('button'));
    });

    await waitFor(() => {
      expect(mockOnError).toHaveBeenCalled();
      expect(screen.getByRole('alert')).toHaveTextContent('支付失败');
    }, { timeout: 3000 });
  });

  it('should display error message when API fails', async () => {
    mockFetch.mockResolvedValueOnce({
      json: () => Promise.resolve({
        success: false,
        message: '订单已过期',
      }),
    });

    render(<PaymentButton orderId="order_123" amount={50} />);

    await act(async () => {
      fireEvent.click(screen.getByRole('button'));
    });

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('订单已过期');
    }, { timeout: 3000 });
  });

  it('should apply custom className', () => {
    render(<PaymentButton orderId="order_123" amount={50} className="custom-class" />);

    expect(screen.getByRole('button')).toHaveClass('custom-class');
  });

  it('should show loading spinner while processing', async () => {
    mockFetch.mockResolvedValueOnce({
      json: () => Promise.resolve({
        success: true,
        data: {
          paymentParams: {
            appId: 'wx_test_app',
            timeStamp: '1600000000',
            nonceStr: 'test_nonce',
            package: 'prepay_id=test_prepay',
            signType: 'RSA',
            paySign: 'test_sign',
          },
          orderId: 'order_123',
          amount: 50,
        },
      }),
    });

    render(<PaymentButton orderId="order_123" amount={50} />);

    await act(async () => {
      fireEvent.click(screen.getByRole('button'));
    });

    expect(screen.getByText('支付中...')).toBeInTheDocument();

    // Check for spinner SVG
    const svg = document.querySelector('svg.animate-spin');
    expect(svg).toBeInTheDocument();
  });

  it('should show warning for non-WeChat environment', () => {
    // Ensure WeixinJSBridge is not defined
    delete (global as any).WeixinJSBridge;

    render(<PaymentButton orderId="order_123" amount={50} />);

    expect(screen.getByText('非微信环境 - 将模拟支付流程')).toBeInTheDocument();
  });

  it('should handle network errors gracefully', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'));

    render(<PaymentButton orderId="order_123" amount={50} onError={mockOnError} />);

    await act(async () => {
      fireEvent.click(screen.getByRole('button'));
    });

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Network error');
      expect(mockOnError).toHaveBeenCalled();
    }, { timeout: 3000 });
  });
});
