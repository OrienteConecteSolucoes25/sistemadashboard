# CREA & ART — o que já está pronto e o que falta

## Reveja as levas que já foi feitas não deve se ser só o esqueleto. Precisa ser funcional todos os botões e ações funcionando.

&nbsp;

## Já entregue (Levas 1, 2 e 3)

- **Leva 1 — Fundação**: migration completa (`crea_gov_*`), permissões `can_governance*`, rota `/app/crea/governanca`, layout com Tabs e FilterBar.
- **Leva 2 — Importação + Tabela Técnica + Visão Executiva**: parsing XLS/CSV, KPIs, Recharts.
- **Leva 3 — Classificação & Cadastros**: CRUDs de Setores, Tags, Escopos + motor de regras (`govClassifier`) + reprocessamento em lote.

Abas hoje no `CreaGovernancaPage`: Visão Executiva, Técnica, Importações, Setores, Tags, Escopos, Classificação IA.

---

## Falta entregar

### Leva 4 — Financeira + Conciliação (próxima)

- Aba **Financeira**: cards (emitido/pago/pendente/vencido), gráficos por mês/UF/RT/empresa, tabela de pagamentos.
- Aba **Conciliação**: 3 listas (Conciliados / Divergentes / Sem par).
- Auto-match boleto×ART por `numero_boleto` → fallback (valor + janela de datas + sacado≈contratante).
- Modal manual lado-a-lado (`ConciliacaoManualModal`).
- RPC `crea_gov_conciliate_run(_company)` + edge `crea-gov-conciliate`.
- Atualiza `status_financeiro` da ART.

### Leva 5 — Auditoria de Dados + Painéis

- Aba **Dados (Auditoria)**: regras `govRules.ts` (duplicada, sem RT, sem pagamento, divergência, vencidas, aptas baixa, etc.) — execução sob demanda + agendada.
- Cada hit vira `crea_gov_alertas` (criticidade, SLA, responsável, histórico).
- Aba **Alertas & Pendências**: queue com filtros + `AlertaResolverModal`.
- Painéis: **Empresas**, **Resp. Técnicos**, **Clientes** (cards + drilldown por entidade).

### Leva 6 — CREAs Brasil + PDF

- Aba **CREAs Brasil**: pré-popular 27 UFs (AC..TO) em `crea_gov_creas_config`.
- UI por UF: layout XLS, regras de extração, taxa padrão, status, campos personalizados.
- **Parsing de PDF** para conferência visual (pdf.js + heurística de colunas) → `crea_gov_pdf_paginas`.

### Leva 7 — Relatórios + Assistente IA

- Aba **Relatórios**: gerenciais com export xlsx/docx/pdf (templates por UF/empresa/RT/cliente/período).
- Aba **Assistente IA**: edge `crea-gov-ai` (Lovable AI Gateway, `google/gemini-2.5-flash`) com tool-calling pré-aprovado (`kpis`, `top_rts`, `top_empresas`, `por_setor`, `vencidas`, `divergencias`…).
- Resposta com texto + gráfico/tabela renderizados inline. Sem SQL livre.

---

## Resumo


| Leva | Escopo                               | Status    |
| ---- | ------------------------------------ | --------- |
| 1    | Fundação (DB + rota + esqueleto)     | ✅         |
| 2    | Importação + Técnica + Executiva     | ✅         |
| 3    | Setores/Tags/Escopos + Classificador | ✅         |
| 4    | **Financeira + Conciliação**         | ✅ |
| 5    | Auditoria + Alertas + Painéis        | ✅ |
| 6    | CREAs Brasil + PDF                   | ✅ |
| 7    | Relatórios + Assistente IA           | ⏳         |


Recomendo seguir pela **Leva 4 (Financeira + Conciliação)** — destrava o módulo financeiramente e alimenta auditoria/alertas da Leva 5.