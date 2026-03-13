import { auth } from "@/lib/auth";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const session = await auth();
  const user = session?.user;
  const isOwner = user?.role === "OWNER";
  const isTenant = user?.role === "TENANT";

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold">社区车位租赁</h1>
          <div className="flex items-center gap-4">
            {user && (
              <span className="text-sm text-gray-600">
                {user.phone}
                <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs">
                  {isOwner ? "业主" : "租户"}
                </span>
              </span>
            )}
            <Link
              href="/api/auth/signout"
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              退出
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Welcome */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900">
            欢迎回来，{isOwner ? "业主" : "租户"}！
          </h2>
          <p className="text-gray-600 mt-2">
            {isOwner
              ? "管理您的车位，让闲置资源创造价值"
              : "发现附近车位，解决停车难题"}
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {isOwner && (
            <>
              <Link
                href="/owner/publish"
                className="p-6 bg-white rounded-xl shadow hover:shadow-md transition-shadow"
              >
                <div className="text-3xl mb-4">📍</div>
                <h3 className="font-semibold text-lg">发布车位</h3>
                <p className="text-gray-500 text-sm mt-2">
                  添加新的车位信息
                </p>
              </Link>
              <Link
                href="/owner/spots"
                className="p-6 bg-white rounded-xl shadow hover:shadow-md transition-shadow"
              >
                <div className="text-3xl mb-4">🚗</div>
                <h3 className="font-semibold text-lg">我的车位</h3>
                <p className="text-gray-500 text-sm mt-2">
                  管理已发布的车位
                </p>
              </Link>
              <Link
                href="/owner/orders"
                className="p-6 bg-white rounded-xl shadow hover:shadow-md transition-shadow"
              >
                <div className="text-3xl mb-4">📋</div>
                <h3 className="font-semibold text-lg">预订管理</h3>
                <p className="text-gray-500 text-sm mt-2">
                  查看和处理预订请求
                </p>
              </Link>
            </>
          )}

          {isTenant && (
            <>
              <Link
                href="/tenant/map"
                className="p-6 bg-white rounded-xl shadow hover:shadow-md transition-shadow"
              >
                <div className="text-3xl mb-4">🗺️</div>
                <h3 className="font-semibold text-lg">地图找车位</h3>
                <p className="text-gray-500 text-sm mt-2">
                  在地图上发现附近车位
                </p>
              </Link>
              <Link
                href="/tenant/list"
                className="p-6 bg-white rounded-xl shadow hover:shadow-md transition-shadow"
              >
                <div className="text-3xl mb-4">📃</div>
                <h3 className="font-semibold text-lg">列表找车位</h3>
                <p className="text-gray-500 text-sm mt-2">
                  按条件筛选车位
                </p>
              </Link>
              <Link
                href="/tenant/orders"
                className="p-6 bg-white rounded-xl shadow hover:shadow-md transition-shadow"
              >
                <div className="text-3xl mb-4">📋</div>
                <h3 className="font-semibold text-lg">我的预订</h3>
                <p className="text-gray-500 text-sm mt-2">
                  查看我的预订记录
                </p>
              </Link>
            </>
          )}
        </div>

        {/* Stats */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 bg-white rounded-xl shadow">
            <div className="text-2xl font-bold text-blue-600">0</div>
            <div className="text-gray-500 text-sm">
              {isOwner ? "已发布车位" : "已完成预订"}
            </div>
          </div>
          <div className="p-6 bg-white rounded-xl shadow">
            <div className="text-2xl font-bold text-green-600">0</div>
            <div className="text-gray-500 text-sm">
              {isOwner ? "本月收益" : "节省费用"}
            </div>
          </div>
          <div className="p-6 bg-white rounded-xl shadow">
            <div className="text-2xl font-bold text-purple-600">0</div>
            <div className="text-gray-500 text-sm">待处理</div>
          </div>
        </div>
      </main>
    </div>
  );
}
