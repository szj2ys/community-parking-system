import { NextRequest, NextResponse } from "next/server";
import { successResponse, errorResponse } from "@/lib/api-response";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { maskPhoneNumber } from "@/lib/privacy";

// 获取车位详情
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json(errorResponse("UNAUTHORIZED", "请先登录"), {
        status: 401,
      });
    }

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

    // Mask phone number in response
    const maskedSpot = {
      ...spot,
      owner: {
        ...spot.owner,
        phone: maskPhoneNumber(spot.owner.phone),
      },
    };

    return NextResponse.json(successResponse(maskedSpot));
  } catch (error) {
    console.error("获取车位详情失败:", error);
    return NextResponse.json(
      errorResponse("FETCH_FAILED", "获取车位详情失败"),
      { status: 500 }
    );
  }
}

// 更新车位
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json(errorResponse("UNAUTHORIZED", "请先登录"), {
        status: 401,
      });
    }

    const spot = await prisma.parkingSpot.findUnique({
      where: { id },
    });

    if (!spot) {
      return NextResponse.json(errorResponse("NOT_FOUND", "车位不存在"), {
        status: 404,
      });
    }

    if (spot.ownerId !== session.user.id) {
      return NextResponse.json(errorResponse("FORBIDDEN", "无权操作"), {
        status: 403,
      });
    }

    const body = await request.json();
    const { status, pricePerHour, description, images } = body;

    const updatedSpot = await prisma.parkingSpot.update({
      where: { id },
      data: {
        ...(status && { status }),
        ...(pricePerHour !== undefined && { pricePerHour }),
        ...(description !== undefined && { description }),
        ...(images !== undefined && { images }),
      },
    });

    return NextResponse.json(successResponse(updatedSpot, "更新成功"));
  } catch (error) {
    console.error("更新车位失败:", error);
    return NextResponse.json(errorResponse("UPDATE_FAILED", "更新失败"), {
      status: 500,
    });
  }
}

// 删除车位
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json(errorResponse("UNAUTHORIZED", "请先登录"), {
        status: 401,
      });
    }

    const spot = await prisma.parkingSpot.findUnique({
      where: { id },
    });

    if (!spot) {
      return NextResponse.json(errorResponse("NOT_FOUND", "车位不存在"), {
        status: 404,
      });
    }

    if (spot.ownerId !== session.user.id) {
      return NextResponse.json(errorResponse("FORBIDDEN", "无权操作"), {
        status: 403,
      });
    }

    await prisma.parkingSpot.delete({
      where: { id },
    });

    return NextResponse.json(successResponse(null, "删除成功"));
  } catch (error) {
    console.error("删除车位失败:", error);
    return NextResponse.json(errorResponse("DELETE_FAILED", "删除失败"), {
      status: 500,
    });
  }
}
