"use client";

import { ClientForm } from "@/components/clients/client-form";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import type { ClientFormValues } from "@/lib/validators/client";
import { Loader2, Trash2 } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

type TabValue = "info" | "orders" | "estimates" | "transactions";

const tabs: { value: TabValue; label: string }[] = [
  { value: "info", label: "기본 정보" },
  { value: "orders", label: "발주 이력" },
  { value: "estimates", label: "견적 이력" },
  { value: "transactions", label: "거래명세서 이력" },
];

interface ClientData {
  id: number;
  companyName: string;
  clientType: string;
  representative: string | null;
  contactName: string | null;
  phone: string | null;
  fax: string | null;
  email: string | null;
  address: string | null;
  businessNumber: string | null;
  businessType: string | null;
  businessItem: string | null;
  memo: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface OrderRecord {
  id: number;
  orderNumber: string;
  orderDate: string;
  dueDate: string | null;
  status: string;
  itemCount: number;
}

interface EstimateRecord {
  id: number;
  estimateNumber: string;
  estimateDate: string;
  stage: string;
  totalAmount: string;
  itemCount: number;
}

interface TransactionRecord {
  id: number;
  transactionNumber: string;
  transactionDate: string;
  totalAmount: string;
  itemCount: number;
}

function formatAmount(value: string | number | null | undefined): string {
  if (value === null || value === undefined || value === "") return "";
  const num = typeof value === "string" ? parseFloat(value) : value;
  if (isNaN(num)) return "";
  return num.toLocaleString("ko-KR");
}

export default function ClientDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [client, setClient] = useState<ClientData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<TabValue>("info");

  // ★ 이력 데이터 상태
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [estimates, setEstimates] = useState<EstimateRecord[]>([]);
  const [estimatesLoading, setEstimatesLoading] = useState(false);
  const [transactions, setTransactions] = useState<TransactionRecord[]>([]);
  const [transactionsLoading, setTransactionsLoading] = useState(false);

  const fetchClient = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/clients/${id}`);
      if (res.ok) {
        const data = await res.json();
        setClient(data);
      } else {
        alert("거래처를 찾을 수 없습니다.");
        router.push("/clients");
      }
    } catch {
      alert("서버 오류가 발생했습니다.");
      router.push("/clients");
    } finally {
      setLoading(false);
    }
  }, [id, router]);

  useEffect(() => {
    fetchClient();
  }, [fetchClient]);

  // ★ 탭 전환 시 이력 데이터 로드
  useEffect(() => {
    if (activeTab === "orders" && orders.length === 0) {
      setOrdersLoading(true);
      fetch(`/api/orders?clientId=${id}&pageSize=100`)
        .then((res) => res.json())
        .then((json) => {
          setOrders(
            (json.data || []).map((o: Record<string, unknown>) => ({
              id: o.id as number,
              orderNumber: o.orderNumber as string,
              orderDate: o.orderDate as string,
              dueDate: (o.dueDate as string) || null,
              status: o.status as string,
              itemCount: (o.itemCount as number) || 0,
            }))
          );
        })
        .catch(() => setOrders([]))
        .finally(() => setOrdersLoading(false));
    }

    if (activeTab === "estimates" && estimates.length === 0) {
      setEstimatesLoading(true);
      fetch(`/api/estimates?clientId=${id}&pageSize=100`)
        .then((res) => res.json())
        .then((json) => {
          setEstimates(
            (json.data || []).map((e: Record<string, unknown>) => ({
              id: e.id as number,
              estimateNumber: e.estimateNumber as string,
              estimateDate: e.estimateDate as string,
              stage: e.stage as string,
              totalAmount: (e.totalAmount as string) || "0",
              itemCount: (e.itemCount as number) || 0,
            }))
          );
        })
        .catch(() => setEstimates([]))
        .finally(() => setEstimatesLoading(false));
    }

    if (activeTab === "transactions" && transactions.length === 0) {
      setTransactionsLoading(true);
      fetch(`/api/transactions?clientId=${id}&pageSize=100`)
        .then((res) => res.json())
        .then((json) => {
          setTransactions(
            (json.data || []).map((t: Record<string, unknown>) => ({
              id: t.id as number,
              transactionNumber: t.transactionNumber as string,
              transactionDate: t.transactionDate as string,
              totalAmount: (t.totalAmount as string) || "0",
              itemCount: (t.itemCount as number) || 0,
            }))
          );
        })
        .catch(() => setTransactions([]))
        .finally(() => setTransactionsLoading(false));
    }
  }, [activeTab, id, orders.length, estimates.length, transactions.length]);

  const handleSubmit = async (data: ClientFormValues) => {
    setSaving(true);
    try {
      const res = await fetch(`/api/clients/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (res.ok) {
        alert("수정되었습니다.");
        await fetchClient();
      } else {
        const error = await res.json();
        alert(error.message || "수정에 실패했습니다.");
      }
    } catch {
      alert("서버 오류가 발생했습니다.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleteLoading(true);
    try {
      const res = await fetch(`/api/clients/${id}`, { method: "DELETE" });
      if (res.ok) {
        router.push("/clients");
      } else {
        alert("삭제에 실패했습니다.");
      }
    } catch {
      alert("서버 오류가 발생했습니다.");
    } finally {
      setDeleteLoading(false);
      setDeleteOpen(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="text-muted-foreground h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!client) return null;

  const defaultValues: ClientFormValues = {
    companyName: client.companyName,
    clientType: (client.clientType as "매입" | "매출" | "매입매출") || "매출",
    representative: client.representative || "",
    contactName: client.contactName || "",
    phone: client.phone || "",
    fax: client.fax || "",
    email: client.email || "",
    address: client.address || "",
    businessNumber: client.businessNumber || "",
    businessType: client.businessType || "",
    businessItem: client.businessItem || "",
    memo: client.memo || "",
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={client.companyName}
        description="거래처 상세 정보를 확인하고 수정합니다."
        backHref="/clients"
        actions={
          <Button variant="destructive" onClick={() => setDeleteOpen(true)} className="text-[0.95rem]">
            <Trash2 className="mr-2 h-4 w-4" />
            삭제
          </Button>
        }
      />

      <div className="flex flex-wrap gap-2 rounded-lg border bg-muted/30 p-2">
        {tabs.map((tab) => (
          <button
            key={tab.value}
            type="button"
            onClick={() => setActiveTab(tab.value)}
            className={`rounded-md px-4 py-2.5 text-[0.95rem] font-medium transition-colors ${
              activeTab === tab.value
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:bg-background hover:text-foreground"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "info" && (
        <ClientForm defaultValues={defaultValues} onSubmit={handleSubmit} submitLabel="수정" loading={saving} />
      )}

      {activeTab === "orders" && (
        <Card>
          <CardHeader><CardTitle className="text-lg">발주 이력</CardTitle></CardHeader>
          <Separator />
          <CardContent className="pt-6">
            {ordersLoading ? (
              <div className="flex h-32 items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : orders.length === 0 ? (
              <p className="text-muted-foreground text-[0.95rem]">발주 데이터가 없습니다</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-[0.9rem]">
                  <thead>
                    <tr className="border-b text-left text-muted-foreground">
                      <th className="py-2 pr-4 font-medium">발주번호</th>
                      <th className="py-2 pr-4 font-medium">발주일</th>
                      <th className="py-2 pr-4 font-medium">납기요청일</th>
                      <th className="py-2 pr-4 font-medium">상태</th>
                      <th className="py-2 pr-4 font-medium text-right">품목수</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((o) => (
                      <tr
                        key={o.id}
                        className="border-b cursor-pointer hover:bg-muted/50"
                        onClick={() => router.push(`/orders/${o.id}`)}
                      >
                        <td className="py-2 pr-4 font-medium text-blue-600">{o.orderNumber}</td>
                        <td className="py-2 pr-4">{o.orderDate}</td>
                        <td className="py-2 pr-4">{o.dueDate || "-"}</td>
                        <td className="py-2 pr-4">{o.status}</td>
                        <td className="py-2 pr-4 text-right">{o.itemCount}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {activeTab === "estimates" && (
        <Card>
          <CardHeader><CardTitle className="text-lg">견적 이력</CardTitle></CardHeader>
          <Separator />
          <CardContent className="pt-6">
            {estimatesLoading ? (
              <div className="flex h-32 items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : estimates.length === 0 ? (
              <p className="text-muted-foreground text-[0.95rem]">견적 데이터가 없습니다</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-[0.9rem]">
                  <thead>
                    <tr className="border-b text-left text-muted-foreground">
                      <th className="py-2 pr-4 font-medium">견적번호</th>
                      <th className="py-2 pr-4 font-medium">견적일</th>
                      <th className="py-2 pr-4 font-medium">진행단계</th>
                      <th className="py-2 pr-4 font-medium text-right">합계금액</th>
                      <th className="py-2 pr-4 font-medium text-right">품목수</th>
                    </tr>
                  </thead>
                  <tbody>
                    {estimates.map((e) => (
                      <tr
                        key={e.id}
                        className="border-b cursor-pointer hover:bg-muted/50"
                        onClick={() => router.push(`/quotes/${e.id}`)}
                      >
                        <td className="py-2 pr-4 font-medium text-blue-600">{e.estimateNumber}</td>
                        <td className="py-2 pr-4">{e.estimateDate}</td>
                        <td className="py-2 pr-4">{e.stage}</td>
                        <td className="py-2 pr-4 text-right tabular-nums">{formatAmount(e.totalAmount)}원</td>
                        <td className="py-2 pr-4 text-right">{e.itemCount}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {activeTab === "transactions" && (
        <Card>
          <CardHeader><CardTitle className="text-lg">거래명세서 이력</CardTitle></CardHeader>
          <Separator />
          <CardContent className="pt-6">
            {transactionsLoading ? (
              <div className="flex h-32 items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : transactions.length === 0 ? (
              <p className="text-muted-foreground text-[0.95rem]">거래명세서 데이터가 없습니다</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-[0.9rem]">
                  <thead>
                    <tr className="border-b text-left text-muted-foreground">
                      <th className="py-2 pr-4 font-medium">명세서번호</th>
                      <th className="py-2 pr-4 font-medium">거래일</th>
                      <th className="py-2 pr-4 font-medium text-right">합계금액</th>
                      <th className="py-2 pr-4 font-medium text-right">품목수</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((t) => (
                      <tr
                        key={t.id}
                        className="border-b cursor-pointer hover:bg-muted/50"
                        onClick={() => router.push(`/transactions/${t.id}`)}
                      >
                        <td className="py-2 pr-4 font-medium text-blue-600">{t.transactionNumber}</td>
                        <td className="py-2 pr-4">{t.transactionDate}</td>
                        <td className="py-2 pr-4 text-right tabular-nums">{formatAmount(t.totalAmount)}원</td>
                        <td className="py-2 pr-4 text-right">{t.itemCount}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="거래처 삭제"
        description={`"${client.companyName}" 거래처를 삭제하시겠습니까? 삭제된 거래처는 목록에서 표시되지 않습니다.`}
        confirmText="삭제"
        onConfirm={handleDelete}
        loading={deleteLoading}
      />
    </div>
  );
}
