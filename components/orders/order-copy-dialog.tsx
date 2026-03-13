"use client";

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
import { useCallback, useEffect, useState } from "react";

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
            id: c.id,
            companyName: c.companyName,
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
        .map((o: Record<string, unknown>) => ({
          id: o.id,
          orderNumber: o.orderNumber,
          orderDate: o.orderDate,
          status: o.status,
          clientName: (o.client as Record<string, unknown>)?.companyName || "",
          itemCount: o.itemCount || 0,
        }));
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

  const handleSelect = (orderId: number) => {
    onSelect(orderId);
    onOpenChange(false);
    setSelectedClientId(null);
    setSearchText("");
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
              <select
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-[0.9rem] shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                value={selectedClientId ?? ""}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setSelectedClientId(val || null);
                }}
              >
                <option value="">거래처를 선택하세요</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.companyName}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* 검색 */}
          {selectedClientId && (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="발주번호로 검색"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                className="pl-9 text-[0.9rem]"
              />
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
              ) : orders.length === 0 ? (
                <div className="p-6 text-center text-sm text-muted-foreground">
                  해당 거래처의 발주서가 없습니다
                </div>
              ) : (
                <div className="divide-y">
                  {orders.map((order) => (
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
