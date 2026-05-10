import React from "react";
import { 
  ShieldCheck, 
  AlertTriangle, 
  Search, 
  Filter, 
  History, 
  Eye, 
  CheckCircle2, 
  Lock,
  ArrowRight,
  TrendingUp,
  Fingerprint
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function FinancialAuditPage() {
  const [alerts, setAlerts] = React.useState<any[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [stats, setStats] = React.useState({
    critical: 0,
    resolved: 0,
    score: 95
  });

  React.useEffect(() => {
    fetchAlerts();
  }, []);

  const fetchAlerts = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('financial_security_alerts')
        .select(`
          *,
          profiles:triggered_by(full_name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAlerts(data || []);
      
      const crit = data?.filter(a => a.severity === 'critical' && a.status === 'active').length || 0;
      const res = data?.filter(a => a.status === 'resolved').length || 0;
      setStats({
        critical: crit,
        resolved: res,
        score: 100 - (crit * 5)
      });

    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const getSeverityColor = (sev: string) => {
    switch (sev) {
      case 'critical': return 'bg-red-500 text-white';
      case 'high': return 'bg-orange-500 text-white';
      case 'medium': return 'bg-amber-500 text-white';
      default: return 'bg-blue-500 text-white';
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-4 md:p-8">
      <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 text-[10px] uppercase font-bold text-slate-400 mb-1 tracking-widest">
            <Fingerprint className="w-3 h-3" /> ERP OCS / OCS Guard / Auditoria Financeira
          </div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-3">
            <ShieldCheck className="w-8 h-8 text-indigo-600" /> AUDITORIA FINANCEIRA
          </h1>
        </div>

        <div className="flex gap-3">
          <Button variant="outline" className="font-bold text-xs uppercase tracking-widest gap-2">
            <History className="w-3 h-3" /> Histórico Completo
          </Button>
          <Button className="bg-indigo-600 hover:bg-indigo-700 font-bold text-xs uppercase tracking-widest gap-2 shadow-lg shadow-indigo-500/20">
            <Lock className="w-3 h-3" /> Protocolos de Segurança
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="border-none shadow-sm bg-white overflow-hidden relative">
          <CardContent className="p-6">
            <p className="text-[10px] uppercase font-black text-slate-400 tracking-wider mb-1">Score de Confiança</p>
            <div className="flex items-baseline gap-2">
              <p className="text-4xl font-black text-slate-800">{stats.score}%</p>
              <TrendingUp className="w-4 h-4 text-green-500" />
            </div>
            <div className="mt-4 w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
              <div className="bg-indigo-600 h-full transition-all duration-1000" style={{ width: `${stats.score}%` }} />
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm bg-white">
          <CardContent className="p-6">
            <p className="text-[10px] uppercase font-black text-slate-400 tracking-wider mb-1">Alertas Críticos Ativos</p>
            <div className="flex items-baseline gap-2">
              <p className={`text-4xl font-black ${stats.critical > 0 ? 'text-red-500' : 'text-slate-800'}`}>
                {stats.critical.toString().padStart(2, '0')}
              </p>
              {stats.critical > 0 && <AlertTriangle className="w-5 h-5 text-red-500 animate-pulse" />}
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm bg-indigo-600 text-white">
          <CardContent className="p-6">
            <p className="text-[10px] uppercase font-black text-indigo-200 tracking-wider mb-1">Alertas Resolvidos</p>
            <div className="flex items-baseline gap-2">
              <p className="text-4xl font-black">{stats.resolved.toString().padStart(2, '0')}</p>
              <CheckCircle2 className="w-5 h-5 text-indigo-300" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input 
              placeholder="Filtrar alertas..." 
              className="pl-10 border-none bg-slate-50 focus-visible:ring-indigo-500 font-medium"
            />
          </div>
          <Button variant="ghost" size="sm" className="text-slate-400 font-bold uppercase text-[10px] tracking-widest gap-2">
            <Filter className="w-3 h-3" /> Filtrar Por Gravidade
          </Button>
        </div>

        <Table>
          <TableHeader className="bg-slate-50">
            <TableRow className="hover:bg-transparent border-slate-100">
              <TableHead className="text-[10px] uppercase font-black text-slate-400 tracking-widest py-4">Data/Hora</TableHead>
              <TableHead className="text-[10px] uppercase font-black text-slate-400 tracking-widest">Tipo de Alerta</TableHead>
              <TableHead className="text-[10px] uppercase font-black text-slate-400 tracking-widest">Descrição</TableHead>
              <TableHead className="text-[10px] uppercase font-black text-slate-400 tracking-widest">Módulo</TableHead>
              <TableHead className="text-[10px] uppercase font-black text-slate-400 tracking-widest">Gravidade</TableHead>
              <TableHead className="text-[10px] uppercase font-black text-slate-400 tracking-widest">Status</TableHead>
              <TableHead className="w-[100px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-20 text-slate-400 font-bold uppercase text-[10px] tracking-widest">
                  Processando registros de auditoria...
                </TableCell>
              </TableRow>
            ) : alerts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-20 text-slate-400 font-bold uppercase text-[10px] tracking-widest">
                  Nenhuma atividade suspeita detectada.
                </TableCell>
              </TableRow>
            ) : (
              alerts.map((alert) => (
                <TableRow key={alert.id} className="group hover:bg-slate-50 border-slate-100 transition-colors">
                  <TableCell className="text-xs font-medium text-slate-500">
                    {format(new Date(alert.created_at), "dd/MM HH:mm", { locale: ptBR })}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="text-sm font-black text-slate-800 uppercase tracking-tight">{alert.alert_type.replace('_', ' ')}</span>
                      <span className="text-[9px] text-slate-400 font-bold">BY: {alert.profiles?.full_name || 'SYSTEM_WATCHER'}</span>
                    </div>
                  </TableCell>
                  <TableCell className="max-w-[300px]">
                    <p className="text-xs text-slate-600 font-medium line-clamp-2">{alert.description}</p>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-[9px] uppercase tracking-widest border-slate-200 text-slate-400">
                      {alert.module}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={`${getSeverityColor(alert.severity)} text-[9px] uppercase font-black tracking-widest px-2 py-0.5`}>
                      {alert.severity}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className={`w-1.5 h-1.5 rounded-full ${alert.status === 'active' ? 'bg-red-500 animate-pulse' : 'bg-green-500'}`}></div>
                      <span className="text-[10px] font-black uppercase text-slate-600 tracking-widest">
                        {alert.status === 'active' ? 'EM ANÁLISE' : 'RESOLVIDO'}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm" className="text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 font-black text-[9px] uppercase tracking-widest gap-2">
                      DETALHES <ArrowRight className="w-3 h-3" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border-none shadow-sm bg-slate-900 text-white overflow-hidden relative">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-bl-full pointer-events-none" />
          <CardHeader>
            <CardTitle className="text-xs font-black text-indigo-400 uppercase tracking-[0.2em] flex items-center gap-2">
              <Eye className="w-4 h-4" /> MONITORAMENTO EM TEMPO REAL
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 font-mono">
              <div className="flex justify-between text-[10px]">
                <span className="text-slate-500">CONEXÕES ATIVAS:</span>
                <span className="text-green-500">12</span>
              </div>
              <div className="flex justify-between text-[10px]">
                <span className="text-slate-500">REQUISIÇÕES/MIN:</span>
                <span className="text-indigo-400">142</span>
              </div>
              <div className="flex justify-between text-[10px]">
                <span className="text-slate-500">INTEGRIDADE DB:</span>
                <span className="text-green-500">100%</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-col justify-center gap-4">
          <p className="text-[10px] uppercase font-black text-slate-400 tracking-[0.3em]">RECOMENDAÇÃO OCS GUARD:</p>
          <div className="p-4 rounded-xl bg-indigo-50 border border-indigo-100">
            <p className="text-sm font-medium text-slate-700 italic">
              "Mantenha o Score acima de 90%. Caso caia abaixo desse limite, a verificação em duas etapas (2FA) será exigida obrigatoriamente para todas as operações financeiras críticas."
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
