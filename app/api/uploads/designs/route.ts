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

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const fileName = searchParams.get("file");

  if (!fileName) {
    return NextResponse.json({ message: "파일명이 없습니다" }, { status: 400 });
  }

  // 경로 조작 방지
  const safeName = path.basename(fileName);
  const filePath = path.join(UPLOAD_BASE, "uploads", "designs", safeName);

  if (!existsSync(filePath)) {
    return NextResponse.json({ message: "파일을 찾을 수 없습니다" }, { status: 404 });
  }

  const buffer = await readFile(filePath);
  const ext = path.extname(filePath).toLowerCase();
  const mime = MIME_MAP[ext] || "application/octet-stream";

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": mime,
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
