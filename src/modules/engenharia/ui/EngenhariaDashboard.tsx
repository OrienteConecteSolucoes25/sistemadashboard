import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MOCK_DASHBOARD, MOCK_PENDENCIAS, MOCK_RFIS } from "../mock/engMockData";
import { MapPin, FileQuestion, AlertTriangle, Users } from "lucide-react";

const Stat = ({ icon: Icon, label, value }: any) => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
      <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
      <Icon className="w-4 h-4 text-muted-foreground" />
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">{value}</div>
    </CardContent>
  </Card>
);

const EngenhariaDashboard = () => {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <Stat icon={MapPin} label="Sites ativos" value={MOCK_DASHBOARD.sitesAtivos} />
        <Stat icon={FileQuestion} label="RFI em aberto" value={MOCK_DASHBOARD.rfisAbertas} />
        <Stat icon={AlertTriangle} label="Pendências críticas" value={MOCK_DASHBOARD.pendenciasCriticas} />
        <Stat icon={Users} label="Equipes alocadas" value={MOCK_DASHBOARD.equipesAlocadas} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-base">RFI recentes</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {MOCK_RFIS.map((r) => (
              <div key={r.id} className="flex justify-between text-sm border-b pb-2 last:border-0">
                <span className="font-mono">{r.numero}</span>
                <span className="text-muted-foreground truncate mx-2">{r.assunto}</span>
                <span className="text-xs">{r.status}</span>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">Pendências em destaque</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {MOCK_PENDENCIAS.map((p) => (
              <div key={p.id} className="flex justify-between text-sm border-b pb-2 last:border-0">
                <span>{p.titulo}</span>
                <span className="text-xs text-muted-foreground">{p.prioridade}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default EngenhariaDashboard;
