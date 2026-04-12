import { prisma } from "@/lib/prisma";
import { applyDataStyle, applyHeaderStyle } from "@/lib/excel/excel-styles";
import ExcelJS from "exceljs";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const search = searchParams.get("search") || "";
    const year = searchParams.get("year") || "";
    const month = searchParams.get("month") || "";

    const where: Record<string, unknown> = {};
    if (search) {
      where.OR = [
        { transactionNumber: { contains: search } },
        { client: { companyName: { contains: search } } },
      ];
    }
    if (year && month) {
      const y = Number(year);
      const m = Number(month);
      if (!isNaN(y) && !isNaN(m) && m >= 1 && m <= 12) {
        const start = new Date(y, m - 1, 1);
        const end = new Date(y, m, 1);
        where.transactionDate = { gte: start, lt: end };
      }
    } else if (year) {
      const y = Number(year);
      if (!isNaN(y)) {
        const start = new Date(y, 0, 1);
        const end = new Date(y + 1, 0, 1);
        where.transactionDate = { gte: start, lt: end };
      }
    }

    const data = await prisma.transaction.findMany({
      where,
      include: {
        client: { select: { companyName: true } },
        items: { select: { id: true } },
      },
      orderBy: { transactionDate: "desc" },
    });

    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet("거래명세서 목록");

    const headers = [
      "거래명세서번호",
      "거래처명",
      "거래일",
      "수량합계",
      "공급가액",
      "부가세",
      "총액",
    ];

    const headerRow = ws.addRow(headers);
    applyHeaderStyle(headerRow, headers.length);

    ws.columns = [
      { width: 22 },
      { width: 20 },
      { width: 12 },
      { width: 12 },
      { width: 15 },
      { width: 15 },
      { width: 15 },
    ];

    const numberCols = [4, 5, 6, 7];

    for (const row of data) {
      const r = ws.addRow([
        row.transactionNumber,
        row.client?.companyName || "",
        row.transactionDate.toISOString().split("T")[0],
        row.totalQuantity,
        Number(row.totalSupplyAmount),
        Number(row.totalVat),
        Number(row.totalAmount),
      ]);
      applyDataStyle(r, headers.length, numberCols);
    }

    const buffer = await wb.xlsx.writeBuffer();

    return new NextResponse(buffer, {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename=transactions_${new Date().toISOString().split("T")[0]}.xlsx`,
      },
    });
  } catch (error) {
    console.error("거래명세서 엑셀 다운로드 오류:", error);
    return NextResponse.json(
      { message: "엑셀 생성에 실패했습니다" },
      { status: 500 }
    );
  }
}
