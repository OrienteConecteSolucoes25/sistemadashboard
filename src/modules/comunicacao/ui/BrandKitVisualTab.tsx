import { useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Upload, Trash2, Download, Paperclip, Palette, Type, FileSpreadsheet, X } from "lucide-react";

const sb: any = supabase;
const BUCKET = "comm-brand-assets";

const toArr = (v: any): string[] => {
  if (!v) return [];
  if (Array.isArray(v)) return v.map((s) => String(s).trim()).filter(Boolean);
  return String(v).split(",").map((s) => s.trim()).filter(Boolean);
};

type Anexo = { name: string; url: string; path: string; size?: number; type?: string };

const toAnexos = (v: any): Anexo[] => {
  if (!v) return [];
  if (Array.isArray(v)) return v.filter((x) => x && x.url);
  return [];
};

interface Props {
  edit: any;
  setEdit: (v: any) => void;
}

export default function BrandKitVisualTab({ edit, setEdit }: Props) {
  const [busy, setBusy] = useState(false);
  const logoRef = useRef<HTMLInputElement>(null);
  const anexoRef = useRef<HTMLInputElement>(null);
  const csvCorRef = useRef<HTMLInputElement>(null);
  const csvCorSecRef = useRef<HTMLInputElement>(null);
  const csvFonteRef = useRef<HTMLInputElement>(null);

  const cores = toArr(edit.cores_principais);
  const coresSec = toArr(edit.cores_secundarias);
  const fontes = toArr(edit.fontes);
  const anexos = toAnexos(edit.anexos);

  async function uploadOne(file: File, prefix: string): Promise<{ url: string; path: string } | null> {
    const safe = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const path = `${edit.company_id ?? "tmp"}/${edit.id ?? "novo"}/${prefix}-${Date.now()}-${safe}`;
    const { error } = await sb.storage.from(BUCKET).upload(path, file, { upsert: true });
    if (error) {
      toast.error(`Falha em ${file.name}: ${error.message}`);
      return null;
    }
    const { data } = sb.storage.from(BUCKET).getPublicUrl(path);
    return { url: data.publicUrl, path };
  }

  async function onLogoPick(file: File | null) {
    if (!file) return;
    setBusy(true);
    const r = await uploadOne(file, "logo");
    setBusy(false);
    if (r) {
      setEdit({ ...edit, logo_url: r.url, logo_path: r.path });
      toast.success("Logo enviada");
    }
    if (logoRef.current) logoRef.current.value = "";
  }

  async function onAnexoPick(files: FileList | null) {
    if (!files || files.length === 0) return;
    setBusy(true);
    const next: Anexo[] = [...anexos];
    for (const f of Array.from(files)) {
      const r = await uploadOne(f, "anexo");
      if (r) next.push({ name: f.name, url: r.url, path: r.path, size: f.size, type: f.type });
    }
    setBusy(false);
    setEdit({ ...edit, anexos: next });
    if (anexoRef.current) anexoRef.current.value = "";
  }

  async function removeAnexo(a: Anexo) {
    if (!confirm(`Remover "${a.name}"?`)) return;
    if (a.path) await sb.storage.from(BUCKET).remove([a.path]);
    setEdit({ ...edit, anexos: anexos.filter((x) => x.path !== a.path) });
  }

  function parseCsv(text: string): string[] {
    // aceita uma única coluna "valor" ou separação por vírgula/quebra de linha
    return text
      .replace(/^\ufeff/, "")
      .split(/[\n,;]+/)
      .map((s) => s.trim().replace(/^"|"$/g, ""))
      .filter((s) => s && s.toLowerCase() !== "valor" && s.toLowerCase() !== "cor" && s.toLowerCase() !== "fonte" && s.toLowerCase() !== "tipografia");
  }

  async function importCsv(file: File | null, target: "cores_principais" | "cores_secundarias" | "fontes") {
    if (!file) return;
    const text = await file.text();
    const values = parseCsv(text);
    if (values.length === 0) return toast.error("CSV vazio ou inválido");
    const current = toArr(edit[target]);
    const merged = Array.from(new Set([...current, ...values]));
    setEdit({ ...edit, [target]: merged });
    toast.success(`${values.length} valores importados em ${target.replace("_", " ")}`);
  }

  function downloadModel(kind: "cores" | "fontes") {
    const headers = kind === "cores" ? "cor\n#2BBDC0\n#1a1f26\n#ffffff" : "fonte\nRajdhani\nInter\nMontserrat";
    const blob = new Blob(["\ufeff" + headers], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `modelo-${kind}-brandkit.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function addCor(target: "cores_principais" | "cores_secundarias") {
    const v = window.prompt("Cor (hex ou nome):");
    if (!v) return;
    setEdit({ ...edit, [target]: [...toArr(edit[target]), v.trim()] });
  }

  function removeCor(target: "cores_principais" | "cores_secundarias", idx: number) {
    const arr = toArr(edit[target]);
    arr.splice(idx, 1);
    setEdit({ ...edit, [target]: arr });
  }

  function addFonte() {
    const v = window.prompt("Nome da fonte:");
    if (!v) return;
    setEdit({ ...edit, fontes: [...toArr(edit.fontes), v.trim()] });
  }

  function removeFonte(idx: number) {
    const arr = toArr(edit.fontes);
    arr.splice(idx, 1);
    setEdit({ ...edit, fontes: arr });
  }

  return (
    <Card className="p-4 space-y-5">
      {/* LOGO */}
      <section className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="font-semibold">Logo da marca</Label>
          {edit.logo_url && (
            <Button type="button" variant="ghost" size="sm" onClick={() => setEdit({ ...edit, logo_url: "", logo_path: "" })}>
              <X className="w-3 h-3 mr-1" /> Remover
            </Button>
          )}
        </div>
        <div className="flex items-center gap-3">
          {edit.logo_url ? (
            <img src={edit.logo_url} alt="logo" className="h-20 w-20 object-contain border rounded p-1 bg-card" />
          ) : (
            <div className="h-20 w-20 border-2 border-dashed rounded flex items-center justify-center text-muted-foreground text-xs">Sem logo</div>
          )}
          <div className="flex-1 space-y-2">
            <input ref={logoRef} type="file" accept="image/*" hidden onChange={(e) => onLogoPick(e.target.files?.[0] ?? null)} />
            <Button type="button" variant="outline" size="sm" disabled={busy} onClick={() => logoRef.current?.click()}>
              <Upload className="w-4 h-4 mr-1" /> {busy ? "Enviando..." : "Enviar logo (PNG/JPG/SVG)"}
            </Button>
            <Input value={edit.logo_url ?? ""} onChange={(e) => setEdit({ ...edit, logo_url: e.target.value })} placeholder="ou cole uma URL" className="text-xs" />
          </div>
        </div>
      </section>

      <div className="border-t" />

      {/* ESTILO */}
      <div>
        <Label>Estilo visual</Label>
        <Input value={edit.estilo_visual ?? ""} onChange={(e) => setEdit({ ...edit, estilo_visual: e.target.value })} placeholder="Ex: limpo, geométrico, minimalista" />
      </div>

      {/* CORES PRINCIPAIS */}
      <section className="space-y-2">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <Label className="font-semibold flex items-center gap-1"><Palette className="w-4 h-4" /> Cores principais</Label>
          <div className="flex gap-1">
            <input ref={csvCorRef} type="file" accept=".csv" hidden onChange={(e) => importCsv(e.target.files?.[0] ?? null, "cores_principais")} />
            <Button type="button" size="sm" variant="ghost" onClick={() => downloadModel("cores")}><Download className="w-3 h-3 mr-1" /> Modelo CSV</Button>
            <Button type="button" size="sm" variant="outline" onClick={() => csvCorRef.current?.click()}><FileSpreadsheet className="w-3 h-3 mr-1" /> Importar CSV</Button>
            <Button type="button" size="sm" onClick={() => addCor("cores_principais")}>+ Cor</Button>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {cores.map((c, i) => (
            <div key={i} className="flex items-center gap-1 border rounded px-2 py-1 bg-card">
              <span style={{ background: c }} className="w-4 h-4 rounded border" />
              <input value={c} onChange={(e) => { const arr = [...cores]; arr[i] = e.target.value; setEdit({ ...edit, cores_principais: arr }); }} className="bg-transparent text-xs w-20 outline-none" />
              <button type="button" onClick={() => removeCor("cores_principais", i)} className="text-muted-foreground hover:text-destructive"><X className="w-3 h-3" /></button>
            </div>
          ))}
          {cores.length === 0 && <p className="text-xs text-muted-foreground">Nenhuma cor cadastrada.</p>}
        </div>
      </section>

      {/* CORES SECUNDÁRIAS */}
      <section className="space-y-2">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <Label className="font-semibold flex items-center gap-1"><Palette className="w-4 h-4" /> Cores secundárias</Label>
          <div className="flex gap-1">
            <input ref={csvCorSecRef} type="file" accept=".csv" hidden onChange={(e) => importCsv(e.target.files?.[0] ?? null, "cores_secundarias")} />
            <Button type="button" size="sm" variant="outline" onClick={() => csvCorSecRef.current?.click()}><FileSpreadsheet className="w-3 h-3 mr-1" /> Importar CSV</Button>
            <Button type="button" size="sm" onClick={() => addCor("cores_secundarias")}>+ Cor</Button>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {coresSec.map((c, i) => (
            <div key={i} className="flex items-center gap-1 border rounded px-2 py-1 bg-card">
              <span style={{ background: c }} className="w-4 h-4 rounded border" />
              <input value={c} onChange={(e) => { const arr = [...coresSec]; arr[i] = e.target.value; setEdit({ ...edit, cores_secundarias: arr }); }} className="bg-transparent text-xs w-20 outline-none" />
              <button type="button" onClick={() => removeCor("cores_secundarias", i)} className="text-muted-foreground hover:text-destructive"><X className="w-3 h-3" /></button>
            </div>
          ))}
          {coresSec.length === 0 && <p className="text-xs text-muted-foreground">Nenhuma cor cadastrada.</p>}
        </div>
      </section>

      {/* FONTES / TIPOGRAFIAS */}
      <section className="space-y-2">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <Label className="font-semibold flex items-center gap-1"><Type className="w-4 h-4" /> Fontes / Tipografias</Label>
          <div className="flex gap-1">
            <input ref={csvFonteRef} type="file" accept=".csv" hidden onChange={(e) => importCsv(e.target.files?.[0] ?? null, "fontes")} />
            <Button type="button" size="sm" variant="ghost" onClick={() => downloadModel("fontes")}><Download className="w-3 h-3 mr-1" /> Modelo CSV</Button>
            <Button type="button" size="sm" variant="outline" onClick={() => csvFonteRef.current?.click()}><FileSpreadsheet className="w-3 h-3 mr-1" /> Importar CSV</Button>
            <Button type="button" size="sm" onClick={addFonte}>+ Fonte</Button>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {fontes.map((f, i) => (
            <div key={i} className="flex items-center gap-1 border rounded px-2 py-1 bg-card">
              <input value={f} style={{ fontFamily: f }} onChange={(e) => { const arr = [...fontes]; arr[i] = e.target.value; setEdit({ ...edit, fontes: arr }); }} className="bg-transparent text-sm outline-none min-w-[80px]" />
              <button type="button" onClick={() => removeFonte(i)} className="text-muted-foreground hover:text-destructive"><X className="w-3 h-3" /></button>
            </div>
          ))}
          {fontes.length === 0 && <p className="text-xs text-muted-foreground">Nenhuma fonte cadastrada.</p>}
        </div>
      </section>

      <div className="border-t" />

      {/* ANEXOS */}
      <section className="space-y-2">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <Label className="font-semibold flex items-center gap-1"><Paperclip className="w-4 h-4" /> Anexos da marca</Label>
          <div className="flex items-center gap-2">
            <Badge variant="secondary">{anexos.length}</Badge>
            <input ref={anexoRef} type="file" multiple hidden onChange={(e) => onAnexoPick(e.target.files)} />
            <Button type="button" size="sm" variant="outline" disabled={busy} onClick={() => anexoRef.current?.click()}>
              <Upload className="w-4 h-4 mr-1" /> Anexar arquivos
            </Button>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">Manual de marca (PDF), guidelines, mockups, ícones, fontes (.ttf/.otf), papel timbrado, etc.</p>
        {anexos.length > 0 && (
          <ul className="space-y-1">
            {anexos.map((a) => (
              <li key={a.path} className="text-xs flex items-center justify-between border rounded px-2 py-1 bg-card">
                <a href={a.url} target="_blank" rel="noreferrer" className="truncate flex-1 hover:text-primary">{a.name}</a>
                <div className="flex gap-1">
                  <a href={a.url} target="_blank" rel="noreferrer" className="p-1"><Download className="w-3 h-3" /></a>
                  <button type="button" onClick={() => removeAnexo(a)} className="p-1"><Trash2 className="w-3 h-3" /></button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </Card>
  );
}
