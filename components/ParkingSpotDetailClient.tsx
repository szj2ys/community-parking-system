"use client";

import { useState } from "react";
import Link from "next/link";
import { ParkingSpot } from "@/types";
import StatusBadge from "@/components/StatusBadge";
import ShareButtons from "@/components/ShareButtons";
import { trackButtonClick, track } from "@/lib/analytics";

interface ParkingSpotDetailClientProps {
  spot: ParkingSpot;
}

export default function ParkingSpotDetailClient({ spot }: ParkingSpotDetailClientProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Track spot view on client side
  track("spot_view", { spotId: spot.id, title: spot.title, price: spot.pricePerHour });

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
            <div className="mt-4 flex items-center justify-between">
              <StatusBadge status={spot.status} size="md" />
              <ShareButtons
                url={`/parking-spots/${spot.id}`}
                title={spot.title}
                description={`${spot.address} - ¥${spot.pricePerHour}/小时`}
              />
            </div>
          </div>

          {/* Image Gallery */}
          {spot.images && spot.images.length > 0 ? (
            <div className="border-b">
              {/* Main Image */}
              <div className="relative aspect-video bg-gray-100">
                <img
                  src={spot.images[currentImageIndex]}
                  alt={`车位图片 ${currentImageIndex + 1}`}
                  className="w-full h-full object-contain"
                />
                {spot.images.length > 1 && (
                  <>
                    <button
                      onClick={() => setCurrentImageIndex((prev) => (prev > 0 ? prev - 1 : spot.images.length - 1))}
                      className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/50 text-white rounded-full flex items-center justify-center hover:bg-black/70"
                      aria-label="上一张"
                    >
                      ←
                    </button>
                    <button
                      onClick={() => setCurrentImageIndex((prev) => (prev < spot.images.length - 1 ? prev + 1 : 0))}
                      className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/50 text-white rounded-full flex items-center justify-center hover:bg-black/70"
                      aria-label="下一张"
                    >
                      →
                    </button>
                    <div className="absolute bottom-2 left-1/2 -translate-x-1/2 px-2 py-1 bg-black/50 text-white text-sm rounded">
                      {currentImageIndex + 1} / {spot.images.length}
                    </div>
                  </>
                )}
              </div>
              {/* Thumbnails */}
              {spot.images.length > 1 && (
                <div className="flex gap-2 p-4 bg-gray-50 overflow-x-auto">
                  {spot.images.map((url, index) => (
                    <button
                      key={url}
                      onClick={() => setCurrentImageIndex(index)}
                      className={`relative w-16 h-16 rounded-lg overflow-hidden border-2 flex-shrink-0 ${
                        index === currentImageIndex
                          ? "border-blue-500"
                          : "border-transparent hover:border-gray-300"
                      }`}
                    >
                      <img
                        src={url}
                        alt={`缩略图 ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="border-b">
              <div className="aspect-video bg-gray-100 flex items-center justify-center">
                <div className="text-center text-gray-400">
                  <svg className="w-16 h-16 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <p>暂无图片</p>
                </div>
              </div>
            </div>
          )}

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
            {spot.status === "AVAILABLE" && (
              <div className="space-y-3">
                <Link
                  href={`/orders/confirm?spotId=${spot.id}`}
                  onClick={() => trackButtonClick("立即预订", { spotId: spot.id, price: spot.pricePerHour })}
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
