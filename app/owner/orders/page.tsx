"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Order, OrderStatus } from "@/types";

export default function OwnerOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<OrderStatus | "ALL">("ALL");

  useEffect(() => {
    fetchOrders();
  }, [filter]);

  const fetchOrders = async () => {
    try {
      let url = "/api/orders";
      if (filter !== "ALL") {
        url += `?status=${filter}`;
      }

      const res = await fetch(url);
      const data = await res.json();

      if (data.success) {
        setOrders(data.data);
      }
    } catch (err) {
      console.error("获取订单失败:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (orderId: string, action: string) => {
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });

      if (res.ok) {
        fetchOrders();
      }
    } catch (err) {
      console.error("操作失败:", err);
    }
  };

  const getStatusBadge = (status: OrderStatus) => {
    const styles = {
      PENDING: "bg-yellow-100 text-yellow-700",
      CONFIRMED: "bg-green-100 text-green-700",
      IN_PROGRESS: "bg-blue-100 text-blue-700",
      COMPLETED: "bg-gray-100 text-gray-700",
      CANCELLED: "bg-red-100 text-red-700",
      REJECTED: "bg-red-100 text-red-700",
    };
    const labels = {
      PENDING: "待确认",
      CONFIRMED: "已确认",
      IN_PROGRESS: "进行中",
      COMPLETED: "已完成",
      CANCELLED: "已取消",
      REJECTED: "已拒绝",
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs ${styles[status]}`}>
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

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link href="/" className="text-gray-600 hover:text-gray-900">
            ← 返回
          </Link>
          <h1 className="text-xl font-bold">预订管理</h1>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* 筛选器 */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {[
            { key: "ALL", label: "全部" },
            { key: "PENDING", label: "待确认" },
            { key: "CONFIRMED", label: "已确认" },
            { key: "COMPLETED", label: "已完成" },
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setFilter(key as OrderStatus | "ALL")}
              className={`px-4 py-2 rounded-lg text-sm ${
                filter === key
                  ? "bg-blue-600 text-white"
                  : "bg-white text-gray-700 hover:bg-gray-100"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* 订单列表 */}
        <div className="space-y-4">
          {orders.map((order: Order & { spot?: { title?: string | null; address?: string | null }; tenant?: { name?: string | null; phone?: string | null } }) => (
            <div
              key={order.id}
              className="bg-white rounded-xl shadow p-6"
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold">{order.spot?.title}</h3>
                    {getStatusBadge(order.status)}
                  </div>
                  <p className="text-gray-500 text-sm mt-1">
                    {order.spot?.address}
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-xl font-bold text-blue-600">
                    ¥{order.totalPrice}
                  </div>
                  <div className="text-xs text-gray-400">
                    {new Date(order.startTime).toLocaleDateString()}
                  </div>
                </div>
              </div>

              <div className="text-sm text-gray-600 mb-4 space-y-1">
                <div>
                  时间: {new Date(order.startTime).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })} - {new Date(order.endTime).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
                <div>
                  租户: {order.tenant?.name || "未知"} ({order.tenant?.phone || "-"})
                </div>
                {order.note && <div>备注: {order.note}</div>}
              </div>

              {/* 操作按钮 */}
              <div className="flex gap-2">
                {order.status === "PENDING" && (
                  <>
                    <button
                      onClick={() => handleAction(order.id, "confirm")}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
                    >
                      确认预订
                    </button>
                    <button
                      onClick={() => handleAction(order.id, "reject")}
                      className="px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 text-sm"
                    >
                      拒绝
                    </button>
                  </>
                )}
                {order.status === "CONFIRMED" && (
                  <button
                    onClick={() => handleAction(order.id, "complete")}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                  >
                    标记完成
                  </button>
                )}
              </div>
            </div>
          ))}

          {orders.length === 0 && (
            <div className="text-center py-12">
              <div className="text-4xl mb-4">📋</div>
              <h3 className="text-lg font-medium text-gray-900">暂无预订</h3>
              <p className="text-gray-500 mt-2">发布车位后等待租户预订</p>
              <Link
                href="/owner/publish"
                className="inline-block mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                发布车位
              </Link>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
