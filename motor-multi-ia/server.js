// MINI-SERVIDOR REAL (Node puro, sem dependências)
// Sobe uma API HTTP de verdade. Multi-tenant: cada cliente tem token, chaves e conversas.
// Rode com:  node server.js   (porta 3000, ou PORT=xxxx)
//
// Rotas:
//   POST /tenants                      -> cria cliente { name }            => { id, token }
//   POST /tenants/keys                 -> add chave (Bearer token)          { provider, apiKey, model?, priority? }
//   GET  /tenants/keys                 -> lista chaves mascaradas (Bearer)
//   POST /chat                         -> conversa (Bearer)                 { message, conversationId? }
//   GET  /conversations/:id            -> histórico (Bearer)
import http from 'node:http';
import * as store from './src/store.js';
import { gerar, REAL_PROVIDERS } from './src/router.js';

const PORT = process.env.PORT || 3000;

function send(res, code, obj) {
  res.writeHead(code, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(obj, null, 2));
}
function body(req) {
  return new Promise((resolve) => {
    let d = ''; req.on('data', c => d += c); req.on('end', () => { try { resolve(d ? JSON.parse(d) : {}); } catch { resolve({}); } });
  });
}
function auth(req) {
  const h = req.headers['authorization'] || '';
  const token = h.replace(/^Bearer\s+/i, '');
  return store.getTenantByToken(token);
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  const p = url.pathname;

  try {
    // Cria cliente (não precisa de token)
    if (req.method === 'POST' && p === '/tenants') {
      const b = await body(req);
      return send(res, 201, store.createTenant(b.name));
    }

    // Daqui pra baixo exige token do cliente (isolamento multi-tenant)
    const tenant = auth(req);
    if (!tenant) return send(res, 401, { erro: 'Envie o token do cliente em Authorization: Bearer <token>.' });

    if (req.method === 'POST' && p === '/tenants/keys') {
      const b = await body(req);
      if (!b.provider || !b.apiKey) return send(res, 400, { erro: 'Informe provider e apiKey.' });
      if (!REAL_PROVIDERS[b.provider]) return send(res, 400, { erro: `provider inválido. Use: ${Object.keys(REAL_PROVIDERS).join(', ')}` });
      return send(res, 201, store.addKey(tenant.id, b));
    }

    if (req.method === 'GET' && p === '/tenants/keys') {
      return send(res, 200, { chaves: store.listKeysMasked(tenant.id) });
    }

    if (req.method === 'POST' && p === '/chat') {
      const b = await body(req);
      if (!b.message) return send(res, 400, { erro: 'Informe message.' });
      try {
        const r = await gerar({ tenantId: tenant.id, conversationId: b.conversationId, message: b.message });
        return send(res, 200, r);
      } catch (e) {
        return send(res, 502, { erro: e.message, tentativas: e.tentativas || null });
      }
    }

    if (req.method === 'GET' && p.startsWith('/conversations/')) {
      const cid = p.split('/')[2];
      const msgs = store.getMessages(tenant.id, cid);
      if (msgs === null) return send(res, 404, { erro: 'Conversa não encontrada para este cliente.' });
      return send(res, 200, { conversationId: cid, mensagens: msgs });
    }

    return send(res, 404, { erro: 'Rota não encontrada.' });
  } catch (e) {
    return send(res, 500, { erro: String(e.message || e) });
  }
});

server.listen(PORT, () => {
  console.log(`\n🌱 Motor Multi-IA (Alma Brasileira) rodando em http://localhost:${PORT}`);
  console.log(`   IAs suportadas: ${Object.keys(REAL_PROVIDERS).join(', ')}`);
  console.log(`   Dica: rode "node demo.js" pra ver o failover + memória sem precisar de chave.\n`);
});
