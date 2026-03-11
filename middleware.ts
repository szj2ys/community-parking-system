import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;
  const user = req.auth?.user;

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

  // 检查是否需要选择角色
  if (
    isLoggedIn &&
    user?.role === "TENANT" &&
    !user?.name && // 新用户没有名字，需要选择角色
    nextUrl.pathname !== "/auth/role-select"
  ) {
    // 首次登录，需要选择角色
    // 这里简化处理，实际应该检查是否是新用户
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|public/).*)"],
};
