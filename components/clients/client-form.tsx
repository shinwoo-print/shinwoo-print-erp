"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  clientFormSchema,
  type ClientFormValues,
} from "@/lib/validators/client";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";

interface ClientFormProps {
  defaultValues?: ClientFormValues;
  onSubmit: (data: ClientFormValues) => Promise<void>;
  submitLabel?: string;
  loading?: boolean;
}

export function ClientForm({
  defaultValues,
  onSubmit,
  submitLabel = "저장",
  loading = false,
}: ClientFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ClientFormValues>({
    resolver: zodResolver(clientFormSchema),
    defaultValues: defaultValues || {
      companyName: "",
      clientType: "매출",
      representative: "",
      contactName: "",
      phone: "",
      mobilePhone: "",
      fax: "",
      email: "",
      address: "",
      businessNumber: "",
      businessType: "",
      businessItem: "",
      memo: "",
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Card>
        <CardContent className="space-y-6 pt-6">
          {/* 업체명 */}
          <div className="space-y-2">
            <Label htmlFor="companyName" className="text-[0.95rem] font-semibold">
              업체명 <span className="text-destructive">*</span>
            </Label>
            <Input
              id="companyName"
              placeholder="업체명을 입력하세요"
              className="text-[0.95rem]"
              {...register("companyName")}
            />
            {errors.companyName && (
              <p className="text-destructive text-sm">{errors.companyName.message}</p>
            )}
          </div>

          {/* 거래 구분 */}
          <div className="space-y-2">
            <Label htmlFor="clientType" className="text-[0.95rem] font-semibold">
              거래 구분 <span className="text-destructive">*</span>
            </Label>
            <select
              id="clientType"
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-[0.95rem] shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              {...register("clientType")}
            >
              <option value="매출">매출</option>
              <option value="매입">매입</option>
              <option value="매입매출">매입매출</option>
            </select>
            {errors.clientType && (
              <p className="text-destructive text-sm">{errors.clientType.message}</p>
            )}
          </div>

          {/* 2열 레이아웃 */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {/* 대표자명 */}
            <div className="space-y-2">
              <Label htmlFor="representative" className="text-[0.95rem]">
                대표자명
              </Label>
              <Input
                id="representative"
                placeholder="대표자명"
                className="text-[0.95rem]"
                {...register("representative")}
              />
              {errors.representative && (
                <p className="text-destructive text-sm">{errors.representative.message}</p>
              )}
            </div>

            {/* 담당자명 */}
            <div className="space-y-2">
              <Label htmlFor="contactName" className="text-[0.95rem]">
                담당자명
              </Label>
              <Input
                id="contactName"
                placeholder="담당자명"
                className="text-[0.95rem]"
                {...register("contactName")}
              />
              {errors.contactName && (
                <p className="text-destructive text-sm">{errors.contactName.message}</p>
              )}
            </div>

            {/* 연락처 */}
            <div className="space-y-2">
              <Label htmlFor="phone" className="text-[0.95rem]">연락처</Label>
              <Input id="phone" placeholder="02-000-0000" className="text-[0.95rem]" {...register("phone")} />
              {errors.phone && <p className="text-destructive text-sm">{errors.phone.message}</p>}
            </div>

            {/* 핸드폰번호 */}
            <div className="space-y-2">
              <Label htmlFor="mobilePhone" className="text-[0.95rem]">핸드폰번호</Label>
              <Input id="mobilePhone" placeholder="010-0000-0000" className="text-[0.95rem]" {...register("mobilePhone")} />
              {errors.mobilePhone && <p className="text-destructive text-sm">{errors.mobilePhone.message}</p>}
            </div>

            {/* 팩스 */}
            <div className="space-y-2">
              <Label htmlFor="fax" className="text-[0.95rem]">팩스</Label>
              <Input id="fax" placeholder="02-000-0000" className="text-[0.95rem]" {...register("fax")} />
              {errors.fax && <p className="text-destructive text-sm">{errors.fax.message}</p>}
            </div>

            {/* 이메일 */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-[0.95rem]">이메일</Label>
              <Input id="email" type="email" placeholder="example@email.com" className="text-[0.95rem]" {...register("email")} />
              {errors.email && <p className="text-destructive text-sm">{errors.email.message}</p>}
            </div>

            {/* 사업자번호 */}
            <div className="space-y-2">
              <Label htmlFor="businessNumber" className="text-[0.95rem]">사업자번호</Label>
              <Input id="businessNumber" placeholder="000-00-00000" className="text-[0.95rem]" {...register("businessNumber")} />
              {errors.businessNumber && <p className="text-destructive text-sm">{errors.businessNumber.message}</p>}
            </div>

            {/* 업태 */}
            <div className="space-y-2">
              <Label htmlFor="businessType" className="text-[0.95rem]">업태</Label>
              <Input id="businessType" placeholder="제조업" className="text-[0.95rem]" {...register("businessType")} />
              {errors.businessType && <p className="text-destructive text-sm">{errors.businessType.message}</p>}
            </div>

            {/* 종목 */}
            <div className="space-y-2">
              <Label htmlFor="businessItem" className="text-[0.95rem]">종목</Label>
              <Input id="businessItem" placeholder="인쇄물" className="text-[0.95rem]" {...register("businessItem")} />
              {errors.businessItem && <p className="text-destructive text-sm">{errors.businessItem.message}</p>}
            </div>
          </div>

          {/* 주소 */}
          <div className="space-y-2">
            <Label htmlFor="address" className="text-[0.95rem]">주소</Label>
            <Input id="address" placeholder="주소를 입력하세요" className="text-[0.95rem]" {...register("address")} />
            {errors.address && <p className="text-destructive text-sm">{errors.address.message}</p>}
          </div>

          {/* 비고 */}
          <div className="space-y-2">
            <Label htmlFor="memo" className="text-[0.95rem]">비고</Label>
            <Textarea id="memo" placeholder="메모를 입력하세요" rows={3} className="text-[0.95rem]" {...register("memo")} />
            {errors.memo && <p className="text-destructive text-sm">{errors.memo.message}</p>}
          </div>

          <div className="flex justify-end">
            <Button type="submit" disabled={loading} className="min-w-[120px] text-[0.95rem]">
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {submitLabel}
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  );
}
