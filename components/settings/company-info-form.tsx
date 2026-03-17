"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  companyInfoSchema,
  type CompanyInfoFormValues,
} from "@/lib/validators/company";
import { zodResolver } from "@hookform/resolvers/zod";
import { ImagePlus, Loader2, Trash2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";

export function CompanyInfoForm() {
  const logoInputRef = useRef<HTMLInputElement>(null);
  const sealInputRef = useRef<HTMLInputElement>(null);
  const [logoUploading, setLogoUploading] = useState(false);
  const [sealUploading, setSealUploading] = useState(false);
  const [loading, setLoading] = useState(true);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
    reset,
  } = useForm<CompanyInfoFormValues>({
    resolver: zodResolver(companyInfoSchema),
    defaultValues: {
      companyName: "",
      representative: "",
      address: "",
      phone: "",
      fax: "",
      businessNumber: "",
      businessType: "",
      businessItem: "",
      logoUrl: "",
      sealUrl: "",
    },
  });

  const logoUrl = watch("logoUrl");
  const sealUrl = watch("sealUrl");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/company");
        if (!res.ok) return;
        const data = await res.json();
        if (cancelled || !data) return;
        reset({
          companyName: data.companyName ?? "",
          representative: data.representative ?? "",
          address: data.address ?? "",
          phone: data.phone ?? "",
          fax: data.fax ?? "",
          businessNumber: data.businessNumber ?? "",
          businessType: data.businessType ?? "",
          businessItem: data.businessItem ?? "",
          logoUrl: data.logoUrl ?? "",
          sealUrl: data.sealUrl ?? "",
        });
      } catch {
        // ignore
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [reset]);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      if (res.ok) {
        const json = await res.json();
        setValue("logoUrl", json.url ?? "");
      } else {
        const err = await res.json();
        alert(err.message || "업로드에 실패했습니다");
      }
    } catch {
      alert("업로드 중 오류가 발생했습니다");
    } finally {
      setLogoUploading(false);
      if (logoInputRef.current) logoInputRef.current.value = "";
    }
  };

  const handleSealUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSealUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      if (res.ok) {
        const json = await res.json();
        setValue("sealUrl", json.url ?? "");
      } else {
        const err = await res.json();
        alert(err.message || "업로드에 실패했습니다");
      }
    } catch {
      alert("업로드 중 오류가 발생했습니다");
    } finally {
      setSealUploading(false);
      if (sealInputRef.current) sealInputRef.current.value = "";
    }
  };

  const onSubmit = async (data: CompanyInfoFormValues) => {
    try {
      const res = await fetch("/api/company", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        alert("저장되었습니다");
      } else {
        const err = await res.json();
        alert(err.message || "저장에 실패했습니다");
      }
    } catch {
      alert("서버 오류가 발생했습니다");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Card>
        <CardContent className="space-y-6 pt-6">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label className="text-[0.95rem] font-semibold">
                회사명 <span className="text-destructive">*</span>
              </Label>
              <Input
                placeholder="회사명"
                className="text-[0.95rem]"
                {...register("companyName")}
              />
              {errors.companyName && (
                <p className="text-destructive text-sm">
                  {errors.companyName.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label className="text-[0.95rem] font-semibold">
                대표자 <span className="text-destructive">*</span>
              </Label>
              <Input
                placeholder="대표자명"
                className="text-[0.95rem]"
                {...register("representative")}
              />
              {errors.representative && (
                <p className="text-destructive text-sm">
                  {errors.representative.message}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-[0.95rem] font-semibold">
              주소 <span className="text-destructive">*</span>
            </Label>
            <Input
              placeholder="주소"
              className="text-[0.95rem]"
              {...register("address")}
            />
            {errors.address && (
              <p className="text-destructive text-sm">
                {errors.address.message}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label className="text-[0.95rem] font-semibold">
                연락처 <span className="text-destructive">*</span>
              </Label>
              <Input
                placeholder="연락처"
                className="text-[0.95rem]"
                {...register("phone")}
              />
              {errors.phone && (
                <p className="text-destructive text-sm">
                  {errors.phone.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label className="text-[0.95rem]">팩스</Label>
              <Input
                placeholder="팩스"
                className="text-[0.95rem]"
                {...register("fax")}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label className="text-[0.95rem] font-semibold">
                사업자번호 <span className="text-destructive">*</span>
              </Label>
              <Input
                placeholder="사업자번호"
                className="text-[0.95rem]"
                {...register("businessNumber")}
              />
              {errors.businessNumber && (
                <p className="text-destructive text-sm">
                  {errors.businessNumber.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label className="text-[0.95rem]">업태</Label>
              <Input
                placeholder="업태"
                className="text-[0.95rem]"
                {...register("businessType")}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-[0.95rem]">종목</Label>
            <Input
              placeholder="종목"
              className="text-[0.95rem]"
              {...register("businessItem")}
            />
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label className="text-[0.95rem]">로고</Label>
              <input
                ref={logoInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleLogoUpload}
              />
              {logoUrl ? (
                <div className="relative inline-block">
                  <img
                    src={logoUrl}
                    alt="로고"
                    className="h-28 w-28 rounded-md border object-contain"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute -top-2 -right-2 h-6 w-6"
                    onClick={() => setValue("logoUrl", "")}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={logoUploading}
                  onClick={() => logoInputRef.current?.click()}
                >
                  {logoUploading ? (
                    <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                  ) : (
                    <ImagePlus className="mr-1 h-3 w-3" />
                  )}
                  로고 업로드
                </Button>
              )}
            </div>
            <div className="space-y-2">
              <Label className="text-[0.95rem]">직인</Label>
              <input
                ref={sealInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleSealUpload}
              />
              {sealUrl ? (
                <div className="relative inline-block">
                  <img
                    src={sealUrl}
                    alt="직인"
                    className="h-28 w-28 rounded-md border object-contain"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute -top-2 -right-2 h-6 w-6"
                    onClick={() => setValue("sealUrl", "")}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={sealUploading}
                  onClick={() => sealInputRef.current?.click()}
                >
                  {sealUploading ? (
                    <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                  ) : (
                    <ImagePlus className="mr-1 h-3 w-3" />
                  )}
                  직인 업로드
                </Button>
              )}
            </div>
          </div>

          <div className="flex justify-end">
            <Button type="submit" className="min-w-[120px]">
              저장
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  );
}
