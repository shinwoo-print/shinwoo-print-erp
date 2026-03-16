"use client";

import { PageHeader } from "@/components/shared/page-header";
import { TransactionForm } from "@/components/transactions/transaction-form";
import type { TransactionFormValues } from "@/lib/validators/transaction";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

export default function NewTransactionPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (data: TransactionFormValues) => {
    setLoading(true);

    try {
      const res = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (res.ok) {
        const result = await res.json();
        toast.success("거래명세서가 등록되었습니다");
        router.push(`/invoices/${result.id}`);
      } else {
        const error = await res.json();
        toast.error(error.message || "등록에 실패했습니다");
      }
    } catch {
      toast.error("서버 오류가 발생했습니다");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="거래명세서 작성"
        description="새 거래명세서를 작성합니다"
        backHref="/invoices"
      />
      <TransactionForm
        onSubmit={handleSubmit}
        submitLabel="등록"
        loading={loading}
      />
    </div>
  );
}
