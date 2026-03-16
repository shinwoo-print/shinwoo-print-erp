import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

type RouteParams = { params: Promise<{ id: string }> };

/**
 * PUT /api/bank-accounts/[id] — 계좌 수정
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const bankAccountId = Number(id);

    if (isNaN(bankAccountId)) {
      return NextResponse.json(
        { message: "유효하지 않은 ID입니다" },
        { status: 400 },
      );
    }

    const body = await request.json();

    const bankName = String(body.bankName || "").trim();
    const accountNumber = String(body.accountNumber || "").trim();
    const accountHolder = String(body.accountHolder || "").trim();
    const memo = body.memo ? String(body.memo) : null;
    const isDefault = Boolean(body.isDefault);
    const sortOrder = Number(body.sortOrder) || 0;

    if (!bankName || !accountNumber || !accountHolder) {
      return NextResponse.json(
        { message: "은행명, 계좌번호, 예금주는 필수입니다" },
        { status: 400 },
      );
    }

    const updated = await prisma.$transaction(async (tx) => {
      if (isDefault) {
        await tx.bankAccount.updateMany({
          data: { isDefault: false },
          where: {
            isDefault: true,
            NOT: { id: bankAccountId },
          },
        });
      }

      return tx.bankAccount.update({
        where: { id: bankAccountId },
        data: {
          bankName,
          accountNumber,
          accountHolder,
          memo,
          isDefault,
          sortOrder,
        },
      });
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("계좌 수정 오류:", error);
    return NextResponse.json(
      { message: "서버 오류가 발생했습니다" },
      { status: 500 },
    );
  }
}

/**
 * DELETE /api/bank-accounts/[id] — 계좌 삭제
 */
export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const bankAccountId = Number(id);

    if (isNaN(bankAccountId)) {
      return NextResponse.json(
        { message: "유효하지 않은 ID입니다" },
        { status: 400 },
      );
    }

    const usedCount = await prisma.transaction.count({
      where: { bankAccountId },
    });

    if (usedCount > 0) {
      return NextResponse.json(
        { message: "거래명세서에서 사용 중인 계좌는 삭제할 수 없습니다" },
        { status: 400 },
      );
    }

    await prisma.bankAccount.delete({
      where: { id: bankAccountId },
    });

    return NextResponse.json({ message: "계좌가 삭제되었습니다" });
  } catch (error) {
    console.error("계좌 삭제 오류:", error);
    return NextResponse.json(
      { message: "서버 오류가 발생했습니다" },
      { status: 500 },
    );
  }
}
