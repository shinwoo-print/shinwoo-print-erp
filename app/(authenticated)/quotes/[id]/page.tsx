"use client";

import { EstimateForm } from "@/components/estimates/estimate-form";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import type { EstimateFormValues } from "@/lib/validators/estimate";
import { Download, FileSpreadsheet, Loader2, Trash2 } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

interface EstimateData {
  id: number;
  estimateNumber: string;
  estimateDate: string;
  clientId: number;
  clientContactName: string | null;
  recipientText: string | null;
  stage: string;
  validDays: number;
  totalSupplyAmount: string;
  totalVat: string;
  totalAmount: string;
  note: string | null;
  client: {
    id: number;
    companyName: string;
    contactName: string | null;
    phone: string | null;
  };
  items: Array<{
    id: number;
    productId: number | null;
    productName: string;
    spec: string | null;
    quantity: number;
    quantityText: string | null;
    unitPrice: string;
    unitPriceText: string | null;
    supplyAmount: string;
    vat: string;
    note: string | null;
    sortOrder: number;
  }>;
}

export default function EstimateDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [estimate, setEstimate] = useState<EstimateData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchEstimate = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/estimates/${id}`);
      if (res.ok) {
        const data = await res.json();
        setEstimate(data);
      } else {
        toast.error("견적서를 찾을 수 없습니다");
        router.push("/quotes");
      }
    } catch {
      toast.error("서버 오류가 발생했습니다");
      router.push("/quotes");
    } finally {
      setLoading(false);
    }
  }, [id, router]);

  useEffect(() => {
    fetchEstimate();
  }, [fetchEstimate]);

  const handleSubmit = async (data: EstimateFormValues) => {
    setSaving(true);
    try {
      const res = await fetch(`/api/estimates/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (res.ok) {
        toast.success("수정되었습니다");
        await fetchEstimate();
      } else {
        const error = await res.json();
        toast.error(error.message || "수정에 실패했습니다");
      }
    } catch {
      toast.error("서버 오류가 발생했습니다");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleteLoading(true);
    try {
      const res = await fetch(`/api/estimates/${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("견적서가 삭제되었습니다");
        router.push("/quotes");
      } else {
        toast.error("삭제에 실패했습니다");
      }
    } catch {
      toast.error("서버 오류가 발생했습니다");
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

  if (!estimate) return null;

  const defaultValues: EstimateFormValues = {
    clientId: estimate.clientId,
    estimateDate: estimate.estimateDate,
    clientContactName: estimate.clientContactName || "",
    recipientText: estimate.recipientText || "",
    stage: estimate.stage,
    validDays: estimate.validDays,
    totalSupplyAmount: estimate.totalSupplyAmount || "0",
    totalVat: estimate.totalVat || "0",
    totalAmount: estimate.totalAmount || "0",
    note: estimate.note || "",
    items: estimate.items.map((item, idx) => ({
      productId: item.productId,
      productName: item.productName || "",
      spec: item.spec || "",
      quantity: item.quantity,
      quantityText: item.quantityText || "",
      unitPrice: item.unitPrice || "0",
      unitPriceText: item.unitPriceText || "",
      supplyAmount: item.supplyAmount || "0",
      vat: item.vat || "0",
      note: item.note || "",
      sortOrder: idx,
    })),
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={estimate.estimateNumber}
        description={`${estimate.client.companyName} · 견적서 상세`}
        backHref="/quotes"
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              disabled
              className="text-[0.95rem]"
              title="P3에서 연결 예정"
            >
              <Download className="mr-2 h-4 w-4" />
              PDF
            </Button>
            <Button
              variant="outline"
              disabled
              className="text-[0.95rem]"
              title="P3에서 연결 예정"
            >
              <FileSpreadsheet className="mr-2 h-4 w-4" />
              엑셀
            </Button>
            <Button
              variant="destructive"
              onClick={() => setDeleteOpen(true)}
              className="text-[0.95rem]"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              삭제
            </Button>
          </div>
        }
      />

      <EstimateForm
        defaultValues={defaultValues}
        onSubmit={handleSubmit}
        submitLabel="수정"
        loading={saving}
      />

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="견적서 삭제"
        description={`"${estimate.estimateNumber}" 견적서를 삭제하시겠습니까? 포함된 모든 품목도 함께 삭제됩니다`}
        confirmText="삭제"
        onConfirm={handleDelete}
        loading={deleteLoading}
      />
    </div>
  );
}
