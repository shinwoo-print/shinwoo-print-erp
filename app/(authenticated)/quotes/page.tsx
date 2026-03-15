"use client";

import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { Column, DataTable } from "@/components/shared/data-table";
import { PageHeader } from "@/components/shared/page-header";
import { SearchInput } from "@/components/shared/search-input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatAmount } from "@/lib/utils/format";
import { Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

interface EstimateRow {
  id: number;
  estimateNumber: string;
  estimateDate: string;
  stage: string;
  validDays: number;
  totalSupplyAmount: string;
  totalVat: string;
  totalAmount: string;
  client: { id: number; companyName: string };
  itemCount: number;
  [key: string]: unknown;
}

const stageConfig: Record<
  string,
  {
    label: string;
    variant: "default" | "secondary" | "destructive" | "outline";
  }
> = {
  "1차제안": { label: "1차제안", variant: "default" },
  "2차제안": { label: "2차제안", variant: "secondary" },
  LOST: { label: "LOST", variant: "destructive" },
  계약체결: { label: "계약체결", variant: "outline" },
};

export default function QuotesPage() {
  const router = useRouter();
  const [data, setData] = useState<EstimateRow[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [stageFilter, setStageFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<EstimateRow | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const pageSize = 10;

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(pageSize),
        ...(search ? { search } : {}),
        ...(stageFilter ? { stage: stageFilter } : {}),
      });
      const res = await fetch(`/api/estimates?${params}`);
      const json = await res.json();
      setData(json.data || []);
      setTotalCount(json.totalCount || 0);
    } catch (error) {
      console.error("견적서 목록 조회 실패:", error);
    } finally {
      setLoading(false);
    }
  }, [page, search, stageFilter]);

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
      const res = await fetch(`/api/estimates/${deleteTarget.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        await fetchData();
      }
    } catch (error) {
      console.error("견적서 삭제 실패:", error);
    } finally {
      setDeleteLoading(false);
      setDeleteTarget(null);
    }
  };

  const columns: Column<EstimateRow>[] = [
    {
      key: "estimateNumber",
      header: "견적번호",
      className: "min-w-[140px] font-medium",
    },
    {
      key: "clientName",
      header: "거래처",
      className: "min-w-[120px]",
      render: (row) => row.client?.companyName || "-",
    },
    {
      key: "estimateDate",
      header: "견적일",
      className: "min-w-[100px]",
    },
    {
      key: "validDays",
      header: "유효기간",
      className: "w-[80px] text-center",
      render: (row) => <span>{row.validDays}일</span>,
    },
    {
      key: "stage",
      header: "진행단계",
      className: "w-[100px]",
      render: (row) => {
        const config = stageConfig[row.stage] || {
          label: row.stage,
          variant: "secondary" as const,
        };
        return <Badge variant={config.variant}>{config.label}</Badge>;
      },
    },
    {
      key: "totalSupplyAmount",
      header: "공급가액",
      className: "min-w-[110px] text-right",
      render: (row) => (
        <span className="tabular-nums">
          {formatAmount(row.totalSupplyAmount)}
        </span>
      ),
    },
    {
      key: "totalAmount",
      header: "총합계(VAT)",
      className: "min-w-[110px] text-right",
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
        title="견적서 관리"
        description="견적서 목록을 조회하고 관리합니다"
        actions={
          <Button
            onClick={() => router.push("/quotes/new")}
            className="text-[0.95rem]"
          >
            <Plus className="mr-2 h-4 w-4" />
            견적서 작성
          </Button>
        }
      />

      {/* 검색 + 진행단계 필터 */}
      <div className="flex flex-wrap items-center gap-4">
        <SearchInput
          placeholder="견적번호/거래처명으로 검색"
          onSearch={handleSearch}
        />
        <div className="flex items-center gap-2">
          {[
            { value: "", label: "전체" },
            { value: "1차제안", label: "1차제안" },
            { value: "2차제안", label: "2차제안" },
            { value: "LOST", label: "LOST" },
            { value: "계약체결", label: "계약체결" },
          ].map((opt) => (
            <Button
              key={opt.value}
              variant={stageFilter === opt.value ? "default" : "outline"}
              size="sm"
              onClick={() => {
                setStageFilter(opt.value);
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
          onRowClick={(row) => router.push(`/quotes/${row.id}`)}
          emptyMessage="등록된 견적서가 없습니다"
        />
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="견적서 삭제"
        description={`"${deleteTarget?.estimateNumber}" 견적서를 삭제하시겠습니까? 포함된 모든 품목도 함께 삭제됩니다`}
        confirmText="삭제"
        onConfirm={handleDelete}
        loading={deleteLoading}
      />
    </div>
  );
}
