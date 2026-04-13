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
import { useMemo, useState } from "react";

interface ClientOption {
  id: number;
  companyName: string;
}

interface ClientComboboxProps {
  value: number | null;
  onChange: (clientId: number, companyName: string) => void;
  clients: ClientOption[];
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export function ClientCombobox({
  value,
  onChange,
  clients,
  placeholder = "거래처 검색",
  disabled = false,
  className,
}: ClientComboboxProps) {
  const [open, setOpen] = useState(false);

  const selectedClient = useMemo(
    () => clients.find((c) => c.id === value),
    [clients, value],
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          disabled={disabled}
          className={cn(
            "h-9 w-full justify-between border-input bg-transparent px-3 text-[0.95rem] font-normal",
            className,
          )}
        >
          <span
            className={cn(
              "truncate text-left",
              !selectedClient && "text-muted-foreground",
            )}
          >
            {selectedClient?.companyName || placeholder}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-60" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[--radix-popover-trigger-width] p-0"
        align="start"
      >
        <Command>
          <CommandInput placeholder="거래처명 입력..." />
          <CommandList>
            <CommandEmpty>검색 결과가 없습니다</CommandEmpty>
            <CommandGroup>
              {clients.map((client) => (
                <CommandItem
                  key={client.id}
                  value={client.companyName}
                  onSelect={() => {
                    onChange(client.id, client.companyName);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === client.id ? "opacity-100" : "opacity-0",
                    )}
                  />
                  {client.companyName}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
