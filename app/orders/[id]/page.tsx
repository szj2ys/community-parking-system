"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Order, OrderStatus } from "@/types";
import { PaymentButton } from "@/components/PaymentButton";

// Constants
const PAYMENT_TIMEOUT_MINUTES = 30;

interface OrderDetailResponse {
  success: boolean;
  data?: Order;
  error?: string;
  message?: string;
}

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.id as string;

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState<string>("");
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  // Fetch order details
  const fetchOrder = useCallback(async () => {
    try {
      const response = await fetch(`/api/orders/${orderId}`);
      const data: OrderDetailResponse = await response.json();

      if (data.success && data.data) {
        setOrder(data.data);
      } else {
        setError(data.message || "订单不存在");
      }
    } catch (err) {
      setError("获取订单信息失败");
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  // Initial fetch
  useEffect(() => {
    fetchOrder();
  }, [fetchOrder]);

  // Calculate countdown timer
  useEffect(() => {
    if (!order || order.status !== "PENDING") {
      setCountdown("");
      return;
    }

    const calculateTimeLeft = () => {
      const createdAt = new Date(order.createdAt).getTime();
      const deadline = createdAt + PAYMENT_TIMEOUT_MINUTES * 60 * 1000;
      const now = Date.now();
      const diff = deadline - now;

      if (diff <= 0) {
        setCountdown("已过期");
        return;
      }

      const minutes = Math.floor(diff / 60000);
      const seconds = Math.floor((diff % 60000) / 1000);
      setCountdown(`${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`);
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, [order]);

  // Handle payment success
  const handlePaymentSuccess = useCallback(() => {
    setPaymentSuccess(true);
    // Refresh order status after successful payment
    setTimeout(() => {
      fetchOrder();
    }, 1000);
  }, [fetchOrder]);

  // Get status badge style
  const getStatusBadge = (status: OrderStatus) => {
    const styles: Record<OrderStatus, string> = {
      PENDING: "bg-yellow-100 text-yellow-700",
      CONFIRMED: "bg-green-100 text-green-700",
      IN_PROGRESS: "bg-blue-100 text-blue-700",
      COMPLETED: "bg-gray-100 text-gray-700",
      CANCELLED: "bg-red-100 text-red-700",
      REJECTED: "bg-red-100 text-red-700",
    };

    const labels: Record<OrderStatus, string> = {
      PENDING: "待支付",
      CONFIRMED: "已确认",
      IN_PROGRESS: "进行中",
      COMPLETED: "已完成",
      CANCELLED: "已取消",
      REJECTED: "已拒绝",
    };

    return (
      <span className={`px-3 py-1 rounded-full text-sm font-medium ${styles[status]}`}>
        {labels[status]}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">加载中...</div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500">{error || "订单不存在"}</p>
          <Link href="/orders" className="text-blue-600 hover:underline mt-4 block">
            返回订单列表
          </Link>
        </div>
      </div>
    );
  }

  const isExpired = countdown === "已过期";
  const canPay = order.status === "PENDING" && !isExpired;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link href="/orders" className="text-gray-600 hover:text-gray-900">
            ← 返回
          </Link>
          <h1 className="text-xl font-bold">订单详情</h1>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8">
        {/* Success message */}
        {paymentSuccess && (
          <div className="mb-6 p-4 bg-green-100 border border-green-300 rounded-lg">
            <p className="text-green-800 font-medium text-center">
              支付成功！订单已确认
            </p>
          </div>
        )}

        {/* Order status card */}
        <div className="bg-white rounded-xl shadow p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <span className="text-gray-500 text-sm">订单状态</span>
            {getStatusBadge(order.status)}
          </div>

          <div className="border-t border-gray-100 pt-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">订单编号</span>
              <span className="font-medium">{order.id.slice(-8).toUpperCase()}</span>
            </div>
            <div className="flex justify-between items-center mt-2">
              <span className="text-gray-600">创建时间</span>
              <span className="text-gray-500">
                {new Date(order.createdAt).toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* Parking spot info */}
        <div className="bg-white rounded-xl shadow p-6 mb-6">
          <h2 className="font-semibold text-lg mb-4">车位信息</h2>
          <div className="flex justify-between items-start">
            <div>
              <h3 className="font-medium">{order.spot?.title}</h3>
              <p className="text-gray-500 text-sm mt-1">{order.spot?.address}</p>
            </div>
            <div className="text-right">
              <div className="text-xl font-bold text-blue-600">
                ¥{order.totalPrice}
              </div>
              <div className="text-xs text-gray-400">总计</div>
            </div>
          </div>
        </div>

        {/* Booking details */}
        <div className="bg-white rounded-xl shadow p-6 mb-6">
          <h2 className="font-semibold text-lg mb-4">预订信息</h2>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">开始时间</span>
              <span>{new Date(order.startTime).toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">结束时间</span>
              <span>{new Date(order.endTime).toLocaleString()}</span>
            </div>
            {order.note && (
              <div className="flex justify-between">
                <span className="text-gray-600">备注</span>
                <span className="text-gray-500">{order.note}</span>
              </div>
            )}
          </div>
        </div>

        {/* Payment section - only for PENDING orders */}
        {canPay && (
          <div className="bg-white rounded-xl shadow p-6 mb-6">
            <h2 className="font-semibold text-lg mb-4">支付</h2>

            <div className="mb-6">
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-600">待支付金额</span>
                <span className="text-2xl font-bold text-blue-600">
                  ¥{order.totalPrice}
                </span>
              </div>

              {/* Payment countdown */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <span className="text-yellow-800 text-sm">支付倒计时</span>
                  <span className="text-yellow-800 font-mono font-bold text-lg">
                    {countdown}
                  </span>
                </div>
                <p className="text-yellow-600 text-xs mt-1">
                  请在 {PAYMENT_TIMEOUT_MINUTES} 分钟内完成支付，超时订单将自动取消
                </p>
              </div>
            </div>

            <PaymentButton
              orderId={order.id}
              amount={Number(order.totalPrice)}
              onSuccess={handlePaymentSuccess}
              onError={(error) => console.error("Payment error:", error)}
              className="w-full"
              disabled={isExpired}
            />
          </div>
        )}

        {/* Expired message */}
        {order.status === "PENDING" && isExpired && (
          <div className="bg-white rounded-xl shadow p-6 mb-6">
            <div className="text-center">
              <div className="text-4xl mb-2">⏰</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">订单已过期</h3>
              <p className="text-gray-500 text-sm mb-4">
                该订单已超过支付时限，请重新预订
              </p>
              <Link
                href="/tenant/map"
                className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                重新搜索车位
              </Link>
            </div>
          </div>
        )}

        {/* Confirmed order actions */}
        {order.status === "CONFIRMED" && (
          <div className="bg-white rounded-xl shadow p-6">
            <div className="text-center">
              <div className="text-4xl mb-2">✅</div>
              <h3 className="text-lg font-medium text-green-800 mb-2">订单已确认</h3>
              <p className="text-gray-500 text-sm mb-4">
                支付成功，订单已确认。请按时使用车位。
              </p>
              <Link
                href="/orders"
                className="inline-block px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
              >
                查看我的订单
              </Link>
            </div>
          </div>
        )}

        {/* Cancelled/Rejected order */}
        {(order.status === "CANCELLED" || order.status === "REJECTED") && (
          <div className="bg-white rounded-xl shadow p-6">
            <div className="text-center">
              <div className="text-4xl mb-2">
                {order.status === "CANCELLED" ? "❌" : "🚫"}
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {order.status === "CANCELLED" ? "订单已取消" : "订单已拒绝"}
              </h3>
              <p className="text-gray-500 text-sm mb-4">
                {order.status === "CANCELLED"
                  ? "该订单已被取消"
                  : "业主拒绝了该订单"}
              </p>
              <Link
                href="/tenant/map"
                className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                搜索其他车位
              </Link>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
