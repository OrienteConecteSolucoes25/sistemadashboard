import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Scale, Clock, ListChecks, Users } from "lucide-react";
import { MOCK_DASHBOARD, MOCK_PRAZOS, MOCK_TAREFAS } from "../mock/jurMockData";

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

const JuridicoDashboard = () => (
  <div className="space-y-6">
    <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
      <Stat icon={Scale} label="Processos ativos" value={MOCK_DASHBOARD.processosAtivos} />
      <Stat icon={Clock} label="Prazos críticos" value={MOCK_DASHBOARD.prazosCriticos} />
      <Stat icon={ListChecks} label="Tarefas abertas" value={MOCK_DASHBOARD.tarefasAbertas} />
      <Stat icon={Users} label="Responsáveis" value={MOCK_DASHBOARD.responsaveis} />
    </div>

    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader><CardTitle className="text-base">Próximos prazos</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {MOCK_PRAZOS.map((p) => (
            <div key={p.id} className="flex justify-between text-sm border-b pb-2 last:border-0">
              <span className="font-mono text-xs">{p.processo}</span>
              <span className="text-muted-foreground truncate mx-2">{p.descricao}</span>
              <span className="text-xs">{p.data}</span>
            </div>
          ))}
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle className="text-base">Tarefas em destaque</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {MOCK_TAREFAS.map((t) => (
            <div key={t.id} className="flex justify-between text-sm border-b pb-2 last:border-0">
              <span>{t.titulo}</span>
              <span className="text-xs text-muted-foreground">{t.status}</span>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  </div>
);

export default JuridicoDashboard;
