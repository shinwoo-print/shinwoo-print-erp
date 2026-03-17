import { prisma } from "@/lib/prisma";
import { bankAccountSchema } from "@/lib/validators/bank-account";
import { NextRequest, NextResponse } from "next/server";

type RouteParams = { params: Promise<{ id: string }> };

function parseId(id: string): number | null {
  const n = Number(id);
  return Number.isNaN(n) ? null : n;
}

/**
 * PUT /api/bank-accounts/[id] — 계좌 수정 (기본계좌 토글 시 다른 계좌 해제)
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const accountId = parseId(id);
    if (accountId === null) {
      return NextResponse.json(
        { message: "유효하지 않은 ID입니다" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const parsed = bankAccountSchema.partial().safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { message: "유효성 검사 실패", errors: parsed.error.flatten() },
        { status: 400 }
      );
    }
    const data = parsed.data;

    const existing = await prisma.bankAccount.findUnique({
      where: { id: accountId },
    });
    if (!existing) {
      return NextResponse.json(
        { message: "계좌를 찾을 수 없습니다" },
        { status: 404 }
      );
    }

    const account = await prisma.$transaction(async (tx) => {
      if (data.isDefault === true) {
        await tx.bankAccount.updateMany({
          where: { id: { not: accountId } },
          data: { isDefault: false },
        });
      }
      return tx.bankAccount.update({
        where: { id: accountId },
        data: {
          ...(data.bankName !== undefined && { bankName: data.bankName }),
          ...(data.accountNumber !== undefined && {
            accountNumber: data.accountNumber,
          }),
          ...(data.accountHolder !== undefined && {
            accountHolder: data.accountHolder,
          }),
          ...(data.memo !== undefined && { memo: data.memo || null }),
          ...(data.isDefault !== undefined && { isDefault: data.isDefault }),
          ...(data.sortOrder !== undefined && { sortOrder: data.sortOrder }),
        },
      });
    });

    return NextResponse.json(account);
  } catch (error) {
    console.error("계좌 수정 오류:", error);
    return NextResponse.json(
      { message: "서버 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/bank-accounts/[id] — 계좌 삭제
 */
export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const accountId = parseId(id);
    if (accountId === null) {
      return NextResponse.json(
        { message: "유효하지 않은 ID입니다" },
        { status: 400 }
      );
    }

    const existing = await prisma.bankAccount.findUnique({
      where: { id: accountId },
    });
    if (!existing) {
      return NextResponse.json(
        { message: "계좌를 찾을 수 없습니다" },
        { status: 404 }
      );
    }

    await prisma.bankAccount.delete({
      where: { id: accountId },
    });
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("계좌 삭제 오류:", error);
    return NextResponse.json(
      { message: "서버 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}
