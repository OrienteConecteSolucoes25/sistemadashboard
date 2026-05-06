## Refatoração completa de Aparência & Marca OCS

Escopo grande — vou implementar em uma única leva, mas organizado em blocos. Aqui vai o que será feito antes de mexer no código.

### Bloco 1 — Banco de dados (1 migration)

Novas tabelas + ajustes:

- `company_theme_settings` — tema salvo por empresa (preset, paleta completa em HEX, fonte, raio, sombra, densidade, estilo de sidebar). Substitui/estende o que está em `aparencia` hoje sem quebrar.
- `company_chart_preferences` — `(company_id, module_key, tab_key, subtab_key, metric_key, allowed_chart_types text[], default_chart_type, user_can_switch)`.
- `user_chart_preferences` — preferência individual do usuário por métrica.
- `user_layout_preferences` — `(user_id, company_id, module_key, internal_sidebar_collapsed, table_density, dashboard_density)`.
- `theme_audit_logs` — antes/depois de cada alteração, com usuário/empresa/tipo.
- Função RPC `theme_save(_company, _payload)` que valida permissão (`can_manage_theme`/admin) e grava + audita atomicamente.
- Função RPC `theme_restore_default(_company, _reason)`.
- Permissões novas no enum/role-check: `can_view_theme`, `can_manage_theme`, `can_manage_company_brand`, `can_manage_chart_preferences`, `can_view_theme_audit` (via tabela `theme_permissions` por usuário, sem mexer em RLS de outros módulos).
- Todas as tabelas com RLS: leitura permitida ao usuário da empresa; escrita só com `can_manage_theme` ou admin.

### Bloco 2 — Sidebar interna recolhível (CollapsibleModuleSidebar)

Componente único reutilizável `<CollapsibleModuleSidebar>` substituindo as sidebars escuras fixas de Engenharia, Jurídico, RH/DP, CREA, Comunicação:

- Estado controlado por `useUserLayoutPreferences(moduleKey)` — persiste no banco.
- Botão recolher/expandir no topo. Quando recolhida → só ícones com tooltip (shadcn `Tooltip`).
- Mobile: vira Sheet/drawer.
- **Cores via tokens** (`bg-sidebar`, `text-sidebar-foreground`, `bg-sidebar-accent`) — nunca preto hard-coded. Cada tema define esses tokens.
- Migra os 5 layouts existentes (`EngLayout`, `JurLayout`, `HrdpLayout`, `CreaLayout`, `CommLayout`) para usar o novo componente, preservando todas as rotas/abas atuais.

### Bloco 3 — ThemeStudio reescrito

Página `/app/aparencia` reorganizada em abas:

1. **Empresa** — seletor obrigatório, badge "tema ativo", botão restaurar padrão.
2. **Presets** — 7 cards (Glassmorphism, Neo-Brutalism, Corporate Clean, Minimal Tech, Dark Premium, Soft SaaS, Industrial Ops) com mini-preview real, badge "Ativo" só no salvo, "Em pré-visualização" quando aplicado ao draft.
3. **Cores** — `<ColorField>` por token (23 cores listadas), com:
   - input nativo `<input type="color">` (picker visual)
   - campo HEX editável (validado)
   - HSL avançado em `<Collapsible>` recolhido por padrão
   - botão copiar HEX
   - botão restaurar padrão daquele campo
4. **Tipografia & Layout** — fonte, raio, sombra, densidade, estilo da sidebar.
5. **Gráficos** — `<ChartPreferencesPanel>`: árvore Módulo → Aba → Sub-aba → Métrica, multi-select de tipos permitidos + radio para padrão + toggle "usuário pode trocar". Botões "aplicar a todos os módulos" e "restaurar padrão OCS".
6. **Preview** — `<ThemePreviewPanel>` num iframe-like sandbox que renderiza dashboard fake (KPIs, tabela, formulário, modal, sidebar mock, pizza/barras/linha, badges, alertas, mini-Engenharia, mini-Jurídico) usando **apenas o draft**.
7. **Auditoria** — tabela com data/usuário/empresa/tipo/resumo + botão "Ver antes/depois" (diff JSON).

### Bloco 4 — Fluxo de salvamento com draft

- Hook `useThemeDraft(companyId)` — carrega tema salvo, mantém draft local em memória, expõe `isDirty`, `reset`, `apply`.
- Provider `<ThemeDraftProvider>` envolve a página — TODAS as abas (incluindo Preview) leem do draft.
- O `CompanyThemeProvider` global continua aplicando apenas o tema **salvo** no banco — draft NÃO escapa da página de aparência.
- Botão "Salvar Tema":
  - Desabilitado se sem empresa OU sem alterações.
  - Abre `<SaveThemeConfirmationDialog>` com resumo (empresa, preset antes/depois, cores alteradas, gráficos alterados, layout alterado, aviso de impacto).
  - Confirmar → chama RPC `theme_save` → toast sucesso → atualiza badge "Ativo" → audita.
- Botão "Restaurar padrão" → `<RestoreThemeConfirmationDialog>` → RPC `theme_restore_default`.
- Indicador persistente "Alterações não salvas" no header da página quando `isDirty`.

### Bloco 5 — Aplicação real do tema

- `CompanyThemeProvider` (já existe) estendido para:
  - injetar TODOS os 23 tokens HEX→HSL em `:root` via CSS vars.
  - aplicar fonte, raio, sombra como CSS vars (`--radius`, `--shadow-elegant`, `--font-display`).
  - aplicar tokens de sidebar (`--sidebar`, `--sidebar-foreground`, `--sidebar-accent`) — é isso que tira o preto fixo.
- Tema afeta automaticamente: dashboards, cards, botões, tabelas, formulários, menus, sidebar interna, gráficos (paleta `chart-1..5`).

### Bloco 6 — Gráficos configuráveis nos dashboards

- Hook `useChartType(moduleKey, tabKey, metricKey)` — retorna `{ allowed[], current, setCurrent }`. Lê preferência do usuário, fallback para padrão da empresa, fallback para padrão OCS.
- Componente `<ConfigurableChart metric="..." data={...} />` — renderiza o tipo atual e expõe seletor inline ("Visualização: Pizza | Barras | Donut") quando `user_can_switch`.
- Aplicado nos dashboards já existentes de Engenharia e Jurídico como exemplo (substituição mínima — sem mexer na lógica de dados). RH/DP, CREA, Comunicação ganham o hook disponível para uso futuro.

### Bloco 7 — Integração Design Studio (Comunicação)

- `useCompanyBrandTokens()` exposto para o módulo Comunicação consumir cores/fonte/estilo da empresa ao gerar templates/prompts. Sem reescrever templates — só passa os tokens.

### Bloco 8 — Ajustes visuais gerais

- Grid responsivo nos dashboards (`grid-cols-1 md:grid-cols-2 xl:grid-cols-4`), `min-w-0` nos cards, `truncate`/`break-words` em títulos longos, `h-full` nos containers de gráfico.

### Permissões / Segurança

- Tabela `theme_permissions(user_id, company_id, can_view, can_manage, can_manage_brand, can_manage_charts, can_view_audit)`.
- Função `theme_can(_uid, _company, _action)` análoga a `crea_can`/`comm_can`.
- RLS em todas as novas tabelas referenciando `theme_can`.
- Admin geral sempre passa.
- `<ThemeStudioGuard>` na rota `/app/aparencia` bloqueia acesso de quem não tem `can_view_theme`.
- Toda alteração registra em `theme_audit_logs` via RPC.

### O que NÃO será tocado

- RLS de Engenharia, Jurídico, RH/DP, CREA, Comunicação, Pixel.
- Lógica de auth, roles existentes, `eng_can_edit`, `crea_can`, `comm_can`, `hrdp_can`.
- Dados operacionais.
- Edge functions existentes.

### Ordem de execução

1. Migration única com tudo do Bloco 1 (peço aprovação, é o único passo bloqueante).
2. Após aprovada: implemento Blocos 2–8 em sequência, em uma só resposta.

Posso seguir? A migration vai primeiro.