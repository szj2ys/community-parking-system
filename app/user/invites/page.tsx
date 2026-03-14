"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getReferralLink } from "@/lib/referral";

interface ReferralData {
  referralCode: string;
  referralRewards: number;
  invitedCount: number;
  invitedUsers: Array<{
    id: string;
    name: string | null;
    phone: string;
    createdAt: string;
    rewardAmount: number;
  }>;
}

export default function InvitesPage() {
  const [data, setData] = useState<ReferralData | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchReferralData();
  }, []);

  const fetchReferralData = async () => {
    try {
      const res = await fetch("/api/user/referrals");
      const result = await res.json();
      if (result.success) {
        setData(result.data);
      } else {
        setError(result.message || "获取数据失败");
      }
    } catch (err) {
      setError("获取邀请数据失败");
    } finally {
      setLoading(false);
    }
  };

  const handleCopyCode = () => {
    if (data?.referralCode) {
      navigator.clipboard.writeText(data.referralCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleCopyLink = () => {
    if (data?.referralCode) {
      const link = getReferralLink(data.referralCode);
      navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleShareWeChat = () => {
    alert("请复制链接后分享给微信好友");
  };

  // 计算待发放奖励（已邀请但未触发首单）
  const pendingRewards = data?.invitedUsers.filter(
    (u) => u.rewardAmount === 0
  ).length || 0;

  // 计算已发放奖励人数
  const rewardedCount = data?.invitedUsers.filter(
    (u) => u.rewardAmount > 0
  ).length || 0;

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
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link href="/" className="text-gray-600 hover:text-gray-900">
            ← 返回
          </Link>
          <h1 className="text-xl font-bold">我的邀请</h1>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        {error && (
          <div className="p-4 bg-red-50 text-red-600 rounded-lg">{error}</div>
        )}

        {/* 邀请码卡片 */}
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 text-white shadow-lg">
          <div className="text-center">
            <p className="text-blue-100 text-sm mb-2">我的邀请码</p>
            <div className="text-4xl font-bold tracking-wider mb-4">
              {data?.referralCode || "------"}
            </div>
            <button
              onClick={handleCopyCode}
              className="px-6 py-2 bg-white/20 hover:bg-white/30 rounded-full text-sm font-medium transition-colors"
            >
              {copied ? "✓ 已复制" : "复制邀请码"}
            </button>
          </div>

          <div className="mt-6 pt-6 border-t border-white/20">
            <p className="text-blue-100 text-xs text-center">
              邀请好友注册，当他们完成首单时，您将获得订单金额 10% 的奖励（最高 ¥50）
            </p>
          </div>
        </div>

        {/* 分享按钮 */}
        <div className="bg-white rounded-xl shadow p-4">
          <p className="text-sm text-gray-500 mb-3">分享给好友</p>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={handleCopyLink}
              className="flex items-center justify-center gap-2 py-3 px-4 bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-700 font-medium transition-colors"
            >
              <span>📋</span>
              复制链接
            </button>
            <button
              onClick={handleShareWeChat}
              className="flex items-center justify-center gap-2 py-3 px-4 bg-green-500 hover:bg-green-600 rounded-lg text-white font-medium transition-colors"
            >
              <span>💬</span>
              微信分享
            </button>
          </div>
        </div>

        {/* 统计数据 */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white rounded-xl shadow p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">
              {data?.invitedCount || 0}
            </div>
            <div className="text-xs text-gray-500 mt-1">已邀请</div>
          </div>
          <div className="bg-white rounded-xl shadow p-4 text-center">
            <div className="text-2xl font-bold text-green-600">
              {rewardedCount}
            </div>
            <div className="text-xs text-gray-500 mt-1">已奖励</div>
          </div>
          <div className="bg-white rounded-xl shadow p-4 text-center">
            <div className="text-2xl font-bold text-orange-600">
              {pendingRewards}
            </div>
            <div className="text-xs text-gray-500 mt-1">待发放</div>
          </div>
        </div>

        {/* 累计奖励 */}
        <div className="bg-white rounded-xl shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">累计获得奖励</p>
              <div className="text-3xl font-bold text-green-600 mt-1">
                ¥{data?.referralRewards.toFixed(2) || "0.00"}
              </div>
            </div>
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <span className="text-3xl">🎁</span>
            </div>
          </div>
        </div>

        {/* 邀请记录 */}
        <div className="bg-white rounded-xl shadow">
          <div className="p-4 border-b">
            <h2 className="font-semibold text-gray-900">邀请记录</h2>
          </div>

          <div className="divide-y">
            {data?.invitedUsers && data.invitedUsers.length > 0 ? (
              data.invitedUsers.map((user) => (
                <div key={user.id} className="p-4 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">
                      {user.name || user.phone.replace(/(\d{3})\d{4}(\d{4})/, "$1****$2")}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      注册于 {new Date(user.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    {user.rewardAmount > 0 ? (
                      <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                        +¥{user.rewardAmount.toFixed(2)}
                      </span>
                    ) : (
                      <span className="px-3 py-1 bg-gray-100 text-gray-500 rounded-full text-sm">
                        待首单
                      </span>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center">
                <div className="text-4xl mb-4">📭</div>
                <p className="text-gray-500">还没有邀请记录</p>
                <p className="text-sm text-gray-400 mt-2">
                  分享您的邀请码，邀请好友加入
                </p>
              </div>
            )}
          </div>
        </div>

        {/* 规则说明 */}
        <div className="bg-blue-50 rounded-xl p-4">
          <h3 className="font-medium text-blue-900 mb-2">邀请规则</h3>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>1. 好友通过您的邀请码注册，即建立邀请关系</li>
            <li>2. 好友完成首单后，您将获得订单金额 10% 的奖励</li>
            <li>3. 每笔邀请奖励最高 ¥50</li>
            <li>4. 奖励会自动计入您的账户余额</li>
          </ul>
        </div>
      </main>
    </div>
  );
}
