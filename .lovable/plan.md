# Finalizar Módulo CREA & ART

Hoje o módulo tem estrutura, tabelas, RLS, RPCs de segurança, layout, dashboard e governança — mas as telas operacionais são **somente leitura** ("CRUD completo nas próximas iterações"), Credenciais e Assistente IA estão como placeholders, e ainda não há admin do CREA. Esta leva fecha tudo o que falta.

## Escopo (4 frentes)

### 1. CRUD completo nas 13 telas de cadastro/operação

Substituir o `GenericListPage` (read-only) por uma página real reaproveitando o padrão global do projeto:

- **DataActionsToolbar** (Exportar xlsx/csv/docx + Modelo + Importar) — já existe no projeto, mesmo padrão de Engenharia/Jurídico. Exceto a parte de importar e modelo que deve seguir o modelo da sub-aba DADOS na aba governança do modulo de engenharia onde o sistema se adapta a planilha importada. ao fazer isso a parte exportar terá também que se adaptar ao formato de planilha que tiver na empresa e a empresa tiver importado.
- Botão **Novo** abrindo Sheet/Dialog com formulário dinâmico por tabela.
- Linha clicável → Sheet de edição.
- **Excluir** via `DeleteWithPasswordModal` chamando RPC `crea_soft_delete(table, id, reason)`.
- Filtros: busca textual + filtro por UF e por status (quando aplicável).
- Ordenação por coluna e paginação (200/página).
- Realtime opcional (subscribe na tabela) para refletir mudanças.

Telas afetadas: ARTs, Protocolos, CATs, Certidões, Baixas, Tratativas, Prazos, RTs, Empresas e CREAs, Documentações, Normas, Links Oficiais, Auditoria (read-only só com filtros).

Implementação: criar `CreaCrudPage.tsx` parametrizável + `creaCrudConfigs.ts` com schema (campos, tipos, máscaras, opções) por tabela. Os Pages atuais passam a delegar para esse componente.

### 2. Credenciais — UI segura funcional

Construir `CredenciaisPage` real:

- Banner para definir a **chave-mestra** (admin OCS) via `crea_set_master_key` se ainda não definida.
- Lista de credenciais (UF, empresa, RT, portal, login mascarado, última revelação).
- Botão **Nova Credencial** → form (UF, empresa, RT, portal, login, senha) → `crea_save_credential` (cifragem AES no servidor).
- Botão **Revelar Senha** → modal exigindo **motivo** (texto obrigatório) + senha do usuário logado → `crea_reveal_credential` → mostra senha por 30s com cópia única e auto-ocultação.
- Toda revelação grava em `crea_audit_logs`.
- Visível só com permissão `can_view_credentials` (resto do time só vê o login mascarado).

### 3. Assistente IA CREA

- Criar edge function `**crea-ai-assist**` (Lovable AI Gateway, model `google/gemini-2.5-flash`) com RAG simples: busca em `crea_ai_sources` (filtro por UF + tema), monta contexto, devolve resposta + lista de fontes citadas.
- UI em `AssistentePage`: chat (pergunta + resposta + fontes), histórico salvo em `crea_ai_questions`, filtro por UF.
- Aviso explícito: "Responde apenas com base nas fontes cadastradas. Não inventa norma de CREA."
- NotebookLM apenas como link de referência opcional no rodapé.

### 4. CreaAdminPage (admin OCS)

Nova rota `/app/crea/admin` (admin-only) com abas:

- **Papéis & Permissões**: gerenciar `user_roles` (crea_*) e `crea_module_permissions` por empresa/usuário.
- **Chave-mestra**: status, rotação (re-cifra credenciais existentes).
- **Fontes IA**: CRUD de `crea_ai_sources` (DN, PL, resoluções, checklists).
- **Configurações**: `crea_module_settings` (defaults por empresa).
- **Auditoria**: visão consolidada de `crea_audit_logs` com filtros.

## Detalhes técnicos

### Novos arquivos

- `src/modules/crea/ui/crud/CreaCrudPage.tsx` — página parametrizável (lista + toolbar + form sheet + delete).
- `src/modules/crea/ui/crud/creaCrudConfigs.ts` — schema de cada tabela CREA.
- `src/modules/crea/ui/CredenciaisPage.tsx` — substitui placeholder.
- `src/modules/crea/ui/RevealCredentialModal.tsx`.
- `src/modules/crea/ui/AssistentePage.tsx` — substitui placeholder (chat real).
- `src/modules/crea/ui/CreaAdminPage.tsx` — admin com tabs.
- `src/modules/crea/lib/creaCrud.ts` — helpers (insert/update/soft-delete + audit).
- `supabase/functions/crea-ai-assist/index.ts` — edge function RAG.

### Backend (migration)

- Tabela auxiliar `crea_ai_questions` (se ainda não existir): pergunta, resposta, fontes_citadas, uf, user_id, company_id.
- Garantir RPC `crea_save_credential` aceitar update (não só insert).
- Garantir índice em `crea_ai_sources(uf, tema)` para RAG.
- (Reaproveita `crea_can`, `crea_soft_delete`, `theme_audit_logs` patterns já existentes.)

### Padrões reutilizados (sem reimplementar)

- `DataActionsToolbar`, `ImportDataModal`, `lib/dataIO` (xlsx/csv/docx).
- `DeleteWithPasswordModal`.
- `CollapsibleModuleSidebar` (já em uso).
- `EngPageHeader` / `KpiGrid` (mesmo padrão visual).
- Lovable AI Gateway (sem API key extra).

## Critérios de aceite

- Em qualquer tela CREA: criar, editar, exportar, importar e excluir (com senha+motivo) funcionam.
- Credenciais: definir master key, cadastrar e revelar senha (com motivo + auditoria) funcionam.
- Assistente responde citando fontes de `crea_ai_sources` e grava histórico.
- `/app/crea/admin` acessível só para admin OCS, com 5 abas operacionais.
- Nenhuma cor hard-coded; tudo via tokens HSL.
- Soft delete em todas as tabelas crea_* (nunca DELETE físico).