"use client";

import { SalesRecordForm } from "@/components/sales/sales-record-form";
import { SalesTargetForm } from "@/components/sales/sales-target-form";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { Column, DataTable } from "@/components/shared/data-table";
import { ExcelDownloadButton } from "@/components/shared/excel-download-button";
import { PageHeader } from "@/components/shared/page-header";
import { SearchInput } from "@/components/shared/search-input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatAmount } from "@/lib/utils/format";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

interface SalesRecord {
  id: number;
  year: number;
  month: number;
  transactionType: string | null;
  dataType: string | null;
  worker: string | null;
  deliveryType: string | null;
  deliveryRegion: string | null;
  orderReceivedDate: string | null;
  clientId: number;
  client: { id: number; companyName: string };
  printType: string | null;
  productName: string | null;
  sheets: number | null;
  unitPrice: string | null;
  supplyAmount: string | null;
  taxIncludedAmount: string | null;
  requestedDueDate: string | null;
  transactionDate: string | null;
  taxInvoiceDate: string | null;
  paymentDate: string | null;
  note: string | null;
  [key: string]: unknown;
}

interface TargetData {
  year: number;
  month: number;
  targetAmount: string;
}

const YEARS = [2025, 2026, 2027];
const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1);
const PAGE_SIZE = 20;

function SalesPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;

  const [year, setYear] = useState(
    Number(searchParams.get("year")) || currentYear,
  );
  const [month, setMonth] = useState(
    Number(searchParams.get("month")) || currentMonth,
  );
  const [tab, setTab] = useState(searchParams.get("tab") || "매출");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const [records, setRecords] = useState<SalesRecord[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalSupply, setTotalSupply] = useState("0");

  const [targets, setTargets] = useState<TargetData[]>([]);
  const currentTarget =
    targets.find((t) => t.month === month)?.targetAmount || "0";

  const [formOpen, setFormOpen] = useState(false);
  const [editRecord, setEditRecord] = useState<SalesRecord | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<SalesRecord | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // URL 쿼리 파라미터 동기화
  const updateUrl = useCallback(
    (y: number, m: number, t: string) => {
      const params = new URLSearchParams();
      params.set("year", String(y));
      params.set("month", String(m));
      params.set("tab", t);
      router.replace(`/sales?${params.toString()}`, { scroll: false });
    },
    [router],
  );

  // 목록 조회
  const fetchRecords = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        year: String(year),
        month: String(month),
        transactionType: tab,
        page: String(page),
        pageSize: String(PAGE_SIZE),
      });
      if (search) params.set("search", search);

      const res = await fetch(`/api/sales?${params.toString()}`);
      if (!res.ok) throw new Error("조회 실패");
      const json = await res.json();
      setRecords(json.data || []);
      setTotalCount(json.totalCount || 0);
      setTotalSupply(json.aggregate?.totalSupply || "0");
    } catch {
      toast.error("데이터를 불러오는데 실패했습니다");
    } finally {
      setLoading(false);
    }
  }, [year, month, tab, search, page]);

  // 목표 조회
  const fetchTargets = useCallback(async () => {
    try {
      const res = await fetch(`/api/sales/targets?year=${year}`);
      if (!res.ok) throw new Error("목표 조회 실패");
      const json = await res.json();
      setTargets(json);
    } catch {
      toast.error("목표 데이터를 불러오는데 실패했습니다");
    }
  }, [year]);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  useEffect(() => {
    fetchTargets();
  }, [fetchTargets]);

  // 연도/월/탭 변경 핸들러
  const handleYearChange = (v: string) => {
    const y = Number(v);
    setYear(y);
    setPage(1);
    updateUrl(y, month, tab);
  };

  const handleMonthChange = (v: string) => {
    const m = Number(v);
    setMonth(m);
    setPage(1);
    updateUrl(year, m, tab);
  };

  const handleTabChange = (v: string) => {
    setTab(v);
    setPage(1);
    setSearch("");
    updateUrl(year, month, v);
  };

  // 등록/수정 완료 콜백
  const handleFormSuccess = () => {
    setFormOpen(false);
    setEditRecord(null);
    fetchRecords();
    fetchTargets();
    toast.success(editRecord ? "수정되었습니다" : "등록되었습니다");
  };

  // 삭제
  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      const res = await fetch(`/api/sales/${deleteTarget.id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("삭제 실패");
      setDeleteTarget(null);
      fetchRecords();
      fetchTargets();
      toast.success("삭제되었습니다");
    } catch {
      toast.error("삭제에 실패했습니다");
    } finally {
      setDeleteLoading(false);
    }
  };

  // 수정 버튼 클릭
  const handleEdit = (record: SalesRecord) => {
    setEditRecord(record);
    setFormOpen(true);
  };

  // 신규 등록 버튼
  const handleCreate = () => {
    setEditRecord(null);
    setFormOpen(true);
  };

  // 대시보드 수치 계산
  const targetNum = Number(currentTarget) || 0;
  const supplyNum = Number(totalSupply) || 0;
  const achievementRate =
    targetNum > 0 ? ((supplyNum / targetNum) * 100).toFixed(1) : "0.0";
  const remaining = targetNum - supplyNum;

  // 테이블 컬럼 정의
  const columns: Column<SalesRecord>[] = [
    {
      key: "orderReceivedDate",
      header: "발주일",
      className: "w-[100px]",
      render: (row) => row.orderReceivedDate || "-",
    },
    {
      key: "clientName",
      header: "거래처명",
      className: "min-w-[120px]",
      render: (row) => row.client?.companyName || "-",
    },
    {
      key: "printType",
      header: "인쇄종류",
      className: "w-[110px]",
      render: (row) => row.printType || "-",
    },
    {
      key: "dataType",
      header: "DATA종류",
      className: "w-[100px]",
      render: (row) => row.dataType || "-",
    },
    {
      key: "productName",
      header: "품목",
      className: "min-w-[150px]",
      render: (row) => row.productName || "-",
    },
    {
      key: "sheets",
      header: "수량",
      className: "w-[80px] text-right",
      render: (row) => (row.sheets !== null ? formatAmount(row.sheets) : "-"),
    },
    {
      key: "unitPrice",
      header: "단가",
      className: "w-[100px] text-right",
      render: (row) => (row.unitPrice ? formatAmount(row.unitPrice) : "-"),
    },
    {
      key: "supplyAmount",
      header: "공급가액",
      className: "w-[120px] text-right",
      render: (row) =>
        row.supplyAmount ? formatAmount(row.supplyAmount) : "-",
    },
    {
      key: "taxIncludedAmount",
      header: "부가세포함",
      className: "w-[120px] text-right",
      render: (row) =>
        row.taxIncludedAmount ? formatAmount(row.taxIncludedAmount) : "-",
    },
    {
      key: "requestedDueDate",
      header: "납기요청일",
      className: "w-[100px]",
      render: (row) => row.requestedDueDate || "-",
    },
    {
      key: "transactionDate",
      header: "거래명세표발급일",
      className: "w-[130px]",
      render: (row) => row.transactionDate || "-",
    },
    {
      key: "worker",
      header: "작업자",
      className: "w-[80px]",
      render: (row) => row.worker || "-",
    },
    {
      key: "deliveryType",
      header: "배송종류",
      className: "w-[80px]",
      render: (row) => row.deliveryType || "-",
    },
    {
      key: "deliveryRegion",
      header: "배송지역",
      className: "w-[100px]",
      render: (row) => row.deliveryRegion || "-",
    },
    {
      key: "actions",
      header: "액션",
      className: "w-[100px]",
      render: (row) => (
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={(e) => {
              e.stopPropagation();
              handleEdit(row);
            }}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-destructive"
            onClick={(e) => {
              e.stopPropagation();
              setDeleteTarget(row);
            }}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  // 탭 내부 공통 콘텐츠
  const tableOnly = (
    <>
      {loading ? (
        <div className="text-muted-foreground flex h-32 items-center justify-center">
          불러오는 중...
        </div>
      ) : (
        <div className="overflow-x-auto">
          <DataTable
            columns={columns}
            data={records}
            totalCount={totalCount}
            page={page}
            pageSize={PAGE_SIZE}
            onPageChange={setPage}
            emptyMessage={`${tab} 데이터가 없습니다`}
          />
        </div>
      )}
    </>
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="매출/매입 관리"
        description={`${year}년 ${month}월 ${tab} 현황`}
        actions={
          <div className="flex items-center gap-2">
            <ExcelDownloadButton
              url={`/api/sales/excel?year=${year}&month=${month}&transactionType=${tab}${search ? `&search=${search}` : ""}`}
              fileName={`매출매입_${year}년${month}월_${tab}_${new Date().toISOString().split("T")[0]}`}
            />
            <Button onClick={handleCreate}>
              <Plus className="mr-2 h-4 w-4" />
              신규 등록
            </Button>
          </div>
        }
      />

      {/* 연도/월 선택 + 목표 설정 */}
      <div className="flex flex-wrap items-center gap-3">
        <Select value={String(year)} onValueChange={handleYearChange}>
          <SelectTrigger className="w-[120px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {YEARS.map((y) => (
              <SelectItem key={y} value={String(y)}>
                {y}년
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={String(month)} onValueChange={handleMonthChange}>
          <SelectTrigger className="w-[100px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {MONTHS.map((m) => (
              <SelectItem key={m} value={String(m)}>
                {m}월
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <SalesTargetForm
          year={year}
          month={month}
          currentTarget={currentTarget}
          onSaved={fetchTargets}
        />
      </div>

      {/* 대시보드 카드 */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground text-sm">{month}월 목표금액</p>
            <p className="text-2xl font-bold">
              {formatAmount(currentTarget)}원
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground text-sm">
              현재 달성 ({tab} 공급가 합계)
            </p>
            <p className="text-2xl font-bold">
              {formatAmount(totalSupply)}원
              <span className="ml-2 text-base font-normal text-blue-600">
                ({achievementRate}%)
              </span>
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground text-sm">목표 잔여</p>
            <p
              className={`text-2xl font-bold ${remaining < 0 ? "text-red-600" : ""}`}
            >
              {formatAmount(remaining)}원
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 매출/매입 탭 + 검색 (한 줄) */}
      <div className="flex items-center gap-3">
        <div className="flex rounded-lg border bg-muted p-1">
          <button
            type="button"
            onClick={() => handleTabChange("매출")}
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              tab === "매출"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            매출
          </button>
          <button
            type="button"
            onClick={() => handleTabChange("매입")}
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              tab === "매입"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            매입
          </button>
        </div>
        <SearchInput
          key={tab}
          placeholder="거래처명 검색"
          onSearch={(v) => {
            setSearch(v);
            setPage(1);
          }}
          defaultValue={search}
        />
      </div>

      {/* 테이블 */}
      {loading ? (
        <div className="text-muted-foreground flex h-32 items-center justify-center">
          불러오는 중...
        </div>
      ) : (
        <div className="overflow-x-auto">
          <DataTable
            columns={columns}
            data={records}
            totalCount={totalCount}
            page={page}
            pageSize={PAGE_SIZE}
            onPageChange={setPage}
            emptyMessage={`${tab} 데이터가 없습니다`}
          />
        </div>
      )}
      {/* 등록/수정 Dialog */}
      <Dialog
        open={formOpen}
        onOpenChange={(open) => {
          if (!open) {
            setFormOpen(false);
            setEditRecord(null);
          }
        }}
      >
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editRecord ? "매출/매입 수정" : "매출/매입 신규 등록"}
            </DialogTitle>
          </DialogHeader>
          <SalesRecordForm
            key={editRecord?.id ?? "new"}
            defaultValues={
              editRecord
                ? editRecord
                : { year, month, transactionType: tab as "매출" | "매입" }
            }
            editId={editRecord?.id}
            onSuccess={handleFormSuccess}
            onCancel={() => {
              setFormOpen(false);
              setEditRecord(null);
            }}
          />
        </DialogContent>
      </Dialog>

      {/* 삭제 확인 Dialog */}
      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        title="매출/매입 삭제"
        description={`"${deleteTarget?.client?.companyName || ""} - ${deleteTarget?.productName || ""}" 데이터를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다`}
        confirmText="삭제"
        onConfirm={handleDelete}
        loading={deleteLoading}
        variant="destructive"
      />
    </div>
  );
}

export default function SalesPage() {
  return (
    <Suspense
      fallback={
        <div className="text-muted-foreground flex h-32 items-center justify-center">
          불러오는 중...
        </div>
      }
    >
      <SalesPageContent />
    </Suspense>
  );
}
