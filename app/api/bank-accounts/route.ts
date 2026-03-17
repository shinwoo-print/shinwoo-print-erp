import { prisma } from "@/lib/prisma";
import { bankAccountSchema } from "@/lib/validators/bank-account";
import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/bank-accounts — 계좌 목록 (기본계좌 우선, sortOrder, id 순)
 */
export async function GET() {
  try {
    const accounts = await prisma.bankAccount.findMany({
      orderBy: [{ isDefault: "desc" }, { sortOrder: "asc" }, { id: "asc" }],
    });
    return NextResponse.json(accounts);
  } catch (error) {
    console.error("계좌 목록 조회 오류:", error);
    return NextResponse.json(
      { message: "서버 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/bank-accounts — 계좌 생성 (isDefault=true 시 기존 기본계좌 해제)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = bankAccountSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { message: "유효성 검사 실패", errors: parsed.error.flatten() },
        { status: 400 }
      );
    }
    const data = parsed.data;

    const account = await prisma.$transaction(async (tx) => {
      if (data.isDefault) {
        await tx.bankAccount.updateMany({
          data: { isDefault: false },
        });
      }
      return tx.bankAccount.create({
        data: {
          bankName: data.bankName,
          accountNumber: data.accountNumber,
          accountHolder: data.accountHolder,
          memo: data.memo || null,
          isDefault: data.isDefault ?? false,
          sortOrder: data.sortOrder ?? 0,
        },
      });
    });

    return NextResponse.json(account, { status: 201 });
  } catch (error) {
    console.error("계좌 생성 오류:", error);
    return NextResponse.json(
      { message: "서버 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}
