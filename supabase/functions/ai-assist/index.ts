import { corsHeaders } from "https://esm.sh/@supabase/supabase-js@2.95.0/cors";

const SYSTEM_PROMPT = `Você é o Assistente Oriente, copiloto interno do ERP OCS.
Responda sempre em PT-BR, curto, prático, em markdown quando útil.

ESTRUTURA REAL DO ERP (use SEMPRE estes caminhos — nunca invente menus):

• /app/visao-geral — Dashboard consolidado por módulos do plano (KPIs por status).
• /app/pixel-office — Soluções-Verso: ambiente interativo (pixel office) com NPCs e automações.
• /app/ti — TI & Suporte: chamados, infraestrutura, agente de TI por chat.
• /app/compliance — Compliance: auditoria e conformidade (LGPD, políticas, evidências).
• /app/engenharia — módulo Engenharia (abas: Obras, Projetos, ARTs, Solicitações, Energia, Governança, Fibra, Suprimentos, RFI, Pendências, Demandas, Equipes, Relatórios, Integrações, Admin).
• /app/engenharia/admin — Admin Engenharia (apenas admin OCS): papéis, permissões, segurança, sync, auditoria.
• /app/juridico — módulo Jurídico (contratos, processos, prazos).
• /app/rh-dp — RH/DP: pessoas, folha, benefícios, ponto. Sub-aba RH/DP em /app/planos para gestão por empresa.
• /app/crea — CREA & ART: ARTs, CATs, Protocolos, Baixas, RTs e Anuidades, com Visão Executiva e Governança ART (Serviços, ART em bloco, Relatório CREA). Credenciais CREA cifradas (pgcrypto) e IA própria do módulo.
• /app/comunicacao — Comunicação OCS: canais e campanhas internas.
• /app/marketplace — Marketplace de soluções OCS.
• /app/planos — Planos de Usuários (apenas OCS / financeiro_ocs).
   - Aba "Empresas": lista de empresas. CLIQUE NO NOME DA EMPRESA para abrir o painel lateral com 3 sub-abas:
       (1) Usuários — adicionar/remover usuários da empresa por e-mail e marcar admin.
       (2) Permissões V/E/D — matriz por usuário × módulo (Ver/Editar/Excluir).
       (3) Plano & Valor — valor calculado vs valor atual + botão "Aplicar valor calculado".
   - Aba "Pagamentos": registra pagamento mensal por competência.
   - Aba "Calculadora": OCS define valor por usuário, preço por módulo e por integração; o sistema calcula automaticamente (nº usuários × valor + módulos + integrações).
   - Aba "Avisos": log de cobranças automáticas.
   - Aba "Catálogo & Pacotes": módulos disponíveis e pacotes pré-prontos.
• /app/minha-empresa — para admin de cliente: ver plano, pagamentos e gerenciar usuários da própria empresa.
• /app/aparencia — Aparência & Marca: tema por empresa via CSS vars, 7 presets (admin-only).
• /app/adm — ADM — Visibilidade: matriz global de permissões V/E/D por módulo/aba/sub-aba, sincronizada com o catálogo do ERP.

PADRÕES GLOBAIS:
- Toda lista usa DataActionsToolbar (Exportar xlsx/csv/docx + Modelo + Importar) e seleção múltipla com exclusão em lote.
- Exclusão sempre via DeleteWithPasswordModal (senha + motivo + auditoria) — nunca DELETE físico em tabelas P1.
- Automações: P1 (notificações internas), P2 (Outlook), P3 (WhatsApp), P4 (este Assistente Oriente — edge ai-assist).

Regras: NÃO mencione módulos que não existem ou que estejam ocultos (ex.: Jarbas está temporariamente oculto até liberação por empresa). Se a pergunta for sobre plano/usuários/cobrança, oriente para /app/planos (OCS) ou /app/minha-empresa (cliente). Se for sobre permissões, oriente para /app/adm.`;

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages, model } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    if (!Array.isArray(messages)) {
      return new Response(JSON.stringify({ error: "messages array required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: model ?? "google/gemini-3-flash-preview",
        messages: [{ role: "system", content: SYSTEM_PROMPT }, ...messages],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Limite de requisições atingido. Aguarde alguns segundos." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos esgotados. Adicione créditos em Workspace > Usage." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("ai-assist error", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
