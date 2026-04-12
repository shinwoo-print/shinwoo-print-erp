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

interface ClientRow {
  id: number;
  companyName: string;
  clientType: string;
  representative: string | null;
  contactName: string | null;
  phone: string | null;
  email: string | null;
  businessNumber: string | null;
  isActive: boolean;
  [key: string]: unknown;
}

export default function ClientsPage() {
  const router = useRouter();
  const [data, setData] = useState<ClientRow[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [clientTypeFilter, setClientTypeFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<ClientRow | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const pageSize = 10;

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(pageSize),
        ...(search ? { search } : {}),
        ...(clientTypeFilter ? { clientType: clientTypeFilter } : {}),
      });
      const res = await fetch(`/api/clients?${params}`);
      const json = await res.json();
      setData(json.data || []);
      setTotalCount(json.totalCount || 0);
    } catch (error) {
      console.error("거래처 목록 조회 실패:", error);
    } finally {
      setLoading(false);
    }
  }, [page, search, clientTypeFilter]);

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
      const res = await fetch(`/api/clients/${deleteTarget.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        await fetchData();
      }
    } catch (error) {
      console.error("거래처 삭제 실패:", error);
    } finally {
      setDeleteLoading(false);
      setDeleteTarget(null);
    }
  };

  // 엑셀 다운로드 URL 생성
  const excelUrl = (() => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (clientTypeFilter) params.set("clientType", clientTypeFilter);
    return `/api/clients/excel?${params.toString()}`;
  })();

  const columns: Column<ClientRow>[] = [
    {
      key: "companyName",
      header: "업체명",
      className: "min-w-[150px] font-medium",
    },
    {
      key: "clientType",
      header: "거래구분",
      className: "w-[90px]",
      render: (row) => {
        const colorMap: Record<string, string> = {
          "매입": "bg-blue-100 text-blue-800",
          "매출": "bg-green-100 text-green-800",
          "매입매출": "bg-purple-100 text-purple-800",
        };
        return (
          <Badge className={colorMap[row.clientType] || ""} variant="outline">
            {row.clientType}
          </Badge>
        );
      },
    },
    {
      key: "representative",
      header: "대표자명",
      className: "min-w-[100px]",
    },
    {
      key: "contactName",
      header: "담당자",
      className: "min-w-[100px]",
    },
    {
      key: "phone",
      header: "연락처",
      className: "min-w-[130px]",
    },
    {
      key: "email",
      header: "이메일",
      className: "min-w-[180px]",
    },
    {
      key: "businessNumber",
      header: "사업자번호",
      className: "min-w-[130px]",
      render: (row) => {
        const num = (row.businessNumber || "").replace(/[^0-9]/g, "");
        if (num.length === 10) {
          return `${num.slice(0, 3)}-${num.slice(3, 5)}-${num.slice(5)}`;
        }
        return row.businessNumber || "-";
      },
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
        title="거래처 관리"
        description="거래처 목록을 조회하고 관리합니다."
        actions={
          <div className="flex items-center gap-2">
            <ExcelDownloadButton
              url={excelUrl}
              fileName={`거래처목록_${new Date().toISOString().split("T")[0]}`}
            />
            <Button
              onClick={() => router.push("/clients/new")}
              className="text-[0.95rem]"
            >
              <Plus className="mr-2 h-4 w-4" />
              거래처 등록
            </Button>
          </div>
        }
      />

      <SearchInput
        placeholder="업체명 또는 담당자명으로 검색"
        onSearch={handleSearch}
      />

      <div className="flex gap-2">
        {[
          { value: "", label: "전체" },
          { value: "매입", label: "매입" },
          { value: "매출", label: "매출" },
          { value: "매입매출", label: "매입매출" },
        ].map((opt) => (
          <Button
            key={opt.value}
            variant={clientTypeFilter === opt.value ? "default" : "outline"}
            size="sm"
            onClick={() => {
              setClientTypeFilter(opt.value);
              setPage(1);
            }}
            className="text-[0.85rem]"
          >
            {opt.label}
          </Button>
        ))}
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
          onRowClick={(row) => router.push(`/clients/${row.id}`)}
          emptyMessage="등록된 거래처가 없습니다."
        />
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="거래처 삭제"
        description={`"${deleteTarget?.companyName}" 거래처를 삭제하시겠습니까? 삭제된 거래처는 목록에서 표시되지 않습니다.`}
        confirmText="삭제"
        onConfirm={handleDelete}
        loading={deleteLoading}
      />
    </div>
  );
}
