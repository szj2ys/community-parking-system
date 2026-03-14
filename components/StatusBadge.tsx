"use client";

import { SpotStatus } from "@/types";

const STATUS_CONFIG: Record<
  SpotStatus,
  { className: string; label: string }
> = {
  AVAILABLE: { className: "bg-green-100 text-green-700", label: "可租" },
  RENTED: { className: "bg-blue-100 text-blue-700", label: "已租" },
  UNAVAILABLE: { className: "bg-gray-100 text-gray-700", label: "暂不出租" },
};

interface StatusBadgeProps {
  status: SpotStatus;
  size?: "sm" | "md";
}

export default function StatusBadge({ status, size = "sm" }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status];
  const sizeClass = size === "md" ? "px-3 py-1 text-sm" : "px-2 py-1 text-xs";

  return (
    <span className={`${sizeClass} rounded-full ${config.className}`}>
      {config.label}
    </span>
  );
}
