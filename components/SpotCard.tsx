"use client";

import Link from "next/link";
import { ParkingSpot, SpotStatus } from "@/types";
import StatusBadge from "./StatusBadge";

interface SpotCardProps {
  spot: ParkingSpot & { distance?: number };
  startTime?: string;
  endTime?: string;
  isAvailable?: boolean;
}

export default function SpotCard({ spot, startTime, endTime, isAvailable = true }: SpotCardProps) {
  const hasTimeFilter = startTime && endTime;

  return (
    <Link
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
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-lg">{spot.title}</h3>
                <StatusBadge status={spot.status} />
                {/* 可用性状态标签 */}
                {hasTimeFilter && (
                  isAvailable ? (
                    <span className="px-2 py-0.5 bg-green-50 text-green-600 text-xs rounded-full">
                      该时段可用
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 bg-red-50 text-red-600 text-xs rounded-full">
                      该时段已被预订
                    </span>
                  )
                )}
              </div>
              <p className="text-gray-500 text-sm mt-1">{spot.address}</p>
              <p className="text-gray-600 text-sm mt-2 line-clamp-2">
                {spot.description || "暂无描述"}
              </p>
              {/* 显示可用时间段信息 */}
              {spot.availableFrom && spot.availableTo && (
                <p className="text-xs text-gray-500 mt-2">
                  每日可租时段: {formatTime(spot.availableFrom)} - {formatTime(spot.availableTo)}
                </p>
              )}
              {spot.distance !== undefined && (
                <p className="text-xs text-blue-600 mt-2">
                  距您 {spot.distance.toFixed(2)} km
                </p>
              )}
              {/* 当不可用时显示查看其他时间提示 */}
              {hasTimeFilter && !isAvailable && (
                <p className="text-xs text-blue-500 mt-2">
                  点击查看其他可用时段
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
  );
}

// 格式化时间为 HH:mm 格式
function formatTime(date: Date | string): string {
  const d = new Date(date);
  const hours = d.getHours().toString().padStart(2, "0");
  const minutes = d.getMinutes().toString().padStart(2, "0");
  return `${hours}:${minutes}`;
}
