// Banco de dados MULTI-TENANT (multi-inquilino)
// Cada CLIENTE (tenant) tem: suas chaves de IA, suas conversas e seu histórico —
// tudo isolado. Aqui uso um arquivo JSON pra você ver funcionando sem instalar banco.
// No Lovable/produção isto vira tabelas no Supabase (Postgres) com RLS por cliente.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { encrypt, decrypt, mask } from './crypto.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.join(__dirname, '..', 'data', 'db.json');

function load() {
  try { return JSON.parse(fs.readFileSync(DB_PATH, 'utf8')); }
  catch { return { tenants: {}, keys: {}, conversations: {}, messages: {}, cooldowns: {} }; }
}
function save(db) { fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2)); }
function id(prefix) { return prefix + '_' + crypto.randomBytes(6).toString('hex'); }

// ---- CLIENTES (tenants) ----
export function createTenant(name) {
  const db = load();
  const tid = id('tenant');
  const token = crypto.randomBytes(16).toString('hex'); // "senha" de acesso do cliente
  db.tenants[tid] = { id: tid, name: name || 'Cliente', token, createdAt: Date.now() };
  save(db);
  return { id: tid, name: db.tenants[tid].name, token };
}
export function getTenantByToken(token) {
  const db = load();
  return Object.values(db.tenants).find(t => t.token === token) || null;
}

// ---- CHAVES DE IA (BYOK, criptografadas) ----
export function addKey(tenantId, { provider, apiKey, model, priority }) {
  const db = load();
  db.keys[tenantId] = db.keys[tenantId] || [];
  const kid = id('key');
  db.keys[tenantId].push({
    id: kid, provider, model: model || null,
    apiKeyEnc: encrypt(apiKey),                 // <- guardada CIFRADA
    priority: priority ?? db.keys[tenantId].length + 1,
    createdAt: Date.now(),
  });
  save(db);
  return { id: kid, provider, model: model || null, apiKeyMask: mask(apiKey) };
}

// Uso interno do roteador: chaves já ordenadas por prioridade e DECIFRADAS.
export function getKeysDecrypted(tenantId) {
  const db = load();
  return (db.keys[tenantId] || [])
    .slice()
    .sort((a, b) => a.priority - b.priority)
    .map(k => ({ ...k, apiKey: decrypt(k.apiKeyEnc) }));
}

// Uso externo (mostrar pro cliente): mascarada, nunca em texto puro.
export function listKeysMasked(tenantId) {
  const db = load();
  return (db.keys[tenantId] || [])
    .slice()
    .sort((a, b) => a.priority - b.priority)
    .map(k => ({ id: k.id, provider: k.provider, model: k.model, priority: k.priority,
                 apiKeyMask: mask(decrypt(k.apiKeyEnc)),
                 status: isInCooldown(tenantId, k.provider) ? 'descansando (sem crédito agora)' : 'pronta' }));
}

// ---- COOLDOWN (quando uma IA fica "sem crédito", descansa X minutos) ----
export function setCooldown(tenantId, provider, ms) {
  const db = load();
  db.cooldowns[tenantId] = db.cooldowns[tenantId] || {};
  db.cooldowns[tenantId][provider] = Date.now() + ms;
  save(db);
}
export function isInCooldown(tenantId, provider) {
  const db = load();
  const until = db.cooldowns?.[tenantId]?.[provider] || 0;
  return Date.now() < until;
}

// ---- CONVERSAS + HISTÓRICO (a MEMÓRIA fica aqui, não na IA) ----
export function createConversation(tenantId, title) {
  const db = load();
  const cid = id('conv');
  db.conversations[cid] = { id: cid, tenantId, title: title || 'Conversa', createdAt: Date.now() };
  db.messages[cid] = [];
  save(db);
  return db.conversations[cid];
}
export function getMessages(tenantId, convId) {
  const db = load();
  const conv = db.conversations[convId];
  if (!conv || conv.tenantId !== tenantId) return null; // isolamento: só vê o que é seu
  return db.messages[convId] || [];
}
export function appendMessage(convId, role, content, meta) {
  const db = load();
  db.messages[convId] = db.messages[convId] || [];
  db.messages[convId].push({ role, content, meta: meta || null, at: Date.now() });
  save(db);
}

// Utilitário só pra demo: zera tudo.
export function _reset() { save({ tenants: {}, keys: {}, conversations: {}, messages: {}, cooldowns: {} }); }
