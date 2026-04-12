import { prisma } from "@/lib/prisma";
import { applyDataStyle, applyHeaderStyle } from "@/lib/excel/excel-styles";
import ExcelJS from "exceljs";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const search = searchParams.get("search") || "";
    const clientType = searchParams.get("clientType") || "";

    const where = {
      isActive: true,
      ...(search
        ? {
            OR: [
              { companyName: { contains: search } },
              { contactName: { contains: search } },
            ],
          }
        : {}),
      ...(clientType ? { clientType } : {}),
    };

    const data = await prisma.client.findMany({
      where,
      orderBy: { id: "desc" },
    });

    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet("거래처 목록");

    const headers = [
      "업체명",
      "거래구분",
      "대표자명",
      "담당자",
      "연락처",
      "핸드폰",
      "팩스",
      "이메일",
      "사업자번호",
      "업태",
      "종목",
      "주소",
      "상태",
    ];

    const headerRow = ws.addRow(headers);
    applyHeaderStyle(headerRow, headers.length);

    ws.columns = [
      { width: 20 },
      { width: 10 },
      { width: 12 },
      { width: 12 },
      { width: 15 },
      { width: 15 },
      { width: 15 },
      { width: 25 },
      { width: 15 },
      { width: 12 },
      { width: 12 },
      { width: 30 },
      { width: 8 },
    ];

    for (const row of data) {
      const r = ws.addRow([
        row.companyName,
        row.clientType,
        row.representative || "",
        row.contactName || "",
        row.phone || "",
        (row as Record<string, unknown>).mobilePhone || "",
        row.fax || "",
        row.email || "",
        row.businessNumber || "",
        row.businessType || "",
        row.businessItem || "",
        row.address || "",
        row.isActive ? "활성" : "비활성",
      ]);
      applyDataStyle(r, headers.length);
    }

    const buffer = await wb.xlsx.writeBuffer();

    return new NextResponse(buffer, {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename=clients_${new Date().toISOString().split("T")[0]}.xlsx`,
      },
    });
  } catch (error) {
    console.error("거래처 엑셀 다운로드 오류:", error);
    return NextResponse.json(
      { message: "엑셀 생성에 실패했습니다" },
      { status: 500 }
    );
  }
}
