
# Recriação da aba ART — Módulo CREA & ART

## Objetivo
Apagar o modelo atual da aba ART e recriá-la espelhando a planilha enviada (`ART.xlsx`, aba "ART"), com formulário simples, lista em colunas e painel lateral só para datas do ciclo da ART.

## Modelo de dados (nova tabela `crea_art_obras`)

Campos da OBRA (linha da lista):

| Campo | Origem planilha | Obrigatório | Tipo |
|---|---|---|---|
| `obra` | SITE | sim | text |
| `tipo_obra` | CIVIL/ELETRICA | sim | enum (`civil`, `eletrica`) |
| `cidade` | Cidade | sim | text |
| `uf` | UF | sim | text(2) |
| `escopo` | Escopo | sim | text |
| `cliente` | Cliente | sim | text |
| `coordenador` | Coordenador | sim | text |
| `status` | STATUS | sim | enum (`pendente`, `em_andamento`, `concluida`, `cancelada`) |
| `observacao` | Observações | sim | text |
| `responsavel` | Responsável | **não** | text |

Campos do PAINEL LATERAL (datas — todos opcionais e editáveis):

| Campo | Origem planilha |
|---|---|
| `data_criacao_art` | Data de criação de ART |
| `data_validacao` | VALIDADA |
| `data_envio_pagamento` | ENVIADA P/PAGAMENTO |
| `data_pasta` | PASTA |

Padrões: `id`, `company_id`, `created_at`, `updated_at`, `is_deleted`, `deleted_at`, `deleted_by`, `deleted_reason` (mantém padrão soft-delete do módulo).

RLS: mesmas regras de `crea_arts` (escrita via `crea_can_edit(auth.uid())`, leitura por empresa).

## UI

### 1. Lista (substitui a aba ART atual)
- Colunas: Obra · Tipo · Cidade · UF · Escopo · Cliente · Coordenador · Status · Responsável · Observação.
- Cabeçalho: `DataActionsToolbar` (Exportar xlsx/csv/docx + Modelo + Importar) — colunas do modelo = exatamente os 10 campos acima.
- Seleção múltipla + `BulkActionsBar` + `DeleteWithPasswordModal` (padrão do projeto).
- Clicar na célula "Obra" abre o painel lateral.

### 2. Formulário "Nova obra" (Dialog)
- Campos na ordem pedida: Obra, Cidade, UF (select 27 UFs), Tipo (Civil/Elétrica), Escopo, Cliente, Coordenador, Status (select), Observação, Responsável (opcional).
- Validação: todos obrigatórios exceto Responsável.

### 3. Painel lateral (Sheet) ao clicar numa obra
- Cabeçalho com nome da obra + cidade/UF.
- Seção "Datas do ciclo" com 4 date-pickers (criação, validação, envio p/ pagamento, pasta) — cada um com botão "Limpar".
- Botões: Salvar / Excluir obra (com `DeleteWithPasswordModal`).

### 4. Importação / Exportação
- Importação aceita exatamente os cabeçalhos da planilha (`SITE, CIVIL/ELETRICA, Cidade, UF, Escopo, Cliente, Responsável, STATUS, Data de criação de ART, VALIDADA, ENVIADA P/PAGAMENTO, PASTA, Coordenador, Observações`) — mapeia para os campos novos.
- Datas vão direto para os campos do painel lateral.
- Exportação reproduz o mesmo layout (mesma ordem de colunas) para reimportar sem fricção.

## Limpeza do modelo antigo
- Remover/desativar componentes específicos da aba ART antiga: `ArtDetailSheet.tsx` (será substituído por novo `ObraArtSheet.tsx`), entrada de ARTs em `creaCrudConfigs.ts`/`CreaPages.tsx`, e qualquer rota/aba que apontava para `crea_arts` lista bruta.
- A tabela `crea_arts` **permanece no banco** (intocada) — apenas a UI é trocada. A aba Governança ART continua independente.

## Arquivos a criar / mudar

```text
NOVOS
  src/modules/crea/art/
    ArtObrasPage.tsx              # lista + toolbar + dialog novo + abre sheet
    ObraArtSheet.tsx              # painel lateral com as 4 datas
    NovaObraDialog.tsx            # form de criação/edição
    lib/artObrasApi.ts            # CRUD + import/export mapper
    lib/artObrasTypes.ts          # tipos + enums + headers da planilha

ALTERAR
  src/modules/crea/ui/CreaPages.tsx        # rota da aba ART aponta p/ ArtObrasPage
  src/modules/crea/ui/CreaLayout.tsx       # rótulo "ART" (mantém)
  src/modules/crea/ui/crud/creaCrudConfigs.ts  # remove config da ART antiga
  mem://features/crea-module.md            # registrar nova tabela e fluxo

REMOVER (ou marcar deprecated)
  src/modules/crea/ui/ArtDetailSheet.tsx   # substituído
```

## Migração SQL (resumo)
- `create type crea_art_tipo_obra as enum ('civil','eletrica');`
- `create type crea_art_status as enum ('pendente','em_andamento','concluida','cancelada');`
- `create table public.crea_art_obras (...)` com colunas acima + auditoria.
- RLS: SELECT por empresa do usuário; INSERT/UPDATE/DELETE com `crea_can_edit(auth.uid())`.
- Índices: `(company_id, is_deleted)`, `(company_id, status)`, `(uf)`.
- Trigger `update_updated_at_column`.

## Fora do escopo desta etapa
- Não mexe em Governança ART (`crea_gov_*`) — segue como está.
- Não mexe em `crea_arts` legado nem na auditoria existente.
- Sem IA, sem dashboards novos, sem cruzamento automático.

Pronto para implementar ao aprovar.
