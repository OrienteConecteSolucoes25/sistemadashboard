
# Governança ART · módulo CREA & ART

Aba central estratégica que consolida ARTs de qualquer CREA (UF) do Brasil em um único centro de governança: dashboards, custos, conciliação financeira, classificação por setor/tag/escopo (cadastrados pela própria empresa), auditoria de qualidade e Assistente IA. Arquitetura multiempresa, multi-CREA, multi-ano e preparada para milhares de ARTs.

A aba reaproveita o padrão Eng/Jur (sidebar dark + EngPageHeader + KpiGrid + Tabs), o `DataActionsToolbar` (xlsx/csv/docx + modelo + import), `DeleteWithPasswordModal` + `eng_soft_delete`, `useBulkSelection` + `BulkActionsBar` e o tema Oriente.

## Rota e navegação

- Nova rota: `/app/crea/governanca` (componente `CreaGovernancaPage`)
- Item no `CreaLayout` no grupo **Governança** (acima de Auditoria), ícone `ShieldCheck`/`Gauge`, `moduleKey: "crea.governanca"`
- Guarda por permissão usando `crea_can(uid, company, 'view')` + nova permissão `can_governance` em `crea_module_permissions`

## Estrutura interna (sub-abas)

```text
Governança ART
├── Visão Executiva       (KPIs + gráficos + ranking)
├── Financeira            (taxa CREA, contratos, custo, divergências)
├── Técnica               (tabela completa com 30+ colunas, filtros, edição)
├── Dados (Auditoria)     (qualidade: duplicadas, sem RT, divergentes…)
├── Empresas              (panel por empresa)
├── Resp. Técnicos        (panel por RT)
├── Clientes              (panel por contratante)
├── Setores               (CRUD por empresa)
├── Tags                  (CRUD por empresa)
├── Escopos               (CRUD por empresa)
├── Importações           (upload xls/xlsx/csv/pdf + histórico + reprocessar)
├── Conciliação Financeira(boleto×ART, automática + manual)
├── Alertas & Pendências  (queue de exceções com SLA/responsável)
├── CREAs Brasil          (configuração por UF: layout, taxa, regras)
├── Relatórios            (gerenciais com export xlsx/docx/pdf)
└── Assistente IA         (chat com gráficos/tabelas/insights)
```

## Filtros globais (FilterBar persistente)

Componente `GovArtFilterBar` no topo da aba, salvo por usuário em `crea_gov_user_filters`. Campos: empresa, RT, CREA/UF, ano, mês, cliente, setor, tags, escopo, status ART, status financeiro, tipo, natureza, cidade, UF, número ART, número boleto, período (cadastro/pagamento/vencimento), faixa de valor, centro de custo. Todos os gráficos respeitam estes filtros e qualquer clique em barra/fatia aplica filtro adicional na tabela técnica.

## KPIs (cards)

Reuso do `KpiGrid`. 22 indicadores: total ARTs, ARTs no ano, registradas, aguardando pagamento, vencidas, aptas baixa, baixadas, canceladas, invalidadas; valor emitido / pago / pendente / vencido; ticket médio ART, ticket médio taxa CREA, valor total contratos; top RT, top empresa, top cliente, CREA com maior custo, setor com maior volume, tag mais utilizada.

## Modelo de dados (migration única)

Tabelas novas (todas com `company_id`, `is_deleted`, soft delete via `crea_soft_delete`, RLS via `crea_can`):

- `crea_gov_arts` — fato central da ART (uma linha por ART). Campos:
  numero, uf, crea_codigo, tipo, natureza, participacao_tecnica, forma_registro,
  empresa_id, contratante_id, rt_id, proprietario, endereco, cidade, uf_obra, cep,
  observacao, atividades_texto, codigo_tos, quantidade, unidade_medida,
  valor_taxa, valor_pago, valor_contrato, centro_custo,
  data_cadastro, data_pagamento, data_vencimento, data_baixa,
  status_analise, status_baixa, status_financeiro, status_governanca,
  boleto_numero, arquivo_origem_id, raw jsonb (linha original), classificado_por,
  setor_principal_id, setor_ia_sugerido_id, escopo_id, escopo_ia_sugerido_id,
  duplicado_de uuid, hash_unico text (para dedupe).
- `crea_gov_art_atividades` — N atividades técnicas por ART (código TOS, qtd, unidade).
- `crea_gov_art_setores_extra` — N:N para setores secundários.
- `crea_gov_art_tags` — N:N com `crea_gov_tags`.
- `crea_gov_setores` — setor por empresa (nome, descricao, cor, status).
- `crea_gov_tags` — tag por empresa (nome, cor, regex sugerido).
- `crea_gov_escopos` — escopo operacional por empresa.
- `crea_gov_contratantes` — clientes/contratantes (nome, cnpj, cidade, uf).
- `crea_gov_pagamentos` — pagamentos/boletos importados (numero_boleto, valor, data, sacado, conciliado_art_id, status).
- `crea_gov_conciliacoes` — match boleto×ART (origem auto/manual, score, motivo, status).
- `crea_gov_alertas` — fila de exceções (tipo, criticidade, status, responsavel_id, art_id, prazo, historico jsonb).
- `crea_gov_importacoes` — runs de importação (arquivo, kind, total_linhas, ok, falhas, mapeamento jsonb, ran_by, status, log).
- `crea_gov_classificacao_regras` — regras de palavra-chave/regex por empresa (palavra, setor_id, tag_id, escopo_id, peso).
- `crea_gov_creas_config` — config por UF (layout_xls, regras_extracao jsonb, taxa_padrao, status, campos_personalizados jsonb).
- `crea_gov_user_filters` — preset de filtros por usuário.
- Reuso de `crea_companies_crea` (empresas/CREAs já existentes) e `crea_responsible_technicians` (RTs).

Índices em `(company_id, ano)`, `(numero, uf)`, `hash_unico` único parcial, `gin(raw)` para busca livre. Trigger `set_updated_at_generic`. RPCs:
- `crea_gov_dedupe_run(_company)` — recalcula `hash_unico` e marca duplicatas.
- `crea_gov_classify_run(_company, _art_ids)` — aplica regras + IA, grava sugestões sem sobrescrever.
- `crea_gov_conciliate_run(_company)` — gera matches em `crea_gov_conciliacoes`.
- `crea_gov_kpis(_company, _filters jsonb)` — agrega KPIs (usado pelos cards).

## Importação dos relatórios CREA

`ImportarRelatorioModal` (drag-drop) aceita `.xls/.xlsx/.csv/.pdf`. Pipeline:

1. **Upload** para bucket `crea-attachments/gov/<company>/`.
2. **Detecção**: edge function `crea-gov-import` lê cabeçalhos e classifica em: ARTs Todas, Genérico, Financeiro/Pagamentos, Profissional, Empresa, Contratante. Usa `crea_gov_creas_config.regras_extracao` para mapear colunas por UF (default = layout BA/SITAC observado: NÚMERO, DETALHE, ANÁLISE, BAIXA, BOLETO, PAGAMENTO, CADASTRO, EMPRESA, CONTRATANTE, ENDEREÇO, OBSERVAÇÃO).
3. **Parsing**: XLS/XLSX/CSV via `xlsx` (já no projeto). PDF: extração de tabelas via pdf.js + heurística por colunas (apenas para conferência visual; gera linhas em `crea_gov_pdf_paginas` com snapshot e link, sem importar dados financeiros do PDF salvo se XLS estiver ausente).
4. **Normalização** dos campos `Tipo / Participação Técnica / Forma de Registro` (string concatenada vista nos relatórios), datas pt-BR, valores BR.
5. **Upsert** por `(uf, numero)` com `hash_unico = sha1(uf|numero|cadastro|empresa)`.
6. **Vinculação** de RT, empresa e contratante (cria contratante se não existir; pergunta antes de criar empresa).
7. **Classificação** automática (motor abaixo).
8. **Run** registrado em `crea_gov_importacoes` com pré-visualização e botão "Reprocessar".

Edge functions necessárias:
- `crea-gov-import` — recebe storage path, faz parsing pesado e bulk insert.
- `crea-gov-conciliate` — roda conciliação automática.
- `crea-gov-ai` — Assistente IA (Lovable AI Gateway, modelo `google/gemini-2.5-flash`) com tool-calling para consultar `crea_gov_arts` via funções SQL parametrizadas (sem SQL livre).

## Motor de classificação automática

`src/modules/crea/lib/govClassifier.ts` aplica `crea_gov_classificacao_regras` (regex/palavra-chave por empresa) sobre `observacao + atividades_texto + codigo_tos` e devolve `{ setor_id?, tag_ids[], escopo_id? }` com score. Resultado vai para campos `*_ia_sugerido_*`. Usuário pode aceitar/alterar/remover via `ArtClassificacaoSheet`. Sugestões iniciais cadastradas: preventiva, corretiva, vistoria, laudo, torre, SPDA, fundação, montagem, desmontagem, estrutura metálica, reaperto, fibra, telecom, elétrica, civil. Empresa pode editar livremente.

## Conciliação financeira

Tela `ConciliacaoPage` com 3 listas: **Conciliados**, **Divergentes**, **Sem par**. Auto-match por (numero_boleto) → fallback (valor + janela de datas + sacado≈contratante). Confirmação manual em modal com side-by-side. Gera registro em `crea_gov_conciliacoes` e atualiza `status_financeiro` da ART.

## Auditoria de dados (Governança de Dados)

Lista de regras (`govRules.ts`) executadas sob demanda + agendadas: ART duplicada, ART sem pagamento, pagamento sem ART, ART sem empresa/RT/cliente/setor/tag/escopo, divergência financeira, ART cancelada/inválida ainda ativa, ART sem baixa, ART apta baixa, boleto vencido. Cada hit vira `crea_gov_alertas` com criticidade (low/med/high), responsável, SLA e histórico jsonb.

## CREAs Brasil

Tabela `crea_gov_creas_config` pré-populada com as 27 UFs (AC..TO). UI permite ajustar por UF: layout do XLS (mapeamento de colunas), regras de extração de PDF, taxa padrão, status (ativo/em homologação), campos personalizados, modelo de relatório.

## Permissões

Adicionar à tabela existente `crea_module_permissions`: `can_governance bool`, `can_governance_finance bool`, `can_governance_audit bool`, `can_governance_import bool`. Função `crea_can` ganha cases novos. Perfis sugeridos (preset no Admin CREA): Administrador OCS, Governança ART, Financeiro, RT, Empresa Cliente, Auditor, Visualizador.

## Componentes (frontend)

```text
src/modules/crea/governanca/
├── CreaGovernancaPage.tsx         (Tabs principal + FilterBar + Header)
├── GovArtFilterBar.tsx
├── GovKpis.tsx
├── tabs/
│   ├── VisaoExecutivaTab.tsx       (Recharts: barras/linhas/donut, drilldown)
│   ├── FinanceiraTab.tsx
│   ├── TecnicaTab.tsx              (DataTable + DataActionsToolbar + bulk)
│   ├── DadosAuditoriaTab.tsx
│   ├── EmpresasTab.tsx
│   ├── RtsTab.tsx
│   ├── ClientesTab.tsx
│   ├── SetoresTab.tsx              (CRUD)
│   ├── TagsTab.tsx                 (CRUD)
│   ├── EscoposTab.tsx              (CRUD)
│   ├── ImportacoesTab.tsx
│   ├── ConciliacaoTab.tsx
│   ├── AlertasTab.tsx
│   ├── CreasBrasilTab.tsx
│   ├── RelatoriosTab.tsx
│   └── AssistenteIaTab.tsx
├── modals/
│   ├── ImportarRelatorioModal.tsx
│   ├── ArtDetailGovSheet.tsx
│   ├── ArtClassificacaoSheet.tsx
│   ├── ConciliacaoManualModal.tsx
│   └── AlertaResolverModal.tsx
└── lib/
    ├── govClassifier.ts
    ├── govRules.ts
    ├── govKpis.ts
    └── govTypes.ts
```

Tabela técnica usa virtualização (`@tanstack/react-table` + janela manual já no padrão), seleção múltipla, exclusão em lote via `DeleteWithPasswordModal` + `crea_soft_delete('crea_gov_arts', …)` e export via `dataIO`.

## Assistente IA Governança ART

Edge `crea-gov-ai` recebe `{ company_id, question, filters }` e usa Lovable AI com **tool calling** estruturado para invocar funções pré-aprovadas (`kpis`, `top_rts`, `top_empresas`, `top_clientes`, `por_setor`, `pendencias`, `vencidas`, `aptas_baixa`, `divergencias`, `custo_por_dimensao`). A resposta inclui texto + dados estruturados que o frontend renderiza como gráfico (Recharts) ou tabela inline. Sem SQL livre, sem invenção de números.

## Plano de entrega (levas)

1. **Leva 1 — Fundação**: migration completa + permissões + rota + layout da aba com Tabs vazias e FilterBar.
2. **Leva 2 — Importação XLS/CSV** + tabela técnica + KPIs + Visão Executiva (gráficos).
3. **Leva 3 — Setores/Tags/Escopos (CRUD por empresa) + motor de classificação + ArtClassificacaoSheet**.
4. **Leva 4 — Financeira + Conciliação automática/manual + Pagamentos**.
5. **Leva 5 — Auditoria/Alertas + Empresas/RTs/Clientes panels**.
6. **Leva 6 — CREAs Brasil (config 27 UFs) + parsing de PDF para conferência**.
7. **Leva 7 — Relatórios gerenciais (xlsx/docx/pdf) + Assistente IA com tool-calling**.

Confirme que posso começar pela **Leva 1 (migration + esqueleto da aba)** que já habilita todo o resto.
