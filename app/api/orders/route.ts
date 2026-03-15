import { prisma } from "@/lib/prisma";
import { generateOrderNumber } from "@/lib/utils/generate-number";
import { orderFormSchema } from "@/lib/validators/order";
import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/orders — 발주서 목록 (검색 + 상태필터 + 페이지네이션)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "";
    const page = Math.max(1, Number(searchParams.get("page")) || 1);
    const pageSize = Math.max(1, Number(searchParams.get("pageSize")) || 10);
    const skip = (page - 1) * pageSize;

    const where: Record<string, unknown> = {};

    if (status) {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { orderNumber: { contains: search } },
        { client: { companyName: { contains: search } } },
        { orderer: { contains: search } },
      ];
    }

    const [data, totalCount] = await Promise.all([
      prisma.order.findMany({
        where,
        include: {
          client: {
            select: { id: true, companyName: true },
          },
          items: {
            select: { id: true },
          },
        },
        orderBy: { id: "desc" },
        skip,
        take: pageSize,
      }),
      prisma.order.count({ where }),
    ]);

    const serialized = data.map((order) => ({
      ...order,
      orderDate: order.orderDate.toISOString().split("T")[0],
      dueDate: order.dueDate ? order.dueDate.toISOString().split("T")[0] : null,
      itemCount: order.items.length,
      items: undefined,
    }));

    return NextResponse.json({ data: serialized, totalCount, page, pageSize });
  } catch (error) {
    console.error("발주서 목록 조회 오류:", error);
    return NextResponse.json(
      { message: "서버 오류가 발생했습니다" },
      { status: 500 },
    );
  }
}

/**
 * POST /api/orders — 발주서 생성
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = orderFormSchema.safeParse(body);

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
    const orderNumber = await generateOrderNumber(client.companyName);

    const order = await prisma.order.create({
      data: {
        orderNumber,
        clientId: data.clientId,
        orderDate: new Date(data.orderDate),
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
        orderer: data.orderer || null,
        status: data.status || "DRAFT",
        packagingType: data.packagingType || null,
        deliveryType: data.deliveryType || null,
        courierType: data.courierType || null,
        deliveryAddress: data.deliveryAddress || null,
        receiverName: data.receiverName || null,
        receiverPhone: data.receiverPhone || null,
        note: data.note || null,
        worker: data.worker || null,
        clientContact: data.clientContact || null,
        clientPhone: data.clientPhone || null,
        deliveryMethod: data.deliveryMethod || null,
        deliveryRegion: data.deliveryRegion || null,
        photoInspection: data.photoInspection || false,
        sampleShipping: data.sampleShipping || false,
        tightRoll: data.tightRoll || false,
        items: {
          create: data.items.map((item, index) => ({
            productId: item.productId || null,
            productName: item.productName,
            printType: item.printType || null,
            printPrice: item.printPrice ? Number(item.printPrice) : null,
            sheets: item.sheets ?? null,
            sheetsPerRoll: item.sheetsPerRoll ?? null,
            unitPrice: item.unitPrice ? Number(item.unitPrice) : null,
            supplyAmount: item.supplyAmount ? Number(item.supplyAmount) : null,
            material: item.material || null,
            materialWidth: item.materialWidth
              ? Number(item.materialWidth)
              : null,
            perforation: item.perforation || false,
            sizeWidth: item.sizeWidth ? Number(item.sizeWidth) : null,
            sizeHeight: item.sizeHeight ? Number(item.sizeHeight) : null,
            shape: item.shape || null,
            okkuri: item.okkuri ? Number(item.okkuri) : null,
            lamination: item.lamination || null,
            foil: item.foil || null,
            cuttingMethod: item.cuttingMethod || null,
            rollDirection: item.rollDirection || null,
            slit: item.slit || false,
            dataType: item.dataType || null,
            lastDataDate: item.lastDataDate
              ? new Date(item.lastDataDate)
              : null,
            designFileStatus: item.designFileStatus || null,
            designImageUrl: item.designImageUrl || null,
            cuttingType: item.cuttingType || null,
            sheetsPerSheet: item.sheetsPerSheet || null,
            labelGap: item.labelGap || null,
            dieCutter: item.dieCutter || null,
            resinPlate: item.resinPlate || null,
            sortOrder: index,
          })),
        },
      },
      include: {
        client: { select: { id: true, companyName: true } },
        items: true,
      },
    });

    return NextResponse.json(serializeOrder(order), { status: 201 });
  } catch (error) {
    console.error("발주서 생성 오류:", error);
    return NextResponse.json(
      { message: "서버 오류가 발생했습니다" },
      { status: 500 },
    );
  }
}

// Decimal → string 직렬화 헬퍼
function serializeOrder(order: Record<string, unknown>) {
  const items = (order.items as Record<string, unknown>[]) || [];
  return {
    ...order,
    items: items.map((item) => ({
      ...item,
      printPrice: item.printPrice ? String(item.printPrice) : null,
      unitPrice: item.unitPrice ? String(item.unitPrice) : null,
      supplyAmount: item.supplyAmount ? String(item.supplyAmount) : null,
      materialWidth: item.materialWidth ? String(item.materialWidth) : null,
      sizeWidth: item.sizeWidth ? String(item.sizeWidth) : null,
      sizeHeight: item.sizeHeight ? String(item.sizeHeight) : null,
      okkuri: item.okkuri ? String(item.okkuri) : null,
      labelGap: item.labelGap ? String(item.labelGap) : null,
    })),
  };
}
