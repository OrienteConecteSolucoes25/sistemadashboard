import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { HeartHandshake } from "lucide-react";

function Placeholder({ title, descricao }: { title: string; descricao: string }) {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <HeartHandshake className="w-6 h-6 text-primary" /> {title}
        </h1>
        <p className="text-sm text-muted-foreground">{descricao}</p>
      </div>
      <Card>
        <CardHeader><CardTitle className="text-base">Em construção</CardTitle></CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Esta área será implementada nas próximas fases do módulo RH/DP.
          Toda visualização respeitará permissões por empresa, papéis e LGPD.
        </CardContent>
      </Card>
    </div>
  );
}

export const RhdpDashboard = () => <Placeholder title="RH/DP — Dashboard" descricao="Visão geral do módulo RH/DP." />;
export const RecrutamentoPage = () => <Placeholder title="Recrutamento" descricao="Vagas e banco de talentos (fase 8)." />;
export const BeneficiosPage = () => <Placeholder title="Benefícios" descricao="Gestão e cotações com aprovação OCS (fase 9)." />;
export const SolicitacoesPage = () => <Placeholder title="Solicitações" descricao="Fila de pedidos com SLA (fase 7)." />;


export const FeriasPage = () => <Placeholder title="Férias & Provisão" descricao="Aquisitivo e provisões (fase 6)." />;
export const FolhaPage = () => <Placeholder title="Folha & Holerite" descricao="Fechamento e holerites (fase 10)." />;
export const IndicadoresPage = () => <Placeholder title="Indicadores RH/DP" descricao="Absenteísmo, turnover (fase 10)." />;
