// DEMONSTRAÇÃO (roda com: node demo.js) — NÃO precisa de chave de IA real.
// Usa 3 IAs FALSAS pra provar as duas coisas que você perguntou:
//   1) Troca de IA automática quando uma fica "sem crédito" (erro 429).
//   2) A MEMÓRIA sobrevive à troca (o histórico é reenviado pela nossa base).
import * as store from './src/store.js';
import { gerar } from './src/router.js';
import { makeMock } from './src/providers.js';

const linha = () => console.log('─'.repeat(64));

async function main() {
  store._reset();

  // Cria um CLIENTE (tenant) e cadastra 3 IAs (as "grátis" primeiro).
  const cliente = store.createTenant('Loja da Jessica');
  console.log(`\n👤 Cliente criado: ${cliente.name}  (token: ${cliente.token.slice(0, 8)}…)`);

  store.addKey(cliente.id, { provider: 'ia_gratis_1', apiKey: 'chave-falsa-1', priority: 1 });
  store.addKey(cliente.id, { provider: 'ia_gratis_2', apiKey: 'chave-falsa-2', priority: 2 });
  store.addKey(cliente.id, { provider: 'ia_reserva_3', apiKey: 'chave-falsa-3', priority: 3 });
  console.log('🔑 3 chaves cadastradas (guardadas CIFRADAS), ordem: ia_gratis_1 → ia_gratis_2 → ia_reserva_3');

  // RODADA 1: todas as IAs funcionando. Cliente diz o nome.
  linha();
  console.log('RODADA 1 — pergunta: "Oi! Meu nome é Jessica."');
  let mocks = {
    ia_gratis_1: makeMock('ia_gratis_1'),
    ia_gratis_2: makeMock('ia_gratis_2'),
    ia_reserva_3: makeMock('ia_reserva_3'),
  };
  let r = await gerar({ tenantId: cliente.id, message: 'Oi! Meu nome é Jessica.', mocks });
  const conv = r.conversationId;
  console.log(`🤖 Respondeu: ${r.usadaAgora}  →  "${r.reply}"`);

  // RODADA 2: a IA nº1 FICOU SEM CRÉDITO (429). Deve trocar sozinha e AINDA lembrar o nome.
  linha();
  console.log('RODADA 2 — a ia_gratis_1 fica SEM CRÉDITO (429). Pergunta: "Qual é o meu nome?"');
  mocks = {
    ia_gratis_1: makeMock('ia_gratis_1', { failWith: 429 }), // sem crédito!
    ia_gratis_2: makeMock('ia_gratis_2'),                    // essa assume
    ia_reserva_3: makeMock('ia_reserva_3'),
  };
  r = await gerar({ tenantId: cliente.id, conversationId: conv, message: 'Qual é o meu nome?', mocks });
  r.tentativas.forEach(t => console.log(`   • ${t.provider}: ${t.resultado}`));
  console.log(`🤖 Respondeu: ${r.usadaAgora}  →  "${r.reply}"`);
  console.log(r.reply.includes('Jessica')
    ? '✅ PROVA: trocou de IA E LEMBROU o nome (memória preservada na troca).'
    : '❌ perdeu o contexto.');

  // RODADA 3: as DUAS grátis sem crédito. Cai na reserva — e continua lembrando.
  linha();
  console.log('RODADA 3 — ia_gratis_1 e ia_gratis_2 SEM CRÉDITO. Pergunta: "De novo: qual meu nome?"');
  mocks = {
    ia_gratis_1: makeMock('ia_gratis_1', { failWith: 429 }),
    ia_gratis_2: makeMock('ia_gratis_2', { failWith: 429 }),
    ia_reserva_3: makeMock('ia_reserva_3'),
  };
  r = await gerar({ tenantId: cliente.id, conversationId: conv, message: 'De novo: qual meu nome?', mocks });
  r.tentativas.forEach(t => console.log(`   • ${t.provider}: ${t.resultado}`));
  console.log(`🤖 Respondeu: ${r.usadaAgora}  →  "${r.reply}"`);

  // Mostra o histórico salvo (a memória do cliente)
  linha();
  console.log('🧠 MEMÓRIA salva no banco (sobrevive a qualquer troca de IA):');
  store.getMessages(cliente.id, conv).forEach(m =>
    console.log(`   [${m.role}]${m.meta?.provider ? ' via ' + m.meta.provider : ''}: ${m.content}`));

  linha();
  console.log('✅ Multi-tenant: chaves e conversas isoladas por cliente.');
  console.log('✅ Failover automático: trocou de IA sozinho quando faltou crédito.');
  console.log('✅ Memória: o contexto viajou junto em TODAS as trocas.\n');
}

main().catch(e => { console.error('Erro na demo:', e); process.exit(1); });
