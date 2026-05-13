## Situação

Duas dependências com vulnerabilidades **High** sem correção via `npm update`:

| Pacote | Status no npm | Uso no projeto |
|---|---|---|
| **xlsx** `^0.18.5` (SheetJS) | A versão no npm está congelada — correções só existem no CDN privado da SheetJS | ~25 arquivos (import/export Excel em Engenharia, CREA, Planos, Governança, Suprimentos, etc.) |
| **expr-eval** `^2.0.2` | Pacote **abandonado** — não há nova versão | 1 arquivo (`src/lib/formulaRuntime.ts`) usado pelo motor de fórmulas da Governança |

Como ambos não têm "fix version" no npm, atualizar via `bun update` **não resolve**. É preciso trocar de pacote ou trocar a fonte.

## Proposta (recomendada)

### 1. `expr-eval` → `expr-eval-fork` (drop-in, baixo risco)
- Fork ativo que corrige as duas advisories (Prototype Pollution + funções não restritas).
- API **idêntica**: muda só o `import { Parser } from "expr-eval-fork"` em `src/lib/formulaRuntime.ts`.
- Esforço: **~5 minutos**, sem regressão esperada.

### 2. `xlsx` (SheetJS) → `exceljs` (migração ampla, baixo risco funcional)
- `exceljs` é mantido, sem vulnerabilidades conhecidas e cobre todos os casos atuais (read/write `.xlsx`, headers, estilos).
- Toda a I/O Excel já passa por **3 utilitários centralizados**:
  - `src/lib/dataIO.ts` (export xlsx/csv/docx do `DataActionsToolbar`)
  - `src/lib/excelAdaptive.ts` (parse adaptativo de planilhas)
  - `src/components/ImportDataModal.tsx` (importação genérica)
- Os outros ~22 arquivos chamam essas libs, então a migração concentra-se nos 3 utilitários + ajustes pontuais nas telas que ainda usam `XLSX.utils.*` direto (Suprimentos, Materiais, Projetos Elaboração, CREA Importações/Empresas/RTs/ART, Fibra checklist, governance Dynamic Sheet, Planos visaoExports, sharepointSync, fibraChecklist, storage).
- Esforço: **moderado** (estimo 1–2 horas) — sem mudança visual nem de UX.

### 3. Verificação
- `bun run build` + abrir manualmente: exportar uma lista (Engenharia/CREA), importar um xlsx (Importação CREA), recalcular fórmula no Dynamic Sheet de Governança.
- Rodar nova varredura de segurança: as duas advisories devem sair da lista.

## Alternativas

- **B) Fixar `xlsx` via tarball SheetJS** (`https://cdn.sheetjs.com/xlsx-latest/xlsx-latest.tgz`) — corrige a vuln mas adiciona uma dependência fora do registro npm (auditorias futuras vão sinalizar de novo) e não funciona bem com `bun` em CI.
- **C) Ignorar a finding** — só faz sentido se você quiser aceitar o risco; explico aqui:
  - As duas vulns do xlsx exigem que o app **abra arquivos enviados por usuários não confiáveis**. Hoje só usuários autenticados (com permissão) importam planilhas. Risco prático = **médio**.
  - As do `expr-eval` exigem que um atacante consiga injetar a string da fórmula. Hoje só editores autenticados de Governança escrevem fórmulas. Risco prático = **baixo-médio**.

## Recomendação

Fazer **(1) + (2)** numa única leva e remover ambas as findings de vez. Posso começar pela troca rápida do `expr-eval-fork` e depois migrar o `xlsx → exceljs` nos 3 utilitários centrais.

Confirma que sigo por esse caminho?