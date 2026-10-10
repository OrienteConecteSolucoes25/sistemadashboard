# Estrutura Técnica — Método Alma Brasileira (para replicar)

> Estrutura concreta para a IA reconstruir o produto. Há um **roteador de referência já
> funcionando** em `motor-multi-ia/` (Node puro, sem dependências) — reaproveite a lógica.

---

## 1. Mapa de arquivos do motor de referência (`motor-multi-ia/`)

```
motor-multi-ia/
├── server.js          # API HTTP (Node puro) + serve o frontend em / + rota /demo-chat
├── demo.js            # prova failover + memória SEM chave real (node demo.js)
├── package.json       # type:module, scripts start/demo, sem dependências
├── .env.example       # MASTER_KEY, PORT
├── public/
│   └── index.html     # painel: sidebar + telas (Início, Minhas IAs, Chat) ligado à API
└── src/
    ├── crypto.js      # AES-256-GCM: encrypt/decrypt/mask das chaves
    ├── store.js       # banco multi-tenant (JSON no demo → trocar por Supabase)
    ├── providers.js   # adaptadores por IA + classify(erro) + mocks p/ demo
    └── router.js      # CORE: ordem, failover, cooldown, memória
```

Como rodar: `cd motor-multi-ia && node demo.js` (demonstração) ou `node server.js` (API+painel).

---

## 2. API (contrato de referência)

| Método | Rota | Corpo | Retorno |
|---|---|---|---|
| POST | `/tenants` | `{name}` | `{id, token}` |
| POST | `/tenants/keys` | `{provider, apiKey, model?, priority?}` (Bearer) | chave mascarada |
| GET | `/tenants/keys` | — (Bearer) | lista mascarada + status |
| POST | `/chat` | `{message, conversationId?}` (Bearer) | `{conversationId, reply, usadaAgora, tentativas}` |
| GET | `/conversations/:id` | — (Bearer) | histórico |

Autenticação no demo: token por tenant em `Authorization: Bearer <token>`. Em produção → Supabase Auth (JWT).

---

## 3. Modelo de dados (migrar para Supabase/Postgres)

```sql
-- Cada cliente é um tenant (no Supabase, o próprio auth.users já serve de tenant).
create table ai_keys (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id),
  provider text not null,              -- gemini | groq | openrouter | mistral | openai | anthropic
  model text,
  api_key_enc text not null,           -- CIFRADA (nunca em texto puro)
  priority int not null default 1,
  cooldown_until timestamptz,          -- quando volta a poder ser usada
  created_at timestamptz default now()
);

create table conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id),
  title text,
  created_at timestamptz default now()
);

create table messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references conversations(id),
  role text not null,                  -- system | user | assistant
  content text not null,
  provider text,                       -- qual IA respondeu (nas do assistant)
  created_at timestamptz default now()
);

create table content_references (     -- Biblioteca importada
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id),
  title text, niche text, type text, platform text, format text,
  url text, transcript text,
  combos text[], keywords text[], note text,
  created_at timestamptz default now()
);

create table brands (                  -- Marcas decodificadas (base/seed)
  id text primary key,                 -- ex.: 'havaianas'
  data jsonb not null                  -- objeto DEEP+SOCIAL+GAT+COMBO (ver seção 5)
);

create table brand_kits (              -- Brand Kits gerados, salvos por usuário
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id),
  input jsonb not null, output jsonb not null, score int,
  created_at timestamptz default now()
);
```
**RLS obrigatório:** cada tabela com `user_id` só acessível pelo próprio usuário.

---

## 4. Lógica do roteador (pseudocódigo — replicar fielmente)

```
função gerar(userId, conversationId, message):
  conv   = conversationId ?? criarConversa(userId)
  hist   = mensagensDe(userId, conv)                 # MEMÓRIA vem do banco
  msgs   = [system] + hist + [{user, message}]       # formato único [{role,content}]
  chaves = chavesDe(userId) ordenadas por priority   # DECIFRADAS só aqui, no backend
  tentativas = []
  para cada chave em chaves:
     se chave.cooldown_until > agora: pular (registra "em cooldown")
     prov = adaptador(chave.provider)
     tente:
        content = prov.chat(apiKey, model, msgs)      # traduz p/ a API da IA
        salvar(user), salvar(assistant, provider)     # grava no histórico
        retornar {conv, reply:content, usadaAgora:chave.provider, tentativas}
     capture erro:
        tipo = classify(status, corpo)                # quota | auth | other
        se quota: setCooldown(chave, 5min)            # 429/402/quota/rate/credit/insufficient
        registra tentativa; CONTINUA (troca de IA)
  erro("todas as IAs sem crédito/indisponíveis")
```

**Adaptadores (formato único → API da IA):**
- OpenAI-compatible (OpenAI, Groq, OpenRouter, Mistral): `POST /chat/completions`,
  `Authorization: Bearer`, body `{model, messages}`, resposta `choices[0].message.content`.
- Gemini: `POST .../models/{model}:generateContent?key=`, `contents[{role, parts:[{text}]}]`
  (assistant→"model"), `systemInstruction`, resposta `candidates[0].content.parts[].text`.
- Anthropic: `POST /v1/messages`, headers `x-api-key` + `anthropic-version`, body
  `{model, max_tokens, system, messages}`, resposta `content[].text`.

**classify(status, corpo):** 429/402 → `quota`; corpo com `quota|insufficient|rate limit|credit`
→ `quota`; 401/403 → `auth`; senão `other`.

---

## 5. Estrutura dos dados de marca (base decodificada)

No demo, 5 objetos JS paralelos por marca-chave. Em produção, juntar num `jsonb` por marca.

```js
// D = catálogo (card). 103 itens; os com `deep` abrem o diagnóstico.
{ g:"br|infbr|infww|ext|fis", n:"Nome", c:"#hex", cat:"Categoria",
  flag:"🇧🇷 ...", why:"por que faz sucesso (HTML)", site, ig, deep:"chave?" }

// DEEP[chave] = diagnóstico (engenharia reversa)
{ name, c:"#hex", icon, tag, kb?:true,
  motor:"o motor real do negócio",
  blocos:[[titulo, htmlCurto], ...6],        // origem, cliente, posicionamento, oferta, aquisição, comunicação
  mapa:[[chave, valor], ...10],              // Mapa de Replicação
  nums:[[grande, rotulo], ...],              // números públicos
  repl:[[replicável...],[circunstancial...]],
  canais:[[canal, texto], ...],              // estratégia por rede/mídia
  fontes:[[rotulo, url], ...] }              // LINKS reais

// SOCIAL[chave] = análise de conteúdo
{ arq:"Arquétipo (contém termo de Jung p/ a lógica)",
  hist:"a história que vende",
  sinais:[...], engaja:[[titulo, descrição], ...] }

// GAT[chave]   = ["Gatilho 1","Gatilho 2", ...]   // gatilhos mentais (Cialdini)
// COMBO[chave] = ["bordão 1","combinação 2", ...]  // combinação de palavras (voz da marca)
```

Ícones válidos (SVG embutido): `bag, sparkle, bottle, coffee, glass, plate, choc, monitor, gear,
wrench, plane, bus, pencil, fridge, ring, glasses, travel, pill, leaf, baby, dumbbell, music`.

Categorias (`g`): `br` (brasileiras globais), `infbr` (influencer BR), `infww` (influencer
global), `ext` (inspiradas no Brasil), `fis` (físicas no Brasil).

---

## 6. Lógica do Gerador (Brand Kit) — replicar

```
nicho, oferta, publico, arqSel, plataforma, objetivo = formulário
lib   = referências da Biblioteca do usuário no nicho
marcas = marcas decodificadas cujo cat casa com o nicho (via mapa de palavras-chave do nicho)
SE lib vazio E marcas vazio:  mostrar estado honesto "importe referências" e PARAR  # não inventar
arq   = arqSel ou arquétipo da 1ª marca do nicho
combos = únicos( lib.combos + marcas.COMBO )
sinais = únicos( lib.keywords + marcas.SOCIAL.sinais )
gatis  = únicos( marcas.GAT )
rival  = arquétipo rival de `arq`; rivalCombos = combos de marcas do nicho com arquétipo rival
score (Termômetro de Alma 0–100) = f(qtde de combos, sinais, gatis, nº de referências, campos preenchidos)
formatos = por plataforma (Instagram/TikTok/ambos); gancho/meio/CTA por objetivo
render: Termômetro → Alma/identidade → combinações que funcionam → o que NÃO funciona (e porquê) →
        formatos → roteiro → referências usadas (clicáveis)
```

Diagnóstico do Termômetro por faixa: ≥80 "Alma forte"; 60–79 "tomando forma"; 40–59 "em
construção"; <40 "tímida" (sempre honesto, pedindo mais referência real quando baixo).

---

## 7. Checklist de migração (passo a passo para a IA)

1. Criar projeto (React+TS+Tailwind) com sidebar + 7 telas (seção 3 do PRD).
2. Supabase: Auth + tabelas da seção 3 + RLS por usuário.
3. Edge Function `router`: portar `src/router.js` + `src/providers.js` + `src/crypto.js`
   (store → tabelas). Guardar `MASTER_KEY` nos secrets.
4. Tela **Minhas IAs** ligada a `ai_keys` (cifrar na escrita, mascarar na leitura).
5. Tela **Gerador** com a lógica da seção 6 (incluindo o "não inventar").
6. Tela **Biblioteca**: importar + a Edge Function usa o roteador para extrair estrutura.
7. **Marcas**: seed da tabela `brands` com os objetos do demo; tela de listagem + modal + PDF.
8. **Multiplataforma**: conteúdo com fontes oficiais.
9. Design: tema claro/escuro + **glassmorphism**; sem logos de terceiros; arquétipos BR.
10. Validar os **critérios de aceite** do PRD (seção 9).
```
```
