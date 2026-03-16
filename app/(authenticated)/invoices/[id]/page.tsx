"use client";

import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { ExcelDownloadButton } from "@/components/shared/excel-download-button";
import { PageHeader } from "@/components/shared/page-header";
import { PdfDownloadButton } from "@/components/shared/pdf-download-button";
import { TransactionForm } from "@/components/transactions/transaction-form";
import { Button } from "@/components/ui/button";
import type { TransactionFormValues } from "@/lib/validators/transaction";
import { Loader2, Trash2 } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

interface TransactionData {
  id: number;
  transactionNumber: string;
  transactionDate: string;
  clientId: number;
  bankAccountId: number | null;
  totalQuantity: number;
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
  bankAccount: {
    id: number;
    bankName: string;
    accountNumber: string;
    accountHolder: string;
  } | null;
  items: Array<{
    id: number;
    productId: number | null;
    itemDate: string;
    productName: string;
    spec: string | null;
    quantity: number;
    unit: string | null;
    unitPrice: string;
    supplyAmount: string;
    vat: string;
    sortOrder: number;
  }>;
}

export default function TransactionDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [transaction, setTransaction] = useState<TransactionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchTransaction = useCallback(async () => {
    setLoading(true);

    try {
      const res = await fetch(`/api/transactions/${id}`);

      if (res.ok) {
        const data = await res.json();
        setTransaction(data);
      } else {
        toast.error("거래명세서를 찾을 수 없습니다");
        router.push("/invoices");
      }
    } catch {
      toast.error("서버 오류가 발생했습니다");
      router.push("/invoices");
    } finally {
      setLoading(false);
    }
  }, [id, router]);

  useEffect(() => {
    fetchTransaction();
  }, [fetchTransaction]);

  const handleSubmit = async (data: TransactionFormValues) => {
    setSaving(true);

    try {
      const res = await fetch(`/api/transactions/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (res.ok) {
        toast.success("수정되었습니다");
        await fetchTransaction();
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
      const res = await fetch(`/api/transactions/${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        toast.success("거래명세서가 삭제되었습니다");
        router.push("/invoices");
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

  if (!transaction) return null;

  const defaultValues: TransactionFormValues = {
    clientId: transaction.clientId,
    transactionDate: transaction.transactionDate,
    bankAccountId: transaction.bankAccountId ?? undefined,
    note: transaction.note || "",
    items: transaction.items.map((item, index) => ({
      productId: item.productId ?? undefined,
      itemDate: item.itemDate,
      productName: item.productName || "",
      spec: item.spec || "",
      quantity: item.quantity,
      unit: item.unit || "",
      unitPrice: Number(item.unitPrice || "0"),
      supplyAmount: Number(item.supplyAmount || "0"),
      vat: Number(item.vat || "0"),
      sortOrder: index,
    })),
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={transaction.transactionNumber}
        description={`${transaction.client.companyName} · 거래명세서 상세`}
        backHref="/invoices"
        actions={
          <div className="flex items-center gap-2">
            <PdfDownloadButton url={`/api/transactions/${id}/pdf`} />
            <ExcelDownloadButton
              url={`/api/transactions/${id}/excel`}
              fileName={`거래명세서_${transaction.transactionNumber}_${transaction.client.companyName}`}
            />
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

      <TransactionForm
        defaultValues={defaultValues}
        onSubmit={handleSubmit}
        submitLabel="수정"
        loading={saving}
      />

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="거래명세서 삭제"
        description={`"${transaction.transactionNumber}" 거래명세서를 삭제하시겠습니까? 포함된 모든 품목도 함께 삭제됩니다`}
        confirmText="삭제"
        onConfirm={handleDelete}
        loading={deleteLoading}
      />
    </div>
  );
}
