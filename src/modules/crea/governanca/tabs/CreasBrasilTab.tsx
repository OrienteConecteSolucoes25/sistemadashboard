import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, MapPin, Save, FileUp, Eye } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useGovCompany } from "../lib/useGovCompany";
import { parsePdfFile, PdfPagina } from "../lib/govPdfParse";

interface CreaConfig {
  id: string;
  uf: string;
  nome: string;
  taxa_padrao: number | null;
  status: string;
  observacoes: string | null;
  layout_xls: any;
  regras_extracao: any;
  campos_personalizados: any;
}

export function CreasBrasilTab() {
  const { companyId } = useGovCompany();
  const [list, setList] = useState<CreaConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState("");
  const [sel, setSel] = useState<CreaConfig | null>(null);
  const [pdfModal, setPdfModal] = useState(false);

  async function load() {
    setLoading(true);
    const { data, error } = await supabase
      .from("crea_gov_creas_config")
      .select("*").order("uf");
    if (error) toast.error(error.message);
    else setList((data ?? []) as CreaConfig[]);
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  const filtrados = useMemo(() => {
    if (!busca) return list;
    const s = busca.toLowerCase();
    return list.filter(c => c.uf.toLowerCase().includes(s) || c.nome.toLowerCase().includes(s));
  }, [list, busca]);

  async function save(c: CreaConfig) {
    const { error } = await supabase.from("crea_gov_creas_config").update({
      nome: c.nome, taxa_padrao: c.taxa_padrao, status: c.status,
      observacoes: c.observacoes, layout_xls: c.layout_xls,
      regras_extracao: c.regras_extracao, campos_personalizados: c.campos_personalizados,
    }).eq("id", c.id);
    if (error) return toast.error(error.message);
    toast.success("Configuração salva.");
    load(); setSel(null);
  }

  return (
    <div className="space-y-4">
      <Card className="card-elegant">
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" />
            <CardTitle className="text-base">CREAs Brasil — 27 UFs</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <Input className="max-w-xs" placeholder="Buscar UF ou nome…" value={busca} onChange={e => setBusca(e.target.value)} />
            <Button size="sm" variant="outline" onClick={() => setPdfModal(true)} disabled={!companyId}>
              <FileUp className="h-4 w-4 mr-1" /> Conferir PDF
            </Button>
          </div>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {loading ? (
            <div className="py-12 text-center"><Loader2 className="h-5 w-5 animate-spin inline" /></div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>UF</TableHead>
                  <TableHead>Nome</TableHead>
                  <TableHead className="text-right">Taxa padrão</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Layout XLS</TableHead>
                  <TableHead>Campos extras</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtrados.map(c => (
                  <TableRow key={c.id}>
                    <TableCell className="font-mono font-bold">{c.uf}</TableCell>
                    <TableCell className="text-sm">{c.nome}</TableCell>
                    <TableCell className="text-right">R$ {Number(c.taxa_padrao ?? 0).toFixed(2)}</TableCell>
                    <TableCell>
                      <Badge variant={c.status === "ativo" ? "default" : "secondary"}>{c.status}</Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {Object.keys(c.layout_xls ?? {}).length || "—"}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {Object.keys(c.campos_personalizados ?? {}).length || "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" variant="ghost" onClick={() => setSel(c)}>
                        <Eye className="h-3.5 w-3.5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {sel && <CreaEditModal config={sel} onClose={() => setSel(null)} onSave={save} />}
      {pdfModal && <PdfConferenciaModal companyId={companyId} onClose={() => setPdfModal(false)} ufs={list.map(c => c.uf)} />}
    </div>
  );
}

function CreaEditModal({ config, onClose, onSave }: { config: CreaConfig; onClose: () => void; onSave: (c: CreaConfig) => void }) {
  const [c, setC] = useState(config);
  const setLayoutText = (txt: string) => { try { setC({ ...c, layout_xls: txt ? JSON.parse(txt) : {} }); } catch { /* keep */ } };
  const setRegrasText = (txt: string) => { try { setC({ ...c, regras_extracao: txt ? JSON.parse(txt) : {} }); } catch { /* keep */ } };
  const setCamposText = (txt: string) => { try { setC({ ...c, campos_personalizados: txt ? JSON.parse(txt) : {} }); } catch { /* keep */ } };

  return (
    <Dialog open onOpenChange={v => { if (!v) onClose(); }}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{c.nome}</DialogTitle></DialogHeader>
        <Tabs defaultValue="geral">
          <TabsList>
            <TabsTrigger value="geral">Geral</TabsTrigger>
            <TabsTrigger value="layout">Layout XLS</TabsTrigger>
            <TabsTrigger value="regras">Regras de extração</TabsTrigger>
            <TabsTrigger value="campos">Campos extras</TabsTrigger>
          </TabsList>
          <TabsContent value="geral" className="space-y-3">
            <div><Label>Nome</Label><Input value={c.nome} onChange={e => setC({ ...c, nome: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Taxa padrão (R$)</Label>
                <Input type="number" step="0.01" value={c.taxa_padrao ?? ""} onChange={e => setC({ ...c, taxa_padrao: e.target.value ? Number(e.target.value) : null })} /></div>
              <div><Label>Status</Label>
                <Select value={c.status} onValueChange={v => setC({ ...c, status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ativo">Ativo</SelectItem>
                    <SelectItem value="inativo">Inativo</SelectItem>
                    <SelectItem value="manutencao">Em manutenção</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div><Label>Observações</Label>
              <Textarea rows={3} value={c.observacoes ?? ""} onChange={e => setC({ ...c, observacoes: e.target.value })} /></div>
          </TabsContent>
          <TabsContent value="layout">
            <p className="text-xs text-muted-foreground mb-2">Mapa coluna → campo do importador. Ex.: {`{ "A": "numero", "B": "uf" }`}</p>
            <Textarea rows={10} className="font-mono text-xs"
              defaultValue={JSON.stringify(c.layout_xls ?? {}, null, 2)} onChange={e => setLayoutText(e.target.value)} />
          </TabsContent>
          <TabsContent value="regras">
            <p className="text-xs text-muted-foreground mb-2">Regras de pós-processamento. Ex.: {`{ "trim_uf": true, "max_taxa": 500 }`}</p>
            <Textarea rows={10} className="font-mono text-xs"
              defaultValue={JSON.stringify(c.regras_extracao ?? {}, null, 2)} onChange={e => setRegrasText(e.target.value)} />
          </TabsContent>
          <TabsContent value="campos">
            <p className="text-xs text-muted-foreground mb-2">Campos personalizados deste CREA. Ex.: {`{ "centro_custo_padrao": "ENG-RT" }`}</p>
            <Textarea rows={10} className="font-mono text-xs"
              defaultValue={JSON.stringify(c.campos_personalizados ?? {}, null, 2)} onChange={e => setCamposText(e.target.value)} />
          </TabsContent>
        </Tabs>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button onClick={() => onSave(c)}><Save className="h-4 w-4 mr-1" /> Salvar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function PdfConferenciaModal({ companyId, onClose, ufs }: { companyId: string | null; onClose: () => void; ufs: string[] }) {
  const [file, setFile] = useState<File | null>(null);
  const [uf, setUf] = useState<string>("");
  const [paginas, setPaginas] = useState<PdfPagina[]>([]);
  const [progress, setProgress] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);

  async function processar() {
    if (!file) return;
    setProgress("Iniciando…");
    try {
      const r = await parsePdfFile(file, (n, t) => setProgress(`Página ${n} / ${t}`));
      setPaginas(r);
      setProgress(`${r.length} página(s) extraídas.`);
    } catch (e: any) {
      toast.error(e?.message ?? "Falha no parsing");
      setProgress(null);
    }
  }

  async function salvar() {
    if (!companyId || paginas.length === 0) return;
    setSalvando(true);
    try {
      const rows = paginas.map(p => ({
        company_id: companyId, uf: uf || null,
        numero_pagina: p.numero_pagina, total_paginas: paginas.length,
        texto: p.texto.slice(0, 50000),
        tabelas: p.tabelas as any, metadata: p.metadata as any, status: "extraido",
      }));
      const { error } = await supabase.from("crea_gov_pdf_paginas").insert(rows);
      if (error) throw error;
      toast.success(`${rows.length} página(s) salvas.`);
      onClose();
    } catch (e: any) {
      toast.error(e?.message ?? "Falha ao salvar");
    } finally { setSalvando(false); }
  }

  return (
    <Dialog open onOpenChange={v => { if (!v) onClose(); }}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Conferência de PDF do CREA</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div className="flex items-end gap-2">
            <div className="flex-1">
              <Label>Arquivo PDF</Label>
              <Input type="file" accept="application/pdf" onChange={e => setFile(e.target.files?.[0] ?? null)} />
            </div>
            <div className="w-32">
              <Label>UF</Label>
              <Select value={uf} onValueChange={setUf}>
                <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                <SelectContent>{ufs.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <Button onClick={processar} disabled={!file}>
              <FileUp className="h-4 w-4 mr-1" /> Extrair
            </Button>
          </div>
          {progress && <p className="text-xs text-muted-foreground">{progress}</p>}
          {paginas.length > 0 && (
            <div className="border border-border/60 rounded-md p-3 max-h-[400px] overflow-y-auto space-y-3">
              {paginas.slice(0, 5).map(p => (
                <div key={p.numero_pagina}>
                  <p className="text-xs font-semibold mb-1">
                    Página {p.numero_pagina} · {p.metadata.colunas_detectadas} coluna(s) · {p.metadata.numero_linhas} linha(s)
                  </p>
                  {p.tabelas[0] ? (
                    <div className="overflow-x-auto text-xs border border-border/40 rounded">
                      <table className="w-full">
                        <tbody>
                          {p.tabelas[0].slice(0, 10).map((row, i) => (
                            <tr key={i} className={i === 0 ? "bg-muted/30 font-semibold" : ""}>
                              {row.map((c, j) => <td key={j} className="px-2 py-1 border-r border-border/20">{c}</td>)}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : <p className="text-xs text-muted-foreground">{p.texto.slice(0, 200)}…</p>}
                </div>
              ))}
              {paginas.length > 5 && <p className="text-xs text-muted-foreground">+ {paginas.length - 5} página(s)…</p>}
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Fechar</Button>
          <Button onClick={salvar} disabled={paginas.length === 0 || salvando || !companyId}>
            {salvando && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
            Salvar {paginas.length} página(s)
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
