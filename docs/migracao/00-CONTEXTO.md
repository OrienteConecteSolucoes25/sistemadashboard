# Método Alma Brasileira — Contexto Completo (para migração com IA)

> Este documento dá **todo o contexto** do que foi construído nesta jornada, para que
> uma IA (Lovable, Cursor, v0, etc.) consiga **entender e replicar o produto em outro lugar**,
> sem precisar do histórico de conversa. Leia junto com `01-PRD.md` (requisitos) e
> `02-ESTRUTURA.md` (estrutura técnica detalhada).

---

## 1. O que é o produto (visão em 1 parágrafo)

**Método Alma Brasileira** é um SaaS que (a) **decodifica** marcas de sucesso por engenharia
reversa (motor do negócio, posicionamento, estratégia de rede social, arquétipo, gatilhos
mentais e combinação de palavras) e (b) **gera um Brand Kit** de estrutura de conteúdo para a
marca do cliente — **baseado em referências REAIS** (marcas decodificadas + referências que o
próprio cliente importa), **nunca inventando**. O diferencial técnico é um **motor multi-IA
(BYOK + failover automático)**: o cliente cadastra várias chaves de IA e o sistema troca
sozinho quando uma fica sem crédito, sem perder a memória da conversa.

**Tema/alma da marca:** marcas pessoais, produtos, matérias-primas, influencers e palestrantes
**do Brasil**. Tom caloroso, brasileiro, marketeiro e vendável.

---

## 2. Objetivo (por que existe)

- Ajudar quem quer crescer uma marca a **copiar a lógica de quem já venceu** (não "post bonito",
  mas o motor real) e a **gerar conteúdo com identidade** a partir de referências reais do nicho.
- Ser um **produto vendável** (SaaS com contas, biblioteca por usuário, Brand Kits salvos, PDF).
- **Não depender de uma única IA** nem queimar os créditos da dona: cada cliente usa as próprias
  chaves (BYOK), e o motor é **agnóstico de provedor** (funciona com qualquer IA).

---

## 3. Linha do tempo do que foi construído (artefatos e código)

### 3.1 Artefatos (páginas estáticas publicadas no claude.ai)
Na barra de artefatos aparecem 4 itens — **os 2 primeiros estão superados**:

| Artefato | Papel | Status |
|---|---|---|
| **Marcas do Brasil** (`marcas-brasil.html`) | 1º índice de marcas + links | superado |
| **Engenharia Reversa de Marcas** (`engenharia-reversa.html`) | 1ª versão do decodificador | superado |
| **Método Alma Brasileira** (`decodificador-marcas.html`) | **Produto-demo principal** | **ATUAL (v19)** |
| **Painel Alma Brasileira (prévia)** (`painel-preview.html`) | Maquete clicável do painel multi-IA | prévia visual |

- **Método Alma Brasileira** (ATUAL): decodificador + gerador + biblioteca + multiplataforma.
  - **103 marcas** catalogadas; **65 decodificadas** (com 🔓).
  - Sidebar: **Início · Gerador (Brand Kit) · Biblioteca (importar) · Marcas · Multiplataforma**.
  - Recursos: **Termômetro de Alma** (nota 0–100 da força da identidade), **arquétipos com
    identidade brasileira** (nomes aspiracionais, sem nada religioso/folclórico), **revelação
    animada** do kit, **exportar PDF** (window.print), gerador **honesto** (se não há referência
    do nicho, ele avisa e pede importação — NÃO inventa).
  - É um **demo/protótipo estático** (HTML). A biblioteca usa `localStorage`. NÃO lê vídeo de
    verdade e NÃO tem backend — isso é intencional (o produto real é o que o PRD descreve).

- **Painel Alma Brasileira (prévia)**: maquete clicável (HTML puro, roda sozinha no navegador)
  que mostra as telas do SISTEMA REAL (não do decodificador): **Início · Minhas IAs · Gerador/
  Chat · Biblioteca · Marcas**. Serve só para visualizar o painel multi-IA no celular.

### 3.2 Código real (no repositório, pasta `motor-multi-ia/`)
Mini-servidor **Node puro (sem dependências)** que é o **coração técnico** do produto: o
**roteador multi-IA (BYOK + failover + memória + multi-tenant)**. Roda com `node server.js` e
tem `demo.js` que prova o failover e a memória sem precisar de chave real. Detalhes em
`02-ESTRUTURA.md`. Branch: `claude/brazilian-brands-international-eubtw2`.

---

## 4. Decisões e princípios (NÃO violar na migração)

1. **BYOK + failover automático.** O cliente cadastra várias chaves (grátis primeiro: Gemini,
   Groq, OpenRouter, Mistral; pagas de reserva: OpenAI, Anthropic). O sistema tenta em ordem de
   prioridade; se der erro de crédito/limite (HTTP 429/402), **troca sozinho** e põe a que falhou
   em "cooldown". **Não dá para consultar saldo antes** — a troca é na falha (jeito robusto).
2. **Agnóstico de IA / sem lock-in.** Uma camada adaptadora traduz o formato de cada IA para um
   formato único. Trocar/adicionar IA é só configuração. Código exportável (o cliente hospeda
   onde quiser).
3. **A memória é do SISTEMA, não da IA.** Toda IA é stateless. O histórico fica no banco e é
   **reenviado a cada chamada** — por isso trocar de IA no meio da conversa **não apaga o
   contexto**.
4. **Multi-tenant.** Cada cliente isolado: suas chaves (cifradas), suas conversas, seus Brand
   Kits. Ninguém vê nada de ninguém.
5. **Nunca inventar.** O gerador só produz a partir de referências reais (marcas decodificadas do
   nicho + biblioteca do cliente). Sem referência → estado honesto pedindo importação.
6. **Segurança das chaves.** Chaves de IA **nunca** no navegador. Sempre no backend, cifradas
   (AES-256-GCM no protótipo; Vault/secrets do Supabase em produção).
7. **IP seguro.** Sem logos de terceiros nem personagens — usar **monogramas/SVG originais**.
   Bordões curtos são ok como identificadores factuais.
8. **Conteúdo real e atualizado.** Os diagnósticos de marca devem ter **fontes** (links). Nada de
   generalizar — pesquisar cada marca.
9. **Arquétipos brasileiros.** Mapear os arquétipos de Jung para nomes brasileiros aspiracionais
   (ver PRD), **sem nomes religiosos ou folclóricos**.

---

## 5. Restrições técnicas aprendidas (ambiente de artefato estático)

Estas valem para o DEMO em HTML; o produto real (backend) não tem essas limitações:
- Sem imagens externas (CSP) → usar SVG/monograma embutido.
- Scripts externos só de cdnjs/jsdelivr; fontes só do Google Fonts.
- Downloads inertes → PDF via `window.print()`.
- Sem backend/rede → biblioteca em `localStorage`; não "lê" vídeo de verdade.

---

## 6. O que falta / próximos passos conhecidos

- Decodificar as marcas ainda sem 🔓 (influencers globais, inspiradas no Brasil, moda BR) e
  atualizar as marcadas como "🧠 conhecimento geral" para pesquisadas com fontes.
- Multiplataforma: falta YouTube, LinkedIn, Pinterest, Kwai, Threads (só Instagram e TikTok
  prontos, de fontes oficiais).
- Construir o **produto real** (este é o objetivo da migração): backend + IA real que lê o
  conteúdo importado + Brand Kits salvos + PDF + pagamento.
- Diretriz de design pedida pela cliente: **visual Glassmorphism** (ver PRD, seção de design).

---

## 7. Glossário rápido

- **Brand Kit**: pacote gerado com identidade (alma/arquétipo), tom de voz, combinações de
  palavras que funcionam/não funcionam, gatilhos, formatos por plataforma e roteiro.
- **Decodificar / Engenharia reversa**: abrir o "motor" de uma marca (como ela realmente cresce).
- **Termômetro de Alma**: medidor 0–100 de quão forte/ancorada em referências reais é a marca.
- **BYOK**: Bring Your Own Key (cada cliente traz as próprias chaves de IA).
- **Failover**: trocar automaticamente de IA quando uma falha/fica sem crédito.
- **Multi-tenant**: um sistema, muitos clientes isolados.
