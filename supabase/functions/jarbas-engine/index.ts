import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/reflection@v0.1.1/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { transcript, context, history } = await req.json();

    // Aqui integraríamos com OpenAI/Anthropic
    // Por enquanto, usaremos uma lógica de resposta avançada simulada 
    // que será substituída por chamadas reais de LLM se as chaves estiverem disponíveis.

    let responseText = "";
    let action = null;
    let type = "info";

    const cmd = transcript.toLowerCase();

    // Motor de Contexto & Orquestração
    if (cmd.includes("status") || cmd.includes("onde estou")) {
      responseText = `Você está no módulo ${context.current_module || 'Principal'}. `;
      if (context.active_os_id) {
        responseText += `Com a Ordem de Serviço ${context.active_os_id} ativa na etapa ${context.current_step_index + 1}.`;
      } else {
        responseText += "Não há ordens de serviço ativas no momento.";
      }
    } 
    
    // Motor de Segurança
    else if (cmd.includes("iniciar") || cmd.includes("começar")) {
      responseText = "Entendido. Antes de prosseguirmos, o Motor de Segurança OCS exige a validação dos EPIs. Você está utilizando capacete e luvas adequadas para esta operação?";
      type = "alert";
      action = { type: "require_confirmation", field: "epi_validation" };
    }

    // Memória Operacional
    else if (cmd.includes("continuar")) {
      responseText = "Recuperando memória operacional... Você parou na etapa de testes de continuidade ontem às 17h. Deseja retomar exatamente de onde parou?";
      action = { type: "resume_workflow" };
    }

    // Ações do ERP
    else if (cmd.includes("abrir") && cmd.includes("financeiro")) {
      responseText = "Abrindo módulo Financeiro OCS. Deseja que eu resuma as pendências de hoje?";
      action = { type: "navigate", path: "/financeiro" };
    }

    else {
      responseText = "Comando processado pelo Motor Jarbas. Como posso auxiliar na sua operação técnica?";
    }

    return new Response(
      JSON.stringify({ 
        text: responseText, 
        action, 
        type,
        context_update: { last_interaction: new Date().toISOString() }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
