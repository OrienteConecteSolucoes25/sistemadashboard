import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Plug, Save, Globe, Bot, FileSignature, Database, Mail } from "lucide-react";

const sb: any = supabase;

interface FlagDef { key: string; label: string; description: string; icon: any; }
const FLAGS: FlagDef[] = [
  { key: "scraping_enabled", label: "Scraping de portais CREA", description: "Coleta automatizada de dados de portais públicos. Mantenha desativado até confirmar com o jurídico.", icon: Globe },
  { key: "rpa_enabled", label: "Automação RPA (login simulado)", description: "Robôs que executam ações em portais usando credenciais cadastradas. Use apenas com permissão expressa.", icon: Bot },
  { key: "digital_signature", label: "Assinatura digital integrada", description: "Integração com ICP-Brasil/Serpro para assinar ARTs digitalmente.", icon: FileSignature },
  { key: "notebooklm_sync", label: "Sincronização NotebookLM", description: "Conexão direta com NotebookLM para enriquecimento de fontes da IA.", icon: Database },
  { key: "outlook_notifications", label: "Notificações Outlook", description: "Disparo automático de e-mails de prazos via Outlook.", icon: Mail },
];

export default function CreaIntegracoesPage() {
  const { isAdmin, loading } = useAuth();
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [flags, setFlags] = useState<Record<string, boolean>>({});
  const [busy, setBusy] = useState(false);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    (async () => {
      const { data: u } = await sb.auth.getUser();
      const { data: cu } = await sb.from("company_users").select("company_id").eq("user_id", u.user?.id).maybeSingle();
      const cid = cu?.company_id ?? null;
      setCompanyId(cid);
      if (cid) {
        const { data } = await sb.from("crea_module_settings").select("feature_flags").eq("company_id", cid).maybeSingle();
        setFlags((data?.feature_flags as any) ?? {});
      }
      setLoadingData(false);
    })();
  }, []);

  const save = async () => {
    if (!companyId) { toast.error("Associe-se a uma empresa primeiro."); return; }
    setBusy(true);
    const { error } = await sb.from("crea_module_settings").upsert({ company_id: companyId, feature_flags: flags }, { onConflict: "company_id" });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Integrações salvas.");
  };

  if (loading || loadingData) return null;
  if (!isAdmin) return <Card><CardContent className="py-12 text-center text-muted-foreground">Apenas administradores podem alterar integrações.</CardContent></Card>;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2"><Plug className="w-6 h-6 text-primary" /> Integrações CREA</h1>
        <p className="text-sm text-muted-foreground">Habilite integrações externas. Todas iniciam <strong>desativadas</strong> por padrão.</p>
      </div>

      {!companyId && (
        <Card><CardContent className="py-8 text-center text-muted-foreground">Você precisa estar associado a uma empresa para configurar integrações.</CardContent></Card>
      )}

      <div className="grid gap-3 md:grid-cols-2">
        {FLAGS.map(f => {
          const Icon = f.icon;
          const on = !!flags[f.key];
          return (
            <Card key={f.key}>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Icon className="w-4 h-4 text-primary" /> {f.label}
                  {on ? <Badge>Ativo</Badge> : <Badge variant="outline">Inativo</Badge>}
                </CardTitle>
                <CardDescription className="text-xs">{f.description}</CardDescription>
              </CardHeader>
              <CardContent className="flex items-center justify-between">
                <Label htmlFor={f.key} className="text-xs">Habilitar</Label>
                <Switch id={f.key} checked={on} onCheckedChange={(v) => setFlags(s => ({ ...s, [f.key]: v }))} disabled={!companyId} />
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="flex justify-end">
        <Button onClick={save} disabled={busy || !companyId}><Save className="w-4 h-4 mr-1" />{busy ? "Salvando…" : "Salvar integrações"}</Button>
      </div>
    </div>
  );
}
