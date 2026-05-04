import { useMemo, useState, ReactNode } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { EngPageHeader } from "@/modules/engenharia/ui/components/EngPageHeader";
import { KpiGrid, KpiCard, KpiCardProps } from "@/modules/engenharia/ui/components/KpiCard";

type Col = { key: string; label: string };
type Props = {
  title: string;
  description?: string;
  columns: Col[];
  rows: Record<string, any>[];
  kpis?: KpiCardProps[];
  actions?: ReactNode;
};

const fmt = (v: any) => {
  if (v == null || v === "") return "—";
  if (typeof v === "string") return v.replace(/_/g, " ");
  return String(v);
};

const JurTablePage = ({ title, description, columns, rows, kpis, actions }: Props) => {
  const [q, setQ] = useState("");
  const filtered = useMemo(() => {
    if (!q.trim()) return rows;
    const s = q.toLowerCase();
    return rows.filter((r) =>
      columns.some((c) => String(r[c.key] ?? "").toLowerCase().includes(s))
    );
  }, [q, rows, columns]);

  return (
    <div className="space-y-4">
      <EngPageHeader
        title={title}
        description={description}
        actions={
          <>
            {actions}
            <Badge variant="outline" className="font-mono text-[10px]">MOCK</Badge>
          </>
        }
      />

      {kpis && kpis.length > 0 && (
        <KpiGrid>
          {kpis.map((k, i) => <KpiCard key={i} {...k} />)}
        </KpiGrid>
      )}

      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar..."
            className="pl-8 h-9"
          />
        </div>
        <Badge variant="secondary" className="text-[10px]">
          {filtered.length} de {rows.length}
        </Badge>
      </div>

      <Card className="card-elegant overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 border-b border-border/60">
            <tr>
              {columns.map((c) => (
                <th key={c.key} className="text-left px-3 py-2.5 font-semibold text-xs uppercase tracking-wide text-muted-foreground">
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-3 py-10 text-center text-muted-foreground">
                  Nenhum registro.
                </td>
              </tr>
            ) : filtered.map((r, i) => (
              <tr key={r.id ?? i} className="border-t border-border/40 hover:bg-muted/30 transition-colors">
                {columns.map((c) => (
                  <td key={c.key} className="px-3 py-2 align-top">
                    {c.key === "status" || c.key === "prioridade" || c.key === "tipo" ? (
                      <Badge variant="outline" className="text-[10px]">{fmt(r[c.key])}</Badge>
                    ) : (
                      <span className={c.key === "numero" || c.key === "processo" ? "font-mono text-[12px]" : ""}>
                        {fmt(r[c.key])}
                      </span>
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
};

export default JurTablePage;
