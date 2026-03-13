import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export default auth((req) => {
  const { nextUrl } = req;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const authData = (req as any).auth;
  const isLoggedIn = !!authData;
  const user = authData?.user;

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
  if (!isLoggedIn && !isPublicRoute) {
    return NextResponse.redirect(new URL("/auth/login", nextUrl));
  }

  // 已登录用户访问登录页，重定向到首页
  if (isLoggedIn && nextUrl.pathname === "/auth/login") {
    return NextResponse.redirect(new URL("/", nextUrl));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|public/).*)"],
};
