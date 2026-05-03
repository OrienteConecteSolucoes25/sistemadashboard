# Controle de Visibilidade no ADM — OCS

Protótipo focado da feature "Admin define quais usuários veem as mesmas coisas que quais usuários", combinando **Grupos de Visibilidade** com **escopo por módulo** configurável.

> Esse projeto será apenas um protótipo isolado (Lovable Cloud + uma página `/adm`). Quando aprovado, você leva o esquema/SQL e os componentes pro projeto OCS principal.

## Conceito

- **Grupo de Visibilidade**: conjunto nomeado de usuários que compartilham o mesmo recorte de dados (ex.: "Equipe SP", "Cliente Vivo", "Diretoria").
- **Usuário ↔ Grupo**: N:N. Um usuário pode estar em vários grupos; vê a união dos dados desses grupos.
- **Módulos com escopo**: o admin marca, módulo a módulo, se a visibilidade respeita grupos. Se um módulo está "aberto", todos veem tudo (sujeito ainda às permissões view/edit/delete já existentes). Se está "restrito por grupo", o usuário só vê registros marcados com algum dos seus grupos.
- **Tag de grupo no registro**: cada registro de um módulo restrito carrega `visibility_group_id` (ou tabela N:N `record_groups` para múltiplos grupos por registro).

## Tela ADM → aba "Visibilidade"

Três sub-abas:

1. **Grupos**
   - Listar / criar / renomear / excluir grupos.
   - Cor + descrição opcional para identificação visual.

2. **Usuários**
   - Tabela de usuários com chips dos grupos a que pertencem.
   - Ação "Editar grupos" (multi-select) por usuário.
   - Atalho **"Espelhar usuário"**: copia os grupos de um usuário-fonte para o destino — atende ao pedido "B vê o mesmo que A".

3. **Módulos**
   - Lista dos 19 módulos do OCS.
   - Para cada módulo: switch **Restringir por grupo** (on/off) + escolha do modo de atribuição padrão de novos registros (grupo do criador, grupo fixo, ou prompt no formulário).
   - Prévia: "Hoje, no módulo X, usuário Y veria N registros".

## Modelo de dados (Supabase)

```text
visibility_groups(id, name, color, description, created_at)
user_visibility_groups(user_id, group_id)            -- N:N usuário↔grupo
module_visibility_settings(module_key PK, restricted bool,
                           default_assignment text)  -- per-módulo
record_visibility(record_table, record_id, group_id) -- tag por registro
```

Função `has_visibility(_user, _table, _record)`:
- se módulo não restrito → true
- senão → existe linha em `record_visibility` cujo `group_id` ∈ grupos do usuário

Função `user_groups(_user)` SECURITY DEFINER usada nas policies (evita recursão).

RLS de cada tabela de módulo passa a ter um AND com `has_visibility(auth.uid(), 'tabela', id)` quando o módulo estiver restrito. Admin (`has_role('admin')`) sempre vê tudo.

## Entregáveis do protótipo

- Login simples (email/senha) + seed de 1 admin e 3 usuários de teste.
- Página `/adm` com as 3 sub-abas acima, totalmente funcionais.
- 1 módulo de exemplo "Projetos" com 5–10 registros de demonstração para validar que o filtro por grupo realmente esconde/mostra dados conforme o usuário logado.
- Botão "Espelhar usuário" funcionando.
- Auditoria mínima: log das mudanças de grupo/permissão.

## Como portar pro OCS depois

- Rodar as migrations (`visibility_groups`, `user_visibility_groups`, `module_visibility_settings`, `record_visibility`, função `has_visibility`).
- Adicionar a aba "Visibilidade" dentro do ADM existente.
- Em cada um dos 19 módulos: aplicar a policy AND `has_visibility(...)` e, no insert, gravar a tag em `record_visibility` conforme `default_assignment`.
- Nada quebra módulos com `restricted=false`.

## Fora de escopo deste protótipo

- Reconstruir os 19 módulos, Governança, Robozinho, integrações SharePoint/Outlook/Excel, IA, etc. — esses já existem no projeto OCS principal.
