import { NextRequest, NextResponse } from "next/server";
import { successResponse, errorResponse } from "@/lib/api-response";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const searchSchema = z.object({
  lat: z.coerce.number().min(-90).max(90).optional(),
  lng: z.coerce.number().min(-180).max(180).optional(),
  radius: z.coerce.number().min(0.1).max(50).default(5), // 公里
  minPrice: z.coerce.number().min(0).optional(),
  maxPrice: z.coerce.number().min(0).optional(),
  status: z.enum(["AVAILABLE", "RENTED", "UNAVAILABLE"]).optional(),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const params = {
      lat: searchParams.get("lat"),
      lng: searchParams.get("lng"),
      radius: searchParams.get("radius"),
      minPrice: searchParams.get("minPrice"),
      maxPrice: searchParams.get("maxPrice"),
      status: searchParams.get("status"),
    };

    const parsed = searchSchema.safeParse(params);
    if (!parsed.success) {
      return NextResponse.json(
        errorResponse("INVALID_PARAMS", "参数格式错误"),
        { status: 400 }
      );
    }

    const { lat, lng, radius, minPrice, maxPrice, status } = parsed.data;

    // 构建查询条件
    const where: any = {};

    // 默认只显示可租的车位
    if (status) {
      where.status = status;
    } else {
      where.status = "AVAILABLE";
    }

    // 价格筛选
    if (minPrice !== undefined || maxPrice !== undefined) {
      where.pricePerHour = {};
      if (minPrice !== undefined) where.pricePerHour.gte = minPrice;
      if (maxPrice !== undefined) where.pricePerHour.lte = maxPrice;
    }

    // 位置筛选 (如果提供了经纬度)
    if (lat !== undefined && lng !== undefined) {
      // 简化的距离计算：使用经纬度范围
      // 1度纬度 ≈ 111km, 1度经度 ≈ 111km * cos(纬度)
      const latDelta = radius / 111;
      const lngDelta = radius / (111 * Math.cos((lat * Math.PI) / 180));

      where.latitude = {
        gte: lat - latDelta,
        lte: lat + latDelta,
      };
      where.longitude = {
        gte: lng - lngDelta,
        lte: lng + lngDelta,
      };
    }

    const spots = await prisma.parkingSpot.findMany({
      where,
      include: {
        owner: {
          select: { id: true, name: true },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    // 计算实际距离并排序
    const spotsWithDistance = spots.map((spot: { latitude: number; longitude: number; [key: string]: unknown }) => {
      let distance = null;
      if (lat !== undefined && lng !== undefined) {
        // 简化的 Haversine 距离计算
        const R = 6371; // 地球半径 km
        const dLat = ((spot.latitude - lat) * Math.PI) / 180;
        const dLng = ((spot.longitude - lng) * Math.PI) / 180;
        const a =
          Math.sin(dLat / 2) * Math.sin(dLat / 2) +
          Math.cos((lat * Math.PI) / 180) *
            Math.cos((spot.latitude * Math.PI) / 180) *
            Math.sin(dLng / 2) *
            Math.sin(dLng / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        distance = R * c;
      }
      return { ...spot, distance };
    });

    // 按距离排序
    if (lat !== undefined && lng !== undefined) {
      spotsWithDistance.sort((a: { distance?: number | null }, b: { distance?: number | null }) => (a.distance || 0) - (b.distance || 0));
    }

    return NextResponse.json(successResponse(spotsWithDistance));
  } catch (error) {
    console.error("搜索车位失败:", error);
    return NextResponse.json(errorResponse("SEARCH_FAILED", "搜索失败"), {
      status: 500,
    });
  }
}
