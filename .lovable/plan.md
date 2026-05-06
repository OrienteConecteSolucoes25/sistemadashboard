Vou organizar em **3 levas** porque são 3 frentes distintas. Confirma e eu sigo na ordem (ou diga qual priorizar primeiro).

---

## Leva 1 — Planos de Usuários: Gestão de Acessos + Calculadora

**A. Painel lateral da Empresa (sub-aba Empresas)**

- Clicar no nome da empresa abre `Sheet` lateral com 3 abas:
  - **Usuários**: lista de `company_users` + botão "Adicionar usuário" (busca por e-mail nos `profiles`, vincula ao `company_id`, marca `is_company_admin` opcional)
  - **Permissões V/E/D**: matriz usuário × módulo do plano (já existe parcial no modal — migrar pra cá com toggles can_view/can_edit/can_delete em `company_module_permissions`)
  - **Plano & Valor**: módulos selecionados + valor calculado automaticamente em tempo real

**B. Nova sub-aba "Calculadora de Pagamentos"** em `/app/planos`

- Tabela editável OCS-only:
  - `valor_por_usuario` (base mensal por seat)
  - `valor_por_modulo` (preço de cada módulo do `plan_modules_catalog`)
- Salvos em nova tabela `plan_pricing_config` (linha única)
- Preview por empresa: `total = nº_usuários × valor_usuário + Σ(módulos_ativos × preço_módulo)`
- Botão "Aplicar a todas as empresas" → atualiza `company_plans.valor_mensal`
- Auto-update do `valor_mensal` da empresa quando muda módulos ou usuários

**C. Corrigir Assistente Oriente**

- Atualizar prompt do edge `ai-assist` apontando rotas reais: `/app/planos` → abas Empresas, Pagamentos, Catálogo, Calculadora; `/app/minha-empresa` para clientes
- Remover referência fantasiosa ("Configurações do Sistema / Gestão de Acessos")

**Migration:**

- `plan_pricing_config(id, valor_por_usuario numeric, precos_por_modulo jsonb, updated_at, updated_by)` — RLS só `is_financeiro_ocs`  
  
**C. Deve ter uma coluna de integrações onde cada integração custará um valor também como serviço a mais.**

---

## Leva 2 — Visão Geral repaginada (substitui "Dashboard")

- Já existe `/app/visao-geral`. Adicionar:
  - **Filtros no topo**: Select Módulo (das abas do plano) · Select Ano · Select Mês
  - **Toolbar de exportação** (4 botões):
    - Excel (xlsx via `dataIO`)
    - Word (docx — relatório gerencial com KPIs + tabelas por módulo)
    - PowerPoint (pptx — 1 slide por módulo, KPIs em destaque)
    - Power BI (CSV padronizado pronto pra import + breve instrução; export `.pbix` nativo exige licença Microsoft, então entrego o CSV consumível)
  - **Branding por empresa** aplicado nos relatórios Word/PPT:
    - Nova tabela `company_branding (company_id, logo_url, papel_timbrado_url, cor_primaria)`
    - Upload em "Minha Empresa" (admin da empresa) e em `/app/planos` (OCS)
    - Storage bucket `company-branding`
- Filtros aplicados a cada `ModuleCard` (passa ano/mês para o query)
- Sidebar: já está "Visão Geral" — confirmo rotulagem em todos os lugares

---

## Leva 3 — Módulo Sites → Obras (revamp completo)

Seguindo a spec detalhada que você colou. Como o backend usa `eng_sites` (e várias tabelas referenciam `site_id`), **mantenho o nome no banco** mas troco TODA a UI pra "Obras" — sem quebrar integrações.

**Renomeação na UI:**

- Sidebar/títulos/subtítulos: "Sites" → "Obras"
- Labels "código" → "Obra ID"
- Toda copy "site/sites" → "obra/obras"

**Nova `ObrasPage**` (substitui o CRUD genérico de eng.sites):

- Cabeçalho: título "Obras" + subtítulo "Cadastro e visão integrada por obra"
- `DataActionsToolbar` (Importar / Modelo / Exportar — já global)
- Botão "Nova obra" → modal exatamente como sua imagem (Nome*, Endereço, Cidade*, UF*, CEP, Maps, Lat/Long, Acionamento, Entrega, Valor)
- Validação: nome único case-insensitive
- Busca em tempo real (nome/cidade/UF/CEP/endereço)
- Tabela: Nome | Cidade/UF | Endereço | Acionamento | Entrega | Valor | Ações
- Click linha → `Sheet` lateral `ObraDetail`
- Confirmação destrutiva (usar `DeleteWithPasswordModal` existente)

`**ObraDetail` (painel 360°):**

- KPIs: Cadastrado · Governança · Custos lançados · Variação % (verde/vermelho)
- Cards de vínculos (filtrados pelos módulos do plano da empresa via `useUserModules`):
  - Projetos (`eng_projetos_elaboracao`)
  - ARTs (`eng_art`)
  - Solicitações/SCRC (`eng_solicitacao_sc_rc`)
  - Energia (`eng_ligacoes_energia`)
  - Governança (`eng_governanca_master`)
  - Fibra (`eng_fibra_obras`), Suprimentos, RFI, Pendências, Demandas — extensível via Passo A/B/C da spec
- Bloco Custos: Pizza recharts + lista + Lançar/Editar (tabela `eng_site_costs` já existe)
- Realtime em `eng_site_costs` (já no hook `useObraVinculos`)
- Reaproveito o hook existente `src/modules/engenharia/hooks/useObraVinculos.ts` que já está 80% pronto

**Migration:**

- Adicionar à `eng_sites` os campos da spec: `endereco`, `cep`, `maps_url`, `trigger_date`, `delivery_date`, `total_value`
- UNIQUE INDEX case-insensitive em `LOWER(nome)`

**Auto-create:** já existe `ensureSite` e `ensureSiteByCodigo` — manter.  
  
Crie o módulo "Obras" exatamente como descrito: É um módulo central que serve como integrador de todos os outros módulos do sistema que os usuarios escolherem, usando o NOME DA OBRA como chave de ligação.

1. Banco de dados (Lovable Cloud / Supabase)

Crie duas tabelas:

Tabela `sites` (cadastro de obras):

- `id` uuid PK default gen_random_uuid()

- `name` text NOT NULL UNIQUE (case-insensitive)

- `address` text

- `city` text

- `state` text (UF, 2 letras)

- `latitude` numeric

- `longitude` numeric

- `cep` text

- `maps_url` text

- `trigger_date` date (acionamento)

- `delivery_date` date (entrega prevista)

- `total_value` numeric default 0

- `created_at`, `updated_at` timestamptz

Tabela `site_costs` (lançamentos de custo por obra):

- `id` uuid PK

- `site_id` uuid FK → sites(id) ON DELETE CASCADE

- `site_name` text (redundante p/ busca quando site_id ainda não existe)

- `categoria` text NOT NULL (Material, Mão de obra, ART/Taxas, Equipamento, Transporte, Hospedagem/Alimentação, Combustível, Locação, Subcontratado, Outros)

- `descricao` text

- `valor` numeric NOT NULL

- `data_lancamento` date

- `origem` text default 'manual' (manual | art | governanca | suprimentos)

- `origem_id` text

- `observacao` text

- `created_at` timestamptz

RLS:

- `sites`: SELECT/INSERT/UPDATE para usuários autenticados; DELETE só para admin.

- `site_costs`: SELECT/INSERT/UPDATE para autenticados; DELETE só para admin (use função `has_role(auth.uid(),'admin')`).

Habilite Realtime na tabela `site_costs`.

2. Página principal `/app/sites` (rota TanStack)

Listagem em tabela com colunas: Nome | Cidade/UF | Endereço | Acionamento | Entrega prevista | Valor total | Ações (editar/excluir).

- Campo de busca por nome/cidade/UF/CEP/endereço.

- Botão "Nova obra" abre Dialog com formulário (nome, endereço, cidade, UF* via Select com 27 estados, CEP, link Google Maps, latitude, longitude, data de acionamento, data de entrega, valor total).

- Validar duplicidade de nome (case-insensitive) antes de salvar.

- Botão Importar/Exportar Excel (colunas: Nome, Endereço, Cidade, Estado, Latitude, Longitude, CEP, Maps URL, Acionamento, Entrega, Valor).

- Clique na linha abre Sheet lateral com ``.

- Confirmação destrutiva ao excluir.

- Ao final da página, incluir abas dinâmicas configuráveis pelo admin (``).

## 3. Componente `` (painel lateral 360°)

Recebe `site` e `onEdit`. Usa o hook `useObraVinculos(site.name, site.id)`.

**Cabeçalho (Card):** Cidade/UF, endereço, e 3 KPIs em grid: **Cadastrado | Governança | Custos lançados** (todos em R$). Abaixo, linha resumo:  

`Total real (gov+custos): R$ X — variação +Y% vs cadastrado` (verde se ≤0, vermelho se >0). Botão "Editar dados".

**Fórmula da variação:**

```

totalGeral = somatório(valor_total_atividade dos govs) + somatório(site_costs.valor)

variacao = ((totalGeral - [sites.total](http://sites.total)_value) / [sites.total](http://sites.total)_value) * 100

```

**Seções de vínculos** (cards empilhados, mostram contagem no título):  
  
Vai depender de quais modulos a empresa escolheu para o usuario mas segue o exemplo:

- **Projetos** — de `projetos_elaboracao` WHERE site ILIKE name → cliente, escopo, projetista, prazo, status, badge dentro/fora prazo.

- **ARTs** — do localStorage `ocs_arts` filtrado por siteObra → número, tipo, cliente, custo, status.

- **Solicitações** — do localStorage `ocs_solicits` filtrado por siteObra → categoria, escopo, cliente, data, status.

- **Energia** — de `shared_records` kind`energia_solic` filtrado por [data.site](http://data.site) → concessionária, protocolo, data, status.

- **Governança** — de `governance_records` WHERE site ILIKE name → serviço, cliente, % conclusão campo, valor, status_bi e status_atividade.

Cada item tem badge de status colorido (verde concluído/aprovado/pago, vermelho cancelado/vencido, cinza pendente/aguardando).

**Bloco Custos da obra:**

- Botão "Lançar" abre Dialog (categoria via Select, descrição, valor, data, observação).

- Gráfico Pizza (recharts) com distribuição por categoria + legenda lateral com valores e total.

- Lista de lançamentos (badge categoria, descrição, data/origem, valor, editar, excluir).

- Realtime: ao inserir/atualizar/deletar `site_costs`, recarrega automaticamente.

## 4. Hook `useObraVinculos(siteName, siteId)`

Retorna: `{ loading, refresh, projetos, govs, energias, solicits, arts, costs, totalCustos, custosPorCategoria, valorGovTotal }`. Faz queries em paralelo nas tabelas listadas acima e ouve canal realtime de `site_costs`.

Exporte também:

```ts

export const CATEGORIAS_CUSTO = ["Material","Mão de obra","ART / Taxas","Equipamento","Transporte","Hospedagem / Alimentação","Combustível","Locação","Subcontratado","Outros"] as const;

```

## 5. Auto-criação de obra `ensureSite({name, city, uf})`

Função utilitária em `src/lib/siteAutocreate.ts`: ao salvar qualquer registro de outro módulo (ART, Atividades, Energia, Solicitações…) que mencione um site, verificar se existe em `sites` (ILIKE) e, se não, criar automaticamente.

## 6. Componente ``

Input com `` de autocomplete listando todas as obras. Ao digitar um nome existente, preenche cidade/UF automaticamente via callback `onChange({site, cidade, uf})`. Mostra dica "Se já existe, cidade/UF preenchem automaticamente. Caso contrário, será criado em Obras."

Use shadcn/ui (Card, Dialog, Sheet, Table, Select, Input, Button, Badge), recharts para gráfico, sonner para toasts, lucide-react para ícones (Plus, Pencil, Trash2, Search). Tudo em português BR, formatação de moeda `pt-BR`/BRL.

&nbsp;

Criar modal de exclusão

Implementar lançamento de custos

Ativar exportação Excel

Integrar auto-criação de obras

Construir painel com KPIs

---

## Tamanho

Estimo ~2 levas por mensagem se eu trabalhar focado. Posso fazer **Leva 1 inteira agora** (é a que destrava o Assistente errado e o que você pediu primeiro).

### Pergunta rápida (para Leva 2)

- **Power BI**: aceita CSV padronizado + template `.pbit` simples (gerado por mim)? se aceitar no power bi da microsoft oque sera uma nova integração futura A licença `.pbix` nativo é Microsoft.

&nbsp;