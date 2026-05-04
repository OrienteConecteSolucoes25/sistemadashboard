// Listas oficiais do sistema (portado do Oriente)

export const ESCOPOS_ENGENHARIA = [
  "REFORÇO","CONST. DE ESTRADA","RECUPERAÇÃO ESTRUTURAL","CORRETIVA PESADA",
  "MONTAGEM/SUBST. DE EV","AMPLIAÇÃO","IMPLANTAÇÃO","EXECUÇÃO DE FUNDAÇÃO",
  "DESMOBILIZAÇÃO","IMPERMEABILIZAÇÃO","COLLO","RF/MW","FIBRA",
  "MANUTENÇÃO DE TORRE","SHELTER","REMANEJAMENTO","DESMONTAGEM","VISTORIA",
] as const;

export const STATUS_SOLICITACAO = [
  "SOLICITADO","EM COTAÇÃO","AGUARDANDO APROV. COORD.","AGUARDANDO APROV. GERÊNCIA",
  "REMANEJAMENTO","EM FABRICAÇÃO","EM SEPARAÇÃO","EM ROTA","DISPONÍVEL PARA RETIRA",
  "ENTREGUE","PENDENTE","PARALISADO","CANCELADO","AGUARDANDO ENVIO",
  "DISPONÍVEL P/ LOGÍSTICA COLETAR","EM PROCESSO DE COMPRA","COMPRADO","ENVIADO PARA PAGAMENTO",
] as const;

export const CLIENTES_CC: Record<string, string> = {
  "IHS OBRAS CIVIS": "6560","SBA OBRAS CIVIS": "6720","TBSA OBRAS CIVIS": "6740",
  "CLARO": "7130","HIGHLINE OBRAS CIVIS": "6730","NEOENERGIA BA": "6680",
  "NEOENERGIA SP": "6690","NEOENERGIA RN": "6700","NEOENERGIA DF": "6710",
  "NEOENERGIA PE": "NC008","NEOENERGIA SHELTER PE": "6900","NEOENERGIA SHELTER SP": "6920",
  "NEOENERGIA SHELTER BA": "6890","NEOENERGIA SHELTER DF": "6930",
  "NEOENERGIA SHELTER RN": "6910","HUAWEI": "6960",
};
export const CLIENTES = Object.keys(CLIENTES_CC);

export const COMPRADORES = ["Carmelio Ramanho","Sabrina Reis","Matheus Souza","Tawana de Jesus","Vitor Pinto"] as const;
export const COMPRADORES_LEGADO = ["Sabrina","Ananda","Vitor","Robson","Tawana"] as const;

export const CATEGORIA_COMPRADOR: Record<string, string> = {
  "MATERIAL ELÉTRICO": "Sabrina Reis","ELÉTRICO": "Sabrina Reis","FERRO E AÇO": "Sabrina Reis",
  "PINTURA": "Sabrina Reis","CORTE E DOBRA": "Sabrina Reis","IMPERMEABILIZANTE": "Sabrina Reis",
  "SERVIÇO DE CONTROLE TECNOLÓGICO": "Sabrina Reis","COMPRA DE CONCRETO USINADO": "Sabrina Reis",
  "CONCRETAGEM": "Sabrina Reis","ATERRAMENTO": "Sabrina Reis","FERRAGENS": "Sabrina Reis",
  "METÁLICO GALVANIZADO": "Matheus Souza","METÁLICO": "Matheus Souza",
  "MATERIAL CIVIL": "Matheus Souza","CIVIL": "Matheus Souza","HIDRAULICO": "Matheus Souza",
  "EPI E EPC": "Matheus Souza","EPI": "Matheus Souza","FERRAMENTAL DE CONSUMO": "Matheus Souza",
  "FERRAMENTAS, MÁQUINAS E EQUIPAMENTOS (CAMPO-IMOBILIZADO)": "Matheus Souza",
  "FERRAMENTAS": "Matheus Souza","ALUGUEL DE MÁQUINAS E EQUIPAMENTOS": "Matheus Souza",
  "ITENS DE ESCRITÓRIO (MATERIAIS DE LIMPEZA, PAPELARIA E INSUMOS)": "Tawana de Jesus",
  "MÁQUINAS E EQUIPAMENTOS (ADM-IMOBILIZADO)": "Tawana de Jesus",
  "SERVIÇOS GRÁFICOS": "Tawana de Jesus",
  "FRETES E REQUISIÇÕES DE MATERIAIS DO ALMOXARIFADO": "Vitor Pinto",
  "FRETE": "Vitor Pinto","ESTOQUE": "Vitor Pinto","DIVERSOS": "Vitor Pinto",
  "ALMOXARIFADO": "Vitor Pinto",
  "SC PROVENIENTE DE RC": "Carmelio Ramanho",
  "SOLICITAÇÃO DE FRETE PARA TRANSPORTE DO ESTOQUE": "Carmelio Ramanho",
  "ABERTURA DE SOLICITAÇÕES DE COMPRA DE MATERIAIS PARA O ESTOQUE": "Carmelio Ramanho",
};

export const CATEGORIA_SLA: Record<string, number> = {
  "ATERRAMENTO": 8,"FERRO E AÇO": 12,"METÁLICO": 25,"METÁLICO GALVANIZADO": 25,
  "CIVIL": 8,"MATERIAL CIVIL": 8,"FERRAGENS": 20,"PINTURA": 20,"FRETE": 5,
  "FRETES E REQUISIÇÕES DE MATERIAIS DO ALMOXARIFADO": 5,"ESTOQUE": 5,"DIVERSOS": 7,
  "EPI": 5,"EPI E EPC": 5,"IMPERMEABILIZANTE": 17,"CONCRETAGEM": 10,
  "COMPRA DE CONCRETO USINADO": 10,"CORTE E DOBRA": 12,"ELÉTRICO": 10,
  "MATERIAL ELÉTRICO": 10,"HIDRAULICO": 8,"ALMOXARIFADO": 5,"FERRAMENTAL DE CONSUMO": 7,
  "FERRAMENTAS, MÁQUINAS E EQUIPAMENTOS (CAMPO-IMOBILIZADO)": 15,"FERRAMENTAS": 7,
  "ALUGUEL DE MÁQUINAS E EQUIPAMENTOS": 7,
  "ITENS DE ESCRITÓRIO (MATERIAIS DE LIMPEZA, PAPELARIA E INSUMOS)": 7,
  "MÁQUINAS E EQUIPAMENTOS (ADM-IMOBILIZADO)": 15,"SERVIÇOS GRÁFICOS": 7,
  "SERVIÇO DE CONTROLE TECNOLÓGICO": 10,"SC PROVENIENTE DE RC": 5,
  "SOLICITAÇÃO DE FRETE PARA TRANSPORTE DO ESTOQUE": 5,
  "ABERTURA DE SOLICITAÇÕES DE COMPRA DE MATERIAIS PARA O ESTOQUE": 5,
};

export const CATEGORIAS = Object.keys(CATEGORIA_COMPRADOR);
export const PRIORIDADES = ["Alta","Média","Baixa"] as const;
export const ART_STATUS = ["Vencida","Emitida","Em validação","Enviada para pagamento","Criada","Pendente"] as const;
export const COORDENADORES_DEFAULT = ["A definir"];
export const COORDENADORES = [
  "MIRLA CALDAS","MARIANA PEREIRA","REINAN IBRAIM","RAIANE SANTIAGO","ANA PAULA",
  "ARTHUR SAMPAIO","ANA VALÉRIA","BRUNO VASCONCELLOS","JECILENY PEIXOTO","ERICK DIEGO","THAINE LIMA",
] as const;
export const TIPO_SOLICITACAO = ["Solicitação de compra","Solicitação de frete","Requisição de material","Solicitação de serviço"] as const;
export const RELATORIO_STATUS = ["Não iniciada","Em andamento","Concluída"] as const;
export const ART_DELETE_PASSWORD = "852741963";

export const PARENT_TABS = [
  { key: "atividades", label: "Atividades" },
  { key: "suprimentos", label: "Solicitações de Engenharia" },
  { key: "art", label: "ART" },
  { key: "relatorios", label: "Relatórios" },
  { key: "emails", label: "E-mails" },
  { key: "ligacoes-energia", label: "Ligações de Energia" },
  { key: "equipes", label: "Empresas" },
  { key: "demandas", label: "Demandas" },
  { key: "sites", label: "Obras" },
] as const;
export type ParentTabKey = typeof PARENT_TABS[number]["key"];

export const CHART_COLORS = { teal: "#2BBDC0", warn: "#f0a500", danger: "#e05252", neutral: "#b0bac5", gray: "#7a8694" };
export const CHART_PALETTE = ["#2BBDC0","#f0a500","#e05252","#b0bac5","#7a8694","#1a8a8c","#c98700","#a83838","#8693a0","#5a6470"];
