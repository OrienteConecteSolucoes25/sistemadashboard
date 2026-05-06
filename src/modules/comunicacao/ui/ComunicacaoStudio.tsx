import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useComunicacaoAccess } from "../hooks/useComunicacaoAccess";
import { commImageGen, commSoftDelete } from "../lib/api";
import { Sparkles, Save, Download, Copy, ExternalLink, Trash2, Image as ImageIcon } from "lucide-react";

const FORMATS: Record<string, { w: number; h: number; label: string }> = {
  "1080x1080": { w: 1080, h: 1080, label: "Instagram Feed" },
  "1080x1920": { w: 1080, h: 1920, label: "Story / Reels" },
  "1200x627": { w: 1200, h: 627, label: "LinkedIn" },
  "1600x900": { w: 1600, h: 900, label: "Banner" },
  "1080x1350": { w: 1080, h: 1350, label: "Carrossel" },
};

const TEMPLATES = [
  { key: "lancamento", nome: "Lançamento", titulo: "NOVIDADE", subtitulo: "Apresentamos algo incrível", cta: "Saiba mais", bg: "#1a1f26", fg: "#2BBDC0" },
  { key: "dica", nome: "Dica técnica", titulo: "💡 DICA", subtitulo: "Aprenda em 60s", cta: "Ver mais", bg: "#0f172a", fg: "#facc15" },
  { key: "comunicado", nome: "Comunicado interno", titulo: "COMUNICADO", subtitulo: "Mensagem importante", cta: "Leia já", bg: "#1e3a8a", fg: "#ffffff" },
  { key: "alerta", nome: "Alerta", titulo: "⚠️ ATENÇÃO", subtitulo: "Informação urgente", cta: "Confira", bg: "#991b1b", fg: "#ffffff" },
  { key: "beneficio", nome: "Benefício", titulo: "BENEFÍCIO", subtitulo: "Para você", cta: "Aproveite", bg: "#065f46", fg: "#ffffff" },
  { key: "produto", nome: "Produto", titulo: "PRODUTO", subtitulo: "Conheça agora", cta: "Quero ver", bg: "#1a1f26", fg: "#2BBDC0" },
  { key: "espera", nome: "Lista de espera", titulo: "EM BREVE", subtitulo: "Entre na lista", cta: "Inscrever-se", bg: "#7c3aed", fg: "#ffffff" },
  { key: "checklist", nome: "Checklist", titulo: "CHECKLIST", subtitulo: "5 passos essenciais", cta: "Salvar", bg: "#0c4a6e", fg: "#22d3ee" },
  { key: "novidade", nome: "Novidade ERP", titulo: "ATUALIZAÇÃO", subtitulo: "Novidade do ERP OCS", cta: "Ver release", bg: "#1a1f26", fg: "#2BBDC0" },
];

// ========== DESIGN STUDIO ==========
export function DesignStudioPage() {
  const { companyId } = useComunicacaoAccess();
  const [brands, setBrands] = useState<any[]>([]);
  const [brandId, setBrandId] = useState("");
  const [tpl, setTpl] = useState(TEMPLATES[0]);
  const [fmt, setFmt] = useState("1080x1080");
  const [titulo, setTitulo] = useState(tpl.titulo);
  const [subtitulo, setSubtitulo] = useState(tpl.subtitulo);
  const [cta, setCta] = useState(tpl.cta);
  const [bg, setBg] = useState(tpl.bg);
  const [fg, setFg] = useState(tpl.fg);
  const svgRef = useRef<SVGSVGElement>(null);
  const { toast } = useToast();

  useEffect(() => { supabase.from("comm_brand_kits").select("*").eq("company_id", companyId).eq("is_deleted", false).then(({ data }) => setBrands(data ?? [])); }, [companyId]);
  useEffect(() => { setTitulo(tpl.titulo); setSubtitulo(tpl.subtitulo); setCta(tpl.cta); setBg(tpl.bg); setFg(tpl.fg); }, [tpl]);

  function applyBrand() {
    const b = brands.find((x) => x.id === brandId); if (!b) return;
    const cores = b.cores_principais ?? []; if (cores[0]) setBg(cores[1] || "#1a1f26"); if (cores[1] || cores[0]) setFg(cores[0]);
    if (b.cta_padrao) setCta(b.cta_padrao);
  }

  const f = FORMATS[fmt];

  function exportPng() {
    const svg = svgRef.current; if (!svg) return;
    const xml = new XMLSerializer().serializeToString(svg);
    const blob = new Blob([xml], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const img = new Image(); img.onload = () => {
      const c = document.createElement("canvas"); c.width = f.w; c.height = f.h;
      const ctx = c.getContext("2d")!; ctx.drawImage(img, 0, 0, f.w, f.h);
      c.toBlob((b) => { if (!b) return; const a = document.createElement("a"); a.href = URL.createObjectURL(b); a.download = `design-${tpl.key}.png`; a.click(); }, "image/png");
      URL.revokeObjectURL(url);
    }; img.src = url;
  }

  async function saveDesign() {
    if (!companyId) return;
    const conteudo = { tpl: tpl.key, fmt, titulo, subtitulo, cta, bg, fg };
    await supabase.from("comm_generated_designs").insert({ company_id: companyId, brand_kit_id: brandId || null, template_id: null, nome: titulo, formato: fmt, largura: f.w, altura: f.h, conteudo, status: "rascunho", approval_status: "rascunho" });
    toast({ title: "Design salvo (rascunho)" });
  }

  return (
    <div className="grid lg:grid-cols-[320px_1fr] gap-4">
      <Card className="p-4 space-y-3">
        <h2 className="text-lg font-display font-bold">Design Studio</h2>
        <div><Label>Brand Kit</Label>
          <div className="flex gap-1"><Select value={brandId} onValueChange={setBrandId}><SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
            <SelectContent>{brands.map((b) => <SelectItem key={b.id} value={b.id}>{b.nome}</SelectItem>)}</SelectContent></Select>
            <Button size="sm" variant="outline" onClick={applyBrand}>Aplicar</Button></div></div>
        <div><Label>Formato</Label><Select value={fmt} onValueChange={setFmt}><SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>{Object.entries(FORMATS).map(([k, v]) => <SelectItem key={k} value={k}>{v.label} · {k}</SelectItem>)}</SelectContent></Select></div>
        <div><Label>Template</Label><Select value={tpl.key} onValueChange={(v) => setTpl(TEMPLATES.find((t) => t.key === v)!)}><SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>{TEMPLATES.map((t) => <SelectItem key={t.key} value={t.key}>{t.nome}</SelectItem>)}</SelectContent></Select></div>
        <div><Label>Título</Label><Input value={titulo} onChange={(e) => setTitulo(e.target.value)} /></div>
        <div><Label>Subtítulo</Label><Textarea value={subtitulo} onChange={(e) => setSubtitulo(e.target.value)} rows={2} /></div>
        <div><Label>CTA</Label><Input value={cta} onChange={(e) => setCta(e.target.value)} /></div>
        <div className="grid grid-cols-2 gap-2">
          <div><Label>Fundo</Label><input type="color" value={bg} onChange={(e) => setBg(e.target.value)} className="w-full h-9 rounded border" /></div>
          <div><Label>Cor texto</Label><input type="color" value={fg} onChange={(e) => setFg(e.target.value)} className="w-full h-9 rounded border" /></div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" onClick={saveDesign}><Save className="w-4 h-4 mr-1" />Salvar</Button>
          <Button size="sm" variant="outline" onClick={exportPng}><Download className="w-4 h-4 mr-1" />PNG</Button>
        </div>
      </Card>
      <Card className="p-4 flex items-center justify-center bg-muted/30">
        <div className="max-w-full max-h-[70vh] overflow-auto">
          <svg ref={svgRef} viewBox={`0 0 ${f.w} ${f.h}`} width={Math.min(500, f.w)} height={(Math.min(500, f.w) / f.w) * f.h} style={{ background: bg }} xmlns="http://www.w3.org/2000/svg">
            <rect width={f.w} height={f.h} fill={bg} />
            <rect x={f.w * 0.05} y={f.h * 0.4} width={f.w * 0.9} height={6} fill={fg} />
            <text x={f.w / 2} y={f.h * 0.35} fill={fg} fontSize={f.w * 0.09} fontFamily="Rajdhani, Inter, sans-serif" fontWeight="bold" textAnchor="middle">{titulo}</text>
            <foreignObject x={f.w * 0.08} y={f.h * 0.5} width={f.w * 0.84} height={f.h * 0.3}>
              {/* @ts-ignore */}
              <div {...{ xmlns: "http://www.w3.org/1999/xhtml" } as any} style={{ color: fg, fontSize: f.w * 0.04, fontFamily: "Inter, sans-serif", textAlign: "center", lineHeight: 1.3 }}>{subtitulo}</div>
            </foreignObject>
            <rect x={f.w * 0.3} y={f.h * 0.85} width={f.w * 0.4} height={f.h * 0.07} fill={fg} rx={f.h * 0.035} />
            <text x={f.w / 2} y={f.h * 0.9} fill={bg} fontSize={f.w * 0.035} fontFamily="Inter, sans-serif" fontWeight="bold" textAnchor="middle">{cta}</text>
          </svg>
        </div>
      </Card>
    </div>
  );
}

// ========== GALERIA IA ==========
export function ImagesGalleryPage() {
  const { companyId } = useComunicacaoAccess();
  const [items, setItems] = useState<any[]>([]);
  const [prompt, setPrompt] = useState("");
  const [model, setModel] = useState("google/gemini-2.5-flash-image");
  const [format, setFormat] = useState("1080x1080");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  async function load() {
    if (!companyId) return;
    const { data } = await supabase.from("comm_generated_images").select("*").eq("company_id", companyId).eq("is_deleted", false).order("created_at", { ascending: false }).limit(60);
    setItems(data ?? []);
  }
  useEffect(() => { load(); }, [companyId]);

  async function gen() {
    if (!companyId || !prompt) return; setLoading(true);
    try { await commImageGen({ company_id: companyId, prompt, format, model }); toast({ title: "Imagem gerada (rascunho)" }); load(); }
    catch (e: any) { toast({ title: "Erro IA", description: e.message, variant: "destructive" }); }
    finally { setLoading(false); }
  }

  async function approve(id: string, status: "aprovado" | "reprovado") {
    await supabase.from("comm_generated_images").update({ approval_status: status, approved_at: new Date().toISOString() }).eq("id", id);
    load();
  }

  return (
    <div className="space-y-3">
      <Card className="p-4 space-y-2">
        <h2 className="text-xl font-display font-bold flex items-center gap-2"><Sparkles className="w-5 h-5 text-primary" />Galeria IA</h2>
        <Textarea placeholder="Descreva a imagem (ex: capa para post sobre engenharia de fibra ótica, estilo minimalista, cores teal e dark)" value={prompt} onChange={(e) => setPrompt(e.target.value)} rows={3} />
        <div className="flex flex-wrap gap-2">
          <Select value={format} onValueChange={setFormat}><SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent>{Object.keys(FORMATS).map((k) => <SelectItem key={k} value={k}>{k}</SelectItem>)}</SelectContent></Select>
          <Select value={model} onValueChange={setModel}><SelectTrigger className="w-72"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="google/gemini-2.5-flash-image">Nano banana (rápido)</SelectItem>
              <SelectItem value="google/gemini-3.1-flash-image-preview">Nano banana 2 (rápido + qualidade)</SelectItem>
              <SelectItem value="google/gemini-3-pro-image-preview">Nano banana Pro (alta qualidade)</SelectItem>
            </SelectContent></Select>
          <Button onClick={gen} disabled={loading}>{loading ? "Gerando..." : (<><ImageIcon className="w-4 h-4 mr-1" />Gerar imagem</>)}</Button>
        </div>
        <div className="text-[11px] text-muted-foreground">Toda imagem nasce como <b>rascunho</b> — exige aprovação humana antes de ser usada.</div>
      </Card>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {items.map((i) => (
          <Card key={i.id} className="p-2 space-y-1">
            <img src={i.public_url} alt="" className="rounded w-full aspect-square object-cover" />
            <div className="text-[10px] text-muted-foreground line-clamp-2">{i.prompt}</div>
            <div className="text-[10px]"><b>{i.approval_status}</b> · {i.format}</div>
            {i.approval_status === "rascunho" && <div className="flex gap-1">
              <Button size="sm" variant="outline" className="flex-1" onClick={() => approve(i.id, "aprovado")}>Aprovar</Button>
              <Button size="sm" variant="ghost" onClick={() => approve(i.id, "reprovado")}>✕</Button>
            </div>}
            <div className="flex gap-1">
              <Button size="icon" variant="ghost" onClick={() => navigator.clipboard.writeText(i.public_url)}><Copy className="w-3 h-3" /></Button>
              <Button size="icon" variant="ghost" onClick={async () => { const r = prompt("Motivo:"); if (r) { await commSoftDelete("comm_generated_images", i.id, r); load(); } }}><Trash2 className="w-3 h-3" /></Button>
            </div>
          </Card>
        ))}
        {items.length === 0 && <Card className="col-span-full p-6 text-center text-muted-foreground">Nenhuma imagem gerada ainda.</Card>}
      </div>
    </div>
  );
}

// ========== CANVA ==========
export function CanvaPage() {
  const { companyId } = useComunicacaoAccess();
  const [items, setItems] = useState<any[]>([]);
  const [novo, setNovo] = useState<any>({ titulo: "", prompt_briefing: "", formato: "1080x1080", canva_url: "" });
  const { toast } = useToast();
  async function load() { if (!companyId) return; const { data } = await supabase.from("comm_canva_designs").select("*").eq("company_id", companyId).eq("is_deleted", false).order("created_at", { ascending: false }); setItems(data ?? []); }
  useEffect(() => { load(); }, [companyId]);

  function openCanva() {
    const txt = `${novo.titulo}\n\n${novo.prompt_briefing}`;
    navigator.clipboard.writeText(txt).catch(() => {});
    const map: any = { "1080x1080": "InstagramPost", "1080x1920": "InstagramStory", "1200x627": "LinkedInPost", "1600x900": "Presentation", "1080x1350": "InstagramPost" };
    window.open(`https://www.canva.com/design?create&type=${map[novo.formato] || "InstagramPost"}`, "_blank");
    toast({ title: "Briefing copiado", description: "Cole no Canva e cole a URL final aqui depois." });
  }

  async function save() {
    if (!companyId || !novo.titulo) return;
    await supabase.from("comm_canva_designs").insert({ ...novo, company_id: companyId, status: novo.canva_url ? "exportado" : "em_canva" });
    setNovo({ titulo: "", prompt_briefing: "", formato: "1080x1080", canva_url: "" }); load();
  }

  return (
    <div className="space-y-3">
      <Card className="p-4 space-y-2">
        <h2 className="text-xl font-display font-bold flex items-center gap-2"><ExternalLink className="w-5 h-5 text-primary" />Canva Pro — Fluxo Híbrido</h2>
        <div className="text-sm text-muted-foreground">Use o ERP para gerar briefing/legenda e finalize a arte no Canva com seu Brand Kit. Cole a URL aqui ao terminar.</div>
        <Input placeholder="Título do design" value={novo.titulo} onChange={(e) => setNovo({ ...novo, titulo: e.target.value })} />
        <Textarea placeholder="Briefing / prompt visual (será copiado para o clipboard)" rows={4} value={novo.prompt_briefing} onChange={(e) => setNovo({ ...novo, prompt_briefing: e.target.value })} />
        <Select value={novo.formato} onValueChange={(v) => setNovo({ ...novo, formato: v })}><SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
          <SelectContent>{Object.entries(FORMATS).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}</SelectContent></Select>
        <Input placeholder="Cole aqui a URL pública do design Canva (ao finalizar)" value={novo.canva_url} onChange={(e) => setNovo({ ...novo, canva_url: e.target.value })} />
        <div className="flex gap-2">
          <Button onClick={openCanva}><ExternalLink className="w-4 h-4 mr-1" />Abrir Canva (com briefing)</Button>
          <Button variant="outline" onClick={save}><Save className="w-4 h-4 mr-1" />Registrar</Button>
        </div>
      </Card>
      <div className="grid md:grid-cols-2 gap-2">
        {items.map((c) => (
          <Card key={c.id} className="p-3">
            <div className="flex justify-between"><div className="font-medium">{c.titulo}</div><span className="text-xs">{c.status}</span></div>
            <div className="text-xs text-muted-foreground line-clamp-2">{c.prompt_briefing}</div>
            {c.canva_url && <a href={c.canva_url} target="_blank" rel="noreferrer" className="text-xs text-primary underline">Abrir no Canva</a>}
          </Card>
        ))}
      </div>
    </div>
  );
}
