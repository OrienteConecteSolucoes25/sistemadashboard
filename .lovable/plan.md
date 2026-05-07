## Objetivo

NÃO FAÇA OUTRAS ALTERAÇÕES ALÉM DO QUE FOI PEDIDO.  
  
Reformular a sub-aba **"Nova solicitação"** (Engenharia → Solicitações de Materiais) com os campos do anexo, e criar no **Admin · Engenharia** uma nova aba **"Cadastros gerais"** que alimenta os selects. Sem mexer em outros módulos.

## 1. Admin · Engenharia → nova aba "Cadastros gerais"

Adicionar `<TabsTrigger value="cadastros">` em `EngAdminPage.tsx`. O conteúdo é um Tabs interno com 7 sub-abas:

- **Cliente** (com Centro de Custo associado)
- **Categoria** (com Comprador padrão e SLA dias opcionais)
- **SLA** (catálogo de prazos)
- **Centro de custo**
- **Tipo de solicitação**
- **Coordenador / Analista**
- **Escopo**

Cada uma usa um componente único `<CadastroSimplesCrud kind="..."/>` com:

- Tabela (valor + meta)
- Adicionar / Editar / Excluir (com confirmação)
- `**DataActionsToolbar**` (Importar xlsx/csv, Exportar xlsx/csv/docx, Modelo)

**Armazenamento:** reaproveitar `eng_field_options` (já existe e tem realtime via `useFieldOptions`). Cada cadastro = um `field_key` (`cliente`, `categoria`, `sla`, `centro_custo`, `tipo`, `coordenador`, `escopo`). Para metadados (Cliente↔CC, Categoria↔SLA/Comprador) adicionar coluna `meta jsonb`.

**Migração:**

```sql
ALTER TABLE public.eng_field_options
  ADD COLUMN IF NOT EXISTS meta jsonb DEFAULT '{}'::jsonb;
```

RLS já existente continua valendo.

**Seed inicial (uma única vez):** popular `eng_field_options` com as listas hard-coded de `lib/constants.ts` (`CLIENTES_CC`, `CATEGORIA_COMPRADOR`, `CATEGORIA_SLA`, `COORDENADORES`, `TIPO_SOLICITACAO`, `ESCOPOS_ENGENHARIA`, compradores) — feito via INSERT ... ON CONFLICT DO NOTHING.

## 2. Sub-aba "Nova solicitação" — refazer conforme anexo

Refatorar `SolicitanteTab.tsx` para o layout do print:

**Bloco "Dados gerais" (grid 2 colunas):**

- Tipo de solicitação* | Coordenador/analista*
- Cliente* | Centro de custo (auto, editável)
- Categoria* | Comprador (auto pela categoria, editável)
- Escopo de engenharia* | Site/obra* (datalist `eng_sites` — se não existir, cria em "Obras")
- Cidade* | UF
- Auxiliar (requisitante) | Data solicitação coordenador*
- Data limite entrega coordenador* | Técnico
- Endereço de entrega do material* (full width)
- Observações (textarea)
- Anexo (file)

**Bloco "Itens / Materiais (n)":**

- Descrição (busca no catálogo `useMateriais`) | Unidade | Qtd | + Adicionar
- Botão "Outros (novo material)" para item fora do catálogo
- Lista dos itens adicionados com remover

**Ações:** Enviar (grava em `eng_suprimentos` — campos extras vão em `data jsonb`) + Enviar por Outlook.

**Comportamentos automáticos:**

- Cliente escolhido → preenche Centro de custo do `meta.cc`
- Categoria escolhida → preenche Comprador (`meta.comprador`) e calcula SLA estimado (`meta.sla_dias`)
- Site digitado e inexistente → cria em `eng_sites` no envio (mantém autocreate atual)

## 3. Estrutura de arquivos

```text
src/modules/engenharia/
├── ui/
│   ├── EngAdminPage.tsx                  (+ TabsTrigger + TabsContent "cadastros")
│   ├── admin/
│   │   ├── CadastrosGeraisTab.tsx        (NEW) Tabs 7 cadastros
│   │   └── CadastroSimplesCrud.tsx       (NEW) tabela + form + DataActionsToolbar
│   └── SolicitanteTab.tsx                (REWRITE conforme anexo)
└── hooks/useFieldOptions.ts              (+ retornar { value, meta }[] opcional)
```

## 4. Pontos a confirmar

1. OK usar `eng_field_options` **+ coluna** `meta jsonb` para todos os 7 cadastros (em vez de 7 tabelas novas)? Me mostre como seria
2. OK fazer **seed automático** das listas legadas de `lib/constants.ts` na migração para já popular Cliente/Categoria/Coordenador/Escopo/Tipo? Para os clientes não porque eles tem diferentes pessoas e serviços nada de mokup
3. O **Anexo** da Nova Solicitação deve ser salvo no Storage (bucket novo `eng-suprimentos`) ou apenas anexado ao e-mail Outlook por enquanto? deve poder ser anexado em nova solicitação e quando apertarem em salvar deve mandar para a aba de solicitações como solicitação pendente de SC/RC.