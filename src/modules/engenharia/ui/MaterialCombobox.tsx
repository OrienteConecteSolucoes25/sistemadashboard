import { useMemo, useState } from "react";
import { Check, ChevronsUpDown, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { Material } from "../hooks/useMateriais";

type Props = {
  catalogo: Material[];
  value: string;                      // formato "<codigo> — <descricao>" ou texto livre
  onChange: (input: string) => void;  // recebe o valor completo selecionado/digitado
  placeholder?: string;
  className?: string;
  triggerClassName?: string;
};

/**
 * Combobox de materiais com busca em TODO o catálogo (código ou descrição).
 * Substitui o <datalist> nativo (que o Chrome limita a ~20 sugestões).
 */
export function MaterialCombobox({
  catalogo, value, onChange, placeholder = "Buscar material…", className, triggerClassName,
}: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return catalogo.slice(0, 200); // mostra os primeiros 200 sem busca
    const out: Material[] = [];
    for (const m of catalogo) {
      const codigo = String(m.codigo || "").toLowerCase();
      const desc = String(m.descricao || "").toLowerCase();
      const cat = String(m.categoria || "").toLowerCase();
      if (codigo.includes(q) || desc.includes(q) || cat.includes(q)) {
        out.push(m);
        if (out.length >= 200) break;
      }
    }
    return out;
  }, [catalogo, query]);

  const display = value || "";

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between font-normal", triggerClassName)}
        >
          <span className={cn("truncate text-left", !display && "text-muted-foreground")}>
            {display || placeholder}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className={cn("p-0 w-[min(560px,90vw)]", className)} align="start">
        <div className="relative border-b">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Digite código, descrição ou categoria…"
            className="h-9 pl-8 border-0 focus-visible:ring-0 rounded-none"
          />
        </div>
        <div className="max-h-72 overflow-auto">
          {filtered.length === 0 ? (
            <div className="px-3 py-6 text-center text-xs text-muted-foreground">
              Nenhum material encontrado. Pressione abaixo para usar o texto digitado.
            </div>
          ) : (
            <ul className="py-1">
              {filtered.map((m) => {
                const full = `${m.codigo} — ${m.descricao}`;
                const selected = full === value;
                return (
                  <li key={m.id}>
                    <button
                      type="button"
                      className={cn(
                        "w-full text-left px-3 py-1.5 text-xs hover:bg-accent flex items-center gap-2",
                        selected && "bg-accent",
                      )}
                      onClick={() => { onChange(full); setOpen(false); setQuery(""); }}
                    >
                      <Check className={cn("h-3.5 w-3.5 shrink-0", selected ? "opacity-100" : "opacity-0")} />
                      <span className="font-mono text-[10px] text-muted-foreground w-16 shrink-0">{m.codigo || "—"}</span>
                      <span className="flex-1 truncate">{m.descricao}</span>
                      {m.categoria && (
                        <span className="text-[10px] text-muted-foreground shrink-0">{m.categoria}</span>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
          {query.trim() && (
            <div className="border-t p-1">
              <button
                type="button"
                className="w-full text-left px-3 py-1.5 text-xs hover:bg-accent rounded"
                onClick={() => { onChange(query.trim()); setOpen(false); setQuery(""); }}
              >
                Usar texto digitado: <strong>"{query.trim()}"</strong>
              </button>
            </div>
          )}
          <div className="px-3 py-1.5 border-t text-[10px] text-muted-foreground bg-muted/30">
            {filtered.length} de {catalogo.length} materiais
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

export default MaterialCombobox;
