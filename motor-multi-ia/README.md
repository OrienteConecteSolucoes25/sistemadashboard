# Motor Multi-IA — Método Alma Brasileira

Mini-servidor **real** (Node puro, sem dependências) que demonstra o coração do produto:
um **roteador BYOK com failover automático** entre várias IAs, **multi-tenant** e **com memória**.

> Objetivo: você VER funcionando aqui, de verdade, antes de decidir construir no Lovable.

---

## ▶️ Como rodar (aqui mesmo)

```bash
cd motor-multi-ia
node demo.js      # prova failover + memória, SEM precisar de chave de IA
node server.js    # sobe a API real em http://localhost:3000
```

O `demo.js` usa IAs falsas pra provar, sem custo:
1. **Multi-tenant** — cada cliente tem chaves e conversas isoladas.
2. **Failover automático** — quando uma IA fica sem crédito (429), troca sozinho pra próxima.
3. **Memória** — o contexto sobrevive à troca de IA (o histórico é reenviado pelo nosso banco).

---

## 🧠 As 2 perguntas que isso responde

**"Trocar de IA no meio não apaga a memória?"** → **Não.**
A IA é *stateless* (não guarda nada). Quem guarda a conversa é o **nosso banco**. A cada
pergunta, o roteador **reenvia todo o histórico** pra IA da vez. Trocou de IA? A nova recebe
o contexto inteiro e responde como se estivesse na conversa desde o início.

**"Preciso de multi-tenant?"** → **Sim.** Cada cliente = um *tenant* isolado: suas chaves
(cifradas), suas conversas, seu histórico. Ninguém vê nada de ninguém.

---

## 🔑 BYOK + adaptador automático (o que você pediu)

- O cliente cadastra **várias chaves** de IA **uma vez** (grátis primeiro: Gemini, Groq,
  OpenRouter, Mistral; pagas como reserva: OpenAI, Claude).
- Na hora de gerar, o roteador tenta **em ordem de prioridade**. Se a atual falhar por
  **crédito/limite**, ele **troca sozinho** e coloca a que falhou em "descanso" (cooldown de 5 min).
- Como cada cliente usa **as próprias chaves**, **você (dona) não paga o uso deles**. 100 clientes
  = 100 cotas separadas. Resolve o medo do "acaba em 10 minutos".

> Detalhe honesto: quase nenhuma IA deixa *consultar o saldo antes*. Por isso a troca é
> **na falha** (429/402) — que é o jeito robusto e o que todo mundo usa. O cliente nem percebe.

---

## 🗺️ Estrutura do código

```
motor-multi-ia/
├── server.js          # API HTTP real (multi-tenant, com token por cliente)
├── demo.js            # demonstração do failover + memória (sem chave real)
└── src/
    ├── crypto.js      # cofre: cifra as chaves (AES-256-GCM)
    ├── store.js       # banco multi-tenant (clientes, chaves, conversas, histórico)
    ├── providers.js   # adaptadores (Gemini, Groq, OpenRouter, Mistral, OpenAI, Claude) + IAs falsas
    └── router.js      # o roteador: ordem, failover, cooldown, memória
```

## 🌐 API (rotas reais)

| Método | Rota | O quê |
|---|---|---|
| POST | `/tenants` | cria cliente → devolve `token` |
| POST | `/tenants/keys` | adiciona chave de IA (Bearer token) — guardada **cifrada** |
| GET | `/tenants/keys` | lista chaves **mascaradas** + status (pronta / descansando) |
| POST | `/chat` | conversa: `{message, conversationId?}` → responde e diz **qual IA usou** |
| GET | `/conversations/:id` | histórico da conversa |

---

## 🖥️ Telas do produto (quando virar app)

1. **Login / cadastro** (cada cliente é um tenant).
2. **Minhas IAs** — cadastrar/ordenar chaves; ver status (pronta / sem crédito agora).
3. **Início** — apresentação do Método Alma Brasileira.
4. **Gerador / Chat** — gera o Brand Kit; mostra discretamente qual IA respondeu.
5. **Biblioteca** — importar referências por nicho.
6. **Marcas** — base decodificada.
7. **Multiplataforma** — algoritmos de cada rede.

## 🆓 IAs grátis pra suportar primeiro
Google **Gemini** (camada grátis boa) · **Groq** (rápido) · **OpenRouter** (modelos `:free`) · **Mistral** (camada grátis).
Pagas como reserva de qualidade: **OpenAI**, **Anthropic (Claude)**.

---

## 🔁 Como isso vira Lovable / produção

Este mini-servidor é o **espelho** do que o Lovable montaria — só que aqui é seu e sem gastar crédito:

| Aqui (demonstração) | No Lovable / produção |
|---|---|
| `store.js` (arquivo JSON) | Tabelas no **Supabase** (Postgres) com RLS por cliente |
| `crypto.js` (AES local) | Segredos do Supabase / Vault; `MASTER_KEY` em variável de ambiente |
| `server.js` (Node http) | **Edge Functions** do Supabase (o roteador roda no backend) |
| Token simples por cliente | **Supabase Auth** (login/cadastro) |

A lógica de **roteador + failover + memória** (`router.js` + `providers.js`) migra **quase igual**.

> ⚠️ Segurança: as chaves das IAs **nunca** podem ficar no navegador — sempre no backend, cifradas.
> Por isso o produto real precisa de backend (não dá pra ser um artefato/HTML estático).
