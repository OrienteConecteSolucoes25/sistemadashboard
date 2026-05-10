import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Filter, X, ChevronDown, ChevronUp } from "lucide-react";
import { GovFilters, UFS_BR, GOV_STATUS_ANALISE, GOV_STATUS_FINANCEIRO } from "./lib/govTypes";

const ALL = "__all";

export function GovArtFilterBar({ value, onChange }: { value: GovFilters; onChange: (f: GovFilters) => void }) {
  const [open, setOpen] = useState(true);
  const set = (k: keyof GovFilters, v: any) => onChange({ ...value, [k]: v === ALL || v === "" ? undefined : v });
  const clear = () => onChange({});
  const count = Object.values(value).filter((v) => v !== undefined && v !== "" && !(Array.isArray(v) && v.length === 0)).length;

  return (
    <Card className="card-elegant">
      <CardContent className="p-3 space-y-3">
        <div className="flex items-center justify-between">
          <button onClick={() => setOpen(!open)} className="flex items-center gap-2 text-sm font-medium text-foreground hover:text-primary">
            <Filter className="h-4 w-4" /> Filtros globais {count > 0 && <span className="text-xs bg-primary/15 text-primary rounded-full px-2 py-0.5">{count}</span>}
            {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
          {count > 0 && (
            <Button variant="ghost" size="sm" onClick={clear} className="h-7 text-xs">
              <X className="h-3 w-3 mr-1" /> Limpar
            </Button>
          )}
        </div>
        {open && (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
            <div>
              <Label className="text-xs text-muted-foreground">UF CREA</Label>
              <Select value={value.uf ?? ALL} onValueChange={(v) => set("uf", v)}>
                <SelectTrigger className="h-9"><SelectValue placeholder="Todas" /></SelectTrigger>
                <SelectContent><SelectItem value={ALL}>Todas</SelectItem>{UFS_BR.map((u) => <SelectItem key={u} value={u}>{u}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Ano</Label>
              <Input className="h-9" type="number" value={value.ano ?? ""} onChange={(e) => set("ano", e.target.value ? Number(e.target.value) : undefined)} placeholder="2026" />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Mês</Label>
              <Input className="h-9" type="number" min={1} max={12} value={value.mes ?? ""} onChange={(e) => set("mes", e.target.value ? Number(e.target.value) : undefined)} />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Status análise</Label>
              <Select value={value.status_analise ?? ALL} onValueChange={(v) => set("status_analise", v)}>
                <SelectTrigger className="h-9"><SelectValue placeholder="Todos" /></SelectTrigger>
                <SelectContent><SelectItem value={ALL}>Todos</SelectItem>{GOV_STATUS_ANALISE.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Status financeiro</Label>
              <Select value={value.status_financeiro ?? ALL} onValueChange={(v) => set("status_financeiro", v)}>
                <SelectTrigger className="h-9"><SelectValue placeholder="Todos" /></SelectTrigger>
                <SelectContent><SelectItem value={ALL}>Todos</SelectItem>{GOV_STATUS_FINANCEIRO.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Nº ART</Label>
              <Input className="h-9" value={value.numero ?? ""} onChange={(e) => set("numero", e.target.value)} placeholder="BA20261…" />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Nº Boleto</Label>
              <Input className="h-9" value={value.boleto ?? ""} onChange={(e) => set("boleto", e.target.value)} />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Cidade</Label>
              <Input className="h-9" value={value.cidade ?? ""} onChange={(e) => set("cidade", e.target.value)} />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Cadastro de</Label>
              <Input className="h-9" type="date" value={value.cadastro_de ?? ""} onChange={(e) => set("cadastro_de", e.target.value)} />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Cadastro até</Label>
              <Input className="h-9" type="date" value={value.cadastro_ate ?? ""} onChange={(e) => set("cadastro_ate", e.target.value)} />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Valor mín.</Label>
              <Input className="h-9" type="number" value={value.valor_min ?? ""} onChange={(e) => set("valor_min", e.target.value ? Number(e.target.value) : undefined)} />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Valor máx.</Label>
              <Input className="h-9" type="number" value={value.valor_max ?? ""} onChange={(e) => set("valor_max", e.target.value ? Number(e.target.value) : undefined)} />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
