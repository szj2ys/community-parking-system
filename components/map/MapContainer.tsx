"use client";

import { useEffect, useRef, useState } from "react";

export interface MapContainerProps {
  center?: { lat: number; lng: number };
  zoom?: number;
  onMapClick?: (lat: number, lng: number) => void;
  onMapLoad?: (map: AMap.Map) => void;
  className?: string;
}

export default function MapContainer({
  center = { lat: 39.9093, lng: 116.3974 },
  zoom = 13,
  onMapClick,
  onMapLoad,
  className = "",
}: MapContainerProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<AMap.Map | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initMap = async () => {
      try {
        // Dynamically import AMapLoader to avoid SSR issues
        const AMapLoader = (await import("@amap/amap-jsapi-loader")).default;

        const AMap = await AMapLoader.load({
          key: process.env.NEXT_PUBLIC_AMAP_KEY || "",
          version: "2.0",
          plugins: ["AMap.Geocoder", "AMap.Scale", "AMap.ToolBar"],
        });

        if (!mapRef.current) return;

        const map = new AMap.Map(mapRef.current, {
          zoom,
          center: [center.lng, center.lat],
        });

        map.addControl(new AMap.Scale());
        map.addControl(new AMap.ToolBar({
          position: "RB",
        }));

        // Handle map click
        if (onMapClick) {
          map.on("click", (e: AMap.MapsEvent) => {
            const { lng, lat } = e.lnglat;
            onMapClick(lat, lng);
          });
        }

        mapInstanceRef.current = map;
        setIsLoaded(true);
        onMapLoad?.(map);
      } catch (err) {
        console.error("Map initialization failed:", err);
        setError("地图加载失败，请检查网络连接");
      }
    };

    initMap();

    return () => {
      mapInstanceRef.current?.destroy();
    };
  }, []);

  // Update center when prop changes
  useEffect(() => {
    if (mapInstanceRef.current && isLoaded) {
      mapInstanceRef.current.setCenter([center.lng, center.lat]);
    }
  }, [center, isLoaded]);

  if (error) {
    return (
      <div className={`flex items-center justify-center bg-gray-100 ${className}`}>
        <div className="text-center text-gray-500">
          <div className="text-4xl mb-2">🗺️</div>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-50 z-10">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
            <p className="text-sm text-gray-500">加载地图中...</p>
          </div>
        </div>
      )}
      <div ref={mapRef} className="w-full h-full" />
    </div>
  );
}
