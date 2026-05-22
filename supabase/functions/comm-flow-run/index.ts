// Edge: comm-flow-run
// Executor de fluxos visuais do Comunicação OCS (estilo n8n).
// Percorre o grafo (nodes/edges) e executa cada nó usando edges grátis comm-ai-free / comm-image-free.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON = Deno.env.get("SUPABASE_ANON_KEY")!;
const SUPABASE_SR = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

interface FlowNode { id: string; type: string; data?: any; }
interface FlowEdge { id: string; source: string; target: string; }

function topoOrder(nodes: FlowNode[], edges: FlowEdge[]): FlowNode[] {
  const inDeg = new Map<string, number>();
  const outMap = new Map<string, string[]>();
  nodes.forEach((n) => inDeg.set(n.id, 0));
  edges.forEach((e) => {
    inDeg.set(e.target, (inDeg.get(e.target) ?? 0) + 1);
    outMap.set(e.source, [...(outMap.get(e.source) ?? []), e.target]);
  });
  const queue: string[] = [];
  inDeg.forEach((d, id) => { if (d === 0) queue.push(id); });
  const order: FlowNode[] = [];
  const byId = new Map(nodes.map((n) => [n.id, n]));
  while (queue.length) {
    const id = queue.shift()!;
    const n = byId.get(id); if (n) order.push(n);
    (outMap.get(id) ?? []).forEach((t) => {
      inDeg.set(t, (inDeg.get(t) ?? 1) - 1);
      if ((inDeg.get(t) ?? 0) === 0) queue.push(t);
    });
  }
  return order;
}

function interpolate(tpl: string, ctx: Record<string, any>): string {
  if (typeof tpl !== "string") return tpl;
  return tpl.replace(/\{\{\s*([\w.]+)\s*\}\}/g, (_, path) => {
    const parts = path.split(".");
    let v: any = ctx;
    for (const p of parts) v = v?.[p];
    return v == null ? "" : typeof v === "string" ? v : JSON.stringify(v);
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const auth = req.headers.get("Authorization");
    if (!auth) return new Response(JSON.stringify({ error: "no_auth" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    const sb = createClient(SUPABASE_URL, SUPABASE_ANON, { global: { headers: { Authorization: auth } } });
    const { data: { user } } = await sb.auth.getUser();
    if (!user) return new Response(JSON.stringify({ error: "unauth" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const { flow_id, inputs = {} } = await req.json();
    if (!flow_id) return new Response(JSON.stringify({ error: "missing_flow_id" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const { data: flow, error: fErr } = await sb.from("comm_flows").select("*").eq("id", flow_id).maybeSingle();
    if (fErr || !flow) return new Response(JSON.stringify({ error: "flow_not_found" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const sbAdmin = createClient(SUPABASE_URL, SUPABASE_SR);
    const { data: runRow } = await sbAdmin.from("comm_flow_runs").insert({
      flow_id, company_id: flow.company_id, status: "running", started_by: user.id, log: [],
    }).select().single();

    const log: any[] = [];
    const ctx: Record<string, any> = { inputs, nodes: {} };
    const order = topoOrder(flow.nodes ?? [], flow.edges ?? []);

    async function callEdge(name: string, body: any) {
      const r = await fetch(`${SUPABASE_URL}/functions/v1/${name}`, {
        method: "POST",
        headers: { Authorization: auth!, "Content-Type": "application/json", apikey: SUPABASE_ANON },
        body: JSON.stringify(body),
      });
      return r.json();
    }

    let stopped = false;
    for (const node of order) {
      if (stopped) break;
      const d = node.data ?? {};
      try {
        switch (node.type) {
          case "trigger":
            ctx.nodes[node.id] = { ok: true, ...inputs };
            break;
          case "ai_text": {
            const res = await callEdge("comm-ai-free", {
              kind: d.kind ?? "post",
              company_id: flow.company_id,
              brand: d.brand ?? null,
              inputs: Object.fromEntries(Object.entries(d.inputs ?? {}).map(([k, v]) => [k, interpolate(String(v), ctx)])),
              preferred: d.preferred ?? "auto",
            });
            ctx.nodes[node.id] = res;
            break;
          }
          case "ai_image": {
            const res = await callEdge("comm-image-free", {
              company_id: flow.company_id,
              prompt: interpolate(d.prompt ?? "", ctx),
              format: d.format ?? "1080x1080",
              preferred: d.preferred ?? "pollinations",
            });
            ctx.nodes[node.id] = res;
            break;
          }
          case "save_gallery":
            // imagem já é salva pela edge; este nó apenas marca aprovado se houver upstream com image
            ctx.nodes[node.id] = { ok: true, note: "imagem persistida em comm_generated_images" };
            break;
          case "delay": {
            const ms = Math.min(parseInt(d.ms ?? "1000", 10) || 1000, 15000);
            await new Promise((r) => setTimeout(r, ms));
            ctx.nodes[node.id] = { ok: true, waited_ms: ms };
            break;
          }
          case "log":
            ctx.nodes[node.id] = { ok: true, message: interpolate(d.message ?? "", ctx) };
            break;
          default:
            ctx.nodes[node.id] = { ok: false, error: `node_type_${node.type}_not_supported` };
        }
        log.push({ node: node.id, type: node.type, ok: ctx.nodes[node.id]?.ok !== false, at: new Date().toISOString() });
      } catch (e) {
        log.push({ node: node.id, type: node.type, ok: false, error: String(e), at: new Date().toISOString() });
        stopped = true;
      }
    }

    await sbAdmin.from("comm_flow_runs").update({
      status: stopped ? "error" : "success", log, result: ctx.nodes, finished_at: new Date().toISOString(),
    }).eq("id", runRow!.id);

    return new Response(JSON.stringify({ ok: !stopped, run_id: runRow!.id, log, result: ctx.nodes }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: "internal", message: String(e) }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
