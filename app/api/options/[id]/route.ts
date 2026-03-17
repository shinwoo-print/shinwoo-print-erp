import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

type RouteParams = { params: Promise<{ id: string }> };

function parseId(id: string): number | null {
  const n = Number(id);
  return Number.isNaN(n) ? null : n;
}

/**
 * PUT /api/options/[id] — label, value, sortOrder 수정 (카테고리 변경 불가)
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const optionId = parseId(id);
    if (optionId === null) {
      return NextResponse.json(
        { message: "유효하지 않은 ID입니다" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const label =
      typeof body?.label === "string" ? body.label.trim() : undefined;
    const value =
      typeof body?.value === "string" ? body.value.trim() : undefined;
    const sortOrder =
      typeof body?.sortOrder === "number" &&
      Number.isInteger(body.sortOrder) &&
      body.sortOrder >= 0
        ? body.sortOrder
        : undefined;

    if (label !== undefined && (label.length === 0 || label.length > 100)) {
      return NextResponse.json(
        { message: "label은 1~100자입니다" },
        { status: 400 }
      );
    }
    if (value !== undefined && (value.length === 0 || value.length > 100)) {
      return NextResponse.json(
        { message: "value는 1~100자입니다" },
        { status: 400 }
      );
    }

    const existing = await prisma.systemOption.findUnique({
      where: { id: optionId },
    });
    if (!existing) {
      return NextResponse.json(
        { message: "옵션을 찾을 수 없습니다" },
        { status: 404 }
      );
    }

    const data: { label?: string; value?: string; sortOrder?: number } = {};
    if (label !== undefined) data.label = label;
    if (value !== undefined) data.value = value;
    if (sortOrder !== undefined) data.sortOrder = sortOrder;

    if (Object.keys(data).length === 0) {
      return NextResponse.json(existing);
    }

    const option = await prisma.systemOption.update({
      where: { id: optionId },
      data,
    });
    return NextResponse.json(option);
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
    console.error("시스템옵션 수정 오류:", error);
    return NextResponse.json(
      { message: "서버 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/options/[id] — 소프트 삭제 (isActive=false)
 */
export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const optionId = parseId(id);
    if (optionId === null) {
      return NextResponse.json(
        { message: "유효하지 않은 ID입니다" },
        { status: 400 }
      );
    }

    const existing = await prisma.systemOption.findUnique({
      where: { id: optionId },
    });
    if (!existing) {
      return NextResponse.json(
        { message: "옵션을 찾을 수 없습니다" },
        { status: 404 }
      );
    }

    await prisma.systemOption.update({
      where: { id: optionId },
      data: { isActive: false },
    });
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("시스템옵션 삭제 오류:", error);
    return NextResponse.json(
      { message: "서버 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}
