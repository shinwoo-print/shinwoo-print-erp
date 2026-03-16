"use client";

import { TransactionItemRow } from "@/components/transactions/transaction-item-row";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { formatAmount } from "@/lib/utils/format";
import {
  transactionFormSchema,
  type TransactionFormValues,
} from "@/lib/validators/transaction";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Plus } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";

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

interface BankAccountOption {
  id: number;
  bankName: string;
  accountNumber: string;
  accountHolder: string;
  isDefault: boolean;
}

interface SystemOption {
  id: number;
  label: string;
  value: string;
}

interface TransactionFormProps {
  defaultValues?: TransactionFormValues;
  onSubmit: (data: TransactionFormValues) => Promise<void>;
  submitLabel?: string;
  loading?: boolean;
}

const emptyItem = {
  productId: undefined,
  itemDate: new Date().toISOString().split("T")[0],
  productName: "",
  spec: "",
  quantity: 0,
  unit: "",
  unitPrice: 0,
  supplyAmount: 0,
  vat: 0,
  sortOrder: 0,
};

const defaultFormValues: TransactionFormValues = {
  clientId: 0,
  transactionDate: new Date().toISOString().split("T")[0],
  bankAccountId: undefined,
  note: "",
  items: [{ ...emptyItem }],
};

export function TransactionForm({
  defaultValues,
  onSubmit,
  submitLabel = "저장",
  loading = false,
}: TransactionFormProps) {
  const [clients, setClients] = useState<ClientOption[]>([]);
  const [products, setProducts] = useState<ProductOption[]>([]);
  const [bankAccounts, setBankAccounts] = useState<BankAccountOption[]>([]);
  const [unitOptions, setUnitOptions] = useState<SystemOption[]>([]);

  const {
    register,
    handleSubmit,
    control,
    setValue,
    watch,
    formState: { errors },
  } = useForm<TransactionFormValues>({
    resolver: zodResolver(transactionFormSchema),
    defaultValues: defaultValues || defaultFormValues,
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "items",
  });

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

  useEffect(() => {
    fetch("/api/bank-accounts")
      .then((res) => res.json())
      .then((json) => {
        setBankAccounts(Array.isArray(json) ? json : []);
      })
      .catch(() => setBankAccounts([]));
  }, []);

  useEffect(() => {
    fetch("/api/options?category=UNIT")
      .then((res) => res.json())
      .then((data) => setUnitOptions(Array.isArray(data) ? data : []))
      .catch(() => setUnitOptions([]));
  }, []);

  const transactionDate = watch("transactionDate");
  const items = watch("items");

  useEffect(() => {
    items.forEach((item, index) => {
      if (!item.itemDate) {
        setValue(`items.${index}.itemDate`, transactionDate);
      }
    });
  }, [transactionDate, items, setValue]);

  const recalcTotals = useCallback(() => {
    let totalQuantity = 0;
    let totalSupplyAmount = 0;
    let totalVat = 0;

    for (const item of items) {
      totalQuantity += Number(item.quantity) || 0;
      totalSupplyAmount += Number(item.supplyAmount) || 0;
      totalVat += Number(item.vat) || 0;
    }

    return {
      totalQuantity,
      totalSupplyAmount,
      totalVat,
      totalAmount: totalSupplyAmount + totalVat,
    };
  }, [items]);

  const totals = recalcTotals();

  return (
    <form
      onSubmit={handleSubmit(onSubmit, (formErrors) => {
        console.log("폼 검증 실패:", JSON.stringify(formErrors, null, 2));
      })}
    >
      <div className="mb-4 flex justify-end">
        <Button
          type="submit"
          disabled={loading}
          className="min-w-[120px] text-[0.95rem]"
        >
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {submitLabel}
        </Button>
      </div>

      <Card>
        <CardContent className="space-y-6 pt-6">
          <h3 className="text-lg font-semibold">기본 정보</h3>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label className="text-[0.95rem] font-semibold">
                거래처 <span className="text-destructive">*</span>
              </Label>
              <select
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-[0.95rem] shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                value={watch("clientId") || ""}
                onChange={(e) =>
                  setValue("clientId", Number(e.target.value), {
                    shouldValidate: true,
                  })
                }
              >
                <option value="">거래처를 선택하세요</option>
                {clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.companyName}
                  </option>
                ))}
              </select>
              {errors.clientId && (
                <p className="text-destructive text-sm">
                  {errors.clientId.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label className="text-[0.95rem] font-semibold">
                거래일 <span className="text-destructive">*</span>
              </Label>
              <Input
                type="date"
                className="text-[0.95rem]"
                {...register("transactionDate")}
              />
              {errors.transactionDate && (
                <p className="text-destructive text-sm">
                  {errors.transactionDate.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label className="text-[0.95rem]">계좌 선택</Label>
              <select
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-[0.95rem] shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                value={watch("bankAccountId") ?? ""}
                onChange={(e) =>
                  setValue(
                    "bankAccountId",
                    e.target.value ? Number(e.target.value) : undefined,
                  )
                }
              >
                <option value="">선택 안함</option>
                {bankAccounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.bankName} {account.accountNumber}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label className="text-[0.95rem]">비고</Label>
              <Textarea
                rows={4}
                placeholder="특이사항을 입력하세요"
                className="text-[0.95rem]"
                {...register("note")}
              />
            </div>
          </div>
        </CardContent>
      </Card>

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
                  itemDate: transactionDate,
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
              <TransactionItemRow
                key={field.id}
                index={index}
                register={register}
                setValue={setValue}
                watch={watch}
                errors={errors}
                onRemove={() => remove(index)}
                canRemove={fields.length > 1}
                products={products}
                unitOptions={unitOptions}
                transactionDate={transactionDate}
              />
            ))}
          </div>

          <Separator />
          <div className="flex flex-col items-end gap-2 text-[0.95rem]">
            <div className="flex items-center gap-4">
              <span className="text-muted-foreground">수량 합계</span>
              <span className="w-[140px] text-right font-medium tabular-nums">
                {formatAmount(totals.totalQuantity)}
              </span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-muted-foreground">공급가액 합계</span>
              <span className="w-[140px] text-right font-medium tabular-nums">
                {formatAmount(totals.totalSupplyAmount)}원
              </span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-muted-foreground">부가세 합계</span>
              <span className="w-[140px] text-right font-medium tabular-nums">
                {formatAmount(totals.totalVat)}원
              </span>
            </div>
            <div className="flex items-center gap-4 text-lg">
              <span className="font-semibold">총액</span>
              <span className="w-[140px] text-right font-bold tabular-nums">
                {formatAmount(totals.totalAmount)}원
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Separator className="my-6" />

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
