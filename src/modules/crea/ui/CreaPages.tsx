import CreaCrudPage from "./crud/CreaCrudPage";
import {
  ARTS_CFG, PROTOCOLOS_CFG, CATS_CFG, CERTIDOES_CFG, BAIXAS_CFG, TRATATIVAS_CFG,
  PRAZOS_CFG, RTS_CFG, EMPRESAS_CFG, DOCUMENTOS_CFG, NORMAS_CFG, LINKS_CFG,
} from "./crud/creaCrudConfigs";
import CredenciaisPage from "./CredenciaisPage";
import AssistentePage from "./AssistentePage";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookOpen, Link as LinkIcon, CalendarClock, MessageSquare } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search } from "lucide-react";

const sb: any = supabase;

export const ArtsPage = () => <CreaCrudPage config={ARTS_CFG} />;
export const ProtocolosPage = () => <CreaCrudPage config={PROTOCOLOS_CFG} />;
export const CatsPage = () => <CreaCrudPage config={CATS_CFG} />;
export const CertidoesPage = () => <CreaCrudPage config={CERTIDOES_CFG} />;
export const BaixasPage = () => <CreaCrudPage config={BAIXAS_CFG} />;
export const TratativasPage = () => <CreaCrudPage config={TRATATIVAS_CFG} />;
export const PrazosPage = () => <CreaCrudPage config={PRAZOS_CFG} />;
export const RtsPage = () => <CreaCrudPage config={RTS_CFG} />;
export const EmpresasPage = () => <CreaCrudPage config={EMPRESAS_CFG} />;
export const DocumentosPage = () => <CreaCrudPage config={DOCUMENTOS_CFG} />;
export const NormasPage = () => (
  <Tabs defaultValue="normas" className="space-y-4">
    <TabsList className="flex-wrap h-auto">
      <TabsTrigger value="normas"><BookOpen className="w-4 h-4 mr-1" /> Normas e Regras</TabsTrigger>
      <TabsTrigger value="links"><LinkIcon className="w-4 h-4 mr-1" /> Links Oficiais</TabsTrigger>
      <TabsTrigger value="prazos"><CalendarClock className="w-4 h-4 mr-1" /> Prazos</TabsTrigger>
      <TabsTrigger value="tratativas"><MessageSquare className="w-4 h-4 mr-1" /> Tratativas</TabsTrigger>
    </TabsList>
    <TabsContent value="normas"><CreaCrudPage config={NORMAS_CFG} isGlobal /></TabsContent>
    <TabsContent value="links"><CreaCrudPage config={LINKS_CFG} isGlobal /></TabsContent>
    <TabsContent value="prazos"><CreaCrudPage config={PRAZOS_CFG} /></TabsContent>
    <TabsContent value="tratativas"><CreaCrudPage config={TRATATIVAS_CFG} /></TabsContent>
  </Tabs>
);
export const LinksPage = () => <CreaCrudPage config={LINKS_CFG} isGlobal />;

export { CredenciaisPage, AssistentePage };

export const AuditoriaPage = () => {
  const [rows, setRows] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    (async () => {
      const { data } = await sb.from("crea_audit_logs").select("*").order("created_at",{ascending:false}).limit(500);
      setRows(data ?? []); setLoading(false);
    })();
  }, []);
  const filtered = rows.filter(r => !search || JSON.stringify(r).toLowerCase().includes(search.toLowerCase()));
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Auditoria CREA</h1>
        <p className="text-sm text-muted-foreground">Log dedicado de ações do módulo CREA.</p>
      </div>
      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-2 top-2.5 text-muted-foreground" />
          <Input className="pl-8" placeholder="Buscar..." value={search} onChange={e=>setSearch(e.target.value)} />
        </div>
        <Badge variant="outline">{filtered.length}</Badge>
      </div>
      <Card>
        <CardHeader><CardTitle className="text-sm">Eventos recentes</CardTitle></CardHeader>
        <CardContent className="overflow-x-auto p-0">
          {loading ? <p className="p-4 text-sm text-muted-foreground">Carregando...</p> : (
          <table className="w-full text-xs">
            <thead><tr className="border-b text-left text-muted-foreground">
              <th className="py-2 px-3">Quando</th><th className="py-2 px-3">Ação</th><th className="py-2 px-3">Módulo</th>
              <th className="py-2 px-3">Entidade</th><th className="py-2 px-3">Obs</th>
            </tr></thead>
            <tbody>{filtered.map(r=>(
              <tr key={r.id} className="border-b hover:bg-muted/50">
                <td className="py-1.5 px-3 whitespace-nowrap">{new Date(r.created_at).toLocaleString("pt-BR")}</td>
                <td className="py-1.5 px-3"><Badge variant="outline">{r.action}</Badge></td>
                <td className="py-1.5 px-3">{r.modulo}</td>
                <td className="py-1.5 px-3">{r.nome_entidade}</td>
                <td className="py-1.5 px-3 text-muted-foreground">{r.observacoes}</td>
              </tr>
            ))}</tbody>
          </table>)}
        </CardContent>
      </Card>
    </div>
  );
};
