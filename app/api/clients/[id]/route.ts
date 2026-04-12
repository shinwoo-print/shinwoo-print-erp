import { prisma } from "@/lib/prisma";
import { clientFormSchema } from "@/lib/validators/client";
import { NextRequest, NextResponse } from "next/server";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const clientId = Number(id);

    if (isNaN(clientId)) {
      return NextResponse.json(
        { message: "유효하지 않은 ID입니다." },
        { status: 400 }
      );
    }

    const client = await prisma.client.findUnique({
      where: { id: clientId },
    });

    if (!client) {
      return NextResponse.json(
        { message: "거래처를 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    return NextResponse.json(client);
  } catch (error) {
    console.error("거래처 상세 조회 오류:", error);
    return NextResponse.json(
      { message: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const clientId = Number(id);

    if (isNaN(clientId)) {
      return NextResponse.json(
        { message: "유효하지 않은 ID입니다." },
        { status: 400 }
      );
    }

    const body = await request.json();
    const parsed = clientFormSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { message: "유효성 검사 실패", errors: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const data = parsed.data;

    const client = await prisma.client.update({
      where: { id: clientId },
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

    return NextResponse.json(client);
  } catch (error) {
    console.error("거래처 수정 오류:", error);
    return NextResponse.json(
      { message: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const clientId = Number(id);

    if (isNaN(clientId)) {
      return NextResponse.json(
        { message: "유효하지 않은 ID입니다." },
        { status: 400 }
      );
    }

    await prisma.client.update({
      where: { id: clientId },
      data: { isActive: false },
    });

    return NextResponse.json({ message: "거래처가 삭제되었습니다." });
  } catch (error) {
    console.error("거래처 삭제 오류:", error);
    return NextResponse.json(
      { message: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
