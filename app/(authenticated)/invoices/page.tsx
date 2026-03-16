"use client";

import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { Column, DataTable } from "@/components/shared/data-table";
import { PageHeader } from "@/components/shared/page-header";
import { SearchInput } from "@/components/shared/search-input";
import { Button } from "@/components/ui/button";
import { formatAmount } from "@/lib/utils/format";
import { Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

interface TransactionRow {
  id: number;
  transactionNumber: string;
  transactionDate: string;
  totalQuantity: number;
  totalSupplyAmount: string;
  totalVat: string;
  totalAmount: string;
  client: { id: number; companyName: string };
  itemCount: number;
  [key: string]: unknown;
}

export default function InvoicesPage() {
  const router = useRouter();
  const [data, setData] = useState<TransactionRow[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<TransactionRow | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const pageSize = 10;

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(pageSize),
        ...(search ? { search } : {}),
      });

      const res = await fetch(`/api/transactions?${params}`);
      const json = await res.json();

      setData(json.data || []);
      setTotalCount(json.totalCount || 0);
    } catch (error) {
      console.error("거래명세서 목록 조회 실패:", error);
    } finally {
      setLoading(false);
    }
  }, [page, search]);

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
      const res = await fetch(`/api/transactions/${deleteTarget.id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        await fetchData();
      }
    } catch (error) {
      console.error("거래명세서 삭제 실패:", error);
    } finally {
      setDeleteLoading(false);
      setDeleteTarget(null);
    }
  };

  const columns: Column<TransactionRow>[] = [
    {
      key: "transactionNumber",
      header: "거래명세서번호",
      className: "min-w-[170px] font-medium",
    },
    {
      key: "clientName",
      header: "거래처명",
      className: "min-w-[120px]",
      render: (row) => row.client?.companyName || "-",
    },
    {
      key: "transactionDate",
      header: "거래일",
      className: "min-w-[100px]",
    },
    {
      key: "totalQuantity",
      header: "수량합계",
      className: "min-w-[100px] text-right",
      render: (row) => (
        <span className="tabular-nums">{formatAmount(row.totalQuantity)}</span>
      ),
    },
    {
      key: "totalSupplyAmount",
      header: "공급가액",
      className: "min-w-[120px] text-right",
      render: (row) => (
        <span className="tabular-nums">
          {formatAmount(row.totalSupplyAmount)}
        </span>
      ),
    },
    {
      key: "totalVat",
      header: "부가세",
      className: "min-w-[100px] text-right",
      render: (row) => (
        <span className="tabular-nums">{formatAmount(row.totalVat)}</span>
      ),
    },
    {
      key: "totalAmount",
      header: "총액",
      className: "min-w-[120px] text-right",
      render: (row) => (
        <span className="tabular-nums font-semibold">
          {formatAmount(row.totalAmount)}
        </span>
      ),
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
        title="거래명세서 관리"
        description="거래명세서 목록을 조회하고 관리합니다"
        actions={
          <Button
            onClick={() => router.push("/invoices/new")}
            className="text-[0.95rem]"
          >
            <Plus className="mr-2 h-4 w-4" />새 거래명세서
          </Button>
        }
      />

      <div className="flex flex-wrap items-center gap-4">
        <SearchInput
          placeholder="거래처명/거래명세서번호로 검색"
          onSearch={handleSearch}
        />
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
          onRowClick={(row) => router.push(`/invoices/${row.id}`)}
          emptyMessage="등록된 거래명세서가 없습니다"
        />
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="거래명세서 삭제"
        description={`"${deleteTarget?.transactionNumber}" 거래명세서를 삭제하시겠습니까? 포함된 모든 품목도 함께 삭제됩니다`}
        confirmText="삭제"
        onConfirm={handleDelete}
        loading={deleteLoading}
      />
    </div>
  );
}
