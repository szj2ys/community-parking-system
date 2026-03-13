import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// 简化的中间件 - 不使用 NextAuth 以减少 Edge Function 大小
export function middleware(req: NextRequest) {
  const { nextUrl, cookies } = req;

  // 检查是否有 auth session cookie (next-auth.session-token)
  const hasSession = cookies.has("next-auth.session-token") || cookies.has("__Secure-next-auth.session-token");

  // 公开路由
  const publicRoutes = ["/auth/login", "/auth/error", "/api/auth"];
  const isPublicRoute = publicRoutes.some((route) =>
    nextUrl.pathname.startsWith(route)
  );

  // API路由不需要中间件处理
  if (nextUrl.pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  // 未登录用户只能访问公开路由
  if (!hasSession && !isPublicRoute) {
    return NextResponse.redirect(new URL("/auth/login", nextUrl));
  }

  // 已登录用户访问登录页，重定向到首页
  if (hasSession && nextUrl.pathname === "/auth/login") {
    return NextResponse.redirect(new URL("/", nextUrl));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|public/).*)"],
};
