import { RecentOrdersTable } from "@/components/dashboard/recent-orders-table";
import { RecentQuotesTable } from "@/components/dashboard/recent-quotes-table";
import { PageHeader } from "@/components/shared/page-header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { prisma } from "@/lib/prisma";
import { formatAmount } from "@/lib/utils/format";
import {
  Banknote,
  Building2,
  ClipboardList,
  ShoppingCart,
} from "lucide-react";

export default async function DashboardPage() {
  // ── 당월 범위 계산 ──
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1; // 1~12
  const monthStart = new Date(year, now.getMonth(), 1);
  const monthEnd = new Date(year, now.getMonth() + 1, 0, 23, 59, 59, 999);

  // ── 6개 쿼리 병렬 실행 ──
  const [
    salesAgg,
    purchaseAgg,
    salesTarget,
    progressOrderCount,
    newClientCount,
    recentOrders,
    recentQuotes,
  ] = await Promise.all([
    // ① 이번 달 매출액 (transactionType = "매출")
    prisma.salesRecord.aggregate({
      _sum: { supplyAmount: true },
      where: {
        transactionType: "매출",
        year,
        month,
      },
    }),

    // ② 이번 달 매입액 (transactionType = "매입")
    prisma.salesRecord.aggregate({
      _sum: { supplyAmount: true },
      where: {
        transactionType: "매입",
        year,
        month,
      },
    }),

    // ③ 매출 목표
    prisma.salesTarget.findUnique({
      where: { year_month: { year, month } },
    }),

    // ④ 진행 중 발주서 건수
    prisma.order.count({
      where: { status: "PROGRESS" },
    }),

    // ⑤ 이번 달 신규 거래처 수
    prisma.client.count({
      where: {
        createdAt: { gte: monthStart, lte: monthEnd },
      },
    }),

    // ⑥ 최근 발주서 5건
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

    // ⑦ 최근 견적서 5건
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

  // ── 데이터 가공 ──
  const totalSales = Number(salesAgg._sum.supplyAmount ?? 0);
  const totalPurchase = Number(purchaseAgg._sum.supplyAmount ?? 0);
  const targetAmount = salesTarget
    ? Number(salesTarget.targetAmount)
    : null;
  const achievementRate =
    targetAmount && targetAmount > 0
      ? Math.min(Math.round((totalSales / targetAmount) * 100), 100)
      : null;

  const ordersForTable = recentOrders.map(
    (o: {
      id: number;
      orderNumber: string;
      orderDate: Date;
      status: string;
      client: { companyName: string };
    }) => ({
    id: o.id,
    orderNumber: o.orderNumber,
    clientName: o.client.companyName,
    orderDate: o.orderDate.toISOString().split("T")[0],
    status: o.status,
    }),
  );

  const quotesForTable = recentQuotes.map(
    (q: {
      id: number;
      estimateNumber: string;
      estimateDate: Date;
      stage: string;
      client: { companyName: string };
    }) => ({
    id: q.id,
    estimateNumber: q.estimateNumber,
    clientName: q.client.companyName,
    estimateDate: q.estimateDate.toISOString().split("T")[0],
    stage: q.stage,
    }),
  );

  return (
    <div className="space-y-6">
      {/* ── 페이지 헤더 ── */}
      <PageHeader
        title="대시보드"
        description={`${year}년 ${month}월 영업 현황`}
      />

      {/* ── 상단: KPI 카드 4장 + 매출목표 카드 ── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {/* KPI 1: 이번 달 매출액 */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base font-medium">
              이번 달 매출
            </CardTitle>
            <Banknote className="text-muted-foreground h-5 w-5" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold tabular-nums">
              {formatAmount(totalSales)}
              <span className="ml-1 text-lg font-semibold">원</span>
            </div>
          </CardContent>
        </Card>

        {/* KPI 2: 이번 달 매입액 */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base font-medium">
              이번 달 매입
            </CardTitle>
            <ShoppingCart className="text-muted-foreground h-5 w-5" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold tabular-nums">
              {formatAmount(totalPurchase)}
              <span className="ml-1 text-lg font-semibold">원</span>
            </div>
          </CardContent>
        </Card>

        {/* KPI 3: 진행 중 발주서 */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base font-medium">
              진행 중 발주
            </CardTitle>
            <ClipboardList className="text-muted-foreground h-5 w-5" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold tabular-nums">
              {progressOrderCount}
              <span className="ml-1 text-lg font-semibold">건</span>
            </div>
          </CardContent>
        </Card>

        {/* KPI 4: 신규 거래처 */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base font-medium">
              신규 거래처
            </CardTitle>
            <Building2 className="text-muted-foreground h-5 w-5" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold tabular-nums">
              {newClientCount}
              <span className="ml-1 text-lg font-semibold">곳</span>
            </div>
          </CardContent>
        </Card>

        {/* ② 매출 목표 달성 카드 */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium">
              매출 목표 달성
            </CardTitle>
            {targetAmount !== null && (
              <CardDescription className="text-sm">
                목표 {formatAmount(targetAmount)}원
              </CardDescription>
            )}
          </CardHeader>
          <CardContent>
            {targetAmount !== null && achievementRate !== null ? (
              <div className="space-y-3">
                <div className="text-3xl font-bold tabular-nums">
                  {achievementRate}
                  <span className="ml-0.5 text-lg font-semibold">%</span>
                </div>
                <Progress value={achievementRate} className="h-3" />
                <p className="text-muted-foreground text-sm">
                  {formatAmount(totalSales)}원 / {formatAmount(targetAmount)}원
                </p>
              </div>
            ) : (
              <div className="flex h-[72px] items-center">
                <p className="text-muted-foreground text-base">
                  이번 달 매출 목표를 설정해주세요
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── 하단: 최근 발주서 / 최근 견적서 2열 ── */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* ③ 최근 발주서 5건 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">
              최근 발주서
            </CardTitle>
            <CardDescription>최근 등록된 발주서 5건</CardDescription>
          </CardHeader>
          <CardContent>
            <RecentOrdersTable data={ordersForTable} />
          </CardContent>
        </Card>

        {/* ④ 최근 견적서 5건 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">
              최근 견적서
            </CardTitle>
            <CardDescription>최근 등록된 견적서 5건</CardDescription>
          </CardHeader>
          <CardContent>
            <RecentQuotesTable data={quotesForTable} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
