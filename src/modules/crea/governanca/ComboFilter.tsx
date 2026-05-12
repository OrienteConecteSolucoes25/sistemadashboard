import { useState } from "react";
import { Check, ChevronsUpDown, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface Props {
  label: string;
  value?: string;
  options: string[];
  placeholder?: string;
  onChange: (v: string | undefined) => void;
  disabled?: boolean;
}

/**
 * Combobox somente-seleção: o usuário só pode escolher entre as opções
 * já existentes nas sub-abas (não aceita valores arbitrários).
 */
export function ComboFilter({ label, value, options, placeholder, onChange, disabled }: Props) {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            role="combobox"
            aria-expanded={open}
            disabled={disabled || options.length === 0}
            className={cn("h-9 w-full justify-between font-normal", !value && "text-muted-foreground")}
          >
            <span className="truncate">{value ?? placeholder ?? `Selecione ${label.toLowerCase()}`}</span>
            <div className="flex items-center gap-1 shrink-0">
              {value && (
                <X
                  className="h-3.5 w-3.5 opacity-60 hover:opacity-100"
                  onClick={(e) => { e.stopPropagation(); onChange(undefined); }}
                />
              )}
              <ChevronsUpDown className="h-3.5 w-3.5 opacity-50" />
            </div>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
          <Command>
            <CommandInput placeholder={`Buscar ${label.toLowerCase()}...`} />
            <CommandList>
              <CommandEmpty>Nenhuma opção cadastrada nas sub-abas.</CommandEmpty>
              <CommandGroup>
                {options.map((opt) => (
                  <CommandItem
                    key={opt}
                    value={opt}
                    onSelect={() => { onChange(opt === value ? undefined : opt); setOpen(false); }}
                  >
                    <Check className={cn("mr-2 h-3.5 w-3.5", value === opt ? "opacity-100" : "opacity-0")} />
                    <span className="truncate">{opt}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}
