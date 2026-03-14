"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ParkingSpot, SpotStatus } from "@/types";
import StatusBadge from "@/components/StatusBadge";

export default function ListSearchPage() {
  const [spots, setSpots] = useState<(ParkingSpot & { distance?: number })[]>([]);
  const [loading, setLoading] = useState(true);
  const [seedInitializing, setSeedInitializing] = useState(false);
  const [filters, setFilters] = useState({
    minPrice: "",
    maxPrice: "",
    sortBy: "distance",
  });

  // 自动初始化种子数据
  useEffect(() => {
    const initSeedData = async () => {
      try {
        // 先检查状态
        const checkRes = await fetch("/api/seed");
        const checkData = await checkRes.json();

        if (!checkData.data?.hasSeedData) {
          setSeedInitializing(true);
          // 需要初始化
          await fetch("/api/seed", { method: "POST" });
          setSeedInitializing(false);
        }
      } catch (err) {
        console.error("种子数据检查失败:", err);
      }
    };

    initSeedData();
  }, []);

  useEffect(() => {
    fetchSpots();
  }, []);

  const fetchSpots = async () => {
    try {
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
      return (a.distance || Infinity) - (b.distance || Infinity);
    });

  if (loading || seedInitializing) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-gray-500 mb-2">
            {seedInitializing ? "正在初始化数据..." : "加载中..."}
          </div>
          {seedInitializing && (
            <div className="text-sm text-gray-400">首次加载需要几秒钟</div>
          )}
        </div>
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
              className="block bg-white rounded-xl shadow hover:shadow-md transition-shadow p-4"
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
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-lg">{spot.title}</h3>
                        <StatusBadge status={spot.status} />
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
                    <div className="text-right ml-4 flex-shrink-0">
                      <div className="text-2xl font-bold text-blue-600">
                        ¥{spot.pricePerHour}
                      </div>
                      <div className="text-sm text-gray-400">/小时</div>
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          ))}

          {/* 空状态 - 优化引导 */}
          {filteredSpots.length === 0 && (
            <div className="text-center py-12">
              <div className="text-4xl mb-4">🚗</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                暂无可用车位
              </h3>
              <p className="text-gray-500 mb-6">
                成为第一个发布车位的业主，让闲置资源创造价值
              </p>
              <Link
                href="/owner/publish"
                className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
              >
                + 发布我的车位
              </Link>
              <div className="mt-6 text-sm text-gray-400">
                <Link href="/" className="text-blue-600 hover:underline">
                  ← 返回首页
                </Link>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
