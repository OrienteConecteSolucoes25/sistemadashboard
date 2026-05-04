
# Plano — Recriar Engenharia (Oriente) completo no ERP OCS

> Trabalho grande. Vou ser direto sobre o que consigo fazer sozinho e o que depende de você.

---

## 🚨 Bloqueios que precisam de ação sua antes de eu começar

### 1. Usuários do Oriente — preciso da SERVICE_ROLE_KEY do Oriente
Você escolheu "Eu leio a tabela `auth.users` do Oriente". Isso só é tecnicamente possível com a **`SUPABASE_SERVICE_ROLE_KEY`** do projeto Oriente (`mjfkrwheepedhofopidm`). A chave anon não acessa `auth.users`.

Vou te pedir, no início da execução, para colar essa chave como secret (`ORIENTE_SERVICE_ROLE_KEY`). Com ela, uma edge function vai:
- Listar `auth.users` do Oriente.
- Criar cada um no ERP OCS via Admin API com senha temporária aleatória.
- Disparar e-mail de "definir senha" (reset) para cada usuário.
- Copiar `full_name` e e-mail para `profiles`.
- Não copiar roles automaticamente (você atribui depois em ADM).

Se preferir não passar a service_role, a alternativa é você colar a lista de e-mails (CSV ou texto). Sem uma das duas, esse passo não roda.

### 2. Schema do Oriente — vou replicar apenas o que está no código
Não tenho acesso direto ao banco do Oriente. Vou inferir as tabelas a partir dos componentes e libs (`governanca_master`, `gov_atividades_raw`, `gov_faturamento_raw`, `gov_resultados_raw`, `governance_action_plan`, `governance_settings`, `projetos`, `sites`, `demandas`, `rfi`, `atividades`, `equipes`, `fibra_*`, `suprimentos`, `ligacoes_energia`, `art`, `auditoria`, `emails`, `integracoes`, `roadmap_ia`, `mapa`, `relatorios` etc.). **Pode haver colunas que existem no Oriente mas não aparecem no código — essas ficam de fora desta primeira leva.**

### 3. Erro da Governança no Oriente original
Você disse que o erro está no Oriente. Para corrigir ao portar, preciso saber o sintoma. Vou rodar uma análise estática do código de Governança (vejo que ele lê de `governanca_master` mas o realtime escuta `gov_*_raw` — possível desalinhamento) e listar os bugs prováveis. Se você souber o erro exato (mensagem ou comportamento), me diga junto da aprovação do plano.

---

## Escopo do port (todas as ~20 abas, código idêntico)

### Rotas a criar no ERP OCS (sob `/app/engenharia/...`)
Vou re-encaixar as rotas planas do Oriente dentro do módulo Engenharia já existente, mantendo nomes:

```
/app/engenharia                  → dashboard (já existe, será expandido)
/app/engenharia/projetos
/app/engenharia/sites             (já existe — será substituído pelo real)
/app/engenharia/rfi               (idem)
/app/engenharia/pendencias        (idem)
/app/engenharia/materiais         (idem)
/app/engenharia/equipes           (idem)
/app/engenharia/relatorios        (idem)
/app/engenharia/governanca        ← NOVA (com correção)
/app/engenharia/atividades
/app/engenharia/demandas
/app/engenharia/fibra
/app/engenharia/suprimentos
/app/engenharia/ligacoes-energia
/app/engenharia/mapa
/app/engenharia/auditoria
/app/engenharia/art
/app/engenharia/emails
/app/engenharia/integracoes
/app/engenharia/roadmap-ia
/app/engenharia/equipe/:teamId/checkin
```

### Tabelas a criar (vazias, com RLS)
Todas com prefixo `eng_` para evitar conflito (PROMPT 16). Mapeamento:

| Oriente | ERP OCS |
|---|---|
| `governanca_master` | `eng_governanca_master` |
| `gov_atividades_raw` | `eng_gov_atividades_raw` |
| `gov_faturamento_raw` | `eng_gov_faturamento_raw` |
| `gov_resultados_raw` | `eng_gov_resultados_raw` |
| `governance_action_plan` | `eng_gov_action_plan` |
| `governance_settings` | `eng_gov_settings` |
| `projetos` | já existe — **vou criar `eng_projetos`** separado, sem mexer no atual |
| `sites`, `demandas`, `rfi`, `atividades`, `equipes`, `fibra_*`, `suprimentos`, `ligacoes_energia`, `art_*`, `auditoria`, `emails_log`, `integracoes`, `roadmap_ia` | `eng_sites`, `eng_demandas`, `eng_rfi`, `eng_atividades`, `eng_equipes`, `eng_fibra_*`, `eng_suprimentos`, `eng_ligacoes_energia`, `eng_art_*`, `eng_auditoria`, `eng_emails_log`, `eng_integracoes`, `eng_roadmap_ia` |

RLS padrão por tabela:
- `SELECT`: `has_role(admin) OR has_visibility(uid, '<table>', id)` quando o módulo for restrito; senão `authenticated`.
- `INSERT/UPDATE/DELETE`: admin + papéis específicos (planejamento, diretoria, gestor de obra etc., conforme cada aba do Oriente exige).

Roles novas a adicionar ao enum `app_role`: `planejamento`, `diretoria`, `engenharia`, `suprimentos`, `fibra`.

### Componentes / hooks / libs a portar
- `src/modules/engenharia/components/governance/*` (5 arquivos: Dashboard, ActionPlan, Data, DataSources, Reports)
- `src/modules/engenharia/components/{adm,art,fibra}/*` (subpastas)
- `src/modules/engenharia/components/*` (todos os ~25 utilitários: PageShell, KpiCard, AssistenteFloating, RobozinhoFloating, ImportExportBar, SmartSelect, NotificationsBell, ObraDetail, EnergiaCharts, ProjetosCharts, ItensSolicitacaoPicker, BulkSelectToolbar, ConfirmDestructive, DynamicFormsTabs, DynamicTab, EnviarOutlookRcDialog, PendenciasAggregator, PermissoesTab, SharePointListConfig, SharePointPicker, SiteAutoInput)
- `src/modules/engenharia/hooks/*` (10 hooks: useGovernanceAccess, useFibraChecklists, useFieldOptions, useMateriais, useModulePermissions, useObraVinculos, useProjetos, useRealtimeList, useSharedRealtime, useSites)
- `src/modules/engenharia/lib/*` (todos os ~20: governanceReport, govReportBuilders, govDocxBuilder, govSources, govAtividades, governanceImport, projetosImport, fibraChecklist, sharepointSync, sharepointSuprimentos, syncList, scrcStore, sharedStore, robozinho, siteAutocreate, audit, storage, emailRcConfig, constants, utils)

Adaptações obrigatórias:
- Trocar TanStack Router (`createFileRoute`) por React Router DOM.
- Trocar imports `@/` para `@/modules/engenharia/...` para isolamento.
- Reusar `useAuth` do ERP, **não** portar `AuthProvider` do Oriente.
- Trocar nomes de tabela para `eng_*` em todos os `supabase.from(...)`.
- Sidebar do ERP: substituir o item "Engenharia" por sub-menu colapsável com as 19 abas.

### Correção do bug da Governança ao portar
Análise estática já feita:
1. `governanca_master` é lida mas a hidratação assume várias colunas que podem não existir → vou criar `eng_governanca_master` com **todas** as colunas usadas (`localizador`, `data_acionamento`, `area_atuacao`, `cliente`, `tipo_atividade`, `status`, `prazo_final`, `termino_real`, `responsavel`, `valor_inicial`, `faturamento_total`, `custo_total_direto_real`, `custos_diversos_total`, `resultado_real`, `margem_real`, `quantidade_replan_total`, `ofensor`, `causa_raiz`, `prioridade`).
2. Realtime escuta `gov_*_raw` mas o select é em `governanca_master` → vou alinhar o realtime para escutar **também** `eng_governanca_master`.
3. `governance_settings.id = true` é estranho (id boolean). Vou criar `eng_gov_settings` com `id boolean primary key default true` (singleton row) e seed de uma linha `{id: true, edit_open_to_all: false}`.
4. `useGovernanceAccess` assume roles `planejamento`/`diretoria` que não existem no enum → vou adicioná-las.
5. Cast `as never` em `from("governanca_master" as never)` indica que types.ts não tinha a tabela → no ERP os types serão regenerados após as migrations, removendo o cast.

---

## Fases de execução

**Fase A — Schema & roles (1 migration grande)**
- Adiciona valores ao enum `app_role`.
- Cria todas as tabelas `eng_*` vazias com RLS.
- Seed: 1 linha em `eng_gov_settings`.

**Fase B — Edge function `port-oriente-users`**
- Pede secret `ORIENTE_SERVICE_ROLE_KEY` (parada obrigatória aqui).
- Lê `auth.users` do Oriente, cria no ERP, dispara reset de senha.
- Loga em `visibility_audit`.

**Fase C — Port de libs e hooks** (sem UI ainda, para validar tipos).

**Fase D — Port de componentes governance + outros componentes compartilhados.**

**Fase E — Port das 19 rotas + sub-menu na sidebar do ERP.**

**Fase F — Smoke test:** abrir cada aba logado como admin e confirmar que renderiza sem erro (vazia é OK).

---

## Detalhes técnicos

- Nenhuma migração destrutiva. Tudo `CREATE TABLE IF NOT EXISTS`.
- Nada toca módulo Pixel Office nem Jurídico.
- Tabela `projetos` atual do ERP fica intacta — port vira `eng_projetos`.
- Mocks atuais de Engenharia (`engMockData.ts`) ficam removidos quando as tabelas reais entrarem.
- Nenhum dado real do Oriente é copiado (alinhado com PROMPT 17/19).
- Edge function de port de usuários só roda **uma vez**, sob comando manual de admin via UI em `/app/adm`.

## Riscos
- Escopo muito grande; vou entregar em commits por fase para você acompanhar.
- Colunas faltantes nas tabelas inferidas vão aparecer como erros runtime → corrigíveis sob demanda.
- Se a senha temporária dos usuários portados gerar e-mails em massa, alguns podem cair em spam.

## O que você precisa me dar para eu começar
1. Confirmar o plano.
2. Estar pronto para colar `ORIENTE_SERVICE_ROLE_KEY` quando eu pedir (Fase B).
3. (Opcional) Mensagem exata do erro da Governança no Oriente, se souber.
