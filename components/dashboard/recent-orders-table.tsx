"use client";

import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useRouter } from "next/navigation";

interface RecentOrder {
  id: number;
  orderNumber: string;
  clientName: string;
  orderDate: string;
  status: string;
}

const statusMap: Record<
  string,
  { label: string; className: string }
> = {
  DRAFT: {
    label: "임시저장",
    className: "bg-gray-100 text-gray-700 border-gray-200",
  },
  PROGRESS: {
    label: "진행중",
    className: "bg-blue-50 text-blue-700 border-blue-200",
  },
  COMPLETE: {
    label: "완료",
    className: "bg-green-50 text-green-700 border-green-200",
  },
  HOLD: {
    label: "보류",
    className: "bg-yellow-50 text-yellow-700 border-yellow-200",
  },
};

export function RecentOrdersTable({ data }: { data: RecentOrder[] }) {
  const router = useRouter();

  return (
    <div className="space-y-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="text-base font-semibold">발주번호</TableHead>
            <TableHead className="text-base font-semibold">거래처명</TableHead>
            <TableHead className="text-base font-semibold">발주일</TableHead>
            <TableHead className="text-base font-semibold">상태</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={4}
                className="text-muted-foreground h-24 text-center text-base"
              >
                등록된 발주서가 없습니다
              </TableCell>
            </TableRow>
          ) : (
            data.map((order) => {
              const config = statusMap[order.status] || {
                label: order.status,
                className: "bg-gray-100 text-gray-700",
              };
              return (
                <TableRow
                  key={order.id}
                  className="cursor-pointer text-base"
                  onClick={() => router.push(`/orders/${order.id}`)}
                >
                  <TableCell className="font-medium">
                    {order.orderNumber}
                  </TableCell>
                  <TableCell>{order.clientName}</TableCell>
                  <TableCell>{order.orderDate}</TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={`text-sm px-2.5 py-0.5 ${config.className}`}
                    >
                      {config.label}
                    </Badge>
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
      <div className="flex justify-end">
        <Button
          variant="outline"
          size="sm"
          className="text-sm"
          onClick={() => router.push("/orders")}
        >
          전체 보기
        </Button>
      </div>
    </div>
  );
}
