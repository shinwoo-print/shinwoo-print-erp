import { prisma } from "@/lib/prisma";
import { applyDataStyle, applyHeaderStyle, applyTotalStyle } from "@/lib/excel/excel-styles";
import ExcelJS from "exceljs";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const year = Number(searchParams.get("year")) || new Date().getFullYear();
    const month = Number(searchParams.get("month")) || 0;
    const transactionType = searchParams.get("transactionType") || "";
    const search = searchParams.get("search") || "";

    const where: Record<string, unknown> = { year };
    if (month > 0) where.month = month;
    if (transactionType) where.transactionType = transactionType;
    if (search) {
      where.OR = [
        { client: { companyName: { contains: search } } },
        { productName: { contains: search } },
        { worker: { contains: search } },
      ];
    }

    const data = await prisma.salesRecord.findMany({
      where,
      include: {
        client: { select: { companyName: true } },
      },
      orderBy: [{ month: "asc" }, { id: "desc" }],
    });

    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet(`${year}년 ${month > 0 ? month + "월 " : ""}${transactionType || "매출매입"}`);

    const headers = [
      "년",
      "월",
      "구분",
      "발주일",
      "거래처명",
      "인쇄종류",
      "DATA종류",
      "품목",
      "수량",
      "단가",
      "공급가액",
      "부가세포함",
      "납기요청일",
      "거래명세표발급일",
      "작업자",
      "배송종류",
      "배송지역",
      "비고",
    ];

    const headerRow = ws.addRow(headers);
    applyHeaderStyle(headerRow, headers.length);

    ws.columns = [
      { width: 6 },
      { width: 5 },
      { width: 7 },
      { width: 12 },
      { width: 18 },
      { width: 12 },
      { width: 10 },
      { width: 20 },
      { width: 10 },
      { width: 12 },
      { width: 14 },
      { width: 14 },
      { width: 12 },
      { width: 14 },
      { width: 8 },
      { width: 10 },
      { width: 10 },
      { width: 20 },
    ];

    const numberCols = [9, 10, 11, 12];

    let totalSupply = 0;
    let totalTax = 0;

    for (const row of data) {
      const supply = row.supplyAmount ? Number(row.supplyAmount) : 0;
      const tax = row.taxIncludedAmount ? Number(row.taxIncludedAmount) : 0;
      totalSupply += supply;
      totalTax += tax;

      const r = ws.addRow([
        row.year,
        row.month,
        row.transactionType || "",
        row.orderReceivedDate
          ? row.orderReceivedDate.toISOString().split("T")[0]
          : "",
        row.client?.companyName || "",
        row.printType || "",
        row.dataType || "",
        row.productName || "",
        row.sheets ?? "",
        row.unitPrice ? Number(row.unitPrice) : "",
        supply || "",
        tax || "",
        row.requestedDueDate
          ? row.requestedDueDate.toISOString().split("T")[0]
          : "",
        row.transactionDate
          ? row.transactionDate.toISOString().split("T")[0]
          : "",
        row.worker || "",
        row.deliveryType || "",
        row.deliveryRegion || "",
        row.note || "",
      ]);
      applyDataStyle(r, headers.length, numberCols);
    }

    // 합계 행
    const totalRow = ws.addRow([
      "",
      "",
      "",
      "",
      "합계",
      "",
      "",
      "",
      "",
      "",
      totalSupply,
      totalTax,
      "",
      "",
      "",
      "",
      "",
      "",
    ]);
    applyTotalStyle(totalRow, headers.length, numberCols);

    const buffer = await wb.xlsx.writeBuffer();

    return new NextResponse(buffer, {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename=sales_${year}_${month || "all"}_${new Date().toISOString().split("T")[0]}.xlsx`,
      },
    });
  } catch (error) {
    console.error("매출 엑셀 다운로드 오류:", error);
    return NextResponse.json(
      { message: "엑셀 생성에 실패했습니다" },
      { status: 500 }
    );
  }
}
