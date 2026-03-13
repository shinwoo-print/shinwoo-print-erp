import { prisma } from "@/lib/prisma";
import { orderFormSchema } from "@/lib/validators/order";
import { NextRequest, NextResponse } from "next/server";

type RouteParams = { params: Promise<{ id: string }> };

/**
 * GET /api/orders/[id] — 발주서 상세 (items 포함)
 */
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

    const order = await prisma.order.findUnique({
      where: { id: orderId },
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
          include: {
            product: {
              select: { id: true, productName: true },
            },
          },
        },
      },
    });

    if (!order) {
      return NextResponse.json(
        { message: "발주서를 찾을 수 없습니다" },
        { status: 404 },
      );
    }

    const serialized = {
      ...order,
      orderDate: order.orderDate.toISOString().split("T")[0],
      dueDate: order.dueDate ? order.dueDate.toISOString().split("T")[0] : "",
      items: order.items.map((item) => ({
        ...item,
        printPrice: item.printPrice ? item.printPrice.toString() : "",
        unitPrice: item.unitPrice ? item.unitPrice.toString() : "",
        supplyAmount: item.supplyAmount ? item.supplyAmount.toString() : "",
        materialWidth: item.materialWidth ? item.materialWidth.toString() : "",
        sizeWidth: item.sizeWidth ? item.sizeWidth.toString() : "",
        sizeHeight: item.sizeHeight ? item.sizeHeight.toString() : "",
        okkuri: item.okkuri ? item.okkuri.toString() : "",
        lastDataDate: item.lastDataDate
          ? item.lastDataDate.toISOString().split("T")[0]
          : "",
      })),
    };

    return NextResponse.json(serialized);
  } catch (error) {
    console.error("발주서 상세 조회 오류:", error);
    return NextResponse.json(
      { message: "서버 오류가 발생했습니다" },
      { status: 500 },
    );
  }
}

/**
 * PUT /api/orders/[id] — 발주서 수정 (items 전체 교체)
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const orderId = Number(id);

    if (isNaN(orderId)) {
      return NextResponse.json(
        { message: "유효하지 않은 ID입니다" },
        { status: 400 },
      );
    }

    const body = await request.json();
    const parsed = orderFormSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { message: "유효성 검사 실패", errors: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const data = parsed.data;

    // 기존 items 삭제 후 새로 생성 (트랜잭션)
    const order = await prisma.$transaction(async (tx) => {
      await tx.orderItem.deleteMany({ where: { orderId } });

      return tx.order.update({
        where: { id: orderId },
        data: {
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
          items: {
            create: data.items.map((item, index) => ({
              productId: item.productId || null,
              productName: item.productName,
              printType: item.printType || null,
              printPrice: item.printPrice ? Number(item.printPrice) : null,
              sheets: item.sheets ?? null,
              sheetsPerRoll: item.sheetsPerRoll ?? null,
              unitPrice: item.unitPrice ? Number(item.unitPrice) : null,
              supplyAmount: item.supplyAmount
                ? Number(item.supplyAmount)
                : null,
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
              sortOrder: index,
            })),
          },
        },
        include: {
          client: { select: { id: true, companyName: true } },
          items: { orderBy: { sortOrder: "asc" } },
        },
      });
    });

    return NextResponse.json(order);
  } catch (error) {
    console.error("발주서 수정 오류:", error);
    return NextResponse.json(
      { message: "서버 오류가 발생했습니다" },
      { status: 500 },
    );
  }
}

/**
 * DELETE /api/orders/[id] — 발주서 삭제 (items cascade 삭제)
 */
export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const orderId = Number(id);

    if (isNaN(orderId)) {
      return NextResponse.json(
        { message: "유효하지 않은 ID입니다" },
        { status: 400 },
      );
    }

    await prisma.order.delete({ where: { id: orderId } });

    return NextResponse.json({ message: "발주서가 삭제되었습니다" });
  } catch (error) {
    console.error("발주서 삭제 오류:", error);
    return NextResponse.json(
      { message: "서버 오류가 발생했습니다" },
      { status: 500 },
    );
  }
}
