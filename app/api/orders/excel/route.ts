import { prisma } from "@/lib/prisma";
import { applyDataStyle, applyHeaderStyle } from "@/lib/excel/excel-styles";
import ExcelJS from "exceljs";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "";
    const year = searchParams.get("year") || "";
    const month = searchParams.get("month") || "";

    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { orderNumber: { contains: search } },
        { client: { companyName: { contains: search } } },
        { orderer: { contains: search } },
      ];
    }
    if (year && month) {
      const y = Number(year);
      const m = Number(month);
      if (!isNaN(y) && !isNaN(m) && m >= 1 && m <= 12) {
        const start = new Date(y, m - 1, 1);
        const end = new Date(y, m, 1);
        where.orderDate = { gte: start, lt: end };
      }
    } else if (year) {
      const y = Number(year);
      if (!isNaN(y)) {
        const start = new Date(y, 0, 1);
        const end = new Date(y + 1, 0, 1);
        where.orderDate = { gte: start, lt: end };
      }
    }

    const data = await prisma.order.findMany({
      where,
      include: {
        client: { select: { companyName: true } },
        items: { select: { id: true } },
      },
      orderBy: { id: "desc" },
    });

    const statusLabels: Record<string, string> = {
      DRAFT: "임시저장",
      PROGRESS: "진행중",
      COMPLETE: "완료",
      HOLD: "보류",
    };

    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet("발주서 목록");

    const headers = [
      "발주번호",
      "거래처",
      "발주일",
      "납기일",
      "발주자",
      "품목수",
      "상태",
    ];

    const headerRow = ws.addRow(headers);
    applyHeaderStyle(headerRow, headers.length);

    ws.columns = [
      { width: 20 },
      { width: 20 },
      { width: 12 },
      { width: 12 },
      { width: 10 },
      { width: 8 },
      { width: 10 },
    ];

    const numberCols = [6];

    for (const row of data) {
      const r = ws.addRow([
        row.orderNumber,
        row.client?.companyName || "",
        row.orderDate.toISOString().split("T")[0],
        row.dueDate ? row.dueDate.toISOString().split("T")[0] : "",
        row.orderer || "",
        row.items.length,
        statusLabels[row.status] || row.status,
      ]);
      applyDataStyle(r, headers.length, numberCols);
    }

    const buffer = await wb.xlsx.writeBuffer();

    return new NextResponse(buffer, {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename=orders_${new Date().toISOString().split("T")[0]}.xlsx`,
      },
    });
  } catch (error) {
    console.error("발주서 엑셀 다운로드 오류:", error);
    return NextResponse.json(
      { message: "엑셀 생성에 실패했습니다" },
      { status: 500 }
    );
  }
}
