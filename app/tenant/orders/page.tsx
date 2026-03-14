"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Order, OrderStatus } from "@/types";

export default function TenantOrdersPage() {
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

  const handleCancel = async (orderId: string) => {
    if (!confirm("确定要取消这个预订吗？")) return;

    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "cancel" }),
      });

      if (res.ok) {
        fetchOrders();
      }
    } catch (err) {
      console.error("取消失败:", err);
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
          <h1 className="text-xl font-bold">我的预订</h1>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* 筛选器 */}
        <div className="flex gap-2 mb-6">
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
          {orders.map((order: Order & { spot?: { title: string; address: string } }) => (
            <div
              key={order.id}
              className="bg-white rounded-xl shadow p-6"
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold">{order.spot?.title || "未知车位"}</h3>
                    {getStatusBadge(order.status)}
                  </div>
                  <p className="text-gray-500 text-sm mt-1">
                    {order.spot?.address || "-"}
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

              <div className="text-sm text-gray-600 mb-4">
                <div>
                  时间: {new Date(order.startTime).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })} - {new Date(order.endTime).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
                {order.note && <div className="mt-1">备注: {order.note}</div>}
              </div>

              {/* 操作按钮 */}
              <div className="flex gap-2 flex-wrap">
                {(order.status === "PENDING" || order.status === "CONFIRMED") && (
                  <button
                    onClick={() => handleCancel(order.id)}
                    className="px-4 py-2 text-red-600 hover:text-red-700 text-sm border border-red-200 rounded-lg hover:bg-red-50"
                  >
                    取消预订
                  </button>
                )}
                {/* 分享按钮 */}
                <button
                  onClick={() => {
                    const shareText = `我在社区车位租赁平台预订了「${order.spot?.title}」，¥${order.totalPrice}，推荐给你！`;
                    if (navigator.share) {
                      navigator.share({
                        title: "推荐车位",
                        text: shareText,
                        url: window.location.origin + "/tenant/list",
                      });
                    } else {
                      navigator.clipboard.writeText(shareText + " " + window.location.origin + "/tenant/list");
                      alert("分享文案已复制到剪贴板");
                    }
                  }}
                  className="px-4 py-2 text-blue-600 hover:text-blue-700 text-sm border border-blue-200 rounded-lg hover:bg-blue-50"
                >
                  分享给好友
                </button>
              </div>
            </div>
          ))}

          {orders.length === 0 && (
            <div className="text-center py-12">
              <div className="text-4xl mb-4">📋</div>
              <h3 className="text-lg font-medium text-gray-900">暂无预订</h3>
              <p className="text-gray-500 mt-2">去搜索车位并预订吧</p>
              <Link
                href="/tenant/list"
                className="inline-block mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                去找车位
              </Link>
            </div>
          )}
        </div>

        {/* 成为业主引导 */}
        {orders.length > 0 && (
          <div className="mt-8 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-gray-900">您也有闲置车位？</h3>
                <p className="text-sm text-gray-600 mt-1">发布车位，轻松赚取额外收益</p>
              </div>
              <Link
                href="/owner/publish"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
              >
                成为业主
              </Link>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
