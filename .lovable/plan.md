
# Auditoria — Automações faltantes no ERP OCS

Comparação dos 3 projetos: **ERP OCS** (destino), **Oriente Conecte** (origem 1) e **Justice Reimagined / Sistema Jurídico** (origem 2).

## 1. O que JÁ existe no ERP OCS

- Módulos UI migrados: Engenharia (Sites, Atividades, Demandas, RFI, Pendências, Energia, ART, Equipes, Materiais, Relatórios, Emails, Integrações, Roadmap, Configurações, Fibra, Suprimentos, Projetos, Governança) e Jurídico (Processos, Prazos, Tarefas, Documentos, Responsáveis, Relatórios).
- Backend: tabelas `eng_*` com RLS via `eng_can_edit`, função `eng_log_audit`, tabela `eng_auditoria`.
- Lib client: `sharedStore.ts` (com `fireAudit` + `scheduleSpSync`), `audit.ts`, `sharepointSync.ts`.
- Edge function: apenas `admin-bulk-create-users`.
- Sem assistentes flutuantes, sem sino de notificações, sem agregador de pendências, sem fluxos de e-mail/WhatsApp, sem edge functions de IA.

## 2. O que existe na ORIGEM e NÃO foi migrado

### Oriente Conecte (701827c5)
Edge functions ausentes no destino:
- `roadmap-ia` (assistente IA + gerador de roadmap, Lovable AI Gateway)
- `robozinho-edit` (IA de sugestão de edição com auditoria em 2 etapas)
- `generate-governance-report`, `gov-resumo-executivo`
- `sharepoint-sync`, `sharepoint-list-create`

Componentes/automações UI ausentes:
- `AssistenteFloating` (chat IA + voz pt-BR via Web Speech API)
- `RobozinhoFloating` (IA de edição estrutura/dados com log)
- `NotificationsBell` (sino global, agrega prazos vencidos/próximos de 7 fontes em polling 60s)
- `PendenciasAggregator` (card que agrupa pendências por responsável em 7 módulos)
- `EnviarOutlookRcDialog` (gera e-mail Outlook/mailto com tabela HTML, registra envio)
- `useModulePermissions` (gate `can(modulo, action)`)
- `siteAutocreate.ts` (cria site automaticamente quando referenciado)
- `robozinho.ts` lib client

### Justice Reimagined (75ca46b4)
Edge functions ausentes:
- `ai-assist` (chat IA jurídico via Lovable AI Gateway)

Componentes/automações UI ausentes:
- `AIAssistant` + `AIFab` (assistente de extração de contratos a partir de Word/Excel)
- Modais `WAModal` e `MailModal` (envio WhatsApp via `wa.me/...` + envio Outlook)
- Botões por linha: WhatsApp, E-mail, com mensagem pré-preenchida e log
- Cálculo automático de `statusGeral`/`statusFinal` (Apto/Bloqueado/Pendente) ao salvar Empresa/Colaborador
- Alertas de Dashboard (contratos vencidos/a vencer, ASOs vencidos)
- Log de ações em audit por toda mudança (`st.log(...)`)

## 3. Tabela comparativa origem × destino

| Origem | Módulo / Aba | Automação | Tipo | Gatilho | Ação | Backing | No OCS? | Falta | Prioridade |
|---|---|---|---|---|---|---|---|---|---|
| Oriente | Global | Sino de notificações | Notificação interna | Polling 60s | Lista prazos vencidos/próximos de 7 módulos | tabelas `eng_*` | Não | Componente + lógica | **P1** |
| Oriente | Atividades | Pendências por responsável | Notificação interna | Polling 90s | Agrupa pendências de 7 módulos por pessoa | `eng_*` | Não | Componente | **P1** |
| Oriente | Suprimentos / SC-RC | Vínculo solicit ↔ SC/RC | Vínculo entre abas | Insert/update | Atualiza solicit ao alterar SC-RC | `eng_solicitacao_sc_rc` | Parcial (tabela existe, sem trigger UI) | Hooks + atualização cruzada | **P1** |
| Oriente | Status de qualquer módulo | Auto-criação de tarefa ao mudar status | Mudança de status | Update `status` | Insere em `eng_atividades` | `eng_atividades` | Não | Trigger client/server | **P1** |
| Oriente | Sites | Auto-criação de site ao referenciar | Vínculo entre abas | Insert atividade/projeto com site novo | Cria `eng_sites` | `eng_sites` | Não | Lib `siteAutocreate` | **P1** |
| Oriente | Suprimentos | Enviar Outlook (RC/SC) | Outlook | Botão | Abre `ms-outlook://` + clipboard HTML + log envio | `eng_emails_log` | Não | Dialog + log | **P2** |
| Oriente | E-mails | Status de envio + reenvio | Outlook | Worker | Atualiza log | `eng_emails_log` | Não | Edge function | **P2** |
| Justice | Empresas/Colaboradores | Botão WhatsApp por linha | WhatsApp | Botão | Abre `https://wa.me/...?text=` + log | `eng_emails_log` (estender) | Não | Modal + helper | **P3** |
| Justice | Empresas/Colaboradores | Botão E-mail por linha | Outlook | Botão | Abre mailto/Outlook + log | `eng_emails_log` | Não | Modal | **P2** |
| Oriente | Global | Assistente IA (chat + voz) | Assistente virtual | FAB | Edge `roadmap-ia` mode=assist | LOVABLE_API_KEY (já existe) | Não | Componente + edge | **P4** |
| Oriente | Por registro | Robozinho IA (edição com auditoria) | Assistente virtual | Botão célula | Edge `robozinho-edit` | LOVABLE_API_KEY | Não | Componente + edge | **P4** |
| Justice | Word/Excel | AIAssistant (extração de contrato) | Assistente virtual | Upload | Edge `ai-assist` | LOVABLE_API_KEY | Não | Componente + edge | **P4** |
| Oriente | Governança | Resumo executivo IA / Relatório | Geração de documento | Botão | Edge `gov-resumo-executivo` / `generate-governance-report` | LOVABLE_API_KEY | Parcial (libs locais existem) | Edge functions | **P4** |
| Justice | Empresas/Colaboradores | Cálculo auto status final | Mudança de status | Save | `geral(jur, ehs)` / `calcFinal(...)` | `eng_*` | Não | Helpers no save | **P1** |

## 4. Plano em 4 prioridades

### Prioridade 1 — Automações críticas internas (sem credencial)
Tudo só com código + tabelas existentes. Logs em `eng_auditoria`.

1. `useStatusAutomations` — hook que ao detectar mudança de status (`aberta→concluida`, etc.) cria automaticamente:
   - tarefa de follow-up em `eng_atividades`
   - registro de auditoria
   - notificação interna
2. `siteAutocreate.ts` portado — ao criar Atividade/RFI/Projeto referenciando site novo, insere em `eng_sites`.
3. `NotificationsBell` global — agrega prazos vencidos/próximos de `eng_atividades`, `eng_demandas`, `eng_pendencias`, `eng_rfi`, `eng_ligacoes_energia`, `eng_art`, `eng_projetos_elaboracao`, `eng_gov_action_plan`. Polling 60s + realtime opcional.
4. `PendenciasAggregator` — card embutido em Atividades, agrupa por responsável.
5. `useModulePermissions` — wrapper sobre `eng_module_permissions` com cache.
6. `useCrossModuleLinks` — vínculos: SC/RC ↔ Solicitação, Site ↔ {Atividade, RFI, Projeto, Energia, ART}, Projeto ↔ Atividades.
7. `internalNotifications.ts` — biblioteca para disparar e ler notificações (tabela nova `eng_internal_notifications`).
8. Logs internos: cada automação chama `fireAudit({ acao: "automation:<nome>", ... })`.

### Prioridade 2 — E-mail Outlook
- Tabela `eng_email_templates` (mock + CRUD).
- Componente `EnviarOutlookDialog` portado (RC/SC + genérico).
- `eng_emails_log` já existe — usar para status enviado/falhou/pendente, reenvio.
- Edge function `email-resend` (opcional, sem credencial — apenas reabre URI).

### Prioridade 3 — WhatsApp
- Helper `wa.ts` que monta `https://wa.me/<num>?text=<msg>` e registra em `eng_emails_log` (kind=whatsapp).
- Botões por linha em módulos com telefone (Equipes, Responsáveis Jurídico).
- Templates em `eng_field_options` (field_key=`whatsapp_template`).
- Status de entrega: **placeholder** (precisa API WhatsApp Cloud / Z-API → P3.5 com credencial).

### Prioridade 4 — Assistente Virtual
- Edge `roadmap-ia`, `robozinho-edit`, `ai-assist` portadas (usam `LOVABLE_API_KEY` já existente).
- Componentes `AssistenteFloating`, `RobozinhoFloating`, `AIAssistant`.
- Logs em `eng_auditoria` (já são gravados pelas próprias edge functions).

## 5. Riscos
- Polling de 60s × 8 tabelas pode pesar — usar realtime + janela de 200 linhas.
- `siteAutocreate` precisa idempotência (busca por código antes de inserir).
- Mudança automática de status pode entrar em loop — usar flag `_auto: true` no payload e ignorar em handlers.
- RLS: tudo passa por `eng_can_edit`; usuário sem role não dispara automação.

## 6. O que depende de credencial externa
- WhatsApp com status de entrega (Cloud API / Z-API) — P3.5
- Envio real de e-mail server-side (Resend/SendGrid) — opcional, P2.5
- SharePoint sync real (token MS Graph) — fora do escopo agora

## 7. O que pode ser migrado AGORA sem credencial
- **Toda Prioridade 1** ✅
- E-mail via Outlook URI / mailto (P2 base)
- WhatsApp via wa.me (P3 base, sem status)
- Assistente IA (LOVABLE_API_KEY já existe)

---

# Implementação — somente Prioridade 1

## Etapas

### Etapa 1.1 — Migração de banco
Criar tabela `eng_internal_notifications`:
```
id uuid pk, user_id uuid null (null=broadcast), origem text, origem_id uuid,
titulo text, detalhe text, tipo text ('prazo'|'status'|'vinculo'|'tarefa'),
modulo text, route text, lida boolean default false,
created_at timestamptz default now()
```
RLS:
- SELECT: `user_id = auth.uid() OR user_id IS NULL`
- INSERT/UPDATE: `eng_can_edit(auth.uid())`

Habilitar realtime na tabela.

### Etapa 1.2 — Lib de automações (`src/modules/engenharia/lib/automations/`)
Arquivos novos:
- `siteAutocreate.ts` — `ensureSiteByCodigo(codigo, nome?)` retorna site_id; idempotente.
- `statusFlows.ts` — mapa `{ kind → { fromStatus → toStatus → action[] } }`. Actions: `createFollowupTask`, `notify`, `closeLinked`.
- `internalNotifications.ts` — `notify({ user_id?, origem, origem_id, ... })` insere em `eng_internal_notifications` + `fireAudit`.
- `crossModuleLinks.ts` — helpers `linkScRcToSolicit`, `unlinkScRc`, `getProjectActivities(projeto_id)`.

### Etapa 1.3 — Hooks
- `src/modules/engenharia/hooks/useStatusAutomations.ts` — wrapper de `updateShared` que executa flow correspondente.
- `src/modules/engenharia/hooks/useInternalNotifications.ts` — lista + marca como lida + realtime.
- `src/modules/engenharia/hooks/useModulePermissions.ts` — porta do Oriente, lê `eng_module_permissions`.

### Etapa 1.4 — Componentes UI
- `src/components/NotificationsBell.tsx` — sino fixo no `AppLayout` (usa `useInternalNotifications`).
- `src/modules/engenharia/ui/components/PendenciasAggregator.tsx` — card embutido na aba Atividades.
- `src/modules/engenharia/ui/components/AutomationFallback.tsx` — placeholder visual quando automação está desligada/sem config.

### Etapa 1.5 — Wiring
- Integrar `NotificationsBell` em `src/components/AppLayout.tsx`.
- Substituir chamadas diretas de `updateShared` nos `Eng*Page` para passar pelo `useStatusAutomations`.
- Adicionar `PendenciasAggregator` no topo de `AtividadesPage`.

## Arquivos a criar
```
src/modules/engenharia/lib/automations/siteAutocreate.ts
src/modules/engenharia/lib/automations/statusFlows.ts
src/modules/engenharia/lib/automations/internalNotifications.ts
src/modules/engenharia/lib/automations/crossModuleLinks.ts
src/modules/engenharia/hooks/useStatusAutomations.ts
src/modules/engenharia/hooks/useInternalNotifications.ts
src/modules/engenharia/hooks/useModulePermissions.ts (se ainda não existir funcional)
src/modules/engenharia/ui/components/PendenciasAggregator.tsx
src/modules/engenharia/ui/components/AutomationFallback.tsx
src/components/NotificationsBell.tsx
```

## Arquivos a alterar
```
src/components/AppLayout.tsx                    (mount sino)
src/modules/engenharia/lib/sharedStore.ts       (hook de pós-update p/ flows)
src/modules/engenharia/ui/EngOperacaoPages.tsx  (AtividadesPage com agregador)
supabase migration                               (eng_internal_notifications + realtime)
```

## Tabelas necessárias
- **NOVA**: `eng_internal_notifications` (RLS + realtime).
- Reusa: `eng_atividades`, `eng_auditoria`, `eng_module_permissions`, `eng_sites`, `eng_solicitacao_sc_rc` e demais.

## Edge functions necessárias
Nenhuma — Prioridade 1 é 100% client-side + RLS.

## Botões e telas atualizadas
- `AppLayout`: sino no topo direito.
- `AtividadesPage`: novo card "Pendências por responsável".
- Todos os `Eng*Page` que usam `updateShared`: agora passam por automação (transparente).

## Riscos
- Loop em flows: mitigado com flag `_auto`.
- Realtime sobrecarga: filtrar por `user_id=eq.<uid>` quando disponível.
- Permissões: respeitar `useModulePermissions` antes de mostrar agregador.

## Como testar cada automação
1. **Status flow**: abrir Atividade, mudar status para `concluida` → verificar notificação criada + log em `eng_auditoria`.
2. **Site autocreate**: criar Atividade com site `XX-9999` inexistente → site aparece em `/app/engenharia/sites`.
3. **Sino**: criar Atividade com prazo ontem → contador no sino sobe; clicar leva à rota.
4. **Pendências**: abrir `/app/engenharia/atividades` → card mostra contagem por responsável.
5. **Vínculo SC/RC**: criar SC/RC vinculado a uma solicitação → solicitação reflete no agregador.

## Dependência de credencial
- Nenhuma. `LOVABLE_API_KEY` só será usada nas P2-P4.

## Compatível com
- RLS atual (`eng_can_edit`).
- Visibilidade de grupos (não altera).
- Auth atual (não altera).

Aprove para eu seguir com Prioridade 1.
