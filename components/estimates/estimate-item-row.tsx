"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { EstimateFormInput } from "@/lib/validators/estimate";
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

interface EstimateItemRowProps {
  index: number;
  register: UseFormRegister<EstimateFormInput>;
  setValue: UseFormSetValue<EstimateFormInput>;
  watch: UseFormWatch<EstimateFormInput>;
  errors: FieldErrors<EstimateFormInput>;
  onRemove: () => void;
  canRemove: boolean;
  products: ProductOption[];
}

export function EstimateItemRow({
  index,
  register,
  setValue,
  watch,
  errors,
  onRemove,
  canRemove,
  products,
}: EstimateItemRowProps) {
  const [expanded, setExpanded] = useState(true);

  const quantity = watch(`items.${index}.quantity`);
  const unitPrice = watch(`items.${index}.unitPrice`);

  const itemErrors = errors?.items?.[index] as
    | Record<string, { message?: string }>
    | undefined;

  const handleProductSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const productId = Number(e.target.value);
    if (!productId) {
      setValue(`items.${index}.productId`, null);
      return;
    }
    const product = products.find((p) => p.id === productId);
    if (product) {
      setValue(`items.${index}.productId`, product.id);
      setValue(`items.${index}.productName`, product.productName);
      setValue(`items.${index}.spec`, product.spec || "");
      setValue(`items.${index}.unitPrice`, product.unitPrice || "0");
      recalcAmounts(quantity, product.unitPrice || "0");
    }
  };

  const recalcAmounts = (q: unknown, u: unknown) => {
    const qtyNum = Number(q) || 0;
    const unitNum = Number(u) || 0;
    const supply = qtyNum * unitNum;
    const vat = Math.round(supply * 0.1);
    setValue(`items.${index}.supplyAmount`, supply > 0 ? String(supply) : "0");
    setValue(`items.${index}.vat`, vat > 0 ? String(vat) : "0");
  };

  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    recalcAmounts(val, unitPrice);
  };

  const handleUnitPriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    recalcAmounts(quantity, val);
  };

  const handleSupplyAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const supply = Number(e.target.value) || 0;
    const vat = Math.round(supply * 0.1);
    setValue(`items.${index}.vat`, String(vat));
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
            <span className="text-xs font-normal text-destructive">
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
            className="h-8 w-8 text-muted-foreground hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>

      {expanded && (
        <div className="mt-4 space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="space-y-1">
              <Label className="text-[0.85rem]">품목 선택</Label>
              <select
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-[0.9rem] shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                onChange={handleProductSelect}
                value={watch(`items.${index}.productId`) ?? ""}
              >
                <option value="">직접 입력</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.productName}
                  </option>
                ))}
              </select>
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
              <Label className="text-[0.85rem]">규격(mm)</Label>
              <Input
                className="text-[0.9rem]"
                placeholder="예: 50×30"
                {...register(`items.${index}.spec`)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <div className="space-y-1">
              <Label className="text-[0.85rem]">발주수량 표시</Label>
              <Input
                className="text-[0.9rem]"
                placeholder="예: 97,320매 / 5종"
                {...register(`items.${index}.quantityText`)}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-[0.85rem]">수량(계산용)</Label>
              <Input
                className="text-[0.9rem]"
                placeholder="0"
                type="number"
                min="0"
                {...register(`items.${index}.quantity`, {
                  onChange: handleQuantityChange,
                })}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-[0.85rem]">단가 표시</Label>
              <Input
                className="text-[0.9rem]"
                placeholder="예: 10원 / 20,000원/종"
                {...register(`items.${index}.unitPriceText`)}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-[0.85rem]">단가(계산용)</Label>
              <Input
                className="text-[0.9rem]"
                placeholder="0"
                {...register(`items.${index}.unitPrice`, {
                  onChange: handleUnitPriceChange,
                })}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="space-y-1">
              <Label className="text-[0.85rem]">공급가액</Label>
              <Input
                className="text-[0.9rem]"
                placeholder="자동계산"
                {...register(`items.${index}.supplyAmount`, {
                  onChange: handleSupplyAmountChange,
                })}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-[0.85rem]">세액</Label>
              <Input
                className="text-[0.9rem] bg-muted"
                placeholder="자동계산"
                readOnly
                {...register(`items.${index}.vat`)}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-[0.85rem]">비고</Label>
              <Input
                className="text-[0.9rem]"
                placeholder="비고"
                {...register(`items.${index}.note`)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
