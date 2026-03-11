"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ParkingSpot, SpotStatus } from "@/types";

export default function MySpotsPage() {
  const [spots, setSpots] = useState<ParkingSpot[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSpots();
  }, []);

  const fetchSpots = async () => {
    try {
      const res = await fetch("/api/parking-spots/my");
      const data = await res.json();
      if (data.success) {
        setSpots(data.data);
      }
    } catch (err) {
      console.error("获取车位列表失败:", err);
    } finally {
      setLoading(false);
    }
  };

  const toggleStatus = async (id: string, currentStatus: SpotStatus) => {
    const newStatus =
      currentStatus === "AVAILABLE" ? "UNAVAILABLE" : "AVAILABLE";
    try {
      const res = await fetch(`/api/parking-spots/${id}`, {
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

  const deleteSpot = async (id: string) => {
    if (!confirm("确定要删除这个车位吗？")) return;

    try {
      const res = await fetch(`/api/parking-spots/${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        fetchSpots();
      }
    } catch (err) {
      console.error("删除失败:", err);
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
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold">我的车位</h1>
          <Link
            href="/owner/publish"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            + 发布车位
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {spots.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-4xl mb-4">🚗</div>
            <h3 className="text-lg font-medium text-gray-900">还没有车位</h3>
            <p className="text-gray-500 mt-2">发布您的第一个车位开始赚钱吧</p>
            <Link
              href="/owner/publish"
              className="inline-block mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              发布车位
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {spots.map((spot) => (
              <div
                key={spot.id}
                className="bg-white rounded-xl shadow p-6"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-lg">{spot.title}</h3>
                      {getStatusBadge(spot.status)}
                    </div>
                    <p className="text-gray-500 text-sm mt-1">
                      {spot.address}
                    </p>
                    <div className="flex items-center gap-4 mt-3">
                      <span className="text-blue-600 font-bold">
                        ¥{spot.pricePerHour}/小时
                      </span>
                      <span className="text-gray-400 text-sm">
                        发布于{" "}
                        {new Date(spot.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 mt-4">
                  <Link
                    href={`/parking-spots/${spot.id}`}
                    className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    查看
                  </Link>
                  <button
                    onClick={() => toggleStatus(spot.id, spot.status)}
                    className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    {spot.status === "AVAILABLE" ? "下架" : "上架"}
                  </button>
                  <button
                    onClick={() => deleteSpot(spot.id)}
                    className="px-3 py-1.5 text-sm text-red-600 border border-red-200 rounded-lg hover:bg-red-50"
                  >
                    删除
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
