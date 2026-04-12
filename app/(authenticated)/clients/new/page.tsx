// src/app/(authenticated)/clients/new/page.tsx
"use client";

import { ClientForm } from "@/components/clients/client-form";
import { PageHeader } from "@/components/shared/page-header";
import type { ClientFormValues } from "@/lib/validators/client";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function ClientNewPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (data: ClientFormValues) => {
    setLoading(true);
    try {
      const res = await fetch("/api/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (res.ok) {
        const result = await res.json();
        router.push(`/clients/${result.id}`);
      } else {
        const error = await res.json();
        alert(error.message || "등록에 실패했습니다.");
      }
    } catch {
      alert("서버 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="거래처 등록"
        description="새 거래처 정보를 입력합니다."
        backHref="/clients"
      />
      <ClientForm
        onSubmit={handleSubmit}
        submitLabel="등록"
        loading={loading}
      />
    </div>
  );
}
