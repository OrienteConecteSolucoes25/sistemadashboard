import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

const sb: any = supabase;

function GenericListPage({
  title, description, table, columns,
}: {
  title: string;
  description: string;
  table: string;
  columns: { key: string; label: string }[];
}) {
  const [rows, setRows] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data } = await sb.from(table).select("*").eq("is_deleted", false).order("created_at", { ascending: false }).limit(200);
      setRows(data ?? []);
      setLoading(false);
    })();
  }, [table]);

  const filtered = rows.filter(r =>
    !search || JSON.stringify(r).toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">{title}</h1>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-2 top-2.5 text-muted-foreground" />
          <Input className="pl-8" placeholder="Buscar..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Badge variant="outline">{filtered.length} registros</Badge>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Listagem (modo leitura — CRUD completo nas próximas iterações)</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {loading ? (
            <p className="text-sm text-muted-foreground">Carregando...</p>
          ) : filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum registro. Use o botão Importar / Novo (em breve).</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs text-muted-foreground">
                  {columns.map(c => <th key={c.key} className="py-2 pr-4">{c.label}</th>)}
                </tr>
              </thead>
              <tbody>
                {filtered.map(r => (
                  <tr key={r.id} className="border-b hover:bg-muted/50">
                    {columns.map(c => (
                      <td key={c.key} className="py-2 pr-4">
                        {r[c.key] === null || r[c.key] === undefined || r[c.key] === ""
                          ? <span className="text-muted-foreground">—</span>
                          : String(r[c.key]).slice(0, 80)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export const ArtsPage = () => <GenericListPage title="ARTs" description="Anotações de Responsabilidade Técnica." table="crea_arts"
  columns={[{key:"numero",label:"Número"},{key:"uf",label:"UF"},{key:"escopo",label:"Escopo"},{key:"status",label:"Status"},{key:"data_emissao",label:"Emissão"},{key:"data_baixa",label:"Baixa"}]} />;

export const ProtocolosPage = () => <GenericListPage title="Protocolos CREA" description="Protocolos abertos junto aos CREAs." table="crea_protocols"
  columns={[{key:"numero",label:"Número"},{key:"uf",label:"UF"},{key:"tipo",label:"Tipo"},{key:"status",label:"Status"},{key:"data_abertura",label:"Abertura"},{key:"prazo_esperado",label:"Prazo"}]} />;

export const CatsPage = () => <GenericListPage title="CATs / Acervo Técnico" description="Certidões de Acervo Técnico." table="crea_cats"
  columns={[{key:"numero",label:"Número"},{key:"uf",label:"UF"},{key:"tipo",label:"Tipo"},{key:"status",label:"Status"},{key:"data_solicitacao",label:"Solicitação"},{key:"data_emissao",label:"Emissão"}]} />;

export const CertidoesPage = () => <GenericListPage title="Certidões" description="Certidões CREA por empresa e RT." table="crea_certificates"
  columns={[{key:"tipo",label:"Tipo"},{key:"uf",label:"UF"},{key:"numero",label:"Número"},{key:"data_emissao",label:"Emissão"},{key:"validade",label:"Validade"},{key:"status",label:"Status"}]} />;

export const BaixasPage = () => <GenericListPage title="Baixas" description="Baixas de ART, RT e vínculos." table="crea_deregistrations"
  columns={[{key:"tipo",label:"Tipo"},{key:"uf",label:"UF"},{key:"status",label:"Status"},{key:"data_solicitada",label:"Solicitada"},{key:"data_concluida",label:"Concluída"}]} />;

export const TratativasPage = () => <GenericListPage title="Tratativas" description="Histórico de comunicação com CREA, engenheiros e empresas." table="crea_treatments"
  columns={[{key:"tipo",label:"Tipo"},{key:"canal",label:"Canal"},{key:"data_evento",label:"Data"},{key:"prazo",label:"Prazo"},{key:"descricao",label:"Descrição"}]} />;

export const PrazosPage = () => <GenericListPage title="Prazos" description="Prazos centralizados do módulo CREA." table="crea_deadlines"
  columns={[{key:"tipo",label:"Tipo"},{key:"prazo",label:"Prazo"},{key:"status",label:"Status"},{key:"observacoes",label:"Observações"}]} />;

export const RtsPage = () => <GenericListPage title="Responsáveis Técnicos" description="RTs vinculados às empresas." table="crea_responsible_technicians"
  columns={[{key:"empresa_vinculada",label:"Empresa"},{key:"setor",label:"Setor"},{key:"status",label:"Status"},{key:"inicio_vinculo",label:"Início"},{key:"fim_vinculo",label:"Fim"}]} />;

export const EmpresasPage = () => <GenericListPage title="Empresas e CREAs" description="Vínculos empresa × CREA por UF." table="crea_companies_crea"
  columns={[{key:"empresa",label:"Empresa"},{key:"cnpj",label:"CNPJ"},{key:"uf",label:"UF"},{key:"registro",label:"Registro"},{key:"status",label:"Status"},{key:"validade",label:"Validade"}]} />;

export const DocumentosPage = () => <GenericListPage title="Documentações" description="Documentos exigidos por escopo / UF / CREA." table="crea_documents"
  columns={[{key:"nome",label:"Nome"},{key:"tipo",label:"Tipo"},{key:"uf",label:"UF"},{key:"escopo",label:"Escopo"},{key:"obrigatorio",label:"Obrigatório"},{key:"validade",label:"Validade"}]} />;

export const NormasPage = () => <GenericListPage title="Normas e Regras" description="DN, PL, resoluções Confea/CREA por UF." table="crea_norms"
  columns={[{key:"tipo",label:"Tipo"},{key:"numero",label:"Número"},{key:"ano",label:"Ano"},{key:"orgao",label:"Órgão"},{key:"uf",label:"UF"},{key:"tema",label:"Tema"}]} />;

export const LinksPage = () => <GenericListPage title="Links Oficiais dos CREAs" description="Portais e links oficiais por UF." table="crea_links_oficiais"
  columns={[{key:"uf",label:"UF"},{key:"portal_principal",label:"Portal"},{key:"portal_servicos",label:"Serviços"},{key:"protocolo",label:"Protocolo"},{key:"certidoes",label:"Certidões"}]} />;

export const CredenciaisPage = () => (
  <div className="space-y-4">
    <div>
      <h1 className="text-2xl font-bold">Credenciais CREA</h1>
      <p className="text-sm text-muted-foreground">
        Logins e senhas dos portais CREA por UF, empresa e RT. Senhas ficam cifradas e exigem permissão + motivo para serem reveladas.
      </p>
    </div>
    <Card>
      <CardHeader><CardTitle className="text-sm">Em construção — interface segura</CardTitle></CardHeader>
      <CardContent className="text-sm text-muted-foreground space-y-2">
        <p>1. Admin OCS deve definir a <strong>chave-mestra</strong> de cifragem (RPC <code>crea_set_master_key</code>).</p>
        <p>2. Cadastros usam <code>crea_save_credential</code> (cifragem AES via pgcrypto).</p>
        <p>3. Revelar senha exige permissão <code>can_view_credentials</code> + motivo, e tudo fica em <code>crea_audit_logs</code>.</p>
      </CardContent>
    </Card>
  </div>
);

export const AssistentePage = () => (
  <div className="space-y-4">
    <div>
      <h1 className="text-2xl font-bold">Assistente IA CREA</h1>
      <p className="text-sm text-muted-foreground">
        Responde com base nas fontes cadastradas em <strong>crea_ai_sources</strong> (DN, PL, resoluções, checklists, links). Não inventa regra de CREA.
      </p>
    </div>
    <Card>
      <CardHeader><CardTitle className="text-sm">Próxima fase</CardTitle></CardHeader>
      <CardContent className="text-sm text-muted-foreground">
        Edge function <code>crea-ai-assist</code> com RAG sobre fontes próprias. Integração futura com NotebookLM apenas como referência opcional.
      </CardContent>
    </Card>
  </div>
);

export const AuditoriaPage = () => <GenericListPage title="Auditoria CREA" description="Log dedicado de ações do módulo CREA." table="crea_audit_logs"
  columns={[{key:"created_at",label:"Quando"},{key:"action",label:"Ação"},{key:"modulo",label:"Módulo"},{key:"entidade_tipo",label:"Tipo"},{key:"nome_entidade",label:"Entidade"},{key:"observacoes",label:"Obs"}]} />;
