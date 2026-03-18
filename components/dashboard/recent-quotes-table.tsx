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

interface RecentQuote {
  id: number;
  estimateNumber: string;
  clientName: string;
  estimateDate: string;
  stage: string;
}

const stageMap: Record<
  string,
  { label: string; className: string }
> = {
  "1차제안": {
    label: "1차제안",
    className: "bg-blue-50 text-blue-700 border-blue-200",
  },
  "2차제안": {
    label: "2차제안",
    className: "bg-gray-100 text-gray-700 border-gray-200",
  },
  LOST: {
    label: "LOST",
    className: "bg-red-50 text-red-700 border-red-200",
  },
  계약체결: {
    label: "계약체결",
    className: "bg-green-50 text-green-700 border-green-200",
  },
};

export function RecentQuotesTable({ data }: { data: RecentQuote[] }) {
  const router = useRouter();

  return (
    <div className="space-y-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="text-base font-semibold">견적번호</TableHead>
            <TableHead className="text-base font-semibold">거래처명</TableHead>
            <TableHead className="text-base font-semibold">견적일</TableHead>
            <TableHead className="text-base font-semibold">진행단계</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={4}
                className="text-muted-foreground h-24 text-center text-base"
              >
                등록된 견적서가 없습니다
              </TableCell>
            </TableRow>
          ) : (
            data.map((quote) => {
              const config = stageMap[quote.stage] || {
                label: quote.stage,
                className: "bg-gray-100 text-gray-700",
              };
              return (
                <TableRow
                  key={quote.id}
                  className="cursor-pointer text-base"
                  onClick={() => router.push(`/quotes/${quote.id}`)}
                >
                  <TableCell className="font-medium">
                    {quote.estimateNumber}
                  </TableCell>
                  <TableCell>{quote.clientName}</TableCell>
                  <TableCell>{quote.estimateDate}</TableCell>
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
          onClick={() => router.push("/quotes")}
        >
          전체 보기
        </Button>
      </div>
    </div>
  );
}
