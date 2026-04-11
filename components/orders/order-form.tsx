"use client";

import { OrderCopyDialog } from "@/components/orders/order-copy-dialog";
import { OrderItemRow } from "@/components/orders/order-item-row";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import {
  orderFormSchema,
  type OrderFormInput,
  type OrderFormValues,
} from "@/lib/validators/order";

import { zodResolver } from "@hookform/resolvers/zod";
import { Copy, Loader2, Plus } from "lucide-react";
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
}

interface ProductOption {
  id: number;
  productName: string;
  printType: string | null;
  material: string | null;
  unitPrice: string | null;
}

type AllOptions = {
  PRINT_TYPE: SystemOption[];
  MATERIAL: SystemOption[];
  SHAPE: SystemOption[];
  LAMI: SystemOption[];
  FOIL: SystemOption[];
  CUTTING: SystemOption[];
  ROLL_DIR: SystemOption[];
  DATA_TYPE: SystemOption[];
  DESIGN_STATUS: SystemOption[];
  PACKAGING: SystemOption[];
  DELIVERY: SystemOption[];
  COURIER: SystemOption[];
};

interface OrderFormProps {
  defaultValues?: OrderFormValues;
  onSubmit: (data: OrderFormValues) => Promise<void>;
  submitLabel?: string;
  loading?: boolean;
}

const emptyItem = {
  productId: null,
  productName: "",
  printType: "",
  printPrice: "",
  sheets: null,
  sheetsPerRoll: null,
  unitPrice: "",
  supplyAmount: "",
  material: "",
  materialWidth: "",
  paperType: "",
  backing: "",
  adhesive: "",
  thickness: "",
  manufacturer: "",
  perforation: false,
  sizeWidth: "",
  sizeHeight: "",
  shape: "",
  okkuri: "",
  lamination: "",
  foil: "",
  cuttingMethod: "",
  rollDirection: "",
  slit: false,
  dataType: "",
  lastDataDate: "",
  designFileStatus: "",
  designImageUrl: "",
  cuttingType: "",
  sheetsPerSheet: "",
  labelGap: "",
  dieCutter: "",
  resinPlate: "",
  sortOrder: 0,
};

const defaultFormValues: OrderFormValues = {
  clientId: 0,
  orderDate: new Date().toISOString().split("T")[0],
  dueDate: "",
  orderer: "",
  status: "DRAFT",
  packagingType: "",
  deliveryType: "",
  courierType: "",
  deliveryAddress: "",
  receiverName: "",
  receiverPhone: "",
  note: "",
  worker: "",
  clientContact: "",
  clientPhone: "",
  deliveryMethod: "",
  deliveryRegion: "",
  photoInspection: false,
  sampleShipping: false,
  tightRoll: false,
  items: [{ ...emptyItem }],
};

export function OrderForm({
  defaultValues,
  onSubmit,
  submitLabel = "저장",
  loading = false,
}: OrderFormProps) {
  const [clients, setClients] = useState<ClientOption[]>([]);
  const [products, setProducts] = useState<ProductOption[]>([]);
  const [options, setOptions] = useState<AllOptions>({
    PRINT_TYPE: [],
    MATERIAL: [],
    SHAPE: [],
    LAMI: [],
    FOIL: [],
    CUTTING: [],
    ROLL_DIR: [],
    DATA_TYPE: [],
    DESIGN_STATUS: [],
    PACKAGING: [],
    DELIVERY: [],
    COURIER: [],
  });
  const [copyOpen, setCopyOpen] = useState(false);
  const [materialOptions, setMaterialOptions] = useState({
    paperType: [] as string[],
    backing: [] as string[],
    adhesive: [] as string[],
    thickness: [] as string[],
    manufacturer: [] as string[],
  });

  const {
    register,
    handleSubmit,
    control,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<OrderFormInput, unknown, OrderFormValues>({
    resolver: zodResolver(orderFormSchema),
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
            printType: (p.printType as string) || null,
            material: (p.material as string) || null,
            unitPrice: (p.unitPrice as string) || null,
          })),
        );
      })
      .catch(() => setProducts([]));
  }, []);

  // 시스템 옵션 로드
  const fetchOptions = useCallback(async () => {
    const categories = [
      "PRINT_TYPE",
      "MATERIAL",
      "SHAPE",
      "LAMI",
      "FOIL",
      "CUTTING",
      "ROLL_DIR",
      "DATA_TYPE",
      "DESIGN_STATUS",
      "PACKAGING",
      "DELIVERY",
      "COURIER",
    ] as const;

    const results = await Promise.all(
      categories.map((cat) =>
        fetch(`/api/options?category=${cat}`)
          .then((res) => res.json())
          .then((data) => ({ category: cat, data: data as SystemOption[] }))
          .catch(() => ({ category: cat, data: [] as SystemOption[] })),
      ),
    );

    const newOptions = { ...options };
    for (const result of results) {
      newOptions[result.category] = result.data;
    }
    setOptions(newOptions);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    fetchOptions();
  }, [fetchOptions]);

  // 원단 옵션 로드
  useEffect(() => {
    fetch("/api/materials/options")
      .then((res) => res.json())
      .then((json) => {
        setMaterialOptions({
          paperType: (json.paperType as string[]) || [],
          backing: (json.backing as string[]) || [],
          adhesive: (json.adhesive as string[]) || [],
          thickness: (json.thickness as string[]) || [],
          manufacturer: (json.manufacturer as string[]) || [],
        });
      })
      .catch(() =>
        setMaterialOptions({
          paperType: [],
          backing: [],
          adhesive: [],
          thickness: [],
          manufacturer: [],
        }),
      );
  }, []);

  // 기존 발주서 불러오기
  const handleCopySelect = async (orderId: number) => {
    try {
      const res = await fetch(`/api/orders/${orderId}`);
      if (!res.ok) {
        alert("발주서를 불러올 수 없습니다");
        return;
      }
      const data = await res.json();
      reset({
        clientId: data.clientId,
        orderDate: new Date().toISOString().split("T")[0],
        dueDate: "",
        orderer: data.orderer || "",
        status: "DRAFT",
        packagingType: data.packagingType || "",
        deliveryType: data.deliveryType || "",
        courierType: data.courierType || "",
        deliveryAddress: data.deliveryAddress || "",
        receiverName: data.receiverName || "",
        receiverPhone: data.receiverPhone || "",
        note: data.note || "",
        worker: data.worker || "",
        clientContact: data.clientContact || "",
        clientPhone: data.clientPhone || "",
        deliveryMethod: data.deliveryMethod || "",
        deliveryRegion: data.deliveryRegion || "",
        photoInspection: data.photoInspection || false,
        sampleShipping: data.sampleShipping || false,
        tightRoll: data.tightRoll || false,
        items:
          data.items && data.items.length > 0
            ? data.items.map((item: Record<string, unknown>, idx: number) => ({
                productId: item.productId ?? null,
                productName: (item.productName as string) || "",
                printType: (item.printType as string) || "",
                printPrice: (item.printPrice as string) || "",
                sheets: item.sheets ?? null,
                sheetsPerRoll: item.sheetsPerRoll ?? null,
                unitPrice: (item.unitPrice as string) || "",
                supplyAmount: (item.supplyAmount as string) || "",
                material: (item.material as string) || "",
                materialWidth: (item.materialWidth as string) || "",
                paperType: (item.paperType as string) || "",
                backing: (item.backing as string) || "",
                adhesive: (item.adhesive as string) || "",
                thickness: (item.thickness as string) || "",
                manufacturer: (item.manufacturer as string) || "",
                perforation: (item.perforation as boolean) || false,
                sizeWidth: (item.sizeWidth as string) || "",
                sizeHeight: (item.sizeHeight as string) || "",
                shape: (item.shape as string) || "",
                okkuri: (item.okkuri as string) || "",
                lamination: (item.lamination as string) || "",
                foil: (item.foil as string) || "",
                cuttingMethod: (item.cuttingMethod as string) || "",
                rollDirection: (item.rollDirection as string) || "",
                slit: (item.slit as boolean) || false,
                dataType: (item.dataType as string) || "",
                lastDataDate: (item.lastDataDate as string) || "",
                designFileStatus: (item.designFileStatus as string) || "",
                designImageUrl: (item.designImageUrl as string) || "",
                cuttingType: (item.cuttingType as string) || "",
                sheetsPerSheet: (item.sheetsPerSheet as string) || "",
                labelGap: (item.labelGap as string) || "",
                dieCutter: (item.dieCutter as string) || "",
                resinPlate: (item.resinPlate as string) || "",
                sortOrder: idx,
              }))
            : [{ ...emptyItem }],
      });
    } catch {
      alert("발주서를 불러오는 중 오류가 발생했습니다");
    }
  };

  const statusOptions = [
    { value: "DRAFT", label: "임시저장" },
    { value: "PROGRESS", label: "진행중" },
    { value: "COMPLETE", label: "완료" },
    { value: "HOLD", label: "보류" },
  ];

  return (
    <>
      <form
        onSubmit={handleSubmit(onSubmit, (formErrors) => {
          console.log("폼 검증 실패:", Object.keys(formErrors));
        })}
      >
        {/* 상단 수정 버튼 */}
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
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">기본 정보</h3>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setCopyOpen(true)}
                className="text-[0.85rem]"
              >
                <Copy className="mr-1 h-3 w-3" />
                기존 발주서 불러오기
              </Button>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {/* 거래처 */}
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

              {/* 상태 */}
              <div className="space-y-2">
                <Label className="text-[0.95rem]">상태</Label>
                <select
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-[0.95rem] shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  {...register("status")}
                >
                  {statusOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* 발주일 */}
              <div className="space-y-2">
                <Label className="text-[0.95rem] font-semibold">
                  발주일 <span className="text-destructive">*</span>
                </Label>
                <Input
                  type="date"
                  className="text-[0.95rem]"
                  {...register("orderDate")}
                />
                {errors.orderDate && (
                  <p className="text-destructive text-sm">
                    {errors.orderDate.message}
                  </p>
                )}
              </div>

              {/* 납기일 */}
              <div className="space-y-2">
                <Label className="text-[0.95rem]">납기일</Label>
                <Input
                  type="date"
                  className="text-[0.95rem]"
                  {...register("dueDate")}
                />
              </div>

              {/* 발주자 */}
              <div className="space-y-2">
                <Label className="text-[0.95rem]">발주자</Label>
                <Input
                  className="text-[0.95rem]"
                  placeholder="발주자명"
                  {...register("orderer")}
                />
              </div>


              {/* 거래처 담당자 */}
              <div className="space-y-2">
                <Label className="text-[0.95rem]">거래처 담당자</Label>
                <Input
                  className="text-[0.95rem]"
                  placeholder="담당자명"
                  {...register("clientContact")}
                />
              </div>

              {/* 거래처 연락처 */}
              <div className="space-y-2">
                <Label className="text-[0.95rem]">거래처 연락처</Label>
                <Input
                  className="text-[0.95rem]"
                  placeholder="010-0000-0000"
                  {...register("clientPhone")}
                />
              </div>





              {/* 체크박스: 사진검수/샘플발송/롤짱짱하게 — UI 숨김 (DB 컬럼 유지) */}
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
                <OrderItemRow
                  key={field.id}
                  index={index}
                  register={register}
                  setValue={setValue}
                  watch={watch}
                  errors={errors}
                  onRemove={() => remove(index)}
                  canRemove={fields.length > 1}
                  products={products}
                  options={options}
                  materialOptions={materialOptions}
                />
              ))}
            </div>
          </CardContent>
        </Card>

        {/* 포장/배송 */}
        <Card className="mt-6">
          <CardContent className="space-y-6 pt-6">
            <h3 className="text-lg font-semibold">포장/배송</h3>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              {/* 포장종류 */}
              <div className="space-y-2">
                <Label className="text-[0.95rem]">포장종류</Label>
                <Input
                  className="text-[0.95rem]"
                  placeholder="포장종류 입력"
                  {...register("packagingType")}
                />
              </div>

              {/* 배송종류 */}
              <div className="space-y-2">
                <Label className="text-[0.95rem]">배송종류</Label>
                <Input
                  className="text-[0.95rem]"
                  placeholder="배송종류 입력"
                  {...register("deliveryType")}
                />
              </div>

              {/* 택배종류 */}
              <div className="space-y-2">
                <Label className="text-[0.95rem]">택배종류</Label>
                <Input
                  className="text-[0.95rem]"
                  placeholder="택배종류 입력"
                  {...register("courierType")}
                />
              </div>
            </div>

            {/* 배송방법/배송지역 — UI 숨김 (DB 컬럼 유지) */}

            {/* 배송 주소 */}
            <div className="space-y-2">
              <Label className="text-[0.95rem]">배송주소</Label>
              <Input
                className="text-[0.95rem]"
                placeholder="배송지 주소"
                {...register("deliveryAddress")}
              />
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {/* 담당자 성함 */}
              <div className="space-y-2">
                <Label className="text-[0.95rem]">담당자 성함</Label>
                <Input
                  className="text-[0.95rem]"
                  placeholder="수령인"
                  {...register("receiverName")}
                />
              </div>

              {/* 담당자 연락처 */}
              <div className="space-y-2">
                <Label className="text-[0.95rem]">담당자 연락처</Label>
                <Input
                  className="text-[0.95rem]"
                  placeholder="010-0000-0000"
                  {...register("receiverPhone")}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 비고 */}
        <Card className="mt-6">
          <CardContent className="space-y-6 pt-6">
            <h3 className="text-lg font-semibold">비고</h3>
            <Textarea
              placeholder="추가 사항을 입력하세요"
              rows={4}
              className="text-[0.95rem]"
              {...register("note")}
            />
          </CardContent>
        </Card>

        <Separator className="my-6" />

        {/* 하단 수정 버튼 */}
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

      <OrderCopyDialog
        open={copyOpen}
        onOpenChange={setCopyOpen}
        onSelect={handleCopySelect}
      />
    </>
  );
}
