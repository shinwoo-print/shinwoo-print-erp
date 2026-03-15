import { prisma } from "@/lib/prisma";
import { estimateFormSchema } from "@/lib/validators/estimate";
import { NextRequest, NextResponse } from "next/server";

type RouteParams = { params: Promise<{ id: string }> };

/**
 * GET /api/estimates/[id] — 견적서 상세 (items 포함)
 */
export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const estimateId = Number(id);
    if (isNaN(estimateId)) {
      return NextResponse.json(
        { message: "유효하지 않은 ID입니다" },
        { status: 400 },
      );
    }

    const estimate = await prisma.estimate.findUnique({
      where: { id: estimateId },
      include: {
        client: {
          select: {
            id: true,
            companyName: true,
            contactName: true,
            phone: true,
          },
        },
        items: {
          orderBy: { sortOrder: "asc" },
          include: { product: { select: { id: true, productName: true } } },
        },
      },
    });

    if (!estimate) {
      return NextResponse.json(
        { message: "견적서를 찾을 수 없습니다" },
        { status: 404 },
      );
    }

    const serialized = {
      ...estimate,
      estimateDate: estimate.estimateDate.toISOString().split("T")[0],
      totalSupplyAmount: estimate.totalSupplyAmount.toString(),
      totalVat: estimate.totalVat.toString(),
      totalAmount: estimate.totalAmount.toString(),
      items: estimate.items.map((item) => ({
        ...item,
        unitPrice: item.unitPrice.toString(),
        supplyAmount: item.supplyAmount.toString(),
        vat: item.vat.toString(),
      })),
    };

    return NextResponse.json(serialized);
  } catch (error) {
    console.error("견적서 상세 조회 오류:", error);
    return NextResponse.json(
      { message: "서버 오류가 발생했습니다" },
      { status: 500 },
    );
  }
}

/**
 * PUT /api/estimates/[id] — 견적서 수정 (items 전체 교체)
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const estimateId = Number(id);
    if (isNaN(estimateId)) {
      return NextResponse.json(
        { message: "유효하지 않은 ID입니다" },
        { status: 400 },
      );
    }

    const body = await request.json();
    const parsed = estimateFormSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { message: "유효성 검사 실패", errors: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const data = parsed.data;

    // 합계 계산
    const totalSupply = data.items.reduce(
      (sum, item) => sum + (Number(item.supplyAmount) || 0),
      0,
    );
    const totalVat = data.items.reduce(
      (sum, item) => sum + (Number(item.vat) || 0),
      0,
    );
    const totalAmount = totalSupply + totalVat;

    const estimate = await prisma.$transaction(async (tx) => {
      await tx.estimateItem.deleteMany({ where: { estimateId } });

      return tx.estimate.update({
        where: { id: estimateId },
        data: {
          clientId: data.clientId,
          estimateDate: new Date(data.estimateDate),
          clientContactName: data.clientContactName || null,
          recipientText: data.recipientText || null,
          stage: data.stage || "1차제안",
          validDays: data.validDays,
          totalSupplyAmount: totalSupply,
          totalVat: totalVat,
          totalAmount: totalAmount,
          note: data.note || null,
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
    });

    return NextResponse.json(estimate);
  } catch (error) {
    console.error("견적서 수정 오류:", error);
    return NextResponse.json(
      { message: "서버 오류가 발생했습니다" },
      { status: 500 },
    );
  }
}

/**
 * DELETE /api/estimates/[id] — 견적서 삭제 (items cascade 삭제)
 */
export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const estimateId = Number(id);
    if (isNaN(estimateId)) {
      return NextResponse.json(
        { message: "유효하지 않은 ID입니다" },
        { status: 400 },
      );
    }

    await prisma.estimate.delete({ where: { id: estimateId } });
    return NextResponse.json({ message: "견적서가 삭제되었습니다" });
  } catch (error) {
    console.error("견적서 삭제 오류:", error);
    return NextResponse.json(
      { message: "서버 오류가 발생했습니다" },
      { status: 500 },
    );
  }
}
