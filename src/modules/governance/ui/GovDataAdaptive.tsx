/**
 * Dados auto-adaptativos: lista datasets do módulo, importa novos arquivos Excel,
 * navega entre datasets > sheets renderizando DynamicSheetTable.
 */
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Upload, Database, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { importAdaptiveExcel, type ImportProgress } from "@/lib/excelAdaptive";
import { DynamicSheetTable } from "./DynamicSheetTable";

interface Dataset { id: string; name: string; description: string | null; source_filename: string | null; created_at: string; sheet_count: number; uploaded_by: string | null }
interface Sheet { id: string; sheet_name: string; sheet_order: number; row_count: number; col_count: number }

export function GovDataAdaptive({ moduleKey, canEdit }: { moduleKey: string; canEdit: boolean }) {
  const { user } = useAuth();
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [activeDs, setActiveDs] = useState<string | null>(null);
  const [sheets, setSheets] = useState<Sheet[]>([]);
  const [activeSheet, setActiveSheet] = useState<string | null>(null);
  const [openImport, setOpenImport] = useState(false);
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState<ImportProgress | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const loadDatasets = async () => {
    const { data } = await supabase.from("gov_datasets").select("*").eq("module_key", moduleKey).eq("is_active", true).order("created_at", { ascending: false });
    setDatasets((data ?? []) as Dataset[]);
    if (!activeDs && data && data.length > 0) setActiveDs(data[0].id);
  };

  useEffect(() => { loadDatasets(); }, [moduleKey]);

  useEffect(() => {
    if (!activeDs) { setSheets([]); setActiveSheet(null); return; }
    (async () => {
      const { data } = await supabase.from("gov_dataset_sheets").select("*").eq("dataset_id", activeDs).order("sheet_order");
      const list = (data ?? []) as Sheet[];
      setSheets(list);
      setActiveSheet(list[0]?.id ?? null);
    })();
  }, [activeDs]);

  useEffect(() => {
    const ch = supabase.channel(`gov-ds-${moduleKey}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "gov_datasets", filter: `module_key=eq.${moduleKey}` }, () => loadDatasets())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [moduleKey]);

  const onImport = async () => {
    const f = fileRef.current?.files?.[0];
    if (!f) { toast.error("Selecione um arquivo .xlsx"); return; }
    if (!name.trim()) { toast.error("Informe um nome para o dataset"); return; }
    if (!user) return;
    setImporting(true);
    try {
      const id = await importAdaptiveExcel(f, { datasetName: name, moduleKey, userId: user.id, description, onProgress: setProgress });
      toast.success("Planilha importada!");
      setOpenImport(false); setName(""); setDescription(""); setProgress(null);
      await loadDatasets(); setActiveDs(id);
    } catch (e: any) {
      toast.error(`Erro: ${e?.message ?? e}`);
    } finally { setImporting(false); }
  };

  const removeDs = async (id: string) => {
    if (!confirm("Tornar este dataset inativo?")) return;
    await supabase.from("gov_datasets").update({ is_active: false }).eq("id", id);
    toast.success("Dataset removido");
    if (activeDs === id) setActiveDs(null);
    loadDatasets();
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Database className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-semibold">Planilhas mestres ({datasets.length})</span>
        </div>
        {canEdit && (
          <Button size="sm" onClick={() => setOpenImport(true)}>
            <Upload className="h-3.5 w-3.5 mr-1" />Importar planilha mestre
          </Button>
        )}
      </div>

      {datasets.length === 0 ? (
        <Card><CardContent className="p-6 text-center text-sm text-muted-foreground">
          Nenhuma planilha mestre importada para este módulo. {canEdit ? "Clique em \"Importar\" para começar." : "Aguarde alguém com permissão importar dados."}
        </CardContent></Card>
      ) : (
        <Tabs value={activeDs ?? undefined} onValueChange={setActiveDs}>
          <TabsList className="flex flex-wrap h-auto">
            {datasets.map((d) => (
              <TabsTrigger key={d.id} value={d.id} className="text-xs">
                {d.name} <Badge variant="secondary" className="ml-2 h-4 px-1 text-[10px]">{d.sheet_count}</Badge>
              </TabsTrigger>
            ))}
          </TabsList>
          {datasets.map((d) => (
            <TabsContent key={d.id} value={d.id} className="mt-3">
              <Card><CardContent className="p-3 space-y-3">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{d.source_filename} · {new Date(d.created_at).toLocaleDateString("pt-BR")}</span>
                  {canEdit && (
                    <Button size="sm" variant="ghost" onClick={() => removeDs(d.id)}>
                      <Trash2 className="h-3 w-3 mr-1" />Remover
                    </Button>
                  )}
                </div>
                {sheets.length === 0 ? <div className="text-sm text-muted-foreground">Sem abas</div> : (
                  <Tabs value={activeSheet ?? undefined} onValueChange={setActiveSheet}>
                    <TabsList className="flex flex-wrap h-auto">
                      {sheets.map((s) => <TabsTrigger key={s.id} value={s.id} className="text-xs">{s.sheet_name}</TabsTrigger>)}
                    </TabsList>
                    {sheets.map((s) => (
                      <TabsContent key={s.id} value={s.id} className="mt-3">
                        <DynamicSheetTable sheetId={s.id} canEdit={canEdit} />
                      </TabsContent>
                    ))}
                  </Tabs>
                )}
              </CardContent></Card>
            </TabsContent>
          ))}
        </Tabs>
      )}

      <Dialog open={openImport} onOpenChange={(o) => !importing && setOpenImport(o)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Importar planilha mestre</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Nome do dataset</Label><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Master Engenharia 2026" /></div>
            <div><Label>Descrição (opcional)</Label><Input value={description} onChange={(e) => setDescription(e.target.value)} /></div>
            <div><Label>Arquivo Excel (.xlsx, .xls, .csv)</Label><Input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" /></div>
            {progress && (
              <div className="text-xs bg-muted/50 rounded p-2 flex items-center gap-2">
                {importing && <Loader2 className="h-3 w-3 animate-spin" />}
                <span>{progress.step}{progress.current && progress.total ? ` (${progress.current}/${progress.total})` : ""}</span>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenImport(false)} disabled={importing}>Cancelar</Button>
            <Button onClick={onImport} disabled={importing}>{importing ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : <Upload className="h-3.5 w-3.5 mr-1" />}Importar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
