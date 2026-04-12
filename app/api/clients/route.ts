import { prisma } from "@/lib/prisma";
import { clientFormSchema } from "@/lib/validators/client";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const search = searchParams.get("search") || "";
    const clientType = searchParams.get("clientType") || "";
    const page = Math.max(1, Number(searchParams.get("page")) || 1);
    const pageSize = Math.max(1, Number(searchParams.get("pageSize")) || 10);
    const skip = (page - 1) * pageSize;

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

    const [data, totalCount] = await Promise.all([
      prisma.client.findMany({
        where,
        orderBy: { id: "desc" },
        skip,
        take: pageSize,
      }),
      prisma.client.count({ where }),
    ]);

    return NextResponse.json({ data, totalCount, page, pageSize });
  } catch (error) {
    console.error("거래처 목록 조회 오류:", error);
    return NextResponse.json(
      { message: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = clientFormSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { message: "유효성 검사 실패", errors: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const data = parsed.data;

    const client = await prisma.client.create({
      data: {
        companyName: data.companyName,
        clientType: data.clientType || "매출",
        representative: data.representative || null,
        contactName: data.contactName || null,
        phone: data.phone || null,
        mobilePhone: data.mobilePhone || null,
        fax: data.fax || null,
        email: data.email || null,
        address: data.address || null,
        businessNumber: data.businessNumber || null,
        businessType: data.businessType || null,
        businessItem: data.businessItem || null,
        memo: data.memo || null,
      },
    });

    return NextResponse.json(client, { status: 201 });
  } catch (error) {
    console.error("거래처 등록 오류:", error);
    return NextResponse.json(
      { message: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
