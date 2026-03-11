"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";

export default function RoleSelectPage() {
  const router = useRouter();
  const [selectedRole, setSelectedRole] = useState<"OWNER" | "TENANT" | null>(
    null
  );
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!selectedRole) return;

    setLoading(true);
    try {
      const res = await fetch("/api/user/role", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: selectedRole }),
      });

      const data = await res.json();

      if (data.success) {
        router.push("/");
        router.refresh();
      } else {
        alert(data.message || "设置失败");
      }
    } catch (err) {
      alert("设置失败，请重试");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-xl shadow-lg">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">选择您的角色</h1>
          <p className="mt-2 text-gray-600">您希望在平台做什么？</p>
        </div>

        <div className="mt-8 space-y-4">
          <button
            onClick={() => setSelectedRole("OWNER")}
            className={`w-full p-6 border-2 rounded-xl text-left transition-all ${
              selectedRole === "OWNER"
                ? "border-blue-500 bg-blue-50"
                : "border-gray-200 hover:border-gray-300"
            }`}
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-2xl">
                🚗
              </div>
              <div>
                <h3 className="font-semibold text-lg">我是业主</h3>
                <p className="text-gray-500 text-sm mt-1">
                  我有闲置车位，想出租赚钱
                </p>
              </div>
            </div>
          </button>

          <button
            onClick={() => setSelectedRole("TENANT")}
            className={`w-full p-6 border-2 rounded-xl text-left transition-all ${
              selectedRole === "TENANT"
                ? "border-green-500 bg-green-50"
                : "border-gray-200 hover:border-gray-300"
            }`}
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center text-2xl">
                🅿️
              </div>
              <div>
                <h3 className="font-semibold text-lg">我是租户</h3>
                <p className="text-gray-500 text-sm mt-1">
                  我需要租用车位
                </p>
              </div>
            </div>
          </button>
        </div>

        <div className="mt-8 space-y-3">
          <button
            onClick={handleSubmit}
            disabled={!selectedRole || loading}
            className="w-full py-3 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            {loading ? "保存中..." : "确认选择"}
          </button>

          <button
            onClick={() => signOut({ callbackUrl: "/auth/login" })}
            className="w-full py-3 px-4 text-gray-600 hover:text-gray-800"
          >
            退出登录
          </button>
        </div>
      </div>
    </div>
  );
}
