// ADAPTADORES DE IA (a camada "tradutora")
// Cada IA fala um "idioma" diferente. Aqui todos recebem o MESMO formato de mensagens
// ([{role, content}]) e devolvem o MESMO formato ({content}). Assim o resto do app
// não precisa saber QUAL IA respondeu — trocar de IA vira só configuração.
//
// role pode ser: 'system' | 'user' | 'assistant'

// Classifica o erro de uma IA pra decidir o que fazer:
//  - 'quota'  -> sem crédito / limite batido  => troca de IA e coloca em cooldown
//  - 'auth'   -> chave inválida               => troca de IA (chave ruim)
//  - 'other'  -> erro passageiro              => tenta a próxima também
export function classify(status, bodyText = '') {
  const b = (bodyText || '').toLowerCase();
  if (status === 429 || status === 402) return 'quota';
  if (b.includes('quota') || b.includes('insufficient') || b.includes('rate limit') || b.includes('credit')) return 'quota';
  if (status === 401 || status === 403) return 'auth';
  return 'other';
}

class ProviderError extends Error {
  constructor(kind, status, msg) { super(msg); this.kind = kind; this.status = status; }
}

// ---- Helper para todas as IAs "estilo OpenAI" (OpenAI, Groq, OpenRouter, Mistral) ----
async function openaiCompatible(url, apiKey, model, messages, extraHeaders = {}) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}`, ...extraHeaders },
    body: JSON.stringify({ model, messages, temperature: 0.7 }),
  });
  if (!res.ok) {
    const txt = await res.text().catch(() => '');
    throw new ProviderError(classify(res.status, txt), res.status, txt.slice(0, 300));
  }
  const data = await res.json();
  return data.choices?.[0]?.message?.content ?? '';
}

// ---- IAs REAIS (grátis primeiro, na prática) ----
export const REAL_PROVIDERS = {
  groq: { // GRÁTIS (rápido) — Llama etc.
    label: 'Groq (grátis)', free: true, defaultModel: 'llama-3.1-8b-instant',
    chat: ({ apiKey, model, messages }) =>
      openaiCompatible('https://api.groq.com/openai/v1/chat/completions', apiKey, model || 'llama-3.1-8b-instant', messages),
  },
  openrouter: { // porta única p/ dezenas de modelos, vários GRÁTIS (sufixo :free)
    label: 'OpenRouter (tem grátis)', free: true, defaultModel: 'meta-llama/llama-3.1-8b-instruct:free',
    chat: ({ apiKey, model, messages }) =>
      openaiCompatible('https://openrouter.ai/api/v1/chat/completions', apiKey, model || 'meta-llama/llama-3.1-8b-instruct:free', messages),
  },
  mistral: { // tem camada grátis
    label: 'Mistral (tem grátis)', free: true, defaultModel: 'mistral-small-latest',
    chat: ({ apiKey, model, messages }) =>
      openaiCompatible('https://api.mistral.ai/v1/chat/completions', apiKey, model || 'mistral-small-latest', messages),
  },
  gemini: { // Google — camada grátis generosa. Formato PRÓPRIO (traduzido abaixo).
    label: 'Google Gemini (grátis)', free: true, defaultModel: 'gemini-1.5-flash',
    chat: async ({ apiKey, model, messages }) => {
      const m = model || 'gemini-1.5-flash';
      const system = messages.filter(x => x.role === 'system').map(x => x.content).join('\n') || undefined;
      const contents = messages.filter(x => x.role !== 'system').map(x => ({
        role: x.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: x.content }],
      }));
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent?key=${apiKey}`;
      const res = await fetch(url, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents, systemInstruction: system ? { parts: [{ text: system }] } : undefined }),
      });
      if (!res.ok) { const t = await res.text().catch(() => ''); throw new ProviderError(classify(res.status, t), res.status, t.slice(0, 300)); }
      const data = await res.json();
      return data.candidates?.[0]?.content?.parts?.map(p => p.text).join('') ?? '';
    },
  },
  openai: { // pago (bom como reserva de qualidade)
    label: 'OpenAI (pago)', free: false, defaultModel: 'gpt-4o-mini',
    chat: ({ apiKey, model, messages }) =>
      openaiCompatible('https://api.openai.com/v1/chat/completions', apiKey, model || 'gpt-4o-mini', messages),
  },
  anthropic: { // pago (Claude) — formato próprio (traduzido abaixo).
    label: 'Anthropic Claude (pago)', free: false, defaultModel: 'claude-3-5-haiku-latest',
    chat: async ({ apiKey, model, messages }) => {
      const system = messages.filter(x => x.role === 'system').map(x => x.content).join('\n') || undefined;
      const msgs = messages.filter(x => x.role !== 'system').map(x => ({ role: x.role, content: x.content }));
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
        body: JSON.stringify({ model: model || 'claude-3-5-haiku-latest', max_tokens: 1024, system, messages: msgs }),
      });
      if (!res.ok) { const t = await res.text().catch(() => ''); throw new ProviderError(classify(res.status, t), res.status, t.slice(0, 300)); }
      const data = await res.json();
      return data.content?.map(c => c.text).join('') ?? '';
    },
  },
};

// ---- IAs FALSAS (só pra DEMONSTRAÇÃO, sem precisar de chave real) ----
// Elas LEEM o histórico que recebem — assim provamos que o contexto viaja junto
// e que trocar de IA NÃO apaga a memória. Dá pra forçar "sem crédito" (erro 429).
export function makeMock(name, { failWith } = {}) {
  return {
    label: `IA Falsa "${name}"`, free: true, defaultModel: 'mock',
    chat: async ({ messages }) => {
      if (failWith) throw new ProviderError(classify(failWith), failWith, `simulado: ${failWith}`);
      // "Lê" o histórico: procura o nome que a pessoa disse em qualquer mensagem anterior.
      const texto = messages.map(m => m.content).join('\n');
      const nome = (texto.match(/meu nome é ([A-Za-zÀ-ú]+)/i) || [])[1];
      const ultima = messages[messages.length - 1]?.content || '';
      if (/qual.*meu nome/i.test(ultima)) {
        return nome
          ? `[${name}] Claro — seu nome é ${nome}. (lembrei pelo histórico que o sistema me enviou 👍)`
          : `[${name}] Você ainda não me disse seu nome.`;
      }
      return `[${name}] Recebi ${messages.length} mensagem(ns) de histórico. Você disse: "${ultima}"`;
    },
  };
}

export function getProvider(providerId, mocks = {}) {
  return mocks[providerId] || REAL_PROVIDERS[providerId] || null;
}
