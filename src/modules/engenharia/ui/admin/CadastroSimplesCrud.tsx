import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Plus, Trash2, Pencil, Check, X, Search } from "lucide-react";
import { Download, Upload, FileSpreadsheet, FileText } from "lucide-react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import * as XLSX from "xlsx";

type MetaField = { key: string; label: string; type?: "text" | "number" };

type Props = {
  fieldKey: string;
  title: string;
  metaFields?: MetaField[]; // colunas extras (Centro de Custo, Comprador, SLA, etc.)
  valueLabel?: string;      // rótulo da coluna principal (default "Nome")
  valuePlaceholder?: string;
};

type Row = { id: string; field_key: string; value: string; meta: Record<string, any> };

export function CadastroSimplesCrud({ fieldKey, title, metaFields = [], valueLabel = "Nome", valuePlaceholder = "" }: Props) {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [novoValor, setNovoValor] = useState("");
  const [novoMeta, setNovoMeta] = useState<Record<string, any>>({});
  const [editId, setEditId] = useState<string | null>(null);
  const [editValor, setEditValor] = useState("");
  const [editMeta, setEditMeta] = useState<Record<string, any>>({});

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("eng_field_options")
      .select("id, field_key, value, meta")
      .eq("field_key", fieldKey)
      .order("value", { ascending: true });
    if (error) toast.error(error.message);
    setRows((data ?? []) as any);
    setLoading(false);
  };

  useEffect(() => {
    load();
    const ch = supabase
      .channel(`cad_${fieldKey}`)
      .on("postgres_changes",
        { event: "*", schema: "public", table: "eng_field_options", filter: `field_key=eq.${fieldKey}` },
        () => load())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fieldKey]);

  const filtradas = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return rows;
    return rows.filter((r) =>
      r.value.toLowerCase().includes(s) ||
      JSON.stringify(r.meta || {}).toLowerCase().includes(s),
    );
  }, [rows, q]);

  const adicionar = async () => {
    const v = novoValor.trim();
    if (!v) return toast.error("Informe o nome");
    const meta: Record<string, any> = {};
    metaFields.forEach((f) => {
      const raw = novoMeta[f.key];
      if (raw === undefined || raw === "") return;
      meta[f.key] = f.type === "number" ? Number(raw) : raw;
    });
    const { error } = await supabase
      .from("eng_field_options")
      .insert({ field_key: fieldKey, value: v, meta } as any);
    if (error) return toast.error(error.message);
    setNovoValor(""); setNovoMeta({});
    toast.success("Adicionado");
  };

  const salvarEdicao = async () => {
    if (!editId) return;
    const meta: Record<string, any> = {};
    metaFields.forEach((f) => {
      const raw = editMeta[f.key];
      if (raw === undefined || raw === "") return;
      meta[f.key] = f.type === "number" ? Number(raw) : raw;
    });
    const { error } = await supabase
      .from("eng_field_options")
      .update({ value: editValor.trim(), meta } as any)
      .eq("id", editId);
    if (error) return toast.error(error.message);
    setEditId(null);
    toast.success("Atualizado");
  };

  const excluir = async (id: string) => {
    if (!confirm("Excluir este cadastro?")) return;
    const { error } = await supabase.from("eng_field_options").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Excluído");
  };

  const exportar = (fmt: "xlsx" | "csv") => {
    const data = filtradas.map((r) => {
      const o: any = { Nome: r.value };
      metaFields.forEach((f) => { o[f.label] = r.meta?.[f.key] ?? ""; });
      return o;
    });
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Cadastro");
    XLSX.writeFile(wb, `${fieldKey}.${fmt}`, { bookType: fmt });
  };

  const baixarModelo = (fmt: "xlsx" | "csv") => {
    const headers: any = { Nome: "" };
    metaFields.forEach((f) => { headers[f.label] = ""; });
    const ws = XLSX.utils.json_to_sheet([headers]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Modelo");
    XLSX.writeFile(wb, `modelo_${fieldKey}.${fmt}`, { bookType: fmt });
  };

  const importar = async (file: File) => {
    try {
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { type: "array" });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const json = XLSX.utils.sheet_to_json<any>(ws, { defval: "" });
      const rowsToInsert: any[] = [];
      const norm = (s: string) => s.toString().toLowerCase().trim();
      for (const r of json) {
        const keys = Object.keys(r);
        const nameKey = keys.find((k) => norm(k) === "nome" || norm(k) === "value");
        const value = nameKey ? String(r[nameKey] ?? "").trim() : "";
        if (!value) continue;
        const meta: Record<string, any> = {};
        metaFields.forEach((f) => {
          const k = keys.find((kk) => norm(kk) === norm(f.label) || norm(kk) === norm(f.key));
          if (k && r[k] !== "" && r[k] !== undefined && r[k] !== null) {
            meta[f.key] = f.type === "number" ? Number(r[k]) : String(r[k]);
          }
        });
        rowsToInsert.push({ field_key: fieldKey, value, meta });
      }
      if (rowsToInsert.length === 0) return toast.warning("Nenhuma linha válida");
      // Upsert manualmente: insere ignorando duplicados
      let ok = 0;
      for (let i = 0; i < rowsToInsert.length; i += 200) {
        const slice = rowsToInsert.slice(i, i + 200);
        const { error } = await supabase.from("eng_field_options").insert(slice as any);
        if (error && !error.message.toLowerCase().includes("duplicate")) {
          // tenta um a um para pular duplicados
          for (const it of slice) {
            const { error: e2 } = await supabase.from("eng_field_options").insert(it as any);
            if (!e2) ok++;
          }
        } else {
          ok += slice.length;
        }
      }
      toast.success(`${ok} registros importados`);
    } catch (e: any) {
      toast.error("Falha ao importar: " + (e?.message ?? e));
    }
  };

  return (
    <Card className="card-elegant">
      <CardContent className="pt-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold">{title}</h3>
            <Badge variant="secondary">{rows.length}</Badge>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2 top-2.5 text-muted-foreground" />
              <Input
                value={q} onChange={(e) => setQ(e.target.value)}
                placeholder="Buscar…" className="h-8 pl-7 w-48"
              />
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm"><Download className="w-4 h-4 mr-1" />Exportar</Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Exportar</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => exportar("xlsx")}>
                  <FileSpreadsheet className="w-4 h-4 mr-2" />Excel (.xlsx)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => exportar("csv")}>
                  <FileText className="w-4 h-4 mr-2" />CSV (.csv)
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuLabel>Modelo</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => baixarModelo("xlsx")}>
                  <FileSpreadsheet className="w-4 h-4 mr-2" />Modelo Excel
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => baixarModelo("csv")}>
                  <FileText className="w-4 h-4 mr-2" />Modelo CSV
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <label>
              <input
                type="file" accept=".xlsx,.xls,.csv" className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) importar(f); e.currentTarget.value = ""; }}
              />
              <Button variant="outline" size="sm" asChild>
                <span><Upload className="w-4 h-4 mr-1" />Importar</span>
              </Button>
            </label>
          </div>
        </div>

        {/* Form de adição */}
        <div className="grid gap-2 md:grid-cols-12 items-end border rounded-md p-2 bg-muted/40">
          <div className={`md:col-span-${Math.max(3, 12 - (metaFields.length * 3) - 2)}`}>
            <Label className="text-[10px]">{valueLabel} *</Label>
            <Input value={novoValor} onChange={(e) => setNovoValor(e.target.value)} placeholder={valuePlaceholder} />
          </div>
          {metaFields.map((f) => (
            <div key={f.key} className="md:col-span-3">
              <Label className="text-[10px]">{f.label}</Label>
              <Input
                type={f.type === "number" ? "number" : "text"}
                value={novoMeta[f.key] ?? ""}
                onChange={(e) => setNovoMeta({ ...novoMeta, [f.key]: e.target.value })}
              />
            </div>
          ))}
          <div className="md:col-span-2">
            <Button size="sm" onClick={adicionar} className="w-full">
              <Plus className="w-4 h-4 mr-1" />Adicionar
            </Button>
          </div>
        </div>

        {/* Lista */}
        <div className="border rounded-md overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/60">
              <tr>
                <th className="text-left px-2 py-1.5">{valueLabel}</th>
                {metaFields.map((f) => (
                  <th key={f.key} className="text-left px-2 py-1.5">{f.label}</th>
                ))}
                <th className="text-right px-2 py-1.5 w-32">Ações</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td colSpan={2 + metaFields.length} className="text-center py-4 text-muted-foreground">Carregando…</td></tr>
              )}
              {!loading && filtradas.length === 0 && (
                <tr><td colSpan={2 + metaFields.length} className="text-center py-4 text-muted-foreground">Nenhum cadastro</td></tr>
              )}
              {filtradas.map((r) => editId === r.id ? (
                <tr key={r.id} className="bg-amber-50 dark:bg-amber-950/20">
                  <td className="px-2 py-1">
                    <Input value={editValor} onChange={(e) => setEditValor(e.target.value)} className="h-8" />
                  </td>
                  {metaFields.map((f) => (
                    <td key={f.key} className="px-2 py-1">
                      <Input
                        className="h-8"
                        type={f.type === "number" ? "number" : "text"}
                        value={editMeta[f.key] ?? ""}
                        onChange={(e) => setEditMeta({ ...editMeta, [f.key]: e.target.value })}
                      />
                    </td>
                  ))}
                  <td className="px-2 py-1 text-right">
                    <Button size="icon" variant="ghost" onClick={salvarEdicao}><Check className="w-4 h-4" /></Button>
                    <Button size="icon" variant="ghost" onClick={() => setEditId(null)}><X className="w-4 h-4" /></Button>
                  </td>
                </tr>
              ) : (
                <tr key={r.id} className="border-t">
                  <td className="px-2 py-1.5">{r.value}</td>
                  {metaFields.map((f) => (
                    <td key={f.key} className="px-2 py-1.5 text-muted-foreground">{r.meta?.[f.key] ?? "—"}</td>
                  ))}
                  <td className="px-2 py-1 text-right">
                    <Button size="icon" variant="ghost" onClick={() => {
                      setEditId(r.id); setEditValor(r.value); setEditMeta({ ...(r.meta || {}) });
                    }}>
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => excluir(r.id)}>
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
