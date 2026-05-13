import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, Save } from "lucide-react";

type QuotaRow = {
  id: string;
  user_id: string;
  mensagens_usadas_mes: number;
  limite_mensal: number;
  data_reset: string;
};

export default function ConfigurarAgentesPage() {
  const [rows, setRows] = useState<QuotaRow[]>([]);
  const [edits, setEdits] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const { data, error } = await supabase
      .from("verso_agent_quota")
      .select("*")
      .order("mensagens_usadas_mes", { ascending: false })
      .limit(200);
    if (error) toast.error(error.message);
    setRows(data ?? []);
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  async function save(r: QuotaRow) {
    const newLimit = edits[r.id] ?? r.limite_mensal;
    setSavingId(r.id);
    const { error } = await supabase.from("verso_agent_quota")
      .update({ limite_mensal: newLimit, updated_at: new Date().toISOString() })
      .eq("id", r.id);
    setSavingId(null);
    if (error) return toast.error(error.message);
    toast.success("Cota atualizada");
    load();
  }

  return (
    <div className="space-y-5">
      <Card className="p-4 card-elegant">
        <div className="font-display font-semibold mb-1">Configurar Agentes</div>
        <p className="text-xs text-muted-foreground">
          Defina a cota mensal de mensagens dos agentes Soluções-Verso por usuário. O custo de IA é absorvido pela OCS.
        </p>
      </Card>

      <Card className="card-elegant overflow-hidden">
        {loading ? (
          <div className="p-8 flex items-center justify-center text-muted-foreground gap-2">
            <Loader2 className="w-4 h-4 animate-spin" /> Carregando…
          </div>
        ) : rows.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground">
            Nenhum usuário ainda usou os agentes.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="font-mono text-xs">Usuário</TableHead>
                <TableHead className="text-right">Usadas/mês</TableHead>
                <TableHead className="text-right">Limite</TableHead>
                <TableHead>Reset</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map(r => (
                <TableRow key={r.id}>
                  <TableCell className="font-mono text-xs truncate max-w-[260px]">{r.user_id}</TableCell>
                  <TableCell className="text-right">{r.mensagens_usadas_mes}</TableCell>
                  <TableCell className="text-right">
                    <Input
                      type="number"
                      min={0}
                      defaultValue={r.limite_mensal}
                      onChange={e => setEdits(s => ({ ...s, [r.id]: Number(e.target.value) }))}
                      className="h-8 w-24 ml-auto"
                    />
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {new Date(r.data_reset).toLocaleDateString("pt-BR")}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button size="sm" variant="outline" onClick={() => save(r)} disabled={savingId === r.id}>
                      {savingId === r.id ? <Loader2 className="w-3 h-3 animate-spin"/> : <Save className="w-3 h-3"/>}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>
    </div>
  );
}
