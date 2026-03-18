"use client";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import {
  Building2,
  ClipboardList,
  FileSpreadsheet,
  FileText,
  LayoutDashboard,
  Menu,
  Package,
  Settings,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const menuItems = [
  { label: "대시보드", href: "/dashboard", icon: LayoutDashboard },
  { label: "거래처 관리", href: "/clients", icon: Building2 },
  { label: "품목 관리", href: "/products", icon: Package },
  { label: "발주서 관리", href: "/orders", icon: ClipboardList },
  { label: "견적서 관리", href: "/quotes", icon: FileText },
  { label: "거래명세서 관리", href: "/invoices", icon: FileSpreadsheet },
  { label: "매출 관리", href: "/sales", icon: TrendingUp },
  { label: "시스템 설정", href: "/settings", icon: Settings },
];

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <>
      {/* 로고 영역 */}
      <div className="flex h-16 items-center border-b px-5">
        <Link
          href="/dashboard"
          className="flex items-center gap-2"
          onClick={onNavigate}
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary">
            <span className="text-sm font-bold text-primary-foreground">
              신우
            </span>
          </div>
          <span className="text-lg font-bold text-sidebar-foreground">
            영업관리
          </span>
        </Link>
      </div>

      {/* 메뉴 */}
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {menuItems.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(item.href + "/");
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2.5 text-[0.95rem] font-medium transition-colors",
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground font-semibold"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground",
              )}
            >
              <Icon className="h-5 w-5 shrink-0" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* 하단 정보 */}
      <div className="border-t px-5 py-3">
        <p className="text-xs text-muted-foreground">신우씨링 인쇄</p>
        <p className="text-xs text-muted-foreground">영업관리 시스템 v1.0</p>
      </div>
    </>
  );
}

/** 데스크톱 사이드바: lg 이상에서만 표시 */
export function Sidebar() {
  return (
    <aside className="hidden h-screen w-60 shrink-0 flex-col border-r bg-sidebar-background lg:flex">
      <SidebarContent />
    </aside>
  );
}

/** 모바일 사이드바: lg 미만에서 햄버거 메뉴로 표시 */
export function MobileSidebar() {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="lg:hidden">
          <Menu className="h-5 w-5" />
          <span className="sr-only">메뉴 열기</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-60 p-0">
        <SheetTitle className="sr-only">메뉴</SheetTitle>
        <div className="flex h-full flex-col bg-sidebar-background">
          <SidebarContent onNavigate={() => setOpen(false)} />
        </div>
      </SheetContent>
    </Sheet>
  );
}
