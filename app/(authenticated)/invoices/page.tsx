"use client";

import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { Column, DataTable } from "@/components/shared/data-table";
import { ExcelDownloadButton } from "@/components/shared/excel-download-button";
import { PageHeader } from "@/components/shared/page-header";
import { SearchInput } from "@/components/shared/search-input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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

const YEARS = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i);
const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1);

export default function InvoicesPage() {
  const router = useRouter();
  const [data, setData] = useState<TransactionRow[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [yearFilter, setYearFilter] = useState("");
  const [monthFilter, setMonthFilter] = useState("");
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

      let filtered = json.data || [];

      // 클라이언트 사이드 년/월 필터
      if (yearFilter) {
        filtered = filtered.filter((row: TransactionRow) => {
          const d = new Date(row.transactionDate);
          return d.getFullYear() === Number(yearFilter);
        });
      }
      if (monthFilter) {
        filtered = filtered.filter((row: TransactionRow) => {
          const d = new Date(row.transactionDate);
          return d.getMonth() + 1 === Number(monthFilter);
        });
      }

      setData(filtered);
      setTotalCount(yearFilter || monthFilter ? filtered.length : json.totalCount || 0);
    } catch (error) {
      console.error("거래명세서 목록 조회 실패:", error);
    } finally {
      setLoading(false);
    }
  }, [page, search, yearFilter, monthFilter]);

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

  const excelUrl = (() => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (yearFilter) params.set("year", yearFilter);
    if (monthFilter) params.set("month", monthFilter);
    return `/api/transactions/excel?${params.toString()}`;
  })();

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
      sortType: "date",
    },
    {
      key: "totalQuantity",
      header: "수량합계",
      className: "min-w-[100px] text-right",
      sortType: "number",
      render: (row) => (
        <span className="tabular-nums">{formatAmount(row.totalQuantity)}</span>
      ),
    },
    {
      key: "totalSupplyAmount",
      header: "공급가액",
      className: "min-w-[120px] text-right",
      sortType: "number",
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
      sortType: "number",
      render: (row) => (
        <span className="tabular-nums">{formatAmount(row.totalVat)}</span>
      ),
    },
    {
      key: "totalAmount",
      header: "총액",
      className: "min-w-[120px] text-right",
      sortType: "number",
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
      sortable: false,
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
          <div className="flex items-center gap-2">
            <ExcelDownloadButton
              url={excelUrl}
              fileName={`거래명세서목록_${new Date().toISOString().split("T")[0]}`}
            />
            <Button
              onClick={() => router.push("/invoices/new")}
              className="text-[0.95rem]"
            >
              <Plus className="mr-2 h-4 w-4" />새 거래명세서
            </Button>
          </div>
        }
      />

      <div className="flex flex-wrap items-center gap-4">
        <SearchInput
          placeholder="거래처명/거래명세서번호로 검색"
          onSearch={handleSearch}
        />
      </div>

      {/* 년/월 필터 */}
      <div className="flex items-center gap-2">
        <Select
          value={yearFilter}
          onValueChange={(v) => {
            setYearFilter(v === "all" ? "" : v);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-[110px]">
            <SelectValue placeholder="년도" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">전체 년도</SelectItem>
            {YEARS.map((y) => (
              <SelectItem key={y} value={String(y)}>
                {y}년
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={monthFilter}
          onValueChange={(v) => {
            setMonthFilter(v === "all" ? "" : v);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-[100px]">
            <SelectValue placeholder="월" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">전체 월</SelectItem>
            {MONTHS.map((m) => (
              <SelectItem key={m} value={String(m)}>
                {m}월
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {(yearFilter || monthFilter) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setYearFilter("");
              setMonthFilter("");
              setPage(1);
            }}
            className="text-[0.85rem]"
          >
            필터 초기화
          </Button>
        )}
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
