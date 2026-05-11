import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

type Row = { id: string; nome: string; show_ocs_brand: boolean };

/**
 * Permite ao admin OCS ligar/desligar a marca "ERP OCS / Oriente Conecte Soluções"
 * para cada empresa. Quando desligada, os usuários daquela empresa veem
 * "Sistema dashboard" no lugar.
 */
export default function EmpresasMarcaToggle() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const { data, error } = await (supabase as any)
      .from("companies")
      .select("id, nome, show_ocs_brand")
      .eq("ativo", true)
      .order("nome");
    if (error) toast.error(error.message);
    setRows((data as any) ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const toggle = async (row: Row, value: boolean) => {
    const prev = rows;
    setRows(rows.map(r => r.id === row.id ? { ...r, show_ocs_brand: value } : r));
    const { error } = await (supabase as any)
      .from("companies")
      .update({ show_ocs_brand: value })
      .eq("id", row.id);
    if (error) {
      setRows(prev);
      toast.error(error.message);
      return;
    }
    toast.success(`Marca OCS ${value ? "exibida" : "ocultada"} para ${row.nome}.`);
  };

  return (
    <Card>
      <CardContent className="py-4 space-y-3">
        <div>
          <h2 className="font-semibold">Marca OCS por empresa</h2>
          <p className="text-xs text-muted-foreground">
            Quando desligada, os usuários da empresa veem <strong>“Sistema dashboard”</strong> no lugar de <strong>“ERP OCS / Oriente Conecte Soluções”</strong>.
          </p>
        </div>
        {loading && <div className="text-xs text-muted-foreground">Carregando…</div>}
        <div className="divide-y border rounded-md">
          {rows.map((r) => (
            <div key={r.id} className="flex items-center justify-between gap-3 px-3 py-2">
              <div className="min-w-0">
                <div className="text-sm font-medium truncate">{r.nome}</div>
                <div className="text-[11px] text-muted-foreground">
                  {r.show_ocs_brand ? "Marca OCS visível" : "Marca OCS oculta (mostra Sistema dashboard)"}
                </div>
              </div>
              <Switch
                checked={r.show_ocs_brand}
                onCheckedChange={(v) => toggle(r, !!v)}
                aria-label={`Mostrar marca OCS para ${r.nome}`}
              />
            </div>
          ))}
          {!loading && rows.length === 0 && (
            <div className="px-3 py-4 text-xs text-muted-foreground">Nenhuma empresa ativa.</div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
