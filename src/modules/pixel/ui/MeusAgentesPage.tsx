import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useUserModules } from "@/modules/planos/hooks/useUserModules";
import { usePlanosAccess } from "@/modules/planos/hooks/usePlanosAccess";
import { AGENTS_CATALOG, type AgentMeta } from "../agents/agentsCatalog";
import { ModuleAgentChat } from "./ModuleAgentChat";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, MessageSquare, Lock } from "lucide-react";
import { Progress } from "@/components/ui/progress";

type Quota = {
  mensagens_usadas_mes: number;
  limite_mensal: number;
  data_reset: string;
} | null;

export default function MeusAgentesPage() {
  const { user } = useAuth() as any;
  const { has, isAdmin, ready } = useUserModules();
  const { isOcsStaff } = usePlanosAccess();
  const [quota, setQuota] = useState<Quota>(null);
  const [openAgent, setOpenAgent] = useState<AgentMeta | null>(null);

  useEffect(() => {
    if (!user) return;
    supabase.from("verso_agent_quota").select("mensagens_usadas_mes, limite_mensal, data_reset")
      .eq("user_id", user.id).maybeSingle()
      .then(({ data }) => setQuota(data ?? { mensagens_usadas_mes: 0, limite_mensal: 200, data_reset: new Date().toISOString() }));
  }, [user]);

  const visible = AGENTS_CATALOG.filter(a => {
    if (!ready) return false;
    if (a.admin_only && !(isOcsStaff || isAdmin)) return false;
    if (a.required_module && !has(a.required_module) && !isAdmin) return false;
    return true;
  });

  const used = quota?.mensagens_usadas_mes ?? 0;
  const limit = quota?.limite_mensal ?? 200;
  const pct = Math.min(100, (used / Math.max(1, limit)) * 100);
  const exceeded = used >= limit;

  return (
    <div className="space-y-5">
      <Card className="p-4 card-elegant">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="font-display font-semibold">Cota mensal de mensagens</span>
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              Os agentes Soluções-Verso são <strong>bônus</strong> — você não paga créditos. A OCS controla o limite mensal.
            </div>
          </div>
          <div className="min-w-[220px] flex-1 max-w-md">
            <div className="flex justify-between text-xs mb-1">
              <span>{used} / {limit} mensagens</span>
              {exceeded && <Badge variant="destructive" className="text-[10px]">Limite atingido</Badge>}
            </div>
            <Progress value={pct} />
          </div>
        </div>
      </Card>

      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {visible.length === 0 && (
          <Card className="p-6 col-span-full text-center text-sm text-muted-foreground">
            Nenhum agente disponível para os módulos que você tem acesso.
          </Card>
        )}
        {visible.map(a => {
          const Icon = a.icon;
          return (
            <Card key={a.module_key} className="card-elegant p-4 flex flex-col gap-3">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-primary/10 text-primary border border-primary/20">
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-display font-semibold leading-tight">{a.name}</div>
                  <div className="text-[11px] text-muted-foreground uppercase tracking-tight font-mono mt-0.5">
                    {a.role}
                  </div>
                </div>
                {a.admin_only && <Badge variant="secondary" className="text-[10px]"><Lock className="w-2.5 h-2.5 mr-1"/>OCS</Badge>}
              </div>
              <Button
                size="sm"
                variant="outline"
                className="w-full gap-2"
                disabled={exceeded}
                onClick={() => setOpenAgent(a)}
              >
                <MessageSquare className="w-3.5 h-3.5" /> Conversar
              </Button>
            </Card>
          );
        })}
      </div>

      {openAgent && (
        <ModuleAgentChat
          key={openAgent.module_key}
          moduleKey={openAgent.module_key}
          agentName={openAgent.name}
          agentRole={openAgent.role}
          icon={openAgent.icon}
          welcomeMessage={openAgent.welcome}
          renderTrigger={(open) => {
            // Auto-abre na primeira renderização
            queueMicrotask(open);
            return <span className="hidden" />;
          }}
        />
      )}
    </div>
  );
}
