"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ParkingSpot } from "@/types";
import { trackButtonClick, track } from "@/lib/analytics";

function OrderConfirmContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const spotId = searchParams.get("spotId");

  const [spot, setSpot] = useState<ParkingSpot | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split("T")[0],
    startTime: "09:00",
    endTime: "18:00",
    note: "",
  });
  const [calculatedPrice, setCalculatedPrice] = useState(0);

  useEffect(() => {
    if (spotId) {
      fetchSpot();
    }
  }, [spotId]);

  useEffect(() => {
    calculatePrice();
  }, [formData, spot]);

  const fetchSpot = async () => {
    try {
      const res = await fetch(`/api/parking-spots/${spotId}`);
      const data = await res.json();
      if (data.success) {
        setSpot(data.data);
      }
    } catch (err) {
      console.error("获取车位失败:", err);
    } finally {
      setLoading(false);
    }
  };

  const calculatePrice = () => {
    if (!spot) return;

    const start = new Date(`${formData.date}T${formData.startTime}`);
    const end = new Date(`${formData.date}T${formData.endTime}`);

    if (start >= end) {
      setCalculatedPrice(0);
      return;
    }

    const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
    const price = Math.ceil(hours * Number(spot.pricePerHour));
    setCalculatedPrice(price);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!spot) return;

    setSubmitting(true);

    // Track submit booking button click
    trackButtonClick("提交预订申请", {
      spotId: spot.id,
      price: calculatedPrice,
    });

    const startTime = `${formData.date}T${formData.startTime}`;
    const endTime = `${formData.date}T${formData.endTime}`;

    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          spotId: spot.id,
          startTime,
          endTime,
          note: formData.note,
        }),
      });

      const data = await res.json();

      if (data.success) {
        // Track order creation
        track("order_create", {
          spotId: spot.id,
          price: calculatedPrice,
          hours: (new Date(`${formData.date}T${formData.endTime}`).getTime() - new Date(`${formData.date}T${formData.startTime}`).getTime()) / (1000 * 60 * 60),
        });
        alert("预订申请已提交！请等待业主确认。");
        router.push("/orders");
      } else {
        alert(data.message || "预订失败");
      }
    } catch (err) {
      alert("预订失败，请重试");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">加载中...</div>
      </div>
    );
  }

  if (!spot) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500">车位不存在</p>
          <Link href="/" className="text-blue-600 hover:underline mt-4 block">
            返回首页
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link href={`/parking-spots/${spot.id}`} className="text-gray-600 hover:text-gray-900">
            ← 返回
          </Link>
          <h1 className="text-xl font-bold">确认预订</h1>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8">
        {/* 车位信息 */}
        <div className="bg-white rounded-xl shadow p-6 mb-6">
          <h2 className="font-semibold text-lg mb-4">车位信息</h2>
          <div className="flex justify-between items-start">
            <div>
              <h3 className="font-medium">{spot.title}</h3>
              <p className="text-gray-500 text-sm mt-1">{spot.address}</p>
            </div>
            <div className="text-right">
              <div className="text-xl font-bold text-blue-600">
                ¥{spot.pricePerHour}
              </div>
              <div className="text-xs text-gray-400">/小时</div>
            </div>
          </div>
        </div>

        {/* 预订表单 */}
        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow p-6">
          <h2 className="font-semibold text-lg mb-4">预订信息</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                日期
              </label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) =>
                  setFormData({ ...formData, date: e.target.value })
                }
                min={new Date().toISOString().split("T")[0]}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  开始时间
                </label>
                <input
                  type="time"
                  value={formData.startTime}
                  onChange={(e) =>
                    setFormData({ ...formData, startTime: e.target.value })
                  }
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  结束时间
                </label>
                <input
                  type="time"
                  value={formData.endTime}
                  onChange={(e) =>
                    setFormData({ ...formData, endTime: e.target.value })
                  }
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                备注（可选）
              </label>
              <textarea
                value={formData.note}
                onChange={(e) =>
                  setFormData({ ...formData, note: e.target.value })
                }
                placeholder="例如：我需要停一辆SUV"
                rows={3}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* 价格计算 */}
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">预计费用</span>
              <span className="text-2xl font-bold text-blue-600">
                ¥{calculatedPrice}
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              MVP阶段：线下支付
            </p>
          </div>

          <div className="mt-6 flex gap-4">
            <button
              type="submit"
              disabled={submitting || calculatedPrice === 0}
              className="flex-1 py-3 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium"
            >
              {submitting ? "提交中..." : "提交预订申请"}
            </button>
            <Link
              href={`/parking-spots/${spot.id}`}
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

export default function OrderConfirmPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">加载中...</div>
      </div>
    }>
      <OrderConfirmContent />
    </Suspense>
  );
}
