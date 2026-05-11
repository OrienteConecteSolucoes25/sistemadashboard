import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const MODEL = "google/gemini-2.5-flash";
const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

const COLUMNS: Record<string, string[]> = {
  relatorio_crea: [
    "ART","Tipo","Participação Técnica","Forma de Registro","Pagamento","Taxa Paga",
    "Cadastro","Observação","Contratante","CNPJ Contratante","Proprietário","CNPJ Proprietário",
    "Número","Valor do Contrato","Data Início","Data Fim","Endereços","Atividades","Nível",
    "Atividade Subordinada","Atividade/Serviço","Quantidade","Unidade de Medida",
  ],
  art_bloco: [
    "Nº ART","Valor ART","Valor Pago","Responsável Técnico","Título Profissional","RNP","Registro",
    "Contratante","CPF/CNPJ Contratante","Endereço Contrato","Endereço Obra","Contrato","Celebrado em",
    "Valor Contrato","Tipo Contratante","Ação Institucional","Situação","Atendido",
    "Data Solicitação","Data Atendimento","Motivo","Data Início","Previsão Término",
    "Coordenadas","Código","CPF/CNPJ Proprietário","Finalidade","Proprietário",
    "Atos Tec. Números","Atos Tec. Quantidade","Atos Tec. Unidade","Atos Tec. Descrição",
    "Observações","Declarações","Entidade de Classe","Assinaturas","Informações",
  ],
  servicos: [
    "Numero","Detalhe","Análise","Baixa","Boleto","Pagamento","Cadastro","Empresa","Contratante","Endereço","Observação",
  ],
};

function toCsv(rows: any[], headers: string[]): string {
  const esc = (v: any) => {
    const s = v == null ? "" : String(v);
    return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const out = [headers.map(esc).join(",")];
  rows.forEach((r) => out.push(headers.map((h) => esc(r[h])).join(",")));
  return out.join("\n");
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { fileBase64, mime, modelo, fileName } = await req.json();
    if (!fileBase64 || !modelo || !COLUMNS[modelo]) {
      return new Response(JSON.stringify({ error: "fileBase64 e modelo válido são obrigatórios" }), {
        status: 400, headers: { ...corsHeaders, "content-type": "application/json" },
      });
    }
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "LOVABLE_API_KEY não configurada" }), {
        status: 500, headers: { ...corsHeaders, "content-type": "application/json" },
      });
    }

    const headers = COLUMNS[modelo];
    const sysPrompt = `Você é um extrator de dados de documentos do CREA. Receberá um documento (PDF, Word ou imagem) e deverá extrair TODOS os registros encontrados, retornando um JSON com a chave "rows" contendo um array de objetos. Cada objeto deve ter EXATAMENTE estas chaves (use string vazia se não encontrar): ${JSON.stringify(headers)}. Retorne APENAS o JSON, sem markdown, sem comentários.`;

    const dataUrl = `data:${mime || "application/pdf"};base64,${fileBase64}`;

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${LOVABLE_API_KEY}` },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: "system", content: sysPrompt },
          { role: "user", content: [
            { type: "text", text: `Extraia todos os registros do documento "${fileName ?? "arquivo"}".` },
            { type: "image_url", image_url: { url: dataUrl } },
          ]},
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (!aiRes.ok) {
      const txt = await aiRes.text();
      return new Response(JSON.stringify({ error: `AI gateway: ${aiRes.status} ${txt}` }), {
        status: 502, headers: { ...corsHeaders, "content-type": "application/json" },
      });
    }

    const aiJson = await aiRes.json();
    const content = aiJson?.choices?.[0]?.message?.content ?? "{}";
    let parsed: any = {};
    try { parsed = typeof content === "string" ? JSON.parse(content) : content; }
    catch { parsed = { rows: [] }; }
    const rows: any[] = Array.isArray(parsed?.rows) ? parsed.rows : Array.isArray(parsed) ? parsed : [];

    const csv = toCsv(rows, headers);
    return new Response(JSON.stringify({ ok: true, rowCount: rows.length, headers, rows, csv }), {
      headers: { ...corsHeaders, "content-type": "application/json" },
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e?.message ?? String(e) }), {
      status: 500, headers: { ...corsHeaders, "content-type": "application/json" },
    });
  }
});
