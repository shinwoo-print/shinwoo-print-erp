"use client";

import { EstimateItemRow } from "@/components/estimates/estimate-item-row";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { formatAmount } from "@/lib/utils/format";
import {
  estimateFormSchema,
  type EstimateFormValues,
} from "@/lib/validators/estimate";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Plus } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";

interface SystemOption {
  id: number;
  label: string;
  value: string;
}

interface ClientOption {
  id: number;
  companyName: string;
  contactName: string | null;
}

interface ProductOption {
  id: number;
  productName: string;
  spec: string | null;
  unitPrice: string | null;
}

interface EstimateFormProps {
  defaultValues?: EstimateFormValues;
  onSubmit: (data: EstimateFormValues) => Promise<void>;
  submitLabel?: string;
  loading?: boolean;
}

const emptyItem = {
  productId: null,
  productName: "",
  spec: "",
  quantity: 0,
  quantityText: "",
  unitPrice: "0",
  unitPriceText: "",
  supplyAmount: "0",
  vat: "0",
  note: "",
  sortOrder: 0,
};

const defaultFormValues: EstimateFormValues = {
  clientId: 0,
  estimateDate: new Date().toISOString().split("T")[0],
  clientContactName: "",
  recipientText: "",
  stage: "1차제안",
  validDays: 10,
  totalSupplyAmount: "0",
  totalVat: "0",
  totalAmount: "0",
  note: "",
  items: [{ ...emptyItem }],
};

export function EstimateForm({
  defaultValues,
  onSubmit,
  submitLabel = "저장",
  loading = false,
}: EstimateFormProps) {
  const [clients, setClients] = useState<ClientOption[]>([]);
  const [products, setProducts] = useState<ProductOption[]>([]);
  const [stageOptions, setStageOptions] = useState<SystemOption[]>([]);

  const {
    register,
    handleSubmit,
    control,
    setValue,
    watch,
    formState: { errors },
  } = useForm<EstimateFormValues>({
    resolver: zodResolver(estimateFormSchema),
    defaultValues: defaultValues || defaultFormValues,
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "items",
  });

  // 거래처 목록 로드
  useEffect(() => {
    fetch("/api/clients?pageSize=500")
      .then((res) => res.json())
      .then((json) => {
        setClients(
          (json.data || []).map((c: Record<string, unknown>) => ({
            id: c.id as number,
            companyName: c.companyName as string,
            contactName: (c.contactName as string) || null,
          })),
        );
      })
      .catch(() => setClients([]));
  }, []);

  // 품목 목록 로드
  useEffect(() => {
    fetch("/api/products?pageSize=500")
      .then((res) => res.json())
      .then((json) => {
        setProducts(
          (json.data || []).map((p: Record<string, unknown>) => ({
            id: p.id as number,
            productName: p.productName as string,
            spec: (p.spec as string) || null,
            unitPrice: (p.unitPrice as string) || null,
          })),
        );
      })
      .catch(() => setProducts([]));
  }, []);

  // 진행단계 옵션 로드
  useEffect(() => {
    fetch("/api/options?category=ESTIMATE_STAGE")
      .then((res) => res.json())
      .then((data) => setStageOptions(data as SystemOption[]))
      .catch(() => setStageOptions([]));
  }, []);

  // 거래처 선택 시 recipientText 자동 채움
  const handleClientChange = useCallback(
    (clientId: number) => {
      setValue("clientId", clientId, { shouldValidate: true });
      const client = clients.find((c) => c.id === clientId);
      if (client) {
        const contactPart = client.contactName ? ` ${client.contactName}` : "";
        setValue("recipientText", `${client.companyName}${contactPart} 귀 하`);
      }
    },
    [clients, setValue],
  );

  // 합계 자동 계산
  const items = watch("items");
  const recalcTotals = useCallback(() => {
    let totalSupply = 0;
    let totalVat = 0;
    for (const item of items) {
      totalSupply += Number(item.supplyAmount) || 0;
      totalVat += Number(item.vat) || 0;
    }
    const totalAmount = totalSupply + totalVat;
    setValue("totalSupplyAmount", String(totalSupply));
    setValue("totalVat", String(totalVat));
    setValue("totalAmount", String(totalAmount));
  }, [items, setValue]);

  useEffect(() => {
    recalcTotals();
  }, [recalcTotals]);

  const watchTotalSupply = watch("totalSupplyAmount");
  const watchTotalVat = watch("totalVat");
  const watchTotalAmount = watch("totalAmount");

  return (
    <form
      onSubmit={handleSubmit(onSubmit, (formErrors) => {
        console.log("폼 검증 실패:", JSON.stringify(formErrors, null, 2));
      })}
    >
      {/* 상단 저장 버튼 */}
      <div className="flex justify-end mb-4">
        <Button
          type="submit"
          disabled={loading}
          className="min-w-[120px] text-[0.95rem]"
        >
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {submitLabel}
        </Button>
      </div>

      {/* 기본 정보 */}
      <Card>
        <CardContent className="space-y-6 pt-6">
          <h3 className="text-lg font-semibold">기본 정보</h3>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {/* 거래처 */}
            <div className="space-y-2">
              <Label className="text-[0.95rem] font-semibold">
                거래처 <span className="text-destructive">*</span>
              </Label>
              <select
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-[0.95rem] shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                value={watch("clientId") || ""}
                onChange={(e) => handleClientChange(Number(e.target.value))}
              >
                <option value="">거래처를 선택하세요</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.companyName}
                  </option>
                ))}
              </select>
              {errors.clientId && (
                <p className="text-destructive text-sm">
                  {errors.clientId.message}
                </p>
              )}
            </div>

            {/* 진행단계 */}
            <div className="space-y-2">
              <Label className="text-[0.95rem]">진행단계</Label>
              <select
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-[0.95rem] shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                {...register("stage")}
              >
                {stageOptions.length > 0 ? (
                  stageOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))
                ) : (
                  <>
                    <option value="1차제안">1차제안</option>
                    <option value="2차제안">2차제안</option>
                    <option value="LOST">LOST</option>
                    <option value="계약체결">계약체결</option>
                  </>
                )}
              </select>
            </div>

            {/* 견적일 */}
            <div className="space-y-2">
              <Label className="text-[0.95rem] font-semibold">
                견적일 <span className="text-destructive">*</span>
              </Label>
              <Input
                type="date"
                className="text-[0.95rem]"
                {...register("estimateDate")}
              />
              {errors.estimateDate && (
                <p className="text-destructive text-sm">
                  {errors.estimateDate.message}
                </p>
              )}
            </div>

            {/* 유효기간 */}
            <div className="space-y-2">
              <Label className="text-[0.95rem]">유효기간 (일)</Label>
              <Input
                type="number"
                min="1"
                className="text-[0.95rem]"
                placeholder="10"
                {...register("validDays")}
              />
            </div>

            {/* 수신자 */}
            <div className="space-y-2 md:col-span-2">
              <Label className="text-[0.95rem]">수신자</Label>
              <Input
                className="text-[0.95rem]"
                placeholder="예: 동원F&B 이지은 주임님 귀 하"
                {...register("recipientText")}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 품목 목록 */}
      <Card className="mt-6">
        <CardContent className="space-y-4 pt-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">품목</h3>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                append({
                  ...emptyItem,
                  sortOrder: fields.length,
                })
              }
              className="text-[0.85rem]"
            >
              <Plus className="mr-1 h-3 w-3" />
              품목 추가
            </Button>
          </div>

          {errors.items?.message && (
            <p className="text-destructive text-sm">{errors.items.message}</p>
          )}

          <div className="space-y-4">
            {fields.map((field, index) => (
              <EstimateItemRow
                key={field.id}
                index={index}
                register={register}
                setValue={setValue}
                watch={watch}
                errors={errors}
                onRemove={() => remove(index)}
                canRemove={fields.length > 1}
                products={products}
              />
            ))}
          </div>

          {/* 합계 영역 */}
          <Separator />
          <div className="flex flex-col items-end gap-2 text-[0.95rem]">
            <div className="flex items-center gap-4">
              <span className="text-muted-foreground">공급가액 합계</span>
              <span className="w-[140px] text-right font-medium tabular-nums">
                {formatAmount(watchTotalSupply)}원
              </span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-muted-foreground">세액 합계</span>
              <span className="w-[140px] text-right font-medium tabular-nums">
                {formatAmount(watchTotalVat)}원
              </span>
            </div>
            <div className="flex items-center gap-4 text-lg">
              <span className="font-semibold">총합계금액(VAT포함)</span>
              <span className="w-[140px] text-right font-bold tabular-nums">
                {formatAmount(watchTotalAmount)}원
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 비고 */}
      <Card className="mt-6">
        <CardContent className="space-y-6 pt-6">
          <h3 className="text-lg font-semibold">비고</h3>
          <Textarea
            placeholder="특이사항을 입력하세요"
            rows={4}
            className="text-[0.95rem]"
            {...register("note")}
          />
        </CardContent>
      </Card>

      <Separator className="my-6" />

      {/* 하단 저장 버튼 */}
      <div className="flex justify-end">
        <Button
          type="submit"
          disabled={loading}
          className="min-w-[120px] text-[0.95rem]"
        >
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
