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
import { Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

const ESTIMATE_STAGE = "ESTIMATE_STAGE";

interface StageOption {
  id: number;
  label: string;
  value: string;
  sortOrder: number;
}

export function StageOptionsList() {
  const [list, setList] = useState<StageOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState({ label: "", value: "" });
  const [submitLoading, setSubmitLoading] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{
    open: boolean;
    loading: boolean;
  }>({ open: false, loading: false });
  const deleteIdRef = useRef<number>(0);

  const fetchList = useCallback(async () => {
    try {
      const res = await fetch(
        `/api/options?category=${encodeURIComponent(ESTIMATE_STAGE)}`
      );
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

  const openAdd = () => {
    setEditingId(null);
    setForm({ label: "", value: "" });
    setDialogOpen(true);
  };

  const openEdit = (row: StageOption) => {
    setEditingId(row.id);
    setForm({ label: row.label, value: row.value });
    setDialogOpen(true);
  };

  const handleSubmitDialog = async () => {
    const label = form.label.trim();
    const value = form.value.trim();
    if (!label || !value) {
      alert("단계명과 value를 입력하세요");
      return;
    }
    setSubmitLoading(true);
    try {
      if (editingId !== null) {
        const res = await fetch(`/api/options/${editingId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ label, value }),
        });
        if (res.ok) {
          setDialogOpen(false);
          loadList();
        } else {
          const err = await res.json();
          alert(err.message || "수정에 실패했습니다");
        }
      } else {
        const res = await fetch("/api/options", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            category: ESTIMATE_STAGE,
            label,
            value,
          }),
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

  const handleDeleteClick = (id: number) => {
    deleteIdRef.current = id;
    setDeleteConfirm({ open: true, loading: false });
  };

  const handleDeleteConfirm = async () => {
    const id = deleteIdRef.current;
    setDeleteConfirm((p) => ({ ...p, loading: true }));
    try {
      const res = await fetch(`/api/options/${id}`, { method: "DELETE" });
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

  if (loading && list.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <>
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">견적 진행단계</h3>
            <Button type="button" size="sm" onClick={openAdd}>
              <Plus className="mr-1 h-4 w-4" />
              단계 추가
            </Button>
          </div>
          {list.length === 0 ? (
            <p className="text-muted-foreground text-sm py-4">
              등록된 단계가 없습니다. 단계 추가 버튼으로 등록하세요.
            </p>
          ) : (
            <ul className="space-y-3">
              {list.map((row) => (
                <li
                  key={row.id}
                  className="flex items-center justify-between gap-4 rounded-lg border p-3"
                >
                  <div className="min-w-0 flex-1">
                    <span className="font-medium">{row.label}</span>
                    <span className="text-muted-foreground text-sm ml-2">
                      (value: {row.value})
                    </span>
                    {row.sortOrder !== undefined && (
                      <span className="text-muted-foreground text-xs ml-2">
                        순서: {row.sortOrder}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
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
              {editingId !== null ? "단계 수정" : "단계 추가"}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>단계명 (label)</Label>
              <Input
                value={form.label}
                onChange={(e) =>
                  setForm((f) => ({ ...f, label: e.target.value }))
                }
                placeholder="예: 1차제안"
              />
            </div>
            <div className="grid gap-2">
              <Label>value</Label>
              <Input
                value={form.value}
                onChange={(e) =>
                  setForm((f) => ({ ...f, value: e.target.value }))
                }
                placeholder="예: 1차제안"
              />
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
        title="단계 삭제"
        description="이 단계를 삭제하시겠습니까? (삭제 후에도 기존 견적 데이터에는 반영되지 않습니다)"
        confirmText="삭제"
        onConfirm={handleDeleteConfirm}
        loading={deleteConfirm.loading}
        variant="destructive"
      />
    </>
  );
}
