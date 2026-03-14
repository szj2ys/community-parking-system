"use client";

import { useEffect, useRef } from "react";
import type { ParkingSpot } from "@/types";

export interface ParkingSpotMarkersProps {
  map: AMap.Map | null;
  spots: (ParkingSpot & { distance?: number })[];
  onMarkerClick?: (spot: ParkingSpot & { distance?: number }) => void;
  selectedSpotId?: string;
}

export default function ParkingSpotMarkers({
  map,
  spots,
  onMarkerClick,
  selectedSpotId,
}: ParkingSpotMarkersProps) {
  const markersRef = useRef<AMap.Marker[]>([]);

  useEffect(() => {
    if (!map) return;

    // Clear existing markers
    markersRef.current.forEach((marker) => marker.setMap(null));
    markersRef.current = [];

    // Add new markers
    spots.forEach((spot) => {
      const content = `
        <div class="relative cursor-pointer transform -translate-x-1/2 -translate-y-full">
          <div class="${
            selectedSpotId === spot.id
              ? "bg-red-600 ring-2 ring-red-300"
              : "bg-blue-600"
          } text-white px-2 py-1 rounded-lg text-sm font-bold shadow-lg whitespace-nowrap transition-all">
            ¥${Number(spot.pricePerHour).toFixed(1)}
          </div>
          <div class="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent ${
            selectedSpotId === spot.id ? "border-t-red-600" : "border-t-blue-600"
          }"></div>
        </div>
      `;

      const marker = new AMap.Marker({
        position: [spot.longitude, spot.latitude],
        content,
        offset: new AMap.Pixel(0, -10),
        zIndex: selectedSpotId === spot.id ? 100 : 1,
      });

      marker.on("click", () => {
        onMarkerClick?.(spot);
      });

      marker.setMap(map);
      markersRef.current.push(marker);
    });

    return () => {
      markersRef.current.forEach((marker) => marker.setMap(null));
    };
  }, [map, spots, onMarkerClick, selectedSpotId]);

  return null;
}
