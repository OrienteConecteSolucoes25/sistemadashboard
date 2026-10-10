# Bugs, Limitações e Ideias Futuras — Método Alma Brasileira

> Lista honesta do que **ainda não está pronto** ou **tem limitação**, e do **backlog de ideias**
> que não foram aplicadas. Útil para a IA de migração priorizar e não repetir os mesmos limites.

---

## 1. Bugs e limitações conhecidos

### 1.1 Do DEMO em HTML (artefato "Método Alma Brasileira")
- **Não tem backend.** A Biblioteca salva só no `localStorage` do navegador → não sincroniza
  entre dispositivos, some ao limpar o navegador, não é por conta de usuário real.
- **Não "lê" vídeo/imagem de verdade.** O gerador usa só o que o usuário digita (texto
  estruturado). Entender conteúdo de vídeo exige IA real (produto novo).
- **Gerador é heurístico, não IA.** Cruza dados fixos; não "raciocina". Bom como demo, limitado
  como produto.
- **PDF via `window.print()`** — depende do navegador; layout do PDF pode variar.
- **Sem imagens externas/logos** (restrição de CSP do artefato) → só monogramas SVG. No produto
  real dá para usar logos próprios/assets.
- **Links das fontes não são verificados automaticamente** — podem quebrar com o tempo.
- **Marcas "🧠 (kb:true)"**: diagnóstico baseado em conhecimento geral, **sem pesquisa dedicada**
  → precisa upgrade com fontes. (As recém-adicionadas de marcas físicas já têm fontes.)
- **Contagens fixas no texto**: havia "16 marcas" hardcoded (já corrigido para dinâmico/sem número
  em alguns pontos) — revisar se migrar o texto.

### 1.2 Do MOTOR (código `motor-multi-ia/`, protótipo)
- **Store em arquivo JSON** (`data/db.json`) — para demo. Em produção trocar por Postgres/Supabase
  (concorrência, escala, RLS).
- **Token simples por tenant** (não é auth real) — trocar por Supabase Auth/JWT.
- **`MASTER_KEY` com default inseguro** no `.env.example` — em produção gerar aleatória e nunca
  commitar.
- **Failover é "na falha", não por saldo prévio** — limitação das próprias APIs (não expõem
  saldo). Comportamento correto, mas o 1º request após o crédito acabar sempre "gasta" uma
  tentativa antes de trocar.
- **Cooldown fixo (5 min)** — poderia ser adaptativo (ex.: respeitar `Retry-After` do provedor).
- **Sem streaming** de resposta (resposta vem inteira). Sem limite de tokens/custo por tenant.
- **Sem retry por erro de rede transitório** (só troca de IA). Sem rate-limit próprio por usuário.
- **Providers/modelos default podem mudar** (ex.: nomes de modelos grátis do OpenRouter) — manter
  atualizados.
- **PR shell:** o comando `pkill -f "node server.js"` encerrava o próprio processo do terminal
  (exit 144) — no deploy real isso não se aplica (processo gerenciado pelo host).

### 1.3 Gerais / pendências de conteúdo
- **Multiplataforma incompleta:** só Instagram e TikTok prontos (fontes oficiais). Faltam
  **YouTube, LinkedIn, Pinterest, Kwai, Threads**.
- **Marcas sem 🔓 (não decodificadas ainda):** influencers globais (r.e.m., Chamberlain, Béis,
  Item, About-Face, Pattern, Anomaly, Florence), inspiradas no Brasil (ViX, Amazonia, Açaí Roots,
  Beija-Flor), moda BR (Animale, Ellus, Salinas, Rosa Chá, Le Lis Blanc, etc.).

---

## 2. Ideias futuras ainda NÃO aplicadas (backlog)

### 2.1 Produto / IA real
- **IA que lê de verdade** o conteúdo importado (texto, transcrição de vídeo, OCR de carrossel) e
  extrai combinações, arquétipo, gatilhos e "o que engaja".
- **Gerador com IA real** (não heurístico): raciocina sobre as referências do nicho e explica
  **por que** certas combinações funcionam para um nicho e não para outro (inclusive entre marcas
  rivais do mesmo nicho).
- **Brand Kits salvos, versionados e compartilháveis**; histórico por cliente.
- **Análise comparativa** entre a marca do cliente e as decodificadas do nicho.

### 2.2 Experiência (pedidas ao longo da conversa)
- **Ritual de entrada** (onboarding narrado): 3–4 perguntas afetivas ("Qual é a alma da sua
  marca?") que já alimentam o gerador, em vez de um formulário seco.
- **Revelação animada** do Brand Kit (efeito "abrir presente") — existe no demo, replicar no app.
- **Conquistas/selos de progresso** (importou 5 referências, gerou 1º kit, comparou rivais…).
- **Termômetro de Alma** como elemento central e gamificado (já no demo).

### 2.3 Design
- **Visual Glassmorphism** (vidro fosco, `backdrop-filter: blur`, translucidez, brilho) — pedido
  pela cliente, ainda não aplicado. Manter contraste/legibilidade em tema claro e escuro.

### 2.4 Motor / infra
- **Streaming** de respostas; **limite de custo/tokens por tenant**; **dashboard de uso** por IA.
- **Respeitar `Retry-After`** e cooldown adaptativo; **health-check** periódico das chaves.
- **Mais provedores** plugáveis (ex.: Cohere, Together, DeepSeek, modelos locais/Ollama).
- **Cache** de respostas/embeddings para reduzir custo.
- **Observabilidade:** logs de qual IA respondeu, falhas, latência.

### 2.5 Negócio
- **Pagamento/assinatura** (Stripe) com planos; **limites por plano**.
- **Equipe/colaboração** (vários usuários por conta).
- **Exportações** (PDF caprichado, link público do Brand Kit).

---

## 3. Prioridade sugerida para a migração

1. MVP com **Auth + BYOK + Roteador (failover+memória) + Gerador honesto + PDF**.
2. **Biblioteca com IA real** + Brand Kits salvos.
3. **Design glassmorphism** + onboarding ritual + conquistas.
4. **Pagamento** + multiplataforma completa + mais marcas decodificadas.
