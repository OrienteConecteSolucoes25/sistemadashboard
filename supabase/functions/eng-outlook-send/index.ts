// Envia email via conector Microsoft Outlook
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const GATEWAY_URL = "https://connector-gateway.lovable.dev/microsoft_outlook";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const { to, cc, subject, html } = await req.json();
    if (!to || !subject) {
      return new Response(JSON.stringify({ ok: false, error: "to/subject required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const toList = (Array.isArray(to) ? to : [to]).filter(Boolean);
    const ccList = (Array.isArray(cc) ? cc : cc ? [cc] : []).filter(Boolean);

    const r = await fetch(`${GATEWAY_URL}/me/sendMail`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: {
          subject,
          body: { contentType: "HTML", content: html || "" },
          toRecipients: toList.map((a: string) => ({ emailAddress: { address: a } })),
          ccRecipients: ccList.map((a: string) => ({ emailAddress: { address: a } })),
        },
      }),
    });
    if (!r.ok) {
      const txt = await r.text();
      return new Response(JSON.stringify({ ok: false, error: txt }), {
        status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: String(e) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
