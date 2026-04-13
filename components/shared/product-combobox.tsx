"use client";

import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { Check, ChevronsUpDown } from "lucide-react";
import { useState } from "react";

interface ProductOption {
  id: number;
  productName: string;
  [key: string]: unknown;
}

interface ProductComboboxProps {
  value: number | null | undefined;
  onChange: (product: ProductOption | null) => void;
  products: ProductOption[];
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export function ProductCombobox({
  value,
  onChange,
  products,
  placeholder = "품목 검색",
  disabled = false,
  className,
}: ProductComboboxProps) {
  const [open, setOpen] = useState(false);

  const selectedProduct = products.find((p) => p.id === value) ?? null;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          disabled={disabled}
          className={cn(
            "h-9 w-full justify-between border-input bg-transparent px-3 text-[0.9rem] font-normal",
            className,
          )}
        >
          <span
            className={cn(
              "truncate text-left",
              !selectedProduct && "text-muted-foreground",
            )}
          >
            {selectedProduct?.productName || placeholder}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-60" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[--radix-popover-trigger-width] p-0"
        align="start"
      >
        <Command>
          <CommandInput placeholder="품목명 입력..." />
          <CommandList>
            <CommandEmpty>검색 결과가 없습니다</CommandEmpty>
            <CommandGroup>
              {/* 직접 입력 옵션 */}
              <CommandItem
                value="__direct_input__"
                onSelect={() => {
                  onChange(null);
                  setOpen(false);
                }}
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    !value ? "opacity-100" : "opacity-0",
                  )}
                />
                직접 입력
              </CommandItem>
              {products.map((product) => (
                <CommandItem
                  key={product.id}
                  value={product.productName}
                  onSelect={() => {
                    onChange(product);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === product.id ? "opacity-100" : "opacity-0",
                    )}
                  />
                  {product.productName}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
