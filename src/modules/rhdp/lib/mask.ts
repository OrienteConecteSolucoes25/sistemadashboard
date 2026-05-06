/** Mascara CPF como 123.456.***-** quando sem permissão sensível. */
export function maskCpf(v?: string | null) {
  if (!v) return "—";
  const d = v.replace(/\D/g, "");
  if (d.length < 11) return "•••";
  return `${d.slice(0,3)}.${d.slice(3,6)}.***-**`;
}

export function maskMoney(v?: number | null) {
  if (v == null) return "—";
  return "R$ •••,••";
}

export function maskBank(v?: any) {
  if (!v) return "—";
  return "•••• ••••";
}

export function fmtMoney(v?: number | null) {
  if (v == null) return "—";
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function fmtCpf(v?: string | null) {
  if (!v) return "—";
  const d = v.replace(/\D/g, "");
  if (d.length !== 11) return v;
  return `${d.slice(0,3)}.${d.slice(3,6)}.${d.slice(6,9)}-${d.slice(9)}`;
}
