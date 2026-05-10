import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON = Deno.env.get("SUPABASE_ANON_KEY")!;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { conversation_id, module_key, message } = await req.json();
    const authHeader = req.headers.get("Authorization")!;
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthorized");

    // 1. Carregar histórico da conversa
    const { data: history } = await supabase
      .from("pixel_agent_messages")
      .select("role, content")
      .eq("conversation_id", conversation_id)
      .order("created_at", { ascending: true });

    const messages = (history || []).map(m => ({
      role: m.role,
      content: m.content
    }));

    // 2. Definir System Prompt baseado no módulo
    let systemPrompt = "";
    if (module_key === "engenharia") {
      systemPrompt = "Você é o **Engenheiro OCS**. Especialista em obras, projetos, suprimentos e sites. Seu tom é técnico, porém acessível. Você ajuda a gerenciar pendências, acompanhar cronogramas e otimizar recursos na Engenharia.";
    } else if (module_key === "juridico") {
      systemPrompt = "Você é o **Consultor Jurídico OCS**. Especialista em processos, prazos, contratos e governança. Seu tom é formal, preciso e seguro. Você ajuda a mitigar riscos e organizar a vida jurídica da empresa.";
    } else if (module_key === "rhdp") {
      systemPrompt = "Você é a **Diretora de RH/DP OCS**. Especialista em gestão de pessoas, benefícios, folha e clima organizacional. Seu tom é empático, profissional e acolhedor.";
    } else if (module_key === "crea") {
      systemPrompt = "Você é o **Analista de CREA/ART OCS**. Especialista em conformidade técnica, registros de ART, gatos e normas do conselho. Seu tom é detalhista e orientativo.";
    } else {
      systemPrompt = "Você é um especialista do ecossistema OCS. Ajude o usuário com o módulo solicitado.";
    }

    // 3. Chamar a API da Lovable (AI Gateway)
    const response = await fetch("https://api.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
          { role: "user", content: message }
        ],
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error("Lovable API error:", err);
      throw new Error("Erro ao chamar a inteligência artificial.");
    }

    const aiData = await response.json();
    const reply = aiData.choices[0].message.content;

    return new Response(JSON.stringify({ reply }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
