"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  NotificationPrefs,
  NotificationType,
  NotificationChannel,
  notificationTypeNames,
  defaultNotificationPrefs,
} from "@/lib/notification-templates";

const notificationTypeList: NotificationType[] = [
  "NEW_ORDER",
  "PAYMENT_SUCCESS",
  "ORDER_CANCELLED",
];

const channelList: { key: NotificationChannel; label: string; description: string }[] = [
  { key: "SMS", label: "短信通知", description: "通过短信发送通知" },
  { key: "WECHAT", label: "微信通知", description: "通过微信订阅消息发送" },
];

export default function NotificationSettingsPage() {
  const [prefs, setPrefs] = useState<NotificationPrefs>(defaultNotificationPrefs);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // 加载用户通知偏好
  useEffect(() => {
    async function loadPrefs() {
      try {
        const response = await fetch("/api/user/notifications/preferences");
        const result = await response.json();

        if (result.success && result.data) {
          setPrefs(result.data);
        }
      } catch (error) {
        console.error("加载通知偏好失败:", error);
        setMessage({ type: "error", text: "加载设置失败，请刷新页面重试" });
      } finally {
        setLoading(false);
      }
    }

    loadPrefs();
  }, []);

  // 保存设置
  async function savePrefs() {
    setSaving(true);
    setMessage(null);

    try {
      const response = await fetch("/api/user/notifications/preferences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(prefs),
      });

      const result = await response.json();

      if (result.success) {
        setMessage({ type: "success", text: "设置已保存" });
        setTimeout(() => setMessage(null), 3000);
      } else {
        setMessage({ type: "error", text: result.message || "保存失败" });
      }
    } catch (error) {
      console.error("保存通知偏好失败:", error);
      setMessage({ type: "error", text: "保存失败，请稍后重试" });
    } finally {
      setSaving(false);
    }
  }

  // 切换通知设置
  function togglePref(type: NotificationType, channel: NotificationChannel) {
    setPrefs((prev) => ({
      ...prev,
      [type]: {
        ...prev[type],
        [channel]: !prev[type][channel],
      },
    }));
  }

  // 启用/禁用全部通知
  function toggleAll(enabled: boolean) {
    const newPrefs: NotificationPrefs = { ...prefs };
    for (const type of notificationTypeList) {
      for (const channel of channelList) {
        newPrefs[type][channel.key] = enabled;
      }
    }
    setPrefs(newPrefs);
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">加载中...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold">通知设置</h1>
          <Link href="/" className="text-sm text-blue-600 hover:text-blue-700">
            返回首页
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-3xl mx-auto px-4 py-8">
        {/* Description */}
        <div className="mb-6">
          <p className="text-gray-600">
            设置您希望接收的通知类型和渠道。建议开启新订单通知以确保及时响应预订请求。
          </p>
        </div>

        {/* Quick Actions */}
        <div className="mb-6 flex gap-3">
          <button
            onClick={() => toggleAll(true)}
            className="px-4 py-2 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
          >
            全部开启
          </button>
          <button
            onClick={() => toggleAll(false)}
            className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            全部关闭
          </button>
        </div>

        {/* Notification Settings */}
        <div className="bg-white rounded-xl shadow overflow-hidden">
          {notificationTypeList.map((type, typeIndex) => (
            <div
              key={type}
              className={`p-6 ${typeIndex !== notificationTypeList.length - 1 ? "border-b border-gray-100" : ""}`}
            >
              <h3 className="font-semibold text-lg text-gray-900 mb-4">
                {notificationTypeNames[type]}
              </h3>

              <div className="space-y-4">
                {channelList.map((channel) => (
                  <div key={channel.key} className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="font-medium text-gray-700">{channel.label}</div>
                      <div className="text-sm text-gray-500">{channel.description}</div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer ml-4">
                      <input
                        type="checkbox"
                        checked={prefs[type][channel.key]}
                        onChange={() => togglePref(type, channel.key)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Save Button */}
        <div className="mt-8 flex items-center justify-between">
          <div>
            {message && (
              <div
                className={`text-sm ${message.type === "success" ? "text-green-600" : "text-red-600"}`}
              >
                {message.text}
              </div>
            )}
          </div>
          <button
            onClick={savePrefs}
            disabled={saving}
            className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {saving ? "保存中..." : "保存设置"}
          </button>
        </div>

        {/* Tips */}
        <div className="mt-8 p-4 bg-blue-50 rounded-lg">
          <h4 className="font-medium text-blue-900 mb-2">提示</h4>
          <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
            <li>微信通知需要您先关注公众号并授权接收订阅消息</li>
            <li>短信通知可能会产生运营商费用</li>
            <li>建议至少开启一种通知渠道以确保不会错过重要信息</li>
          </ul>
        </div>
      </main>
    </div>
  );
}
