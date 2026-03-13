import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/options?category=PRINT_TYPE
 * 카테고리별 시스템 옵션 조회
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const category = searchParams.get("category") || "";

    if (!category) {
      return NextResponse.json(
        { message: "category 파라미터는 필수입니다" },
        { status: 400 },
      );
    }

    const options = await prisma.systemOption.findMany({
      where: {
        category,
        isActive: true,
      },
      orderBy: { sortOrder: "asc" },
      select: {
        id: true,
        label: true,
        value: true,
      },
    });

    return NextResponse.json(options);
  } catch (error) {
    console.error("시스템옵션 조회 오류:", error);
    return NextResponse.json(
      { message: "서버 오류가 발생했습니다" },
      { status: 500 },
    );
  }
}
