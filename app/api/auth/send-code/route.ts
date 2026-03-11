import { NextRequest, NextResponse } from "next/server";
import { successResponse, errorResponse } from "@/lib/api-response";
import { generateCode } from "@/lib/auth";
import { z } from "zod";

const phoneSchema = z.object({
  phone: z.string().regex(/^1[3-9]\d{9}$/, "无效的手机号"),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = phoneSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(errorResponse("INVALID_PHONE", "无效的手机号"), {
        status: 400,
      });
    }

    const { phone } = parsed.data;

    // MVP阶段：生成并返回验证码
    // 生产环境：发送到用户手机
    const code = generateCode(phone);

    // 模拟发送短信
    console.log(`验证码已发送到 ${phone}: ${code}`);

    return NextResponse.json(
      successResponse({ sent: true }, "验证码已发送")
    );
  } catch (error) {
    console.error("发送验证码失败:", error);
    return NextResponse.json(errorResponse("SEND_FAILED", "发送验证码失败"), {
      status: 500,
    });
  }
}
