import {
  applyDataStyle,
  applyHeaderStyle,
  applyTotalStyle,
} from "@/lib/excel/excel-styles";
import { prisma } from "@/lib/prisma";
import ExcelJS from "exceljs";
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
        client: { select: { companyName: true } },
        items: { orderBy: { sortOrder: "asc" } },
      },
    });

    if (!order) {
      return NextResponse.json(
        { message: "발주서를 찾을 수 없습니다" },
        { status: 404 }
      );
    }

    const workbook = new ExcelJS.Workbook();
    workbook.creator = "신우씨링 ERP";
    workbook.created = new Date();

    const sheet = workbook.addWorksheet("발주서");

    // 컬럼 설정
    sheet.columns = [
      { header: "No", key: "no", width: 5 },
      { header: "제품명", key: "productName", width: 25 },
      { header: "인쇄종류", key: "printType", width: 10 },
      { header: "규격(W×H)", key: "spec", width: 14 },
      { header: "원단", key: "material", width: 12 },
      { header: "발주수량", key: "sheets", width: 10 },
      { header: "단가", key: "unitPrice", width: 12 },
      { header: "공급가액", key: "supplyAmount", width: 14 },
      { header: "모형", key: "shape", width: 8 },
      { header: "라미", key: "lamination", width: 8 },
      { header: "박", key: "foil", width: 8 },
      { header: "미싱", key: "perforation", width: 5 },
      { header: "슬리트", key: "slit", width: 6 },
      { header: "롤방향", key: "rollDirection", width: 7 },
    ];

    // 타이틀 행
    sheet.insertRow(1, []);
    const titleRow = sheet.getRow(1);
    sheet.mergeCells("A1:N1");
    const titleCell = titleRow.getCell(1);
    titleCell.value = `발주서 - ${order.orderNumber} (${order.client.companyName})`;
    titleCell.font = { bold: true, size: 14 };
    titleCell.alignment = { horizontal: "center", vertical: "middle" };
    titleRow.height = 30;

    // 정보 행
    sheet.insertRow(2, []);
    const infoRow = sheet.getRow(2);
    infoRow.getCell(1).value = `발주일: ${order.orderDate.toISOString().split("T")[0]}`;
    infoRow.getCell(4).value = `납기요청일: ${order.dueDate ? order.dueDate.toISOString().split("T")[0] : "-"}`;
    infoRow.getCell(7).value = `발주자: ${order.orderer || "-"}`;
    infoRow.getCell(10).value = `상태: ${order.status}`;
    infoRow.height = 20;

    // 헤더 행 (3행)
    const COL_COUNT = 14;
    const headerRow = sheet.getRow(3);
    headerRow.values = [
      "No",
      "제품명",
      "인쇄종류",
      "규격(W×H)",
      "원단",
      "발주수량",
      "단가",
      "공급가액",
      "모형",
      "라미",
      "박",
      "미싱",
      "슬리트",
      "롤방향",
    ];
    applyHeaderStyle(headerRow, COL_COUNT);

    // 데이터 행
    const NUMBER_COLS = [6, 7, 8]; // sheets, unitPrice, supplyAmount
    order.items.forEach((item, idx) => {
      const spec =
        item.sizeWidth && item.sizeHeight
          ? `${item.sizeWidth}×${item.sizeHeight}`
          : "";
      const row = sheet.addRow([
        idx + 1,
        item.productName,
        item.printType || "",
        spec,
        item.material || "",
        item.sheets ?? 0,
        Number(item.unitPrice) || 0,
        Number(item.supplyAmount) || 0,
        item.shape || "",
        item.lamination || "",
        item.foil || "",
        item.perforation ? "O" : "X",
        item.slit ? "O" : "X",
        item.rollDirection || "",
      ]);
      applyDataStyle(row, COL_COUNT, NUMBER_COLS);
    });

    // 합계 행
    const totalSupply = order.items.reduce(
      (sum, item) => sum + (Number(item.supplyAmount) || 0),
      0
    );
    const totalRow = sheet.addRow([
      "",
      "합계",
      "",
      "",
      "",
      order.items.reduce((sum, item) => sum + (item.sheets ?? 0), 0),
      "",
      totalSupply,
      "",
      "",
      "",
      "",
      "",
      "",
    ]);
    applyTotalStyle(totalRow, COL_COUNT, NUMBER_COLS);

    // 비고 행
    const noteRowNum = sheet.lastRow!.number + 2;
    sheet.getRow(noteRowNum).getCell(1).value = "비고:";
    sheet.getRow(noteRowNum).getCell(1).font = { bold: true };
    sheet.getRow(noteRowNum).getCell(2).value = order.note || "";
    sheet.getRow(noteRowNum + 1).getCell(1).value =
      `사진감리: ${order.photoInspection ? "O" : "X"} | 샘플배송: ${order.sampleShipping ? "O" : "X"} | 롤짱짱: ${order.tightRoll ? "O" : "X"}`;

    const buffer = await workbook.xlsx.writeBuffer();

    const fileName = `발주서_${order.orderNumber}_${order.client.companyName}`;
    return new Response(buffer, {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${encodeURIComponent(fileName)}.xlsx"`,
      },
    });
  } catch (error) {
    console.error("발주서 엑셀 생성 오류:", error);
    return NextResponse.json(
      { message: "엑셀 생성에 실패했습니다" },
      { status: 500 }
    );
  }
}
