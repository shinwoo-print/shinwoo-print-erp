import { prisma } from "@/lib/prisma";
import { generateTransactionNumber } from "@/lib/utils/generate-number";
import { transactionFormSchema } from "@/lib/validators/transaction";
import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/transactions — 거래명세서 목록 (검색 + 페이지네이션)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const search = searchParams.get("search") || "";
    const page = Math.max(1, Number(searchParams.get("page")) || 1);
    const pageSize = Math.max(1, Number(searchParams.get("pageSize")) || 10);
    const skip = (page - 1) * pageSize;

    const where: Record<string, unknown> = {};

    if (search) {
      where.OR = [
        { transactionNumber: { contains: search } },
        { client: { companyName: { contains: search } } },
      ];
    }

    const [data, totalCount] = await Promise.all([
      prisma.transaction.findMany({
        where,
        include: {
          client: {
            select: { id: true, companyName: true },
          },
          bankAccount: {
            select: { id: true, bankName: true, accountNumber: true },
          },
          items: {
            select: { id: true },
          },
        },
        orderBy: { transactionDate: "desc" },
        skip,
        take: pageSize,
      }),
      prisma.transaction.count({ where }),
    ]);

    const serialized = data.map((transaction) => ({
      ...transaction,
      transactionDate: transaction.transactionDate.toISOString().split("T")[0],
      totalSupplyAmount: transaction.totalSupplyAmount.toString(),
      totalVat: transaction.totalVat.toString(),
      totalAmount: transaction.totalAmount.toString(),
      itemCount: transaction.items.length,
      items: undefined,
    }));

    return NextResponse.json({ data: serialized, totalCount, page, pageSize });
  } catch (error) {
    console.error("거래명세서 목록 조회 오류:", error);
    return NextResponse.json(
      { message: "서버 오류가 발생했습니다" },
      { status: 500 },
    );
  }
}

/**
 * POST /api/transactions — 거래명세서 생성
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = transactionFormSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { message: "유효성 검사 실패", errors: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const data = parsed.data;

    const client = await prisma.client.findUnique({
      where: { id: data.clientId },
      select: { companyName: true },
    });

    if (!client) {
      return NextResponse.json(
        { message: "거래처를 찾을 수 없습니다" },
        { status: 400 },
      );
    }

    const transactionNumber = await generateTransactionNumber(
      client.companyName,
    );

    const totalQuantity = data.items.reduce((sum, item) => {
      return sum + (Number(item.quantity) || 0);
    }, 0);

    const totalSupplyAmount = data.items.reduce((sum, item) => {
      return sum + (Number(item.supplyAmount) || 0);
    }, 0);

    const totalVat = data.items.reduce((sum, item) => {
      return sum + (Number(item.vat) || 0);
    }, 0);

    const totalAmount = totalSupplyAmount + totalVat;

    const transaction = await prisma.transaction.create({
      data: {
        transactionNumber,
        transactionDate: new Date(data.transactionDate),
        clientId: data.clientId,
        bankAccountId: data.bankAccountId || null,
        totalQuantity,
        totalSupplyAmount,
        totalVat,
        totalAmount,
        note: data.note || null,
        items: {
          create: data.items.map((item, index) => ({
            productId: item.productId || null,
            itemDate: new Date(item.itemDate),
            productName: item.productName,
            spec: item.spec || null,
            quantity: Number(item.quantity) || 0,
            unit: item.unit || null,
            unitPrice: Number(item.unitPrice) || 0,
            supplyAmount: Number(item.supplyAmount) || 0,
            vat: Number(item.vat) || 0,
            sortOrder: index,
          })),
        },
      },
      include: {
        client: { select: { id: true, companyName: true } },
        bankAccount: {
          select: { id: true, bankName: true, accountNumber: true },
        },
        items: { orderBy: { sortOrder: "asc" } },
      },
    });

    return NextResponse.json(serializeTransaction(transaction), {
      status: 201,
    });
  } catch (error) {
    console.error("거래명세서 생성 오류:", error);
    return NextResponse.json(
      { message: "서버 오류가 발생했습니다" },
      { status: 500 },
    );
  }
}

function serializeTransaction(transaction: Record<string, unknown>) {
  const items = (transaction.items as Record<string, unknown>[]) || [];

  return {
    ...transaction,
    totalSupplyAmount: transaction.totalSupplyAmount
      ? String(transaction.totalSupplyAmount)
      : "0",
    totalVat: transaction.totalVat ? String(transaction.totalVat) : "0",
    totalAmount: transaction.totalAmount
      ? String(transaction.totalAmount)
      : "0",
    items: items.map((item) => ({
      ...item,
      itemDate:
        item.itemDate instanceof Date
          ? item.itemDate.toISOString().split("T")[0]
          : item.itemDate,
      unitPrice: item.unitPrice ? String(item.unitPrice) : "0",
      supplyAmount: item.supplyAmount ? String(item.supplyAmount) : "0",
      vat: item.vat ? String(item.vat) : "0",
    })),
  };
}
