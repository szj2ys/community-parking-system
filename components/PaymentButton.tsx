"use client";

import { useState, useCallback } from "react";

export interface PaymentButtonProps {
  /** Order ID to pay for */
  orderId: string;
  /** Order amount in yuan */
  amount: number;
  /** Callback when payment is successful */
  onSuccess?: () => void;
  /** Callback when payment fails */
  onError?: (error: Error) => void;
  /** Callback when user cancels payment */
  onCancel?: () => void;
  /** Additional CSS classes */
  className?: string;
  /** Whether the button is disabled */
  disabled?: boolean;
}

interface WeChatPaymentParams {
  appId: string;
  timeStamp: string;
  nonceStr: string;
  package: string;
  signType: string;
  paySign: string;
}

interface PaymentResponse {
  success: boolean;
  data?: {
    paymentParams: WeChatPaymentParams;
    orderId: string;
    amount: number;
    isMock?: boolean;
  };
  error?: string;
  message?: string;
}

/**
 * PaymentButton component
 *
 * This component handles WeChat Pay JSAPI integration for the frontend.
 * It initiates the payment flow by calling the backend API to get payment
 * parameters, then invokes the WeChat JSAPI to complete payment.
 */
export function PaymentButton({
  orderId,
  amount,
  onSuccess,
  onError,
  onCancel,
  className = "",
  disabled = false,
}: PaymentButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Check if WeChat JSAPI is available
   */
  const isWeChatEnv = useCallback((): boolean => {
    if (typeof window === "undefined") return false;
    return typeof (window as any).WeixinJSBridge !== "undefined";
  }, []);

  /**
   * Invoke WeChat payment JSAPI
   */
  const invokeWeChatPay = useCallback(
    (params: WeChatPaymentParams): Promise<void> => {
      return new Promise((resolve, reject) => {
        if (!isWeChatEnv()) {
          // Not in WeChat environment - simulate success for testing
          console.log("[PaymentButton] Not in WeChat environment, simulating payment");
          // Simulate payment delay
          setTimeout(() => {
            resolve();
          }, 1500);
          return;
        }

        (window as any).WeixinJSBridge.invoke(
          "getBrandWCPayRequest",
          {
            appId: params.appId,
            timeStamp: params.timeStamp,
            nonceStr: params.nonceStr,
            package: params.package,
            signType: params.signType,
            paySign: params.paySign,
          },
          (res: { err_msg: string }) => {
            if (res.err_msg === "get_brand_wcpay_request:ok") {
              resolve();
            } else if (res.err_msg === "get_brand_wcpay_request:cancel") {
              reject(new Error("用户取消支付"));
            } else {
              reject(new Error(`支付失败: ${res.err_msg}`));
            }
          }
        );
      });
    },
    [isWeChatEnv]
  );

  /**
   * Handle payment button click
   */
  const handlePayment = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // 1. Call backend API to get payment parameters
      const response = await fetch(`/api/orders/${orderId}/payment`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data: PaymentResponse = await response.json();

      if (!data.success || !data.data) {
        throw new Error(data.message || "获取支付参数失败");
      }

      const { paymentParams, isMock } = data.data;

      if (isMock) {
        console.log("[PaymentButton] Using mock payment");
      }

      // 2. Invoke WeChat Pay JSAPI
      await invokeWeChatPay(paymentParams);

      // 3. Payment successful
      onSuccess?.();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "支付失败";

      if (errorMessage.includes("取消")) {
        onCancel?.();
      } else {
        setError(errorMessage);
        onError?.(err as Error);
      }
    } finally {
      setLoading(false);
    }
  }, [orderId, invokeWeChatPay, onSuccess, onError, onCancel]);

  const buttonClassName = `
    relative inline-flex items-center justify-center
    px-6 py-3
    bg-green-600 hover:bg-green-700
    text-white font-medium
    rounded-lg
    transition-colors duration-200
    disabled:opacity-50 disabled:cursor-not-allowed
    ${className}
  `.trim();

  return (
    <div className="flex flex-col items-center gap-2">
      <button
        onClick={handlePayment}
        disabled={disabled || loading}
        className={buttonClassName}
        aria-label={`支付 ¥${amount}`}
      >
        {loading ? (
          <>
            <svg
              className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            支付中...
          </>
        ) : (
          <>
            <svg
              className="w-5 h-5 mr-2"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" />
            </svg>
            微信支付 ¥{amount}
          </>
        )}
      </button>

      {error && (
        <p className="text-red-500 text-sm" role="alert">
          {error}
        </p>
      )}

      {!isWeChatEnv() && !error && (
        <p className="text-amber-600 text-xs">
          非微信环境 - 将模拟支付流程
        </p>
      )}
    </div>
  );
}

export default PaymentButton;
