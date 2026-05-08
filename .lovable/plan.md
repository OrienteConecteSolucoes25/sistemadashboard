## Mudanças solicitadas

### 1. ADM → Permissões por empresa: listar todos os usuários
**Problema:** matriz só mostra quem está em `company_users` (1 usuário). Há 10 perfis com e-mail `@novacorrente`.
**Fix:** quando o admin global abre a aba (`allModulesOverride`), a matriz lista **todos os perfis** (não só vinculados). Ao salvar permissões de um usuário "novo", também cria registro em `company_users` automaticamente.

### 2. Engenharia → Solicitações → Nova solicitação
- Renomear campo **"Técnico"** para **"Equipe"** (não obrigatório).
- Adicionar campo **"Empresa"** ao lado de Equipe (não obrigatório). Lista vem de `companies`.
- Se houver equipes vinculadas àquela empresa, mostrar no select de equipe; senão, deixa livre.
- Restaurar painel **"Solicitações em aberto desta obra/cliente"** abaixo do form: lista as solicitações já criadas mostrando apenas os **materiais sem SC/RC vinculada**, com botão "Adicionar mais materiais" que reabre a solicitação para anexar novos itens.

### 3. Engenharia → Solicitações pendentes (lista)
- Remover coluna **"Descrição"** da tabela (a descrição passa a aparecer só dentro do modal SC/RC).

### 4. Modal "SC/RC vinculados"
- **Topo:** trocar tabela "Materiais da solicitação" por **cabeçalho com Endereço, Cidade e UF** da obra.
- **Tabela SC/RC:** primeira coluna passa a ser **"Material (descrição)"** — cada linha SC/RC é vinculada a um item da solicitação (select com os itens). Ao escolher o material, **categoria, conta financeira e centro de custo** são auto-preenchidos a partir do item/cadastro.
- Editar/inserir mantém só o nº do documento como obrigatório; demais auto-vêm.
- **Mesmo nº em mais de 1 material:** clicar no nº abre um **popover** listando todos os materiais agrupados sob aquele número.

### Detalhes técnicos

**Migração DB**
```sql
ALTER TABLE public.eng_solicitacao_sc_rc
  ADD COLUMN IF NOT EXISTS item_descricao text;
CREATE INDEX IF NOT EXISTS idx_scrc_solicit_numero ON public.eng_solicitacao_sc_rc (solicit_id, numero_documento);
```

**Arquivos a editar**
- `src/modules/planos/ui/CompanyPermissionsMatrix.tsx` — merge de profiles em modo override + auto-insert em `company_users` no save.
- `src/modules/engenharia/lib/scrcStore.ts` — incluir `item_descricao` no tipo.
- `src/modules/engenharia/ui/SolicitanteTab.tsx` — campo Empresa, rename Técnico→Equipe (não obrigatórios), painel inferior de solicitações abertas.
- `src/modules/engenharia/ui/SuprimentosPage.tsx` — modal SC/RC: cabeçalho endereço, coluna material, popover de agrupamento por nº; remover coluna Descrição da listagem principal.
