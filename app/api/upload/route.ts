import { mkdir, writeFile } from "fs/promises";
import { NextRequest, NextResponse } from "next/server";
import path from "path";

/**
 * POST /api/upload — 로컬 디자인 시안 이미지 업로드
 * multipart/form-data로 file 필드 전송
 * public/uploads/designs/ 폴더에 저장
 */
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

    // 파일 크기 제한 (4MB)
    if (file.size > 4 * 1024 * 1024) {
      return NextResponse.json(
        { message: "파일 크기는 4MB 이하여야 합니다" },
        { status: 400 },
      );
    }

    // 이미지 타입 확인
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { message: "JPG, PNG, WebP, GIF 형식만 업로드 가능합니다" },
        { status: 400 },
      );
    }

    // 고유 파일명 생성 (충돌 방지)
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    const ext = file.name.split(".").pop() || "jpg";
    const fileName = `${timestamp}-${random}.${ext}`;

    // 저장 폴더 생성
    const uploadDir = path.join(process.cwd(), "public", "uploads", "designs");
    await mkdir(uploadDir, { recursive: true });

    // 파일 저장
    const buffer = Buffer.from(await file.arrayBuffer());
    const filePath = path.join(uploadDir, fileName);
    await writeFile(filePath, buffer);

    // 브라우저에서 접근 가능한 URL 반환
    const url = `/uploads/designs/${fileName}`;

    return NextResponse.json({ url }, { status: 201 });
  } catch (error) {
    console.error("파일 업로드 오류:", error);
    return NextResponse.json(
      { message: "파일 업로드에 실패했습니다" },
      { status: 500 },
    );
  }
}
