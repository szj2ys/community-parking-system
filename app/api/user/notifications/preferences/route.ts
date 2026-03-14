import { NextRequest, NextResponse } from "next/server";
import { successResponse, errorResponse } from "@/lib/api-response";
import { auth } from "@/lib/auth";
import {
  getUserNotificationPrefs,
  updateUserNotificationPrefs,
} from "@/lib/notifications";
import {
  defaultNotificationPrefs,
  validateNotificationPrefs,
  NotificationPrefs,
} from "@/lib/notification-templates";

/**
 * GET /api/user/notifications/preferences
 * 获取当前用户的通知偏好设置
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json(errorResponse("UNAUTHORIZED", "请先登录"), {
        status: 401,
      });
    }

    const userId = (session.user as { id: string }).id;
    const prefs = await getUserNotificationPrefs(userId);

    return NextResponse.json(successResponse(prefs));
  } catch (error) {
    console.error("获取通知偏好失败:", error);
    return NextResponse.json(
      errorResponse("FETCH_FAILED", "获取通知偏好设置失败"),
      { status: 500 }
    );
  }
}

/**
 * POST /api/user/notifications/preferences
 * 更新当前用户的通知偏好设置
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json(errorResponse("UNAUTHORIZED", "请先登录"), {
        status: 401,
      });
    }

    const body = await request.json();

    // 验证请求体结构
    if (!body || typeof body !== "object") {
      return NextResponse.json(
        errorResponse("INVALID_DATA", "请求数据格式错误"),
        { status: 400 }
      );
    }

    // 验证并清理通知偏好数据
    const prefs = validateNotificationPrefs(body);

    const userId = (session.user as { id: string }).id;
    await updateUserNotificationPrefs(userId, prefs);

    return NextResponse.json(successResponse(prefs, "通知偏好设置已更新"));
  } catch (error) {
    console.error("更新通知偏好失败:", error);
    return NextResponse.json(
      errorResponse("UPDATE_FAILED", "更新通知偏好设置失败"),
      { status: 500 }
    );
  }
}

/**
 * PUT /api/user/notifications/preferences
 * 更新当前用户的通知偏好设置（与POST相同，支持RESTful）
 */
export async function PUT(request: NextRequest) {
  return POST(request);
}
