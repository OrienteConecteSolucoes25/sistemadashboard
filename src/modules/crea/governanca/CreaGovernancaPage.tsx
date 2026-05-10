import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import {
  Gauge, DollarSign, Table2, ShieldCheck, Building2, Users, UserSquare2,
  Tags, Shapes, Layers, Upload, Link2, Bell, MapPin, FileText, Bot, Sparkles,
} from "lucide-react";
import { GovArtFilterBar } from "./GovArtFilterBar";
import { GovFilters } from "./lib/govTypes";
import { VisaoExecutivaTab } from "./tabs/VisaoExecutivaTab";
import { TecnicaTab } from "./tabs/TecnicaTab";
import { ImportacoesTab } from "./tabs/ImportacoesTab";
import { SetoresTab } from "./tabs/SetoresTab";
import { TagsTab } from "./tabs/TagsTab";
import { EscoposTab } from "./tabs/EscoposTab";
import { ClassificacaoTab } from "./tabs/ClassificacaoTab";

const Placeholder = ({ title, description }: { title: string; description: string }) => (
  <Card className="card-elegant">
    <CardContent className="p-8 text-center">
      <p className="text-lg font-semibold text-foreground">{title}</p>
      <p className="text-sm text-muted-foreground mt-1">{description}</p>
      <p className="text-xs text-muted-foreground mt-4">Em construção · Leva seguinte do plano</p>
    </CardContent>
  </Card>
);

const TABS: { value: string; label: string; icon: any; desc: string }[] = [
  { value: "executiva",   label: "Visão Executiva",   icon: Gauge,        desc: "KPIs, gráficos por ano/mês/empresa/RT/cliente/CREA/setor/tag/escopo, rankings e drill-down." },
  { value: "financeira",  label: "Financeira",        icon: DollarSign,   desc: "Taxa CREA, contratos, custos, divergências e centros de custo — separados sem mistura." },
  { value: "tecnica",     label: "Técnica",           icon: Table2,       desc: "Tabela completa das ARTs (30+ colunas) com filtros, edição e exclusão em lote." },
  { value: "auditoria",   label: "Dados (Auditoria)", icon: ShieldCheck,  desc: "Qualidade de dados: duplicadas, sem RT, divergentes, sem baixa, etc." },
  { value: "empresas",    label: "Empresas",          icon: Building2,    desc: "Painel por empresa com ARTs, custos, tags e pendências." },
  { value: "rts",         label: "Resp. Técnicos",    icon: UserSquare2,  desc: "Painel por RT com ARTs, escopos, tags, pendências." },
  { value: "clientes",    label: "Clientes",          icon: Users,        desc: "Painel por contratante: ARTs, custo, contratos, RTs envolvidos." },
  { value: "setores",     label: "Setores",           icon: Shapes,       desc: "CRUD de setores personalizados por empresa." },
  { value: "tags",        label: "Tags",              icon: Tags,         desc: "CRUD de tags operacionais por empresa." },
  { value: "escopos",     label: "Escopos",           icon: Layers,       desc: "CRUD de escopos operacionais por empresa." },
  { value: "classificacao", label: "Classificação IA", icon: Sparkles,    desc: "Regras de palavra-chave/regex e reprocessamento automático." },
  { value: "importacoes", label: "Importações",       icon: Upload,       desc: "Upload de XLS/XLSX/CSV/PDF do CREA com histórico e reprocessar." },
  { value: "conciliacao", label: "Conciliação",       icon: Link2,        desc: "Boleto × ART (automática + manual), divergências e sem par." },
  { value: "alertas",     label: "Alertas",           icon: Bell,         desc: "Fila de exceções com criticidade, responsável e SLA." },
  { value: "creas",       label: "CREAs Brasil",      icon: MapPin,       desc: "Configuração por UF: layout do XLS, taxa, regras de extração." },
  { value: "relatorios",  label: "Relatórios",        icon: FileText,     desc: "Relatórios gerenciais com export XLSX/DOCX/PDF." },
  { value: "ia",          label: "Assistente IA",     icon: Bot,          desc: "Chat com Lovable AI — gera tabelas, gráficos e insights via tool calling." },
];

export default function CreaGovernancaPage() {
  const [filters, setFilters] = useState<GovFilters>({});
  const [tab, setTab] = useState("executiva");

  return (
    <div className="space-y-4">
      <header className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Governança ART</h1>
          <p className="text-sm text-muted-foreground">
            Centro nacional de inteligência das ARTs · multiempresa, multi-CREA, multi-ano.
          </p>
        </div>
      </header>

      <GovArtFilterBar value={filters} onChange={setFilters} />

      <Tabs value={tab} onValueChange={setTab}>
        <div className="overflow-x-auto">
          <TabsList className="w-max">
            {TABS.map((t) => (
              <TabsTrigger key={t.value} value={t.value} className="gap-1.5">
                <t.icon className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">{t.label}</span>
              </TabsTrigger>
            ))}
          </TabsList>
        </div>
        {TABS.map((t) => (
          <TabsContent key={t.value} value={t.value} className="mt-4">
            {t.value === "executiva" ? <VisaoExecutivaTab filters={filters} />
             : t.value === "tecnica" ? <TecnicaTab filters={filters} />
             : t.value === "importacoes" ? <ImportacoesTab />
             : <Placeholder title={t.label} description={t.desc} />}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
