"use client";

import { ProductCombobox } from "@/components/shared/product-combobox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { TransactionFormInput } from "@/lib/validators/transaction";
import { ChevronDown, ChevronUp, Trash2 } from "lucide-react";
import { useState } from "react";
import type {
  FieldErrors,
  UseFormRegister,
  UseFormSetValue,
  UseFormWatch,
} from "react-hook-form";

interface ProductOption {
  id: number;
  productName: string;
  spec: string | null;
  unitPrice: string | null;
}

interface SystemOption {
  id: number;
  label: string;
  value: string;
}

interface TransactionItemRowProps {
  index: number;
  register: UseFormRegister<TransactionFormInput>;
  setValue: UseFormSetValue<TransactionFormInput>;
  watch: UseFormWatch<TransactionFormInput>;
  errors: FieldErrors<TransactionFormInput>;
  onRemove: () => void;
  canRemove: boolean;
  products: ProductOption[];
  unitOptions: SystemOption[];
  transactionDate: string;
}

export function TransactionItemRow({
  index,
  register,
  setValue,
  watch,
  errors,
  onRemove,
  canRemove,
  products,
  unitOptions,
  transactionDate,
}: TransactionItemRowProps) {
  const [expanded, setExpanded] = useState(true);

  const quantity = watch(`items.${index}.quantity`);
  const unitPrice = watch(`items.${index}.unitPrice`);

  const itemErrors = errors?.items?.[index] as
    | Record<string, { message?: string }>
    | undefined;

  const recalcAmounts = (q: unknown, u: unknown) => {
    const qtyNum = Number(q) || 0;
    const unitNum = Number(u) || 0;
    const supplyAmount = qtyNum * unitNum;
    const vat = Math.round(supplyAmount * 0.1);

    setValue(`items.${index}.supplyAmount`, supplyAmount);
    setValue(`items.${index}.vat`, vat);
  };

  const handleProductSelect = (product: ProductOption | null) => {
    if (!product) {
      setValue(`items.${index}.productId`, undefined);
      return;
    }

    const nextUnitPrice = Number((product.unitPrice as string) || "0");

    setValue(`items.${index}.productId`, product.id);
    setValue(`items.${index}.productName`, product.productName);
    setValue(`items.${index}.spec`, (product.spec as string) || "");
    setValue(`items.${index}.unitPrice`, nextUnitPrice);

    recalcAmounts(quantity, nextUnitPrice);
  };

  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    recalcAmounts(e.target.value, unitPrice);
  };

  const handleUnitPriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    recalcAmounts(quantity, e.target.value);
  };

  const handleSupplyAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const supplyAmount = Number(e.target.value) || 0;
    const vat = Math.round(supplyAmount * 0.1);
    setValue(`items.${index}.vat`, vat);
  };

  return (
    <div className="rounded-lg border bg-background p-4">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-2 text-[0.95rem] font-semibold"
        >
          {expanded ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
          품목 #{index + 1}
          {watch(`items.${index}.productName`) && (
            <span className="font-normal text-muted-foreground">
              - {watch(`items.${index}.productName`)}
            </span>
          )}
          {itemErrors && (
            <span className="text-destructive text-xs font-normal">
              (입력 오류 있음)
            </span>
          )}
        </button>

        {canRemove && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onRemove}
            className="text-muted-foreground hover:text-destructive h-8 w-8"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>

      {expanded && (
        <div className="mt-4 space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <div className="space-y-1">
              <Label className="text-[0.85rem]">
                일자 <span className="text-destructive">*</span>
              </Label>
              <Input
                type="date"
                className="text-[0.9rem]"
                defaultValue={
                  watch(`items.${index}.itemDate`) || transactionDate
                }
                {...register(`items.${index}.itemDate`)}
              />
              {itemErrors?.itemDate && (
                <p className="text-destructive text-xs">
                  {itemErrors.itemDate.message || "일자는 필수입니다"}
                </p>
              )}
            </div>

            <div className="space-y-1">
              <Label className="text-[0.85rem]">품목 선택</Label>
              <ProductCombobox
                value={watch(`items.${index}.productId`) ?? null}
                onChange={handleProductSelect}
                products={products}
                placeholder="품목 검색"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-[0.85rem]">
                품명 <span className="text-destructive">*</span>
              </Label>
              <Input
                className="text-[0.9rem]"
                placeholder="품명"
                {...register(`items.${index}.productName`)}
              />
              {itemErrors?.productName && (
                <p className="text-destructive text-xs">
                  {itemErrors.productName.message || "품명은 필수입니다"}
                </p>
              )}
            </div>

            <div className="space-y-1">
              <Label className="text-[0.85rem]">규격</Label>
              <Input
                className="text-[0.9rem]"
                placeholder="규격"
                {...register(`items.${index}.spec`)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
            <div className="space-y-1">
              <Label className="text-[0.85rem]">수량</Label>
              <Input
                className="text-[0.9rem]"
                type="number"
                min="0"
                placeholder="0"
                {...register(`items.${index}.quantity`, {
                  valueAsNumber: true,
                  onChange: handleQuantityChange,
                })}
              />
            </div>

            <div className="space-y-1">
              <Label className="text-[0.85rem]">단위</Label>
              <select
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-[0.9rem] shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                value={watch(`items.${index}.unit`) || ""}
                onChange={(e) =>
                  setValue(`items.${index}.unit`, e.target.value)
                }
              >
                <option value="">선택</option>
                {unitOptions.length > 0 ? (
                  unitOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))
                ) : (
                  <>
                    <option value="매">매</option>
                    <option value="롤">롤</option>
                    <option value="장">장</option>
                    <option value="EA">EA</option>
                    <option value="박스">박스</option>
                    <option value="부">부</option>
                    <option value="기타">기타</option>
                  </>
                )}
              </select>
            </div>

            <div className="space-y-1">
              <Label className="text-[0.85rem]">단가</Label>
              <Input
                className="text-[0.9rem]"
                type="number"
                min="0"
                placeholder="0"
                {...register(`items.${index}.unitPrice`, {
                  valueAsNumber: true,
                  onChange: handleUnitPriceChange,
                })}
              />
            </div>

            <div className="space-y-1">
              <Label className="text-[0.85rem]">공급가액</Label>
              <Input
                className="text-[0.9rem]"
                type="number"
                min="0"
                placeholder="자동계산"
                {...register(`items.${index}.supplyAmount`, {
                  valueAsNumber: true,
                  onChange: handleSupplyAmountChange,
                })}
              />
            </div>

            <div className="space-y-1">
              <Label className="text-[0.85rem]">부가세</Label>
              <Input
                className="bg-muted text-[0.9rem]"
                type="number"
                readOnly
                placeholder="자동계산"
                {...register(`items.${index}.vat`, {
                  valueAsNumber: true,
                })}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
