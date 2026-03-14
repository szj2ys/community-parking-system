"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ParkingSpot, SpotStatus } from "@/types";
import StatusBadge from "@/components/StatusBadge";

export default function OwnerSpotsPage() {
  const [spots, setSpots] = useState<ParkingSpot[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<SpotStatus | "ALL">("ALL");

  useEffect(() => {
    fetchSpots();
  }, [filter]);

  const fetchSpots = async () => {
    try {
      let url = "/api/parking-spots";
      if (filter !== "ALL") {
        url += `?status=${filter}`;
      }

      const res = await fetch(url);
      const data = await res.json();

      if (data.success) {
        setSpots(data.data);
      }
    } catch (err) {
      console.error("获取车位失败:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (spotId: string, newStatus: SpotStatus) => {
    try {
      const res = await fetch(`/api/parking-spots/${spotId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        fetchSpots();
      }
    } catch (err) {
      console.error("更新状态失败:", err);
    }
  };

  const handleDelete = async (spotId: string) => {
    if (!confirm("确定要删除这个车位吗？")) return;

    try {
      const res = await fetch(`/api/parking-spots/${spotId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        fetchSpots();
      }
    } catch (err) {
      console.error("删除失败:", err);
    }
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
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-gray-600 hover:text-gray-900">
              ← 返回
            </Link>
            <h1 className="text-xl font-bold">我的车位</h1>
          </div>
          <Link
            href="/owner/publish"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
          >
            + 发布新车位
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* 筛选器 */}
        <div className="flex gap-2 mb-6">
          {[
            { key: "ALL", label: "全部" },
            { key: "AVAILABLE", label: "可租" },
            { key: "RENTED", label: "已租" },
            { key: "UNAVAILABLE", label: "暂不出租" },
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setFilter(key as SpotStatus | "ALL")}
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

        {/* 车位列表 */}
        <div className="space-y-4">
          {spots.map((spot) => (
            <div
              key={spot.id}
              className="bg-white rounded-xl shadow p-6"
            >
              <div className="flex gap-4">
                {/* 图片缩略图 */}
                <div className="w-24 h-24 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100">
                  {spot.images && spot.images.length > 0 ? (
                    <img
                      src={spot.images[0]}
                      alt={spot.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  )}
                </div>

                <div className="flex-1">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-lg">{spot.title}</h3>
                        <StatusBadge status={spot.status} />
                      </div>
                      <p className="text-gray-500 text-sm mt-1">{spot.address}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-bold text-blue-600">
                        ¥{spot.pricePerHour}
                      </div>
                      <div className="text-xs text-gray-400">/小时</div>
                    </div>
                  </div>

                  {/* 图片数量指示器 */}
                  {spot.images && spot.images.length > 1 && (
                    <div className="text-xs text-gray-500 mb-2">
                      共 {spot.images.length} 张图片
                    </div>
                  )}

                  <div className="flex gap-2">
                    {spot.status === SpotStatus.AVAILABLE && (
                      <button
                        onClick={() => handleStatusChange(spot.id, SpotStatus.UNAVAILABLE)}
                        className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
                      >
                        下架
                      </button>
                    )}
                    {spot.status === SpotStatus.UNAVAILABLE && (
                      <button
                        onClick={() => handleStatusChange(spot.id, SpotStatus.AVAILABLE)}
                        className="px-3 py-1.5 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700"
                      >
                        上架
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(spot.id)}
                      className="px-3 py-1.5 text-sm text-red-600 border border-red-300 rounded-lg hover:bg-red-50"
                    >
                      删除
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {spots.length === 0 && (
            <div className="text-center py-12">
              <div className="text-4xl mb-4">🚗</div>
              <h3 className="text-lg font-medium text-gray-900">暂无车位</h3>
              <p className="text-gray-500 mt-2">发布您的第一个车位吧</p>
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
