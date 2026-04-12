// src/components/shared/data-table.tsx
"use client";

import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArrowUpDown, ChevronDown, ChevronLeft, ChevronRight, ChevronUp } from "lucide-react";
import { useMemo, useState } from "react";

export interface Column<T> {
  key: string;
  header: string;
  className?: string;
  render?: (row: T) => React.ReactNode;
  sortable?: boolean;
  sortType?: "text" | "number" | "date";
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  totalCount: number;
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onRowClick?: (row: T) => void;
  emptyMessage?: string;
}

function getSortValue(row: Record<string, unknown>, key: string): unknown {
  // nested key support (e.g. "client.companyName")
  if (key.includes(".")) {
    const parts = key.split(".");
    let val: unknown = row;
    for (const part of parts) {
      if (val && typeof val === "object") {
        val = (val as Record<string, unknown>)[part];
      } else {
        return null;
      }
    }
    return val;
  }
  return row[key];
}

function compareValues(a: unknown, b: unknown, sortType: "text" | "number" | "date"): number {
  if (a === null || a === undefined) return 1;
  if (b === null || b === undefined) return -1;

  if (sortType === "number") {
    const numA = typeof a === "string" ? parseFloat(a.replace(/,/g, "")) : Number(a);
    const numB = typeof b === "string" ? parseFloat(b.replace(/,/g, "")) : Number(b);
    if (isNaN(numA)) return 1;
    if (isNaN(numB)) return -1;
    return numA - numB;
  }

  if (sortType === "date") {
    const dateA = new Date(String(a)).getTime();
    const dateB = new Date(String(b)).getTime();
    if (isNaN(dateA)) return 1;
    if (isNaN(dateB)) return -1;
    return dateA - dateB;
  }

  // text: 가나다순 (localeCompare)
  return String(a).localeCompare(String(b), "ko-KR");
}

export function DataTable<T extends Record<string, unknown>>({
  columns,
  data,
  totalCount,
  page,
  pageSize,
  onPageChange,
  onRowClick,
  emptyMessage = "데이터가 없습니다.",
}: DataTableProps<T>) {
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const startIndex = (page - 1) * pageSize + 1;
  const endIndex = Math.min(page * pageSize, totalCount);

  const handleSort = (col: Column<T>) => {
    if (col.sortable === false) return;
    if (sortKey === col.key) {
      setSortDir((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(col.key);
      setSortDir("asc");
    }
  };

  // Determine sort type automatically if not specified
  const getEffectiveSortType = (col: Column<T>): "text" | "number" | "date" => {
    if (col.sortType) return col.sortType;
    const key = col.key.toLowerCase();
    if (key.includes("date") || key.includes("Date")) return "date";
    if (
      key.includes("amount") ||
      key.includes("price") ||
      key.includes("quantity") ||
      key.includes("count") ||
      key.includes("vat") ||
      key.includes("sheets")
    )
      return "number";
    return "text";
  };

  const sortedData = useMemo(() => {
    if (!sortKey) return data;
    const col = columns.find((c) => c.key === sortKey);
    if (!col || col.sortable === false) return data;

    const sortType = getEffectiveSortType(col);

    return [...data].sort((a, b) => {
      const valA = getSortValue(a, sortKey);
      const valB = getSortValue(b, sortKey);
      const cmp = compareValues(valA, valB, sortType);
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [data, sortKey, sortDir, columns]);

  const renderSortIcon = (col: Column<T>) => {
    if (col.sortable === false || col.key === "actions") return null;
    if (sortKey !== col.key) {
      return <ArrowUpDown className="ml-1 inline h-3.5 w-3.5 opacity-40" />;
    }
    return sortDir === "asc" ? (
      <ChevronUp className="ml-1 inline h-3.5 w-3.5" />
    ) : (
      <ChevronDown className="ml-1 inline h-3.5 w-3.5" />
    );
  };

  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((col) => {
                const isSortable = col.sortable !== false && col.key !== "actions";
                return (
                  <TableHead
                    key={col.key}
                    className={`text-[0.9rem] font-semibold ${isSortable ? "cursor-pointer select-none hover:bg-muted/50" : ""} ${col.className || ""}`}
                    onClick={isSortable ? () => handleSort(col) : undefined}
                  >
                    {col.header}
                    {isSortable && renderSortIcon(col)}
                  </TableHead>
                );
              })}
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedData.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="text-muted-foreground h-32 text-center text-[0.95rem]"
                >
                  {emptyMessage}
                </TableCell>
              </TableRow>
            ) : (
              sortedData.map((row, idx) => (
                <TableRow
                  key={(row.id as number) ?? idx}
                  onClick={() => onRowClick?.(row)}
                  className={
                    onRowClick
                      ? "cursor-pointer transition-colors hover:bg-muted/50"
                      : ""
                  }
                >
                  {columns.map((col) => (
                    <TableCell
                      key={col.key}
                      className={`text-[0.95rem] ${col.className || ""}`}
                    >
                      {col.render
                        ? col.render(row)
                        : ((row[col.key] as React.ReactNode) ?? "-")}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* 페이지네이션 */}
      {totalCount > 0 && (
        <div className="flex items-center justify-between px-2">
          <p className="text-muted-foreground text-sm">
            총 {totalCount}건 중 {startIndex}-{endIndex}건
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(page - 1)}
              disabled={page <= 1}
            >
              <ChevronLeft className="h-4 w-4" />
              이전
            </Button>
            <span className="text-sm font-medium">
              {page} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(page + 1)}
              disabled={page >= totalPages}
            >
              다음
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
