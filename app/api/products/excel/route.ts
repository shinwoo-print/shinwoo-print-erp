import { prisma } from "@/lib/prisma";
import { applyDataStyle, applyHeaderStyle, NUMBER_FORMAT } from "@/lib/excel/excel-styles";
import ExcelJS from "exceljs";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const search = searchParams.get("search") || "";

    const where = {
      isActive: true,
      ...(search
        ? {
            OR: [
              { productName: { contains: search } },
              { spec: { contains: search } },
            ],
          }
        : {}),
    };

    const data = await prisma.product.findMany({
      where,
      orderBy: { id: "desc" },
    });

    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet("품목 목록");

    const headers = ["품목명", "규격", "인쇄종류", "원단", "기본단가", "상태"];

    const headerRow = ws.addRow(headers);
    applyHeaderStyle(headerRow, headers.length);

    ws.columns = [
      { width: 30 },
      { width: 15 },
      { width: 15 },
      { width: 15 },
      { width: 15 },
      { width: 8 },
    ];

    const numberCols = [5];

    for (const row of data) {
      const r = ws.addRow([
        row.productName,
        row.spec || "",
        row.printType || "",
        row.material || "",
        row.unitPrice ? Number(row.unitPrice) : "",
        row.isActive ? "활성" : "비활성",
      ]);
      applyDataStyle(r, headers.length, numberCols);
    }

    const buffer = await wb.xlsx.writeBuffer();

    return new NextResponse(buffer, {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename=products_${new Date().toISOString().split("T")[0]}.xlsx`,
      },
    });
  } catch (error) {
    console.error("품목 엑셀 다운로드 오류:", error);
    return NextResponse.json(
      { message: "엑셀 생성에 실패했습니다" },
      { status: 500 }
    );
  }
}
