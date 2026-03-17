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
        sortOrder: true,
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

const optionCreateSchema = {
  category: (v: unknown) =>
    typeof v === "string" && v.length > 0 && v.length <= 50,
  label: (v: unknown) =>
    typeof v === "string" && v.length > 0 && v.length <= 100,
  value: (v: unknown) =>
    typeof v === "string" && v.length > 0 && v.length <= 100,
  sortOrder: (v: unknown) =>
    v === undefined || (typeof v === "number" && Number.isInteger(v) && v >= 0),
};

/**
 * POST /api/options — 시스템 옵션 생성 (category 필수, sortOrder 미지정 시 마지막+1)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const category =
      typeof body?.category === "string" ? body.category.trim() : "";
    const label = typeof body?.label === "string" ? body.label.trim() : "";
    const value = typeof body?.value === "string" ? body.value.trim() : "";

    if (!optionCreateSchema.category(category)) {
      return NextResponse.json(
        { message: "category는 필수이며 50자 이내입니다" },
        { status: 400 }
      );
    }
    if (!optionCreateSchema.label(label)) {
      return NextResponse.json(
        { message: "label은 필수이며 100자 이내입니다" },
        { status: 400 }
      );
    }
    if (!optionCreateSchema.value(value)) {
      return NextResponse.json(
        { message: "value는 필수이며 100자 이내입니다" },
        { status: 400 }
      );
    }
    if (!optionCreateSchema.sortOrder(body?.sortOrder)) {
      return NextResponse.json(
        { message: "sortOrder는 0 이상의 정수여야 합니다" },
        { status: 400 }
      );
    }

    const last = await prisma.systemOption.findFirst({
      where: { category },
      orderBy: { sortOrder: "desc" },
      select: { sortOrder: true },
    });
    const sortOrder =
      typeof body?.sortOrder === "number" && body.sortOrder >= 0
        ? body.sortOrder
        : (last?.sortOrder ?? -1) + 1;

    const created = await prisma.systemOption.create({
      data: {
        category,
        label,
        value,
        sortOrder,
        isActive: true,
      },
    });
    return NextResponse.json(created, { status: 201 });
  } catch (error: unknown) {
    const isUnique =
      error &&
      typeof error === "object" &&
      "code" in error &&
      (error as { code?: string }).code === "P2002";
    if (isUnique) {
      return NextResponse.json(
        { message: "같은 카테고리 내 value가 이미 존재합니다" },
        { status: 409 }
      );
    }
    console.error("시스템옵션 생성 오류:", error);
    return NextResponse.json(
      { message: "서버 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}
