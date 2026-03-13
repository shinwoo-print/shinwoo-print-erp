"use client";

import { OrderForm } from "@/components/orders/order-form";
import { PageHeader } from "@/components/shared/page-header";
import type { OrderFormValues } from "@/lib/validators/order";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function OrderNewPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (data: OrderFormValues) => {
    setLoading(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (res.ok) {
        const result = await res.json();
        router.push(`/orders/${result.id}`);
      } else {
        const error = await res.json();
        alert(error.message || "등록에 실패했습니다");
      }
    } catch {
      alert("서버 오류가 발생했습니다");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="발주서 작성"
        description="새 발주서를 작성합니다"
        backHref="/orders"
      />
      <OrderForm onSubmit={handleSubmit} submitLabel="등록" loading={loading} />
    </div>
  );
}
