import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useComunicacaoAccess } from "../hooks/useComunicacaoAccess";
import { commAi, commImageGen, commSoftDelete } from "../lib/api";
import { Sparkles, Trash2, Plus, Save, ExternalLink, Copy, ImageIcon, RefreshCcw } from "lucide-react";
import { Link } from "react-router-dom";
import { ApprovalPanel } from "./ApprovalPanel";
import { useActiveBrandKit } from "../hooks/useActiveBrandKit";

// ========== HELPERS ==========
async function loadBrands(companyId: string | null) {
  if (!companyId) return [];
  const { data } = await supabase.from("comm_brand_kits").select("*").eq("company_id", companyId).eq("is_deleted", false).order("created_at", { ascending: false });
  return data ?? [];
}

function StatusBadge({ s }: { s: string }) {
  const map: any = {
    rascunho: "secondary", rascunho_ia: "secondary", em_revisao: "default", em_edicao: "default",
    ajustes: "destructive", aprovado: "default", publicado: "default", arquivado: "outline",
    em_canva: "default", exportado: "default", planejado: "outline", planejada: "outline", ativa: "default",
  };
  return <Badge variant={map[s] ?? "secondary"}>{(s || "").replace(/_/g, " ")}</Badge>;
}

// ========== BRAND KITS ==========
export function BrandKitsPage() {
  const { companyId } = useComunicacaoAccess();
  const [items, setItems] = useState<any[]>([]);
  const [edit, setEdit] = useState<any | null>(null);
  const { toast } = useToast();

  async function load() { setItems(await loadBrands(companyId)); }
  useEffect(() => { load(); }, [companyId]);

  function newKit() {
    setEdit({
      company_id: companyId, nome: "Nova marca", slogan: "", descricao: "", publico_alvo: "", persona: "",
      tom_de_voz: "profissional, próximo", proposta_valor: "", diferenciais: "", cta_padrao: "",
      palavras_permitidas: [], palavras_proibidas: [], cores_principais: ["#2BBDC0", "#1a1f26"],
      cores_secundarias: ["#ffffff"], fontes: ["Rajdhani", "Inter"], estilo_visual: "limpo, geométrico",
      tipo_linguagem: "direta", links: {}, redes_sociais: {},
    });
  }

  async function save() {
    const e = { ...edit };
    if (typeof e.palavras_permitidas === "string") e.palavras_permitidas = e.palavras_permitidas.split(",").map((s: string) => s.trim()).filter(Boolean);
    if (typeof e.palavras_proibidas === "string") e.palavras_proibidas = e.palavras_proibidas.split(",").map((s: string) => s.trim()).filter(Boolean);
    if (typeof e.cores_principais === "string") e.cores_principais = e.cores_principais.split(",").map((s: string) => s.trim()).filter(Boolean);
    if (typeof e.cores_secundarias === "string") e.cores_secundarias = e.cores_secundarias.split(",").map((s: string) => s.trim()).filter(Boolean);
    if (typeof e.fontes === "string") e.fontes = e.fontes.split(",").map((s: string) => s.trim()).filter(Boolean);
    const { error } = e.id
      ? await supabase.from("comm_brand_kits").update(e).eq("id", e.id)
      : await supabase.from("comm_brand_kits").insert(e);
    if (error) return toast({ title: "Erro ao salvar", description: error.message, variant: "destructive" });
    toast({ title: "Brand Kit salvo" }); setEdit(null); load();
  }

  async function remove(id: string) {
    const reason = window.prompt("Motivo da exclusão:");
    if (!reason) return;
    await commSoftDelete("comm_brand_kits", id, reason);
    load();
  }

  if (edit) {
    return (
      <div className="space-y-3 max-w-4xl">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-display font-bold">{edit.id ? "Editar cliente / marca" : "Novo cliente / marca"}</h2>
          <Button variant="outline" size="sm" onClick={() => setEdit(null)}>Voltar</Button>
        </div>
        <Tabs defaultValue="identidade">
          <TabsList>
            <TabsTrigger value="identidade">Identidade</TabsTrigger>
            <TabsTrigger value="institucional">Institucional</TabsTrigger>
            <TabsTrigger value="voz">Voz & Mensagem</TabsTrigger>
            <TabsTrigger value="visual">Visual</TabsTrigger>
            <TabsTrigger value="links">Links & Redes</TabsTrigger>
          </TabsList>

          <TabsContent value="identidade" className="space-y-3 pt-3">
            <Card className="p-4 space-y-3">
              {[["nome", "Nome do cliente / marca *"], ["slogan", "Slogan"], ["segmento", "Segmento de mercado"], ["website", "Website"], ["descricao", "Sobre a empresa / marca"]].map(([k, label]) => (
                <div key={k}>
                  <Label>{label}</Label>
                  {k === "descricao"
                    ? <Textarea rows={4} value={edit[k] ?? ""} onChange={(e) => setEdit({ ...edit, [k]: e.target.value })} />
                    : <Input value={edit[k] ?? ""} onChange={(e) => setEdit({ ...edit, [k]: e.target.value })} />}
                </div>
              ))}
            </Card>
          </TabsContent>

          <TabsContent value="institucional" className="space-y-3 pt-3">
            <Card className="p-4 space-y-3">
              {[["missao", "Missão"], ["visao", "Visão"], ["valores", "Valores"], ["proposta_valor", "Proposta de valor"], ["diferenciais", "Diferenciais competitivos"]].map(([k, label]) => (
                <div key={k}><Label>{label}</Label><Textarea rows={3} value={edit[k] ?? ""} onChange={(e) => setEdit({ ...edit, [k]: e.target.value })} /></div>
              ))}
            </Card>
          </TabsContent>

          <TabsContent value="voz" className="space-y-3 pt-3">
            <Card className="p-4 space-y-3">
              {[["publico_alvo", "Público-alvo"], ["persona", "Persona principal"], ["tom_de_voz", "Tom de voz"], ["tipo_linguagem", "Tipo de linguagem"], ["cta_padrao", "CTA padrão"]].map(([k, label]) => (
                <div key={k}><Label>{label}</Label>
                  {["publico_alvo", "persona"].includes(k as string)
                    ? <Textarea rows={2} value={edit[k] ?? ""} onChange={(e) => setEdit({ ...edit, [k]: e.target.value })} />
                    : <Input value={edit[k] ?? ""} onChange={(e) => setEdit({ ...edit, [k]: e.target.value })} />}
                </div>
              ))}
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Palavras permitidas (CSV)</Label><Input value={Array.isArray(edit.palavras_permitidas) ? edit.palavras_permitidas.join(", ") : edit.palavras_permitidas ?? ""} onChange={(e) => setEdit({ ...edit, palavras_permitidas: e.target.value })} /></div>
                <div><Label>Palavras proibidas (CSV)</Label><Input value={Array.isArray(edit.palavras_proibidas) ? edit.palavras_proibidas.join(", ") : edit.palavras_proibidas ?? ""} onChange={(e) => setEdit({ ...edit, palavras_proibidas: e.target.value })} /></div>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="visual" className="space-y-3 pt-3">
            <Card className="p-4 space-y-3">
              <div><Label>Estilo visual</Label><Input value={edit.estilo_visual ?? ""} onChange={(e) => setEdit({ ...edit, estilo_visual: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Cores principais (CSV)</Label><Input value={Array.isArray(edit.cores_principais) ? edit.cores_principais.join(", ") : edit.cores_principais ?? ""} onChange={(e) => setEdit({ ...edit, cores_principais: e.target.value })} /></div>
                <div><Label>Cores secundárias (CSV)</Label><Input value={Array.isArray(edit.cores_secundarias) ? edit.cores_secundarias.join(", ") : edit.cores_secundarias ?? ""} onChange={(e) => setEdit({ ...edit, cores_secundarias: e.target.value })} /></div>
                <div className="col-span-2"><Label>Fontes (CSV)</Label><Input value={Array.isArray(edit.fontes) ? edit.fontes.join(", ") : edit.fontes ?? ""} onChange={(e) => setEdit({ ...edit, fontes: e.target.value })} /></div>
              </div>
              <div><Label>Logo (URL)</Label><Input value={edit.logo_url ?? ""} onChange={(e) => setEdit({ ...edit, logo_url: e.target.value })} placeholder="https://..." /></div>
            </Card>
          </TabsContent>

          <TabsContent value="links" className="space-y-3 pt-3">
            <Card className="p-4 space-y-3">
              <div><Label>Observações livres</Label><Textarea rows={4} value={edit.observacoes ?? ""} onChange={(e) => setEdit({ ...edit, observacoes: e.target.value })} /></div>
              <div className="text-xs text-muted-foreground">Redes sociais e links serão expandidos em breve. Por ora, registre URLs nas observações.</div>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex gap-2 sticky bottom-0 bg-background py-2 border-t">
          <Button onClick={save}><Save className="w-4 h-4 mr-1" />Salvar cliente</Button>
          <Button variant="outline" onClick={() => setEdit(null)}>Cancelar</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-display font-bold">Clientes & Marcas</h2>
          <p className="text-xs text-muted-foreground">Cada cliente / marca tem seu próprio Brand Kit, paleta, tom de voz e regras. Útil para social media multi-marca.</p>
        </div>
        <Button onClick={newKit}><Plus className="w-4 h-4 mr-1" />Novo cliente / marca</Button>
      </div>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
        {items.map((b) => (
          <Card key={b.id} className="p-4 space-y-2 hover:border-primary/40 transition">
            <div className="flex justify-between items-start gap-2">
              <div className="flex items-center gap-2 min-w-0">
                {b.logo_url
                  ? <img src={b.logo_url} alt="" className="w-9 h-9 rounded object-cover border flex-shrink-0" />
                  : <div className="w-9 h-9 rounded border flex items-center justify-center bg-muted flex-shrink-0 text-xs font-bold">{(b.nome ?? "?").slice(0, 2).toUpperCase()}</div>}
                <div className="min-w-0">
                  <div className="font-bold truncate">{b.nome}</div>
                  {b.segmento && <div className="text-[10px] uppercase text-muted-foreground">{b.segmento}</div>}
                </div>
              </div>
              <Button size="icon" variant="ghost" onClick={() => remove(b.id)}><Trash2 className="w-4 h-4" /></Button>
            </div>
            {b.slogan && <div className="text-xs italic text-muted-foreground">"{b.slogan}"</div>}
            <div className="text-sm line-clamp-3 min-h-[2.5em]">{b.descricao}</div>
            <div className="flex gap-1 flex-wrap">
              {(b.cores_principais ?? []).slice(0, 6).map((c: string, i: number) => <span key={i} style={{ background: c }} className="w-5 h-5 rounded border" />)}
            </div>
            <div className="text-xs text-muted-foreground line-clamp-1">Tom: {b.tom_de_voz || "—"}</div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" className="flex-1" onClick={() => setEdit(b)}>Editar</Button>
            </div>
          </Card>
        ))}
        {items.length === 0 && <Card className="p-6 text-center text-muted-foreground col-span-full">Nenhum cliente cadastrado. Crie o primeiro!</Card>}
      </div>
    </div>
  );
}

// ========== GERADOR DE POSTS ==========
export function PostGeneratorPage() {
  const { companyId } = useComunicacaoAccess();
  const [brands, setBrands] = useState<any[]>([]);
  const [brandId, setBrandId] = useState<string>("");
  const [inputs, setInputs] = useState<any>({ canal: "Instagram", formato: "post único", objetivo: "", tema: "", publico: "", cta: "", palavras_chave: "", tom_de_voz: "" });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [imageLoading, setImageLoading] = useState(false);
  const [image, setImage] = useState<any>(null);
  const { toast } = useToast();

  useEffect(() => { loadBrands(companyId).then(setBrands); }, [companyId]);
  const brand = brands.find((b) => b.id === brandId);

  async function generate() {
    if (!companyId) return;
    setLoading(true); setResult(null); setImage(null);
    try {
      const r = await commAi({
        kind: "post", company_id: companyId, brand,
        inputs: { ...inputs, palavras_chave: inputs.palavras_chave.split(",").map((s: string) => s.trim()).filter(Boolean) },
      });
      setResult(r.data);
    } catch (e: any) { toast({ title: "Erro", description: e.message, variant: "destructive" }); }
    finally { setLoading(false); }
  }

  async function genImage() {
    if (!companyId || !result?.prompt_visual) return;
    setImageLoading(true);
    try {
      const r = await commImageGen({ company_id: companyId, brand_kit_id: brandId || undefined, prompt: result.prompt_visual, format: "1080x1080", model: "google/gemini-2.5-flash-image" });
      setImage(r.image); toast({ title: "Imagem gerada", description: "Status: rascunho — exige aprovação." });
    } catch (e: any) { toast({ title: "Erro IA imagem", description: e.message, variant: "destructive" }); }
    finally { setImageLoading(false); }
  }

  async function saveAsPost() {
    if (!companyId || !result) return;
    const payload: any = {
      company_id: companyId, brand_kit_id: brandId || null,
      titulo: result.titulo, tema: inputs.tema, objetivo: inputs.objetivo, publico: inputs.publico,
      canal: inputs.canal, formato: inputs.formato, tom_de_voz: inputs.tom_de_voz, cta: result.cta || inputs.cta,
      palavras_chave: inputs.palavras_chave.split(",").map((s: string) => s.trim()).filter(Boolean),
      legenda: result.legenda, texto_card: result.texto_card, hashtags: result.hashtags ?? [],
      descricao_alternativa: result.descricao_alternativa, briefing_visual: result.briefing_visual,
      prompt_visual: result.prompt_visual, status: "rascunho_ia", ai_generated: true, ai_prompt: JSON.stringify(inputs),
    };
    const { data, error } = await supabase.from("comm_content_posts").insert(payload).select().single();
    if (error) return toast({ title: "Erro", description: error.message, variant: "destructive" });
    if (image?.id) await supabase.from("comm_generated_images").update({ linked_post_id: data.id }).eq("id", image.id);
    if (Array.isArray(result.variacoes)) {
      await supabase.from("comm_content_variants").insert(result.variacoes.map((v: any, i: number) => ({ post_id: data.id, tipo: v.tipo ?? "variacao", conteudo: v.texto, ordem: i })));
    }
    toast({ title: "Post salvo como rascunho IA" });
  }

  function openCanva() {
    const txt = [result?.titulo, result?.legenda, "Hashtags: " + (result?.hashtags ?? []).join(" ")].filter(Boolean).join("\n\n");
    navigator.clipboard.writeText(txt).catch(() => {});
    const formatMap: any = { "post único": "InstagramPost", carrossel: "InstagramPost", reels: "InstagramReel", story: "InstagramStory", "LinkedIn post": "LinkedInPost" };
    const type = formatMap[inputs.formato] || "InstagramPost";
    window.open(`https://www.canva.com/design?create&type=${type}`, "_blank");
    toast({ title: "Canva aberto", description: "Briefing copiado para a área de transferência. Cole (Ctrl+V) no Canva." });
  }

  return (
    <div className="grid lg:grid-cols-2 gap-4">
      <Card className="p-4 space-y-3">
        <h2 className="text-xl font-display font-bold flex items-center gap-2"><Sparkles className="w-5 h-5 text-primary" />Gerador de Posts</h2>
        <div><Label>Brand Kit</Label>
          <Select value={brandId} onValueChange={setBrandId}>
            <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
            <SelectContent>{brands.map((b) => <SelectItem key={b.id} value={b.id}>{b.nome}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div><Label>Canal</Label>
            <Select value={inputs.canal} onValueChange={(v) => setInputs({ ...inputs, canal: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{["Instagram", "LinkedIn", "Facebook", "TikTok", "YouTube", "Blog", "WhatsApp", "E-mail"].map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div><Label>Formato</Label>
            <Select value={inputs.formato} onValueChange={(v) => setInputs({ ...inputs, formato: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{["post único", "carrossel", "reels", "story", "LinkedIn post", "artigo curto", "anúncio", "comunicado"].map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
            </Select>
          </div>
        </div>
        <div><Label>Tema</Label><Input value={inputs.tema} onChange={(e) => setInputs({ ...inputs, tema: e.target.value })} placeholder="Ex: lançamento do módulo CREA" /></div>
        <div><Label>Objetivo</Label><Input value={inputs.objetivo} onChange={(e) => setInputs({ ...inputs, objetivo: e.target.value })} placeholder="autoridade, leads, anúncio..." /></div>
        <div><Label>Público</Label><Input value={inputs.publico} onChange={(e) => setInputs({ ...inputs, publico: e.target.value })} /></div>
        <div><Label>Tom (opcional)</Label><Input value={inputs.tom_de_voz} onChange={(e) => setInputs({ ...inputs, tom_de_voz: e.target.value })} /></div>
        <div><Label>CTA</Label><Input value={inputs.cta} onChange={(e) => setInputs({ ...inputs, cta: e.target.value })} /></div>
        <div><Label>Palavras-chave (CSV)</Label><Input value={inputs.palavras_chave} onChange={(e) => setInputs({ ...inputs, palavras_chave: e.target.value })} /></div>
        <Button disabled={loading} onClick={generate}>{loading ? "Gerando..." : (<><Sparkles className="w-4 h-4 mr-1" />Gerar com IA</>)}</Button>
      </Card>

      <Card className="p-4 space-y-3">
        <div className="font-bold flex items-center justify-between">Resultado {result && <Button size="sm" variant="ghost" onClick={generate}><RefreshCcw className="w-4 h-4" /></Button>}</div>
        {!result && <div className="text-sm text-muted-foreground">Configure e clique em "Gerar com IA". Tudo nasce como rascunho IA — exige aprovação humana.</div>}
        {result && (
          <div className="space-y-3 text-sm">
            {result.titulo && <div><div className="font-semibold text-xs uppercase text-muted-foreground">Título</div><div>{result.titulo}</div></div>}
            {result.legenda && <div><div className="font-semibold text-xs uppercase text-muted-foreground">Legenda</div><Textarea value={result.legenda} onChange={(e) => setResult({ ...result, legenda: e.target.value })} rows={6} /></div>}
            {result.texto_card && <div><div className="font-semibold text-xs uppercase text-muted-foreground">Texto card</div><div className="p-2 bg-muted rounded">{result.texto_card}</div></div>}
            {result.hashtags?.length > 0 && <div className="text-xs">{result.hashtags.map((h: string) => <Badge key={h} variant="outline" className="mr-1">#{h.replace(/^#/, "")}</Badge>)}</div>}
            {result.cta && <div className="text-xs"><b>CTA:</b> {result.cta}</div>}
            {result.briefing_visual && <div><div className="font-semibold text-xs uppercase text-muted-foreground">Briefing visual</div><div className="p-2 bg-muted rounded text-xs">{result.briefing_visual}</div></div>}
            {result.prompt_visual && <div><div className="font-semibold text-xs uppercase text-muted-foreground">Prompt para imagem</div><div className="p-2 bg-muted rounded text-xs">{result.prompt_visual}</div></div>}
            {image && <div><img src={image.public_url} alt="" className="rounded border max-w-full" /><div className="text-[10px] text-muted-foreground mt-1">Status: {image.approval_status}</div></div>}
            <div className="flex flex-wrap gap-2">
              <Button size="sm" onClick={saveAsPost}><Save className="w-4 h-4 mr-1" />Salvar rascunho</Button>
              {result.prompt_visual && <Button size="sm" variant="outline" disabled={imageLoading} onClick={genImage}><ImageIcon className="w-4 h-4 mr-1" />{imageLoading ? "Gerando..." : "Gerar imagem IA"}</Button>}
              <Button size="sm" variant="outline" onClick={openCanva}><ExternalLink className="w-4 h-4 mr-1" />Abrir no Canva</Button>
              <Button size="sm" variant="ghost" onClick={() => navigator.clipboard.writeText(JSON.stringify(result, null, 2))}><Copy className="w-4 h-4 mr-1" />Copiar JSON</Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}

// ========== GERADOR LEGENDAS ==========
export function LegendaGeneratorPage() {
  const { companyId } = useComunicacaoAccess();
  const [brands, setBrands] = useState<any[]>([]);
  const [brandId, setBrandId] = useState<string>("");
  const [inputs, setInputs] = useState<any>({ tema: "", canal: "Instagram", objetivo: "engajamento", publico: "", tamanho: "médio", cta: "", emojis: false, hashtags: true });
  const [r, setR] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  useEffect(() => { loadBrands(companyId).then(setBrands); }, [companyId]);

  async function gen() {
    if (!companyId) return;
    setLoading(true);
    try { const x = await commAi({ kind: "legenda", company_id: companyId, brand: brands.find((b) => b.id === brandId), inputs }); setR(x.data); }
    catch (e: any) { toast({ title: "Erro", description: e.message, variant: "destructive" }); }
    finally { setLoading(false); }
  }

  return (
    <div className="grid lg:grid-cols-2 gap-4">
      <Card className="p-4 space-y-3">
        <h2 className="text-xl font-display font-bold">Gerador de Legendas</h2>
        <Select value={brandId} onValueChange={setBrandId}><SelectTrigger><SelectValue placeholder="Brand Kit" /></SelectTrigger>
          <SelectContent>{brands.map((b) => <SelectItem key={b.id} value={b.id}>{b.nome}</SelectItem>)}</SelectContent></Select>
        <Input placeholder="Tema" value={inputs.tema} onChange={(e) => setInputs({ ...inputs, tema: e.target.value })} />
        <div className="grid grid-cols-2 gap-2">
          <Input placeholder="Canal" value={inputs.canal} onChange={(e) => setInputs({ ...inputs, canal: e.target.value })} />
          <Input placeholder="Objetivo" value={inputs.objetivo} onChange={(e) => setInputs({ ...inputs, objetivo: e.target.value })} />
        </div>
        <Input placeholder="Público" value={inputs.publico} onChange={(e) => setInputs({ ...inputs, publico: e.target.value })} />
        <Input placeholder="CTA" value={inputs.cta} onChange={(e) => setInputs({ ...inputs, cta: e.target.value })} />
        <div className="flex gap-3 text-sm"><label><input type="checkbox" checked={inputs.emojis} onChange={(e) => setInputs({ ...inputs, emojis: e.target.checked })} /> Emojis</label>
          <label><input type="checkbox" checked={inputs.hashtags} onChange={(e) => setInputs({ ...inputs, hashtags: e.target.checked })} /> Hashtags</label></div>
        <Button onClick={gen} disabled={loading}>{loading ? "Gerando..." : "Gerar"}</Button>
      </Card>
      <Card className="p-4 space-y-2 text-sm">
        {!r && <div className="text-muted-foreground">Resultado aparecerá aqui.</div>}
        {r && <>
          {r.principal && <div><b>Principal:</b><Textarea value={r.principal} readOnly rows={4} /></div>}
          {Array.isArray(r.variacoes) && r.variacoes.map((v: string, i: number) => <div key={i}><b>Variação {i + 1}:</b><Textarea value={v} readOnly rows={3} /></div>)}
          {r.curta && <div><b>Curta:</b> {r.curta}</div>}
          {r.storytelling && <div><b>Storytelling:</b> {r.storytelling}</div>}
          {r.hashtags?.length > 0 && <div>{r.hashtags.map((h: string) => <Badge key={h} variant="outline" className="mr-1">#{h.replace(/^#/, "")}</Badge>)}</div>}
        </>}
      </Card>
    </div>
  );
}

// ========== GERADOR TEXTOS ==========
export function TextoGeneratorPage() {
  const { companyId } = useComunicacaoAccess();
  const [brands, setBrands] = useState<any[]>([]);
  const [brandId, setBrandId] = useState("");
  const [inputs, setInputs] = useState<any>({ tipo: "institucional", tema: "", objetivo: "", tamanho: "médio", palavras_obrigatorias: "" });
  const [r, setR] = useState<any>(null); const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  useEffect(() => { loadBrands(companyId).then(setBrands); }, [companyId]);

  return (
    <div className="grid lg:grid-cols-2 gap-4">
      <Card className="p-4 space-y-3">
        <h2 className="text-xl font-display font-bold">Gerador de Textos</h2>
        <Select value={brandId} onValueChange={setBrandId}><SelectTrigger><SelectValue placeholder="Brand Kit" /></SelectTrigger>
          <SelectContent>{brands.map((b) => <SelectItem key={b.id} value={b.id}>{b.nome}</SelectItem>)}</SelectContent></Select>
        <Select value={inputs.tipo} onValueChange={(v) => setInputs({ ...inputs, tipo: v })}><SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>{["institucional", "comercial", "site", "landing page", "e-mail", "newsletter", "comunicado interno", "apresentação", "produto", "campanha", "lista de espera", "roteiro de vídeo", "briefing técnico"].map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent></Select>
        <Input placeholder="Tema" value={inputs.tema} onChange={(e) => setInputs({ ...inputs, tema: e.target.value })} />
        <Input placeholder="Objetivo" value={inputs.objetivo} onChange={(e) => setInputs({ ...inputs, objetivo: e.target.value })} />
        <Select value={inputs.tamanho} onValueChange={(v) => setInputs({ ...inputs, tamanho: v })}><SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>{["curto", "médio", "longo"].map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent></Select>
        <Input placeholder="Palavras obrigatórias (CSV)" value={inputs.palavras_obrigatorias} onChange={(e) => setInputs({ ...inputs, palavras_obrigatorias: e.target.value })} />
        <Button disabled={loading} onClick={async () => {
          if (!companyId) return; setLoading(true);
          try { const x = await commAi({ kind: "texto", company_id: companyId, brand: brands.find((b) => b.id === brandId), inputs: { ...inputs, palavras_obrigatorias: inputs.palavras_obrigatorias.split(",").map((s: string) => s.trim()).filter(Boolean) } }); setR(x.data); }
          catch (e: any) { toast({ title: "Erro", description: e.message, variant: "destructive" }); }
          finally { setLoading(false); }
        }}>{loading ? "Gerando..." : "Gerar"}</Button>
      </Card>
      <Card className="p-4 space-y-2">
        {!r && <div className="text-sm text-muted-foreground">Resultado aparecerá aqui.</div>}
        {r && <>
          {r.titulo && <div className="font-bold">{r.titulo}</div>}
          {r.texto && <Textarea value={r.texto} readOnly rows={20} />}
          {r.cta && <div className="text-sm"><b>CTA:</b> {r.cta}</div>}
        </>}
      </Card>
    </div>
  );
}

// ========== POSTS LIST ==========
export function PostsListPage() {
  const { companyId } = useComunicacaoAccess();
  const [items, setItems] = useState<any[]>([]);
  const [openId, setOpenId] = useState<string | null>(null);
  async function load() {
    if (!companyId) return;
    const { data } = await supabase.from("comm_content_posts").select("*").eq("company_id", companyId).eq("is_deleted", false).order("created_at", { ascending: false }).limit(100);
    setItems(data ?? []);
  }
  useEffect(() => { load(); }, [companyId]);

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-display font-bold">Posts</h2>
        <Link to="/app/comunicacao/posts"><Button><Plus className="w-4 h-4 mr-1" />Gerar novo</Button></Link>
      </div>
      <div className="grid gap-2">
        {items.map((p) => (
          <Card key={p.id} className="p-3">
            <div className="flex items-start gap-3">
              <div className="flex-1">
                <div className="flex items-center gap-2"><div className="font-medium">{p.titulo || p.tema || "(sem título)"}</div><StatusBadge s={p.status} /></div>
                <div className="text-xs text-muted-foreground">{p.canal} · {p.formato} · {p.data_planejada || "sem data"}</div>
                <div className="text-sm line-clamp-2 mt-1">{p.legenda}</div>
              </div>
              <div className="flex flex-col gap-1">
                <Button size="sm" variant="outline" onClick={() => setOpenId(openId === p.id ? null : p.id)}>{openId === p.id ? "Fechar" : "Workflow"}</Button>
                <Button size="icon" variant="ghost" onClick={async () => { const r = window.prompt("Motivo:"); if (r) { await commSoftDelete("comm_content_posts", p.id, r); load(); } }}><Trash2 className="w-4 h-4" /></Button>
              </div>
            </div>
            {openId === p.id && (
              <div className="mt-3 border-t pt-3">
                <ApprovalPanel entidadeTipo="comm_content_posts" entidadeId={p.id} status={p.status} onChanged={load} compact />
              </div>
            )}
          </Card>
        ))}
        {items.length === 0 && <Card className="p-6 text-center text-muted-foreground">Nenhum post ainda.</Card>}
      </div>
    </div>
  );
}

// ========== APROVAÇÕES (fila de itens em revisão) ==========
const APPROV_ENTITIES: { table: string; label: string; titleField: string }[] = [
  { table: "comm_content_posts", label: "Post", titleField: "titulo" },
  { table: "comm_carousels", label: "Carrossel", titleField: "titulo" },
  { table: "comm_newsletters", label: "Newsletter", titleField: "assunto" },
  { table: "comm_internal_comms", label: "Comunicado", titleField: "titulo" },
  { table: "comm_campaigns", label: "Campanha", titleField: "nome" },
  { table: "comm_generated_designs", label: "Design", titleField: "nome" },
];

export function AprovacoesPage() {
  const { companyId } = useComunicacaoAccess();
  const [pending, setPending] = useState<any[]>([]);
  const [filter, setFilter] = useState<string>("em_revisao");

  async function load() {
    if (!companyId) return;
    const all: any[] = [];
    for (const e of APPROV_ENTITIES) {
      const q = supabase.from(e.table as any).select("*").eq("company_id", companyId).eq("is_deleted", false);
      const { data } = filter === "all" ? await q.limit(50) : await q.eq("status", filter).limit(50);
      (data ?? []).forEach((r: any) => all.push({ ...r, _table: e.table, _label: e.label, _title: r[e.titleField] || r.titulo || r.nome || r.assunto || "(sem título)" }));
    }
    all.sort((a, b) => (b.updated_at || b.created_at).localeCompare(a.updated_at || a.created_at));
    setPending(all);
  }
  useEffect(() => { load(); }, [companyId, filter]);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-display font-bold">Aprovações</h2>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="em_revisao">Em revisão</SelectItem>
            <SelectItem value="aprovado">Aprovados</SelectItem>
            <SelectItem value="reprovado">Reprovados</SelectItem>
            <SelectItem value="publicado">Publicados</SelectItem>
            <SelectItem value="all">Todos</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="grid lg:grid-cols-2 gap-3">
        {pending.map((p) => (
          <Card key={p._table + p.id} className="p-3 space-y-2">
            <div className="flex items-center gap-2 text-xs">
              <Badge variant="outline">{p._label}</Badge>
              <span className="text-muted-foreground truncate">{p._title}</span>
            </div>
            <ApprovalPanel entidadeTipo={p._table} entidadeId={p.id} status={p.status} onChanged={load} compact />
          </Card>
        ))}
        {pending.length === 0 && <Card className="p-6 text-center text-muted-foreground col-span-full">Nada por aqui.</Card>}
      </div>
    </div>
  );
}

// ========== CALENDÁRIO ==========
export function CalendarioPage() {
  const { companyId } = useComunicacaoAccess();
  const [items, setItems] = useState<any[]>([]);
  const [edit, setEdit] = useState<any | null>(null);
  const { toast } = useToast();
  async function load() {
    if (!companyId) return;
    const { data } = await supabase.from("comm_editorial_calendar").select("*").eq("company_id", companyId).eq("is_deleted", false).order("data_planejada");
    setItems(data ?? []);
  }
  useEffect(() => { load(); }, [companyId]);

  async function save() {
    if (!companyId) { toast({ title: "Sem empresa vinculada", variant: "destructive" }); return; }
    if (!edit?.data_planejada || !edit?.tema) { toast({ title: "Data e tema são obrigatórios", variant: "destructive" }); return; }
    // Strip read-only/forbidden fields and ensure company_id
    const { id, created_at, updated_at, created_by, updated_by, is_deleted, deleted_at, deleted_by, delete_reason, ...rest } = edit;
    const payload: any = { ...rest, company_id: companyId };
    const { error } = id
      ? await supabase.from("comm_editorial_calendar").update(payload).eq("id", id)
      : await supabase.from("comm_editorial_calendar").insert(payload);
    if (error) { toast({ title: "Erro ao salvar", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Item salvo" });
    setEdit(null); load();
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-between"><h2 className="text-xl font-display font-bold">Calendário Editorial</h2>
        <Button onClick={() => setEdit({ data_planejada: new Date().toISOString().slice(0, 10), canal: "Instagram", formato: "post único", tema: "", status: "planejado", legenda: "", texto: "", cta: "" })}><Plus className="w-4 h-4 mr-1" />Novo item</Button></div>
      {edit && <Card className="p-4 space-y-2">
        <div className="grid grid-cols-2 gap-2">
          <div><Label>Data *</Label><Input type="date" value={edit.data_planejada} onChange={(e) => setEdit({ ...edit, data_planejada: e.target.value })} /></div>
          <div><Label>Hora</Label><Input type="time" value={edit.hora_planejada ?? ""} onChange={(e) => setEdit({ ...edit, hora_planejada: e.target.value || null })} /></div>
          <div><Label>Canal</Label><Input value={edit.canal ?? ""} onChange={(e) => setEdit({ ...edit, canal: e.target.value })} /></div>
          <div><Label>Formato</Label><Input value={edit.formato ?? ""} onChange={(e) => setEdit({ ...edit, formato: e.target.value })} /></div>
        </div>
        <div><Label>Tema *</Label><Input value={edit.tema ?? ""} onChange={(e) => setEdit({ ...edit, tema: e.target.value })} /></div>
        <div><Label>Legenda</Label><Textarea rows={3} value={edit.legenda ?? ""} onChange={(e) => setEdit({ ...edit, legenda: e.target.value })} placeholder="Legenda do post..." /></div>
        <div><Label>Texto/Roteiro</Label><Textarea rows={3} value={edit.texto ?? ""} onChange={(e) => setEdit({ ...edit, texto: e.target.value })} placeholder="Texto completo, roteiro ou copy do material..." /></div>
        <div><Label>CTA</Label><Input value={edit.cta ?? ""} onChange={(e) => setEdit({ ...edit, cta: e.target.value })} /></div>
        <div><Label>Notas</Label><Textarea rows={2} value={edit.notas ?? ""} onChange={(e) => setEdit({ ...edit, notas: e.target.value })} /></div>
        <div className="flex gap-2"><Button onClick={save}><Save className="w-4 h-4 mr-1" />Salvar</Button><Button variant="outline" onClick={() => setEdit(null)}>Cancelar</Button></div>
      </Card>}
      <div className="grid gap-2">
        {items.map((c) => (
          <Card key={c.id} className="p-3 flex items-center gap-3">
            <div className="text-center w-16"><div className="text-xs text-muted-foreground">{new Date(c.data_planejada).toLocaleDateString("pt-BR", { weekday: "short" })}</div><div className="font-bold">{new Date(c.data_planejada).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })}</div></div>
            <div className="flex-1"><div className="font-medium">{c.tema || "(sem tema)"}</div><div className="text-xs text-muted-foreground">{c.canal} · {c.formato}</div></div>
            <StatusBadge s={c.status} />
            <Button size="sm" variant="outline" onClick={() => setEdit(c)}>Editar</Button>
          </Card>
        ))}
        {items.length === 0 && <Card className="p-6 text-center text-muted-foreground">Calendário vazio.</Card>}
      </div>
    </div>
  );
}

// ========== GENERIC AI GENERATOR ==========
function MakeAiPage(props: {
  kind: string;
  title: string;
  fields: { key: string; label: string; type?: string; options?: string[] }[];
  saveTable?: string;
  mapResult?: (r: any, inputs: any, brandId: string, companyId: string) => { main: any; children?: { table: string; rows: any[]; fkField: string }[] };
}) {
  return function Page() {
    const { companyId } = useComunicacaoAccess();
    const { activeBrand } = useActiveBrandKit();
    const [brands, setBrands] = useState<any[]>([]);
    const [brandId, setBrandId] = useState("");
    const [inputs, setInputs] = useState<any>({});
    const [r, setR] = useState<any>(null); const [loading, setLoading] = useState(false); const [saving, setSaving] = useState(false);
    const { toast } = useToast();
    useEffect(() => { loadBrands(companyId).then(setBrands); }, [companyId]);
    useEffect(() => { if (activeBrand?.id && !brandId) setBrandId(activeBrand.id); }, [activeBrand?.id]);

    async function gen() {
      if (!companyId) return; setLoading(true);
      try { const x = await commAi({ kind: props.kind, company_id: companyId, brand: brands.find((b) => b.id === brandId) ?? activeBrand, inputs }); setR(x.data); }
      catch (e: any) { toast({ title: "Erro", description: e.message, variant: "destructive" }); }
      finally { setLoading(false); }
    }

    async function save() {
      if (!companyId || !r || !props.saveTable) return;
      setSaving(true);
      try {
        const mapped = props.mapResult
          ? props.mapResult(r, inputs, brandId, companyId)
          : { main: { company_id: companyId, brand_kit_id: brandId || null, ai_generated: true, status: "rascunho_ia", ...r } };
        const ins = await (supabase.from(props.saveTable as any) as any).insert(mapped.main).select().single();
        const { data, error } = ins as { data: any; error: any };
        if (error) throw error;
        if (mapped.children?.length) {
          for (const ch of mapped.children) {
            if (!ch.rows?.length) continue;
            await supabase.from(ch.table as any).insert(ch.rows.map((row, i) => ({ ...row, [ch.fkField]: data.id, ordem: row.ordem ?? i + 1 })));
          }
        }
        toast({ title: "Salvo como rascunho IA" });
      } catch (e: any) { toast({ title: "Erro ao salvar", description: e.message, variant: "destructive" }); }
      finally { setSaving(false); }
    }

    return (
      <div className="grid lg:grid-cols-2 gap-4">
        <Card className="p-4 space-y-3">
          <h2 className="text-xl font-display font-bold">{props.title}</h2>
          <div><Label>Brand Kit</Label>
            <Select value={brandId} onValueChange={setBrandId}><SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
              <SelectContent>{brands.map((b) => <SelectItem key={b.id} value={b.id}>{b.nome}</SelectItem>)}</SelectContent></Select>
          </div>
          {props.fields.map((f) => f.options ? (
            <div key={f.key}><Label>{f.label}</Label>
              <Select value={inputs[f.key] ?? ""} onValueChange={(v) => setInputs({ ...inputs, [f.key]: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{f.options.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
              </Select></div>
          ) : (
            <div key={f.key}><Label>{f.label}</Label><Input type={f.type ?? "text"} value={inputs[f.key] ?? ""} onChange={(e) => setInputs({ ...inputs, [f.key]: f.type === "number" ? parseInt(e.target.value) : e.target.value })} /></div>
          ))}
          <Button onClick={gen} disabled={loading}><Sparkles className="w-4 h-4 mr-1" />{loading ? "Gerando..." : "Gerar com IA"}</Button>
        </Card>
        <Card className="p-4 text-sm space-y-3">
          {!r && <div className="text-muted-foreground">Resultado aparecerá aqui.</div>}
          {r && (
            <>
              <RenderAiResult r={r} setR={setR} />
              <div className="flex flex-wrap gap-2 pt-2 border-t">
                {props.saveTable && <Button size="sm" onClick={save} disabled={saving}><Save className="w-4 h-4 mr-1" />{saving ? "Salvando..." : "Salvar rascunho"}</Button>}
                <Button size="sm" variant="ghost" onClick={() => navigator.clipboard.writeText(typeof r === "string" ? r : JSON.stringify(r, null, 2))}><Copy className="w-4 h-4 mr-1" />Copiar</Button>
                <Button size="sm" variant="outline" onClick={gen} disabled={loading}><RefreshCcw className="w-4 h-4 mr-1" />Regenerar</Button>
              </div>
            </>
          )}
        </Card>
      </div>
    );
  };
}

function RenderAiResult({ r, setR }: { r: any; setR: (v: any) => void }) {
  if (!r || typeof r !== "object") return <pre className="whitespace-pre-wrap break-words text-xs">{String(r)}</pre>;
  const entries = Object.entries(r);
  return (
    <div className="space-y-2">
      {entries.map(([k, v]) => {
        if (Array.isArray(v) && v.length && typeof v[0] === "object") {
          return (
            <div key={k}>
              <div className="font-semibold text-xs uppercase text-muted-foreground">{k}</div>
              <div className="space-y-1">
                {v.map((item: any, i: number) => (
                  <div key={i} className="p-2 bg-muted rounded text-xs">
                    {Object.entries(item).map(([ik, iv]) => (
                      <div key={ik}><b>{ik}:</b> {Array.isArray(iv) ? (iv as any[]).join(", ") : String(iv)}</div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          );
        }
        if (Array.isArray(v)) {
          return <div key={k}><div className="font-semibold text-xs uppercase text-muted-foreground">{k}</div><div className="text-xs">{(v as any[]).map((x, i) => <Badge key={i} variant="outline" className="mr-1">{String(x)}</Badge>)}</div></div>;
        }
        if (typeof v === "string" && v.length > 80) {
          return <div key={k}><div className="font-semibold text-xs uppercase text-muted-foreground">{k}</div><Textarea value={v} onChange={(e) => setR({ ...r, [k]: e.target.value })} rows={Math.min(8, Math.ceil(v.length / 80))} /></div>;
        }
        return <div key={k} className="text-xs"><b>{k}:</b> {String(v)}</div>;
      })}
    </div>
  );
}

export const CarrosselGeneratorPage = MakeAiPage({
  kind: "carrossel", title: "Gerador de Carrossel",
  saveTable: "comm_carousels",
  fields: [
    { key: "tema", label: "Tema" },
    { key: "qtd_slides", label: "Quantidade de slides", type: "number" },
    { key: "publico", label: "Público" }, { key: "objetivo", label: "Objetivo" },
    { key: "canal", label: "Canal", options: ["Instagram", "LinkedIn"] }, { key: "cta", label: "CTA" },
  ],
  mapResult: (r, inputs, brandId, companyId) => ({
    main: {
      company_id: companyId, brand_kit_id: brandId || null, ai_generated: true, status: "rascunho_ia",
      titulo: r.titulo ?? inputs.tema, tema: inputs.tema, publico: inputs.publico, objetivo: inputs.objetivo,
      canal: inputs.canal, cta: r.cta ?? inputs.cta, legenda: r.legenda, hashtags: r.hashtags ?? [],
    },
    children: Array.isArray(r.slides) ? [{
      table: "comm_carousel_slides", fkField: "carousel_id",
      rows: r.slides.map((s: any, i: number) => ({ ordem: i + 1, titulo: s.titulo, texto: s.texto, design_sugerido: s.design_sugerido })),
    }] : [],
  }),
});

export const NewsletterGeneratorPage = MakeAiPage({
  kind: "newsletter", title: "Newsletter Builder",
  saveTable: "comm_newsletters",
  fields: [{ key: "tema", label: "Tema" }, { key: "objetivo", label: "Objetivo" }, { key: "publico", label: "Público" }, { key: "cta", label: "CTA" }],
  mapResult: (r, inputs, brandId, companyId) => ({
    main: {
      company_id: companyId, brand_kit_id: brandId || null, ai_generated: true, status: "rascunho",
      assunto: r.assunto ?? inputs.tema, pre_header: r.pre_header, abertura: r.abertura,
      blocos: r.blocos ?? [], cta: r.cta ?? inputs.cta, rodape: r.rodape, publico: inputs.publico,
      versao_html: r.versao_html, versao_texto: r.versao_texto,
    },
  }),
});

export const InternaGeneratorPage = MakeAiPage({
  kind: "comunicado_interno", title: "Comunicação Interna",
  saveTable: "comm_internal_comms",
  fields: [
    { key: "tipo", label: "Tipo", options: ["aviso operacional", "comunicado RH", "comunicado DP", "engenharia", "jurídico", "alerta sistema", "reunião", "alerta prazo", "campanha interna", "segurança"] },
    { key: "tema", label: "Assunto" }, { key: "publico_alvo", label: "Público-alvo" },
    { key: "prioridade", label: "Prioridade", options: ["baixa", "normal", "alta", "urgente"] },
  ],
  mapResult: (r, inputs, _brandId, companyId) => ({
    main: {
      company_id: companyId, status: "rascunho",
      tipo: inputs.tipo, titulo: r.titulo ?? inputs.tema, mensagem_curta: r.mensagem_curta,
      mensagem_completa: r.mensagem_completa, publico_alvo: inputs.publico_alvo,
      prioridade: inputs.prioridade ?? "normal", cta: r.cta,
      versao_email: r.versao_email, versao_whatsapp: r.versao_whatsapp, versao_mural: r.versao_mural,
    },
  }),
});

export const CampanhaGeneratorPage = MakeAiPage({
  kind: "campanha", title: "Gerador de Campanha",
  saveTable: "comm_campaigns",
  fields: [
    { key: "tipo", label: "Tipo", options: ["lançamento", "lista de espera", "institucional", "comercial", "comunicação interna", "employer branding", "produto", "treinamento", "relacionamento"] },
    { key: "objetivo", label: "Objetivo" }, { key: "publico", label: "Público" }, { key: "produto", label: "Produto" }, { key: "prazo", label: "Prazo" },
  ],
  mapResult: (r, inputs, brandId, companyId) => ({
    main: {
      company_id: companyId, brand_kit_id: brandId || null, status: "planejada",
      nome: r.nome ?? r.titulo ?? `Campanha ${inputs.tipo ?? ""}`.trim(),
      tipo: inputs.tipo, conceito: r.conceito, promessa: r.promessa, objetivo: inputs.objetivo,
      publico: inputs.publico, produto: inputs.produto, canais: r.canais ?? [],
      pecas: r.pecas ?? [], cta: r.cta, metricas_esperadas: r.metricas_esperadas ?? {},
    },
  }),
});

// ========== GENERIC LIST ==========
function GenericList({ table, title, fields }: { table: string; title: string; fields: string[] }) {
  const { companyId } = useComunicacaoAccess();
  const [items, setItems] = useState<any[]>([]);
  useEffect(() => {
    if (!companyId) return;
    supabase.from(table as any).select("*").eq("company_id", companyId).eq("is_deleted", false).order("created_at", { ascending: false }).limit(100)
      .then(({ data }) => setItems(data ?? []));
  }, [companyId, table]);
  return (
    <div className="space-y-3">
      <h2 className="text-xl font-display font-bold">{title}</h2>
      <Card>
        <table className="w-full text-sm">
          <thead className="bg-muted"><tr>{fields.map((f) => <th key={f} className="p-2 text-left">{f}</th>)}<th /></tr></thead>
          <tbody>{items.map((it) => <tr key={it.id} className="border-t">{fields.map((f) => <td key={f} className="p-2">{Array.isArray(it[f]) ? it[f].join(", ") : (it[f]?.toString().slice(0, 80) || "—")}</td>)}<td className="p-2"><Button size="icon" variant="ghost" onClick={async () => { const r = window.prompt("Motivo:"); if (r) { await commSoftDelete(table, it.id, r); setItems(items.filter((x) => x.id !== it.id)); } }}><Trash2 className="w-4 h-4" /></Button></td></tr>)}</tbody>
        </table>
        {items.length === 0 && <div className="p-6 text-center text-muted-foreground text-sm">Vazio.</div>}
      </Card>
    </div>
  );
}

export const NewslettersListPage = () => <GenericList table="comm_newsletters" title="Newsletters" fields={["assunto", "publico", "status"]} />;
export const InternaListPage = () => <GenericList table="comm_internal_comms" title="Comunicações internas" fields={["tipo", "titulo", "prioridade", "status"]} />;
export const CarrosseisListPage = () => <GenericList table="comm_carousels" title="Carrosséis" fields={["titulo", "canal", "status"]} />;
export const CampanhasListPage = () => <GenericList table="comm_campaigns" title="Campanhas" fields={["nome", "tipo", "status", "data_inicio", "data_fim"]} />;
export function ProdutoListPage() {
  const { companyId } = useComunicacaoAccess();
  const { toast } = useToast();
  const [items, setItems] = useState<any[]>([]);
  const [edit, setEdit] = useState<any | null>(null);

  async function load() {
    if (!companyId) return;
    const { data } = await supabase.from("comm_product_items").select("*").eq("company_id", companyId).eq("is_deleted", false).order("created_at", { ascending: false });
    setItems(data ?? []);
  }
  useEffect(() => { load(); }, [companyId]);

  async function save() {
    if (!companyId || !edit?.titulo) { toast({ title: "Título obrigatório", variant: "destructive" }); return; }
    const { id, created_at, updated_at, created_by, updated_by, is_deleted, deleted_at, deleted_by, delete_reason, ...rest } = edit;
    const payload = { ...rest, company_id: companyId };
    const { error } = id
      ? await supabase.from("comm_product_items").update(payload).eq("id", id)
      : await supabase.from("comm_product_items").insert(payload);
    if (error) { toast({ title: "Erro", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Item salvo" }); setEdit(null); load();
  }

  async function moveKanban(item: any, status_kanban: string) {
    await supabase.from("comm_product_items").update({ status_kanban }).eq("id", item.id);
    load();
  }

  const KANBAN = [
    { key: "backlog", label: "Backlog" },
    { key: "discovery", label: "Discovery" },
    { key: "em_desenvolvimento", label: "Em desenvolvimento" },
    { key: "em_teste", label: "Em teste" },
    { key: "lancado", label: "Lançado" },
  ];

  return (
    <Tabs defaultValue="roadmap" className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-display font-bold">Product Management</h2>
        <Button size="sm" onClick={() => setEdit({ titulo: "", tipo: "feature", status: "ideia", status_kanban: "backlog", prioridade: "média" })}><Plus className="w-4 h-4 mr-1" />Novo item</Button>
      </div>
      <TabsList>
        <TabsTrigger value="roadmap">Roadmap (Kanban)</TabsTrigger>
        <TabsTrigger value="lista">Lista</TabsTrigger>
        <TabsTrigger value="posicionamento">Posicionamento</TabsTrigger>
        <TabsTrigger value="lancamentos">Lançamentos</TabsTrigger>
        <TabsTrigger value="metricas">Métricas</TabsTrigger>
      </TabsList>

      {edit && (
        <Card className="p-4 space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <div><Label>Título *</Label><Input value={edit.titulo ?? ""} onChange={(e) => setEdit({ ...edit, titulo: e.target.value })} /></div>
            <div><Label>Tipo</Label>
              <Select value={edit.tipo ?? "feature"} onValueChange={(v) => setEdit({ ...edit, tipo: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{["feature", "epic", "bug", "melhoria", "research", "release"].map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Prioridade</Label>
              <Select value={edit.prioridade ?? "média"} onValueChange={(v) => setEdit({ ...edit, prioridade: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{["baixa", "média", "alta", "crítica"].map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Status Kanban</Label>
              <Select value={edit.status_kanban ?? "backlog"} onValueChange={(v) => setEdit({ ...edit, status_kanban: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{KANBAN.map((k) => <SelectItem key={k.key} value={k.key}>{k.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Módulo</Label><Input value={edit.modulo_relacionado ?? ""} onChange={(e) => setEdit({ ...edit, modulo_relacionado: e.target.value })} /></div>
            <div><Label>Versão prevista</Label><Input value={edit.versao_prevista ?? ""} onChange={(e) => setEdit({ ...edit, versao_prevista: e.target.value })} /></div>
            <div><Label>Data de lançamento</Label><Input type="date" value={edit.data_lancamento ?? ""} onChange={(e) => setEdit({ ...edit, data_lancamento: e.target.value || null })} /></div>
          </div>
          <div><Label>Descrição</Label><Textarea rows={2} value={edit.descricao ?? ""} onChange={(e) => setEdit({ ...edit, descricao: e.target.value })} /></div>
          <div><Label>User story</Label><Textarea rows={2} value={edit.user_story ?? ""} onChange={(e) => setEdit({ ...edit, user_story: e.target.value })} placeholder="Como [usuário] quero [ação] para [benefício]" /></div>
          <div><Label>Critérios de aceite</Label><Textarea rows={2} value={edit.criterios_aceite ?? ""} onChange={(e) => setEdit({ ...edit, criterios_aceite: e.target.value })} /></div>
          <div><Label>Release note</Label><Textarea rows={2} value={edit.release_note ?? ""} onChange={(e) => setEdit({ ...edit, release_note: e.target.value })} /></div>
          <div className="flex gap-2"><Button onClick={save}><Save className="w-4 h-4 mr-1" />Salvar</Button><Button variant="outline" onClick={() => setEdit(null)}>Cancelar</Button></div>
        </Card>
      )}

      <TabsContent value="roadmap">
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {KANBAN.map((col) => (
            <div key={col.key} className="space-y-2"
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => { const id = e.dataTransfer.getData("text/plain"); const it = items.find((x) => x.id === id); if (it) moveKanban(it, col.key); }}
            >
              <div className="text-xs font-bold uppercase text-muted-foreground border-b pb-1">{col.label} <span className="text-[10px] text-muted-foreground">({items.filter((i) => (i.status_kanban ?? "backlog") === col.key).length})</span></div>
              {items.filter((i) => (i.status_kanban ?? "backlog") === col.key).map((i) => (
                <Card key={i.id} className="p-2 cursor-grab active:cursor-grabbing" draggable onDragStart={(e) => e.dataTransfer.setData("text/plain", i.id)} onClick={() => setEdit(i)}>
                  <div className="text-sm font-medium line-clamp-2">{i.titulo}</div>
                  <div className="text-[10px] text-muted-foreground mt-1">{i.tipo} · {i.prioridade ?? "média"}</div>
                  {i.modulo_relacionado && <Badge variant="outline" className="mt-1 text-[9px]">{i.modulo_relacionado}</Badge>}
                </Card>
              ))}
            </div>
          ))}
        </div>
      </TabsContent>

      <TabsContent value="lista">
        <Card>
          <table className="w-full text-sm">
            <thead className="bg-muted"><tr><th className="p-2 text-left">Título</th><th className="p-2 text-left">Tipo</th><th className="p-2 text-left">Status</th><th className="p-2 text-left">Prioridade</th><th className="p-2 text-left">Módulo</th><th /></tr></thead>
            <tbody>{items.map((it) => (
              <tr key={it.id} className="border-t hover:bg-muted/30 cursor-pointer" onClick={() => setEdit(it)}>
                <td className="p-2">{it.titulo}</td><td className="p-2">{it.tipo}</td><td className="p-2"><StatusBadge s={it.status_kanban ?? it.status} /></td><td className="p-2">{it.prioridade ?? "—"}</td><td className="p-2">{it.modulo_relacionado ?? "—"}</td>
                <td className="p-2"><Button size="icon" variant="ghost" onClick={async (e) => { e.stopPropagation(); const r = window.prompt("Motivo:"); if (r) { await commSoftDelete("comm_product_items", it.id, r); load(); } }}><Trash2 className="w-4 h-4" /></Button></td>
              </tr>))}</tbody>
          </table>
          {items.length === 0 && <div className="p-6 text-center text-muted-foreground text-sm">Nenhum item.</div>}
        </Card>
      </TabsContent>

      <TabsContent value="posicionamento">
        <Card className="p-4 space-y-3">
          <h3 className="font-display font-bold">One-pager de posicionamento</h3>
          <p className="text-xs text-muted-foreground">Clique em um item para editar o posicionamento detalhado.</p>
          <div className="grid md:grid-cols-2 gap-3">
            {items.filter((i) => i.tipo === "feature" || i.tipo === "release").map((i) => (
              <Card key={i.id} className="p-3 cursor-pointer hover:border-primary/40" onClick={() => setEdit(i)}>
                <div className="font-medium text-sm">{i.titulo}</div>
                <div className="text-xs text-muted-foreground mt-1">Para: {i.user_story?.match(/Como ([^,]+)/)?.[1] ?? "—"}</div>
                <div className="text-xs mt-1 line-clamp-3">{i.descricao}</div>
              </Card>
            ))}
            {items.filter((i) => i.tipo === "feature" || i.tipo === "release").length === 0 && <div className="text-sm text-muted-foreground col-span-2">Crie features para ver posicionamento.</div>}
          </div>
        </Card>
      </TabsContent>

      <TabsContent value="lancamentos">
        <div className="space-y-2">
          {items.filter((i) => i.data_lancamento || i.tipo === "release").sort((a, b) => (a.data_lancamento ?? "").localeCompare(b.data_lancamento ?? "")).map((i) => (
            <Card key={i.id} className="p-3 flex items-center gap-3">
              <div className="text-center w-20">
                <div className="text-xs text-muted-foreground">{i.data_lancamento ? new Date(i.data_lancamento).toLocaleDateString("pt-BR", { weekday: "short" }) : "—"}</div>
                <div className="font-bold text-sm">{i.data_lancamento ? new Date(i.data_lancamento).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }) : "?"}</div>
              </div>
              <div className="flex-1 cursor-pointer" onClick={() => setEdit(i)}>
                <div className="font-medium">{i.titulo}</div>
                <div className="text-xs text-muted-foreground">{i.versao_prevista ?? ""} {i.modulo_relacionado ?? ""}</div>
                {i.release_note && <div className="text-xs mt-1 line-clamp-2">{i.release_note}</div>}
              </div>
              <StatusBadge s={i.status_kanban ?? i.status} />
            </Card>
          ))}
          {items.filter((i) => i.data_lancamento || i.tipo === "release").length === 0 && <Card className="p-6 text-center text-muted-foreground">Nenhum lançamento agendado.</Card>}
        </div>
      </TabsContent>

      <TabsContent value="metricas">
        <div className="grid md:grid-cols-4 gap-3">
          {[
            { label: "Total", v: items.length },
            { label: "Em desenvolvimento", v: items.filter((i) => i.status_kanban === "em_desenvolvimento").length },
            { label: "Lançados", v: items.filter((i) => i.status_kanban === "lancado").length },
            { label: "Backlog", v: items.filter((i) => (i.status_kanban ?? "backlog") === "backlog").length },
          ].map((k) => (
            <Card key={k.label} className="p-4 text-center">
              <div className="text-3xl font-display font-bold text-primary">{k.v}</div>
              <div className="text-xs uppercase text-muted-foreground mt-1">{k.label}</div>
            </Card>
          ))}
        </div>
        <Card className="p-4 mt-3">
          <h3 className="font-display font-bold mb-2">Distribuição por tipo</h3>
          <div className="space-y-1">
            {Array.from(new Set(items.map((i) => i.tipo ?? "—"))).map((tipo) => {
              const n = items.filter((i) => (i.tipo ?? "—") === tipo).length;
              const pct = items.length ? Math.round((n / items.length) * 100) : 0;
              return (
                <div key={tipo}>
                  <div className="flex justify-between text-xs"><span>{tipo}</span><span>{n} ({pct}%)</span></div>
                  <div className="h-2 bg-muted rounded overflow-hidden"><div className="h-full bg-primary" style={{ width: `${pct}%` }} /></div>
                </div>
              );
            })}
          </div>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
export const PublicacoesListPage = () => <GenericList table="comm_publications" title="Publicações" fields={["canal", "status", "data_publicada", "link_publicacao"]} />;

// ========== IDEIAS ==========
export function IdeiasPage() {
  const { companyId } = useComunicacaoAccess();
  const { activeBrand } = useActiveBrandKit();
  const { toast } = useToast();
  const [items, setItems] = useState<any[]>([]);
  const [novo, setNovo] = useState<any>({ ideia: "", categoria: "post", prioridade: "média" });
  const [loading, setLoading] = useState(false);
  async function load() { if (!companyId) return; const { data } = await supabase.from("comm_idea_bank").select("*").eq("company_id", companyId).eq("is_deleted", false).order("created_at", { ascending: false }); setItems(data ?? []); }
  useEffect(() => { load(); }, [companyId]);

  async function add() {
    if (!novo.ideia) return;
    await supabase.from("comm_idea_bank").insert({ ...novo, company_id: companyId, brand_kit_id: activeBrand?.id ?? null });
    setNovo({ ideia: "", categoria: "post", prioridade: "média" }); load();
  }

  async function genIdeas() {
    if (!companyId) return;
    const tema = window.prompt(activeBrand ? `Tema das ideias para "${activeBrand.nome}"?` : "Tema das ideias?");
    if (!tema) return;
    setLoading(true);
    try {
      const r = await commAi({ kind: "ideia", company_id: companyId, brand: activeBrand, inputs: { tema, qtd: 10, categoria: "post" } });
      const lista = r.data?.ideias ?? [];
      if (lista.length) {
        await supabase.from("comm_idea_bank").insert(lista.map((i: any) => ({
          company_id: companyId, brand_kit_id: activeBrand?.id ?? null,
          ideia: i.titulo + (i.resumo ? " — " + i.resumo : ""),
          categoria: i.categoria ?? "post", prioridade: i.prioridade ?? "média", origem: "IA",
        })));
        toast({ title: `${lista.length} ideias geradas` });
        load();
      } else {
        toast({ title: "Nenhuma ideia retornada", variant: "destructive" });
      }
    } catch (e: any) {
      toast({ title: "Erro IA", description: e.message, variant: "destructive" });
    } finally { setLoading(false); }
  }

  const filtered = activeBrand ? items.filter((i) => !i.brand_kit_id || i.brand_kit_id === activeBrand.id) : items;

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center gap-2 flex-wrap">
        <div>
          <h2 className="text-xl font-display font-bold">Banco de Ideias</h2>
          {activeBrand && <div className="text-xs text-muted-foreground">Marca ativa: <b>{activeBrand.nome}</b></div>}
        </div>
        <Button onClick={genIdeas} disabled={loading}><Sparkles className="w-4 h-4 mr-1" />{loading ? "Gerando..." : "Gerar 10 ideias com IA"}</Button>
      </div>
      <Card className="p-3 flex gap-2">
        <Input placeholder="Nova ideia..." value={novo.ideia} onChange={(e) => setNovo({ ...novo, ideia: e.target.value })} />
        <Button onClick={add}><Plus className="w-4 h-4" /></Button>
      </Card>
      <div className="grid md:grid-cols-2 gap-2">
        {filtered.map((i) => <Card key={i.id} className="p-3 flex justify-between items-start"><div><div className="text-sm">{i.ideia}</div><div className="text-xs text-muted-foreground">{i.categoria} · {i.prioridade} {i.origem ? `· ${i.origem}` : ""}</div></div><Button size="icon" variant="ghost" onClick={async () => { const r = window.prompt("Motivo:"); if (r) { await commSoftDelete("comm_idea_bank", i.id, r); load(); } }}><Trash2 className="w-4 h-4" /></Button></Card>)}
        {filtered.length === 0 && <Card className="p-6 text-center text-muted-foreground col-span-full">Nenhuma ideia ainda. Use a IA para começar!</Card>}
      </div>
    </div>
  );
}

// ========== PROMPTS ==========
export function PromptsPage() {
  const { companyId } = useComunicacaoAccess();
  const [items, setItems] = useState<any[]>([]);
  const [novo, setNovo] = useState<any>({ nome: "", categoria: "post", texto: "" });
  async function load() { if (!companyId) return; const { data } = await supabase.from("comm_prompt_library").select("*").eq("company_id", companyId).eq("is_deleted", false); setItems(data ?? []); }
  useEffect(() => { load(); }, [companyId]);
  async function add() { if (!novo.nome || !novo.texto) return; await supabase.from("comm_prompt_library").insert({ ...novo, company_id: companyId }); setNovo({ nome: "", categoria: "post", texto: "" }); load(); }
  return (
    <div className="space-y-3">
      <h2 className="text-xl font-display font-bold">Banco de Prompts</h2>
      <Card className="p-3 space-y-2">
        <Input placeholder="Nome" value={novo.nome} onChange={(e) => setNovo({ ...novo, nome: e.target.value })} />
        <Input placeholder="Categoria" value={novo.categoria} onChange={(e) => setNovo({ ...novo, categoria: e.target.value })} />
        <Textarea placeholder="Texto do prompt (use {{variaveis}})" value={novo.texto} onChange={(e) => setNovo({ ...novo, texto: e.target.value })} rows={4} />
        <Button onClick={add}><Plus className="w-4 h-4 mr-1" />Adicionar</Button>
      </Card>
      <div className="grid md:grid-cols-2 gap-2">
        {items.map((p) => <Card key={p.id} className="p-3"><div className="font-medium">{p.nome}</div><div className="text-xs text-muted-foreground">{p.categoria}</div><div className="text-xs mt-2 line-clamp-3">{p.texto}</div></Card>)}
      </div>
    </div>
  );
}

// ========== AUDITORIA ==========
export function AuditoriaPage() {
  const { companyId } = useComunicacaoAccess();
  const [items, setItems] = useState<any[]>([]);
  useEffect(() => {
    if (!companyId) return;
    supabase.from("comm_audit_logs").select("*").eq("company_id", companyId).order("created_at", { ascending: false }).limit(200).then(({ data }) => setItems(data ?? []));
  }, [companyId]);
  return (
    <div className="space-y-3">
      <h2 className="text-xl font-display font-bold">Auditoria</h2>
      <Card>
        <table className="w-full text-xs">
          <thead className="bg-muted"><tr><th className="p-2 text-left">Quando</th><th className="p-2 text-left">Ação</th><th className="p-2 text-left">Módulo</th><th className="p-2 text-left">Entidade</th><th className="p-2 text-left">Obs</th></tr></thead>
          <tbody>{items.map((a) => <tr key={a.id} className="border-t"><td className="p-2">{new Date(a.created_at).toLocaleString()}</td><td className="p-2">{a.action}</td><td className="p-2">{a.modulo}</td><td className="p-2">{a.nome_entidade}</td><td className="p-2">{a.observacoes}</td></tr>)}</tbody>
        </table>
      </Card>
    </div>
  );
}
