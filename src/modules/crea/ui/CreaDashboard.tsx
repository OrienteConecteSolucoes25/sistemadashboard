import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { HardHat } from "lucide-react";

const sb: any = supabase;

const KpiCard = ({ label, value }: { label: string; value: number | string }) => (
  <Card>
    <CardHeader className="pb-2"><CardTitle className="text-xs text-muted-foreground font-medium">{label}</CardTitle></CardHeader>
    <CardContent><div className="text-2xl font-bold">{value}</div></CardContent>
  </Card>
);

export default function CreaDashboard() {
  const [k, setK] = useState({ arts: 0, protAbertos: 0, certVenc: 0, baixaPend: 0, cats: 0, prazos: 0 });

  useEffect(() => {
    (async () => {
      const today = new Date().toISOString().slice(0,10);
      const in30 = new Date(Date.now() + 30*864e5).toISOString().slice(0,10);
      const [arts, prot, certVenc, baixa, cats, prazos] = await Promise.all([
        sb.from("crea_arts").select("id", { count: "exact", head: true }).eq("is_deleted", false),
        sb.from("crea_protocols").select("id", { count: "exact", head: true }).eq("is_deleted", false).eq("status","aberto"),
        sb.from("crea_certificates").select("id", { count: "exact", head: true }).eq("is_deleted", false).lte("validade", in30).gte("validade", today),
        sb.from("crea_deregistrations").select("id", { count: "exact", head: true }).eq("is_deleted", false).eq("status","pendente"),
        sb.from("crea_cats").select("id", { count: "exact", head: true }).eq("is_deleted", false),
        sb.from("crea_deadlines").select("id", { count: "exact", head: true }).eq("is_deleted", false).lte("prazo", in30),
      ]);
      setK({
        arts: arts.count ?? 0, protAbertos: prot.count ?? 0,
        certVenc: certVenc.count ?? 0, baixaPend: baixa.count ?? 0,
        cats: cats.count ?? 0, prazos: prazos.count ?? 0,
      });
    })();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <HardHat className="w-6 h-6 text-primary" /> CREA & ART — Dashboard
        </h1>
        <p className="text-sm text-muted-foreground">Visão geral do módulo CREA, ARTs, CATs, certidões e prazos.</p>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <KpiCard label="Total de ARTs" value={k.arts} />
        <KpiCard label="Protocolos abertos" value={k.protAbertos} />
        <KpiCard label="Certidões vencendo (30d)" value={k.certVenc} />
        <KpiCard label="Baixas pendentes" value={k.baixaPend} />
        <KpiCard label="CATs" value={k.cats} />
        <KpiCard label="Prazos próximos (30d)" value={k.prazos} />
      </div>
      <Card>
        <CardHeader><CardTitle className="text-base">Próximos passos</CardTitle></CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-1">
          <p>• Cadastre suas empresas e CREAs em <strong>Cadastros → Empresas e CREAs</strong>.</p>
          <p>• Cadastre Responsáveis Técnicos e Engenheiros.</p>
          <p>• Importe ARTs e Protocolos com o botão <strong>Importar</strong> (modelo .xlsx disponível).</p>
          <p>• Configure a chave-mestra de credenciais em <strong>Segurança → Credenciais</strong> antes de cadastrar logins de portais.</p>
        </CardContent>
      </Card>
    </div>
  );
}
