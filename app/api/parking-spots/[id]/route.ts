import { NextRequest, NextResponse } from "next/server";
import { successResponse, errorResponse } from "@/lib/api-response";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { z } from "zod";

// 更新车位
const updateSpotSchema = z.object({
  title: z.string().min(2).max(100).optional(),
  address: z.string().min(5).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  latitude: z.number().min(-90).max(90).optional(),
  pricePerHour: z.number().min(1).max(1000).optional(),
  description: z.string().optional(),
  images: z.array(z.string()).max(5).optional(),
  status: z.enum(["AVAILABLE", "UNAVAILABLE"]).optional(),
  availableFrom: z.string().optional(),
  availableTo: z.string().optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const spot = await prisma.parkingSpot.findUnique({
      where: { id },
      include: {
        owner: {
          select: { id: true, name: true, phone: true },
        },
      },
    });

    if (!spot) {
      return NextResponse.json(errorResponse("NOT_FOUND", "车位不存在"), {
        status: 404,
      });
    }

    return NextResponse.json(successResponse(spot));
  } catch (error) {
    console.error("获取车位详情失败:", error);
    return NextResponse.json(
      errorResponse("FETCH_FAILED", "获取车位详情失败"),
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    const { id } = await params;

    if (!session?.user) {
      return NextResponse.json(errorResponse("UNAUTHORIZED", "请先登录"), {
        status: 401,
      });
    }

    const existingSpot = await prisma.parkingSpot.findUnique({
      where: { id },
    });

    if (!existingSpot) {
      return NextResponse.json(errorResponse("NOT_FOUND", "车位不存在"), {
        status: 404,
      });
    }

    if (existingSpot.ownerId !== session.user.id) {
      return NextResponse.json(errorResponse("FORBIDDEN", "无权操作此车位"), {
        status: 403,
      });
    }

    const body = await request.json();
    const parsed = updateSpotSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        errorResponse("INVALID_DATA", "数据格式错误"),
        { status: 400 }
      );
    }

    const updatedSpot = await prisma.parkingSpot.update({
      where: { id },
      data: parsed.data,
    });

    return NextResponse.json(successResponse(updatedSpot, "更新成功"));
  } catch (error) {
    console.error("更新车位失败:", error);
    return NextResponse.json(errorResponse("UPDATE_FAILED", "更新车位失败"), {
      status: 500,
    });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    const { id } = await params;

    if (!session?.user) {
      return NextResponse.json(errorResponse("UNAUTHORIZED", "请先登录"), {
        status: 401,
      });
    }

    const existingSpot = await prisma.parkingSpot.findUnique({
      where: { id },
    });

    if (!existingSpot) {
      return NextResponse.json(errorResponse("NOT_FOUND", "车位不存在"), {
        status: 404,
      });
    }

    if (existingSpot.ownerId !== session.user.id) {
      return NextResponse.json(errorResponse("FORBIDDEN", "无权操作此车位"), {
        status: 403,
      });
    }

    await prisma.parkingSpot.delete({
      where: { id },
    });

    return NextResponse.json(successResponse(null, "删除成功"));
  } catch (error) {
    console.error("删除车位失败:", error);
    return NextResponse.json(errorResponse("DELETE_FAILED", "删除车位失败"), {
      status: 500,
    });
  }
}
