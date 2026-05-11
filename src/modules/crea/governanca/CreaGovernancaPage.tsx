import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Gauge, FileSpreadsheet, Boxes, FileText } from "lucide-react";
import { GovArtFilterBar } from "./GovArtFilterBar";
import { GovFilters } from "./lib/govTypes";
import { VisaoExecutivaTab } from "./tabs/VisaoExecutivaTab";
import { GovGenericTab } from "./tabs/GovGenericTab";
import { SERVICOS_FIELDS, ART_BLOCO_FIELDS, RELATORIO_CREA_FIELDS } from "./tabs/govFields";

const TABS = [
  { value: "executiva",      label: "Visão Executiva",        icon: Gauge },
  { value: "servicos",       label: "Relatório Gerencial",    icon: FileSpreadsheet },
  { value: "art_bloco",      label: "ART por Bloco",          icon: Boxes },
  { value: "relatorio_crea", label: "Relatórios CREA",        icon: FileText },
];

export default function CreaGovernancaPage() {
  const [filters, setFilters] = useState<GovFilters>({});
  const [tab, setTab] = useState("executiva");

  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">Governança ART</h1>
        <p className="text-sm text-muted-foreground">
          Centro nacional de inteligência das ARTs · multiempresa, multi-CREA, multi-ano.
        </p>
      </header>

      <GovArtFilterBar value={filters} onChange={setFilters} />

      <Tabs value={tab} onValueChange={setTab}>
        <div className="overflow-x-auto">
          <TabsList className="w-max">
            {TABS.map((t) => (
              <TabsTrigger key={t.value} value={t.value} className="gap-1.5">
                <t.icon className="h-3.5 w-3.5" />
                <span>{t.label}</span>
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        <TabsContent value="executiva" className="mt-4">
          <VisaoExecutivaTab filters={filters} />
        </TabsContent>
        <TabsContent value="servicos" className="mt-4">
          <GovGenericTab
            table="crea_gov_servicos"
            title="Relatório Gerencial de Serviços"
            description="Importe planilhas do CREA com Número, Detalhe, Análise, Baixa, Boleto, Pagamento, Cadastro, Empresa, Contratante, Endereço, Observação."
            fields={SERVICOS_FIELDS}
          />
        </TabsContent>
        <TabsContent value="art_bloco" className="mt-4">
          <GovGenericTab
            table="crea_gov_art_bloco"
            title="ART por Bloco"
            description="Bloco completo de ARTs (RT, contratante, contrato, valores, datas, atividades técnicas)."
            fields={ART_BLOCO_FIELDS}
            labelKey="numero_art"
          />
        </TabsContent>
        <TabsContent value="relatorio_crea" className="mt-4">
          <GovGenericTab
            table="crea_gov_relatorio_crea"
            title="Relatórios CREA"
            description="Relatório consolidado por ART (tipo, participação, contratante, proprietário, atividades)."
            fields={RELATORIO_CREA_FIELDS}
            labelKey="art"
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
