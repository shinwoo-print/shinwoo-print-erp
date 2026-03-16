import { prisma } from "@/lib/prisma";
import { renderPdfToResponse } from "@/lib/pdf/render-pdf";
import { TransactionPdfDocument } from "@/components/pdf/transaction-pdf";
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
              fax: true,
              address: true,
              businessNumber: true,
              businessType: true,
              businessItem: true,
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
      transactionNumber: transaction.transactionNumber,
      transactionDate: transaction.transactionDate
        .toISOString()
        .split("T")[0],
      totalQuantity: transaction.totalQuantity,
      totalSupplyAmount: transaction.totalSupplyAmount.toString(),
      totalVat: transaction.totalVat.toString(),
      totalAmount: transaction.totalAmount.toString(),
      note: transaction.note,
      items: transaction.items.map((item) => ({
        itemDate: item.itemDate.toISOString().split("T")[0],
        productName: item.productName,
        spec: item.spec,
        quantity: item.quantity,
        unit: item.unit,
        unitPrice: item.unitPrice.toString(),
        supplyAmount: item.supplyAmount.toString(),
        vat: item.vat.toString(),
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
      client: {
        companyName: transaction.client.companyName,
        contactName: transaction.client.contactName,
        phone: transaction.client.phone,
        fax: transaction.client.fax,
        address: transaction.client.address,
        businessNumber: transaction.client.businessNumber,
        businessType: transaction.client.businessType,
        businessItem: transaction.client.businessItem,
      },
      bank: {
        bankName: bank.bankName,
        accountNumber: bank.accountNumber,
        accountHolder: bank.accountHolder,
      },
    };

    const fileName = `거래명세서_${transaction.transactionNumber}_${transaction.client.companyName}`;
    return await renderPdfToResponse(
      <TransactionPdfDocument data={ pdfData } />,
      fileName
    );
  } catch (error) {
    console.error("거래명세서 PDF 생성 오류:", error);
    return NextResponse.json(
      { message: "PDF 생성에 실패했습니다" },
      { status: 500 }
    );
  }
}
