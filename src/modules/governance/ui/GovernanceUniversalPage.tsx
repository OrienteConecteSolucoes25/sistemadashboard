/**
 * Página universal de Governança — serve qualquer módulo via prop `moduleKey`.
 * 4 abas: Dashboard, Plano de Ação, Dados (auto-adaptativo), Relatórios.
 */
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { ShieldAlert, BarChart3, ListChecks, Database, FileText, Settings2 } from "lucide-react";
import { useGovernanceAccess } from "../hooks/useGovernanceAccess";
import { GovDashboard } from "./GovDashboard";
import { GovActionPlan } from "./GovActionPlan";
import { GovDataAdaptive } from "./GovDataAdaptive";
import { GovReports } from "./GovReports";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const MODULE_LABEL: Record<string, string> = {
  engenharia: "Engenharia", juridico: "Jurídico", crea: "CREA & ART",
  rhdp: "RH/DP", comunicacao: "Comunicação", geral: "Geral",
};

export function GovernanceUniversalPage({ moduleKey }: { moduleKey: string }) {
  const { hasAccess, canEdit, loading } = useGovernanceAccess(moduleKey);
  const [openSettings, setOpenSettings] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return;
      const { data: r } = await supabase.from("user_roles").select("role").eq("user_id", u.user.id);
      setIsAdmin((r ?? []).some((x: any) => x.role === "admin"));
      const { data: s } = await supabase.from("governance_settings").select("edit_open_to_all").eq("id", true).maybeSingle();
      setEditOpen(!!s?.edit_open_to_all);
    })();
  }, []);

  const toggleOpen = async (v: boolean) => {
    const { error } = await supabase.from("governance_settings").update({ edit_open_to_all: v }).eq("id", true);
    if (error) { toast.error(error.message); return; }
    setEditOpen(v); toast.success(v ? "Edição liberada para todos" : "Edição restrita");
  };

  if (loading) return <div className="p-6 text-muted-foreground">Carregando…</div>;
  if (!hasAccess) return (
    <Card><CardContent className="p-8 text-center">
      <ShieldAlert className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
      <p>Sem permissão para acessar Governança.</p>
    </CardContent></Card>
  );

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Governança · {MODULE_LABEL[moduleKey] ?? moduleKey}</h1>
          <p className="text-sm text-muted-foreground">Importe qualquer planilha mestre — o sistema adapta colunas, tipos e fórmulas automaticamente.</p>
        </div>
        {isAdmin && (
          <button className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1" onClick={() => setOpenSettings(!openSettings)}>
            <Settings2 className="h-3.5 w-3.5" />Configurações
          </button>
        )}
      </div>

      {openSettings && isAdmin && (
        <Card><CardContent className="p-3 flex items-center justify-between">
          <div>
            <Label>Edição aberta para todos os aprovados</Label>
            <p className="text-xs text-muted-foreground">Quando ligado, qualquer usuário autenticado pode editar dados de governança.</p>
          </div>
          <Switch checked={editOpen} onCheckedChange={toggleOpen} />
        </CardContent></Card>
      )}

      <Tabs defaultValue="dashboard">
        <TabsList>
          <TabsTrigger value="dashboard"><BarChart3 className="h-3.5 w-3.5 mr-1" />Dashboard</TabsTrigger>
          <TabsTrigger value="acao"><ListChecks className="h-3.5 w-3.5 mr-1" />Plano de Ação</TabsTrigger>
          <TabsTrigger value="dados"><Database className="h-3.5 w-3.5 mr-1" />Dados</TabsTrigger>
          <TabsTrigger value="relatorios"><FileText className="h-3.5 w-3.5 mr-1" />Relatórios</TabsTrigger>
        </TabsList>
        <TabsContent value="dashboard" className="mt-3"><GovDashboard moduleKey={moduleKey} /></TabsContent>
        <TabsContent value="acao" className="mt-3"><GovActionPlan moduleKey={moduleKey} canEdit={canEdit} /></TabsContent>
        <TabsContent value="dados" className="mt-3"><GovDataAdaptive moduleKey={moduleKey} canEdit={canEdit} /></TabsContent>
        <TabsContent value="relatorios" className="mt-3"><GovReports moduleKey={moduleKey} /></TabsContent>
      </Tabs>
    </div>
  );
}
