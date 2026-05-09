
# Plano — Comunicação OCS (leva grande)

Vamos atacar tudo em uma leva organizada. Os itens estão agrupados por tema; a ordem da implementação seguirá A → H.

---

## A. Aba "Clientes & Marcas" (multi-marca)

Nova aba **`/app/comunicacao/clientes`** (substitui a Brand Kit atual como hub principal de identidade).

- Tabela `comm_client_brands` (por `company_id` da agência):
  - `nome_cliente`, `segmento`, `sobre`, `missao`, `visao`, `valores`
  - `tom_de_voz`, `persona`, `publico_alvo`, `proposta_valor`, `diferenciais`
  - `paleta` (até 4 cores), `tipografia`, `logo_url`, `cta_padrao`
  - `palavras_permitidas[]`, `palavras_proibidas[]`
  - `instagram`, `linkedin`, `tiktok`, `site`, `whatsapp`
  - `is_default` (1 por empresa)
- Cada cliente vira **automaticamente um Brand Kit** (registro espelhado em `comm_brand_kits` via trigger) — Posts/Carrossel/Newsletter passam a usar o brand kit do cliente selecionado.
- **Seletor global de cliente ativo** no topo do `ComunicacaoLayout` (Combobox persistido em `localStorage` + `user_layout_preferences`).
- Toda geração (posts, legendas, ideias, design) recebe o `client_brand_id` ativo.

## B. Fixes globais — botões e formulários quebrados

Auditoria completa de **todas as abas** (`ComunicacaoPages.tsx`, `ComunicacaoStudio.tsx`, Calendário, Posts, Legendas, Carrossel, Newsletter, Interna, Design Studio, Galeria IA, Campanhas, Produto, Ideias, Prompts, Aprovações, Publicações, Marca, Auditoria):

- Cada botão "Salvar / Gerar / Aprovar / Excluir / Exportar" terá handler real conectado a `comm-ai`, `comm-image-gen` ou Supabase.
- **Calendário Editorial**: corrigir `salvar item` (insert em `comm_editorial_calendar` com `company_id` + `client_brand_id`); adicionar campos opcionais **legenda** e **texto** (textareas) e link para Post/Carrossel/Newsletter já criado.
- **Gerador de Posts**: corrigir o seletor de Brand Kit (Combobox vazio) — popular a partir de `comm_client_brands` da empresa do usuário; pré-selecionar o cliente ativo.
- Padronizar feedback (`toast.success/error`) e `disabled` durante loading.

## C. Sino de notificações por módulo

`NotificationsBell` passa a aceitar `scope` (engenharia | juridico | comunicacao | crea | rhdp). O componente lê a rota atual (`useLocation`) e:
- Filtra `internal_notifications.modulo` pelo prefixo do módulo atual.
- Badge e dropdown só mostram itens daquele módulo.
- Em `/app` (home) mostra tudo.

## D. Sidebar global ERP OCS recolhível (igual módulos)

- `AppLayout.tsx` ganha botão de toggle (chevron) e largura `w-60 ↔ w-16`.
- Estado salvo em `user_layout_preferences` com `module_key='__root__'` (reaproveita hook `useUserLayoutPreference`).
- Quando recolhido: só ícones + tooltip; logo OCS minimalista.

## E. Design Studio — Grade Instagram + IA

Reescrita da página `DesignStudioPage`:

1. **Painel de configuração**: cliente ativo, **4 color pickers** (paleta), tipografia, estilo (minimal/vibrante/sério/divertido), formato (1:1, 4:5, 9:16).
2. **Upload opcional de referência**: imagem-modelo ou print de perfil (input file → base64) que vira contexto da geração.
3. **Botão "Gerar Grade 3x3"**: chama edge `comm-image-gen` 9 vezes (em paralelo, com `concurrency=3`) usando `google/gemini-3.1-flash-image-preview`. Prompt construído com:
   - Brand kit + paleta 4 cores + tipografia
   - Tipos rotativos (capa, citação, dica, produto, depoimento, CTA, bastidor, dado, série)
   - Instrução de coerência visual (mesma família tipográfica/elementos)
4. **Preview em grade 3x3** simulando feed do Instagram + botão por card: regenerar, baixar PNG, **publicar no calendário**, salvar em `comm_generated_designs`.
5. **Corrigir export PNG**: usar `html-to-image` em vez de `toBlob` direto (evita `Tainted canvas`); imagens vindas da IA são salvas no bucket `comm-generated-images` e servidas via signed URL com `crossOrigin="anonymous"`.

## F. Banco de Ideias com base na marca

- Botão "Gerar 10 ideias" usa `comm-ai` kind `ideia` passando o **brand kit do cliente ativo** (sobre, persona, público, proposta, diferenciais, palavras permitidas/proibidas).
- Ideias salvas em `comm_idea_bank` com `client_brand_id`, `categoria`, `prioridade`.
- Filtros por cliente, categoria e status (nova / em produção / publicada / descartada).
- Conversão 1-clique: "Virar Post", "Virar Carrossel", "Agendar no Calendário".

## G. Product Management (completar)

Página com sub-abas:
- **Roadmap** (kanban: Discovery / Backlog / Em produção / Lançado)
- **Posicionamento** (one-pager por produto: dor, ganho, persona, diferenciais)
- **Lançamentos** (campanha de lançamento, datas, peças)
- **Pesquisa** (NPS/feedback colado manualmente; resumo IA)
- **Métricas** (campos manuais + chart simples)

Tabela `comm_product_items` ganha colunas: `tipo`, `status_kanban`, `posicionamento`, `metricas` (jsonb), `pesquisa` (jsonb).

## H. Agente "Diretor de Comunicação OCS" (Pixel)

Personagem pixel na sala do escritório (módulo Pixel Office) + chat flutuante exclusivo dentro de `/app/comunicacao/*`.

### Backend
- Edge `comm-director-agent` (streaming, OpenAI-compatible via Lovable AI):
  - Lê **brand kit do cliente ativo**, calendário, posts, ideias, campanhas (filtra por `company_id` + `client_brand_id`).
  - Aceita modo **comunicação interna** com lista opcional de módulos autorizados (`engenharia`, `rhdp`, etc.) → faz read-only nas tabelas correspondentes para gerar comunicados internos.
  - **Tool calling** com ferramentas:
    - `criar_calendario_item`, `gerar_posts`, `gerar_carrossel`, `gerar_newsletter`, `gerar_comunicado_interno`, `gerar_ideias`, `criar_campanha`, `gerar_grade_design`
  - Cada tool insere registro real (respeitando `comm_can`) e retorna o id.
- Tabelas:
  - `comm_director_conversations` (id, user_id, company_id, client_brand_id, scope `externa|interna`, allowed_modules[])
  - `comm_director_messages` (conversation_id, role, content, tool_calls jsonb)
  - RLS: cada usuário só vê suas próprias conversas (privadas).

### Frontend
- Componente `DiretorAgentChat` (substitui o `AssistenteFloating` quando rota começa com `/app/comunicacao/`):
  - Markdown streaming, lista de conversas anteriores, seletor de cliente + escopo (Externa/Interna) + módulos liberados.
  - Quando uma tool roda, mostra card "Calendário criado · ver →" linkando para a aba.
- **Personagem Pixel**: novo NPC `diretor_comunicacao` no `PixelOfficeMap` com sprite próprio; ao clicar abre o chat (mesmo componente).
- Disponível para **todos os clientes** com acesso ao módulo Comunicação.

---

## Detalhes técnicos

```text
Migrations:
  + comm_client_brands (multi-marca por agência)
  + comm_director_conversations
  + comm_director_messages
  + alter comm_editorial_calendar add legenda text, texto text, client_brand_id uuid
  + alter comm_brand_kits add client_brand_id uuid (link)
  + alter comm_product_items add tipo, status_kanban, posicionamento jsonb, metricas jsonb, pesquisa jsonb
  + alter user_layout_preferences (já suporta module_key) — usar '__root__' p/ sidebar global
  + alter internal_notifications garantir coluna `modulo` (já existe? verificar; se não, adicionar)
  + RLS: comm_can(uid, company_id, action) já cobre — adicionar policies análogas para client_brands e director_*

Edge functions:
  + comm-director-agent (streaming + tool calling)
  ~ comm-ai já existe — manter, mas passar client_brand_id no payload
  ~ comm-image-gen já existe — adicionar parâmetro grid (1..9) p/ Design Studio

Frontend:
  + src/modules/comunicacao/ui/ClientesPage.tsx
  + src/modules/comunicacao/ui/ClientBrandSelector.tsx (no Layout)
  + src/modules/comunicacao/ui/DiretorAgentChat.tsx
  + src/modules/comunicacao/hooks/useActiveClientBrand.ts
  + src/modules/comunicacao/hooks/useScopedNotifications.ts
  ~ DesignStudioPage.tsx (reescrita)
  ~ CalendarioPage.tsx (fix salvar + legenda/texto)
  ~ PostsPage.tsx (fix Brand Kit Combobox)
  ~ ProductPage.tsx (sub-abas)
  ~ IdeiasPage.tsx (gerar com brand kit)
  ~ AppLayout.tsx (toggle global recolhível)
  ~ NotificationsBell.tsx (scope por módulo via rota)
  ~ ComunicacaoLayout.tsx (seletor de cliente + nova aba Clientes)
  + Pixel: NPC diretor_comunicacao (sprite + interação)

Fix runtime: SecurityError toBlob → trocar export PNG por html-to-image + crossOrigin nas <img>.
```

## Fora deste escopo (próxima leva, se quiser)

- Integração real com Instagram/Meta API para publicação automática
- Agendamento programado (cron real) — por ora ficam só no calendário
- Editor visual drag-and-drop de templates (vamos com presets)
