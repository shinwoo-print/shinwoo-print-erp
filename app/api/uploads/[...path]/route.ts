import { existsSync } from "fs";
import { readFile } from "fs/promises";
import { NextRequest, NextResponse } from "next/server";
import path from "path";

const UPLOAD_BASE =
  process.env.UPLOAD_DIR || path.join(process.cwd(), "public");

const MIME_MAP: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".gif": "image/gif",
};

type RouteParams = { params: Promise<{ path: string[] }> };

export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const { path: segments } = await params;

    // 경로 조합: /api/uploads/designs/xxx.jpg -> uploads/designs/xxx.jpg
    const relativePath = path.join("uploads", ...segments);
    const filePath = path.join(UPLOAD_BASE, relativePath);

    // 디렉토리 트래버설 방지
    const resolved = path.resolve(filePath);
    const base = path.resolve(UPLOAD_BASE);
    if (!resolved.startsWith(base)) {
      return NextResponse.json(
        { message: "잘못된 경로입니다" },
        { status: 400 }
      );
    }

    if (!existsSync(filePath)) {
      return NextResponse.json(
        { message: "파일을 찾을 수 없습니다" },
        { status: 404 }
      );
    }

    const buffer = await readFile(filePath);
    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_MAP[ext] || "application/octet-stream";

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (error) {
    console.error("파일 서빙 오류:", error);
    return NextResponse.json(
      { message: "파일 로드에 실패했습니다" },
      { status: 500 }
    );
  }
}
