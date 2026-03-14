"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ParkingSpot } from "@/types";
import { MapContainer, ParkingSpotMarkers } from "@/components/map";

export default function MapSearchPage() {
  const [spots, setSpots] = useState<(ParkingSpot & { distance?: number })[]>([]);
  const [loading, setLoading] = useState(true);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [selectedSpot, setSelectedSpot] = useState<ParkingSpot & { distance?: number } | null>(null);
  const [mapInstance, setMapInstance] = useState<AMap.Map | null>(null);

  useEffect(() => {
    // 获取用户位置
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setUserLocation({ lat: latitude, lng: longitude });
          fetchSpots(latitude, longitude);
        },
        () => {
          // 默认位置：北京天安门
          fetchSpots(39.9093, 116.3974);
        }
      );
    } else {
      fetchSpots(39.9093, 116.3974);
    }
  }, []);

  const fetchSpots = async (lat: number, lng: number) => {
    try {
      const res = await fetch(`/api/parking-spots/search?lat=${lat}&lng=${lng}&radius=5`);
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

  const handleListItemClick = (spot: ParkingSpot & { distance?: number }) => {
    setSelectedSpot(spot);
    // 地图定位到选中车位
    if (mapInstance) {
      mapInstance.setCenter([spot.longitude, spot.latitude]);
      mapInstance.setZoom(16);
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
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-gray-600 hover:text-gray-900">
              ← 返回
            </Link>
            <h1 className="text-xl font-bold">地图找车位</h1>
          </div>
          <Link
            href="/tenant/list"
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
          >
            列表模式
          </Link>
        </div>
      </header>

      <div className="flex h-[calc(100vh-73px)]">
        {/* 地图区域 */}
        <div className="flex-1 relative">
          <MapContainer
            center={userLocation || { lat: 39.9093, lng: 116.3974 }}
            zoom={13}
            onMapLoad={setMapInstance}
            className="w-full h-full"
          />
          <ParkingSpotMarkers
            map={mapInstance}
            spots={spots}
            selectedSpotId={selectedSpot?.id}
            onMarkerClick={setSelectedSpot}
          />
        </div>

        {/* 侧边栏列表 */}
        <div className="w-96 bg-white shadow-lg overflow-y-auto">
          <div className="p-4 border-b">
            <h2 className="font-semibold">附近车位</h2>
            <p className="text-sm text-gray-500">
              共 {spots.length} 个车位
              {userLocation && "（按距离排序）"}
            </p>
          </div>

          <div className="divide-y">
            {spots.map((spot) => (
              <div
                key={spot.id}
                className={`p-4 cursor-pointer hover:bg-gray-50 ${
                  selectedSpot?.id === spot.id ? "bg-blue-50" : ""
                }`}
                onClick={() => handleListItemClick(spot)}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-medium">{spot.title}</h3>
                    <p className="text-sm text-gray-500 mt-1 line-clamp-1">
                      {spot.address}
                    </p>
                    {spot.distance !== undefined && (
                      <p className="text-xs text-blue-600 mt-1">
                        距您 {spot.distance.toFixed(2)} km
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="text-blue-600 font-bold">
                      ¥{spot.pricePerHour}
                    </div>
                    <div className="text-xs text-gray-400">/小时</div>
                  </div>
                </div>
              </div>
            ))}

            {spots.length === 0 && (
              <div className="p-8 text-center">
                <div className="text-4xl mb-4">🚗</div>
                <p className="text-gray-500">附近暂无可用车位</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 选中车位详情弹窗 */}
      {selectedSpot && (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50">
          <div className="bg-white w-full max-w-md mx-4 rounded-t-xl sm:rounded-xl p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-xl font-bold">{selectedSpot.title}</h3>
                <p className="text-gray-500 text-sm mt-1">
                  {selectedSpot.address}
                </p>
              </div>
              <button
                onClick={() => setSelectedSpot(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <div className="flex items-center gap-4 mb-4">
              <div className="text-2xl font-bold text-blue-600">
                ¥{selectedSpot.pricePerHour}
                <span className="text-sm text-gray-400 font-normal">/小时</span>
              </div>
              {selectedSpot.distance !== undefined && (
                <div className="text-sm text-blue-600">
                  距您 {selectedSpot.distance.toFixed(2)} km
                </div>
              )}
            </div>

            <p className="text-gray-600 text-sm mb-6">
              {selectedSpot.description || "暂无描述"}
            </p>

            <Link
              href={`/parking-spots/${selectedSpot.id}`}
              className="block w-full py-3 bg-blue-600 text-white text-center rounded-lg hover:bg-blue-700 font-medium"
            >
              查看详情
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
