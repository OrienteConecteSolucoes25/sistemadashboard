import { Card, CardContent } from "@/components/ui/card";
import { GovKpis } from "./lib/govApi";
import { FileSignature, CheckCircle2, Clock, AlertTriangle, Ban, Receipt, DollarSign, TrendingUp, Wallet, FileMinus } from "lucide-react";

const fmt = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 2 });
const num = (n: number) => n.toLocaleString("pt-BR");

const Item = ({ icon: Icon, label, value, accent }: { icon: any; label: string; value: string; accent?: string }) => (
  <Card className="card-elegant">
    <CardContent className="p-3">
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</p>
          <p className={`text-lg font-bold ${accent ?? "text-foreground"}`}>{value}</p>
        </div>
        <Icon className="h-5 w-5 text-primary/70" />
      </div>
    </CardContent>
  </Card>
);

export function GovKpiGrid({ k }: { k: GovKpis }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
      <Item icon={FileSignature} label="Total ARTs" value={num(k.total)} />
      <Item icon={CheckCircle2} label="Registradas" value={num(k.registradas)} accent="text-emerald-600" />
      <Item icon={Clock} label="Aguard. pgto" value={num(k.aguardando_pgto)} accent="text-amber-600" />
      <Item icon={AlertTriangle} label="Vencidas" value={num(k.vencidas)} accent="text-rose-600" />
      <Item icon={FileMinus} label="Baixadas" value={num(k.baixadas)} />
      <Item icon={Ban} label="Canceladas/Inválidas" value={num(k.canceladas)} accent="text-muted-foreground" />
      <Item icon={Receipt} label="Valor emitido (taxa)" value={fmt(k.valor_emitido)} />
      <Item icon={DollarSign} label="Valor pago" value={fmt(k.valor_pago)} accent="text-emerald-600" />
      <Item icon={Wallet} label="Pendente" value={fmt(k.valor_pendente)} accent="text-amber-600" />
      <Item icon={TrendingUp} label="Total contratos" value={fmt(k.valor_contratos)} />
      <Item icon={DollarSign} label="Ticket médio taxa" value={fmt(k.ticket_medio_taxa)} />
      <Item icon={DollarSign} label="Ticket médio contrato" value={fmt(k.ticket_medio_contrato)} />
    </div>
  );
}
