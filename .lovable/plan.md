## Diagnóstico inicial (resumo)

Após varrer o ERP OCS, identifiquei **9 sistemas paralelos de permissão** convivendo hoje:

| # | Sistema | Onde vive | Tabelas / Funções |
|---|---------|-----------|-------------------|
| 1 | `user_roles` global (app_role enum) | `useAuth.isAdmin`, todos os hooks `useXxxAccess` | `user_roles`, `has_role()` |
| 2 | Engenharia | `useEngenhariaAccess`, `eng_module_permissions`, `useModulePermissions` | `eng_can_edit()`, `eng_module_permissions` |
| 3 | Jurídico | `useJuridicoAccess` | role `juridico` |
| 4 | CREA | `useCreaAccess`, `crea_module_permissions` | `crea_can()` |
| 5 | RH/DP | `useRhdpAccess`, `hrdp_module_permissions` | `hrdp_can()` |
| 6 | Comunicação | `useComunicacaoAccess`, `comm_module_permissions` | `comm_can()` |
| 7 | Governança | `useGovernanceAccess`, `governance_settings.edit_open_to_all` | `gov_can_edit()` |
| 8 | Aparência/Tema | `theme_permissions` | `theme_can()` |
| 9 | **Plano por empresa (ADM > Visibilidade hoje)** | `CompanyPermissionsMatrix`, `company_module_permissions`, `current_user_modules()` | `useUserModules` + `plan_modules_catalog` |

Além disso há: `user_visibility_groups` + `record_visibility` + `module_visibility_settings` (sistema de visibilidade por linhas — separado e parcialmente abandonado), e `useImpersonation` que mistura tudo.

**Problemas centrais:**
- Cada módulo decide o seu próprio acesso → impossível auditar.
- Cliente pagante (admin de empresa) hoje **pode** mexer em `company_module_permissions` via `CompanyPermissionsMatrix` no `CompanySheet` — viola a regra 1.
- Não existe um `can(user, "modulo.recurso.acao", ctx)` único.
- Não há log auditando quem alterou quais permissões.

---

## Plano em 6 levas (sem criar tela nova)

### Leva 1 — Fundação backend (autoridade central)
- Tabela `acl_permissions_catalog` (chaves canônicas `modulo.recurso.acao`, label, módulo, ação, ativo).
- Tabela `acl_user_permissions` (`user_id`, `company_id NULL=global`, `permission_key`, `granted_by`, `granted_at`, `reason`).
- Tabela `acl_audit_logs` (quem mudou, antes/depois, motivo, IP).
- Função SQL **`can(_uid, _key, _company)`** — autoridade única. Retorna true se: (a) admin OCS, (b) funcionário interno OCS com a chave, (c) usuário com `acl_user_permissions` na empresa.
- Função `acl_grant(_user, _company, _key, _reason)` / `acl_revoke(...)` — **só executa se quem chama for `is_internal_ocs(auth.uid())`** (proprietário + role nova `ocs_staff`). Cliente pagante **não passa**.
- Trigger de auditoria em `acl_user_permissions` → `acl_audit_logs`.
- Seed do catálogo com todas as chaves atuais convertidas (`engenharia.sites.editar`, `crea.art.criar`, `comunicacao.post.aprovar`, etc.).

### Leva 2 — Hook + helper único no frontend
- `useCan()` → `can(key, companyId?)` (consulta única `acl_user_permissions` + `is_internal_ocs` cacheado).
- `<Can perm="...">{children}</Can>` para esconder botões/cards.
- `<RouteGuard perm="...">` substitui os Guards específicos.
- Mantém compatibilidade: hooks antigos (`useEngenhariaAccess`, `useCreaAccess`, etc.) viram **wrappers finos** que só consultam `useCan("modulo.acessar")`. Marcados `@deprecated`.

### Leva 3 — Migrar consumidores (módulo a módulo)
Substituir checagens hardcoded por `useCan`/`can()`:
- Engenharia, Jurídico, CREA, RH/DP, Comunicação, Governança, Aparência, Planos, Pixel, ADM.
- Sidebars: filtrar itens por `useCan("modulo.acessar")`.
- Botões sensíveis (excluir, aprovar, exportar, revelar credencial): `<Can perm="...">`.

### Leva 4 — Backend: RLS apontando pra `can()`
- Reescrever policies das tabelas `eng_*`, `crea_*`, `hrdp_*`, `comm_*`, `gov_*` para usar `public.can(auth.uid(), '<chave>', company_id)` em vez de `eng_can_edit` etc.
- Funções antigas (`eng_can_edit`, `crea_can`, `hrdp_can`, `comm_can`, `gov_can_edit`, `theme_can`) ficam como **shims** que delegam para `can()` — marcadas como deprecated, removidas na leva 6.

### Leva 5 — ADM > Visibilidade vira o painel central
**Sem criar tela nova** — adapto `CompanyPermissionsMatrix` (já é o coração do ADM hoje) seguindo o fluxo da imagem:

```
Módulo → Empresa → Perfil → Usuário → Permissões (chips com +/-)
```

Mudanças:
- Lê do `acl_permissions_catalog` (não mais `plan_modules_catalog` cru).
- Grava via RPC `acl_grant`/`acl_revoke` (com auditoria automática).
- **Bloqueia cliente pagante:** o componente checa `is_internal_ocs(auth.uid())` antes de renderizar o painel de edição. Cliente vê só leitura ("Para alterar permissões fale com a OCS").
- Mantém o filtro por setor (que já existe).
- Remove o botão "Permissões V/E/D" do `CompanySheet` — passa a redirecionar para ADM > Visibilidade quando interno; some para cliente.

### Leva 6 — Limpeza
- Remover `eng_module_permissions`, `crea_module_permissions`, `hrdp_module_permissions`, `comm_module_permissions`, `theme_permissions`, `company_module_permissions` (após backfill p/ `acl_user_permissions`).
- Remover hooks `use*Access` deprecated, deixando só `useCan`.
- Remover `CompanyPermissionsMatrix` do `CompanySheet`.
- Documentar em `mem://features/acl-central.md`.

---

## Backfill / migração de dados
Script SQL que converte:
- `eng_module_permissions(user_id, module, can_view/edit/delete)` → 3 linhas em `acl_user_permissions` (`engenharia.{module}.visualizar/editar/excluir`).
- Idem para `crea_*`, `comm_*`, `hrdp_*`, `theme_*`, `company_module_permissions`.
- `user_roles` "internas OCS" (admin, financeiro_ocs) → `is_internal_ocs = true`.

---

## O que NÃO mexer agora
- `companies`, `company_users`, `company_plans`, `plan_modules_catalog` (continuam definindo **elegibilidade comercial**).
- Auth/login (`Auth.tsx`, triggers `handle_new_user`).
- `protect_platform_owner_membership` (já garante owner inviolável).
- Lógica de negócio dos módulos (só os checks de permissão mudam).

---

## Critério de aceite
- [ ] Toda checagem `has_role`, `eng_can_edit`, `crea_can`, etc. no frontend roteia por `useCan`.
- [ ] Toda RLS sensível usa `public.can()`.
- [ ] Cliente pagante recebe `forbidden` ao tentar `acl_grant`.
- [ ] Cada grant/revoke gera linha em `acl_audit_logs`.
- [ ] ADM > Visibilidade lista Módulo→Empresa→Perfil→Usuário→Permissões e tem botão "+ Permissão".
- [ ] Tabelas e funções antigas marcadas deprecated ou removidas.

---

## Tamanho e risco
Trabalho grande (≈6 migrations, ≈40 arquivos editados, ≈8 RPCs novas). Sugiro executar **uma leva por turno** com aprovação no fim de cada uma — começo pela **Leva 1** (fundação) que é segura e não quebra nada do que existe hoje (tudo continua funcionando em paralelo até a Leva 3).

Confirmo prosseguir com a **Leva 1** assim que você aprovar este plano?
