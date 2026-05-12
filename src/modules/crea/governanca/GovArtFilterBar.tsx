import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Filter, X } from "lucide-react";
import { GovFilters } from "./lib/govTypes";
import { ComboFilter } from "./ComboFilter";
import { useGovCompany } from "./lib/useGovCompany";
import { useGovFilterOptions } from "./lib/useGovFilterOptions";

const MES_LABEL = ["", "01 · Jan", "02 · Fev", "03 · Mar", "04 · Abr", "05 · Mai", "06 · Jun",
  "07 · Jul", "08 · Ago", "09 · Set", "10 · Out", "11 · Nov", "12 · Dez"];

export function GovArtFilterBar({ value, onChange }: { value: GovFilters; onChange: (f: GovFilters) => void }) {
  const { companyId } = useGovCompany();
  const { opts, loading } = useGovFilterOptions(companyId);

  const set = (k: keyof GovFilters, v: any) =>
    onChange({ ...value, [k]: v === "" || v === null || v === undefined ? undefined : v });
  const clear = () => onChange({});
  const count = Object.values(value).filter(
    (v) => v !== undefined && v !== "" && !(Array.isArray(v) && v.length === 0)
  ).length;

  const anoOpts = opts.anos.map(String);
  const mesOpts = opts.meses.map((m) => MES_LABEL[m]);

  return (
    <Card className="card-elegant">
      <CardContent className="p-3 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Filter className="h-4 w-4 text-primary" />
            Filtros · seleção a partir das sub-abas
            {count > 0 && (
              <span className="text-xs bg-primary/15 text-primary rounded-full px-2 py-0.5">{count}</span>
            )}
            {loading && <span className="text-xs text-muted-foreground">carregando opções…</span>}
          </div>
          {count > 0 && (
            <Button variant="ghost" size="sm" onClick={clear} className="h-7 text-xs">
              <X className="h-3 w-3 mr-1" /> Limpar
            </Button>
          )}
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
          <ComboFilter label="UF" value={value.uf} options={opts.ufs}
            onChange={(v) => set("uf", v)} placeholder="Selecione UF" />
          <ComboFilter label="Ano" value={value.ano ? String(value.ano) : undefined} options={anoOpts}
            onChange={(v) => set("ano", v ? Number(v) : undefined)} placeholder="Selecione ano" />
          <ComboFilter
            label="Mês"
            value={value.mes ? MES_LABEL[value.mes] : undefined}
            options={mesOpts}
            onChange={(v) => {
              if (!v) return set("mes", undefined);
              const n = Number(String(v).slice(0, 2));
              set("mes", n);
            }}
            placeholder="Selecione mês"
          />
          <ComboFilter label="Cidade" value={value.cidade} options={opts.cidades}
            onChange={(v) => set("cidade", v)} placeholder="Selecione cidade" />
          <ComboFilter label="Nome da Obra / Endereço" value={value.nome_obra} options={opts.obras}
            onChange={(v) => set("nome_obra", v)} placeholder="Selecione obra" />
          <ComboFilter label="Responsável Técnico" value={value.rt_nome} options={opts.rts}
            onChange={(v) => set("rt_nome", v)} placeholder="Selecione RT" />
          <ComboFilter label="Nº ART" value={value.numero} options={opts.numeros}
            onChange={(v) => set("numero", v)} placeholder="Selecione ART" />
        </div>
        <p className="text-[11px] text-muted-foreground">
          As opções são geradas automaticamente a partir do que já foi cadastrado em qualquer
          sub-aba (Relatório Gerencial, ART por Bloco, Relatórios CREA, ARTs Todas).
          Cadastrou um novo registro? Aparece aqui na hora.
        </p>
      </CardContent>
    </Card>
  );
}
