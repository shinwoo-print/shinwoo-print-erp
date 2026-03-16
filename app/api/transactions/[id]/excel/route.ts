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
    const transactionId = Number(id);

    if (isNaN(transactionId)) {
      return NextResponse.json(
        { message: "유효하지 않은 ID입니다" },
        { status: 400 }
      );
    }

    const [transaction, company, bank] = await Promise.all([
      prisma.transaction.findUnique({
        where: { id: transactionId },
        include: {
          client: {
            select: {
              companyName: true,
              contactName: true,
              phone: true,
              businessNumber: true,
            },
          },
          items: { orderBy: { sortOrder: "asc" } },
        },
      }),
      prisma.companyInfo.findFirst({ where: { id: 1 } }),
      prisma.bankAccount.findFirst({
        where: { isDefault: true },
        orderBy: { sortOrder: "asc" },
      }),
    ]);

    if (!transaction) {
      return NextResponse.json(
        { message: "거래명세서를 찾을 수 없습니다" },
        { status: 404 }
      );
    }

    const workbook = new ExcelJS.Workbook();
    workbook.creator = "신우씨링 ERP";
    workbook.created = new Date();

    const sheet = workbook.addWorksheet("거래명세서");

    sheet.columns = [
      { width: 5 },  // A: No
      { width: 12 }, // B: 일자
      { width: 22 }, // C: 품명
      { width: 12 }, // D: 규격
      { width: 8 },  // E: 수량
      { width: 6 },  // F: 단위
      { width: 12 }, // G: 단가
      { width: 14 }, // H: 공급가액
      { width: 12 }, // I: 부가세
    ];

    const COL_COUNT = 9;
    const NUMBER_COLS = [5, 7, 8, 9];

    // 타이틀
    sheet.mergeCells("A1:I1");
    const titleCell = sheet.getCell("A1");
    titleCell.value = "거 래 명 세 서";
    titleCell.font = { bold: true, size: 16 };
    titleCell.alignment = { horizontal: "center", vertical: "middle" };
    sheet.getRow(1).height = 32;

    // 거래명세서 번호 + 일자
    sheet.getCell("A2").value = `No: ${transaction.transactionNumber}`;
    sheet.getCell("A2").font = { bold: true };
    sheet.getCell("E2").value = `거래일: ${transaction.transactionDate.toISOString().split("T")[0]}`;

    // 공급자 정보
    if (company) {
      sheet.getCell("A3").value = "[공급자]";
      sheet.getCell("A3").font = { bold: true };
      sheet.getCell("B3").value = `${company.companyName} | 대표: ${company.representative}`;
      sheet.getCell("B4").value = `사업자번호: ${company.businessNumber} | TEL: ${company.phone}`;
    }

    // 공급받는자 정보
    sheet.getCell("F3").value = "[공급받는자]";
    sheet.getCell("F3").font = { bold: true };
    sheet.getCell("G3").value = `${transaction.client.companyName} | ${transaction.client.contactName || ""}`;
    sheet.getCell("G4").value = `사업자번호: ${transaction.client.businessNumber || ""} | TEL: ${transaction.client.phone || ""}`;

    // 헤더 (6행)
    const headerRow = sheet.getRow(6);
    headerRow.values = [
      "No",
      "일자",
      "품명",
      "규격",
      "수량",
      "단위",
      "단가",
      "공급가액",
      "부가세",
    ];
    applyHeaderStyle(headerRow, COL_COUNT);

    // 데이터 행
    transaction.items.forEach((item, idx) => {
      const row = sheet.addRow([
        idx + 1,
        item.itemDate.toISOString().split("T")[0],
        item.productName,
        item.spec || "",
        item.quantity,
        item.unit || "EA",
        Number(item.unitPrice),
        Number(item.supplyAmount),
        Number(item.vat),
      ]);
      applyDataStyle(row, COL_COUNT, NUMBER_COLS);
    });

    // 합계 행
    const totalSupply = Number(transaction.totalSupplyAmount) || 0;
    const totalVat = Number(transaction.totalVat) || 0;
    const totalAmount = Number(transaction.totalAmount) || 0;

    const sumRow = sheet.addRow([
      "",
      "",
      "합 계",
      "",
      transaction.totalQuantity,
      "",
      "",
      totalSupply,
      totalVat,
    ]);
    applyTotalStyle(sumRow, COL_COUNT, NUMBER_COLS);

    // 합계금액 행
    const grandRow = sheet.addRow([
      "",
      "",
      "합계금액(VAT포함)",
      "",
      "",
      "",
      "",
      totalAmount,
      "",
    ]);
    sheet.mergeCells(`H${grandRow.number}:I${grandRow.number}`);
    applyTotalStyle(grandRow, COL_COUNT, [8]);
    grandRow.getCell(8).font = { bold: true, size: 12 };
    grandRow.getCell(8).numFmt = "#,##0";

    // 입금계좌
    if (bank) {
      const bankRowNum = grandRow.number + 2;
      sheet.getCell(`A${bankRowNum}`).value = "입금계좌:";
      sheet.getCell(`A${bankRowNum}`).font = { bold: true };
      sheet.getCell(`B${bankRowNum}`).value = `${bank.bankName} ${bank.accountNumber} / 예금주: ${bank.accountHolder}`;
    }

    const buffer = await workbook.xlsx.writeBuffer();

    const fileName = `거래명세서_${transaction.transactionNumber}_${transaction.client.companyName}`;
    return new Response(buffer, {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${encodeURIComponent(fileName)}.xlsx"`,
      },
    });
  } catch (error) {
    console.error("거래명세서 엑셀 생성 오류:", error);
    return NextResponse.json(
      { message: "엑셀 생성에 실패했습니다" },
      { status: 500 }
    );
  }
}
