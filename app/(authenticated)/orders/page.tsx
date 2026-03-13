"use client";

import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { Column, DataTable } from "@/components/shared/data-table";
import { PageHeader } from "@/components/shared/page-header";
import { SearchInput } from "@/components/shared/search-input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

interface OrderRow {
  id: number;
  orderNumber: string;
  orderDate: string;
  dueDate: string | null;
  orderer: string | null;
  status: string;
  client: { id: number; companyName: string };
  itemCount: number;
  [key: string]: unknown;
}

const statusConfig: Record<
  string,
  {
    label: string;
    variant: "default" | "secondary" | "destructive" | "outline";
  }
> = {
  DRAFT: { label: "임시저장", variant: "secondary" },
  PROGRESS: { label: "진행중", variant: "default" },
  COMPLETE: { label: "완료", variant: "outline" },
  HOLD: { label: "보류", variant: "destructive" },
};

export default function OrdersPage() {
  const router = useRouter();
  const [data, setData] = useState<OrderRow[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<OrderRow | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const pageSize = 10;

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(pageSize),
        ...(search ? { search } : {}),
        ...(statusFilter ? { status: statusFilter } : {}),
      });
      const res = await fetch(`/api/orders?${params}`);
      const json = await res.json();
      setData(json.data || []);
      setTotalCount(json.totalCount || 0);
    } catch (error) {
      console.error("발주서 목록 조회 실패:", error);
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSearch = useCallback((value: string) => {
    setSearch(value);
    setPage(1);
  }, []);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      const res = await fetch(`/api/orders/${deleteTarget.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        await fetchData();
      }
    } catch (error) {
      console.error("발주서 삭제 실패:", error);
    } finally {
      setDeleteLoading(false);
      setDeleteTarget(null);
    }
  };

  const columns: Column<OrderRow>[] = [
    {
      key: "orderNumber",
      header: "발주번호",
      className: "min-w-[140px] font-medium",
    },
    {
      key: "clientName",
      header: "거래처",
      className: "min-w-[120px]",
      render: (row) => row.client?.companyName || "-",
    },
    {
      key: "orderDate",
      header: "발주일",
      className: "min-w-[100px]",
    },
    {
      key: "dueDate",
      header: "납기일",
      className: "min-w-[100px]",
      render: (row) => row.dueDate || "-",
    },
    {
      key: "orderer",
      header: "발주자",
      className: "min-w-[80px]",
      render: (row) => row.orderer || "-",
    },
    {
      key: "itemCount",
      header: "품목수",
      className: "w-[70px] text-center",
      render: (row) => <span>{row.itemCount}건</span>,
    },
    {
      key: "status",
      header: "상태",
      className: "w-[90px]",
      render: (row) => {
        const config = statusConfig[row.status] || {
          label: row.status,
          variant: "secondary" as const,
        };
        return <Badge variant={config.variant}>{config.label}</Badge>;
      },
    },
    {
      key: "actions",
      header: "",
      className: "w-[50px]",
      render: (row) => (
        <Button
          variant="ghost"
          size="icon"
          onClick={(e) => {
            e.stopPropagation();
            setDeleteTarget(row);
          }}
          className="text-muted-foreground hover:text-destructive h-8 w-8"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="발주서 관리"
        description="발주서 목록을 조회하고 관리합니다"
        actions={
          <Button
            onClick={() => router.push("/orders/new")}
            className="text-[0.95rem]"
          >
            <Plus className="mr-2 h-4 w-4" />
            발주서 작성
          </Button>
        }
      />

      {/* 검색 + 상태 필터 */}
      <div className="flex flex-wrap items-center gap-4">
        <SearchInput
          placeholder="발주번호/거래처명/발주자로 검색"
          onSearch={handleSearch}
        />
        <div className="flex items-center gap-2">
          {[
            { value: "", label: "전체" },
            { value: "DRAFT", label: "임시저장" },
            { value: "PROGRESS", label: "진행중" },
            { value: "COMPLETE", label: "완료" },
            { value: "HOLD", label: "보류" },
          ].map((opt) => (
            <Button
              key={opt.value}
              variant={statusFilter === opt.value ? "default" : "outline"}
              size="sm"
              onClick={() => {
                setStatusFilter(opt.value);
                setPage(1);
              }}
              className="text-[0.85rem]"
            >
              {opt.label}
            </Button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="text-muted-foreground flex h-32 items-center justify-center">
          불러오는 중...
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={data}
          totalCount={totalCount}
          page={page}
          pageSize={pageSize}
          onPageChange={setPage}
          onRowClick={(row) => router.push(`/orders/${row.id}`)}
          emptyMessage="등록된 발주서가 없습니다"
        />
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="발주서 삭제"
        description={`"${deleteTarget?.orderNumber}" 발주서를 삭제하시겠습니까? 포함된 모든 품목도 함께 삭제됩니다`}
        confirmText="삭제"
        onConfirm={handleDelete}
        loading={deleteLoading}
      />
    </div>
  );
}
