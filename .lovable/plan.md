
# Módulo Planos de Usuários (OCS) + Multi-empresa + Catálogo de Abas

## 1. Conceitos novos

- **Empresa (company)**: cliente do ERP. Cada empresa assina um **Plano** com um conjunto de abas (módulos) e um valor mensal.
- **Usuário ↔ Empresa**: cada usuário pertence a 1 empresa (admin OCS pode mover). Admin de empresa só vê/edita usuários da própria empresa.
- **Catálogo de Abas**: lista plana e agrupada (Engenharia, Jurídico, Geral) com todas as abas disponíveis. "Visão Geral" é **obrigatória** em todo plano.
- **Pacotes pré-prontos**: presets que pré-marcam abas (ex.: "Engenharia Completo", "Jurídico Completo", "Starter").
- **Permissões por usuário dentro do plano**: para cada aba do plano da empresa, o admin da empresa define `view / edit / delete` por usuário.
- **Cobrança**: valor mensal + dia de vencimento. Admin OCS / `financeiro_ocs` marca pagamento manualmente. Aviso D-3 e D0 (vencimento) automaticamente, via notificação interna + WhatsApp (link wa.me + cron edge function).

## 2. Papéis

- `admin` (super-OCS): tudo.
- `financeiro_ocs` (novo role em `app_role`): gerencia empresas, planos, valores, pagamentos. Não mexe em dados operacionais.
- `company_admin` (novo role): vê o próprio plano (read-only nos campos financeiros) e gerencia permissões de usuários **dentro do escopo do plano da empresa**.
- Usuários comuns: só veem/usam abas liberadas pelo plano da empresa, com a permissão concedida pelo company_admin.

## 3. Modelo de dados (novas tabelas)

```text
companies                 id, nome, cnpj, contato_nome, contato_email, contato_whatsapp, pix_chave, ativo, created_at
company_users             id, company_id, user_id (unique), is_company_admin
plan_modules_catalog      key (PK, ex: 'eng.sites'), label, grupo ('Engenharia'|'Juridico'|'Geral'),
                          rota, sempre_obrigatorio (bool), ordem
plan_packages             id, nome, descricao, modules text[]   -- presets
company_plans             id, company_id (unique), valor_mensal, dia_vencimento (1-28),
                          modules text[], status ('ativo'|'suspenso'),
                          observacoes, created_at, updated_at
company_plan_payments     id, company_plan_id, competencia (yyyy-mm), valor_pago,
                          data_pagamento, registrado_por, observacao, created_at
company_module_permissions id, company_id, user_id, module_key,
                          can_view, can_edit, can_delete, updated_at
plan_billing_runs         id, company_plan_id, competencia, tipo ('d-3'|'d0'),
                          enviado_em, canal ('interno'|'whatsapp'), payload jsonb
```

RLS:
- `companies / company_plans / payments`: admin + financeiro_ocs editam; company_admin lê apenas a própria company.
- `company_module_permissions`: admin + financeiro_ocs editam tudo; company_admin edita apenas usuários da própria empresa e só `module_key` que está em `company_plans.modules`.
- `plan_modules_catalog / plan_packages`: leitura para autenticados, escrita admin/financeiro_ocs.

Funções/RPC:
- `is_financeiro_ocs(uid)`, `is_company_admin(uid, company_id)`, `user_company(uid)`.
- `current_user_modules(uid)` → retorna lista de `module_key` que o usuário pode ver, derivada de `company_plans.modules ∩ company_module_permissions`.
- `register_payment(plan_id, competencia, valor, data)` (admin/financeiro).
- Trigger: ao inserir em `company_users`, se primeiro usuário da empresa → marca `is_company_admin = true`.

## 4. Cron + Edge Function de cobrança

- Edge function `billing-due-check` (deploy automático). Roda diária via `pg_cron + pg_net`.
- Lógica: para cada `company_plan` ativo, calcula próxima `competencia` e `due_date`. Se `due_date - hoje = 3` ou `= 0` e não há `payments` para a competência, cria:
  1. `eng_internal_notifications` (broadcast para todos os usuários da empresa, rota `/app/planos`).
  2. Registro em `plan_billing_runs` (idempotente: unique em `(plan_id, competencia, tipo)`).
- WhatsApp: gera link `wa.me/<contato_whatsapp>?text=...` com mensagem padronizada (D-3: aviso + pix; D0: vence hoje + pix). O **envio efetivo é click-to-send** (botão na UI de Planos abre o link). A edge function só cria a notificação com o link pronto. Botão "Reenviar agora" disponível ao admin.

## 5. UI nova

### Rota `/app/planos` (admin OCS + financeiro_ocs)
Abas:
1. **Empresas**: tabela CRUD (DataActionsToolbar padrão), com colunas Nome, Plano, Valor, Vencimento, Status pagamento mês atual (badge: pago/atrasado/em dia/D-3).
2. **Plano da empresa** (modal/drawer ao abrir empresa):
   - Dados da empresa + PIX + WhatsApp.
   - Seleção de **Pacote** (aplica preset) + Catálogo de abas em accordion por grupo (Engenharia / Jurídico / Geral). "Visão Geral" trava como obrigatória.
   - Valor mensal + dia de vencimento.
   - Lista de **Usuários da empresa** com matriz `view / edit / delete` por aba do plano.
3. **Pagamentos**: registro manual (empresa, competência, valor, data, observação) + histórico.
4. **Avisos**: lista de `plan_billing_runs` recentes, com botão "Abrir WhatsApp" e "Marcar como pago".
5. **Catálogo & Pacotes**: gerenciar `plan_modules_catalog` e `plan_packages`.

### Rota `/app/minha-empresa` (company_admin)
- Visão do plano (read-only nos campos financeiros, mostra status de pagamento e próximos vencimentos).
- Matriz de permissões dos usuários da empresa **somente nas abas do plano**.

### Sidebar / AppLayout
- Novo item "Planos" (ícone `CreditCard`) visível só para admin/financeiro_ocs.
- Item "Minha Empresa" visível só para company_admin.
- **Filtro global**: o menu lateral (Engenharia/Jurídico) passa a renderizar apenas as abas que `current_user_modules()` retorna. Admin OCS continua vendo tudo.

### Visão Geral (dashboard) por aba liberada
- Componente `ModuleOverviewCard` que para cada aba do plano da empresa busca contagens por status (`atrasado, em_aberto, em_andamento, pendente, concluido, finalizado, entregue, emitido`) — usa um mapeamento status→bucket por tabela. Aparece na home `/app` (Visão Geral obrigatória) como grid de cards, um por aba liberada, com link para a aba.

## 6. Notificações internas

- Reaproveita `eng_internal_notifications` (já existe). Tipos novos: `cobranca_d3`, `cobranca_d0`, `pagamento_registrado`.
- Sininho do header já lista; adicionar ícone/cor distinta para cobrança.

## 7. Migração / impacto em código existente

- `app_role` enum: adicionar `'financeiro_ocs'` e `'company_admin'`.
- Sidebars de Engenharia/Jurídico passam a consultar `current_user_modules()` e filtrar `ENG_TABS` / `JUR_TABS`.
- `EngenhariaGuard` / `JuridicoGuard`: além do role, exigir que pelo menos uma aba do módulo esteja liberada (ou role admin).
- Seed inicial do `plan_modules_catalog` com todas as abas atuais (Engenharia + Jurídico + "Visão Geral" como obrigatória).

## 8. Entrega em fases

1. **Fase A — Backend**: migration (tabelas, roles, funções, seed catálogo+pacotes), RPCs, RLS.
2. **Fase B — UI Planos**: `/app/planos` (Empresas, Plano, Pagamentos, Catálogo & Pacotes).
3. **Fase C — Permissões aplicadas**: filtragem da sidebar Eng/Jur por `current_user_modules`, guards atualizados, página `/app/minha-empresa`.
4. **Fase D — Cobrança automática**: edge function `billing-due-check`, cron diário, UI de Avisos + botão WhatsApp.
5. **Fase E — Visão Geral consolidada**: `ModuleOverviewCard` com contagens por status para cada aba do plano.

Pronto para implementar a Fase A (migration + roles + seed) ao aprovar.
