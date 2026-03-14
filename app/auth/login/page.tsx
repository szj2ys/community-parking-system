"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { track } from "@/lib/analytics";

export default function LoginPage() {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const sendCode = async () => {
    if (!/^1[3-9]\d{9}$/.test(phone)) {
      setError("请输入有效的手机号");
      return;
    }

    setIsSending(true);
    setError("");

    try {
      const res = await fetch("/api/auth/send-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });

      const data = await res.json();

      if (data.success) {
        setCountdown(60);
        const timer = setInterval(() => {
          setCountdown((c) => {
            if (c <= 1) {
              clearInterval(timer);
              setIsSending(false);
              return 0;
            }
            return c - 1;
          });
        }, 1000);
      } else {
        setError(data.message || "发送验证码失败");
        setIsSending(false);
      }
    } catch (err) {
      setError("发送验证码失败，请重试");
      setIsSending(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await signIn("credentials", {
        phone,
        code,
        redirect: false,
      });

      if (result?.error) {
        setError("验证码错误或已过期");
      } else {
        // Track successful login/signup
        track("user_login", { phone });
        // 登录成功，跳转到首页
        router.push("/");
        router.refresh();
      }
    } catch (err) {
      setError("登录失败，请重试");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-xl shadow-lg">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">社区车位租赁</h1>
          <p className="mt-2 text-gray-600">登录或注册账号</p>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          {error && (
            <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700">
              手机号
            </label>
            <div className="mt-1 flex gap-2">
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="请输入手机号"
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                maxLength={11}
              />
              <button
                type="button"
                onClick={sendCode}
                disabled={isSending || countdown > 0}
                className="px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
              >
                {countdown > 0 ? `${countdown}s` : "获取验证码"}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              验证码
            </label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="请输入6位验证码"
              className="mt-1 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              maxLength={6}
            />
            <p className="mt-1 text-xs text-gray-500">
              MVP阶段：输入任意6位数字即可
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            {loading ? "登录中..." : "登录 / 注册"}
          </button>
        </form>
      </div>
    </div>
  );
}
