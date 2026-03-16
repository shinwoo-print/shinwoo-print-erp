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
    const estimateId = Number(id);

    if (isNaN(estimateId)) {
      return NextResponse.json(
        { message: "유효하지 않은 ID입니다" },
        { status: 400 }
      );
    }

    const [estimate, company, bank] = await Promise.all([
      prisma.estimate.findUnique({
        where: { id: estimateId },
        include: {
          client: { select: { companyName: true, contactName: true } },
          items: { orderBy: { sortOrder: "asc" } },
        },
      }),
      prisma.companyInfo.findFirst({ where: { id: 1 } }),
      prisma.bankAccount.findFirst({
        where: { isDefault: true },
        orderBy: { sortOrder: "asc" },
      }),
    ]);

    if (!estimate) {
      return NextResponse.json(
        { message: "견적서를 찾을 수 없습니다" },
        { status: 404 }
      );
    }

    const workbook = new ExcelJS.Workbook();
    workbook.creator = "신우씨링 ERP";
    workbook.created = new Date();

    const sheet = workbook.addWorksheet("견적서");

    // 컬럼 폭
    sheet.columns = [
      { width: 5 },  // A: No
      { width: 25 }, // B: 품명
      { width: 14 }, // C: 규격
      { width: 12 }, // D: 발주수량
      { width: 12 }, // E: 단가
      { width: 14 }, // F: 공급가액
      { width: 12 }, // G: 세액
      { width: 14 }, // H: 비고
    ];

    const COL_COUNT = 8;
    const NUMBER_COLS = [4, 5, 6, 7];

    // 타이틀
    sheet.mergeCells("A1:H1");
    const titleCell = sheet.getCell("A1");
    titleCell.value = "견 적 서";
    titleCell.font = { bold: true, size: 18 };
    titleCell.alignment = { horizontal: "center", vertical: "middle" };
    sheet.getRow(1).height = 36;

    // 날짜
    sheet.mergeCells("A2:H2");
    const dateCell = sheet.getCell("A2");
    const d = estimate.estimateDate;
    const dayNames = ["일", "월", "화", "수", "목", "금", "토"];
    dateCell.value = `${d.getFullYear()}년 ${String(d.getMonth() + 1).padStart(2, "0")}월 ${String(d.getDate()).padStart(2, "0")}일(${dayNames[d.getDay()]})`;
    dateCell.font = { size: 11 };
    dateCell.alignment = { horizontal: "center" };

    // 수신자
    sheet.getCell("A3").value = "수신:";
    sheet.getCell("A3").font = { bold: true };
    sheet.getCell("B3").value =
      estimate.recipientText ||
      `${estimate.client.companyName} ${estimate.clientContactName || estimate.client.contactName || ""} 귀 하`;

    // 공급자 정보 (E3~H8)
    if (company) {
      sheet.getCell("E3").value = "공급자 정보";
      sheet.getCell("E3").font = { bold: true };
      sheet.getCell("E4").value = "사업자번호:";
      sheet.getCell("F4").value = company.businessNumber;
      sheet.getCell("E5").value = "상호:";
      sheet.getCell("F5").value = company.companyName;
      sheet.getCell("E6").value = "대표:";
      sheet.getCell("F6").value = company.representative;
      sheet.getCell("E7").value = "주소:";
      sheet.getCell("F7").value = company.address;
      sheet.getCell("E8").value = "TEL:";
      sheet.getCell("F8").value = `${company.phone} / FAX: ${company.fax || ""}`;
    }

    // 안내문
    sheet.getCell("A4").value = "하기와 같이 견적 합니다.";
    sheet.getCell("A5").value = `* 유효기간은 견적일로부터 ${estimate.validDays}일입니다.`;
    sheet.getCell("A5").font = { color: { argb: "FFFF0000" }, size: 9 };

    // 헤더 (10행)
    const startRow = 10;
    const headerRow = sheet.getRow(startRow);
    headerRow.values = [
      "No",
      "품명",
      "규격(mm)",
      "발주수량",
      "단가(원)",
      "공급가액",
      "세액",
      "비고",
    ];
    applyHeaderStyle(headerRow, COL_COUNT);

    // 데이터 행
    estimate.items.forEach((item, idx) => {
      const row = sheet.addRow([
        idx + 1,
        item.productName,
        item.spec || "",
        item.quantityText || item.quantity,
        item.unitPriceText || Number(item.unitPrice),
        Number(item.supplyAmount),
        Number(item.vat),
        item.note || "",
      ]);
      applyDataStyle(row, COL_COUNT, NUMBER_COLS);
    });

    // 합계 행
    const totalSupply = Number(estimate.totalSupplyAmount) || 0;
    const totalVat = Number(estimate.totalVat) || 0;
    const totalAmount = Number(estimate.totalAmount) || 0;

    const sumRow = sheet.addRow([
      "",
      "합계금액",
      "",
      "",
      "",
      totalSupply,
      totalVat,
      "",
    ]);
    applyTotalStyle(sumRow, COL_COUNT, NUMBER_COLS);

    const grandRow = sheet.addRow([
      "",
      "총합계금액(VAT포함)",
      "",
      "",
      "",
      totalAmount,
      "",
      "",
    ]);
    sheet.mergeCells(
      `F${grandRow.number}:H${grandRow.number}`
    );
    applyTotalStyle(grandRow, COL_COUNT, [6]);
    grandRow.getCell(6).font = { bold: true, size: 12 };
    grandRow.getCell(6).numFmt = "#,##0";

    // 특이사항
    const noteStart = grandRow.number + 2;
    sheet.getCell(`A${noteStart}`).value = "특이사항";
    sheet.getCell(`A${noteStart}`).font = { bold: true };
    sheet.getCell(`A${noteStart + 1}`).value =
      "※ 예상 입고일정은 시안확정 후 평일 기준 5~7일 정도 소요됩니다.";
    sheet.getCell(`A${noteStart + 2}`).value =
      "※ 세금계산서 발행시 사업자등록증 사본(발행메일기재)을 함께 보내주시기 바랍니다.";

    // 입금계좌
    if (bank) {
      sheet.getCell(`A${noteStart + 4}`).value = "입금계좌정보:";
      sheet.getCell(`A${noteStart + 4}`).font = { bold: true };
      sheet.getCell(`B${noteStart + 4}`).value = `${bank.bankName} ${bank.accountNumber} / 예금주: ${bank.accountHolder}`;
    }

    // 견적 담당자
    sheet.getCell(`A${noteStart + 5}`).value = "견적 담당자:";
    sheet.getCell(`A${noteStart + 5}`).font = { bold: true };
    sheet.getCell(`B${noteStart + 5}`).value =
      "박성진 실장 010-3583-6312 shinwoo6536@hanmail.net";

    const buffer = await workbook.xlsx.writeBuffer();

    const fileName = `견적서_${estimate.estimateNumber}_${estimate.client.companyName}`;
    return new Response(buffer, {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${encodeURIComponent(fileName)}.xlsx"`,
      },
    });
  } catch (error) {
    console.error("견적서 엑셀 생성 오류:", error);
    return NextResponse.json(
      { message: "엑셀 생성에 실패했습니다" },
      { status: 500 }
    );
  }
}
