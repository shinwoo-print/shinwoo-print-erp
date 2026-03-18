"use client";

import { Button } from "@/components/ui/button";
import { Download, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface PdfDownloadButtonProps {
  url: string;
  label?: string;
  variant?:
    | "default"
    | "outline"
    | "secondary"
    | "ghost"
    | "destructive"
    | "link";
}

export function PdfDownloadButton({
  url,
  label = "PDF",
  variant = "outline",
}: PdfDownloadButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    setLoading(true);
    try {
      const res = await fetch(url);

      if (!res.ok) {
        const error = await res
          .json()
          .catch(() => ({ message: "PDF 생성 실패" }));
        toast.error(error.message || "PDF 생성에 실패했습니다");
        return;
      }

      // 변경 후:
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = blobUrl;
      link.target = "_blank";
      link.rel = "noopener noreferrer";

      // Content-Disposition에서 파일명이 inline이므로 새 탭에서 열기
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setTimeout(() => URL.revokeObjectURL(blobUrl), 5000);
    } catch {
      toast.error("PDF 다운로드 중 오류가 발생했습니다");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      variant={variant}
      onClick={handleClick}
      disabled={loading}
      className="text-[0.95rem]"
    >
      {loading ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <Download className="mr-2 h-4 w-4" />
      )}
      {label}
    </Button>
  );
}
