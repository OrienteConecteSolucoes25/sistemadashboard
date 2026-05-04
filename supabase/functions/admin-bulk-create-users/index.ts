import { createClient } from "jsr:@supabase/supabase-js@2";
import { corsHeaders } from "jsr:@supabase/supabase-js@2/cors";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    const url = Deno.env.get("SUPABASE_URL")!;
    const anon = Deno.env.get("SUPABASE_PUBLISHABLE_KEY") ?? Deno.env.get("SUPABASE_ANON_KEY")!;
    const service = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const userClient = createClient(url, anon, { global: { headers: { Authorization: authHeader } } });
    const { data: u } = await userClient.auth.getUser();
    if (!u?.user) return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const admin = createClient(url, service);
    const { data: roles } = await admin.from("user_roles").select("role").eq("user_id", u.user.id);
    if (!roles?.some((r: any) => r.role === "admin")) {
      return new Response(JSON.stringify({ error: "forbidden" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const body = await req.json();
    const users: Array<{ email: string; full_name: string; password?: string }> = body.users ?? [];
    const defaultPassword: string = body.defaultPassword ?? "Oriente@2026";

    const results: any[] = [];
    for (const usr of users) {
      const email = usr.email?.trim().toLowerCase();
      if (!email) { results.push({ email, ok: false, error: "missing email" }); continue; }
      const { data, error } = await admin.auth.admin.createUser({
        email,
        password: usr.password ?? defaultPassword,
        email_confirm: true,
        user_metadata: { full_name: usr.full_name ?? email },
      });
      if (error) {
        results.push({ email, ok: false, error: error.message });
      } else {
        results.push({ email, ok: true, id: data.user?.id });
      }
    }
    return new Response(JSON.stringify({ results, defaultPassword }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
