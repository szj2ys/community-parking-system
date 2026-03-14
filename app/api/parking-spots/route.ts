import { NextRequest, NextResponse } from "next/server";
import { successResponse, errorResponse } from "@/lib/api-response";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { z } from "zod";
import { SpotStatus } from "@prisma/client";
import { UserRole } from "@/types";

const createSpotSchema = z.object({
  title: z.string().min(1, "请输入车位标题"),
  address: z.string().min(1, "请输入详细地址"),
  longitude: z.number().min(-180).max(180),
  latitude: z.number().min(-90).max(90),
  pricePerHour: z.number().min(0, "价格不能为负数"),
  description: z.string().optional(),
  images: z.array(z.string()).optional(),
  availableFrom: z.string().optional(),
  availableTo: z.string().optional(),
});

// 创建车位
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json(errorResponse("UNAUTHORIZED", "请先登录"), {
        status: 401,
      });
    }

    if (session.user.role !== UserRole.OWNER) {
      return NextResponse.json(
        errorResponse("FORBIDDEN", "只有业主可以发布车位"),
        { status: 403 }
      );
    }

    const body = await request.json();
    const parsed = createSpotSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        errorResponse("INVALID_DATA", "数据格式错误"),
        { status: 400 }
      );
    }

    const {
      title,
      address,
      longitude,
      latitude,
      pricePerHour,
      description,
      images,
      availableFrom,
      availableTo,
    } = parsed.data;

    // 解析时间
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const availableFromDate = availableFrom
      ? new Date(today.getTime() + parseTime(availableFrom))
      : null;
    const availableToDate = availableTo
      ? new Date(today.getTime() + parseTime(availableTo))
      : null;

    const spot = await prisma.parkingSpot.create({
      data: {
        ownerId: session.user.id,
        title,
        address,
        longitude,
        latitude,
        pricePerHour,
        description,
        images: images || [],
        availableFrom: availableFromDate,
        availableTo: availableToDate,
        status: SpotStatus.AVAILABLE,
      },
    });

    return NextResponse.json(successResponse(spot, "车位发布成功"));
  } catch (error) {
    console.error("创建车位失败:", error);
    return NextResponse.json(errorResponse("CREATE_FAILED", "发布失败"), {
      status: 500,
    });
  }
}

// 获取我的车位列表
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json(errorResponse("UNAUTHORIZED", "请先登录"), {
        status: 401,
      });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");

    const where: { ownerId: string; status?: SpotStatus } = {
      ownerId: session.user.id,
    };

    if (status) {
      where.status = status as SpotStatus;
    }

    const spots = await prisma.parkingSpot.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(successResponse(spots));
  } catch (error) {
    console.error("获取车位列表失败:", error);
    return NextResponse.json(errorResponse("FETCH_FAILED", "获取失败"), {
      status: 500,
    });
  }
}

function parseTime(timeStr: string): number {
  const [hours, minutes] = timeStr.split(":").map(Number);
  return (hours * 60 + minutes) * 60 * 1000;
}
