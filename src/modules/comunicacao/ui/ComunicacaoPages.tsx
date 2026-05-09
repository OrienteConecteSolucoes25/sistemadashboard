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
      <div className="space-y-3 max-w-3xl">
        <h2 className="text-xl font-display font-bold">{edit.id ? "Editar" : "Novo"} Brand Kit</h2>
        <Card className="p-4 space-y-3">
          {[
            ["nome", "Nome da marca"], ["slogan", "Slogan"], ["descricao", "Descrição"],
            ["publico_alvo", "Público-alvo"], ["persona", "Persona"], ["tom_de_voz", "Tom de voz"],
            ["proposta_valor", "Proposta de valor"], ["diferenciais", "Diferenciais"], ["cta_padrao", "CTA padrão"],
            ["estilo_visual", "Estilo visual"], ["tipo_linguagem", "Tipo de linguagem"],
          ].map(([k, label]) => (
            <div key={k}>
              <Label>{label}</Label>
              {["descricao", "diferenciais", "proposta_valor"].includes(k) ?
                <Textarea value={edit[k] ?? ""} onChange={(e) => setEdit({ ...edit, [k]: e.target.value })} /> :
                <Input value={edit[k] ?? ""} onChange={(e) => setEdit({ ...edit, [k]: e.target.value })} />}
            </div>
          ))}
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Palavras permitidas (CSV)</Label><Input value={Array.isArray(edit.palavras_permitidas) ? edit.palavras_permitidas.join(", ") : edit.palavras_permitidas ?? ""} onChange={(e) => setEdit({ ...edit, palavras_permitidas: e.target.value })} /></div>
            <div><Label>Palavras proibidas (CSV)</Label><Input value={Array.isArray(edit.palavras_proibidas) ? edit.palavras_proibidas.join(", ") : edit.palavras_proibidas ?? ""} onChange={(e) => setEdit({ ...edit, palavras_proibidas: e.target.value })} /></div>
            <div><Label>Cores principais (CSV)</Label><Input value={Array.isArray(edit.cores_principais) ? edit.cores_principais.join(", ") : edit.cores_principais ?? ""} onChange={(e) => setEdit({ ...edit, cores_principais: e.target.value })} /></div>
            <div><Label>Cores secundárias (CSV)</Label><Input value={Array.isArray(edit.cores_secundarias) ? edit.cores_secundarias.join(", ") : edit.cores_secundarias ?? ""} onChange={(e) => setEdit({ ...edit, cores_secundarias: e.target.value })} /></div>
            <div className="col-span-2"><Label>Fontes (CSV)</Label><Input value={Array.isArray(edit.fontes) ? edit.fontes.join(", ") : edit.fontes ?? ""} onChange={(e) => setEdit({ ...edit, fontes: e.target.value })} /></div>
          </div>
          <div className="flex gap-2">
            <Button onClick={save}><Save className="w-4 h-4 mr-1" />Salvar</Button>
            <Button variant="outline" onClick={() => setEdit(null)}>Cancelar</Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-display font-bold">Brand Kits</h2>
        <Button onClick={newKit}><Plus className="w-4 h-4 mr-1" />Novo Brand Kit</Button>
      </div>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
        {items.map((b) => (
          <Card key={b.id} className="p-4 space-y-2">
            <div className="flex justify-between"><div className="font-bold">{b.nome}</div><Button size="icon" variant="ghost" onClick={() => remove(b.id)}><Trash2 className="w-4 h-4" /></Button></div>
            {b.slogan && <div className="text-xs italic text-muted-foreground">"{b.slogan}"</div>}
            <div className="text-sm line-clamp-3">{b.descricao}</div>
            <div className="flex gap-1 flex-wrap">
              {(b.cores_principais ?? []).map((c: string) => <span key={c} style={{ background: c }} className="w-5 h-5 rounded border" />)}
            </div>
            <div className="text-xs text-muted-foreground">Tom: {b.tom_de_voz}</div>
            <Button size="sm" variant="outline" onClick={() => setEdit(b)}>Editar</Button>
          </Card>
        ))}
        {items.length === 0 && <Card className="p-6 text-center text-muted-foreground col-span-full">Nenhum Brand Kit. Crie o primeiro!</Card>}
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
  async function load() {
    if (!companyId) return;
    const { data } = await supabase.from("comm_content_posts").select("*").eq("company_id", companyId).eq("is_deleted", false).order("created_at", { ascending: false }).limit(100);
    setItems(data ?? []);
  }
  useEffect(() => { load(); }, [companyId]);

  async function setStatus(id: string, status: string) {
    await supabase.from("comm_content_posts").update({ status }).eq("id", id);
    if (status === "em_revisao") {
      await supabase.from("comm_approvals").insert({ company_id: companyId, entidade_tipo: "comm_content_posts", entidade_id: id, status: "em_revisao" });
    }
    load();
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-display font-bold">Posts</h2>
        <Link to="/app/comunicacao/posts"><Button><Plus className="w-4 h-4 mr-1" />Gerar novo</Button></Link>
      </div>
      <div className="grid gap-2">
        {items.map((p) => (
          <Card key={p.id} className="p-3 flex items-start gap-3">
            <div className="flex-1">
              <div className="flex items-center gap-2"><div className="font-medium">{p.titulo || p.tema || "(sem título)"}</div><StatusBadge s={p.status} /></div>
              <div className="text-xs text-muted-foreground">{p.canal} · {p.formato} · {p.data_planejada || "sem data"}</div>
              <div className="text-sm line-clamp-2 mt-1">{p.legenda}</div>
            </div>
            <div className="flex flex-col gap-1">
              {p.status === "rascunho_ia" && <Button size="sm" variant="outline" onClick={() => setStatus(p.id, "em_revisao")}>Enviar p/ revisão</Button>}
              {p.status === "aprovado" && <Button size="sm" onClick={() => setStatus(p.id, "publicado")}>Marcar publicado</Button>}
              <Button size="icon" variant="ghost" onClick={async () => { const r = window.prompt("Motivo:"); if (r) { await commSoftDelete("comm_content_posts", p.id, r); load(); } }}><Trash2 className="w-4 h-4" /></Button>
            </div>
          </Card>
        ))}
        {items.length === 0 && <Card className="p-6 text-center text-muted-foreground">Nenhum post ainda.</Card>}
      </div>
    </div>
  );
}

// ========== APROVAÇÕES ==========
export function AprovacoesPage() {
  const { companyId } = useComunicacaoAccess();
  const [items, setItems] = useState<any[]>([]);
  const { toast } = useToast();
  async function load() {
    if (!companyId) return;
    const { data } = await supabase.from("comm_approvals").select("*").eq("company_id", companyId).order("created_at", { ascending: false }).limit(100);
    setItems(data ?? []);
  }
  useEffect(() => { load(); }, [companyId]);

  async function decide(id: string, decision: "aprovado" | "ajustes" | "reprovado", entidade_tipo: string, entidade_id: string) {
    const motivo = decision !== "aprovado" ? prompt("Motivo:") || "" : null;
    await supabase.from("comm_approvals").update({ status: decision, motivo_reprovacao: motivo, aprovado_em: new Date().toISOString() }).eq("id", id);
    if (decision === "aprovado") await supabase.from(entidade_tipo as any).update({ status: "aprovado" }).eq("id", entidade_id);
    if (decision === "ajustes") await supabase.from(entidade_tipo as any).update({ status: "ajustes" }).eq("id", entidade_id);
    toast({ title: "Decisão registrada" }); load();
  }

  return (
    <div className="space-y-3">
      <h2 className="text-xl font-display font-bold">Aprovações</h2>
      <div className="grid gap-2">
        {items.map((a) => (
          <Card key={a.id} className="p-3 flex items-center gap-3">
            <div className="flex-1">
              <div className="text-sm font-medium">{a.entidade_tipo} · {a.entidade_id.slice(0, 8)}</div>
              <div className="text-xs text-muted-foreground">{new Date(a.created_at).toLocaleString()}</div>
              <StatusBadge s={a.status} />
            </div>
            {a.status === "em_revisao" && <div className="flex gap-1">
              <Button size="sm" onClick={() => decide(a.id, "aprovado", a.entidade_tipo, a.entidade_id)}>Aprovar</Button>
              <Button size="sm" variant="outline" onClick={() => decide(a.id, "ajustes", a.entidade_tipo, a.entidade_id)}>Ajustes</Button>
              <Button size="sm" variant="destructive" onClick={() => decide(a.id, "reprovado", a.entidade_tipo, a.entidade_id)}>Reprovar</Button>
            </div>}
          </Card>
        ))}
        {items.length === 0 && <Card className="p-6 text-center text-muted-foreground">Nenhuma aprovação pendente.</Card>}
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
function MakeAiPage(props: { kind: string; title: string; fields: { key: string; label: string; type?: string; options?: string[] }[]; previewKey?: string }) {
  return function Page() {
    const { companyId } = useComunicacaoAccess();
    const [brands, setBrands] = useState<any[]>([]);
    const [brandId, setBrandId] = useState("");
    const [inputs, setInputs] = useState<any>({});
    const [r, setR] = useState<any>(null); const [loading, setLoading] = useState(false);
    const { toast } = useToast();
    useEffect(() => { loadBrands(companyId).then(setBrands); }, [companyId]);

    async function gen() {
      if (!companyId) return; setLoading(true);
      try { const x = await commAi({ kind: props.kind, company_id: companyId, brand: brands.find((b) => b.id === brandId), inputs }); setR(x.data); }
      catch (e: any) { toast({ title: "Erro", description: e.message, variant: "destructive" }); }
      finally { setLoading(false); }
    }
    return (
      <div className="grid lg:grid-cols-2 gap-4">
        <Card className="p-4 space-y-3">
          <h2 className="text-xl font-display font-bold">{props.title}</h2>
          <Select value={brandId} onValueChange={setBrandId}><SelectTrigger><SelectValue placeholder="Brand Kit" /></SelectTrigger>
            <SelectContent>{brands.map((b) => <SelectItem key={b.id} value={b.id}>{b.nome}</SelectItem>)}</SelectContent></Select>
          {props.fields.map((f) => f.options ? (
            <div key={f.key}><Label>{f.label}</Label>
              <Select value={inputs[f.key] ?? ""} onValueChange={(v) => setInputs({ ...inputs, [f.key]: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{f.options.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
              </Select></div>
          ) : (
            <div key={f.key}><Label>{f.label}</Label><Input type={f.type ?? "text"} value={inputs[f.key] ?? ""} onChange={(e) => setInputs({ ...inputs, [f.key]: f.type === "number" ? parseInt(e.target.value) : e.target.value })} /></div>
          ))}
          <Button onClick={gen} disabled={loading}>{loading ? "Gerando..." : "Gerar"}</Button>
        </Card>
        <Card className="p-4 text-sm">
          {!r && <div className="text-muted-foreground">Resultado aparecerá aqui.</div>}
          {r && <pre className="whitespace-pre-wrap break-words text-xs">{JSON.stringify(r, null, 2)}</pre>}
        </Card>
      </div>
    );
  };
}

export const CarrosselGeneratorPage = MakeAiPage({
  kind: "carrossel", title: "Gerador de Carrossel",
  fields: [
    { key: "tema", label: "Tema" },
    { key: "qtd_slides", label: "Quantidade de slides", type: "number" },
    { key: "publico", label: "Público" }, { key: "objetivo", label: "Objetivo" },
    { key: "canal", label: "Canal", options: ["Instagram", "LinkedIn"] }, { key: "cta", label: "CTA" },
  ],
});

export const NewsletterGeneratorPage = MakeAiPage({
  kind: "newsletter", title: "Newsletter Builder",
  fields: [{ key: "tema", label: "Tema" }, { key: "objetivo", label: "Objetivo" }, { key: "publico", label: "Público" }, { key: "cta", label: "CTA" }],
});

export const InternaGeneratorPage = MakeAiPage({
  kind: "comunicado_interno", title: "Comunicação Interna",
  fields: [
    { key: "tipo", label: "Tipo", options: ["aviso operacional", "comunicado RH", "comunicado DP", "engenharia", "jurídico", "alerta sistema", "reunião", "alerta prazo", "campanha interna", "segurança"] },
    { key: "tema", label: "Assunto" }, { key: "publico_alvo", label: "Público-alvo" },
    { key: "prioridade", label: "Prioridade", options: ["baixa", "normal", "alta", "urgente"] },
  ],
});

export const CampanhaGeneratorPage = MakeAiPage({
  kind: "campanha", title: "Gerador de Campanha",
  fields: [
    { key: "tipo", label: "Tipo", options: ["lançamento", "lista de espera", "institucional", "comercial", "comunicação interna", "employer branding", "produto", "treinamento", "relacionamento"] },
    { key: "objetivo", label: "Objetivo" }, { key: "publico", label: "Público" }, { key: "produto", label: "Produto" }, { key: "prazo", label: "Prazo" },
  ],
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
export const ProdutoListPage = () => <GenericList table="comm_product_items" title="Product Management" fields={["titulo", "tipo", "status", "prioridade", "modulo_relacionado"]} />;
export const PublicacoesListPage = () => <GenericList table="comm_publications" title="Publicações" fields={["canal", "status", "data_publicada", "link_publicacao"]} />;

// ========== IDEIAS ==========
export function IdeiasPage() {
  const { companyId } = useComunicacaoAccess();
  const [items, setItems] = useState<any[]>([]);
  const [novo, setNovo] = useState<any>({ ideia: "", categoria: "post", prioridade: "média" });
  async function load() { if (!companyId) return; const { data } = await supabase.from("comm_idea_bank").select("*").eq("company_id", companyId).eq("is_deleted", false).order("created_at", { ascending: false }); setItems(data ?? []); }
  useEffect(() => { load(); }, [companyId]);

  async function add() {
    if (!novo.ideia) return;
    await supabase.from("comm_idea_bank").insert({ ...novo, company_id: companyId });
    setNovo({ ideia: "", categoria: "post", prioridade: "média" }); load();
  }

  async function genIdeas() {
    if (!companyId) return;
    const tema = window.prompt("Tema das ideias?"); if (!tema) return;
    const r = await commAi({ kind: "ideia", company_id: companyId, inputs: { tema, qtd: 10, categoria: "post" } });
    const lista = r.data?.ideias ?? [];
    if (lista.length) {
      await supabase.from("comm_idea_bank").insert(lista.map((i: any) => ({ company_id: companyId, ideia: i.titulo + (i.resumo ? " — " + i.resumo : ""), categoria: i.categoria ?? "post", prioridade: i.prioridade ?? "média", origem: "IA" })));
      load();
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-between"><h2 className="text-xl font-display font-bold">Banco de Ideias</h2><Button onClick={genIdeas}><Sparkles className="w-4 h-4 mr-1" />Gerar 10 ideias com IA</Button></div>
      <Card className="p-3 flex gap-2">
        <Input placeholder="Nova ideia..." value={novo.ideia} onChange={(e) => setNovo({ ...novo, ideia: e.target.value })} />
        <Button onClick={add}><Plus className="w-4 h-4" /></Button>
      </Card>
      <div className="grid md:grid-cols-2 gap-2">
        {items.map((i) => <Card key={i.id} className="p-3 flex justify-between items-start"><div><div className="text-sm">{i.ideia}</div><div className="text-xs text-muted-foreground">{i.categoria} · {i.prioridade} {i.origem ? `· ${i.origem}` : ""}</div></div><Button size="icon" variant="ghost" onClick={async () => { const r = window.prompt("Motivo:"); if (r) { await commSoftDelete("comm_idea_bank", i.id, r); load(); } }}><Trash2 className="w-4 h-4" /></Button></Card>)}
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
