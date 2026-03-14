"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { ParkingSpot, SpotStatus } from "@/types";
import SpotCard from "@/components/SpotCard";

export default function ListSearchClient() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [spots, setSpots] = useState<(ParkingSpot & { distance?: number })[]>([]);
  const [loading, setLoading] = useState(true);
  const [seedInitializing, setSeedInitializing] = useState(false);
  const [filters, setFilters] = useState({
    minPrice: searchParams.get("minPrice") || "",
    maxPrice: searchParams.get("maxPrice") || "",
    sortBy: searchParams.get("sortBy") || "distance",
  });

  // 时间筛选状态
  const [startTime, setStartTime] = useState<string>(searchParams.get("startTime") || "");
  const [endTime, setEndTime] = useState<string>(searchParams.get("endTime") || "");
  const [timeError, setTimeError] = useState<string>("");

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
  }, [startTime, endTime]);

  const fetchSpots = async () => {
    try {
      let url = "/api/parking-spots/search?radius=50";

      // 添加时间参数到URL
      if (startTime && endTime) {
        url += `&startTime=${encodeURIComponent(startTime)}&endTime=${encodeURIComponent(endTime)}`;
      }

      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const { latitude, longitude } = position.coords;
            let finalUrl = `/api/parking-spots/search?lat=${latitude}&lng=${longitude}&radius=50`;
            if (startTime && endTime) {
              finalUrl += `&startTime=${encodeURIComponent(startTime)}&endTime=${encodeURIComponent(endTime)}`;
            }
            const res = await fetch(finalUrl);
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

  // 处理开始时间变化
  const handleStartTimeChange = (value: string) => {
    setStartTime(value);
    setTimeError("");

    if (value && endTime) {
      if (new Date(value) >= new Date(endTime)) {
        setTimeError("结束时间必须晚于开始时间");
        return;
      }
    }

    updateUrlParams();
  };

  // 处理结束时间变化
  const handleEndTimeChange = (value: string) => {
    setEndTime(value);
    setTimeError("");

    if (startTime && value) {
      if (new Date(startTime) >= new Date(value)) {
        setTimeError("结束时间必须晚于开始时间");
        return;
      }
    }

    updateUrlParams();
  };

  // 立即可用快捷选项
  const setImmediateAvailability = () => {
    const now = new Date();
    const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);

    const formatLocalDateTime = (date: Date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      const hours = String(date.getHours()).padStart(2, "0");
      const minutes = String(date.getMinutes()).padStart(2, "0");
      return `${year}-${month}-${day}T${hours}:${minutes}`;
    };

    setStartTime(formatLocalDateTime(now));
    setEndTime(formatLocalDateTime(oneHourLater));
    setTimeError("");
    updateUrlParams();
  };

  // 清除时间筛选
  const clearTimeFilter = () => {
    setStartTime("");
    setEndTime("");
    setTimeError("");
    updateUrlParams();
  };

  // 更新URL参数（支持分享）
  const updateUrlParams = () => {
    const params = new URLSearchParams();
    if (startTime) params.set("startTime", startTime);
    if (endTime) params.set("endTime", endTime);
    if (filters.minPrice) params.set("minPrice", filters.minPrice);
    if (filters.maxPrice) params.set("maxPrice", filters.maxPrice);
    if (filters.sortBy !== "distance") params.set("sortBy", filters.sortBy);

    const newUrl = `${window.location.pathname}${params.toString() ? "?" + params.toString() : ""}`;
    router.push(newUrl, { scroll: false });
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
          {/* 时间筛选 */}
          <div className="mb-4 pb-4 border-b border-gray-100">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-medium text-gray-900">时间筛选</h3>
              <div className="flex gap-2">
                <button
                  onClick={setImmediateAvailability}
                  className="px-3 py-1.5 bg-blue-50 text-blue-600 text-sm rounded-full hover:bg-blue-100 transition-colors"
                >
                  立即预约
                </button>
                {(startTime || endTime) && (
                  <button
                    onClick={clearTimeFilter}
                    className="px-3 py-1.5 text-gray-500 text-sm hover:text-gray-700 transition-colors"
                  >
                    清除时间
                  </button>
                )}
              </div>
            </div>
            <div className="flex flex-wrap gap-4 items-start">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  开始时间
                </label>
                <input
                  type="datetime-local"
                  value={startTime}
                  onChange={(e) => handleStartTimeChange(e.target.value)}
                  className="w-48 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  结束时间
                </label>
                <input
                  type="datetime-local"
                  value={endTime}
                  onChange={(e) => handleEndTimeChange(e.target.value)}
                  className="w-48 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>
            </div>
            {timeError && (
              <p className="mt-2 text-sm text-red-600">{timeError}</p>
            )}
            {startTime && endTime && !timeError && (
              <p className="mt-2 text-sm text-green-600">
                已筛选 {new Date(startTime).toLocaleString()} - {new Date(endTime).toLocaleString()} 可用的车位
              </p>
            )}
          </div>

          {/* 价格和排序筛选 */}
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
              onClick={() => {
                setFilters({ minPrice: "", maxPrice: "", sortBy: "distance" });
                clearTimeFilter();
              }}
              className="px-4 py-2 text-gray-600 hover:text-gray-900"
            >
              重置
            </button>
          </div>
        </div>

        {/* 结果列表 */}
        <div className="space-y-4">
          {filteredSpots.map((spot) => (
            <SpotCard
              key={spot.id}
              spot={spot}
              startTime={startTime}
              endTime={endTime}
              isAvailable={true}
            />
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
