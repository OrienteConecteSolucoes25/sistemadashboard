
# Plano: E-mails de autenticação com domínio OCS + Reply-To dinâmico

## Objetivo
Resolver de vez o problema de **e-mails de auth não chegarem** (reset de senha, confirmação de cadastro), mantendo arquitetura multi-tenant compatível com clientes que **ainda não têm domínio próprio** (usam @gmail, @outlook, etc.).

## Arquitetura escolhida

```text
Todos os e-mails saem de:  notify@orienteconectesolucoes.com.br
                                      │
                                      ▼
                          Reply-To dinâmico por empresa:
                          ├─ Empresa com domínio próprio  → suporte@empresaX.com.br
                          ├─ Empresa sem domínio          → e-mail do admin (gmail/outlook)
                          └─ OCS interno                  → suporte@orienteconectesolucoes.com.br
```

**Vantagens:**
- 1 só domínio para verificar DNS (o seu, que você já tem acesso)
- Cliente novo entra na plataforma e já recebe e-mails — sem esperar configuração de DNS dele
- Quando o cliente responder o e-mail, vai cair no e-mail certo da empresa dele
- Padrão usado por Slack, Notion, Linear, Trello

## Etapas

### Etapa 1 — Configurar domínio remetente OCS (resolve 90% do problema)
1. Abrir o diálogo de configuração de e-mail do Lovable Cloud
2. Configurar subdomínio `notify.orienteconectesolucoes.com.br`
3. Adicionar os registros NS no seu DNS (Lovable gera automaticamente — ~5 min de trabalho)
4. Aguardar verificação DNS (até 72h, normalmente <1h)

→ Resultado: e-mails de reset/confirmação **passam a chegar** com remetente `notify@orienteconectesolucoes.com.br`.

### Etapa 2 — Templates de auth com a marca OCS
- Scaffold dos 6 templates de auth (signup, recovery, magic-link, invite, email-change, reauthentication)
- Aplicar identidade visual Oriente: teal `#2BBDC0`, sidebar dark, fonte Rajdhani/Inter, logo OCS
- Conteúdo em PT-BR
- Cada template terá `Reply-To` dinâmico (ver Etapa 3)

### Etapa 3 — Reply-To dinâmico por empresa
1. **Migração no banco**: adicionar colunas em `companies`:
   - `support_email TEXT` (e-mail de suporte da empresa — pode ser corporativo ou pessoal)
   - `support_name TEXT` (nome exibido no Reply-To)
2. **Edge function `auth-email-hook`**: ao receber evento de auth, consulta a empresa do usuário (`company_users → companies.support_email`) e injeta no header `Reply-To`. Fallback: se não houver `support_email` cadastrado, usa `suporte@orienteconectesolucoes.com.br`.
3. **UI de cadastro da empresa**: no Sheet da empresa em `/app/planos`, adicionar 2 campos opcionais ("E-mail de suporte" + "Nome de suporte") na aba Plano & Valor.

### Etapa 4 — Validação end-to-end
1. Disparar reset de senha de teste com user de empresa A (com `support_email` definido) → conferir Reply-To
2. Disparar reset com user de empresa B (sem `support_email`) → conferir fallback OCS
3. Confirmar Google OAuth funcionando (já corrigido na leva anterior)
4. Conferir logs em Cloud → Emails

## Detalhes técnicos

- **Sender domain**: `notify.orienteconectesolucoes.com.br` (subdomínio dedicado, não conflita com seu e-mail corporativo principal)
- **From header**: `Oriente Conecte Soluções <notify@orienteconectesolucoes.com.br>`
- **Reply-To header**: dinâmico via consulta à tabela `companies`
- **Hook**: `supabase/functions/auth-email-hook/index.ts` (já é o pattern oficial Lovable Cloud — usa `enqueue_email` na fila pgmq, com retry automático)
- **Sem dependência de Resend/SendGrid**: tudo via infra nativa do Lovable Cloud
- **Nada muda no `Auth.tsx`**: a correção é 100% backend

## O que NÃO está no escopo
- Multi-domínio real (cada empresa com seu próprio remetente verificado) — fica para uma fase futura, **se** algum cliente grande pedir. Hoje seria over-engineering.
- E-mails transacionais (notificações de obras, relatórios RH) — outro módulo, não bloqueia o login.

## Resultado esperado
- ✅ Reset de senha chega na caixa de entrada em segundos
- ✅ Confirmação de cadastro chega
- ✅ E-mails brandados com identidade OCS
- ✅ Cliente que responde o e-mail é atendido no canal certo da empresa dele
- ✅ Login com Google continua funcionando
