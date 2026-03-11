import { NextResponse } from "next/server";
import { successResponse, errorResponse } from "@/lib/api-response";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json(errorResponse("UNAUTHORIZED", "请先登录"), {
        status: 401,
      });
    }

    const spots = await prisma.parkingSpot.findMany({
      where: { ownerId: session.user.id },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(successResponse(spots));
  } catch (error) {
    console.error("获取车位列表失败:", error);
    return NextResponse.json(
      errorResponse("FETCH_FAILED", "获取车位列表失败"),
      { status: 500 }
    );
  }
}
