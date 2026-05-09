import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { useComunicacaoAccess } from "../hooks/useComunicacaoAccess";
import { MessageSquare, ListChecks, CheckCircle2, Calendar, Megaphone, Sparkles } from "lucide-react";

function Kpi({ icon: Icon, label, value, hint }: any) {
  return (
    <Card className="p-4">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-xs text-muted-foreground">{label}</div>
          <div className="text-2xl font-bold mt-1">{value ?? "—"}</div>
          {hint && <div className="text-[11px] text-muted-foreground mt-1">{hint}</div>}
        </div>
        <Icon className="w-5 h-5 text-primary" />
      </div>
    </Card>
  );
}

export default function ComunicacaoDashboard() {
  const { companyId } = useComunicacaoAccess();
  const [k, setK] = useState<any>({});
  useEffect(() => {
    if (!companyId) return;
    (async () => {
      const [posts, aprov, calend, camp, img] = await Promise.all([
        supabase.from("comm_content_posts").select("id,status", { count: "exact" }).eq("company_id", companyId).eq("is_deleted", false),
        supabase.from("comm_approvals").select("id", { count: "exact", head: true }).eq("company_id", companyId).in("status", ["em_revisao", "ajustes"]),
        supabase.from("comm_editorial_calendar").select("id", { count: "exact", head: true }).eq("company_id", companyId).eq("is_deleted", false)
          .gte("data_planejada", new Date().toISOString().slice(0, 10))
          .lte("data_planejada", new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10)),
        supabase.from("comm_campaigns").select("id", { count: "exact", head: true }).eq("company_id", companyId).eq("status", "ativa").eq("is_deleted", false),
        supabase.from("comm_generated_images").select("id", { count: "exact", head: true }).eq("company_id", companyId).eq("is_deleted", false),
      ]);
      const all = posts.data ?? [];
      setK({
        rascunhos: all.filter((p) => p.status?.startsWith("rascunho")).length,
        revisao: all.filter((p) => p.status === "em_revisao").length,
        aprovados: all.filter((p) => p.status === "aprovado").length,
        publicados: all.filter((p) => p.status === "publicado").length,
        aprovPend: aprov.count ?? 0,
        semana: calend.count ?? 0,
        camp: camp.count ?? 0,
        img: img.count ?? 0,
      });
    })();
  }, [companyId]);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-display font-bold">Comunicação OCS Studio</h1>
        <p className="text-muted-foreground text-sm">Central de geração de conteúdo, design e imagem com aprovação humana.</p>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Kpi icon={MessageSquare} label="Rascunhos IA" value={k.rascunhos} />
        <Kpi icon={ListChecks} label="Em revisão" value={k.revisao} />
        <Kpi icon={CheckCircle2} label="Aprovados" value={k.aprovados} />
        <Kpi icon={CheckCircle2} label="Publicados" value={k.publicados} />
        <Kpi icon={ListChecks} label="Aprovações pendentes" value={k.aprovPend} hint="aguardando você" />
        <Kpi icon={Calendar} label="Calendário 7 dias" value={k.semana} />
        <Kpi icon={Megaphone} label="Campanhas ativas" value={k.camp} />
        <Kpi icon={Sparkles} label="Imagens IA geradas" value={k.img} />
      </div>
      <Card className="p-4">
        <div className="font-medium mb-2">Como começar</div>
        <ol className="text-sm space-y-1 list-decimal pl-5 text-muted-foreground">
          <li>Configure um <b>Brand Kit</b> em Brand Kits.</li>
          <li>Use o <b>Gerador de Posts</b> para criar rascunhos IA.</li>
          <li>Edite, gere imagem ou abra no <b>Canva Pro</b>.</li>
          <li>Envie para <b>Aprovação</b> — humano sempre.</li>
          <li>Marque como <b>Publicado</b> manualmente após postar.</li>
        </ol>
      </Card>
    </div>
  );
}
