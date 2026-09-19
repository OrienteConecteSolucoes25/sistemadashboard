// Cofre de chaves — criptografia AES-256-GCM
// As chaves de IA dos clientes NUNCA ficam em texto puro no banco.
// Elas são cifradas com uma chave-mestra (MASTER_KEY) que fica só no servidor.
import crypto from 'node:crypto';

const MASTER = process.env.MASTER_KEY || 'dev-inseguro-troque-em-producao-000';
// Deriva uma chave de 32 bytes a partir da MASTER_KEY (para AES-256).
const key = crypto.createHash('sha256').update(MASTER).digest();

// Cifra um texto e devolve "iv.tag.dados" (tudo em base64).
export function encrypt(text) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const enc = Buffer.concat([cipher.update(String(text), 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [iv.toString('base64'), tag.toString('base64'), enc.toString('base64')].join('.');
}

// Decifra o "iv.tag.dados" de volta pro texto original.
export function decrypt(blob) {
  const [ivb, tagb, encb] = String(blob).split('.');
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, Buffer.from(ivb, 'base64'));
  decipher.setAuthTag(Buffer.from(tagb, 'base64'));
  return Buffer.concat([decipher.update(Buffer.from(encb, 'base64')), decipher.final()]).toString('utf8');
}

// Mostra a chave mascarada (pro cliente conferir sem expor): "AIza…9f2c"
export function mask(text) {
  const s = String(text);
  if (s.length <= 8) return '••••';
  return s.slice(0, 4) + '…' + s.slice(-4);
}
