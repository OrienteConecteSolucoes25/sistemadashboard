import { Card } from "@/components/ui/card";
import { StatusBadge } from "./StatusBadge";
import { cn } from "@/lib/utils";

export interface EngKanbanProps {
  rows: any[];
  groupKey?: string; // default "status"
  titleKey?: string; // default "titulo" or "nome"
  subtitleKey?: string; // default "responsavel"
  dateKey?: string; // default "prazo"
  priorityKey?: string; // default "prioridade"
  onItemClick?: (row: any) => void;
  /** Optional ordered column keys; otherwise inferred from data */
  columns?: string[];
}

const inferTitle = (r: any, override?: string) =>
  override ? r[override] : r.titulo ?? r.nome ?? r.assunto ?? r.descricao ?? r.numero ?? "(sem título)";

export const EngKanban = ({
  rows,
  groupKey = "status",
  titleKey,
  subtitleKey = "responsavel",
  dateKey = "prazo",
  priorityKey = "prioridade",
  onItemClick,
  columns,
}: EngKanbanProps) => {
  const groups: Record<string, any[]> = {};
  rows.forEach((r) => {
    const k = String(r[groupKey] ?? "sem_status");
    (groups[k] ??= []).push(r);
  });
  const cols = columns ?? Object.keys(groups).sort();

  if (cols.length === 0) {
    return <Card className="card-elegant p-8 text-center text-muted-foreground text-sm">Nenhum registro para exibir.</Card>;
  }

  return (
    <div className="grid gap-3 grid-flow-col auto-cols-[minmax(260px,1fr)] overflow-x-auto pb-2">
      {cols.map((col) => {
        const items = groups[col] ?? [];
        return (
          <div key={col} className="flex flex-col gap-2 min-w-[260px]">
            <div className="flex items-center justify-between px-1 sticky top-0 bg-background pt-1 pb-1 z-10">
              <div className="flex items-center gap-2">
                <StatusBadge value={col} />
                <span className="text-xs text-muted-foreground">{items.length}</span>
              </div>
            </div>
            <div className="space-y-2">
              {items.map((r) => {
                const overdue = dateKey && r[dateKey] && new Date(r[dateKey]) < new Date(new Date().toDateString())
                  && !["concluida", "concluido", "fechada"].includes(String(r[groupKey] ?? "").toLowerCase());
                return (
                  <Card
                    key={r.id}
                    className={cn(
                      "card-elegant p-3 cursor-pointer hover:border-primary/40 transition-colors",
                      overdue && "border-destructive/40"
                    )}
                    onClick={() => onItemClick?.(r)}
                  >
                    <div className="text-sm font-medium line-clamp-2 mb-1.5">{inferTitle(r, titleKey)}</div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {r[priorityKey] && <StatusBadge value={String(r[priorityKey])} />}
                      {r[subtitleKey] && (
                        <span className="text-[11px] text-muted-foreground truncate">👤 {String(r[subtitleKey])}</span>
                      )}
                    </div>
                    {r[dateKey] && (
                      <div className={cn("text-[11px] mt-1.5", overdue ? "text-destructive font-medium" : "text-muted-foreground")}>
                        📅 {new Date(r[dateKey]).toLocaleDateString("pt-BR")}
                      </div>
                    )}
                  </Card>
                );
              })}
              {items.length === 0 && (
                <div className="text-[11px] text-muted-foreground text-center py-4 border border-dashed rounded-md">vazio</div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
