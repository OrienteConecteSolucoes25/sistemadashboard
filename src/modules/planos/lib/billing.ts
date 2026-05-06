export function ymNow(d = new Date()): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export function dueDate(year: number, month1: number, dia: number): Date {
  return new Date(year, month1 - 1, Math.min(dia, 28));
}

export function daysUntil(target: Date): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const t = new Date(target);
  t.setHours(0, 0, 0, 0);
  return Math.round((t.getTime() - today.getTime()) / 86400000);
}

export type PaymentStatus = "pago" | "atrasado" | "vence_hoje" | "d3" | "em_dia";

export function paymentStatus(plan: { dia_vencimento: number }, payments: { competencia: string }[]): {
  status: PaymentStatus;
  competencia: string;
  due: Date;
  diasRestantes: number;
} {
  const today = new Date();
  const comp = ymNow(today);
  const due = dueDate(today.getFullYear(), today.getMonth() + 1, plan.dia_vencimento);
  const days = daysUntil(due);
  const pago = payments.some((p) => p.competencia === comp);
  let status: PaymentStatus;
  if (pago) status = "pago";
  else if (days < 0) status = "atrasado";
  else if (days === 0) status = "vence_hoje";
  else if (days <= 3) status = "d3";
  else status = "em_dia";
  return { status, competencia: comp, due, diasRestantes: days };
}

export function whatsappLink(phone: string, msg: string): string {
  const clean = (phone || "").replace(/\D/g, "");
  return `https://wa.me/${clean}?text=${encodeURIComponent(msg)}`;
}

export function buildBillingMessage(opts: {
  empresa: string;
  valor: number;
  competencia: string;
  due: Date;
  pix: string;
  tipo: "d-3" | "d0" | "atrasado";
}): string {
  const valorFmt = opts.valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  const dataFmt = opts.due.toLocaleDateString("pt-BR");
  if (opts.tipo === "d-3") {
    return `Olá! Faltam 3 dias para o vencimento da sua assinatura do ERP OCS (${opts.empresa}).\n\nValor: ${valorFmt}\nVencimento: ${dataFmt}\nCompetência: ${opts.competencia}\n\nChave PIX: ${opts.pix}\n\nObrigado!`;
  }
  if (opts.tipo === "d0") {
    return `Olá! Hoje vence sua assinatura do ERP OCS (${opts.empresa}).\n\nValor: ${valorFmt}\nVencimento: ${dataFmt}\nCompetência: ${opts.competencia}\n\nChave PIX: ${opts.pix}\n\nObrigado!`;
  }
  return `Olá! Sua assinatura do ERP OCS (${opts.empresa}) está em atraso.\n\nValor: ${valorFmt}\nVencimento: ${dataFmt}\nCompetência: ${opts.competencia}\n\nChave PIX: ${opts.pix}\n\nObrigado!`;
}
