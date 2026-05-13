// Mock data por TABELA — usado quando o Modo Demo está ON.
// Cada array imita o formato real lido pelas páginas.
// Mantém valores plausíveis (PA/AM/MA/AP/RR/TO, OCS, status reais).

const now = new Date();
const iso = (daysAgo: number) => {
  const d = new Date(now); d.setDate(d.getDate() - daysAgo);
  return d.toISOString();
};
const isoDate = (daysAhead: number) => {
  const d = new Date(now); d.setDate(d.getDate() + daysAhead);
  return d.toISOString().slice(0, 10);
};

const SITES = [
  { id: "demo-site-1", nome: "STE-100 Belém Centro", codigo: "STE-100", endereco: "Av. Pres. Vargas, 1500", cidade: "Belém", uf: "PA", cep: "66017-000", status: "ativo", responsavel: "Ana Lima", maps_url: "", latitude: -1.4558, longitude: -48.5039, trigger_date: isoDate(-30), delivery_date: isoDate(20), total_value: 248_500, is_deleted: false, created_at: iso(45) },
  { id: "demo-site-2", nome: "STE-101 Ananindeua",   codigo: "STE-101", endereco: "Rod. BR-316 km 8",    cidade: "Ananindeua", uf: "PA", cep: "67030-000", status: "ativo", responsavel: "Bruno Reis", maps_url: "", latitude: -1.3656, longitude: -48.3719, trigger_date: isoDate(-20), delivery_date: isoDate(35), total_value: 187_200, is_deleted: false, created_at: iso(38) },
  { id: "demo-site-3", nome: "STE-102 Marituba",     codigo: "STE-102", endereco: "Av. João Paulo II",   cidade: "Marituba", uf: "PA", cep: "67200-000", status: "pausado", responsavel: "Carlos Souza", maps_url: "", latitude: -1.3592, longitude: -48.3422, trigger_date: isoDate(-10), delivery_date: isoDate(50), total_value: 96_400, is_deleted: false, created_at: iso(28) },
  { id: "demo-site-4", nome: "STE-103 Soure",         codigo: "STE-103", endereco: "Trav. 14",            cidade: "Soure", uf: "PA", cep: "68870-000", status: "concluido", responsavel: "Diana Castro", maps_url: "", latitude: -0.7173, longitude: -48.5236, trigger_date: isoDate(-90), delivery_date: isoDate(-30), total_value: 312_000, is_deleted: false, created_at: iso(120) },
  { id: "demo-site-5", nome: "STE-104 Castanhal",     codigo: "STE-104", endereco: "Rua Barão",           cidade: "Castanhal", uf: "PA", cep: "68740-000", status: "ativo", responsavel: "Eduardo Pina", maps_url: "", latitude: -1.2939, longitude: -47.9211, trigger_date: isoDate(-5), delivery_date: isoDate(60), total_value: 145_700, is_deleted: false, created_at: iso(15) },
  { id: "demo-site-6", nome: "STE-200 Manaus Centro", codigo: "STE-200", endereco: "Av. Eduardo Ribeiro", cidade: "Manaus", uf: "AM", cep: "69010-001", status: "ativo", responsavel: "Felipe Aragão", maps_url: "", latitude: -3.1190, longitude: -60.0217, trigger_date: isoDate(-12), delivery_date: isoDate(40), total_value: 223_000, is_deleted: false, created_at: iso(22) },
  { id: "demo-site-7", nome: "STE-300 São Luís",      codigo: "STE-300", endereco: "Av. Litorânea",       cidade: "São Luís", uf: "MA", cep: "65071-380", status: "ativo", responsavel: "Gisele Mota",  maps_url: "", latitude: -2.5307, longitude: -44.3068, trigger_date: isoDate(-18), delivery_date: isoDate(55), total_value: 178_900, is_deleted: false, created_at: iso(33) },
  { id: "demo-site-8", nome: "STE-400 Macapá",        codigo: "STE-400", endereco: "Av. FAB",             cidade: "Macapá", uf: "AP", cep: "68900-073", status: "pausado", responsavel: "Hugo Bastos", maps_url: "", latitude: 0.0349, longitude: -51.0694, trigger_date: isoDate(-25), delivery_date: isoDate(45), total_value: 132_500, is_deleted: false, created_at: iso(40) },
];

const RFI = Array.from({ length: 14 }).map((_, i) => ({
  id: `demo-rfi-${i + 1}`,
  numero: `RFI-2026-${String(i + 1).padStart(3, "0")}`,
  site: SITES[i % SITES.length].codigo,
  assunto: [
    "Detalhamento de fundação da torre",
    "Especificação de cabo CAT6A",
    "Layout de sala técnica",
    "Aterramento de equipamento ativo",
    "Trecho de fibra subterrânea",
    "Revisão de planta elétrica",
    "Ajuste de cota topográfica",
  ][i % 7],
  descricao: "Solicitação de informações enviada à equipe de projeto para esclarecimento técnico.",
  status: ["aberta", "em_analise", "respondida", "fechada"][i % 4],
  prioridade: ["media", "alta", "baixa"][i % 3],
  prazo: isoDate((i % 20) - 5),
  responsavel: ["Ana Lima", "Bruno Reis", "Carlos Souza"][i % 3],
  created_at: iso(i * 2),
}));

const PENDENCIAS = Array.from({ length: 18 }).map((_, i) => ({
  id: `demo-pend-${i + 1}`,
  titulo: [
    "Liberar acesso à torre",
    "Aguardando emissão de ART",
    "Material em falta — conector óptico",
    "Retrabalho aterramento",
    "Pendência de inspeção final",
    "Aguardando autorização do cliente",
    "Recolher EPI fora de validade",
  ][i % 7],
  descricao: "Pendência levantada em vistoria de campo.",
  site: SITES[i % SITES.length].codigo,
  prioridade: i < 3 ? "critica" : ["alta", "media", "baixa"][i % 3],
  responsavel: ["Equipe Alpha", "Equipe Bravo", "Equipe Charlie"][i % 3],
  prazo: isoDate((i % 30) - 10),
  status: ["aberta", "em_andamento", "concluida"][i % 3],
  created_at: iso(i),
}));

const ATIVIDADES = Array.from({ length: 22 }).map((_, i) => ({
  id: `demo-ativ-${i + 1}`,
  titulo: ["Lançamento de fibra", "Instalação de rack", "Comissionamento ativos", "Inspeção preventiva", "Documentação as-built"][i % 5],
  site: SITES[i % SITES.length].codigo,
  responsavel: ["Equipe Alpha", "Equipe Bravo"][i % 2],
  status: ["em_andamento", "concluida", "aberta", "bloqueada"][i % 4],
  inicio: isoDate(-i),
  termino: isoDate(7 - i),
  created_at: iso(i),
}));

const EQUIPES = [
  { id: "demo-eq-1", nome: "Equipe Alpha", cnpj: "12.345.678/0001-90", lider: "João Silva",  leader_phone: "(91) 98888-1111", base: "Belém", uf_base: "PA", scopes: ["fibra", "ativos"], estados_atuacao: ["PA","AM"], technicians: [{ nome: "Pedro", telefone: "(91) 98000-0001" }, { nome: "Ricardo", telefone: "(91) 98000-0002" }], status: "alocada", is_deleted: false, created_at: iso(60) },
  { id: "demo-eq-2", nome: "Equipe Bravo", cnpj: "23.456.789/0001-12", lider: "Marta Lopes", leader_phone: "(91) 98888-2222", base: "Ananindeua", uf_base: "PA", scopes: ["energia"], estados_atuacao: ["PA"], technicians: [{ nome: "Lucas", telefone: "(91) 98000-0003" }], status: "disponivel", is_deleted: false, created_at: iso(40) },
  { id: "demo-eq-3", nome: "Equipe Charlie", cnpj: "34.567.890/0001-34", lider: "Rafael Cunha", leader_phone: "(92) 98888-3333", base: "Manaus", uf_base: "AM", scopes: ["fibra"], estados_atuacao: ["AM","RR"], technicians: [{ nome: "Igor", telefone: "(92) 98000-0004" }], status: "alocada", is_deleted: false, created_at: iso(25) },
  { id: "demo-eq-4", nome: "Equipe Delta", cnpj: "45.678.901/0001-56", lider: "Sofia Reis", leader_phone: "(98) 98888-4444", base: "São Luís", uf_base: "MA", scopes: ["civil"], estados_atuacao: ["MA"], technicians: [{ nome: "Tales", telefone: "(98) 98000-0005" }], status: "disponivel", is_deleted: false, created_at: iso(15) },
];

const MATERIAIS = Array.from({ length: 16 }).map((_, i) => ({
  id: `demo-mat-${i + 1}`,
  codigo: `MAT-${String(1000 + i)}`,
  descricao: ["Cabo UTP CAT6 (300m)", "Conector RJ-45", "Eletroduto PVC 25mm", "Cordoalha de aço", "Cabo óptico 12FO", "Conector óptico SC/APC", "DIO 12 portas", "Switch 24p PoE"][i % 8],
  categoria: ["cabos", "conectores", "infraestrutura", "ativos"][i % 4],
  conta_financeira: ["6101", "6102", "6103"][i % 3],
  unidade: ["rolo", "un", "barra", "metro"][i % 4],
  estoque: 50 + (i * 7) % 200,
  reservado: (i * 3) % 30,
  created_at: iso(i),
}));

const SUPRIMENTOS = Array.from({ length: 12 }).map((_, i) => ({
  id: `demo-sup-${i + 1}`,
  numero: `SC-2026-${String(i + 1).padStart(3, "0")}`,
  cliente: ["Telecom Norte", "Energia PA", "Prefeitura Belém"][i % 3],
  site: SITES[i % SITES.length].codigo,
  solicitante: ["Ana Lima", "Bruno Reis"][i % 2],
  categoria: ["cabos", "conectores", "infraestrutura"][i % 3],
  prioridade: ["alta", "media", "baixa"][i % 3],
  status: ["aberta", "aprovada", "em_compra", "entregue"][i % 4],
  prazo: isoDate(7 + i),
  itens: [{ descricao: "Cabo UTP CAT6", quantidade: 5 + i, unidade: "rolo" }],
  observacao: "Pedido de demonstração",
  created_at: iso(i), updated_at: iso(i),
}));

const FIBRA_OBRAS = Array.from({ length: 8 }).map((_, i) => ({
  id: `demo-fib-${i + 1}`,
  obra: `OBRA-${String(i + 1).padStart(3, "0")}`,
  site: SITES[i % SITES.length].codigo,
  trecho: ["Trecho A", "Trecho B", "Trecho C"][i % 3],
  metragem: 250 + i * 120,
  status: ["em_execucao", "concluida", "aberta"][i % 3],
  responsavel: "Equipe Charlie",
  created_at: iso(i * 3),
}));

const LIGACOES_ENERGIA = Array.from({ length: 7 }).map((_, i) => ({
  id: `demo-ene-${i + 1}`,
  protocolo: `EQTL-${String(700000 + i)}`,
  site: SITES[i % SITES.length].codigo,
  concessionaria: ["Equatorial PA", "Amazonas Energia", "Equatorial MA"][i % 3],
  potencia_kw: 15 + i * 5,
  status: ["solicitada", "vistoria", "ligada"][i % 3],
  data_solicitacao: isoDate(-i * 4),
  created_at: iso(i),
}));

const ART = Array.from({ length: 6 }).map((_, i) => ({
  id: `demo-art-${i + 1}`,
  numero: `ART-PA-2026-${String(1000 + i)}`,
  responsavel_tecnico: ["Eng. Marcelo Lopes", "Eng. Larissa Sá"][i % 2],
  site: SITES[i % SITES.length].codigo,
  status: ["emitida", "em_analise", "registrada"][i % 3],
  valor: 350 + i * 25,
  emissao: isoDate(-i * 7),
  created_at: iso(i * 3),
}));

const RELATORIOS = Array.from({ length: 9 }).map((_, i) => ({
  id: `demo-rel-${i + 1}`,
  titulo: ["Diário de obra", "Relatório semanal", "Relatório técnico"][i % 3] + ` ${isoDate(-i)}`,
  tipo: ["diario", "semanal", "tecnico"][i % 3],
  site: SITES[i % SITES.length].codigo,
  data: isoDate(-i),
  autor: ["Ana Lima", "Bruno Reis"][i % 2],
  created_at: iso(i),
}));

const EMAILS_LOG = Array.from({ length: 5 }).map((_, i) => ({
  id: `demo-mail-${i + 1}`,
  destinatario: ["fornecedor@exemplo.com", "cliente@telecomnorte.com"][i % 2],
  assunto: `Solicitação de cotação SC-2026-${String(i + 1).padStart(3, "0")}`,
  status: ["enviado", "falhou"][i % 2],
  enviado_em: iso(i),
  created_at: iso(i),
}));

const DEMANDAS = Array.from({ length: 6 }).map((_, i) => ({
  id: `demo-dem-${i + 1}`,
  titulo: ["Inspeção emergencial", "Manutenção preventiva", "Atendimento de chamado"][i % 3],
  cliente: ["Telecom Norte", "Energia PA"][i % 2],
  site: SITES[i % SITES.length].codigo,
  status: ["aberta", "em_andamento", "concluida"][i % 3],
  prioridade: ["alta", "media"][i % 2],
  created_at: iso(i),
}));

const PROJETOS = Array.from({ length: 10 }).map((_, i) => ({
  id: `demo-prj-${i + 1}`,
  nome: `Projeto Demo ${i + 1}`,
  cliente: ["Telecom Norte", "Energia PA"][i % 2],
  site: SITES[i % SITES.length].codigo,
  status: ["em_andamento", "concluido", "atrasado"][i % 3],
  responsavel: ["Ana Lima", "Bruno Reis"][i % 2],
  prazo: isoDate(15 + i),
  created_at: iso(i * 2),
}));

const INTEGRACOES = [
  { id: "demo-int-1", nome: "Outlook (Microsoft 365)", status: "conectada", ultima_sync: iso(0), created_at: iso(60) },
  { id: "demo-int-2", nome: "WhatsApp Business",        status: "conectada", ultima_sync: iso(0), created_at: iso(50) },
  { id: "demo-int-3", nome: "SharePoint Suprimentos",   status: "atencao",   ultima_sync: iso(2), created_at: iso(70) },
];

const ROADMAP_IA = [
  { id: "demo-rm-1", titulo: "Sumarização de RFIs com IA", status: "em_desenvolvimento", responsavel: "Time IA", created_at: iso(20) },
  { id: "demo-rm-2", titulo: "Detecção de pendências críticas", status: "planejado", responsavel: "Time IA", created_at: iso(10) },
  { id: "demo-rm-3", titulo: "Sugestão de comprador padrão", status: "concluido", responsavel: "Time IA", created_at: iso(5) },
];

export const ENG_DEMO_TABLES: Record<string, any[]> = {
  eng_sites: SITES,
  eng_rfi: RFI,
  eng_pendencias: PENDENCIAS,
  eng_atividades: ATIVIDADES,
  eng_equipes: EQUIPES,
  eng_materiais: MATERIAIS,
  eng_suprimentos: SUPRIMENTOS,
  eng_fibra_obras: FIBRA_OBRAS,
  eng_ligacoes_energia: LIGACOES_ENERGIA,
  eng_art: ART,
  eng_relatorios: RELATORIOS,
  eng_emails_log: EMAILS_LOG,
  eng_demandas: DEMANDAS,
  eng_projetos: PROJETOS,
  eng_integracoes: INTEGRACOES,
  eng_roadmap_ia: ROADMAP_IA,
};

export function getDemoTable(table: string): any[] | null {
  return ENG_DEMO_TABLES[table] ?? null;
}
