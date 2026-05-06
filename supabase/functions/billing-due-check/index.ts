// Billing due check — D-3 e D0 (executa diariamente via pg_cron)
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const sb = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const today = new Date();
  const y = today.getUTCFullYear();
  const m = today.getUTCMonth(); // 0-based
  const day = today.getUTCDate();
  const competencia = `${y}-${String(m + 1).padStart(2, "0")}`;

  const { data: plans } = await sb
    .from("company_plans")
    .select("id, company_id, dia_vencimento, valor_mensal, status, modules")
    .eq("status", "ativo");

  if (!plans?.length) {
    return new Response(JSON.stringify({ ok: true, processed: 0 }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const companyIds = plans.map((p: any) => p.company_id);
  const { data: companies } = await sb.from("companies").select("id, nome, contato_whatsapp, pix_chave").in("id", companyIds);

  const planIds = plans.map((p: any) => p.id);
  const { data: pays } = await sb
    .from("company_plan_payments")
    .select("company_plan_id, competencia")
    .in("company_plan_id", planIds)
    .eq("competencia", competencia);
  const paidSet = new Set((pays ?? []).map((p: any) => p.company_plan_id));

  const { data: existingRuns } = await sb
    .from("plan_billing_runs")
    .select("company_plan_id, tipo")
    .in("company_plan_id", planIds)
    .eq("competencia", competencia);
  const ranKey = new Set((existingRuns ?? []).map((r: any) => `${r.company_plan_id}:${r.tipo}`));

  let processed = 0;
  for (const p of plans as any[]) {
    if (paidSet.has(p.id)) continue;
    const dia = Math.min(28, Math.max(1, p.dia_vencimento || 10));
    let tipo: "d-3" | "d0" | null = null;
    if (day === Math.max(1, dia - 3)) tipo = "d-3";
    else if (day === dia) tipo = "d0";
    if (!tipo) continue;
    if (ranKey.has(`${p.id}:${tipo}`)) continue;

    const company = companies?.find((c: any) => c.id === p.company_id);
    if (!company) continue;

    // Inserir run (idempotente via unique)
    const { error: runErr } = await sb.from("plan_billing_runs").insert({
      company_plan_id: p.id,
      competencia,
      tipo,
      canal: "interno",
      payload: { valor: p.valor_mensal, dia_vencimento: dia, company_nome: company.nome },
    });
    if (runErr && !String(runErr.message).includes("duplicate")) continue;

    // Notificar usuários da empresa
    const { data: cu } = await sb.from("company_users").select("user_id").eq("company_id", p.company_id);
    const titulo = tipo === "d-3" ? `Vencimento em 3 dias (${competencia})` : `Plano vence hoje (${competencia})`;
    const detalhe = `Valor: R$ ${Number(p.valor_mensal).toLocaleString("pt-BR")} · Dia ${dia}. ${company.pix_chave ? "PIX: " + company.pix_chave : ""}`;
    for (const u of (cu ?? []) as any[]) {
      await sb.from("eng_internal_notifications").insert({
        user_id: u.user_id,
        titulo,
        detalhe,
        tipo: tipo === "d-3" ? "cobranca_d3" : "cobranca_d0",
        origem: "billing-due-check",
        modulo: "planos",
        route: "/app/minha-empresa",
        origem_id: p.id,
      });
    }
    // Notificar OCS (financeiro/admin) — broadcast
    await sb.from("eng_internal_notifications").insert({
      user_id: null,
      titulo: `[OCS] ${company.nome} — ${titulo}`,
      detalhe,
      tipo: tipo === "d-3" ? "cobranca_d3" : "cobranca_d0",
      origem: "billing-due-check",
      modulo: "planos",
      route: "/app/planos",
      origem_id: p.id,
    });
    processed++;
  }

  return new Response(JSON.stringify({ ok: true, processed, competencia }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
