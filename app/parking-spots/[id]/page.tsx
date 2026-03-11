"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ParkingSpot } from "@/types";

export default function SpotDetailPage() {
  const params = useParams();
  const [spot, setSpot] = useState<ParkingSpot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchSpot();
  }, [params.id]);

  const fetchSpot = async () => {
    try {
      const res = await fetch(`/api/parking-spots/${params.id}`);
      const data = await res.json();

      if (data.success) {
        setSpot(data.data);
      } else {
        setError(data.message || "车位不存在");
      }
    } catch (err) {
      setError("加载失败");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">加载中...</div>
      </div>
    );
  }

  if (error || !spot) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500">{error || "车位不存在"}</p>
          <Link href="/" className="mt-4 text-blue-600 hover:underline">
            返回首页
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <Link href="/" className="text-gray-600 hover:text-gray-900">
            ← 返回
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8">
        <div className="bg-white rounded-xl shadow">
          {/* Images */}
          {spot.images && spot.images.length > 0 ? (
            <div className="aspect-video bg-gray-100 rounded-t-xl overflow-hidden">
              <img
                src={spot.images[0]}
                alt={spot.title}
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            <div className="aspect-video bg-gray-100 rounded-t-xl flex items-center justify-center">
              <span className="text-4xl">🚗</span>
            </div>
          )}

          <div className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-2xl font-bold">{spot.title}</h1>
                <p className="text-gray-500 mt-1">{spot.address}</p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-blue-600">
                  ¥{spot.pricePerHour}
                </div>
                <div className="text-sm text-gray-400">/小时</div>
              </div>
            </div>

            <div className="mt-6">
              <h3 className="font-medium text-gray-900">车位描述</h3>
              <p className="text-gray-600 mt-2">
                {spot.description || "暂无描述"}
              </p>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-4">
              <div>
                <h3 className="font-medium text-gray-900">可租时段</h3>
                <p className="text-gray-600 mt-1">
                  {spot.availableFrom
                    ? new Date(spot.availableFrom).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : "08:00"}
                  -
                  {spot.availableTo
                    ? new Date(spot.availableTo).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : "20:00"}
                </p>
              </div>
              <div>
                <h3 className="font-medium text-gray-900">状态</h3>
                <p className="text-gray-600 mt-1">
                  {spot.status === "AVAILABLE" ? "可租" : "暂不可租"}
                </p>
              </div>
            </div>

            <div className="mt-6">
              <h3 className="font-medium text-gray-900">位置</h3>
              <p className="text-gray-600 mt-1">
                经度: {spot.longitude}, 纬度: {spot.latitude}
              </p>
            </div>

            <div className="mt-8">
              <Link
                href={`/orders/confirm?spotId=${spot.id}`}
                className={`w-full py-3 px-4 text-center rounded-lg font-medium ${
                  spot.status === "AVAILABLE"
                    ? "bg-blue-600 text-white hover:bg-blue-700"
                    : "bg-gray-300 text-gray-500 cursor-not-allowed"
                }`}
              >
                {spot.status === "AVAILABLE" ? "立即预订" : "暂不可租"}
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
