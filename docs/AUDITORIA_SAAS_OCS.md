# Auditoria SaaS Multiempresa — ERP OCS
_Data: 2026-05-14 · Escopo: somente leitura, nenhuma alteração aplicada._

---

## TL;DR

O ERP OCS **já possui a fundação de SaaS multiempresa** (tabelas `companies`, `company_users`, `company_plans`, ACL central, RLS em ~250 tabelas, papéis tipados, `is_internal_ocs`, `eng_can_edit`, `crea_can`, `comm_can`, `theme_can`). O projeto está **muito acima da média** para um ERP gerado iterativamente, mas **ainda NÃO pode ser entregue como SaaS comercial multi-cliente** sem corrigir um conjunto pequeno e bem identificável de pontos críticos (RLS faltante em 13 tabelas, módulo Financeiro pessoal sem `company_id`, módulos com dados mock/demo expostos, PWA legado a limpar).

| Eixo | Status |
|---|---|
| Tenant/Empresa | ✅ Pronto (companies + company_users + owner protegido) |
| Vínculo usuário↔empresa | ✅ Pronto |
| RLS geral | 🟡 ~95% das tabelas com RLS, **13 sem política/RLS** |
| Papéis | ✅ 25 papéis tipados em `app_role` + ACL central |
| Planos / billing | 🟡 Estrutura existe, sem cobrança real / sem trial / sem bloqueio "assinatura vencida" |
| Auth | ✅ Supabase Auth + guards de rota + `/entrar` + reset |
| PWA | ⚠️ Legado desativado, SW antigo ainda em `public/` |
| Pronto para cliente real | 🔴 Não. Bloqueadores listados abaixo. |

---

## 1. Tenants / Empresas

- **Tabela `companies`** existe (2 registros hoje).
- **Tabela `company_users`** liga `user_id ↔ company_id` com flag `is_company_admin` (4 vínculos hoje).
- **Tabela `organizations`** também existe (legado/secundário — usada por `enterprise_audit_trail`).
- Owner da plataforma (`3510fb25-...`) é **automaticamente vinculado como admin** em toda nova empresa via trigger `add_platform_owner_to_new_company` e protegido por `protect_platform_owner_membership`.
- Função canônica para descobrir empresa do usuário: `public.user_company(uid)`.
- **Conclusão:** modelo de tenancy **single-tenancy-por-usuário** (1 user → 1 company). Suporta múltiplas empresas no banco, mas o front assume 1 empresa ativa por usuário (com impersonation OCS via `useImpersonation`).

> ⚠️ Atenção: se algum cliente quiser que **um mesmo usuário pertença a 2 empresas simultaneamente**, isso já é suportado no schema (PK composta `(company_id,user_id)`), mas várias views/hooks (`user_company`, `useHrdpCompany`) pegam apenas o **primeiro** vínculo — isso vai dar bug silencioso.

---

## 2. Separação de dados

**Banco:** 264 tabelas em `public`. **537 policies** ativas.

### 2.1 Tabelas com `company_id` (amostra) — OK
Quase todos os módulos seguem a convenção: `comm_*`, `crea_*`, `crea_gov_*`, `eng_*`, `hrdp_*`, `market_*`, `compliance_*`, `pixel_*`, `comm_module_permissions`, `theme_*`, `company_*`.

### 2.2 🔴 Tabelas com **RLS DESLIGADO** (vazamento garantido se houver dado)
```
public.fin_categories
public.fin_cost_centers
public.fin_credit_cards
public.fin_debts
public.it_sla_config
public.ti_ticket_history
```
> Risco: qualquer usuário autenticado lê/escreve. **Bloqueador absoluto** para SaaS.

### 2.3 🔴 Tabelas com **RLS ligado mas SEM nenhuma policy** (acesso negado a tudo OU exposto, dependendo do client key)
```
compliance_records
fin_bank_accounts
financial_protection_alerts
it_access_requests
jarbas_training_patterns
market_addresses
market_coupons
market_customers
market_inventory_movements
market_messages
market_order_items
market_store_settings
ocs_guard_trust_scores
```
> Resultado prático: a feature parece "quebrada" (nada aparece) ou — se algum service role for usado no front — vaza tudo. Precisa policy explícita por `company_id`.

### 2.4 🟡 Tabelas sem `company_id`/`tenant_id`/`user_id` (88 tabelas)
A maioria é **legítima**: catálogos globais (`acl_permissions_catalog`, `crea_norms`, `crea_links_oficiais`, `plan_modules_catalog`, `hrdp_submodules_catalog`), tabelas raw de import (`eng_gov_*_raw`), config global (`*_admin_config`, `governance_settings`), `companies` e `organizations` (são os tenants). **Nenhum problema sistêmico aqui**, mas vale revisar caso-a-caso:
- `eng_art`, `eng_atividades`, `eng_demandas`, `eng_pendencias`, `eng_materiais`, `eng_rfi`, `eng_sites`, `eng_suprimentos`, `eng_equipes` — **NÃO têm `company_id`**. Hoje a Engenharia é tratada como **um único tenant interno OCS** (RLS via `eng_can_edit`). Isso é OK enquanto a Engenharia for "OCS only", **mas vira bloqueador no dia em que outro cliente contratar Engenharia**.
- `eng_fibra_obras`, `eng_projetos`, `eng_roadmap_ia`, idem.
- `gov_dataset_*` — escopo por sheet/módulo, sem `company_id` direto. Aceitável, mas auditar.

### 2.5 Risco de vazamento entre empresas
Para tabelas com policies usando `comm_can`, `crea_can`, `eng_can_edit`, `theme_can`, `company_id = user_company(auth.uid())` → **isolamento OK**.
Para as listadas em 2.2 e 2.3 → **isolamento INEXISTENTE**.

---

## 3. Permissões

- 25 papéis em `app_role` (admin, planejamento, diretoria, engenharia, suprimentos, fibra, financeiro_ocs, company_admin, rh_admin, dp_admin, gestor_area, colaborador, auditor_rh, crea_admin/analista/responsavel_tecnico/auditor/visualizador, comunicacao_admin, social_media, designer, redator, aprovador, gestor_produto…).
- **ACL central** (`acl_permissions_catalog`, `acl_user_permissions`, função `can(uid, key, company)`) implementada e usada via `<AclProvider>` + `useCan` + `<Can>` + `<RouteGuard>`.
- Cada módulo tem função própria (`crea_can`, `comm_can`, `theme_can`, `eng_can_edit`, `gov_can_edit`, `hrdp_*`).
- Frontend bloqueia rotas (`AppLayout`, `*Guard`).
- Backend (RLS) também aplica — não confia só no front.
- ✅ **Bem feito**, padrão profissional. Único ponto: ACL antiga (`role`) coexiste com ACL nova (`acl_user_permissions`); banner de deprecação já existe (`LegacyDeprecationBanner.tsx`).

---

## 4. Billing / Planos

Existem:
- `company_plans` (modules[], integrations[], valor_mensal)
- `plan_modules_catalog`, `plan_pricing_config`
- `company_plan_payments`
- `useUserModules` + `current_user_modules(uid)` — controla visibilidade de módulo por plano
- `apply_calculated_value`, `calc_company_plan_value` — calcula preço

❌ **Não existe**:
- Estado de assinatura (`active|trialing|past_due|canceled`) — não há campo `subscription_status`.
- Trial gratuito com data de fim.
- Bloqueio automático ao vencer (cron / edge function).
- Integração de pagamento (Stripe/Paddle).
- Tela de "sua assinatura está vencida".

> A tabela `company_plan_payments` existe mas **só registra** pagamentos manualmente; não há gateway plugado.

---

## 5. Autenticação

- Supabase Auth nativo (email+senha; recovery via `/reset-password`).
- Rotas: `/` público, `/entrar` login, `/app/*` protegido por `AppLayout` (redireciona para `/entrar` se sem session).
- `useAuth` cuida de SIGNED_OUT espontâneo (anti-flicker). ✅
- `ensure_current_profile()` cria profile no primeiro login. ✅
- Trigger `handle_new_user` cria profile + role. ✅
- ⚠️ **Não há confirmação de email obrigatória** configurada por código (depende do auth config Supabase).
- ⚠️ **Não há MFA**.
- ⚠️ Não há rate-limit no client para login (só o do Supabase).

---

## 6. Banco / Segurança

- 264 tabelas, 537 policies.
- Funções `SECURITY DEFINER` corretamente usadas para evitar recursão de RLS (`has_role`, `is_internal_ocs`, `crea_can`, `eng_can_edit`, `comm_can`, `user_company`, `is_company_admin`, etc.).
- Senhas mestras de empresa (`companies.master_password_hash`) com `bcrypt` via `pgcrypto`. ✅
- Senha de exclusão da Engenharia idem (`eng_admin_config.delete_password_hash`). ✅
- Credenciais CREA cifradas com `pgp_sym_encrypt`. ✅
- Auditoria abundante: `acl_audit_logs`, `comm_audit_logs`, `crea_audit_logs`, `eng_auditoria`, `theme_audit_logs`, `enterprise_audit_trail`, `security_audit_logs`. ✅
- Soft delete padronizado (`eng_soft_delete`, `comm_soft_delete`, `crea_soft_delete_bulk`) com senha + motivo. ✅
- ⚠️ **Mistura mock + real**: módulo Engenharia tem `engDemoTables.ts`/`engMockData.ts` controlado por `useEngDemoMode`; módulo Jurídico tem `jurMockData.ts`. **Toggle só para staff OCS** — OK conceitualmente, mas precisa garantir que NUNCA é ligado por padrão para cliente final.

---

## 7. Módulos

| Módulo | Status | Tenant | RLS | Banco real | Pronto cliente? |
|---|---|---|---|---|---|
| **CREA & ART** | ✅ Funcional | ✅ `company_id` em tudo | ✅ via `crea_can` | ✅ | 🟢 Sim (com revisão de credenciais cifradas) |
| **Engenharia** | ✅ Funcional + demo togglable | ❌ **Sem `company_id`** (single-tenant OCS) | ✅ via `eng_can_edit` | ✅ | 🟡 Só se cliente = OCS. Multi-cliente exige refactor para adicionar `company_id` em ~25 tabelas `eng_*`. |
| **Financeiro** | 🟡 Parcial | 🟡 `fin_profiles`, `fin_cost_centers` têm `company_id`; **`fin_categories/credit_cards/debts/bills/transactions/bank_accounts/goals` NÃO têm** | 🔴 RLS off em 4 tabelas, sem policy em 1 | 🟡 | 🔴 **Não.** Risco de vazamento financeiro. |
| **RH/DP** | ✅ Funcional | ✅ `company_id` em todas `hrdp_*` | ✅ | ✅ | 🟢 Sim |
| **Jurídico** | 🟡 Mockup | n/a (mock) | n/a | ❌ usa `jurMockData.ts` | 🔴 Não. É vitrine. |
| **Comunicação** | ✅ Funcional | ✅ | ✅ via `comm_can` | ✅ | 🟢 Sim |
| **Marketplace** | 🟡 Parcial | ✅ `company_id`/`store_id` | 🔴 **8 tabelas `market_*` com RLS sem policies** | 🟡 | 🔴 Não, vai aparecer "vazio" ou vazar. |
| **TI & Suporte** | 🟡 | 🟡 | 🔴 `it_sla_config` RLS off, `it_access_requests` sem policy, `ti_ticket_history` RLS off | 🟡 | 🔴 Não |
| **Compliance / Governança** | 🟡 | 🟡 | 🔴 `compliance_records` sem policy | 🟡 | 🟡 Próximo |
| **Aparência & Marca** | ✅ | ✅ | ✅ via `theme_can` | ✅ | 🟢 |
| **Soluções-Verso (Pixel)** | ✅ | ✅ via workspace/visibility group | ✅ | ✅ | 🟢 |
| **Jarbas / Agentes IA** | 🟡 oculto | 🟡 | 🔴 `jarbas_training_patterns` sem policy | 🟡 | 🟡 (já está oculto no menu) |
| **Planos** | ✅ | ✅ | ✅ | ✅ | 🟢 mas sem cobrança real |
| **OCS Guard** | 🟡 | ❌ `ocs_guard_trust_scores` sem policy | 🔴 | 🟡 | 🔴 |
| **Configurações / ADM** | ✅ | ✅ | ✅ | ✅ | 🟢 |

---

## 8. PWA / Offline

- `vite.config.ts` **NÃO tem `vite-plugin-pwa`** (já removido).
- Não há `manifest.webmanifest` em `public/`.
- `public/sw.js` e `public/service-worker.js` **ainda existem como arquivos legados**.
- `src/lib/registerSW.ts` apenas **desregistra** SWs antigos e limpa caches → bom (evita tela velha).
- `src/lib/offlineCache.ts` e `src/lib/offlineQueue.ts` ainda existem como código morto.

> Risco: usuários que instalaram a versão antiga como PWA podem **continuar caindo num SW cacheado** até o `registerSW` rodar uma vez. Hoje o limpa-tudo já roda em todo `main.tsx`, então o risco se dilui no primeiro acesso pós-update. **Sugestão futura:** apagar `public/sw.js`, `public/service-worker.js`, `offlineCache.ts`, `offlineQueue.ts` definitivamente.

---

## 9. Relatório final

### 9.1 ✅ O que JÁ está pronto
- Multi-tenant no banco (`companies` + `company_users` + `company_plans`).
- ACL central server-authoritative + 25 papéis tipados.
- 537 RLS policies cobrindo a maioria dos módulos.
- Auditoria, soft-delete com senha, criptografia de credenciais.
- Auth completo (login, signup, recovery, sessão).
- Roteamento limpo: `/` site, `/entrar` login, `/app/*` ERP protegido.
- Aparência por empresa, branding, theme studio.
- Impersonation OCS com banner + auditoria.
- Módulos CREA, RH/DP, Comunicação, Aparência, Pixel, Planos, ADM = produção.

### 9.2 🟡 Incompleto
- Billing: falta status de assinatura, trial, bloqueio automático e gateway.
- Engenharia: single-tenant; refactor para multi-cliente é grande.
- Jurídico: ainda é mockup.
- Marketplace e TI: vários endpoints/tabelas sem policy.
- Confirmação de e-mail / MFA.
- Limpeza definitiva do PWA legado.

### 9.3 🔴 Riscos críticos (corrigir antes de vender)
1. **6 tabelas com RLS desligado** (4 financeiras + 2 TI). Vazamento garantido.
2. **13 tabelas com RLS ligado e ZERO policy** (financeiro, marketplace, TI, compliance, jarbas, ocs-guard).
3. **Financeiro** sem `company_id` na maioria das tabelas — modelo é "finanças pessoais por user", **não casa com SaaS B2B**. Decidir: vira módulo pessoal-por-usuário (RLS por `user_id`) OU recebe `company_id`.
4. **Engenharia sem `company_id`** — só vender enquanto cliente = OCS.

### 9.4 🟢 Módulos seguros para abrir cliente hoje
CREA & ART · RH/DP · Comunicação · Aparência · Pixel · Planos · ADM Visibilidade · Compliance Governança (visualização)

### 9.5 🔴 Módulos NÃO seguros
Financeiro · Marketplace · TI & Suporte · Jurídico (mock) · OCS Guard · Jarbas (já oculto)

### 9.6 Prioridade de correção (ordem sugerida)
1. **P0 — Ligar RLS + criar policies** nas 19 tabelas listadas em §2.2 e §2.3.
2. **P0 — Decidir modelo do Financeiro** (pessoal vs empresarial) e alinhar `company_id`/`user_id`.
3. **P1 — Billing real**: campo `subscription_status`, `trial_ends_at`, edge function diária de bloqueio, gateway (Stripe ou Paddle).
4. **P1 — Confirmação de e-mail obrigatória** + opção de MFA para admins.
5. **P2 — Refactor Engenharia para multi-tenant** (adicionar `company_id` em ~25 tabelas `eng_*`, ajustar `eng_can_edit` para receber empresa).
6. **P2 — Substituir mocks** do Jurídico por banco real OU esconder o módulo até estar pronto.
7. **P2 — Marketplace**: completar policies das 8 tabelas, fluxo de checkout, vínculo com `company_id` da loja.
8. **P3 — Limpar PWA legado** (`public/sw.js`, `public/service-worker.js`, `offlineCache.ts`, `offlineQueue.ts`).
9. **P3 — Garantir que `useEngDemoMode` nunca liga para não-staff** (já é o caso, mas adicionar teste).

### 9.7 Checklist "ERP OCS = SaaS multiempresa real"
- [ ] Nenhuma tabela em `public` com `relrowsecurity=false` (exceto catálogos globais explicitamente públicos).
- [ ] Nenhuma tabela com RLS sem ao menos 1 policy.
- [ ] Toda tabela de dados de cliente tem `company_id NOT NULL`.
- [ ] Toda policy filtra por `company_id = user_company(auth.uid())` OU usa `*_can(uid, company, action)`.
- [ ] `subscription_status` em `company_plans` + cron de bloqueio.
- [ ] Gateway de pagamento ligado.
- [ ] Trial automático + e-mail transacional.
- [ ] Confirmação de e-mail obrigatória no Supabase Auth.
- [ ] MFA opcional p/ admins.
- [ ] Mocks ocultos para clientes (apenas staff OCS).
- [ ] Engenharia com `company_id` (se for vender p/ outro cliente).
- [ ] PWA legado removido OU PWA novo bem implementado.
- [ ] Página pública `/` finalizada com termos + política de privacidade + LGPD.
- [ ] Onboarding self-service (criar empresa, escolher plano, convidar usuários).
- [ ] Documentação de cada módulo para o cliente final.

---

_Fim do relatório. Nenhuma alteração foi feita no código ou no banco._
