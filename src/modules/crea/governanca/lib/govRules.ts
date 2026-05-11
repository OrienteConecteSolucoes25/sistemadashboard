import { GovArt, GovPagamento } from "./govApi";

export type RuleId =
  | "duplicada"
  | "sem_rt"
  | "sem_contratante"
  | "sem_pagamento"
  | "vencida"
  | "divergencia_valor"
  | "apta_baixa"
  | "sem_setor"
  | "sem_escopo"
  | "pagamento_sem_par"
  | "sem_uf"
  | "sem_endereco"
  | "paga_sem_baixa";

export type Severity = "critical" | "high" | "medium" | "low";

export interface RuleHit {
  rule: RuleId;
  severity: Severity;
  art_id?: string | null;
  pagamento_id?: string | null;
  numero?: string | null;
  motivo: string;
  prazo?: string | null;
}

export interface RuleDefinition {
  id: RuleId;
  label: string;
  description: string;
  severity: Severity;
  run: (ctx: { arts: GovArt[]; pagamentos: GovPagamento[] }) => RuleHit[];
}

const today = () => new Date().toISOString().slice(0, 10);
const addDays = (d: Date, days: number) => {
  const c = new Date(d); c.setDate(c.getDate() + days);
  return c.toISOString().slice(0, 10);
};

export const GOV_RULES: RuleDefinition[] = [
  {
    id: "duplicada",
    label: "ARTs duplicadas (mesmo número)",
    description: "Mais de uma ART com o mesmo número no mesmo CREA/UF.",
    severity: "high",
    run: ({ arts }) => {
      const map = new Map<string, GovArt[]>();
      for (const a of arts) {
        if (!a.numero) continue;
        const key = `${a.uf ?? ""}::${a.numero.trim().toLowerCase()}`;
        const arr = map.get(key) ?? [];
        arr.push(a); map.set(key, arr);
      }
      const hits: RuleHit[] = [];
      for (const [, arr] of map) {
        if (arr.length < 2) continue;
        for (const a of arr) hits.push({
          rule: "duplicada", severity: "high", art_id: a.id, numero: a.numero,
          motivo: `${arr.length} ARTs com número ${a.numero} no CREA-${a.uf ?? "?"}`,
        });
      }
      return hits;
    },
  },
  {
    id: "sem_rt",
    label: "ART sem responsável técnico",
    description: "ART importada sem RT vinculado.",
    severity: "medium",
    run: ({ arts }) => arts.filter(a => !a.rt_id).map(a => ({
      rule: "sem_rt", severity: "medium", art_id: a.id, numero: a.numero,
      motivo: "Sem responsável técnico atribuído.",
    })),
  },
  {
    id: "sem_contratante",
    label: "ART sem contratante",
    description: "ART sem cliente/contratante vinculado.",
    severity: "medium",
    run: ({ arts }) => arts.filter(a => !a.contratante_id).map(a => ({
      rule: "sem_contratante", severity: "medium", art_id: a.id, numero: a.numero,
      motivo: "Sem contratante vinculado.",
    })),
  },
  {
    id: "sem_pagamento",
    label: "ART aguardando pagamento",
    description: "ART com taxa registrada porém sem data de pagamento.",
    severity: "medium",
    run: ({ arts }) => {
      const t = today();
      return arts.filter(a => a.valor_taxa && !a.data_pagamento && (!a.data_vencimento || a.data_vencimento >= t))
        .map(a => ({
          rule: "sem_pagamento" as const, severity: "medium" as const, art_id: a.id, numero: a.numero,
          motivo: `Taxa de R$ ${Number(a.valor_taxa).toFixed(2)} sem pagamento.`,
          prazo: a.data_vencimento ?? undefined,
        }));
    },
  },
  {
    id: "vencida",
    label: "ART vencida não paga",
    description: "Vencimento já passou e não há pagamento registrado.",
    severity: "critical",
    run: ({ arts }) => {
      const t = today();
      return arts.filter(a => a.data_vencimento && a.data_vencimento < t && !a.data_pagamento)
        .map(a => ({
          rule: "vencida" as const, severity: "critical" as const, art_id: a.id, numero: a.numero,
          motivo: `Vencida em ${a.data_vencimento}.`, prazo: a.data_vencimento ?? undefined,
        }));
    },
  },
  {
    id: "divergencia_valor",
    label: "Divergência valor pago × taxa",
    description: "Valor pago difere da taxa em mais de R$ 1,00.",
    severity: "high",
    run: ({ arts }) => arts.filter(a =>
      a.valor_taxa && a.valor_pago && Math.abs(Number(a.valor_pago) - Number(a.valor_taxa)) > 1
    ).map(a => ({
      rule: "divergencia_valor", severity: "high", art_id: a.id, numero: a.numero,
      motivo: `Pago R$ ${Number(a.valor_pago).toFixed(2)} × taxa R$ ${Number(a.valor_taxa).toFixed(2)}.`,
    })),
  },
  {
    id: "apta_baixa",
    label: "ART apta a baixa",
    description: "Paga há mais de 60 dias sem data de baixa.",
    severity: "low",
    run: ({ arts }) => {
      const limite = addDays(new Date(), -60);
      return arts.filter(a => a.data_pagamento && a.data_pagamento <= limite && !a.data_baixa)
        .map(a => ({
          rule: "apta_baixa" as const, severity: "low" as const, art_id: a.id, numero: a.numero,
          motivo: `Paga em ${a.data_pagamento} e ainda sem baixa.`,
        }));
    },
  },
  {
    id: "sem_setor",
    label: "ART sem setor classificado",
    description: "Sem setor principal definido.",
    severity: "low",
    run: ({ arts }) => arts.filter(a => !(a as any).setor_principal_id).map(a => ({
      rule: "sem_setor", severity: "low", art_id: a.id, numero: a.numero,
      motivo: "Sem setor principal — rode a Classificação IA.",
    })),
  },
  {
    id: "sem_escopo",
    label: "ART sem escopo",
    description: "Sem escopo operacional definido.",
    severity: "low",
    run: ({ arts }) => arts.filter(a => !(a as any).escopo_id).map(a => ({
      rule: "sem_escopo", severity: "low", art_id: a.id, numero: a.numero,
      motivo: "Sem escopo definido.",
    })),
  },
  {
    id: "pagamento_sem_par",
    label: "Pagamento sem ART vinculada",
    description: "Boleto pago sem conciliação com nenhuma ART.",
    severity: "high",
    run: ({ pagamentos }) => pagamentos.filter(p => !p.conciliado_art_id && p.data_pagamento).map(p => ({
      rule: "pagamento_sem_par", severity: "high", pagamento_id: p.id,
      numero: p.numero_boleto,
      motivo: `Boleto ${p.numero_boleto ?? "?"} pago em ${p.data_pagamento ?? "?"} sem ART.`,
    })),
  },
];

export function runRules(arts: GovArt[], pagamentos: GovPagamento[], selected?: RuleId[]): RuleHit[] {
  const rules = selected?.length
    ? GOV_RULES.filter(r => selected.includes(r.id))
    : GOV_RULES;
  const out: RuleHit[] = [];
  for (const r of rules) out.push(...r.run({ arts, pagamentos }));
  return out;
}

export const SEVERITY_LABEL: Record<Severity, string> = {
  critical: "Crítico", high: "Alto", medium: "Médio", low: "Baixo",
};
export const SEVERITY_COLOR: Record<Severity, string> = {
  critical: "bg-destructive text-destructive-foreground",
  high: "bg-orange-500 text-white",
  medium: "bg-yellow-500 text-black",
  low: "bg-muted text-muted-foreground",
};
