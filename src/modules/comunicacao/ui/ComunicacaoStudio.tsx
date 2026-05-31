import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useComunicacaoAccess } from "../hooks/useComunicacaoAccess";
import { useActiveBrandKit } from "../hooks/useActiveBrandKit";
import { commImageGen, commImageAuto, commSoftDelete } from "../lib/api";
import { FreeAiToggle } from "./FreeAiToggle";
import { Sparkles, Save, Download, Copy, ExternalLink, Trash2, Image as ImageIcon, Grid3x3, RefreshCcw, Loader2, Package } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import JSZip from "jszip";
import { saveAs } from "file-saver";

async function convertImageBlob(url: string, format: "png" | "jpg"): Promise<Blob> {
  const res = await fetch(url, { mode: "cors" });
  const srcBlob = await res.blob();
  // PNG sem reencode se já for PNG; JPG sempre reencoda via canvas
  if (format === "png" && srcBlob.type === "image/png") return srcBlob;
  const bitmap = await createImageBitmap(srcBlob);
  const canvas = document.createElement("canvas");
  canvas.width = bitmap.width; canvas.height = bitmap.height;
  const ctx = canvas.getContext("2d")!;
  if (format === "jpg") { ctx.fillStyle = "#ffffff"; ctx.fillRect(0, 0, canvas.width, canvas.height); }
  ctx.drawImage(bitmap, 0, 0);
  const mime = format === "jpg" ? "image/jpeg" : "image/png";
  return await new Promise<Blob>((resolve) => canvas.toBlob((b) => resolve(b!), mime, 0.92));
}

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
    <Tabs defaultValue="grid">
      <TabsList>
        <TabsTrigger value="grid"><Grid3x3 className="w-4 h-4 mr-1" />Grade Instagram 3x3 (IA)</TabsTrigger>
        <TabsTrigger value="single">Editor de Card único (template)</TabsTrigger>
      </TabsList>

      <TabsContent value="grid" className="mt-4">
        <InstagramGridGenerator />
      </TabsContent>

      <TabsContent value="single" className="mt-4">
        <div className="grid lg:grid-cols-[320px_1fr] gap-4">
          <Card className="p-4 space-y-3">
            <h2 className="text-lg font-display font-bold">Card único</h2>
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
      </TabsContent>
    </Tabs>
  );
}

// ========== INSTAGRAM 3x3 GRID GENERATOR (IA) ==========
// Cada tipo é uma CENA VISUAL concreta — evita que Flux/Pollinations caia em retratos por padrão.
const GRID_TYPES = [
  "abstract geometric cover composition, bold shapes, minimal, no people",
  "large minimalist typography poster on flat colored background, no people",
  "top-down flat lay of simple objects related to the theme on clean surface, no people",
  "isometric flat illustration of the concept, modern vector style, soft shadows, no people",
  "minimal editorial still life photograph related to the theme, soft natural light, no people",
  "bold call-to-action banner with arrow and geometric shapes, high contrast, no people",
  "behind the scenes desk scene: laptop, notebook, coffee, plants, top down, no people visible",
  "infographic with a big bold number in the center and simple line icons, clean background, no people",
  "numbered series cover styled '1 / 9' as huge typography, abstract background, no people",
];

function InstagramGridGenerator() {
  const { companyId } = useComunicacaoAccess();
  const { activeBrand } = useActiveBrandKit();
  const { toast } = useToast();
  const [tema, setTema] = useState("");
  const [estilo, setEstilo] = useState("minimalist modern editorial, clean composition");
  const [colors, setColors] = useState<string[]>(["#2BBDC0", "#1a1f26", "#ffffff", "#facc15"]);
  const [results, setResults] = useState<(any | null)[]>(Array(9).fill(null));
  const [loading, setLoading] = useState<boolean[]>(Array(9).fill(false));
  const [running, setRunning] = useState(false);

  useEffect(() => {
    if (activeBrand?.cores_principais?.length) {
      const novas = [...activeBrand.cores_principais, ...(activeBrand.cores_secundarias ?? []), "#ffffff"].slice(0, 4);
      while (novas.length < 4) novas.push("#ffffff");
      setColors(novas);
    }
  }, [activeBrand?.id]);

  function buildPrompt(idx: number) {
    const palette = colors.join(", ");
    // Tema vai NA FRENTE para o modelo ancorar nele. Cena visual descrita em inglês (Flux entende melhor).
    return [
      `Theme/concept: "${tema}".`,
      `Visual scene: ${GRID_TYPES[idx]}.`,
      `Must visually represent the theme above through objects, symbols, environment or typography — not generic portraits.`,
      `Style: ${estilo}, square 1:1 social media post, editorial layout, professional, high quality.`,
      `Strict color palette — use ONLY these hex tones as dominant colors: ${palette}.`,
      `Consistent visual language across the 9 posts: same palette, same style, same composition logic.`,
      `NO people, NO faces, NO portraits, NO humans, NO watermarks, NO logos, NO random text, NO blurry letters.`,
    ].join(" ");
  }

  async function genOne(idx: number) {
    if (!companyId || !tema) return;
    setLoading((l) => l.map((v, i) => (i === idx ? true : v)));
    try {
      const r = await commImageAuto({
        company_id: companyId,
        brand_kit_id: activeBrand?.id,
        prompt: buildPrompt(idx),
        format: "1080x1080",
        preferred: "pollinations",
        model: "google/gemini-3.1-flash-image-preview",
      });
      if (r?.image) {
        setResults((arr) => arr.map((v, i) => (i === idx ? r.image : v)));
        return true;
      } else {
        const msg = r?.error === "daily_quota"
          ? `Limite diário de imagens atingido (${r.limit ?? 50}).`
          : r?.error === "monthly_quota"
            ? `Limite mensal de imagens atingido (${r.limit ?? 200}).`
            : r?.error === "credits_exhausted"
              ? "Créditos de IA indisponíveis no momento."
              : r?.error === "rate_limited"
                ? "A geração foi temporariamente limitada."
                : r?.detail || "A imagem não foi gerada.";
        toast({ title: `Card ${idx + 1} não gerado`, description: msg, variant: "destructive" });
        return false;
      }
    } catch (e: any) {
      toast({ title: `Card ${idx + 1} falhou`, description: e.message, variant: "destructive" });
      return false;
    } finally {
      setLoading((l) => l.map((v, i) => (i === idx ? false : v)));
    }
  }

  async function genAll() {
    if (!companyId) return toast({ title: "Sem empresa", variant: "destructive" });
    if (!tema) return toast({ title: "Informe o tema da grade", variant: "destructive" });
    if (!activeBrand) return toast({ title: "Selecione um Brand Kit ativo", variant: "destructive" });
    setRunning(true);
    setResults(Array(9).fill(null));
    let successCount = 0;
    // concurrency 3
    const pool: number[] = [];
    for (let i = 0; i < 9; i++) pool.push(i);
    async function worker() {
      while (pool.length) {
        const idx = pool.shift()!;
        if (await genOne(idx)) successCount += 1;
      }
    }
    await Promise.all([worker(), worker(), worker()]);
    setRunning(false);
    toast({
      title: successCount > 0 ? "Geração concluída" : "Nenhuma imagem gerada",
      description: successCount > 0
        ? `${successCount} imagem(ns) gerada(s) como rascunho.`
        : "Verifique a mensagem de quota/limite exibida durante a geração.",
      variant: successCount > 0 ? undefined : "destructive",
    });
  }

  function downloadOne(idx: number) {
    const img = results[idx];
    if (!img?.public_url) return;
    const a = document.createElement("a");
    a.href = img.public_url;
    a.download = `grid-${idx + 1}.png`;
    a.target = "_blank";
    a.click();
  }

  return (
    <div className="grid lg:grid-cols-[340px_1fr] gap-4">
      <Card className="p-4 space-y-3">
        <h2 className="text-lg font-display font-bold flex items-center gap-2"><Grid3x3 className="w-5 h-5 text-primary" />Grade 3x3 IA</h2>
        <div className="text-xs text-muted-foreground">
          Marca ativa: <b>{activeBrand?.nome ?? "—"}</b>
          {!activeBrand && <div className="text-destructive">Selecione um Brand Kit no topo.</div>}
        </div>

        <div>
          <Label>Tema da grade</Label>
          <Input value={tema} onChange={(e) => setTema(e.target.value)} placeholder="Ex: lançamento do módulo CREA, dicas de fibra ótica..." />
        </div>

        <div>
          <Label>Paleta (4 cores)</Label>
          <div className="grid grid-cols-4 gap-1">
            {colors.map((c, i) => (
              <input key={i} type="color" value={c}
                onChange={(e) => setColors((arr) => arr.map((v, j) => (j === i ? e.target.value : v)))}
                className="w-full h-10 rounded border" />
            ))}
          </div>
        </div>

        <div>
          <Label>Estilo visual</Label>
          <Input value={estilo} onChange={(e) => setEstilo(e.target.value)} />
        </div>

        <Button onClick={genAll} disabled={running || !activeBrand || !tema} className="w-full">
          {running ? <><Loader2 className="w-4 h-4 mr-1 animate-spin" />Gerando 9 cards...</> : <><Sparkles className="w-4 h-4 mr-1" />Gerar Grade 3x3</>}
        </Button>

        <div className="text-[11px] text-muted-foreground">
          Usa Nano Banana 2 (alta qualidade + rápido). Cada imagem nasce como <b>rascunho</b> — vá em Galeria IA para aprovar.
        </div>
      </Card>

      <Card className="p-4">
        <div className="text-sm font-medium mb-2">Pré-visualização (feed Instagram)</div>
        <div className="grid grid-cols-3 gap-1 max-w-[600px] mx-auto">
          {results.map((img, idx) => (
            <div key={idx} className="aspect-square relative bg-muted/40 rounded overflow-hidden border group">
              {loading[idx] && (
                <div className="absolute inset-0 flex items-center justify-center bg-background/70 z-10">
                  <Loader2 className="w-5 h-5 animate-spin text-primary" />
                </div>
              )}
              {img?.public_url ? (
                <>
                  <img src={img.public_url} alt={`card ${idx + 1}`} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 bg-black/50 flex items-center justify-center gap-1 transition">
                    <Button size="icon" variant="secondary" onClick={() => genOne(idx)} title="Regenerar">
                      <RefreshCcw className="w-3 h-3" />
                    </Button>
                    <Button size="icon" variant="secondary" onClick={() => downloadOne(idx)} title="Baixar">
                      <Download className="w-3 h-3" />
                    </Button>
                  </div>
                </>
              ) : (
                <div className="w-full h-full flex items-center justify-center text-[10px] text-muted-foreground">
                  {idx + 1}/9
                </div>
              )}
              <div className="absolute top-1 left-1 bg-background/80 text-[9px] px-1 rounded">
                {idx + 1}
              </div>
            </div>
          ))}
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
  const [model, setModel] = useState("google/gemini-3.1-flash-image-preview");
  const [format, setFormat] = useState("1080x1080");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  async function load() {
    if (!companyId) return;
    const { data } = await supabase.from("comm_generated_images").select("*").eq("company_id", companyId).eq("is_deleted", false).order("created_at", { ascending: false }).limit(60);
    const list = data ?? [];
    // Refresca signed URLs (as antigas expiram em 7 dias). Sem storage_path mantém a pública/legada.
    const refreshed = await Promise.all(list.map(async (it: any) => {
      if (!it.storage_path) return it;
      const { data: s } = await supabase.storage.from("comm-generated-images").createSignedUrl(it.storage_path, 60 * 60 * 24 * 7);
      return s?.signedUrl ? { ...it, public_url: s.signedUrl } : it;
    }));
    setItems(refreshed);
  }
  useEffect(() => { load(); }, [companyId]);

  async function gen() {
    if (!companyId || !prompt) return; setLoading(true);
    try {
      const r = await commImageAuto({ company_id: companyId, prompt, format, model, preferred: "pollinations" });
      if (r?.image) {
        toast({ title: "Imagem gerada (rascunho)" });
        load();
      } else {
        const msg = r?.error === "daily_quota"
          ? `Limite diário de imagens atingido (${r.limit ?? 50}).`
          : r?.error === "monthly_quota"
            ? `Limite mensal de imagens atingido (${r.limit ?? 200}).`
            : r?.error === "credits_exhausted"
              ? "Créditos de IA indisponíveis no momento."
              : r?.error === "rate_limited"
                ? "A geração foi temporariamente limitada."
                : r?.detail || "A imagem não foi gerada.";
        toast({ title: "Imagem não gerada", description: msg, variant: "destructive" });
      }
    }
    catch (e: any) { toast({ title: "Erro IA", description: e.message, variant: "destructive" }); }
    finally { setLoading(false); }
  }

  async function approve(id: string, status: "aprovado" | "reprovado") {
    await supabase.from("comm_generated_images").update({ approval_status: status, approved_at: new Date().toISOString() }).eq("id", id);
    load();
  }

  const [zipping, setZipping] = useState(false);
  async function downloadBatch(format: "png" | "jpg", scope: "approved" | "all") {
    const pool = items.filter((i) => i.public_url && (scope === "all" || i.approval_status === "aprovado"));
    if (pool.length === 0) { toast({ title: "Nenhuma imagem para baixar" }); return; }
    setZipping(true);
    try {
      const zip = new JSZip();
      let ok = 0, fail = 0;
      await Promise.all(pool.map(async (img, idx) => {
        try {
          const blob = await convertImageBlob(img.public_url, format);
          const status = (img.approval_status || "rascunho").slice(0, 10);
          const safe = (img.prompt || "imagem").slice(0, 40).replace(/[^a-z0-9-_]+/gi, "_").toLowerCase();
          zip.file(`${String(idx + 1).padStart(3, "0")}_${status}_${safe}.${format}`, blob);
          ok++;
        } catch { fail++; }
      }));
      const out = await zip.generateAsync({ type: "blob" });
      saveAs(out, `imagens_${scope}_${format}_${new Date().toISOString().slice(0, 10)}.zip`);
      toast({ title: `Baixado (${ok}/${pool.length})`, description: fail ? `${fail} falharam` : undefined });
    } catch (e: any) { toast({ title: "Erro ao gerar zip", description: e.message, variant: "destructive" }); }
    finally { setZipping(false); }
  }

  const approvedCount = items.filter((i) => i.approval_status === "aprovado").length;
  const totalCount = items.length;

  return (
    <div className="space-y-3">
      <Card className="p-4 space-y-2">
        <div className="flex items-start justify-between gap-2 flex-wrap">
          <h2 className="text-xl font-display font-bold flex items-center gap-2"><Sparkles className="w-5 h-5 text-primary" />Galeria IA</h2>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" disabled={zipping || approvedCount === 0}>
                {zipping ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Package className="w-4 h-4 mr-1" />}
                Baixar aprovadas ({approvedCount})
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => downloadApproved("png")}><ImageIcon className="w-4 h-4 mr-2" />ZIP em PNG</DropdownMenuItem>
              <DropdownMenuItem onClick={() => downloadApproved("jpg")}><ImageIcon className="w-4 h-4 mr-2" />ZIP em JPG</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
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
          <Button asChild variant="outline" disabled={loading}>
            <label className="cursor-pointer">
              <ImageIcon className="w-4 h-4 mr-1" />
              {loading ? "Enviando..." : "Upload logo/foto (sem IA)"}
              <input
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={async (e) => {
                  const files = Array.from(e.target.files || []);
                  e.currentTarget.value = "";
                  if (!companyId || files.length === 0) return;
                  setLoading(true);
                  let ok = 0, fail = 0;
                  for (const file of files) {
                    try {
                      const ext = (file.name.split(".").pop() || "png").toLowerCase().replace(/[^a-z0-9]/g, "") || "png";
                      const path = `${companyId}/${new Date().getFullYear()}/upload-${crypto.randomUUID()}.${ext}`;
                      const { error: upErr } = await supabase.storage.from("comm-generated-images").upload(path, file, { contentType: file.type || "image/png", upsert: false });
                      if (upErr) throw upErr;
                      const { data: signed } = await supabase.storage.from("comm-generated-images").createSignedUrl(path, 60 * 60 * 24 * 365);
                      const { error: insErr } = await supabase.from("comm_generated_images").insert({
                        company_id: companyId, prompt: `[Upload] ${file.name}`, prompt_revisado: `[Upload] ${file.name}`,
                        provider: "upload", model: "upload", format,
                        storage_path: path, public_url: signed?.signedUrl ?? null,
                        tokens_in: 0, tokens_out: 0, status: "ready", approval_status: "aprovado", ai_generated: false,
                      } as any);
                      if (insErr) throw insErr;
                      ok++;
                    } catch (err: any) { console.error(err); fail++; }
                  }
                  setLoading(false);
                  toast({ title: `Upload concluído (${ok}/${files.length})`, description: fail ? `${fail} falharam` : "Sem consumo de créditos IA." });
                  load();
                }}
              />
            </label>
          </Button>
        </div>
        <div className="text-[11px] text-muted-foreground">Imagens IA nascem como <b>rascunho</b> e exigem aprovação. Uploads de logo/foto entram já <b>aprovados</b> e não consomem créditos.</div>

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
            <div className="flex gap-1 flex-wrap">
              <Button size="icon" variant="ghost" onClick={() => navigator.clipboard.writeText(i.public_url)}><Copy className="w-3 h-3" /></Button>
              {i.approval_status === "aprovado" && (<>
                <Button size="sm" variant="outline" className="h-7 px-2 text-[10px]" onClick={async () => {
                  try { const blob = await convertImageBlob(i.public_url, "png"); const safe = (i.prompt || "imagem").slice(0, 40).replace(/[^a-z0-9-_]+/gi, "_").toLowerCase(); saveAs(blob, `${safe}.png`); }
                  catch (e: any) { toast({ title: "Erro ao baixar", description: e.message, variant: "destructive" }); }
                }}><Download className="w-3 h-3 mr-1" />PNG</Button>
                <Button size="sm" variant="outline" className="h-7 px-2 text-[10px]" onClick={async () => {
                  try { const blob = await convertImageBlob(i.public_url, "jpg"); const safe = (i.prompt || "imagem").slice(0, 40).replace(/[^a-z0-9-_]+/gi, "_").toLowerCase(); saveAs(blob, `${safe}.jpg`); }
                  catch (e: any) { toast({ title: "Erro ao baixar", description: e.message, variant: "destructive" }); }
                }}><Download className="w-3 h-3 mr-1" />JPG</Button>
              </>)}
              <Button size="icon" variant="ghost" onClick={async () => { const r = window.prompt("Motivo:"); if (r) { await commSoftDelete("comm_generated_images", i.id, r); load(); } }}><Trash2 className="w-3 h-3" /></Button>
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
