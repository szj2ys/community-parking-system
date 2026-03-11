import { NextRequest, NextResponse } from "next/server";
import { successResponse, errorResponse } from "@/lib/api-response";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { z } from "zod";

const createSpotSchema = z.object({
  title: z.string().min(2, "标题至少2个字符").max(100, "标题最多100个字符"),
  address: z.string().min(5, "地址至少5个字符"),
  longitude: z.number().min(-180).max(180),
  latitude: z.number().min(-90).max(90),
  pricePerHour: z.number().min(1, "价格至少1元").max(1000, "价格最多1000元"),
  description: z.string().optional(),
  images: z.array(z.string()).max(5, "最多5张图片"),
  availableFrom: z.string().optional(), // HH:mm 格式
  availableTo: z.string().optional(), // HH:mm 格式
});

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json(errorResponse("UNAUTHORIZED", "请先登录"), {
        status: 401,
      });
    }

    if ((session.user as any).role !== "OWNER") {
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

    const spot = await prisma.parkingSpot.create({
      data: {
        ownerId: session.user.id!,
        title,
        address,
        longitude,
        latitude,
        pricePerHour,
        description,
        images,
        availableFrom: availableFrom
          ? new Date(`2000-01-01T${availableFrom}:00`)
          : null,
        availableTo: availableTo
          ? new Date(`2000-01-01T${availableTo}:00`)
          : null,
      },
    });

    return NextResponse.json(successResponse(spot, "车位发布成功"));
  } catch (error) {
    console.error("发布车位失败:", error);
    return NextResponse.json(errorResponse("CREATE_FAILED", "发布车位失败"), {
      status: 500,
    });
  }
}
