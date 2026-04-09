import { prisma } from "@/lib/prisma";
import { generateEstimateNumber } from "@/lib/utils/generate-number";
import { estimateFormSchema } from "@/lib/validators/estimate";
import { Prisma } from "@/generated/prisma/client";
import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/estimates — 견적서 목록 (검색 + 진행단계필터 + 페이지네이션)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const search = searchParams.get("search") || "";
    const stage = searchParams.get("stage") || "";
    const clientId = searchParams.get("clientId") || "";
    const page = Math.max(1, Number(searchParams.get("page")) || 1);
    const pageSize = Math.max(1, Number(searchParams.get("pageSize")) || 10);
    const skip = (page - 1) * pageSize;

    const where: Record<string, unknown> = {};
    if (clientId) {
      const cid = Number(clientId);
      if (!isNaN(cid)) where.clientId = cid;
    }
    if (stage) where.stage = stage;
    if (search) {
      where.OR = [
        { estimateNumber: { contains: search } },
        { client: { companyName: { contains: search } } },
      ];
    }

    const [data, totalCount] = await Promise.all([
      prisma.estimate.findMany({
        where,
        include: {
          client: { select: { id: true, companyName: true } },
          items: { select: { id: true } },
        },
        orderBy: { id: "desc" },
        skip,
        take: pageSize,
      }),
      prisma.estimate.count({ where }),
    ]);

    const serialized = data.map((e) => ({
      ...e,
      estimateDate: e.estimateDate.toISOString().split("T")[0],
      totalSupplyAmount: e.totalSupplyAmount.toString(),
      totalVat: e.totalVat.toString(),
      totalAmount: e.totalAmount.toString(),
      itemCount: e.items.length,
      items: undefined,
    }));

    return NextResponse.json({ data: serialized, totalCount, page, pageSize });
  } catch (error) {
    console.error("견적서 목록 조회 오류:", error);
    return NextResponse.json(
      { message: "서버 오류가 발생했습니다" },
      { status: 500 },
    );
  }
}

/**
 * POST /api/estimates — 견적서 생성
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = estimateFormSchema.safeParse(body);

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

    // 합계 계산
    const totalSupply = data.items.reduce((sum, item) => {
      return sum + (Number(item.supplyAmount) || 0);
    }, 0);
    const totalVat = data.items.reduce((sum, item) => {
      return sum + (Number(item.vat) || 0);
    }, 0);
    const totalAmount = totalSupply + totalVat;

    const MAX_RETRY = 5;
    let lastError: unknown = null;

    for (let attempt = 0; attempt < MAX_RETRY; attempt++) {
      const estimateNumber = await generateEstimateNumber(client.companyName);
      try {
        const estimate = await prisma.estimate.create({
          data: {
            estimateNumber,
            estimateDate: new Date(data.estimateDate),
            clientId: data.clientId,
            clientContactName: data.clientContactName || null,
            recipientText: data.recipientText || null,
            stage: data.stage || "1차제안",
            validDays: data.validDays,
            totalSupplyAmount: totalSupply,
            totalVat: totalVat,
            totalAmount: totalAmount,
            note: data.note || null,
            managerId: data.managerId || null,              // ★ 추가
            managerName: data.managerName || null,           // ★ 추가
            managerTitle: data.managerTitle || null,          // ★ 추가
            managerPhone: data.managerPhone || null,          // ★ 추가
            managerEmail: data.managerEmail || null,          // ★ 추가
            items: {

              create: data.items.map((item, idx) => ({
                productId: item.productId || null,
                productName: item.productName,
                spec: item.spec || null,
                quantity: item.quantity,
                quantityText: item.quantityText || null,
                unitPrice: item.unitPrice ? Number(item.unitPrice) : 0,
                unitPriceText: item.unitPriceText || null,
                supplyAmount: item.supplyAmount ? Number(item.supplyAmount) : 0,
                vat: item.vat ? Number(item.vat) : 0,
                note: item.note || null,
                sortOrder: idx,
              })),
            },
          },
          include: {
            client: { select: { id: true, companyName: true } },
            items: { orderBy: { sortOrder: "asc" } },
          },
        });

        return NextResponse.json(serializeEstimate(estimate), { status: 201 });
      } catch (e) {
        lastError = e;
        if (e instanceof Prisma.PrismaClientKnownRequestError) {
          if (e.code === "P2002") continue;
        }
        throw e;
      }
    }

    console.error("견적서 생성 재시도 초과:", lastError);
    return NextResponse.json(
      { message: "문서번호 생성에 실패했습니다. 잠시 후 다시 시도하세요." },
      { status: 500 },
    );
  } catch (error) {
    console.error("견적서 생성 오류:", error);
    return NextResponse.json(
      { message: "서버 오류가 발생했습니다" },
      { status: 500 },
    );
  }
}

function serializeEstimate(e: Record<string, unknown>) {
  const items = (e.items as Record<string, unknown>[]) || [];
  return {
    ...e,
    totalSupplyAmount: e.totalSupplyAmount ? String(e.totalSupplyAmount) : "0",
    totalVat: e.totalVat ? String(e.totalVat) : "0",
    totalAmount: e.totalAmount ? String(e.totalAmount) : "0",
    items: items.map((item) => ({
      ...item,
      unitPrice: item.unitPrice ? String(item.unitPrice) : "0",
      supplyAmount: item.supplyAmount ? String(item.supplyAmount) : "0",
      vat: item.vat ? String(item.vat) : "0",
    })),
  };
}
