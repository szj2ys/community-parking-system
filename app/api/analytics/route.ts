import { NextRequest, NextResponse } from "next/server";
import { successResponse, errorResponse } from "@/lib/api-response";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

// 允许的事件类型白名单
const ALLOWED_EVENTS = [
  "page_view",
  "button_click",
  "form_submit",
  "spot_view",
  "spot_create",
  "order_create",
  "order_complete",
  "user_signup",
  "user_login",
] as const;

type AllowedEvent = (typeof ALLOWED_EVENTS)[number];

function isValidEvent(event: string): event is AllowedEvent {
  return ALLOWED_EVENTS.includes(event as AllowedEvent);
}

/**
 * POST /api/analytics
 * 接收并存储分析事件
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { event, properties = {}, userId, sessionId, pathname, referrer } = body;

    // 验证必需字段
    if (!event || typeof event !== "string") {
      return NextResponse.json(errorResponse("INVALID_EVENT", "Missing event name"), {
        status: 400,
      });
    }

    // 验证事件类型
    if (!isValidEvent(event)) {
      return NextResponse.json(errorResponse("INVALID_EVENT_TYPE", `Event "${event}" not allowed`), {
        status: 400,
      });
    }

    // 获取请求信息
    const userAgent = request.headers.get("user-agent") ?? undefined;
    const ip = request.headers.get("x-forwarded-for") ??
               request.headers.get("x-real-ip") ??
               "unknown";

    // 存储事件
    const analyticsEvent = await prisma.analyticsEvent.create({
      data: {
        event,
        properties: properties as Prisma.InputJsonValue,
        userId: userId || null,
        sessionId: sessionId || `anon-${Date.now()}`,
        pathname: pathname || "/",
        userAgent,
        referrer: referrer || null,
        ip: typeof ip === "string" ? ip.split(",")[0].trim() : null,
      },
    });

    return NextResponse.json(
      successResponse({ id: analyticsEvent.id }, "Event recorded"),
      { status: 201 }
    );
  } catch (error) {
    console.error("Analytics error:", error);
    // 分析错误不应影响用户体验，返回 200 但记录错误
    return NextResponse.json(
      successResponse({ queued: true }, "Event queued"),
      { status: 200 }
    );
  }
}

/**
 * GET /api/analytics
 * 获取分析数据（用于调试或简单的仪表板）
 */
export async function GET(request: NextRequest) {
  try {
    // 简单的聚合统计，用于验证数据收集
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") ?? "100", 10);

    const events = await prisma.analyticsEvent.findMany({
      take: limit,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        event: true,
        pathname: true,
        userId: true,
        createdAt: true,
      },
    });

    // 按事件类型分组统计
    const eventCounts = await prisma.analyticsEvent.groupBy({
      by: ["event"],
      _count: {
        event: true,
      },
    });

    return NextResponse.json(
      successResponse({
        events,
        eventCounts: eventCounts.map((e) => ({
          event: e.event,
          count: e._count.event,
        })),
        total: events.length,
      })
    );
  } catch (error) {
    console.error("Analytics fetch error:", error);
    return NextResponse.json(errorResponse("FETCH_FAILED", "Failed to fetch analytics"), {
      status: 500,
    });
  }
}
