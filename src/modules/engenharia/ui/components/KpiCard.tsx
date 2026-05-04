import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

type Tone = "teal" | "warn" | "danger" | "success" | "neutral";

const toneCls: Record<Tone, string> = {
  teal: "kpi-teal",
  warn: "kpi-warn",
  danger: "kpi-danger",
  success: "kpi-success",
  neutral: "kpi-neutral",
};

const toneIcon: Record<Tone, string> = {
  teal: "text-primary bg-primary/10",
  warn: "text-[hsl(var(--warn))] bg-[hsl(var(--warn))]/10",
  danger: "text-destructive bg-destructive/10",
  success: "text-[hsl(var(--success))] bg-[hsl(var(--success))]/10",
  neutral: "text-muted-foreground bg-muted",
};

export interface KpiCardProps {
  label: string;
  value: number | string;
  icon?: LucideIcon;
  tone?: Tone;
  hint?: string;
}

export const KpiCard = ({ label, value, icon: Icon, tone = "teal", hint }: KpiCardProps) => (
  <Card className={cn("card-elegant", toneCls[tone])}>
    <CardContent className="p-4 flex items-center gap-3">
      {Icon && (
        <div className={cn("w-10 h-10 rounded-md flex items-center justify-center", toneIcon[tone])}>
          <Icon className="w-5 h-5" />
        </div>
      )}
      <div className="min-w-0">
        <div className="text-xs uppercase tracking-wide text-muted-foreground font-medium">{label}</div>
        <div className="text-2xl font-display font-semibold leading-tight">{value}</div>
        {hint && <div className="text-[11px] text-muted-foreground truncate">{hint}</div>}
      </div>
    </CardContent>
  </Card>
);

export const KpiGrid = ({ children }: { children: React.ReactNode }) => (
  <div className="grid gap-3 grid-cols-2 md:grid-cols-3 lg:grid-cols-5">{children}</div>
);
