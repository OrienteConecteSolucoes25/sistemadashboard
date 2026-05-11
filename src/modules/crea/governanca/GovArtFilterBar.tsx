import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Filter, X } from "lucide-react";
import { GovFilters } from "./lib/govTypes";

export function GovArtFilterBar({ value, onChange }: { value: GovFilters; onChange: (f: GovFilters) => void }) {
  const set = (k: keyof GovFilters, v: any) =>
    onChange({ ...value, [k]: v === "" || v === null ? undefined : v });
  const clear = () => onChange({});
  const count = Object.values(value).filter(
    (v) => v !== undefined && v !== "" && !(Array.isArray(v) && v.length === 0)
  ).length;

  const F = ({ label, k, type = "text", placeholder }: { label: string; k: keyof GovFilters; type?: string; placeholder?: string }) => (
    <div>
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <Input
        className="h-9"
        type={type}
        value={(value as any)[k] ?? ""}
        onChange={(e) =>
          set(k, type === "number" ? (e.target.value ? Number(e.target.value) : undefined) : e.target.value)
        }
        placeholder={placeholder}
      />
    </div>
  );

  return (
    <Card className="card-elegant">
      <CardContent className="p-3 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Filter className="h-4 w-4 text-primary" />
            Filtros · busca instantânea
            {count > 0 && (
              <span className="text-xs bg-primary/15 text-primary rounded-full px-2 py-0.5">{count}</span>
            )}
          </div>
          {count > 0 && (
            <Button variant="ghost" size="sm" onClick={clear} className="h-7 text-xs">
              <X className="h-3 w-3 mr-1" /> Limpar
            </Button>
          )}
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
          <F label="UF" k="uf" placeholder="BA" />
          <F label="Ano" k="ano" type="number" placeholder="2026" />
          <F label="Mês" k="mes" type="number" placeholder="1-12" />
          <F label="Cidade" k="cidade" placeholder="Salvador" />
          <F label="Nome da Obra" k="nome_obra" placeholder="Endereço/obra…" />
          <F label="Responsável Técnico" k="rt_nome" placeholder="Nome do RT" />
          <F label="Nº ART" k="numero" placeholder="BA20261…" />
          <F label="Data de" k="data_de" type="date" />
          <F label="Data até" k="data_ate" type="date" />
        </div>
      </CardContent>
    </Card>
  );
}
