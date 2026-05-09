// Edge function: comm-social-publish (scaffold)
// Recebe { queue_id } ou { entidade_tipo, entidade_id, social_account_id, caption, media_urls, scheduled_for? }
// Em produção: chamará Meta Graph API / LinkedIn API. Por ora: marca como publicado/agendado e gera URL mock.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  try {
    const supa = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { global: { headers: { Authorization: req.headers.get("Authorization") ?? "" } } }
    );
    const userClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: req.headers.get("Authorization") ?? "" } } }
    );
    const { data: u } = await userClient.auth.getUser();
    if (!u?.user) return new Response(JSON.stringify({ error: "unauthenticated" }), { status: 401, headers: { ...cors, "Content-Type": "application/json" } });

    const body = await req.json();
    let queueRow: any = null;

    if (body.queue_id) {
      const r = await supa.from("comm_social_publish_queue").select("*").eq("id", body.queue_id).maybeSingle();
      queueRow = r.data;
    } else {
      const ins = await supa.from("comm_social_publish_queue").insert({
        company_id: body.company_id,
        client_brand_id: body.client_brand_id ?? null,
        social_account_id: body.social_account_id,
        entidade_tipo: body.entidade_tipo,
        entidade_id: body.entidade_id,
        caption: body.caption ?? null,
        media_urls: body.media_urls ?? [],
        scheduled_for: body.scheduled_for ?? null,
        status: body.scheduled_for ? "agendado" : "enviando",
        created_by: u.user.id,
      }).select().single();
      if (ins.error) throw ins.error;
      queueRow = ins.data;
    }

    if (!queueRow) throw new Error("queue_not_found");

    // Se for agendamento futuro, apenas confirma
    if (queueRow.scheduled_for && new Date(queueRow.scheduled_for) > new Date()) {
      return new Response(JSON.stringify({ ok: true, scheduled: true, queue: queueRow }), { headers: { ...cors, "Content-Type": "application/json" } });
    }

    // Carrega conta social (apenas metadata — token NÃO é decifrado aqui no scaffold)
    const acc = await supa.from("comm_social_accounts").select("id, provider, account_name, account_handle, status").eq("id", queueRow.social_account_id).maybeSingle();
    if (!acc.data) throw new Error("social_account_not_found");
    if (acc.data.status !== "connected") throw new Error("account_" + acc.data.status);

    // === SCAFFOLD: chamada real à API social vai aqui ===
    // Por ora, mock — gera id/url falsos para validar fluxo.
    const fakeExternalId = `mock_${acc.data.provider}_${Date.now()}`;
    const fakeUrl = `https://example.com/${acc.data.provider}/${acc.data.account_handle ?? "post"}/${fakeExternalId}`;

    const upd = await supa.from("comm_social_publish_queue").update({
      status: "publicado",
      external_post_id: fakeExternalId,
      external_url: fakeUrl,
      published_at: new Date().toISOString(),
      attempts: (queueRow.attempts ?? 0) + 1,
    }).eq("id", queueRow.id).select().single();
    if (upd.error) throw upd.error;

    return new Response(JSON.stringify({ ok: true, queue: upd.data, mock: true, message: "Scaffold: integração real Meta/LinkedIn pendente" }), { headers: { ...cors, "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: (e as Error).message }), { status: 500, headers: { ...cors, "Content-Type": "application/json" } });
  }
});
