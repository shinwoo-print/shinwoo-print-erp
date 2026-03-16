import { prisma } from "@/lib/prisma";
import { renderPdfToResponse } from "@/lib/pdf/render-pdf";
import { EstimatePdfDocument } from "@/components/pdf/estimate-pdf";
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

    // 견적서 + 회사정보 + 계좌정보 동시 조회
    const [estimate, company, bank] = await Promise.all([
      prisma.estimate.findUnique({
        where: { id: estimateId },
        include: {
          client: {
            select: { companyName: true, contactName: true },
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

    if (!estimate) {
      return NextResponse.json(
        { message: "견적서를 찾을 수 없습니다" },
        { status: 404 }
      );
    }

    if (!company) {
      return NextResponse.json(
        { message: "회사 정보가 등록되지 않았습니다" },
        { status: 500 }
      );
    }

    if (!bank) {
      return NextResponse.json(
        { message: "계좌 정보가 등록되지 않았습니다" },
        { status: 500 }
      );
    }

    const pdfData = {
      estimateNumber: estimate.estimateNumber,
      estimateDate: estimate.estimateDate.toISOString().split("T")[0],
      clientCompanyName: estimate.client.companyName,
      clientContactName:
        estimate.clientContactName || estimate.client.contactName,
      recipientText: estimate.recipientText,
      validDays: estimate.validDays,
      totalSupplyAmount: estimate.totalSupplyAmount.toString(),
      totalVat: estimate.totalVat.toString(),
      totalAmount: estimate.totalAmount.toString(),
      note: estimate.note,
      items: estimate.items.map((item) => ({
        productName: item.productName,
        spec: item.spec,
        quantity: item.quantity,
        quantityText: item.quantityText,
        unitPrice: item.unitPrice.toString(),
        unitPriceText: item.unitPriceText,
        supplyAmount: item.supplyAmount.toString(),
        vat: item.vat.toString(),
        note: item.note,
      })),
      company: {
        companyName: company.companyName,
        representative: company.representative,
        address: company.address,
        phone: company.phone,
        fax: company.fax,
        businessNumber: company.businessNumber,
        businessType: company.businessType,
        businessItem: company.businessItem,
        sealUrl: company.sealUrl,
      },
      bank: {
        bankName: bank.bankName,
        accountNumber: bank.accountNumber,
        accountHolder: bank.accountHolder,
      },
    };

    const fileName = `견적서_${estimate.estimateNumber}_${estimate.client.companyName}`;
    return await renderPdfToResponse(
      <EstimatePdfDocument data={ pdfData } />,
      fileName
    );
  } catch (error) {
    console.error("견적서 PDF 생성 오류:", error);
    return NextResponse.json(
      { message: "PDF 생성에 실패했습니다" },
      { status: 500 }
    );
  }
}
