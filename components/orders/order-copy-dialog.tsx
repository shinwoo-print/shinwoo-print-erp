"use client";

import { ClientCombobox } from "@/components/shared/client-combobox";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Copy, Loader2, Search } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

interface ClientOption {
  id: number;
  companyName: string;
}

interface PastOrder {
  id: number;
  orderNumber: string;
  orderDate: string;
  status: string;
  clientName: string;
  itemCount: number;
  itemNames: string[];
}

interface OrderCopyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (orderId: number) => void;
}

export function OrderCopyDialog({
  open,
  onOpenChange,
  onSelect,
}: OrderCopyDialogProps) {
  const [clients, setClients] = useState<ClientOption[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<number | null>(null);
  const [orders, setOrders] = useState<PastOrder[]>([]);
  const [searchText, setSearchText] = useState("");
  const [productSearchText, setProductSearchText] = useState("");
  const [loadingClients, setLoadingClients] = useState(false);
  const [loadingOrders, setLoadingOrders] = useState(false);

  // 거래처 목록 로드
  useEffect(() => {
    if (!open) return;
    setLoadingClients(true);
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
      .catch(() => setClients([]))
      .finally(() => setLoadingClients(false));
  }, [open]);

  // 거래처 선택 시 해당 발주 목록 로드
  const fetchOrders = useCallback(async () => {
    if (!selectedClientId) {
      setOrders([]);
      return;
    }
    setLoadingOrders(true);
    try {
      const params = new URLSearchParams({
        pageSize: "50",
        search: searchText,
      });
      const res = await fetch(`/api/orders?${params}`);
      const json = await res.json();
      const filtered = (json.data || [])
        .filter(
          (o: Record<string, unknown>) =>
            (o.client as Record<string, unknown>)?.id === selectedClientId,
        )
        .map((o: Record<string, unknown>) => {
          const items = (o.items as Record<string, unknown>[]) || [];
          return {
            id: o.id as number,
            orderNumber: o.orderNumber as string,
            orderDate: o.orderDate as string,
            status: o.status as string,
            clientName:
              ((o.client as Record<string, unknown>)?.companyName as string) ||
              "",
            itemCount: (o.itemCount as number) || items.length || 0,
            itemNames: items
              .map((item) => (item.productName as string) || "")
              .filter(Boolean),
          };
        });
      setOrders(filtered);
    } catch {
      setOrders([]);
    } finally {
      setLoadingOrders(false);
    }
  }, [selectedClientId, searchText]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // 품목명 클라이언트 사이드 필터링
  const filteredOrders = useMemo(() => {
    if (!productSearchText.trim()) return orders;
    const keyword = productSearchText.trim().toLowerCase();
    return orders.filter((order) =>
      order.itemNames.some((name) => name.toLowerCase().includes(keyword)),
    );
  }, [orders, productSearchText]);

  const handleSelect = (orderId: number) => {
    onSelect(orderId);
    onOpenChange(false);
    setSelectedClientId(null);
    setSearchText("");
    setProductSearchText("");
    setOrders([]);
  };

  const statusLabel: Record<string, string> = {
    DRAFT: "임시저장",
    PROGRESS: "진행중",
    COMPLETE: "완료",
    HOLD: "보류",
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="text-lg">기존 발주서 불러오기</DialogTitle>
          <DialogDescription className="text-[0.9rem]">
            거래처를 선택한 후 과거 발주서를 선택하면 폼에 자동으로 채워집니다
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* 거래처 선택 */}
          <div className="space-y-1">
            <Label className="text-[0.85rem]">거래처 선택</Label>
            {loadingClients ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                불러오는 중
              </div>
            ) : (
              <ClientCombobox
                value={selectedClientId}
                onChange={(clientId) => setSelectedClientId(clientId)}
                clients={clients}
                placeholder="거래처를 검색하세요"
              />
            )}
          </div>

          {/* 검색 필터 */}
          {selectedClientId && (
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="발주번호로 검색"
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  className="pl-9 text-[0.9rem]"
                />
              </div>
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="품목명으로 검색"
                  value={productSearchText}
                  onChange={(e) => setProductSearchText(e.target.value)}
                  className="pl-9 text-[0.9rem]"
                />
              </div>
            </div>
          )}

          {/* 발주 목록 */}
          {selectedClientId && (
            <div className="max-h-[300px] overflow-y-auto rounded-md border">
              {loadingOrders ? (
                <div className="flex items-center justify-center p-6 text-sm text-muted-foreground">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  불러오는 중
                </div>
              ) : filteredOrders.length === 0 ? (
                <div className="p-6 text-center text-sm text-muted-foreground">
                  {orders.length > 0 && productSearchText
                    ? "해당 품목명이 포함된 발주서가 없습니다"
                    : "해당 거래처의 발주서가 없습니다"}
                </div>
              ) : (
                <div className="divide-y">
                  {filteredOrders.map((order) => (
                    <button
                      key={order.id}
                      type="button"
                      onClick={() => handleSelect(order.id)}
                      className="flex w-full items-center justify-between px-4 py-3 text-left transition-colors hover:bg-muted/50"
                    >
                      <div>
                        <p className="text-[0.9rem] font-medium">
                          {order.orderNumber}
                        </p>
                        <p className="text-[0.8rem] text-muted-foreground">
                          {order.orderDate} · 품목 {order.itemCount}건
                        </p>
                        {order.itemNames.length > 0 && (
                          <p className="mt-0.5 text-[0.75rem] text-muted-foreground truncate max-w-[400px]">
                            {order.itemNames.slice(0, 3).join(", ")}
                            {order.itemNames.length > 3 && ` 외 ${order.itemNames.length - 3}건`}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[0.8rem] text-muted-foreground">
                          {statusLabel[order.status] || order.status}
                        </span>
                        <Copy className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="text-[0.95rem]"
          >
            닫기
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
