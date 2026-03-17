"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import type { BankAccountFormValues } from "@/lib/validators/bank-account";
import { Loader2, Pencil, Plus, Star, Trash2 } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

interface BankAccountRow {
  id: number;
  bankName: string;
  accountNumber: string;
  accountHolder: string;
  memo: string | null;
  isDefault: boolean;
  sortOrder: number;
}

export function BankAccountList() {
  const [list, setList] = useState<BankAccountRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{
    open: boolean;
    loading: boolean;
  }>({ open: false, loading: false });
  const deleteIdRef = useRef<number>(0);
  const [form, setForm] = useState<BankAccountFormValues>({
    bankName: "",
    accountNumber: "",
    accountHolder: "",
    memo: "",
    isDefault: false,
    sortOrder: 0,
  });
  const [submitLoading, setSubmitLoading] = useState(false);

  const fetchList = useCallback(async () => {
    try {
      const res = await fetch("/api/bank-accounts");
      if (res.ok) {
        const data = await res.json();
        setList(Array.isArray(data) ? data : []);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  const loadList = useCallback(() => {
    setLoading(true);
    fetchList();
  }, [fetchList]);

  useEffect(() => {
    loadList();
  }, [loadList]);

  if (loading && list.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const openAdd = () => {
    setEditingId(null);
    setForm({
      bankName: "",
      accountNumber: "",
      accountHolder: "",
      memo: "",
      isDefault: false,
      sortOrder: list.length,
    });
    setDialogOpen(true);
  };

  const openEdit = (row: BankAccountRow) => {
    setEditingId(row.id);
    setForm({
      bankName: row.bankName,
      accountNumber: row.accountNumber,
      accountHolder: row.accountHolder,
      memo: row.memo ?? "",
      isDefault: row.isDefault,
      sortOrder: row.sortOrder,
    });
    setDialogOpen(true);
  };

  const handleSubmitDialog = async () => {
    if (!form.bankName?.trim() || !form.accountNumber?.trim() || !form.accountHolder?.trim()) {
      alert("은행명, 계좌번호, 예금주는 필수입니다");
      return;
    }
    setSubmitLoading(true);
    try {
      if (editingId !== null) {
        const res = await fetch(`/api/bank-accounts/${editingId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
        if (res.ok) {
          setDialogOpen(false);
          loadList();
        } else {
          const err = await res.json();
          alert(err.message || "수정에 실패했습니다");
        }
      } else {
        const res = await fetch("/api/bank-accounts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
        if (res.ok) {
          setDialogOpen(false);
          loadList();
        } else {
          const err = await res.json();
          alert(err.message || "등록에 실패했습니다");
        }
      }
    } catch {
      alert("서버 오류가 발생했습니다");
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleToggleDefault = async (id: number, current: boolean) => {
    try {
      const res = await fetch(`/api/bank-accounts/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isDefault: !current }),
      });
      if (res.ok) loadList();
      else {
        const err = await res.json();
        alert(err.message || "변경에 실패했습니다");
      }
    } catch {
      alert("서버 오류가 발생했습니다");
    }
  };

  const handleDeleteClick = (id: number) => {
    deleteIdRef.current = id;
    setDeleteConfirm({ open: true, loading: false });
  };

  const handleDeleteConfirm = async () => {
    const id = deleteIdRef.current;
    setDeleteConfirm((p) => ({ ...p, loading: true }));
    try {
      const res = await fetch(`/api/bank-accounts/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setDeleteConfirm({ open: false, loading: false });
        loadList();
      } else {
        const err = await res.json();
        alert(err.message || "삭제에 실패했습니다");
        setDeleteConfirm((p) => ({ ...p, loading: false }));
      }
    } catch {
      alert("서버 오류가 발생했습니다");
      setDeleteConfirm((p) => ({ ...p, loading: false }));
    }
  };

  return (
    <>
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">계좌 목록</h3>
            <Button type="button" size="sm" onClick={openAdd}>
              <Plus className="mr-1 h-4 w-4" />
              계좌 추가
            </Button>
          </div>
          {list.length === 0 ? (
            <p className="text-muted-foreground text-sm py-4">
              등록된 계좌가 없습니다. 계좌 추가 버튼으로 등록하세요.
            </p>
          ) : (
            <ul className="space-y-3">
              {list.map((row) => (
                <li
                  key={row.id}
                  className="flex items-center justify-between gap-4 rounded-lg border p-3"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{row.bankName}</span>
                      {row.isDefault && (
                        <span className="rounded bg-primary/10 px-1.5 py-0.5 text-xs font-medium text-primary">
                          기본
                        </span>
                      )}
                    </div>
                    <p className="text-muted-foreground text-sm">
                      {row.accountNumber} · {row.accountHolder}
                      {row.memo ? ` · ${row.memo}` : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      title={row.isDefault ? "기본계좌 해제" : "기본계좌로 설정"}
                      onClick={() => handleToggleDefault(row.id, row.isDefault)}
                    >
                      <Star
                        className={`h-4 w-4 ${row.isDefault ? "fill-primary text-primary" : ""}`}
                      />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => openEdit(row)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteClick(row.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              {editingId !== null ? "계좌 수정" : "계좌 추가"}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>은행명</Label>
              <Input
                value={form.bankName}
                onChange={(e) =>
                  setForm((f) => ({ ...f, bankName: e.target.value }))
                }
                placeholder="은행명"
              />
            </div>
            <div className="grid gap-2">
              <Label>계좌번호</Label>
              <Input
                value={form.accountNumber}
                onChange={(e) =>
                  setForm((f) => ({ ...f, accountNumber: e.target.value }))
                }
                placeholder="계좌번호"
              />
            </div>
            <div className="grid gap-2">
              <Label>예금주</Label>
              <Input
                value={form.accountHolder}
                onChange={(e) =>
                  setForm((f) => ({ ...f, accountHolder: e.target.value }))
                }
                placeholder="예금주"
              />
            </div>
            <div className="grid gap-2">
              <Label>메모</Label>
              <Input
                value={form.memo ?? ""}
                onChange={(e) =>
                  setForm((f) => ({ ...f, memo: e.target.value }))
                }
                placeholder="메모 (선택)"
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isDefault"
                checked={form.isDefault ?? false}
                onChange={(e) =>
                  setForm((f) => ({ ...f, isDefault: e.target.checked }))
                }
              />
              <Label htmlFor="isDefault">기본계좌로 설정</Label>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              disabled={submitLoading}
            >
              취소
            </Button>
            <Button onClick={handleSubmitDialog} disabled={submitLoading}>
              {submitLoading ? (
                <Loader2 className="mr-1 h-4 w-4 animate-spin" />
              ) : null}
              {editingId !== null ? "수정" : "등록"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={deleteConfirm.open}
        onOpenChange={(open) =>
          setDeleteConfirm((p) => ({ ...p, open }))
        }
        title="계좌 삭제"
        description="이 계좌를 삭제하시겠습니까?"
        confirmText="삭제"
        onConfirm={handleDeleteConfirm}
        loading={deleteConfirm.loading}
        variant="destructive"
      />
    </>
  );
}
