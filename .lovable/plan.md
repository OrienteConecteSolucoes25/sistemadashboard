## Objetivo

Criar uma 5ª sub-aba de dados em **Governança ART** chamada **"ARTs (Todas)"**, com a mesma experiência (importar/exportar/modelo/novo/editar/excluir/paginação/scroll) das outras sub-abas, baseada na planilha enviada.

A planilha "ARTS (TODAS)" do CREA-PB tem exatamente 11 colunas:
`NÚMERO · DETALHE · ANÁLISE · BAIXA · BOLETO · PAGAMENTO · CADASTRO · EMPRESA · CONTRATANTE · ENDEREÇO · OBSERVAÇÃO`

## Mudanças

### 1. Banco (migration)

- Criar tabela `public.crea_gov_arts_todas` espelhando `crea_gov_servicos`:
  - Colunas: `id uuid pk`, `company_id uuid not null`, `numero`, `detalhe`, `analise`, `baixa`, `boleto`, `pagamento`, `cadastro`, `empresa`, `contratante`, `endereco`, `observacao` (todas `text`), + `is_deleted`, `deleted_at`, `deleted_by`, `delete_reason`, `created_by`, `updated_by`, `created_at`, `updated_at`.
  - Índices: por `company_id`, parcial `(company_id) WHERE is_deleted=false`, e por `numero`.
  - Trigger `update_updated_at_column`.
  - RLS habilitado com 4 policies (`select/insert/update/delete`) usando `crea_can(auth.uid(), company_id, ...)` — mesmas de `crea_gov_servicos`.
- Atualizar `crea_soft_delete`: adicionar `'crea_gov_arts_todas'` ao array `allowed`.

### 2. Schema de campos (`src/modules/crea/governanca/tabs/govFields.ts`)

- Adicionar `ARTS_TODAS_FIELDS` com as 11 colunas na ordem da planilha (`numero`, `detalhe`, `analise`, `baixa`, `boleto`, `pagamento`, `cadastro`, `empresa`, `contratante`, `endereco`, `observacao`). `detalhe`/`endereco`/`observacao` como `textarea full`. Mesma estrutura de `SERVICOS_FIELDS`.

### 3. Página (`src/modules/crea/governanca/CreaGovernancaPage.tsx`)

- Adicionar nova aba `arts_todas` no array `TABS` com label "ARTs (Todas)" e ícone (`ListChecks`).
- Adicionar `<TabsContent value="arts_todas">` com `<GovGenericTab table="crea_gov_arts_todas" title="ARTs (Todas)" description="Listagem completa de ARTs exportada do SITAC/CREA (NÚMERO, DETALHE, ANÁLISE, BAIXA, BOLETO, PAGAMENTO, CADASTRO, EMPRESA, CONTRATANTE, ENDEREÇO, OBSERVAÇÃO)." fields={ARTS_TODAS_FIELDS} labelKey="numero" />`.
- O `GovGenericTab` já entrega: importação adaptativa (preserva qualquer valor), exportação xlsx/csv/docx + modelo, paginação 50/100, scroll horizontal/vertical, exclusão com senha em lote.

### 4. Visão Executiva (`src/modules/crea/governanca/lib/govUnified.ts`)

- Incluir `fetchAll("crea_gov_arts_todas", companyId)` no `Promise.all` da função unificadora, marcando origem `"ARTs (Todas)"`. Assim a sub-aba Visão Executiva continua agregando todas as fontes (Serviços + ART por Bloco + Relatórios CREA + ARTs Todas).

### 5. Tipos

- Adicionar `'crea_gov_arts_todas'` ao tipo `CreaTable` em `src/modules/crea/lib/creaCrud.ts` e ao array `CREA_TABLES`.

## Não muda

- `GovGenericTab.tsx`, `creaCrud.ts mapAdaptive`, exportação/importação — tudo já é genérico e passa a funcionar nessa nova sub-aba sem ajustes.