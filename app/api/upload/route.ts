import { NextRequest, NextResponse } from "next/server";
import { successResponse, errorResponse } from "@/lib/api-response";
import { auth } from "@/lib/auth";
import { put } from "@vercel/blob";

// 允许的图片类型
const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
];
const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB

// 上传图片
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json(errorResponse("UNAUTHORIZED", "请先登录"), {
        status: 401,
      });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        errorResponse("NO_FILE", "请选择要上传的文件"),
        { status: 400 }
      );
    }

    // 验证文件类型
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      return NextResponse.json(
        errorResponse("INVALID_TYPE", "仅支持 JPG、PNG、WebP、HEIC 格式图片"),
        { status: 400 }
      );
    }

    // 验证文件大小
    if (file.size > MAX_IMAGE_SIZE) {
      return NextResponse.json(
        errorResponse("FILE_TOO_LARGE", "图片大小不能超过 5MB"),
        { status: 400 }
      );
    }

    // 生成唯一文件名
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 10);
    const extension = file.name.split(".").pop() || "jpg";
    const filename = `parking-spots/${session.user.id}/${timestamp}-${random}.${extension}`;

    // 上传到 Vercel Blob
    const blob = await put(filename, file, {
      access: "public",
      contentType: file.type,
    });

    return NextResponse.json(
      successResponse({ url: blob.url, pathname: blob.pathname }, "上传成功")
    );
  } catch (error) {
    console.error("上传图片失败:", error);
    return NextResponse.json(errorResponse("UPLOAD_FAILED", "上传失败"), {
      status: 500,
    });
  }
}
