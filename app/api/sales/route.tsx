import { prisma } from "@/lib/prisma";
import { salesRecordFormSchema } from "@/lib/validators/sales";
import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/sales — 매출/매입 목록 (검색 + 필터 + 페이지네이션 + 집계)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const year = Number(searchParams.get("year")) || new Date().getFullYear();
    const month = Number(searchParams.get("month")) || 0;
    const transactionType = searchParams.get("transactionType") || "";
    const search = searchParams.get("search") || "";
    const page = Math.max(1, Number(searchParams.get("page")) || 1);
    const pageSize = Math.max(1, Number(searchParams.get("pageSize")) || 20);
    const skip = (page - 1) * pageSize;

    const where: Record<string, unknown> = { year };

    if (month > 0) {
      where.month = month;
    }

    if (transactionType) {
      where.transactionType = transactionType;
    }

    if (search) {
      where.OR = [
        { client: { companyName: { contains: search } } },
        { productName: { contains: search } },
        { worker: { contains: search } },
      ];
    }

    const [data, totalCount, aggregate] = await Promise.all([
      prisma.salesRecord.findMany({
        where,
        include: {
          client: {
            select: { id: true, companyName: true },
          },
        },
        orderBy: [{ month: "asc" }, { id: "desc" }],
        skip,
        take: pageSize,
      }),
      prisma.salesRecord.count({ where }),
      prisma.salesRecord.aggregate({
        where,
        _sum: { supplyAmount: true },
        _count: true,
      }),
    ]);

    const serialized = data.map((record) => ({
      ...record,
      unitPrice: record.unitPrice ? record.unitPrice.toString() : null,
      supplyAmount: record.supplyAmount ? record.supplyAmount.toString() : null,
      taxIncludedAmount: record.taxIncludedAmount
        ? record.taxIncludedAmount.toString()
        : null,
      orderReceivedDate: record.orderReceivedDate
        ? record.orderReceivedDate.toISOString().split("T")[0]
        : null,
      requestedDueDate: record.requestedDueDate
        ? record.requestedDueDate.toISOString().split("T")[0]
        : null,
      transactionDate: record.transactionDate
        ? record.transactionDate.toISOString().split("T")[0]
        : null,
      taxInvoiceDate: record.taxInvoiceDate
        ? record.taxInvoiceDate.toISOString().split("T")[0]
        : null,
      paymentDate: record.paymentDate
        ? record.paymentDate.toISOString().split("T")[0]
        : null,
      createdAt: record.createdAt.toISOString(),
      updatedAt: record.updatedAt.toISOString(),
    }));

    return NextResponse.json({
      data: serialized,
      totalCount,
      page,
      pageSize,
      aggregate: {
        totalSupply: aggregate._sum.supplyAmount
          ? aggregate._sum.supplyAmount.toString()
          : "0",
        count: aggregate._count,
      },
    });
  } catch (error) {
    console.error("매출/매입 목록 조회 오류:", error);
    return NextResponse.json(
      { message: "서버 오류가 발생했습니다" },
      { status: 500 },
    );
  }
}

/**
 * POST /api/sales — 매출/매입 신규 등록
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = salesRecordFormSchema.safeParse(body);

    if (!parsed.success) {
      const firstError = parsed.error.issues[0]?.message || "유효성 검사 실패";
      return NextResponse.json(
        { message: firstError, errors: parsed.error.issues },
        { status: 400 },
      );
    }

    const data = parsed.data;

    const client = await prisma.client.findUnique({
      where: { id: data.clientId },
      select: { id: true },
    });
    if (!client) {
      return NextResponse.json(
        { message: "거래처를 찾을 수 없습니다" },
        { status: 400 },
      );
    }

    const supplyAmount = data.supplyAmount ? Number(data.supplyAmount) : null;
    const taxIncludedAmount =
      supplyAmount !== null ? Math.round(supplyAmount * 1.1) : null;

    const record = await prisma.salesRecord.create({
      data: {
        year: data.year,
        month: data.month,
        transactionType: data.transactionType,
        dataType: data.dataType || null,
        worker: data.worker || null,
        deliveryType: data.deliveryType || null,
        deliveryRegion: data.deliveryRegion || null,
        orderReceivedDate: data.orderReceivedDate
          ? new Date(data.orderReceivedDate)
          : null,
        clientId: data.clientId,
        printType: data.printType || null,
        productName: data.productName || null,
        sheets: data.sheets ?? null,
        unitPrice: data.unitPrice ? Number(data.unitPrice) : null,
        supplyAmount,
        taxIncludedAmount,
        requestedDueDate: data.requestedDueDate
          ? new Date(data.requestedDueDate)
          : null,
        transactionDate: data.transactionDate
          ? new Date(data.transactionDate)
          : null,
        taxInvoiceDate: data.taxInvoiceDate
          ? new Date(data.taxInvoiceDate)
          : null,
        paymentDate: data.paymentDate ? new Date(data.paymentDate) : null,
        note: data.note || null,
      },
      include: {
        client: { select: { id: true, companyName: true } },
      },
    });

    return NextResponse.json(serializeRecord(record), { status: 201 });
  } catch (error) {
    console.error("매출/매입 등록 오류:", error);
    return NextResponse.json(
      { message: "서버 오류가 발생했습니다" },
      { status: 500 },
    );
  }
}

function serializeRecord(record: Record<string, unknown>) {
  return {
    ...record,
    unitPrice: record.unitPrice ? String(record.unitPrice) : null,
    supplyAmount: record.supplyAmount ? String(record.supplyAmount) : null,
    taxIncludedAmount: record.taxIncludedAmount
      ? String(record.taxIncludedAmount)
      : null,
    orderReceivedDate: record.orderReceivedDate
      ? (record.orderReceivedDate as Date).toISOString().split("T")[0]
      : null,
    requestedDueDate: record.requestedDueDate
      ? (record.requestedDueDate as Date).toISOString().split("T")[0]
      : null,
    transactionDate: record.transactionDate
      ? (record.transactionDate as Date).toISOString().split("T")[0]
      : null,
    taxInvoiceDate: record.taxInvoiceDate
      ? (record.taxInvoiceDate as Date).toISOString().split("T")[0]
      : null,
    paymentDate: record.paymentDate
      ? (record.paymentDate as Date).toISOString().split("T")[0]
      : null,
    createdAt: (record.createdAt as Date).toISOString(),
    updatedAt: (record.updatedAt as Date).toISOString(),
  };
}
