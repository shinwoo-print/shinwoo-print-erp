"use client";

import { DesignImageUpload } from "@/components/orders/design-image-upload";
import { ProductCombobox } from "@/components/shared/product-combobox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { OrderFormInput } from "@/lib/validators/order";
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
  register: UseFormRegister<OrderFormInput>;
  setValue: UseFormSetValue<OrderFormInput>;
  watch: UseFormWatch<OrderFormInput>;
  errors: FieldErrors<OrderFormInput>;
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

  // 품목 선택 시 자동 채움
  const handleProductSelect = (product: ProductOption | null) => {
    if (!product) {
      setValue(`items.${index}.productId`, null);
      return;
    }
    setValue(`items.${index}.productId`, product.id);
    setValue(`items.${index}.productName`, product.productName);
    setValue(`items.${index}.printType`, product.printType || "");
    setValue(`items.${index}.material`, product.material || "");
    setValue(`items.${index}.unitPrice`, product.unitPrice || "");
    recalcSupply(sheets, product.unitPrice || "");
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
              <ProductCombobox
                value={watch(`items.${index}.productId`) ?? null}
                onChange={handleProductSelect}
                products={products}
                placeholder="품목 검색"
              />
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

          {/* 2행: 인쇄종류 + 인쇄가격 + 매수 */}
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
            <div className="space-y-1">
              <Label className="text-[0.85rem]">인쇄종류</Label>
              <Input
                className="text-[0.9rem]"
                placeholder={
                  options.PRINT_TYPE.length > 0
                    ? `예: ${options.PRINT_TYPE.slice(0, 3).map((o) => o.label).join(", ")}${options.PRINT_TYPE.length > 3 ? " 등" : ""}`
                    : "인쇄종류 입력"
                }
                {...register(`items.${index}.printType`)}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-[0.85rem]">디지털 인쇄가격</Label>
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
          </div>

          {/* 3행: 단가 + 공급가액 + 시트당매수 + 롤당매수 */}
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
              <Label className="text-[0.85rem]">시트당매수</Label>
              <Input
                className="text-[0.9rem]"
                placeholder="예: 100매"
                {...register(`items.${index}.sheetsPerSheet`)}
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

          {/* 3-1행: 원단 상세(원단종류/후지/접착제/두께/제조사/재단방식) */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-6">
            <div className="space-y-1">
              <Label className="text-[0.85rem]">원단종류</Label>
              <Input
                className="text-[0.9rem]"
                placeholder="예: 아트지, 유포지"
                {...register(`items.${index}.paperType`)}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-[0.85rem]">후지</Label>
              <Input
                className="text-[0.9rem]"
                placeholder="예: 백산"
                {...register(`items.${index}.backing`)}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-[0.85rem]">접착제</Label>
              <Input
                className="text-[0.9rem]"
                placeholder="예: 아크릴, 유성"
                {...register(`items.${index}.adhesive`)}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-[0.85rem]">두께</Label>
              <Input
                className="text-[0.9rem]"
                placeholder="예: 80μ, 100μ"
                {...register(`items.${index}.thickness`)}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-[0.85rem]">제조사</Label>
              <Input
                className="text-[0.9rem]"
                placeholder="예: 한솔, 무림"
                {...register(`items.${index}.manufacturer`)}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-[0.85rem]">재단방식</Label>
              <Input
                className="text-[0.9rem]"
                placeholder="재단방식 입력"
                {...register(`items.${index}.cuttingMethod`)}
              />
            </div>
          </div>

          {/* 4행: 사이즈(가로×세로) + 미싱선 */}
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
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

          {/* 5행: 라미 + 박 + 롤방향 */}
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
            <div className="space-y-1">
              <Label className="text-[0.85rem]">라미</Label>
              <Input
                className="text-[0.9rem]"
                placeholder={
                  options.LAMI.length > 0
                    ? `예: ${options.LAMI.slice(0, 3).map((o) => o.label).join(", ")}${options.LAMI.length > 3 ? " 등" : ""}`
                    : "라미 입력"
                }
                {...register(`items.${index}.lamination`)}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-[0.85rem]">박</Label>
              <Input
                className="text-[0.9rem]"
                placeholder={
                  options.FOIL.length > 0
                    ? `예: ${options.FOIL.slice(0, 3).map((o) => o.label).join(", ")}${options.FOIL.length > 3 ? " 등" : ""}`
                    : "박 입력"
                }
                {...register(`items.${index}.foil`)}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-[0.85rem]">롤방향</Label>
              <Input
                className="text-[0.9rem]"
                placeholder={
                  options.ROLL_DIR.length > 0
                    ? `예: ${options.ROLL_DIR.slice(0, 3).map((o) => o.label).join(", ")}${options.ROLL_DIR.length > 3 ? " 등" : ""}`
                    : "롤방향 입력"
                }
                {...register(`items.${index}.rollDirection`)}
              />
            </div>
          </div>

          {/* 6행: DATA종류 + 최종DATA날짜 + 기존디자인파일 + 디자인시안 */}
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <div className="space-y-1">
              <Label className="text-[0.85rem]">DATA종류</Label>
              <Input
                className="text-[0.9rem]"
                placeholder={
                  options.DATA_TYPE.length > 0
                    ? `예: ${options.DATA_TYPE.slice(0, 3).map((o) => o.label).join(", ")}${options.DATA_TYPE.length > 3 ? " 등" : ""}`
                    : "DATA종류 입력"
                }
                {...register(`items.${index}.dataType`)}
              />
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
              <Input
                className="text-[0.9rem]"
                placeholder={
                  options.DESIGN_STATUS.length > 0
                    ? `예: ${options.DESIGN_STATUS.slice(0, 3).map((o) => o.label).join(", ")}${options.DESIGN_STATUS.length > 3 ? " 등" : ""}`
                    : "디자인파일 상태 입력"
                }
                {...register(`items.${index}.designFileStatus`)}
              />
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
        </div>
      )}
    </div>
  );
}
