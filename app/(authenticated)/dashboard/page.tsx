"use client";

import { RecentOrdersTable } from "@/components/dashboard/recent-orders-table";
import { RecentQuotesTable } from "@/components/dashboard/recent-quotes-table";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { formatAmount } from "@/lib/utils/format";
import {
  Banknote,
  Building2,
  ClipboardList,
  RefreshCw,
  ShoppingCart,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";

interface DashboardData {
  year: number;
  month: number;
  totalSales: number;
  totalPurchase: number;
  targetAmount: number | null;
  progressOrderCount: number;
  newClientCount: number;
  recentOrders: {
    id: number;
    orderNumber: string;
    clientName: string;
    orderDate: string;
    status: string;
  }[];
  recentQuotes: {
    id: number;
    estimateNumber: string;
    clientName: string;
    estimateDate: string;
    stage: string;
  }[];
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/dashboard");
      if (!res.ok) {
        throw new Error(`서버 응답 오류 (${res.status})`);
      }
      const json = await res.json();
      if (json.error) {
        throw new Error(json.error);
      }
      setData(json);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "데이터 조회에 실패했습니다";
      setError(message);
      console.error("대시보드 데이터 조회 실패:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader title="대시보드" />
        <div className="text-muted-foreground flex h-64 items-center justify-center text-lg">
          불러오는 중...
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="space-y-6">
        <PageHeader title="대시보드" />
        <div className="flex h-64 flex-col items-center justify-center gap-4">
          <p className="text-muted-foreground text-lg">
            {error || "데이터를 불러올 수 없습니다"}
          </p>
          <Button variant="outline" onClick={fetchDashboard} className="gap-2">
            <RefreshCw className="h-4 w-4" />
            다시 시도
          </Button>
        </div>
      </div>
    );
  }

  const {
    year,
    month,
    totalSales,
    totalPurchase,
    targetAmount,
    progressOrderCount,
    newClientCount,
    recentOrders,
    recentQuotes,
  } = data;

  const achievementRate =
    targetAmount && targetAmount > 0
      ? Math.min(Math.round((totalSales / targetAmount) * 100), 100)
      : null;

  return (
    <div className="space-y-6">
      <PageHeader
        title="대시보드"
        description={`${year}년 ${month}월 영업 현황`}
      />

      {/* ── 상단: KPI 카드 4장 + 매출목표 카드 ── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
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
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">
              최근 발주서
            </CardTitle>
            <CardDescription>최근 등록된 발주서 5건</CardDescription>
          </CardHeader>
          <CardContent>
            <RecentOrdersTable data={recentOrders} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">
              최근 견적서
            </CardTitle>
            <CardDescription>최근 등록된 견적서 5건</CardDescription>
          </CardHeader>
          <CardContent>
            <RecentQuotesTable data={recentQuotes} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
