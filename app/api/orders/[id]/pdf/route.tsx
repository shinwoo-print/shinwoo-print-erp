import { prisma } from "@/lib/prisma";
import { renderPdfToResponse } from "@/lib/pdf/render-pdf";
import { OrderPdfDocument } from "@/components/pdf/order-pdf";
import { NextRequest, NextResponse } from "next/server";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const orderId = Number(id);

    if (isNaN(orderId)) {
      return NextResponse.json(
        { message: "유효하지 않은 ID입니다" },
        { status: 400 }
      );
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        client: {
          select: { companyName: true, contactName: true, phone: true },
        },
        items: { orderBy: { sortOrder: "asc" } },
      },
    });

    if (!order) {
      return NextResponse.json(
        { message: "발주서를 찾을 수 없습니다" },
        { status: 404 }
      );
    }

    const pdfData = {
      orderNumber: order.orderNumber,
      clientCompanyName: order.client.companyName,
      orderDate: order.orderDate.toISOString().split("T")[0],
      dueDate: order.dueDate
        ? order.dueDate.toISOString().split("T")[0]
        : null,
      orderer: order.orderer,
      worker: order.worker,
      clientContact: order.clientContact,
      clientPhone: order.clientPhone,
      deliveryMethod: order.deliveryMethod,
      deliveryRegion: order.deliveryRegion,
      deliveryAddress: order.deliveryAddress,
      photoInspection: order.photoInspection,
      sampleShipping: order.sampleShipping,
      tightRoll: order.tightRoll,
      packagingType: order.packagingType,
      deliveryType: order.deliveryType,
      courierType: order.courierType,
      receiverName: order.receiverName,
      receiverPhone: order.receiverPhone,
      note: order.note,
      items: order.items.map((item) => ({
        productName: item.productName,
        printType: item.printType,
        printPrice: item.printPrice?.toString() ?? null,
        sheets: item.sheets,
        sheetsPerRoll: item.sheetsPerRoll,
        unitPrice: item.unitPrice?.toString() ?? null,
        supplyAmount: item.supplyAmount?.toString() ?? null,
        material: item.material,
        materialWidth: item.materialWidth?.toString() ?? null,
        perforation: item.perforation,
        sizeWidth: item.sizeWidth?.toString() ?? null,
        sizeHeight: item.sizeHeight?.toString() ?? null,
        shape: item.shape,
        okkuri: item.okkuri?.toString() ?? null,
        lamination: item.lamination,
        foil: item.foil,
        cuttingMethod: item.cuttingMethod,
        cuttingType: item.cuttingType,
        sheetsPerSheet: item.sheetsPerSheet,
        labelGap: item.labelGap?.toString() ?? null,
        dieCutter: item.dieCutter,
        resinPlate: item.resinPlate,
        rollDirection: item.rollDirection,
        slit: item.slit,
        dataType: item.dataType,
        lastDataDate: item.lastDataDate
          ? item.lastDataDate.toISOString().split("T")[0]
          : null,
        designFileStatus: item.designFileStatus,
        designImageUrl: item.designImageUrl,
        sortOrder: item.sortOrder,
      })),
    };

    const fileName = `발주서_${order.orderNumber}_${order.client.companyName}`;
    return await renderPdfToResponse(
      <OrderPdfDocument data={ pdfData } />,
      fileName
    );
  } catch (error) {
    console.error("발주서 PDF 생성 오류:", error);
    return NextResponse.json(
      { message: "PDF 생성에 실패했습니다" },
      { status: 500 }
    );
  }
}
