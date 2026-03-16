import { prisma } from "@/lib/prisma";
import { transactionFormSchema } from "@/lib/validators/transaction";
import { NextRequest, NextResponse } from "next/server";

type RouteParams = { params: Promise<{ id: string }> };

/**
 * GET /api/transactions/[id] — 거래명세서 상세
 */
export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const transactionId = Number(id);

    if (isNaN(transactionId)) {
      return NextResponse.json(
        { message: "유효하지 않은 ID입니다" },
        { status: 400 },
      );
    }

    const transaction = await prisma.transaction.findUnique({
      where: { id: transactionId },
      include: {
        client: {
          select: {
            id: true,
            companyName: true,
            contactName: true,
            phone: true,
          },
        },
        bankAccount: {
          select: {
            id: true,
            bankName: true,
            accountNumber: true,
            accountHolder: true,
          },
        },
        items: {
          orderBy: { sortOrder: "asc" },
          include: {
            product: {
              select: { id: true, productName: true },
            },
          },
        },
      },
    });

    if (!transaction) {
      return NextResponse.json(
        { message: "거래명세서를 찾을 수 없습니다" },
        { status: 404 },
      );
    }

    const serialized = {
      ...transaction,
      transactionDate: transaction.transactionDate.toISOString().split("T")[0],
      totalSupplyAmount: transaction.totalSupplyAmount.toString(),
      totalVat: transaction.totalVat.toString(),
      totalAmount: transaction.totalAmount.toString(),
      items: transaction.items.map((item) => ({
        ...item,
        itemDate: item.itemDate.toISOString().split("T")[0],
        unitPrice: item.unitPrice.toString(),
        supplyAmount: item.supplyAmount.toString(),
        vat: item.vat.toString(),
      })),
    };

    return NextResponse.json(serialized);
  } catch (error) {
    console.error("거래명세서 상세 조회 오류:", error);
    return NextResponse.json(
      { message: "서버 오류가 발생했습니다" },
      { status: 500 },
    );
  }
}

/**
 * PUT /api/transactions/[id] — 거래명세서 수정
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const transactionId = Number(id);

    if (isNaN(transactionId)) {
      return NextResponse.json(
        { message: "유효하지 않은 ID입니다" },
        { status: 400 },
      );
    }

    const body = await request.json();
    const parsed = transactionFormSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { message: "유효성 검사 실패", errors: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const data = parsed.data;

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

    const transaction = await prisma.$transaction(async (tx) => {
      await tx.transactionItem.deleteMany({ where: { transactionId } });

      return tx.transaction.update({
        where: { id: transactionId },
        data: {
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
    });

    return NextResponse.json(serializeTransaction(transaction));
  } catch (error) {
    console.error("거래명세서 수정 오류:", error);
    return NextResponse.json(
      { message: "서버 오류가 발생했습니다" },
      { status: 500 },
    );
  }
}

/**
 * DELETE /api/transactions/[id] — 거래명세서 삭제
 */
export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const transactionId = Number(id);

    if (isNaN(transactionId)) {
      return NextResponse.json(
        { message: "유효하지 않은 ID입니다" },
        { status: 400 },
      );
    }

    await prisma.transaction.delete({
      where: { id: transactionId },
    });

    return NextResponse.json({ message: "거래명세서가 삭제되었습니다" });
  } catch (error) {
    console.error("거래명세서 삭제 오류:", error);
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
