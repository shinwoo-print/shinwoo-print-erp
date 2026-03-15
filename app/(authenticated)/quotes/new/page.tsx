"use client";

import { EstimateForm } from "@/components/estimates/estimate-form";
import { PageHeader } from "@/components/shared/page-header";
import type { EstimateFormValues } from "@/lib/validators/estimate";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

export default function NewEstimatePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (data: EstimateFormValues) => {
    setLoading(true);
    try {
      const res = await fetch("/api/estimates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (res.ok) {
        const result = await res.json();
        toast.success("견적서가 등록되었습니다");
        router.push(`/quotes/${result.id}`);
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
        title="견적서 작성"
        description="새 견적서를 작성합니다"
        backHref="/quotes"
      />
      <EstimateForm
        onSubmit={handleSubmit}
        submitLabel="등록"
        loading={loading}
      />
    </div>
  );
}
