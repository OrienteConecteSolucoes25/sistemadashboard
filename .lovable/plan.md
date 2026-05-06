
# Módulo RH/DP — Plano técnico (somente arquitetura)

## 1. Divisão RH × DP × BI

**RH (gestão de pessoas e atração)**
- Recrutamento e Entrevistas
- Banco de Currículos
- Gestão de Pessoas (perfil, histórico, movimentações)
- Benefícios (visão do colaborador)
- Pacotes de Descontos Corporativos (cotação)
- Solicitações dos Colaboradores (fila RH/DP)
- Comunicação Interna
- Painel de Risco (rotatividade, clima, alertas)

**DP (operacional trabalhista)**
- Admissão
- Documentos do Colaborador
- Contratos
- Controle de Ponto
- Banco de Horas / Hora Extra
- Férias
- Provisão de Férias
- Holerite
- Fechamento de Folha
- Pagamentos e Seguros

**BI RH/DP (somente leitura, agregações)**
- Absenteísmo, Turnover, Férias (vencidas/a vencer), Banco de horas, Hora extra, Total de funcionários, Vínculos, Entrevistas, Alertas/Riscos

---

## 2. Tabelas (todas com prefixo `hrdp_`)

```text
hrdp_module_settings        — config por empresa (submódulos ativos, regras de ponto/HE/férias)
hrdp_employees              — colaboradores (vinculados a company_id)
hrdp_employee_documents     — anexos por colaborador (storage privado)
hrdp_contracts              — contratos + modelo, vigência, status
hrdp_time_entries           — batidas (in, almoço, retorno, out)
hrdp_overtime_requests      — solicitações de HE (gestor → DP)
hrdp_time_bank              — saldo banco de horas
hrdp_vacations              — períodos aquisitivos / programações / status
hrdp_vacation_provisions    — cálculo estimado (não oficial)
hrdp_payslips               — holerites (PDF + competência)
hrdp_payroll_closings       — fechamento mensal consolidado
hrdp_benefits               — benefícios por colaborador
hrdp_benefit_quotes         — cotações de pacotes corporativos (rascunho/aprovado)
hrdp_employee_requests      — fila de solicitações
hrdp_candidates             — banco de currículos
hrdp_interview_questions    — perguntas padrão (config)
hrdp_interviews             — entrevistas + parecer
hrdp_people_risks           — observações sensíveis e alertas
hrdp_audit_logs             — log dedicado (além do `eng_auditoria` global)
```

Todas com: `id`, `company_id`, `created_at`, `updated_at`, `is_deleted`, `deleted_*`, `data jsonb` para campos extras.

---

## 3. Permissões

**Novos roles** (extender `app_role`):
`rh_admin`, `dp_admin`, `gestor_area`, `colaborador`, `auditor_rh`, `financeiro_rh`

**Matriz por submódulo**: `can_view`, `can_create`, `can_edit`, `can_delete`, `can_import`, `can_export`, `can_approve`, `can_view_sensitive`, `can_manage_settings` — armazenada em `hrdp_module_permissions(user_id, company_id, submodule, flags...)`.

**Função SQL** `hrdp_can(_uid, _company, _submodule, _action)` (security definer) para uso nas RLS — evita recursão.

**Regras de escopo**:
- `colaborador` → apenas seu próprio registro
- `gestor_area` → registros onde `gestor_id = self` (filtro por setor/equipe)
- `rh_admin` / `dp_admin` → toda a empresa (na sua área)
- `auditor_rh` → SELECT em tudo + logs, sem UPDATE/DELETE
- `admin` global OCS → tudo

---

## 4. Dados sensíveis (LGPD)

Marcados como **restritos** (só `can_view_sensitive`):
- CPF, RG, dados bancários, chave Pix, salário, holerite, contratos, anexos pessoais, observações internas em `people_risks`, dados médicos/atestados.

**Tratamento**:
- Storage bucket `hrdp-private` (não-público) com policies por `company_id`.
- Mascaramento padrão na UI (`***.***.***-XX`) — desmascarar exige permissão + log.
- Log obrigatório de **visualização** desses campos (não só edit/delete).
- Retenção e anonimização documentadas em `hrdp_module_settings`.

---

## 5. Cálculos parametrizáveis (em `hrdp_module_settings.data`)

- Jornada padrão (h/dia, h/semana)
- Tolerância de ponto (min)
- Limite mensal de HE
- % adicional HE dia útil / fim de semana / feriado
- Regra banco de horas: acumular vs pagar; vencimento
- Período aquisitivo de férias (12m default)
- Janela "vencendo" (ex: ≤60 dias)
- Adicional de 1/3 férias (default 33,33%)
- Cálculo de provisão (estimado, com aviso visual)

Sempre com banner: *"Cálculo estimado. Validação humana obrigatória — convenção coletiva pode alterar."*

---

## 6. Ativação de submódulos por empresa

- `hrdp_module_settings(company_id, submodule_key, enabled, config jsonb)`
- Catálogo `hrdp_submodules_catalog` (key, label, area: rh|dp|bi, default_enabled).
- Tela **OCS** em `/app/planos` (sub-aba "RH/DP") liga/desliga por empresa.
- Tela **company admin** em `/app/rh-dp/configuracoes` ajusta apenas regras (não ativa).
- Hook `useHrdpModules(company_id)` controla rotas e itens da sidebar.

---

## 7. Tela inicial `/app/rh-dp`

Dashboard "comando" (somente cards habilitados pelos submódulos ativos):
- KPIs: Colaboradores ativos · Em admissão · Contratos vencendo · Férias vencendo · HE no mês · Solicitações abertas
- Atalhos rápidos: Nova admissão · Nova solicitação · Aprovar HE · Aprovar férias
- Tabs: **Visão Geral · Alertas · Aprovações pendentes · Auditoria recente**
- Sidebar (filtrada por permissões): Dashboard / Colaboradores / Admissão / Documentos / Contratos / Ponto / Banco de Horas / Férias / Provisão / Holerites / Folha / Benefícios / Pacotes / Solicitações / Recrutamento / Indicadores / Configurações / Auditoria

---

## 8. Implementação em 9 fases

```text
F1  Base RH/DP        → catálogo, settings, sidebar, dashboard vazio, roles + RLS
F2  Colaboradores     → hrdp_employees + vínculos + permissões finas
F3  Admissão + Docs   → checklist por vínculo, upload privado, status
F4  Contratos         → modelos, vencimento, renovação
F5  Ponto + HE + BH   → batidas, ajustes, aprovação, saldo
F6  Férias + Provisão → cálculo aquisitivo, alertas, estimativa
F7  Solicitações      → fila SLA, comentários, anexos
F8  Recrutamento      → candidatos, perguntas, entrevistas
F9  Benefícios + Pacotes → cotação assistida (sem IA pública), aprovação OCS
F10 Folha + Holerite  → consolidação, conferência, PDF
F11 BI RH/DP          → dashboards agregados
```

Cada fase entrega: migration + tipos + página + DataActionsToolbar + DeleteWithPasswordModal + auditoria.

---

## 9. Riscos legais / LGPD

- **CLT/convenção**: cálculos de HE, BH e férias variam por sindicato → marcar tudo como estimado, exigir aprovação humana.
- **eSocial/folha oficial**: não emitir; integração futura com contabilidade.
- **LGPD**: base legal = execução de contrato + obrigação legal trabalhista. Exige:
  - Consentimento explícito para dados sensíveis adicionais (saúde, biometria do ponto)
  - Direito de acesso/portabilidade do colaborador
  - Log de quem visualizou dado sensível
  - Retenção: dados de candidatos não contratados ≤ 2 anos
  - Storage privado e criptografado em repouso
- **Geolocalização do ponto**: opt-in, configurável por empresa, nunca obrigatória.
- **Holerite**: colaborador só vê o próprio (RLS rígida).

---

## 10. O que NÃO implementar agora

- Integração eSocial / DARF / FGTS
- Folha oficial fechada (apenas conferência)
- Reconhecimento facial / biometria
- IA pública pesquisando benefícios e publicando direto (regra de ouro: aprovação OCS sempre)
- APIs pagas (Flash, TotalPass, iFood) — só campos manuais e link de referência
- Scraping de fornecedores
- Assinatura digital de contratos (fase futura)
- App mobile dedicado (mobile-first responsivo basta)
- Notificações por SMS/WhatsApp (usar notif interna existente)

---

## Próximo passo

Quando aprovar, começo pela **Fase 1 (Base RH/DP)**:
- migration: `app_role` += rh_admin/dp_admin/gestor_area/colaborador/auditor_rh, `hrdp_module_settings`, `hrdp_submodules_catalog`, `hrdp_module_permissions`, função `hrdp_can`
- rota `/app/rh-dp` + guard + sidebar agrupada
- aba "RH/DP" em `/app/planos` (OCS) para ligar submódulos por empresa

Diga **"fase 1"** quando quiser que eu execute.
