import { NextRequest, NextResponse } from "next/server";
import { successResponse, errorResponse } from "@/lib/api-response";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { z } from "zod";

const roleSchema = z.object({
  role: z.enum(["OWNER", "TENANT"]),
});

export async function PATCH(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json(errorResponse("UNAUTHORIZED", "请先登录"), {
        status: 401,
      });
    }

    const body = await request.json();
    const parsed = roleSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(errorResponse("INVALID_ROLE", "无效的角色"), {
        status: 400,
      });
    }

    const { role } = parsed.data;

    await prisma.user.update({
      where: { id: session.user.id },
      data: { role },
    });

    return NextResponse.json(successResponse({ role }, "角色更新成功"));
  } catch (error) {
    console.error("更新角色失败:", error);
    return NextResponse.json(errorResponse("UPDATE_FAILED", "更新角色失败"), {
      status: 500,
    });
  }
}
