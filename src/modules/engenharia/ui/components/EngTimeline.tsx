import { Card } from "@/components/ui/card";
import { StatusBadge } from "./StatusBadge";
import { cn } from "@/lib/utils";

export interface EngTimelineProps {
  rows: any[];
  dateKey?: string;
  titleKey?: string;
  subtitleKey?: string;
  statusKey?: string;
  onItemClick?: (row: any) => void;
}

const inferTitle = (r: any, override?: string) =>
  override ? r[override] : r.titulo ?? r.nome ?? r.assunto ?? r.descricao ?? r.numero ?? "(sem título)";

export const EngTimeline = ({
  rows, dateKey = "created_at", titleKey, subtitleKey = "responsavel", statusKey = "status", onItemClick,
}: EngTimelineProps) => {
  const sorted = [...rows]
    .filter((r) => r[dateKey])
    .sort((a, b) => new Date(b[dateKey]).getTime() - new Date(a[dateKey]).getTime());

  if (sorted.length === 0) {
    return <Card className="card-elegant p-8 text-center text-muted-foreground text-sm">Nenhum evento na timeline.</Card>;
  }

  return (
    <Card className="card-elegant p-5">
      <div className="relative pl-6">
        <div className="absolute left-2 top-1 bottom-1 w-px bg-border" />
        <div className="space-y-4">
          {sorted.map((r) => (
            <div key={r.id} className="relative">
              <div className={cn("absolute -left-[18px] top-1.5 w-3 h-3 rounded-full border-2 border-background bg-primary")} />
              <div
                className="cursor-pointer group"
                onClick={() => onItemClick?.(r)}
              >
                <div className="flex items-center gap-2 flex-wrap mb-0.5">
                  <span className="text-[11px] text-muted-foreground tabular-nums">
                    {new Date(r[dateKey]).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })}
                  </span>
                  {r[statusKey] && <StatusBadge value={String(r[statusKey])} />}
                </div>
                <div className="text-sm font-medium group-hover:text-primary transition-colors">{inferTitle(r, titleKey)}</div>
                {r[subtitleKey] && <div className="text-xs text-muted-foreground mt-0.5">👤 {String(r[subtitleKey])}</div>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
};
