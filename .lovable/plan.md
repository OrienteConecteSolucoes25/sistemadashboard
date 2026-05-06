# Fase 3 — Geração de Imagem por IA + Integração Canva Pro

## 1. Opções de geração de imagem

| Opção | Tipo | Custo | Qualidade | Observação |
|---|---|---|---|---|
| **Lovable AI Gateway — `google/gemini-3-pro-image-preview`** | API gerenciada | Incluso no plano Lovable (sem chave externa) | Alta, fotorealista + texto legível | **Recomendado** — já temos `LOVABLE_API_KEY` |
| **Lovable AI — `google/gemini-3.1-flash-image-preview`** | API gerenciada | Mais barato/rápido | Boa, ideal para variações | Bom para volume |
| **OpenAI gpt-image-1 / DALL·E 3** | API externa | Pago (chave própria) | Muito alta | Exige `OPENAI_API_KEY` do cliente |
| **Stability / Replicate / Fal** | API externa | Pago | Alta | Exige conta + chave + billing |
| **Stable Diffusion local (WebGPU)** | Browser | Grátis | Média/baixa | Pesado (>1 GB modelo), lento, inviável em mobile |
| **Templates SVG/Canvas (Fase 2)** | Local | Grátis | Determinística | Já implementado — não é IA real |

**Conclusão**: usar **Lovable AI Gateway** como provedor padrão (zero configuração para o cliente, sem cartão). Manter arquitetura plugável para OpenAI/Stability futuramente.

## 2. O que exige API paga

- OpenAI, Stability, Midjourney, Replicate, Fal, Leonardo → todos exigem chave + cartão do cliente
- Lovable AI já vem incluso → **não exige nada do cliente** nesta fase

## 3. O que roda local

- Apenas templates SVG/Canvas (Fase 2 — pronto)
- SD local em WebGPU é tecnicamente possível mas inviável na prática (UX ruim)

## 4. Proteção de chaves

- `LOVABLE_API_KEY` fica **só no Edge Function** (`supabase/functions/comm-image-gen`)
- Nunca exposta no cliente
- Edge function valida `auth.uid()`, papel `comunicacao_admin` ou `can_generate_design`, e `crea_can`-style permissão por empresa
- Rate limit por usuário/empresa (tabela `comm_ai_usage`)

## 5. Como salvar as imagens

- Bucket Storage **`comm-generated-images`** (privado, RLS por empresa)
- Tabela `comm_generated_images`:
  - `id`, `company_id`, `brand_kit_id`, `prompt`, `prompt_revisado`, `provider` (lovable/openai/...), `model`, `format` (1080x1080, 1080x1920, ...), `storage_path`, `public_url` (assinada sob demanda), `cost_credits`, `tokens_in`, `tokens_out`, `status` (queued/generating/ready/failed/rejected), `approval_status` (rascunho/aprovado/reprovado), `generated_by`, `approved_by`, `linked_post_id`, `linked_design_id`, soft delete completo

## 6. Custo/uso por empresa

- Tabela `comm_ai_usage`:
  - `company_id`, `user_id`, `provider`, `model`, `kind` (text/image), `tokens_in`, `tokens_out`, `cost_credits`, `created_at`
- Tabela `comm_ai_quotas` por empresa: `monthly_image_limit`, `monthly_text_limit`, `current_month_usage` (recalculado via view)
- Edge function bloqueia se cota estourada
- Dashboard em `/app/comunicacao/admin` mostra consumo

## 7. Aprovação humana obrigatória

- Toda imagem nasce com `approval_status = 'rascunho'`
- Só pode ser usada em post/calendário após `aprovado` por papel `aprovador` ou `comunicacao_admin`
- Edge function de "publicar manualmente" valida `approval_status = 'aprovado'`

## 8. Evitar geração indevida

- **Moderação de prompt** no edge function: blocklist (violência, sexual, marcas terceiras, políticos)
- Gemini já tem safety filters nativos — capturar e logar bloqueios
- Rate limit: 10 imagens/min por usuário, 200/dia por empresa (configurável)
- Auditoria obrigatória de todo prompt
- Confirmação visual antes de gerar (mostrar prompt final + custo estimado)

## 9. Histórico

- Tudo em `comm_generated_images` (soft delete, nunca DELETE)
- Página `/app/comunicacao/galeria-ia` com filtros (marca, formato, autor, status, período)
- Versão: `parent_image_id` para "gerar variação a partir desta"
- Auditoria em `comm_audit_logs` para cada geração/aprovação/uso

## 10. Riscos

- **Custo descontrolado** → mitigado por cota mensal + rate limit
- **Conteúdo inapropriado** → moderação + aprovação humana
- **Vazamento de chave** → nunca no client, só edge function
- **Direitos autorais** → desabilitar prompts com nomes de marcas/celebridades; aviso jurídico no UI
- **LGPD** → não gerar imagens com pessoas reais sem consentimento; aviso no formulário
- **Dependência de provedor** → arquitetura plugável (`provider` na tabela)

---

## Integração Canva Pro (alternativa preferida)

Você descreveu um fluxo que **economiza créditos de IA de imagem** e usa o Canva (que você já paga) como editor final. Arquitetura:

```text
ERP OCS Comunicação IA Studio
   │
   ├─ Gera briefing + legenda + texto + roteiro + carrossel + prompt visual (texto IA Lovable, grátis)
   │
   ├─ Botão "Abrir no Canva" → deep link com:
   │     • formato (1080x1080, 1080x1920, ...)
   │     • texto pré-preenchido (via clipboard ou Canva Apps SDK)
   │     • brand kit (cores, fontes, logo) já configurado no Canva
   │
   ├─ Você finaliza no Canva (manualmente, com seu Pro)
   │
   └─ Volta ao ERP via:
         • cola URL pública do design Canva no campo `canva_url`
         • upload manual do PNG/PDF exportado
         • (futuro) Canva Connect API → import automático
```

### Opções técnicas de integração Canva

| Nível | Como funciona | Esforço | Limitação |
|---|---|---|---|
| **A. Deep link simples** | Botão abre `https://www.canva.com/design?create&type=InstagramPost` em nova aba; usuário cola texto manualmente | Trivial | Sem automação real |
| **B. Clipboard + deep link** | Copia texto/prompt para clipboard antes de abrir Canva; usuário cola (Ctrl+V) | Baixo | Ainda manual mas rápido |
| **C. Canva Connect API (OAuth)** | OAuth do usuário, cria design via API, retorna URL editável, importa exportado de volta | Médio-alto | Exige aprovação Canva (parceiro), conta Pro/Teams, rate limits |
| **D. Canva Apps SDK (Plugin)** | Construir app dentro do Canva que puxa briefings do ERP | Alto | Publicação no Canva Marketplace |

**Recomendação**: começar com **B (clipboard + deep link)** + campo `canva_url` para registrar o design finalizado. Avaliar **C (Connect API)** na Fase 4 se houver volume.

### Tabela nova
- `comm_canva_designs`:
  - `id`, `company_id`, `brand_kit_id`, `briefing_id` (FK para post/legenda gerados)
  - `canva_url`, `canva_design_id` (se via API), `formato`, `status` (em_canva/exportado/aprovado/publicado)
  - `exported_file_path` (Storage), `linked_post_id`, `linked_calendar_id`
  - auditoria + soft delete

### Fluxo de aprovação (mantém regra atual)
1. IA gera briefing + prompt visual → `rascunho`
2. Usuário clica "Abrir no Canva" → status `em_canva`
3. Volta, cola URL ou faz upload → `exportado`
4. Aprovador aprova → `aprovado`
5. Marca como publicado manualmente → `publicado`

---

## Decisão necessária

Preciso que você escolha o caminho da Fase 3 antes de eu implementar:

**Opção 1** — Geração de imagem IA real (Lovable AI Gateway, sem custo extra para você)
**Opção 2** — Apenas integração Canva (clipboard + deep link + campo URL), zero IA de imagem
**Opção 3** — Ambos (IA Lovable como rascunho rápido + Canva como finalização premium)

## Não implementar agora
- OpenAI/Stability/Midjourney/Replicate
- Canva Connect API (OAuth completo)
- Publicação automática em redes sociais
- SD local em WebGPU
- Geração de vídeo IA
- Edição inline da imagem gerada (mask/inpainting)
