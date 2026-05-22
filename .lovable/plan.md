# Plano — IA Zero-Crédito no Módulo Comunicação

Objetivo: permitir que o módulo **Comunicação** gere **imagens** (Galeria IA) e **textos longos (LinkedIn, legendas, posts)** **sem consumir créditos Lovable AI** e **sem cobrar API dos clientes**, usando chaves gratuitas que **você (estudante)** já tem. Nada existente é alterado — apenas adicionamos um novo "provedor" opcional ao lado do atual.

---

## 1) Diagnóstico — por que hoje consome crédito

Hoje o módulo usa **duas edge functions** que chamam o **Lovable AI Gateway** (= consome crédito da workspace):


| Função                                         | O que faz                                                                 | Crédito?   |
| ---------------------------------------------- | ------------------------------------------------------------------------- | ---------- |
| `comm-ai`                                      | texto (legenda, post, carrossel, newsletter) via `ai.gateway.lovable.dev` | Sim        |
| `comm-image-gen`                               | imagem via `google/gemini-3.1-flash-image-preview` no Lovable Gateway     | Sim (caro) |
| `comm-director-agent`, `comm-metrics-insights` | mesmas chamadas                                                           | Sim        |


Problemas que você relatou:

- **Imagem "come crédito e não gera"** → modelo `gemini-2.5-flash-image` no gateway às vezes devolve só texto; cada tentativa cobra; quota 50/dia bloqueia.
- **Texto curto / sem opção LinkedIn longo** → prompt no `comm-ai` não tem `kind="linkedin_longo"`.
- **Sem fluxo visual** → não existe orquestrador estilo n8n.

---

## 2) Ferramentas **gratuitas para estudante BR** (recomendadas para integrar)


| Ferramenta                                        | O que dá grátis                                                                                                                                                       | Bom para                                      |
| ------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------- |
| **Google Gemini API** (AI Studio)                 | Gemini 2.5 Flash e **Gemini 2.5 Pro** com quota grátis generosa (15 RPM / 1500 dia em Flash); imagens via **Imagen 4 / Gemini Image** no plano free com limite diário | **Texto longo LinkedIn + imagens da Galeria** |
| **GitHub Models** (com GitHub Student Pack)       | GPT-4o-mini, Llama 3.3 70B, Phi-4, DeepSeek, etc. via `https://models.inference.ai.azure.com` — grátis com PAT                                                        | Texto, fallback                               |
| **Groq Cloud**                                    | Llama 3.3 70B, Mixtral, **Llama 4** — free tier rápido (30 req/min)                                                                                                   | Geração rápida de legendas                    |
| **Mistral La Plateforme** (free experimental)     | Mistral Small / Pixtral                                                                                                                                               | Texto multilíngue                             |
| **Cloudflare Workers AI** (free tier 10k req/dia) | Llama, Flux **(imagem)**, SDXL                                                                                                                                        | Imagens grátis + texto                        |
| **Hugging Face Inference** (free serverless)      | SDXL, FLUX.1-schnell, Llama                                                                                                                                           | Imagens fallback                              |
| **Together AI** ($5 grátis recorrentes)           | FLUX, Llama                                                                                                                                                           | Imagens                                       |
| **Pollinations.ai**                               | **Imagem 100% grátis, sem chave** (`https://image.pollinations.ai/prompt/...`)                                                                                        | Galeria IA imediato                           |
| **OpenRouter**                                    | Vários modelos `:free` (Llama 3.3, Gemini 2.0, DeepSeek)                                                                                                              | Texto fallback                                |
| **Replicate** (créditos grátis com GitHub edu)    | FLUX, SDXL                                                                                                                                                            | Imagens HQ                                    |
| **Canva for Education**                           | API de templates grátis para estudante                                                                                                                                | Pós-produção do post                          |


Recomendação prática: **Gemini (Google AI Studio) + Pollinations + Groq** cobrem 100% dos casos do módulo sem custo.

---

## 3) Arquitetura proposta (sem mexer no existente)

Adicionamos um **router de provedores** ("BYOK Gateway") que escolhe automaticamente um provedor grátis e só cai no Lovable AI se o cliente quiser pagar.

```text
                     ┌───────────────────────────┐
 UI Comunicação ───► │  comm-ai-free (NOVA edge) │
 (Studio/Galeria)    │  router multi-provider    │
                     └─────┬─────┬─────┬─────────┘
                           │     │     │
                ┌──────────┘     │     └──────────┐
                ▼                ▼                ▼
        Gemini (AI Studio)   Groq / GitHub    Pollinations / CF
        TEXT + IMAGEM        TEXT             IMAGEM grátis sem chave
                │
                └──► fallback: Lovable AI (atual) se admin marcar "pago"
```

Chaves ficam em **secrets do projeto** (`GEMINI_API_KEY`, `GROQ_API_KEY`, `GITHUB_MODELS_TOKEN`, `HF_TOKEN`, `CF_ACCOUNT_ID`/`CF_AI_TOKEN`). Como são **suas** (estudante OCS), os clientes finais não pagam nada — eles consomem da sua cota grátis, igual ao modelo atual de "Soluções-Verso (bônus)" que já existe na memória do projeto.

---

## 4) O que vou implementar (quando você aprovar)

### Leva A — Provedor IA zero-crédito (texto)

1. **Nova edge** `supabase/functions/comm-ai-free/index.ts`
  - Mesmo contrato de `comm-ai` (kind, brand, inputs) **+ novos kinds**: `linkedin_longo`, `linkedin_artigo`, `legenda_longa`, `thread_x`.
  - Router: tenta `gemini-2.5-pro` (chave gratuita) → fallback `groq llama-3.3-70b` → `github models gpt-4o-mini`.
  - **Não chama Lovable AI** → custo zero.
  - Loga em `comm_ai_usage` com `provider="gemini-free"` etc.
2. Novo helper `commAiFree()` em `src/modules/comunicacao/lib/api.ts` (não toca o `commAi` atual).
3. Em `ComunicacaoStudio.tsx`: novo **switch "IA grátis (estudante)" vs "IA paga (Lovable)"** + dropdown com `linkedin_longo`. Default = grátis.

### Leva B — Galeria IA zero-crédito (imagem)

4. **Nova edge** `supabase/functions/comm-image-free/index.ts`
  - Router: `Pollinations` (sem chave, instantâneo) → `Gemini Image` (chave grátis, HQ) → `Cloudflare Flux` (10k/dia grátis) → `HF FLUX-schnell`.
  - Baixa o binário, sobe no bucket `comm-generated-images`, devolve `signed_url` (mesmo formato da função atual).
  - Respeita blocklist e auditoria iguais à `comm-image-gen`.
5. Em `ComunicacaoStudio.tsx` (aba Galeria IA): toggle "Provedor" com Pollinations/Gemini/Cloudflare; default Pollinations.

### Leva C — Aba "Fluxos" estilo n8n

6. Nova rota `/app/comunicacao/fluxos` com **React Flow** (`@xyflow/react`).
  - Nós: `Trigger` (manual/cron/webhook), `Gerar Texto`, `Gerar Imagem`, `Aprovar`, `Publicar Social`, `Enviar Outlook`, `WhatsApp`, `Salvar Galeria`.
  - Persistência em nova tabela `comm_flows` (nodes/edges JSONB).
  - Executor: **nova edge** `comm-flow-run` que percorre o grafo chamando `comm-ai-free` / `comm-image-free` / funções já existentes (`comm-social-publish`, `eng-outlook-send`).
7. Templates prontos: "Post LinkedIn semanal", "Carrossel Instagram", "Newsletter mensal".

Esse fluxo deve ser tipo n8n e **Make (antigo Integromat) que cria conectores mas sem consumir créditos.**

### Leva D — Painel "IA & Custos"

8. Sub-aba em **Admin Comunicação** mostrando: chamadas por provedor, % grátis vs pago, cota restante de cada provedor (Gemini, Groq…), botão "trocar para pago" só para admin.

---

## 5) Passo a passo do que **você** precisa fazer (manual) para uma pessoa leiga que não entendi tecnologia.

Para a IA grátis funcionar, preciso que você gere as chaves grátis e me autorize a salvá-las como secrets. Vou abrir o secrets dialog quando você aprovar — mas adianto o caminho:

1. **Gemini (essencial)** → [https://aistudio.google.com/apikey](https://aistudio.google.com/apikey) → "Create API key" (use a conta Google do `.edu` ou pessoal — é grátis até nos planos sem cartão). Copia.
2. **Groq (recomendado)** → [https://console.groq.com/keys](https://console.groq.com/keys) → "Create API Key". Copia.
3. **GitHub Models (opcional)** → [https://github.com/settings/personal-access-tokens](https://github.com/settings/personal-access-tokens) → "Fine-grained token" sem scopes especiais; ative o Student Pack em [https://education.github.com/pack](https://education.github.com/pack) se ainda não tem.
4. **Cloudflare Workers AI (opcional, imagem HQ)** → [https://dash.cloudflare.com](https://dash.cloudflare.com) → "AI" → cria token + pega Account ID.
5. **Hugging Face (opcional)** → [https://huggingface.co/settings/tokens](https://huggingface.co/settings/tokens) → "Read".
6. **Pollinations** → não precisa de nada, já funciona.

Depois é só responder "pode" e eu peço as chaves uma a uma pelo formulário seguro.

---

## 6) Fluxograma final do módulo Comunicação (depois da implementação)

```text
┌─────────────────────────────────────────────────────────────┐
│                  COMUNICAÇÃO OCS                            │
└─────────────────────────────────────────────────────────────┘
   │
   ├── Brand Kits ─────────────► (sem IA)
   │
   ├── Studio ─────────────────► escolhe kind (post, legenda,
   │        │                    linkedin_longo, carrossel…)
   │        ▼
   │   ┌──────────────────────┐    grátis (default)
   │   │  Toggle Provedor IA  │────────────────►  comm-ai-free
   │   └──────────────────────┘                   ├─► Gemini Pro
   │        │                                     ├─► Groq
   │        │ pago (opt-in admin)                 └─► GitHub Models
   │        └──────────────────►  comm-ai (Lovable)  [como hoje]
   │
   ├── Galeria IA ─────────────►  comm-image-free
   │                              ├─► Pollinations (zero setup)
   │                              ├─► Gemini Image
   │                              ├─► Cloudflare Flux
   │                              └─► HF FLUX-schnell
   │                                   │
   │                                   ▼ bucket privado + signed_url
   │
   ├── Aprovação ──────────────► fluxo atual (sem mudança)
   ├── Agendamento ────────────► fluxo atual
   ├── Publicação Social ──────► comm-social-publish (atual)
   │
   ├── Fluxos (NOVO) ──────────► React Flow visual estilo n8n
   │        │                    nós conectam tudo acima
   │        ▼
   │   comm-flow-run (NOVA edge)
   │
   ├── Métricas ───────────────► comm-metrics-insights (atual)
   └── Admin ──────────────────► nova sub-aba "IA & Custos"
```

---

## 7) Garantias de não-regressão

- **Nada** do código atual (`comm-ai`, `comm-image-gen`, Studio existente) é editado — só adicionamos arquivos novos e dois toggles na UI.
- Default do toggle = **grátis** → ninguém precisa de configuração extra para deixar de consumir crédito.
- Se uma chave grátis falhar, mostra toast claro e oferece tentar outro provedor (sem cair silenciosamente no Lovable AI pago).

---

Aprova essa abordagem? Se sim, começo pela **Leva A (texto grátis + LinkedIn longo)** que já elimina ~70% do consumo, depois Leva B (imagem grátis), depois C (fluxos) e D (painel).

&nbsp;

Aprovados mas faça a leva A + B + C + D junto porque n tenho créditos pra continuar várias vezes