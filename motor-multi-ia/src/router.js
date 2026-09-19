// O ROTEADOR MULTI-IA (o coração do sistema)
// Recebe uma mensagem do cliente e:
//  1. Carrega o HISTÓRICO da conversa (a memória fica no nosso banco, não na IA).
//  2. Tenta as IAs do cliente EM ORDEM de prioridade (as grátis primeiro).
//  3. Se uma responde -> devolve. Se falha por "sem crédito" -> coloca em cooldown
//     e TROCA sozinho pra próxima. O histórico é reenviado, então a memória NÃO some.
//  4. Salva a resposta no histórico pra próxima rodada.
import * as store from './store.js';
import { getProvider, REAL_PROVIDERS } from './providers.js';

const COOLDOWN_MS = 5 * 60 * 1000; // uma IA sem crédito "descansa" 5 min antes de tentar de novo
const SYSTEM_PROMPT =
  'Você é o assistente do Método Alma Brasileira. Responda em português do Brasil, ' +
  'de forma calorosa e prática. Use SEMPRE o histórico da conversa para manter o contexto.';

// mocks: mapa opcional de IAs falsas (só na demonstração).
export async function gerar({ tenantId, conversationId, message, mocks = {} }) {
  // 1) Histórico (memória)
  let convId = conversationId;
  if (!convId) convId = store.createConversation(tenantId).id;
  const historico = store.getMessages(tenantId, convId);
  if (historico === null) throw new Error('Conversa não pertence a este cliente (isolamento multi-tenant).');

  // Monta as mensagens no formato único: system + histórico + nova pergunta
  const messages = [
    { role: 'system', content: SYSTEM_PROMPT },
    ...historico.map(m => ({ role: m.role, content: m.content })),
    { role: 'user', content: message },
  ];

  // 2) IAs do cliente, em ordem de prioridade
  const chaves = store.getKeysDecrypted(tenantId);
  if (chaves.length === 0) throw new Error('Este cliente ainda não cadastrou nenhuma chave de IA.');

  const tentativas = [];
  for (const chave of chaves) {
    const prov = getProvider(chave.provider, mocks);
    if (!prov) { tentativas.push({ provider: chave.provider, resultado: 'provedor desconhecido' }); continue; }

    // pula quem está "descansando" (sem crédito recente)
    if (store.isInCooldown(tenantId, chave.provider)) {
      tentativas.push({ provider: chave.provider, resultado: 'em cooldown (sem crédito agora) — pulada' });
      continue;
    }

    try {
      const content = await prov.chat({ apiKey: chave.apiKey, model: chave.model, messages });
      // 4) sucesso: grava pergunta + resposta no histórico
      store.appendMessage(convId, 'user', message);
      store.appendMessage(convId, 'assistant', content, { provider: chave.provider });
      tentativas.push({ provider: chave.provider, resultado: 'OK ✅' });
      return {
        conversationId: convId,
        reply: content,
        usadaAgora: chave.provider,
        label: prov.label,
        trocou: tentativas.filter(t => t.resultado.startsWith('OK')).length > 0 && tentativas.length > 1,
        tentativas,
      };
    } catch (err) {
      if (err.kind === 'quota') {
        store.setCooldown(tenantId, chave.provider, COOLDOWN_MS);
        tentativas.push({ provider: chave.provider, resultado: `sem crédito/limite (${err.status}) — troquei de IA e coloquei em cooldown` });
      } else if (err.kind === 'auth') {
        tentativas.push({ provider: chave.provider, resultado: `chave inválida (${err.status}) — pulei` });
      } else {
        tentativas.push({ provider: chave.provider, resultado: `erro passageiro (${err.status || '?'}) — tentei a próxima` });
      }
      // continua o laço -> TROCA de IA automaticamente
    }
  }

  // 3) todas falharam
  const erro = new Error('Todas as suas IAs estão sem crédito ou indisponíveis no momento. Adicione outra chave.');
  erro.tentativas = tentativas;
  throw erro;
}

export { REAL_PROVIDERS };
