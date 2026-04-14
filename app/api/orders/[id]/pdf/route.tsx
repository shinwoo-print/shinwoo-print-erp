
import { OrderPdfDocument } from "@/components/pdf/order-pdf";
import { renderPdfToResponse } from "@/lib/pdf/render-pdf";
import { resolveImageSrc } from "@/lib/pdf/resolve-image";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const orderId = Number(id);

    if (isNaN(orderId)) {
      return NextResponse.json(
        { message: "유효하지 않은 ID입니다" },
        { status: 400 },
      );
    }

    const [order, company] = await Promise.all([
      prisma.order.findUnique({
        where: { id: orderId },
        include: {
          client: {
            select: { companyName: true, contactName: true, phone: true },
          },
          items: { orderBy: { sortOrder: "asc" } },
        },
      }),
      prisma.companyInfo.findFirst({ where: { id: 1 } }),
    ]);

    if (!order) {
      return NextResponse.json(
        { message: "발주서를 찾을 수 없습니다" },
        { status: 404 },
      );
    }

    // ★ 이미지를 미리 Buffer로 변환
    const itemImageMap = new Map<number, string | null>();
    for (const item of order.items) {
      if (item.designImageUrl) {
        itemImageMap.set(item.id, await resolveImageSrc(item.designImageUrl));
      } else {
        itemImageMap.set(item.id, null);
      }
    }

    // ★ 회사 로고/직인도 동일 처리
    const companyLogoSrc = company?.logoUrl
      ? await resolveImageSrc(company.logoUrl)
      : null;
    const companySealSrc = company?.sealUrl
      ? await resolveImageSrc(company.sealUrl)
      : null;

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
      company: company
        ? {
            companyName: company.companyName,
            representative: company.representative,
            phone: company.phone,
            logoUrl: companyLogoSrc,   // ★ Buffer data URI
            sealUrl: companySealSrc,   // ★ Buffer data URI
          }
        : {
            companyName: "",
            representative: "",
            phone: "",
            logoUrl: null,
            sealUrl: null,
          },
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
        paperType: item.paperType,
        backing: item.backing,
        adhesive: item.adhesive,
        thickness: item.thickness,
        manufacturer: item.manufacturer,
        dataType: item.dataType,
        lastDataDate: item.lastDataDate
          ? item.lastDataDate.toISOString().split("T")[0]
          : null,
        designFileStatus: item.designFileStatus,
        designImageUrl: itemImageMap.get(item.id) ?? null,  // ★ Buffer data URI
        sortOrder: item.sortOrder,
      })),
    };

    const fileName = `발주서_${order.orderNumber}_${order.client.companyName}`;
    return await renderPdfToResponse(
      <OrderPdfDocument data={pdfData} />,
      fileName,
    );
  } catch (error) {
    console.error("발주서 PDF 생성 오류:", error);
    return NextResponse.json(
      { message: "PDF 생성에 실패했습니다" },
      { status: 500 },
    );
  }
}
