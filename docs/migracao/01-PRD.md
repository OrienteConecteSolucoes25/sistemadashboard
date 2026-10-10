# PRD — Método Alma Brasileira (SaaS)

> **Para a IA que vai construir/migrar:** este é o documento de requisitos. Leia também
> `00-CONTEXTO.md` (visão/decisões) e `02-ESTRUTURA.md` (estrutura técnica + modelo de dados).
> Construa o **produto real** (backend + IA + contas). O artefato HTML existente é só um demo
> visual de referência.

---

## 1. Objetivo

Criar um **SaaS vendável** que ajuda marcas do Brasil (pessoais, produtos, matérias-primas,
influencers, palestrantes) a:
1. **Estudar** marcas de sucesso decodificadas (engenharia reversa do motor + estratégia social).
2. **Importar referências reais** do próprio nicho (vídeos, carrosséis, posts).
3. **Gerar um Brand Kit** de conteúdo com identidade, **baseado nessas referências reais —
   nunca inventado**.

Com um **motor de IA agnóstico (BYOK + failover)** para que o produto **nunca fique refém de uma
única IA** e **não consuma os créditos da operação** (cada cliente usa as próprias chaves).

### Resultados esperados (métricas de sucesso)
- Cliente consegue cadastrar ≥2 chaves de IA e gerar um Brand Kit sem erro, mesmo se 1 IA falha.
- 0% de "invenção": sem referência do nicho, o sistema pede importação em vez de gerar.
- Cada cliente só acessa os próprios dados (isolamento multi-tenant comprovado).
- Exportar Brand Kit em PDF.

---

## 2. Público-alvo

Empreendedores de marca, social media, infoprodutores, agências pequenas e criadores no Brasil
que querem estrutura de conteúdo com base em casos reais, pagando uma assinatura.

---

## 3. Estrutura do produto (navegação / telas)

Menu lateral (**sidebar** fixa no desktop, gaveta com hambúrguer no mobile):

1. **Início** — apresentação do método (hero + conceito + pilares + CTAs para as seções).
2. **Minhas IAs** — cadastrar/ordenar chaves de IA (BYOK); ver status (pronta / sem crédito).
3. **Gerador (Brand Kit)** — formulário → gera o kit; mostra qual IA respondeu; Termômetro de Alma.
4. **Biblioteca** — importar vídeos/carrosséis/posts por nicho (link/URL + texto/transcrição);
   a IA lê e extrai estrutura. Salvo por usuário.
5. **Marcas** — base de marcas decodificadas (playbook completo + filtro por categoria).
6. **Multiplataforma** — como o algoritmo de cada rede funciona hoje (com fontes oficiais).
7. **Conta / Assinatura** — login, plano, cobrança.

---

## 4. Requisitos funcionais

### 4.1 Autenticação e conta (multi-tenant)
- Cadastro/login por e-mail (e opcionalmente OAuth).
- Cada usuário = 1 tenant isolado. Todo dado é escopado por tenant.

### 4.2 Minhas IAs (BYOK)
- Adicionar chave: `{ provedor, apiKey, modelo?, prioridade }`.
- Provedores suportados (mín.): **Gemini, Groq, OpenRouter, Mistral** (grátis) + **OpenAI,
  Anthropic** (pagos). Arquitetura deve permitir adicionar novos provedores sem reescrever o app.
- Chave guardada **cifrada**; exibida **mascarada** (`AIza…9f2c`).
- Listar com status: pronta / "descansando (sem crédito agora)".

### 4.3 Roteador multi-IA (failover + memória) — CORE
- Ao gerar/conversar: carregar histórico da conversa (memória) + montar `system + histórico +
  nova mensagem` no formato único de mensagens `[{role, content}]`.
- Tentar provedores em ordem de prioridade, **pulando os que estão em cooldown**.
- Em sucesso → salvar pergunta+resposta no histórico; retornar `{reply, usadaAgora, tentativas}`.
- Em erro de **crédito/limite (429/402 ou corpo com quota/rate/credit/insufficient)** → marcar
  cooldown (ex.: 5 min) e **tentar a próxima**.
- Em erro de **auth (401/403)** → pular (chave inválida). Outros erros → tentar a próxima.
- Se todas falham → mensagem honesta: "suas IAs estão sem crédito, adicione outra".
- **Camada adaptadora**: traduzir o formato único para cada API (OpenAI-compatible para
  OpenAI/Groq/OpenRouter/Mistral; formato próprio para Gemini e Anthropic) e normalizar a saída.

### 4.4 Biblioteca (importar referências)
- Importar item: `{ titulo, nicho, tipo, plataforma, formato, link/URL, texto/transcrição,
  combinacoes[], palavrasChave[], porQueFunciona }`.
- A **IA lê** o texto/transcrição e extrai: combinações de palavras, palavras-chave, arquétipo,
  gatilhos e o que engaja. (No produto real, usar o roteador de IA para isso.)
- Salvo por tenant.

### 4.5 Gerador (Brand Kit)
- Formulário: `{ tipoMarca, nicho, oferta, publico, arquetipo?, plataforma, objetivo }`.
- Fontes de referência: marcas decodificadas do **mesmo nicho** + itens da **Biblioteca** do
  cliente no nicho. **Se não houver nenhuma → estado honesto pedindo importação (não gerar).**
- Saída do Brand Kit:
  - **Termômetro de Alma** (0–100) + diagnóstico.
  - **Alma da marca** (arquétipo brasileiro) + arquétipo-base + tom de voz + promessa + plataforma.
  - **Combinações de palavras que FUNCIONAM** + palavras-chave/sinais + gatilhos recomendados.
  - **O que NÃO funciona pro nicho e por quê** (comparando com o arquétipo rival).
  - **Formatos por plataforma** + **esqueleto de post/roteiro** (gancho/desenvolvimento/CTA).
  - **Referências usadas** (clicáveis para abrir o diagnóstico da marca).
- Brand Kit **salvo por usuário** e **exportável em PDF**.

### 4.6 Marcas (base decodificada)
Cada marca decodificada tem: motor do negócio; blocos (origem, cliente, posicionamento, oferta,
aquisição, comunicação); Mapa de Replicação (tabela); números públicos; replicável × circunstancial;
estratégia por canal; análise de conteúdo (arquétipo, história, combinação de palavras, sinais, o
que engaja, gatilhos); **fontes (links)**. Filtro por categoria (brasileiras globais, influencer
BR, influencer global, inspiradas no Brasil, físicas no Brasil).

### 4.7 Multiplataforma
Resumo por rede (Instagram, TikTok, YouTube, LinkedIn, Pinterest…): métricas que mais pesam, por
superfície, o que aumenta/derruba alcance, como vender, **com fontes oficiais**.

---

## 5. Arquétipos brasileiros (mapa obrigatório)

Mostrar o nome brasileiro ao usuário; manter o arquétipo de Jung por baixo (para a lógica).
**Sem nomes religiosos ou folclóricos.**

| Jung (base) | Alma brasileira | Emoji |
|---|---|---|
| Cuidador | O Anfitrião | 🤗 |
| Herói | O Craque | ⚽ |
| Amante | A Musa | 💃 |
| Fora-da-lei | O Do Contra | 🎸 |
| Bobo da Corte | O Descontraído | 😄 |
| Mago | O Transformador | ✨ |
| Explorador | O Desbravador | 🧭 |
| Criador | O Artesão | 🎨 |
| Sábio | O Mestre | 📚 |
| Governante | O Clássico | 👑 |
| Inocente | O Sonhador | 🌅 |
| Comum | O Vizinho | 🫱 |

---

## 6. Arquitetura técnica recomendada

- **Frontend:** React + TypeScript + Tailwind (ou o stack do builder). Sidebar + 7 telas.
- **Backend:** Supabase (Postgres + Auth + Edge Functions) — ou equivalente. O **roteador de IA
  roda no backend** (Edge Function) para proteger as chaves.
- **Segredos:** `MASTER_KEY`/secrets no backend; chaves de IA cifradas em repouso.
- **IA:** sem SDK único — chamadas HTTP por provedor via camada adaptadora (ver `02-ESTRUTURA.md`,
  que traz um roteador de referência já pronto em Node puro).
- **PDF:** geração no cliente (print) ou server-side.
- **Hospedagem:** qualquer uma (Vercel/Netlify/Render) — o código é portável, sem lock-in.

> Já existe um **roteador de referência funcionando** em `motor-multi-ia/` (Node puro): copie a
> lógica de `src/router.js`, `src/providers.js`, `src/crypto.js`, `src/store.js` para as Edge
> Functions e troque o store JSON por tabelas do Supabase.

---

## 7. Design / UI

- Tom **marketeiro, gamificado e vendável**; português do Brasil, caloroso.
- Tema **claro e escuro** (tokens em `:root`, dark via `prefers-color-scheme` e `[data-theme]`).
- Paleta de referência do demo: verde `#0F6B43`, coral `#E0532B`, ouro `#C98A16`, fundo creme
  `#FBF7F0`; fontes **Fraunces** (títulos) + **Hanken Grotesk/Manrope** (texto).
- **Sem logos de terceiros** → monogramas/ícones SVG originais.
- **Diretriz pedida pela cliente: visual Glassmorphism** — superfícies de vidro fosco
  (`backdrop-filter: blur`), fundos translúcidos, bordas sutis, brilho/realce; manter contraste e
  legibilidade nos dois temas. Aplicar em cards, sidebar e modais.

---

## 8. Roadmap sugerido

1. **MVP:** Auth + Minhas IAs (BYOK) + Roteador (failover+memória) + Gerador honesto + base de
   marcas (seed) + PDF.
2. **V2:** Biblioteca com leitura real por IA + Brand Kits salvos + Multiplataforma completa.
3. **V3:** Pagamento/assinatura + mais marcas decodificadas + colaboração/equipe.

## 9. Critérios de aceite (checar na entrega)

- [ ] Login cria tenant isolado; um tenant não acessa dados de outro.
- [ ] Cadastrar 2+ chaves; gerar com a 1ª fora → responde pela 2ª **lembrando o contexto**.
- [ ] Nicho sem referência → NÃO gera; pede importação.
- [ ] Chaves guardadas cifradas e exibidas mascaradas.
- [ ] Brand Kit exporta em PDF.
- [ ] Tema claro/escuro e visual glassmorphism aplicados; responsivo no mobile.
- [ ] Nenhum logo de terceiro; arquétipos no padrão brasileiro acima.
