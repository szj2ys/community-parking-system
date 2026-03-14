"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import MapContainer from "@/components/map/MapContainer";
import ImageUploader from "@/components/ImageUploader";
import { trackButtonClick } from "@/lib/analytics";

export default function PublishClient() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [mapInstance, setMapInstance] = useState<AMap.Map | null>(null);
  const [marker, setMarker] = useState<AMap.Marker | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    address: "",
    longitude: "",
    latitude: "",
    pricePerHour: "",
    description: "",
    availableFrom: "08:00",
    availableTo: "22:00",
  });
  const [images, setImages] = useState<string[]>([]);

  const handleMapClick = useCallback((lat: number, lng: number) => {
    setFormData((prev) => ({
      ...prev,
      latitude: lat.toFixed(6),
      longitude: lng.toFixed(6),
    }));

    // Update or create marker
    if (mapInstance && typeof window !== "undefined" && (window as typeof window & { AMap?: typeof AMap }).AMap) {
      const AMapLib = (window as typeof window & { AMap: typeof AMap }).AMap;
      if (marker) {
        marker.setPosition([lng, lat]);
      } else {
        const newMarker = new AMapLib.Marker({
          position: [lng, lat],
          draggable: true,
        });
        newMarker.on("dragend", (e: AMap.MapsEvent) => {
          const { lng: newLng, lat: newLat } = e.lnglat;
          setFormData((prev) => ({
            ...prev,
            latitude: newLat.toFixed(6),
            longitude: newLng.toFixed(6),
          }));
          // Reverse geocode
          reverseGeocode(newLng, newLat);
        });
        newMarker.setMap(mapInstance);
        setMarker(newMarker);
      }
    }

    // Reverse geocode to get address
    reverseGeocode(lng, lat);
  }, [mapInstance, marker]);

  const reverseGeocode = (lng: number, lat: number) => {
    if (typeof AMap !== "undefined") {
      AMap.plugin(["AMap.Geocoder"], () => {
        const geocoder = new AMap.Geocoder({
          radius: 1000,
          extensions: "all",
        });
        geocoder.getAddress([lng, lat], (status: string, result: { regeocode: { formattedAddress: string } }) => {
          if (status === "complete" && result.regeocode) {
            setFormData((prev) => ({
              ...prev,
              address: result.regeocode.formattedAddress,
            }));
          }
        });
      });
    }
  };

  const handleAddressSearch = () => {
    if (!formData.address || !mapInstance) return;

    if (typeof AMap !== "undefined") {
      AMap.plugin(["AMap.Geocoder"], () => {
        const geocoder = new AMap.Geocoder({
          radius: 1000,
        });
        geocoder.getLocation(formData.address, (status: string, result: { geocodes: Array<{ location: { lng: number; lat: number }; address: string }> }) => {
          if (status === "complete" && result.geocodes && result.geocodes.length > 0) {
            const { lng, lat } = result.geocodes[0].location;
            mapInstance.setCenter([lng, lat]);
            mapInstance.setZoom(16);
            handleMapClick(lat, lng);
          } else {
            alert("无法找到该地址，请尝试更详细的描述");
          }
        });
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Track publish button click
    trackButtonClick("发布车位", { title: formData.title, price: formData.pricePerHour });

    try {
      const res = await fetch("/api/parking-spots", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          longitude: parseFloat(formData.longitude),
          latitude: parseFloat(formData.latitude),
          pricePerHour: parseFloat(formData.pricePerHour),
          images,
        }),
      });

      const data = await res.json();

      if (data.success) {
        alert("车位发布成功！");
        router.push("/owner/spots");
      } else {
        alert(data.message || "发布失败");
      }
    } catch (err) {
      alert("发布失败，请重试");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link href="/" className="text-gray-600 hover:text-gray-900">
            ← 返回
          </Link>
          <h1 className="text-xl font-bold">发布车位</h1>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8">
        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow p-6 space-y-6">
          {/* 地图选址区域 */}
          <div className="border rounded-lg p-4 bg-gray-50">
            <h3 className="font-medium text-gray-900 mb-3">📍 在地图上选择车位位置</h3>
            <div className="h-64 rounded-lg overflow-hidden border border-gray-200 mb-3">
              <MapContainer
                center={{ lat: 39.9093, lng: 116.3974 }}
                zoom={12}
                onMapClick={handleMapClick}
                onMapLoad={setMapInstance}
                className="w-full h-full"
              />
            </div>
            <p className="text-sm text-gray-500">
              点击地图选择位置，或搜索地址自动定位
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              车位标题 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="例如：阳光花园地下车位 B-123"
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              详细地址 <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="例如：北京市朝阳区阳光花园小区地下停车场 B区123号"
                required
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={handleAddressSearch}
                className="px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 whitespace-nowrap"
              >
                搜索定位
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                经度 <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                step="any"
                value={formData.longitude}
                onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                placeholder="116.3974"
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                纬度 <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                step="any"
                value={formData.latitude}
                onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                placeholder="39.9093"
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              价格（元/小时） <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={formData.pricePerHour}
              onChange={(e) => setFormData({ ...formData, pricePerHour: e.target.value })}
              placeholder="5.00"
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                可租开始时间
              </label>
              <input
                type="time"
                value={formData.availableFrom}
                onChange={(e) => setFormData({ ...formData, availableFrom: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                可租结束时间
              </label>
              <input
                type="time"
                value={formData.availableTo}
                onChange={(e) => setFormData({ ...formData, availableTo: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              车位描述
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="例如：靠近电梯口，方便进出，限高2.1米"
              rows={4}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              车位照片
            </label>
            <ImageUploader images={images} onChange={setImages} maxImages={5} />
          </div>

          <div className="flex gap-4 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-3 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium"
            >
              {loading ? "发布中..." : "发布车位"}
            </button>
            <Link
              href="/"
              className="py-3 px-4 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              取消
            </Link>
          </div>
        </form>
      </main>
    </div>
  );
}
