import { prisma } from "@/lib/prisma";
import { companyInfoSchema } from "@/lib/validators/company";
import { NextRequest, NextResponse } from "next/server";

const COMPANY_ID = 1;

/**
 * GET /api/company — 회사정보 단건 조회 (id=1)
 */
export async function GET() {
  try {
    const company = await prisma.companyInfo.findUnique({
      where: { id: COMPANY_ID },
    });
    return NextResponse.json(company ?? null);
  } catch (error) {
    console.error("회사정보 조회 오류:", error);
    return NextResponse.json(
      { message: "서버 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/company — 회사정보 업서트 (없으면 생성, 있으면 수정)
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = companyInfoSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { message: "유효성 검사 실패", errors: parsed.error.flatten() },
        { status: 400 }
      );
    }
    const data = parsed.data;
    const company = await prisma.companyInfo.upsert({
      where: { id: COMPANY_ID },
      create: {
        id: COMPANY_ID,
        companyName: data.companyName,
        representative: data.representative,
        address: data.address,
        phone: data.phone,
        fax: data.fax || null,
        businessNumber: data.businessNumber,
        businessType: data.businessType || null,
        businessItem: data.businessItem || null,
        logoUrl: data.logoUrl || null,
        sealUrl: data.sealUrl || null,
      },
      update: {
        companyName: data.companyName,
        representative: data.representative,
        address: data.address,
        phone: data.phone,
        fax: data.fax || null,
        businessNumber: data.businessNumber,
        businessType: data.businessType || null,
        businessItem: data.businessItem || null,
        logoUrl: data.logoUrl || null,
        sealUrl: data.sealUrl || null,
      },
    });
    return NextResponse.json(company);
  } catch (error) {
    console.error("회사정보 저장 오류:", error);
    return NextResponse.json(
      { message: "서버 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}
