import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    const monthStart = new Date(year, now.getMonth(), 1);
    const monthEnd = new Date(year, now.getMonth() + 1, 0, 23, 59, 59, 999);

    // seed 데이터 왜곡 방지: 시스템 최초 생성 시점(회사정보) 이후에 생성된 거래처만 카운트
    const companyInfo = await prisma.companyInfo.findFirst({
      where: { id: 1 },
      select: { createdAt: true },
    });
    const systemCreatedAt = companyInfo?.createdAt ?? new Date(0);
    // seed 직후 1분 이내 생성된 거래처는 기존 데이터로 간주
    const seedCutoff = new Date(systemCreatedAt.getTime() + 60_000);

    const [
      salesAgg,
      purchaseAgg,
      salesTarget,
      progressOrderCount,
      newClientCount,
      recentOrders,
      recentQuotes,
    ] = await Promise.all([
      prisma.salesRecord.aggregate({
        _sum: { supplyAmount: true },
        where: { transactionType: "매출", year, month },
      }),
      prisma.salesRecord.aggregate({
        _sum: { supplyAmount: true },
        where: { transactionType: "매입", year, month },
      }),
      prisma.salesTarget.findFirst({
        where: { year, month },
      }),
      prisma.order.count({
        where: { status: "PROGRESS" },
      }),
      prisma.client.count({
        where: {
          createdAt: {
            gte: monthStart > seedCutoff ? monthStart : seedCutoff,
            lte: monthEnd,
          },
        },
      }),
      prisma.order.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          orderNumber: true,
          orderDate: true,
          status: true,
          client: { select: { companyName: true } },
        },
      }),
      prisma.estimate.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          estimateNumber: true,
          estimateDate: true,
          stage: true,
          client: { select: { companyName: true } },
        },
      }),
    ]);

    const sumSales = salesAgg._sum.supplyAmount;
    const totalSales = sumSales ? Number(String(sumSales)) : 0;

    const sumPurchase = purchaseAgg._sum.supplyAmount;
    const totalPurchase = sumPurchase ? Number(String(sumPurchase)) : 0;

    const targetAmount = salesTarget
      ? Number(String(salesTarget.targetAmount))
      : null;

    const orders = recentOrders.map((o) => ({
      id: o.id,
      orderNumber: o.orderNumber,
      clientName: o.client.companyName,
      orderDate: new Date(o.orderDate).toISOString().split("T")[0],
      status: o.status,
    }));

    const quotes = recentQuotes.map((q) => ({
      id: q.id,
      estimateNumber: q.estimateNumber,
      clientName: q.client.companyName,
      estimateDate: new Date(q.estimateDate).toISOString().split("T")[0],
      stage: q.stage,
    }));

    return NextResponse.json({
      year,
      month,
      totalSales,
      totalPurchase,
      targetAmount,
      progressOrderCount,
      newClientCount,
      recentOrders: orders,
      recentQuotes: quotes,
    });
  } catch (error) {
    console.error("대시보드 API 오류:", error);
    const message =
      error instanceof Error ? error.message : "알 수 없는 오류";
    return NextResponse.json(
      { error: "데이터 조회 실패", detail: message },
      { status: 500 },
    );
  }
}
