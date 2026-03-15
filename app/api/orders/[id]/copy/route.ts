import { prisma } from "@/lib/prisma";
import { generateOrderNumber } from "@/lib/utils/generate-number";
import { NextRequest, NextResponse } from "next/server";

type RouteParams = { params: Promise<{ id: string }> };

/**
 * POST /api/orders/[id]/copy — 기존 발주서 복사하여 새 발주서 생성
 */
export async function POST(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const sourceId = Number(id);

    if (isNaN(sourceId)) {
      return NextResponse.json(
        { message: "유효하지 않은 ID입니다" },
        { status: 400 },
      );
    }

    const source = await prisma.order.findUnique({
      where: { id: sourceId },
      include: { items: { orderBy: { sortOrder: "asc" } } },
    });

    if (!source) {
      return NextResponse.json(
        { message: "원본 발주서를 찾을 수 없습니다" },
        { status: 404 },
      );
    }

    const sourceClient = await prisma.client.findUnique({
      where: { id: source.clientId },
      select: { companyName: true },
    });
    const orderNumber = await generateOrderNumber(
      sourceClient?.companyName || "UNKNOWN",
    );
    // 한국시간 기준 오늘
    const kstNow = new Date(
      new Date().toLocaleString("en-US", { timeZone: "Asia/Seoul" }),
    );
    const today = new Date(
      kstNow.getFullYear(),
      kstNow.getMonth(),
      kstNow.getDate(),
    );

    const newOrder = await prisma.order.create({
      data: {
        orderNumber,
        clientId: source.clientId,
        orderDate: today,
        dueDate: null,
        orderer: source.orderer,
        status: "DRAFT",
        packagingType: source.packagingType,
        deliveryType: source.deliveryType,
        courierType: source.courierType,
        deliveryAddress: source.deliveryAddress,
        receiverName: source.receiverName,
        receiverPhone: source.receiverPhone,
        note: source.note,
        worker: source.worker,
        clientContact: source.clientContact,
        clientPhone: source.clientPhone,
        deliveryMethod: source.deliveryMethod,
        deliveryRegion: source.deliveryRegion,
        photoInspection: source.photoInspection,
        sampleShipping: source.sampleShipping,
        tightRoll: source.tightRoll,
        items: {
          create: source.items.map((item, index) => ({
            productId: item.productId,
            productName: item.productName,
            printType: item.printType,
            printPrice: item.printPrice,
            sheets: item.sheets,
            sheetsPerRoll: item.sheetsPerRoll,
            unitPrice: item.unitPrice,
            supplyAmount: item.supplyAmount,
            material: item.material,
            materialWidth: item.materialWidth,
            perforation: item.perforation,
            sizeWidth: item.sizeWidth,
            sizeHeight: item.sizeHeight,
            shape: item.shape,
            okkuri: item.okkuri,
            lamination: item.lamination,
            foil: item.foil,
            cuttingMethod: item.cuttingMethod,
            rollDirection: item.rollDirection,
            slit: item.slit,
            dataType: item.dataType,
            lastDataDate: item.lastDataDate,
            designFileStatus: item.designFileStatus,
            designImageUrl: item.designImageUrl,
            cuttingType: item.cuttingType,
            sheetsPerSheet: item.sheetsPerSheet,
            labelGap: item.labelGap,
            dieCutter: item.dieCutter,
            resinPlate: item.resinPlate,
            sortOrder: index,
          })),
        },
      },
      include: {
        client: { select: { id: true, companyName: true } },
        items: true,
      },
    });

    return NextResponse.json(newOrder, { status: 201 });
  } catch (error) {
    console.error("발주서 복사 오류:", error);
    return NextResponse.json(
      { message: "서버 오류가 발생했습니다" },
      { status: 500 },
    );
  }
}
