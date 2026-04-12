"use client";

import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { Column, DataTable } from "@/components/shared/data-table";
import { ExcelDownloadButton } from "@/components/shared/excel-download-button";
import { PageHeader } from "@/components/shared/page-header";
import { SearchInput } from "@/components/shared/search-input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

interface ProductRow {
  id: number;
  productName: string;
  spec: string | null;
  printType: string | null;
  material: string | null;
  unitPrice: string | null;
  isActive: boolean;
  [key: string]: unknown;
}

function formatPrice(price: string | null): string {
  if (!price) return "-";
  return Number(price).toLocaleString("ko-KR") + "원";
}

export default function ProductsPage() {
  const router = useRouter();
  const [data, setData] = useState<ProductRow[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const [deleteTarget, setDeleteTarget] = useState<ProductRow | null>(null);
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
      const res = await fetch(`/api/products?${params}`);
      const json = await res.json();
      setData(json.data || []);
      setTotalCount(json.totalCount || 0);
    } catch (error) {
      console.error("품목 목록 조회 실패:", error);
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
      const res = await fetch(`/api/products/${deleteTarget.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        await fetchData();
      }
    } catch (error) {
      console.error("품목 삭제 실패:", error);
    } finally {
      setDeleteLoading(false);
      setDeleteTarget(null);
    }
  };

  const excelUrl = (() => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    return `/api/products/excel?${params.toString()}`;
  })();

  const columns: Column<ProductRow>[] = [
    {
      key: "productName",
      header: "품목명",
      className: "min-w-[200px] font-medium",
    },
    {
      key: "spec",
      header: "규격",
      className: "min-w-[100px]",
    },
    {
      key: "printType",
      header: "인쇄종류",
      className: "min-w-[100px]",
    },
    {
      key: "material",
      header: "원단",
      className: "min-w-[100px]",
    },
    {
      key: "unitPrice",
      header: "기본단가",
      className: "min-w-[120px] text-right",
      sortType: "number",
      render: (row) => (
        <span className="tabular-nums">{formatPrice(row.unitPrice)}</span>
      ),
    },
    {
      key: "status",
      header: "상태",
      className: "w-[80px]",
      render: (row) => (
        <Badge variant={row.isActive ? "default" : "secondary"}>
          {row.isActive ? "활성" : "비활성"}
        </Badge>
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
        title="품목 관리"
        description="품목 목록을 조회하고 관리합니다."
        actions={
          <div className="flex items-center gap-2">
            <ExcelDownloadButton
              url={excelUrl}
              fileName={`품목목록_${new Date().toISOString().split("T")[0]}`}
            />
            <Button
              onClick={() => router.push("/products/new")}
              className="text-[0.95rem]"
            >
              <Plus className="mr-2 h-4 w-4" />
              품목 등록
            </Button>
          </div>
        }
      />

      <SearchInput
        placeholder="품목명 또는 규격으로 검색"
        onSearch={handleSearch}
      />

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
          onRowClick={(row) => router.push(`/products/${row.id}`)}
          emptyMessage="등록된 품목이 없습니다."
        />
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="품목 삭제"
        description={`"${deleteTarget?.productName}" 품목을 삭제하시겠습니까? 삭제된 품목은 목록에서 표시되지 않습니다.`}
        confirmText="삭제"
        onConfirm={handleDelete}
        loading={deleteLoading}
      />
    </div>
  );
}
