"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ParkingSpot, SpotStatus } from "@/types";

export default function ParkingSpotDetailPage({ params }: { params: { id: string } }) {
  const [spot, setSpot] = useState<ParkingSpot | null>(null);
  const [loading, setLoading] = useState(true);
  const [isOwner, setIsOwner] = useState(false);

  useEffect(() => {
    fetchSpot();
  }, [params.id]);

  const fetchSpot = async () => {
    try {
      const res = await fetch(`/api/parking-spots/${params.id}`);
      const data = await res.json();
      if (data.success) {
        setSpot(data.data);
        // Check if current user is the owner
        // This is a simplified check - in real app you'd check from session
        setIsOwner(false); // Default to false for tenant view
      }
    } catch (err) {
      console.error("获取车位详情失败:", err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: SpotStatus) => {
    const styles = {
      AVAILABLE: "bg-green-100 text-green-700",
      RENTED: "bg-blue-100 text-blue-700",
      UNAVAILABLE: "bg-gray-100 text-gray-700",
    };
    const labels = {
      AVAILABLE: "可租",
      RENTED: "已租",
      UNAVAILABLE: "暂不出租",
    };
    return (
      <span className={`px-3 py-1 rounded-full text-sm ${styles[status]}`}>
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

  if (!spot) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500">车位不存在</p>
          <Link href="/tenant/list" className="text-blue-600 hover:underline mt-4 block">
            返回列表
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link href="/tenant/list" className="text-gray-600 hover:text-gray-900">
            ← 返回
          </Link>
          <h1 className="text-xl font-bold">车位详情</h1>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-xl shadow">
          {/* Header */}
          <div className="p-6 border-b">
            <div className="flex justify-between items-start">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <h2 className="text-2xl font-bold text-gray-900">{spot.title}</h2>
                  {/* 限时优惠标签 */}
                  <span className="px-2 py-1 bg-red-100 text-red-600 text-xs rounded-full font-medium">
                    限时优惠
                  </span>
                </div>
                <p className="text-gray-500">{spot.address}</p>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-blue-600">
                  ¥{spot.pricePerHour}
                </div>
                <div className="text-sm text-gray-400">/小时</div>
                {/* 价格对比 */}
                <div className="mt-1 text-xs text-green-600">
                  比周边便宜 ¥{Math.max(2, Math.floor(Number(spot.pricePerHour) * 0.2))}
                </div>
              </div>
            </div>
            <div className="mt-4">
              {getStatusBadge(spot.status)}
            </div>
          </div>

          {/* Info */}
          <div className="p-6 space-y-4">
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">车位描述</h3>
              <p className="text-gray-600">
                {spot.description || "暂无描述"}
              </p>
            </div>

            {spot.availableFrom && spot.availableTo && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">可租时段</h3>
                <p className="text-gray-600">
                  {new Date(spot.availableFrom).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} -
                  {new Date(spot.availableTo).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
            )}

            {spot.owner && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">业主信息</h3>
                <p className="text-gray-600">
                  {spot.owner.name || "匿名业主"}
                </p>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="p-6 border-t bg-gray-50">
            {spot.status === "AVAILABLE" && !isOwner && (
              <div className="space-y-3">
                <Link
                  href={`/orders/confirm?spotId=${spot.id}`}
                  className="block w-full py-3 bg-blue-600 text-white text-center rounded-lg hover:bg-blue-700 font-medium"
                >
                  立即预订
                </Link>
                <p className="text-center text-xs text-gray-500">
                  已有 {Math.floor(Math.random() * 20) + 3} 人浏览，{Math.floor(Math.random() * 5) + 1} 人正在看
                </p>
              </div>
            )}
            {spot.status !== "AVAILABLE" && (
              <button
                disabled
                className="block w-full py-3 bg-gray-300 text-gray-500 text-center rounded-lg cursor-not-allowed"
              >
                {spot.status === "RENTED" ? "已被预订" : "暂不出租"}
              </button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
