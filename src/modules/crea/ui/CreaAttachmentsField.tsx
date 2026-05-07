import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Paperclip, Upload, Trash2, Download } from "lucide-react";

const sb: any = supabase;

interface Item { name: string; path: string; size?: number }

interface Props {
  table: string;
  recordId?: string | null;
  /** Pasta dentro do bucket: <table>/<recordId|tmp> */
  onChange?: (paths: string[]) => void;
  /** Lista inicial de paths (string[]) salva no campo `anexos` ou `anexo_url` (CSV). */
  value?: string[] | string | null;
  disabled?: boolean;
}

const toArr = (v: any): string[] => {
  if (!v) return [];
  if (Array.isArray(v)) return v;
  return String(v).split(",").map((s) => s.trim()).filter(Boolean);
};

export default function CreaAttachmentsField({ table, recordId, value, onChange, disabled }: Props) {
  const [paths, setPaths] = useState<string[]>(toArr(value));
  const [busy, setBusy] = useState(false);
  const ref = useRef<HTMLInputElement>(null);
  const folder = `${table}/${recordId ?? "tmp"}`;

  useEffect(() => { setPaths(toArr(value)); }, [value]);

  const emit = (next: string[]) => { setPaths(next); onChange?.(next); };

  const onPick = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setBusy(true);
    const next = [...paths];
    for (const f of Array.from(files)) {
      const safe = f.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const path = `${folder}/${Date.now()}_${safe}`;
      const { error } = await sb.storage.from("crea-attachments").upload(path, f, { upsert: false });
      if (error) { toast.error(`Falha em ${f.name}: ${error.message}`); continue; }
      next.push(path);
    }
    setBusy(false);
    emit(next);
    if (ref.current) ref.current.value = "";
  };

  const remove = async (p: string) => {
    if (!confirm("Remover anexo?")) return;
    await sb.storage.from("crea-attachments").remove([p]);
    emit(paths.filter((x) => x !== p));
  };

  const open = async (p: string) => {
    const { data, error } = await sb.storage.from("crea-attachments").createSignedUrl(p, 60);
    if (error) return toast.error(error.message);
    window.open(data.signedUrl, "_blank");
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <input ref={ref} type="file" multiple hidden onChange={(e) => onPick(e.target.files)} />
        <Button type="button" size="sm" variant="outline" disabled={disabled || busy} onClick={() => ref.current?.click()}>
          <Upload className="w-4 h-4 mr-1" /> {busy ? "Enviando..." : "Anexar"}
        </Button>
        <Badge variant="secondary"><Paperclip className="w-3 h-3 mr-1" /> {paths.length}</Badge>
      </div>
      {paths.length > 0 && (
        <ul className="space-y-1">
          {paths.map((p) => (
            <li key={p} className="text-xs flex items-center justify-between border rounded px-2 py-1">
              <span className="truncate flex-1">{p.split("/").pop()}</span>
              <div className="flex gap-1">
                <Button type="button" size="icon" variant="ghost" onClick={() => open(p)}><Download className="w-3 h-3" /></Button>
                <Button type="button" size="icon" variant="ghost" onClick={() => remove(p)} disabled={disabled}><Trash2 className="w-3 h-3" /></Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
