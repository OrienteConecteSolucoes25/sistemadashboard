import { cn } from "@/lib/utils";

const MAP: Record<string, string> = {
  // status genéricos
  aberta: "bg-[hsl(var(--warn))]/15 text-[hsl(var(--warn))] border-[hsl(var(--warn))]/30",
  pendente: "bg-[hsl(var(--warn))]/15 text-[hsl(var(--warn))] border-[hsl(var(--warn))]/30",
  em_andamento: "bg-primary/15 text-primary border-primary/30",
  em_execucao: "bg-primary/15 text-primary border-primary/30",
  em_cotacao: "bg-primary/15 text-primary border-primary/30",
  em_analise: "bg-primary/15 text-primary border-primary/30",
  respondida: "bg-primary/15 text-primary border-primary/30",
  solicitada: "bg-primary/15 text-primary border-primary/30",
  ativa: "bg-[hsl(var(--success))]/15 text-[hsl(var(--success))] border-[hsl(var(--success))]/30",
  ativo: "bg-[hsl(var(--success))]/15 text-[hsl(var(--success))] border-[hsl(var(--success))]/30",
  aprovada: "bg-[hsl(var(--success))]/15 text-[hsl(var(--success))] border-[hsl(var(--success))]/30",
  ligada: "bg-[hsl(var(--success))]/15 text-[hsl(var(--success))] border-[hsl(var(--success))]/30",
  comprada: "bg-[hsl(var(--success))]/15 text-[hsl(var(--success))] border-[hsl(var(--success))]/30",
  recebida: "bg-[hsl(var(--success))]/15 text-[hsl(var(--success))] border-[hsl(var(--success))]/30",
  emitida: "bg-[hsl(var(--success))]/15 text-[hsl(var(--success))] border-[hsl(var(--success))]/30",
  paga: "bg-[hsl(var(--success))]/15 text-[hsl(var(--success))] border-[hsl(var(--success))]/30",
  enviado: "bg-[hsl(var(--success))]/15 text-[hsl(var(--success))] border-[hsl(var(--success))]/30",
  concluida: "bg-muted text-muted-foreground border-border",
  concluido: "bg-muted text-muted-foreground border-border",
  fechada: "bg-muted text-muted-foreground border-border",
  inativa: "bg-muted text-muted-foreground border-border",
  cancelada: "bg-destructive/15 text-destructive border-destructive/30",
  cancelado: "bg-destructive/15 text-destructive border-destructive/30",
  rejeitada: "bg-destructive/15 text-destructive border-destructive/30",
  falhou: "bg-destructive/15 text-destructive border-destructive/30",
  // prioridades
  alta: "bg-destructive/15 text-destructive border-destructive/30",
  media: "bg-[hsl(var(--warn))]/15 text-[hsl(var(--warn))] border-[hsl(var(--warn))]/30",
  baixa: "bg-muted text-muted-foreground border-border",
};

const label = (v: string) => v.replaceAll("_", " ");

export const StatusBadge = ({ value }: { value: string | null | undefined }) => {
  if (!value) return <span className="text-muted-foreground text-xs">—</span>;
  const k = String(value).toLowerCase();
  const cls = MAP[k] ?? "bg-muted text-muted-foreground border-border";
  return (
    <span className={cn("inline-flex items-center px-2 py-0.5 rounded-md border text-xs font-medium capitalize whitespace-nowrap", cls)}>
      {label(k)}
    </span>
  );
};
