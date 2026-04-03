import { mkdir, writeFile } from "fs/promises";
import { NextRequest, NextResponse } from "next/server";
import path from "path";

const UPLOAD_BASE =
  process.env.UPLOAD_DIR || path.join(process.cwd(), "public");

export async function POST(request: NextRequest) {
  try {
    let formData: FormData;
    try {
      formData = await request.formData();
    } catch {
      return NextResponse.json({ message: "파일이 없습니다" }, { status: 400 });
    }

    const file = formData.get("file") as File | null;

    if (!file || file.size === 0) {
      return NextResponse.json({ message: "파일이 없습니다" }, { status: 400 });
    }

    if (file.size > 4 * 1024 * 1024) {
      return NextResponse.json(
        { message: "파일 크기는 4MB 이하여야 합니다" },
        { status: 400 },
      );
    }

    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { message: "JPG, PNG, WebP, GIF 형식만 업로드 가능합니다" },
        { status: 400 },
      );
    }

    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    const ext = file.name.split(".").pop() || "jpg";
    const fileName = `${timestamp}-${random}.${ext}`;

    const uploadDir = path.join(UPLOAD_BASE, "uploads", "designs");
    await mkdir(uploadDir, { recursive: true });

    const buffer = Buffer.from(await file.arrayBuffer());
    const filePath = path.join(uploadDir, fileName);
    await writeFile(filePath, buffer);

    // ★ API route 경로로 변경 (standalone 모드 호환)
    const url = `/api/uploads/designs?file=${fileName}`;

    return NextResponse.json({ url }, { status: 201 });
  } catch (error) {
    console.error("파일 업로드 오류:", error);
    return NextResponse.json(
      { message: "파일 업로드에 실패했습니다" },
      { status: 500 },
    );
  }
}
