## Parte A — Leva 3: Mapa-escritório com zonas nomeadas

Refinar o piso para parecer um escritório corporativo dividido por setores (estilo OpenClaw), sem mexer em dados/RLS.

**Arquivos:** `src/modules/pixel/renderer/PixelOfficeMap.tsx`, `src/modules/pixel/renderer/PixelOfficeDecorations.tsx`, `src/modules/pixel/core/pixelOfficeTheme.ts`, `src/modules/pixel/engine/pixiMap.ts`.

**O que muda no chão:**

1. Substituir o piso liso por **9 zonas nomeadas** com tonalidade própria (opacidade ≤ 0.18) e etiqueta discreta no canto:
  - Recepção · Sala de Reuniões · Mesas Operacionais · Diretoria · Sala Técnica/TI · Jurídico · Engenharia · Café/Lounge · Sala dos Agentes (NPCs)
2. **Paredes pseudo-iso** (faixas verticais escuras nas bordas) para dar sensação de dentro de um prédio.
3. **Tapetes setoriais** com padrão checker bem sutil (sem borda dashed — aprendido na leva anterior).
4. **Decorações ambientais** ampliadas: vasos com plantas, quadros na parede, divisórias pixel art entre zonas, monitores nas mesas técnicas, sofá no café, mesa de reuniões com 6 cadeiras.
5. **Iluminação suave**: gradiente radial mais quente no centro de cada sala (apenas DOM/SVG, sem custo extra).
6. **Mesma arte no DOM e no PixiJS** — o `pixiMap` ganha as mesmas zonas/etiquetas para que o canvas e o fallback fiquem visualmente iguais.

**Restrições:** sem novas tabelas, sem mexer em RLS, sem alterar o tamanho do mapa (`STAGE_WIDTH_TILES × STAGE_HEIGHT_TILES`), sem quebrar mesas/avatares já posicionados.

---

## Parte B — Plano do módulo Soluções-Verso (agentes-bônus, sem créditos do cliente, multi-tenant)

### Objetivo

Transformar os agentes que ja temos em agentes para cada módulo do ERP (Engenharia, Jurídico, RH/DP, CREA, Financeiro, TI, Comunicação, Marketplace, Planos…) eles continuaram no modulo Soluçõews-Verso mas cada um agente consegue ler o seu modulo especifico e assim cada modulo ganha um **agente Pixel próprio** que:

- Aparece no Soluções-Verso como NPC interativo.
- Conhece todas as **abas, sub-abas, telas, KPIs e ações** do seu módulo (knowledge base estática + introspecção das tabelas do módulo).
- Lê **somente os dados da empresa do cliente logado** (multi-tenant isolado por RLS já existente).
- **Não consome créditos do cliente** — todo custo de IA é absorvido pela OCS, com cota controlada pelo dono do sistema.

### B1 — Multi-tenant: como garantir que o agente só vê dados do cliente

Já existe RLS por `empresa_id` nas tabelas de cada módulo (eng_*, jur_*, hrdp_*, crea_*…). O isolamento é garantido fazendo **todas as leituras do agente passarem pelo Supabase com o JWT do usuário** (nunca com `service_role`):

```text
[Cliente A logado] → edge "verso-agent" → cria client supabase com Authorization do usuário
                                       → SELECT * FROM eng_obras  (RLS aplica empresa_id=A)
                                       → manda só esse recorte como contexto pro modelo
```

Cliente B nunca aparece porque o RLS bloqueia na origem. Nada de SQL livre — o agente usa **tool-calling com lista fechada de funções** (ex.: `listar_obras`, `kpis_juridico`, `pendencias_rh`), cada uma com filtro por usuário.

### B2 — Agentes sem créditos do cliente: arquitetura de cota OCS

Hoje cada chamada gasta créditos da workspace dona (sua). O risco é um cliente "queimar" seu saldo. Solução em três camadas:

1. **Tabela `verso_agent_quota**` (por empresa cliente) com `mensagens_usadas_mes`, `limite_mensal`, `data_reset`. RLS: admin OCS lê tudo, cliente lê só o próprio.
2. **Edge `verso-agent` checa cota antes de chamar IA**:
  - Se cliente passou do limite mensal → responde com fallback determinístico ("Limite do mês atingido — fale com o admin OCS para ampliar") **sem chamar IA**.
  - Se OCS estiver sem créditos no Lovable AI Gateway → mesma mensagem para o cliente, alerta interno para você.
3. **Modelo barato por padrão** (`google/gemini-3-flash-preview`) e cache de respostas frequentes por (módulo, pergunta normalizada) numa tabela `verso_agent_cache` válida por 24h — reduz drasticamente o consumo.

Resultado: cliente **nunca** vê pedido de saldo; quem controla o custo é você via cota e modelo.

### B3 — Conhecimento de cada módulo (como o agente "sabe" tudo)

Para cada módulo, criar um arquivo `src/modules/<mod>/agent/knowledge.ts` exportando:

```ts
export const ENGENHARIA_KNOWLEDGE = {
  module_key: "engenharia",
  display_name: "Engenheiro OCS",
  rotas: [
    { path: "/app/engenharia/obras", label: "Obras", desc: "Lista, kanban e timeline de obras" },
    { path: "/app/engenharia/projetos", label: "Projetos", desc: "..." },
    // ...todas as abas/sub-abas
  ],
  conceitos: ["RFI", "ART", "Pendência", "Site"],
  acoes: ["criar obra", "vincular RT", "exportar planilha"],
  tools: ["listar_obras", "kpis_engenharia", "obras_atrasadas"],
};
```

A edge concatena esse knowledge no system prompt + define os `tools` correspondentes. Assim o agente **sabe explicar abas/sub-abas mesmo sem dados** e **lê dados reais** quando o cliente pergunta "quantas obras tenho atrasadas?".

### B4 — Agentes previstos (1 por módulo)


| NPC                        | Módulo      | Tools de leitura                                                                                                                                                                                                                                                                                                                                                    |
| -------------------------- | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Engenheiro OCS             | engenharia  | obras, projetos, RFIs, pendências, sites                                                                                                                                                                                                                                                                                                                            |
| Consultor Jurídico OCS     | juridico    | processos, prazos, contratos                                                                                                                                                                                                                                                                                                                                        |
| Diretora de RH/DP OCS      | rhdp        | colaboradores, ferias, folha, beneficios                                                                                                                                                                                                                                                                                                                            |
| Analista CREA/ART OCS      | crea        | RTs, ARTs, conciliações                                                                                                                                                                                                                                                                                                                                             |
| Conselheira Financeira OCS | financeiro  | contas, faturas, KPIs                                                                                                                                                                                                                                                                                                                                               |
| Suporte TI OCS             | ti          | chamados, status                                                                                                                                                                                                                                                                                                                                                    |
| Diretor de Marca OCS       | comunicacao | posts, campanhas, métricas                                                                                                                                                                                                                                                                                                                                          |
| Curador Marketplace OCS    | marketplace | lojas, produtos                                                                                                                                                                                                                                                                                                                                                     |
| Gestor de Planos OCS       | planos      | empresas, módulos, valores (admin-only)                                                                                                                                                                                                                                                                                                                             |
| Jarbas (geral)             | global      | É como se fosse o co-funder do ERP OCS, ele lê tudo consegue vê se os agentes e os modulos estão funcionando direito, quais erros esta dando, propoe soluções dentro da sua aba para o admin e os funcionarios da ERP OCS e aplica as soluções mesmo que seja preciso mudar o codigo porém só aplica sobre aprovação além de (router que pergunta a outros agentes) |


### B5 — Mudanças no Soluções-Verso (UI)

- Adicionar **NPC dedicado por módulo** dentro do mapa (Sala dos Agentes da Leva 3) — só aparecem para empresas que têm o módulo contratado (lê `useUserModules`).
- Sub-aba **"Meus Agentes"** no Soluços-Verso listando: nome, módulo, status (online/limite atingido), botão "Conversar".
- Sub-aba **"Configurar Agentes" (admin OCS-only)**: definir cota mensal padrão e por empresa, ativar/desativar agente por módulo, ver consumo.
- Reaproveitar o `ModuleAgentChat` já existente — só trocar o `edgeFunctionName` para `verso-agent` e passar `module_key`.

### B6 — Backend novo

```text
supabase/functions/verso-agent/index.ts          ← edge unificada
supabase/migrations/<ts>_verso_agents.sql        ← tabelas abaixo
src/modules/pixel/agents/knowledge/<modulo>.ts   ← knowledge por módulo
src/modules/pixel/agents/tools/<modulo>.ts       ← tool definitions + handlers
```

**Tabelas novas:**

- `verso_agent_quota(empresa_id, mensagens_usadas_mes, limite_mensal, data_reset)` — RLS: cliente lê só própria; admin OCS lê tudo.
- `verso_agent_cache(module_key, question_hash, answer, expires_at)` — sem RLS pesado, é cache compartilhado de respostas genéricas (não inclui dados de cliente).
- `verso_agent_audit(empresa_id, user_id, module_key, prompt, tools_used, tokens_in, tokens_out, created_at)` — auditoria, admin OCS lê tudo.

**Edge function `verso-agent**` (fluxo):

1. Lê JWT do usuário → resolve `empresa_id` via `pixel_profiles` ou `planos_empresa_users`.
2. Checa `verso_agent_quota` da empresa → se estourou, responde fallback **sem IA**.
3. Verifica cache (`verso_agent_cache`) para perguntas genéricas — se hit, devolve direto.
4. Monta system prompt com `KNOWLEDGE[module_key]` + lista de `tools` do módulo.
5. Chama Lovable AI (`google/gemini-3-flash-preview`) com tool-calling.
6. Para cada tool chamada, executa o handler que faz `supabase.from(...).select(...)` **com o JWT do usuário** (RLS isola por empresa).
7. Retorna resposta + grava em `pixel_agent_messages`, incrementa cota e auditoria.

### B7 — Riscos e mitigação

- **Vazamento entre clientes:** mitigado por RLS + tools fechadas + nunca usar `service_role` na leitura de dados de negócio.
- **Custo descontrolado:** mitigado por cota mensal por empresa + cache + modelo flash + fallback determinístico.
- **Agente "alucinando" sobre abas inexistentes:** knowledge estático versionado por módulo, system prompt explícito "se não está na lista de rotas, diga que não existe".

---

## Ordem de execução proposta

1. Implementar **Leva 3** agora (Parte A — só visual, sem backend).
2. Aprovado o visual, partir para a **Parte B em sub-levas**:
  - B-1: tabelas `verso_agent_*` + edge `verso-agent` com 1 módulo de prova (Engenharia).
  - B-2: knowledge + tools dos demais módulos.
  - B-3: UI "Meus Agentes" + "Configurar Agentes" no Soluções-Verso.
  - B-4: NPCs no mapa por módulo contratado.

Tudo fica em PT-BR, dentro dos tokens HSL do design Oriente, sem quebrar nada do que já existe. Após sua aprovação, executo Leva 3 imediatamente e na sequência o B-1.