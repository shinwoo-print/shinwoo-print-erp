import { prisma } from "@/lib/prisma";
import { applyDataStyle, applyHeaderStyle } from "@/lib/excel/excel-styles";
import ExcelJS from "exceljs";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const search = searchParams.get("search") || "";
    const stage = searchParams.get("stage") || "";

    const where: Record<string, unknown> = {};
    if (stage) where.stage = stage;
    if (search) {
      where.OR = [
        { estimateNumber: { contains: search } },
        { client: { companyName: { contains: search } } },
      ];
    }

    const data = await prisma.estimate.findMany({
      where,
      include: {
        client: { select: { companyName: true } },
        items: { select: { id: true } },
      },
      orderBy: { id: "desc" },
    });

    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet("견적서 목록");

    const headers = [
      "견적번호",
      "거래처",
      "견적일",
      "유효기간(일)",
      "진행단계",
      "공급가액",
      "부가세",
      "총합계",
    ];

    const headerRow = ws.addRow(headers);
    applyHeaderStyle(headerRow, headers.length);

    ws.columns = [
      { width: 20 },
      { width: 20 },
      { width: 12 },
      { width: 12 },
      { width: 12 },
      { width: 15 },
      { width: 15 },
      { width: 15 },
    ];

    const numberCols = [4, 6, 7, 8];

    for (const row of data) {
      const r = ws.addRow([
        row.estimateNumber,
        row.client?.companyName || "",
        row.estimateDate.toISOString().split("T")[0],
        row.validDays,
        row.stage,
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
        "Content-Disposition": `attachment; filename=estimates_${new Date().toISOString().split("T")[0]}.xlsx`,
      },
    });
  } catch (error) {
    console.error("견적서 엑셀 다운로드 오류:", error);
    return NextResponse.json(
      { message: "엑셀 생성에 실패했습니다" },
      { status: 500 }
    );
  }
}
