"use client";

import { OrderForm } from "@/components/orders/order-form";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { ExcelDownloadButton } from "@/components/shared/excel-download-button";
import { PageHeader } from "@/components/shared/page-header";
import { PdfDownloadButton } from "@/components/shared/pdf-download-button";
import { Button } from "@/components/ui/button";
import type { OrderFormValues } from "@/lib/validators/order";
import { Copy, Loader2, Trash2 } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

interface OrderData {
  id: number;
  orderNumber: string;
  clientId: number;
  orderDate: string;
  dueDate: string;
  orderer: string | null;
  status: string;
  packagingType: string | null;
  deliveryType: string | null;
  courierType: string | null;
  deliveryAddress: string | null;
  receiverName: string | null;
  receiverPhone: string | null;
  note: string | null;
  worker: string | null;
  clientContact: string | null;
  clientPhone: string | null;
  deliveryMethod: string | null;
  deliveryRegion: string | null;
  photoInspection: boolean;
  sampleShipping: boolean;
  tightRoll: boolean;
  client: {
    id: number;
    companyName: string;
    contactName: string | null;
    phone: string | null;
  };
  items: Array<{
    id: number;
    productId: number | null;
    productName: string;
    printType: string;
    printPrice: string;
    sheets: number | null;
    sheetsPerRoll: number | null;
    unitPrice: string;
    supplyAmount: string;
    material: string;
    materialWidth: string;
    perforation: boolean;
    sizeWidth: string;
    sizeHeight: string;
    shape: string;
    okkuri: string;
    lamination: string;
    foil: string;
    cuttingMethod: string;
    rollDirection: string;
    slit: boolean;
    dataType: string;
    lastDataDate: string;
    designFileStatus: string;
    designImageUrl: string | null;
    cuttingType: string | null;
    sheetsPerSheet: string | null;
    labelGap: string | null;
    dieCutter: string | null;
    resinPlate: string | null;
    sortOrder: number;
    paperType: string | null;
    backing: string | null;
    adhesive: string | null;
    thickness: string | null;
    manufacturer: string | null;
  }>;
}

export default function OrderDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [order, setOrder] = useState<OrderData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [copyLoading, setCopyLoading] = useState(false);

  const fetchOrder = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/orders/${id}`);
      if (res.ok) {
        const data = await res.json();
        setOrder(data);
      } else {
        alert("발주서를 찾을 수 없습니다");
        router.push("/orders");
      }
    } catch {
      alert("서버 오류가 발생했습니다");
      router.push("/orders");
    } finally {
      setLoading(false);
    }
  }, [id, router]);

  useEffect(() => {
    fetchOrder();
  }, [fetchOrder]);

  const handleSubmit = async (data: OrderFormValues) => {
    setSaving(true);
    try {
      const res = await fetch(`/api/orders/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (res.ok) {
        alert("수정되었습니다");
        await fetchOrder();
      } else {
        const error = await res.json();
        alert(error.message || "수정에 실패했습니다");
      }
    } catch {
      alert("서버 오류가 발생했습니다");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleteLoading(true);
    try {
      const res = await fetch(`/api/orders/${id}`, { method: "DELETE" });
      if (res.ok) {
        router.push("/orders");
      } else {
        alert("삭제에 실패했습니다");
      }
    } catch {
      alert("서버 오류가 발생했습니다");
    } finally {
      setDeleteLoading(false);
      setDeleteOpen(false);
    }
  };

  const handleCopy = async () => {
    setCopyLoading(true);
    try {
      const res = await fetch(`/api/orders/${id}/copy`, {
        method: "POST",
      });
      if (res.ok) {
        const newOrder = await res.json();
        router.push(`/orders/${newOrder.id}`);
      } else {
        alert("복사에 실패했습니다");
      }
    } catch {
      alert("서버 오류가 발생했습니다");
    } finally {
      setCopyLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="text-muted-foreground h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!order) return null;

  const defaultValues: OrderFormValues = {
    clientId: order.clientId,
    orderDate: order.orderDate,
    dueDate: order.dueDate || "",
    orderer: order.orderer || "",
    status: order.status,
    packagingType: order.packagingType || "",
    deliveryType: order.deliveryType || "",
    courierType: order.courierType || "",
    deliveryAddress: order.deliveryAddress || "",
    receiverName: order.receiverName || "",
    receiverPhone: order.receiverPhone || "",
    note: order.note || "",
    worker: order.worker || "",
    clientContact: order.clientContact || "",
    clientPhone: order.clientPhone || "",
    deliveryMethod: order.deliveryMethod || "",
    deliveryRegion: order.deliveryRegion || "",
    photoInspection: order.photoInspection || false,
    sampleShipping: order.sampleShipping || false,
    tightRoll: order.tightRoll || false,
    items: order.items.map((item, idx) => ({
      productId: item.productId,
      productName: item.productName || "",
      printType: item.printType || "",
      printPrice: item.printPrice || "",
      sheets: item.sheets,
      sheetsPerRoll: item.sheetsPerRoll,
      unitPrice: item.unitPrice || "",
      supplyAmount: item.supplyAmount || "",
      material: item.material || "",
      materialWidth: item.materialWidth || "",
      perforation: item.perforation || false,
      sizeWidth: item.sizeWidth || "",
      sizeHeight: item.sizeHeight || "",
      shape: item.shape || "",
      okkuri: item.okkuri || "",
      lamination: item.lamination || "",
      foil: item.foil || "",
      cuttingMethod: item.cuttingMethod || "",
      rollDirection: item.rollDirection || "",
      slit: item.slit || false,
      dataType: item.dataType || "",
      lastDataDate: item.lastDataDate || "",
      designFileStatus: item.designFileStatus || "",
      designImageUrl: item.designImageUrl || "",
      cuttingType: item.cuttingType || "",
      sheetsPerSheet: item.sheetsPerSheet || "",
      labelGap: item.labelGap || "",
      dieCutter: item.dieCutter || "",
      resinPlate: item.resinPlate || "",
      sortOrder: idx,
      paperType: item.paperType || "",
      backing: item.backing || "",
      adhesive: item.adhesive || "",
      thickness: item.thickness || "",
      manufacturer: item.manufacturer || "",
    })),
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={order.orderNumber}
        description={`${order.client.companyName} · 발주서 상세`}
        backHref="/orders"
        actions={
          <div className="flex items-center gap-2">
            <PdfDownloadButton url={`/api/orders/${id}/pdf`} />
            <ExcelDownloadButton
              url={`/api/orders/${id}/excel`}
              fileName={`발주서_${order.orderNumber}_${order.client.companyName}`}
            />
            <Button
              variant="outline"
              onClick={handleCopy}
              disabled={copyLoading}
              className="text-[0.95rem]"
            >
              {copyLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Copy className="mr-2 h-4 w-4" />
              )}
              복사
            </Button>
            <Button
              variant="destructive"
              onClick={() => setDeleteOpen(true)}
              className="text-[0.95rem]"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              삭제
            </Button>
          </div>
        }
      />

      <OrderForm
        defaultValues={defaultValues}
        onSubmit={handleSubmit}
        submitLabel="수정"
        loading={saving}
      />

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="발주서 삭제"
        description={`"${order.orderNumber}" 발주서를 삭제하시겠습니까? 포함된 모든 품목도 함께 삭제됩니다`}
        confirmText="삭제"
        onConfirm={handleDelete}
        loading={deleteLoading}
      />
    </div>
  );
}
