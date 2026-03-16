import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/bank-accounts — 계좌 목록
 */
export async function GET() {
  try {
    const data = await prisma.bankAccount.findMany({
      orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
    });

    return NextResponse.json(data);
  } catch (error) {
    console.error("계좌 목록 조회 오류:", error);
    return NextResponse.json(
      { message: "서버 오류가 발생했습니다" },
      { status: 500 },
    );
  }
}

/**
 * POST /api/bank-accounts — 계좌 생성
 */
export async function POST(request: NextRequest) {
  try {
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

    const created = await prisma.$transaction(async (tx) => {
      if (isDefault) {
        await tx.bankAccount.updateMany({
          data: { isDefault: false },
          where: { isDefault: true },
        });
      }

      return tx.bankAccount.create({
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

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error("계좌 생성 오류:", error);
    return NextResponse.json(
      { message: "서버 오류가 발생했습니다" },
      { status: 500 },
    );
  }
}
