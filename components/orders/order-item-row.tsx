"use client";

import { DesignImageUpload } from "@/components/orders/design-image-upload";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { OrderFormValues } from "@/lib/validators/order";
import { ChevronDown, ChevronUp, Trash2 } from "lucide-react";
import { useState } from "react";
import type {
  FieldErrors,
  UseFormRegister,
  UseFormSetValue,
  UseFormWatch,
} from "react-hook-form";

interface SystemOption {
  id: number;
  label: string;
  value: string;
}

interface ProductOption {
  id: number;
  productName: string;
  printType: string | null;
  material: string | null;
  unitPrice: string | null;
}

interface OrderItemRowProps {
  index: number;
  register: UseFormRegister<OrderFormValues>;
  setValue: UseFormSetValue<OrderFormValues>;
  watch: UseFormWatch<OrderFormValues>;
  errors: FieldErrors<OrderFormValues>;
  onRemove: () => void;
  canRemove: boolean;
  products: ProductOption[];
  options: {
    PRINT_TYPE: SystemOption[];
    MATERIAL: SystemOption[];
    SHAPE: SystemOption[];
    LAMI: SystemOption[];
    FOIL: SystemOption[];
    CUTTING: SystemOption[];
    ROLL_DIR: SystemOption[];
    DATA_TYPE: SystemOption[];
    DESIGN_STATUS: SystemOption[];
  };
}

export function OrderItemRow({
  index,
  register,
  setValue,
  watch,
  errors,
  onRemove,
  canRemove,
  products,
  options,
}: OrderItemRowProps) {
  const [expanded, setExpanded] = useState(true);
  const prefix = `items.${index}` as const;

  const sheets = watch(`items.${index}.sheets`);
  const unitPrice = watch(`items.${index}.unitPrice`);
  const designImageUrl = watch(`items.${index}.designImageUrl`) || "";

  // 이 품목의 에러
  const itemErrors = errors?.items?.[index] as
    | Record<string, { message?: string }>
    | undefined;
  console.log("errors 전체:", JSON.stringify(errors, null, 2));
  console.log("errors.items:", errors?.items);
  console.log(`errors.items[${index}]:`, errors?.items?.[index]);

  // 품목 선택 시 자동 채움
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
      setValue(`items.${index}.printType`, product.printType || "");
      setValue(`items.${index}.material`, product.material || "");
      setValue(`items.${index}.unitPrice`, product.unitPrice || "");
      recalcSupply(sheets, product.unitPrice || "");
    }
  };

  // 공급가액 자동계산
  const recalcSupply = (s: unknown, u: unknown) => {
    const sheetsNum = Number(s) || 0;
    const unitNum = Number(u) || 0;
    const supply = sheetsNum * unitNum;
    setValue(`items.${index}.supplyAmount`, supply > 0 ? String(supply) : "");
  };

  const handleSheetsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    recalcSupply(val, unitPrice);
  };

  const handleUnitPriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    recalcSupply(sheets, val);
  };

  return (
    <div className="rounded-lg border bg-background p-4">
      {/* 헤더 */}
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
          {/* 1행: 품목 선택 + 품목명 */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
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
                품목명 <span className="text-destructive">*</span>
              </Label>
              <Input
                className="text-[0.9rem]"
                placeholder="품목명"
                {...register(`items.${index}.productName`)}
              />
              {itemErrors?.productName && (
                <p className="text-destructive text-xs">
                  {itemErrors.productName.message || "품목명은 필수입니다"}
                </p>
              )}
            </div>
          </div>

          {/* 2행: 인쇄종류 + 인쇄가격 + 매수 + 롤당매수 */}
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <div className="space-y-1">
              <Label className="text-[0.85rem]">인쇄종류</Label>
              <select
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-[0.9rem] shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                {...register(`items.${index}.printType`)}
              >
                <option value="">선택</option>
                {options.PRINT_TYPE.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <Label className="text-[0.85rem]">인쇄가격</Label>
              <Input
                className="text-[0.9rem]"
                placeholder="0"
                {...register(`items.${index}.printPrice`)}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-[0.85rem]">매수</Label>
              <Input
                className="text-[0.9rem]"
                placeholder="0"
                type="number"
                min="0"
                {...register(`items.${index}.sheets`, {
                  onChange: handleSheetsChange,
                })}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-[0.85rem]">롤당매수</Label>
              <Input
                className="text-[0.9rem]"
                placeholder="0"
                type="number"
                min="0"
                {...register(`items.${index}.sheetsPerRoll`)}
              />
            </div>
          </div>

          {/* 3행: 단가 + 공급가액 + 원단 + 원단폭 */}
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <div className="space-y-1">
              <Label className="text-[0.85rem]">단가</Label>
              <Input
                className="text-[0.9rem]"
                placeholder="0"
                {...register(`items.${index}.unitPrice`, {
                  onChange: handleUnitPriceChange,
                })}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-[0.85rem]">공급가액</Label>
              <Input
                className="text-[0.9rem] bg-muted"
                placeholder="자동계산"
                readOnly
                {...register(`items.${index}.supplyAmount`)}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-[0.85rem]">원단</Label>
              <select
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-[0.9rem] shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                {...register(`items.${index}.material`)}
              >
                <option value="">선택</option>
                {options.MATERIAL.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <Label className="text-[0.85rem]">원단폭(mm)</Label>
              <Input
                className="text-[0.9rem]"
                placeholder="0"
                {...register(`items.${index}.materialWidth`)}
              />
            </div>
          </div>

          {/* 4행: 사이즈(가로×세로) + 형상 + 오꾸리 + 미싱선 */}
          <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
            <div className="space-y-1">
              <Label className="text-[0.85rem]">가로(mm)</Label>
              <Input
                className="text-[0.9rem]"
                placeholder="0"
                {...register(`items.${index}.sizeWidth`)}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-[0.85rem]">세로(mm)</Label>
              <Input
                className="text-[0.9rem]"
                placeholder="0"
                {...register(`items.${index}.sizeHeight`)}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-[0.85rem]">형상</Label>
              <select
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-[0.9rem] shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                {...register(`items.${index}.shape`)}
              >
                <option value="">선택</option>
                {options.SHAPE.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <Label className="text-[0.85rem]">오꾸리(mm)</Label>
              <Input
                className="text-[0.9rem]"
                placeholder="0"
                {...register(`items.${index}.okkuri`)}
              />
            </div>
            <div className="flex items-end space-x-2 pb-1">
              <input
                type="checkbox"
                id={`${prefix}-perforation`}
                className="h-4 w-4 rounded border-gray-300"
                {...register(`items.${index}.perforation`)}
              />
              <Label
                htmlFor={`${prefix}-perforation`}
                className="text-[0.85rem]"
              >
                미싱선
              </Label>
            </div>
          </div>

          {/* 5행: 라미 + 박 + 재단방식 + 롤방향 + 슬리트 */}
          <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
            <div className="space-y-1">
              <Label className="text-[0.85rem]">라미</Label>
              <select
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-[0.9rem] shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                {...register(`items.${index}.lamination`)}
              >
                <option value="">선택</option>
                {options.LAMI.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <Label className="text-[0.85rem]">박</Label>
              <select
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-[0.9rem] shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                {...register(`items.${index}.foil`)}
              >
                <option value="">선택</option>
                {options.FOIL.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <Label className="text-[0.85rem]">재단방식</Label>
              <select
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-[0.9rem] shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                {...register(`items.${index}.cuttingMethod`)}
              >
                <option value="">선택</option>
                {options.CUTTING.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <Label className="text-[0.85rem]">롤방향</Label>
              <select
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-[0.9rem] shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                {...register(`items.${index}.rollDirection`)}
              >
                <option value="">선택</option>
                {options.ROLL_DIR.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-end space-x-2 pb-1">
              <input
                type="checkbox"
                id={`${prefix}-slit`}
                className="h-4 w-4 rounded border-gray-300"
                {...register(`items.${index}.slit`)}
              />
              <Label htmlFor={`${prefix}-slit`} className="text-[0.85rem]">
                슬리트
              </Label>
            </div>
          </div>

          {/* 6행: DATA종류 + 최종DATA날짜 + 기존디자인파일 + 디자인시안 */}
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <div className="space-y-1">
              <Label className="text-[0.85rem]">DATA종류</Label>
              <select
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-[0.9rem] shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                {...register(`items.${index}.dataType`)}
              >
                <option value="">선택</option>
                {options.DATA_TYPE.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <Label className="text-[0.85rem]">최종DATA날짜</Label>
              <Input
                type="date"
                className="text-[0.9rem]"
                {...register(`items.${index}.lastDataDate`)}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-[0.85rem]">기존디자인파일</Label>
              <select
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-[0.9rem] shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                {...register(`items.${index}.designFileStatus`)}
              >
                <option value="">선택</option>
                {options.DESIGN_STATUS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <Label className="text-[0.85rem]">디자인 시안</Label>
              <DesignImageUpload
                value={designImageUrl}
                onChange={(url) =>
                  setValue(`items.${index}.designImageUrl`, url)
                }
              />
            </div>
          </div>
          {/* 7행: 재단방식(롤/시트) + 시트당매수 + 라벨간격 + 도무송칼 + 수지판 */}
          <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
            <div className="space-y-1">
              <Label className="text-[0.85rem]">재단(롤/시트)</Label>
              <select
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-[0.9rem] shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                {...register(`items.${index}.cuttingType`)}
              >
                <option value="">선택</option>
                <option value="롤">롤</option>
                <option value="시트">시트</option>
              </select>
            </div>
            <div className="space-y-1">
              <Label className="text-[0.85rem]">시트당매수</Label>
              <Input
                className="text-[0.9rem]"
                placeholder="예: 100매"
                {...register(`items.${index}.sheetsPerSheet`)}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-[0.85rem]">라벨간격(mm)</Label>
              <Input
                className="text-[0.9rem]"
                placeholder="0"
                {...register(`items.${index}.labelGap`)}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-[0.85rem]">도무송칼</Label>
              <select
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-[0.9rem] shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                {...register(`items.${index}.dieCutter`)}
              >
                <option value="">선택</option>
                <option value="보유">보유</option>
                <option value="주문">주문</option>
              </select>
            </div>
            <div className="space-y-1">
              <Label className="text-[0.85rem]">수지판</Label>
              <select
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-[0.9rem] shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                {...register(`items.${index}.resinPlate`)}
              >
                <option value="">선택</option>
                <option value="보유">보유</option>
                <option value="주문">주문</option>
              </select>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
