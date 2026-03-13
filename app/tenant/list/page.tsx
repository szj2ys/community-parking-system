"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ParkingSpot, SpotStatus } from "@/types";

export default function ListSearchPage() {
  const [spots, setSpots] = useState<(ParkingSpot & { distance?: number })[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    minPrice: "",
    maxPrice: "",
    sortBy: "distance", // distance, price
  });

  useEffect(() => {
    fetchSpots();
  }, []);

  const fetchSpots = async () => {
    try {
      // 获取用户位置用于计算距离
      let url = "/api/parking-spots/search?radius=50";

      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const { latitude, longitude } = position.coords;
            url = `/api/parking-spots/search?lat=${latitude}&lng=${longitude}&radius=50`;
            const res = await fetch(url);
            const data = await res.json();
            if (data.success) {
              setSpots(data.data);
            }
            setLoading(false);
          },
          async () => {
            // 获取所有车位
            const res = await fetch(url);
            const data = await res.json();
            if (data.success) {
              setSpots(data.data);
            }
            setLoading(false);
          }
        );
      } else {
        const res = await fetch(url);
        const data = await res.json();
        if (data.success) {
          setSpots(data.data);
        }
        setLoading(false);
      }
    } catch (err) {
      console.error("获取车位失败:", err);
      setLoading(false);
    }
  };

  // 过滤和排序
  const filteredSpots = spots
    .filter((spot) => {
      if (filters.minPrice && spot.pricePerHour < parseFloat(filters.minPrice)) {
        return false;
      }
      if (filters.maxPrice && spot.pricePerHour > parseFloat(filters.maxPrice)) {
        return false;
      }
      return true;
    })
    .sort((a, b) => {
      if (filters.sortBy === "price") {
        return a.pricePerHour - b.pricePerHour;
      }
      // 默认按距离
      return (a.distance || Infinity) - (b.distance || Infinity);
    });

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
          <div className="flex items-center gap-4">
            <Link href="/" className="text-gray-600 hover:text-gray-900">
              ← 返回
            </Link>
            <h1 className="text-xl font-bold">列表找车位</h1>
          </div>
          <Link
            href="/tenant/map"
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
          >
            地图模式
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* 筛选器 */}
        <div className="bg-white rounded-xl shadow p-4 mb-6">
          <div className="flex flex-wrap gap-4 items-end">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                最低价格
              </label>
              <input
                type="number"
                value={filters.minPrice}
                onChange={(e) =>
                  setFilters({ ...filters, minPrice: e.target.value })
                }
                placeholder="元/小时"
                className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                最高价格
              </label>
              <input
                type="number"
                value={filters.maxPrice}
                onChange={(e) =>
                  setFilters({ ...filters, maxPrice: e.target.value })
                }
                placeholder="元/小时"
                className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                排序
              </label>
              <select
                value={filters.sortBy}
                onChange={(e) =>
                  setFilters({ ...filters, sortBy: e.target.value })
                }
                className="w-32 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="distance">按距离</option>
                <option value="price">按价格</option>
              </select>
            </div>
            <button
              onClick={() =>
                setFilters({ minPrice: "", maxPrice: "", sortBy: "distance" })
              }
              className="px-4 py-2 text-gray-600 hover:text-gray-900"
            >
              重置
            </button>
          </div>
        </div>

        {/* 结果列表 */}
        <div className="space-y-4">
          {filteredSpots.map((spot) => (
            <Link
              key={spot.id}
              href={`/parking-spots/${spot.id}`}
              className="block bg-white rounded-xl shadow hover:shadow-md transition-shadow p-6"
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-lg">{spot.title}</h3>
                    {getStatusBadge(spot.status)}
                  </div>
                  <p className="text-gray-500 text-sm mt-1">{spot.address}</p>
                  <p className="text-gray-600 text-sm mt-2 line-clamp-2">
                    {spot.description || "暂无描述"}
                  </p>
                  {spot.distance !== undefined && (
                    <p className="text-xs text-blue-600 mt-2">
                      距您 {spot.distance.toFixed(2)} km
                    </p>
                  )}
                </div>
                <div className="text-right ml-4">
                  <div className="text-2xl font-bold text-blue-600">
                    ¥{spot.pricePerHour}
                  </div>
                  <div className="text-sm text-gray-400">/小时</div>
                </div>
              </div>
            </Link>
          ))}

          {filteredSpots.length === 0 && (
            <div className="text-center py-12">
              <div className="text-4xl mb-4">🚗</div>
              <h3 className="text-lg font-medium text-gray-900">
                没有找到符合条件的车位
              </h3>
              <p className="text-gray-500 mt-2">尝试调整筛选条件</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
