import React from "react";
import { 
  ShieldAlert, 
  ShieldCheck, 
  Lock, 
  Eye, 
  History, 
  AlertTriangle,
  Zap,
  Activity,
  Fingerprint,
  FileKey,
  Database,
  ShieldX,
  Scale,
  ClipboardCheck,
  LifeBuoy,
  UserCheck,
  Building2,
  Smartphone,
  Cpu,
  Layers,
  Globe,
  MonitorCheck,
  ShieldQuestion
} from "lucide-react";
import { ocsGuard } from "../core/ocsGuardCore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { useJarbasVoice } from "../../jarbas/hooks/useJarbasVoice";

export default function OcsGuardPage() {
  const [isEmergency, setIsEmergency] = React.useState(false);
  const { speak } = useJarbasVoice();

  const handleEmergencyMode = async () => {
    try {
      if (!isEmergency) {
        await ocsGuard.activateEmergencyMode("Ativação manual via Painel de Controle.");
        setIsEmergency(true);
        speak("Atenção. Modo de emergência ativado. Protocolos de segurança nível seis iniciados.");
        toast.error("MODO DE EMERGÊNCIA ATIVADO. Acessos restritos e logs intensificados.", {
          duration: 10000,
        });
      } else {
        setIsEmergency(false);
        speak("Modo de emergência desativado. Retornando aos parâmetros normais de operação.");
        toast.success("Modo de emergência desativado.");
      }
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  return (
    <div className={`min-h-screen p-6 font-mono transition-colors duration-500 ${isEmergency ? 'bg-red-950 text-red-100' : 'bg-[#020617] text-[#00f2ff]'}`}>
      {/* Header Guard */}
      <div className="flex justify-between items-center mb-10 border-b border-cyan-500/20 pb-6">
        <div className="flex items-center gap-4">
          <div className="relative">
            <ShieldAlert className={`w-12 h-12 ${isEmergency ? 'animate-bounce text-red-500' : 'text-cyan-400'}`} />
            <div className={`absolute inset-0 blur-lg rounded-full ${isEmergency ? 'bg-red-500/50' : 'bg-cyan-500/30'}`} />
          </div>
          <div>
            <h1 className="text-3xl font-black tracking-tighter uppercase italic">OCS GUARD — AGENTE DE CIBERSEGURANÇA</h1>
            <p className="text-[10px] opacity-60 font-bold uppercase tracking-[0.3em]">Governança Digital & Proteção de Dados de Elite</p>
          </div>
        </div>

        <Button 
          variant="destructive" 
          size="lg"
          onClick={handleEmergencyMode}
          className={`font-black tracking-widest uppercase border-2 ${isEmergency ? 'bg-white text-red-600 border-white animate-pulse' : 'bg-red-600 border-red-500 shadow-[0_0_20px_rgba(220,38,38,0.5)]'}`}
        >
          {isEmergency ? "DESATIVAR EMERGÊNCIA" : "MODO EMERGÊNCIA"}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Status de Risco Global */}
        <Card className="md:col-span-1 bg-slate-900/50 border-cyan-500/20 text-cyan-400">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-bold uppercase flex items-center gap-2">
              <Activity className="w-4 h-4" /> SCORE DE SEGURANÇA
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center">
              <div className="text-5xl font-black mb-2">94<span className="text-xl">/100</span></div>
              <Badge className="bg-green-500 text-black font-bold">NÍVEL: SEGURO</Badge>
            </div>
            <div className="space-y-3">
              <div className="space-y-1">
                <div className="flex justify-between text-[10px] uppercase font-bold">
                  <span>Financeiro</span>
                  <span>98%</span>
                </div>
                <Progress value={98} className="h-1 bg-slate-800" />
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-[10px] uppercase font-bold">
                  <span>Jurídico</span>
                  <span>85%</span>
                </div>
                <Progress value={85} className="h-1 bg-slate-800" />
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-[10px] uppercase font-bold">
                  <span>RH & DP</span>
                  <span>92%</span>
                </div>
                <Progress value={92} className="h-1 bg-slate-800" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Trilha de Auditoria em Tempo Real */}
        <Card className="md:col-span-2 bg-slate-900/50 border-cyan-500/20 text-cyan-400">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-bold uppercase flex items-center gap-2">
              <History className="w-4 h-4" /> TRILHA DE AUDITORIA (LIVE)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { time: '14:22:01', user: 'admin@ocs.com', action: 'EXPORT_FINANCE_REPORT', status: 'WARN' },
                { time: '14:15:45', user: 'rh_manager@cliente.com', action: 'UPDATE_PERMISSIONS', status: 'INFO' },
                { time: '13:58:12', user: 'root_ocs', action: 'VAULT_ACCESS', status: 'SECURE' },
              ].map((log, i) => (
                <div key={i} className="flex gap-4 items-center p-2 rounded bg-slate-950/50 border border-white/5 text-[10px]">
                  <span className="opacity-40">{log.time}</span>
                  <Badge variant="outline" className="text-[8px] border-cyan-500/30 text-cyan-500">{log.user}</Badge>
                  <span className="font-bold tracking-wider">{log.action}</span>
                  <span className={`ml-auto font-bold ${log.status === 'WARN' ? 'text-amber-500' : 'text-green-500'}`}>{log.status}</span>
                </div>
              ))}
            </div>

            {/* Nova Seção: Alertas Financeiros Suspeitos */}
            <div className="mt-6 border-t border-red-500/20 pt-4">
              <h3 className="text-[10px] font-bold text-red-500 mb-3 flex items-center gap-2 italic">
                <ShieldAlert className="w-3 h-3" /> ALERTAS FINANCEIROS DE ALTO RISCO
              </h3>
              <div className="space-y-2">
                <div className="p-2 rounded bg-red-500/10 border border-red-500/30 flex justify-between items-center animate-pulse">
                  <div className="text-[9px]">
                    <span className="font-bold block">EXPORTAÇÃO EM MASSA DETECTADA</span>
                    <span className="opacity-60 uppercase italic">Módulo Financeiro • Há 2 min</span>
                  </div>
                  <Button size="sm" variant="destructive" className="h-6 text-[8px] font-bold">BLOQUEAR IP</Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Central de Vulnerabilidades */}
        <Card className="md:col-span-1 bg-slate-900/50 border-cyan-500/20 text-cyan-400">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-bold uppercase flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" /> VULNERABILIDADES
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-3 rounded border border-amber-500/30 bg-amber-500/5">
              <div className="text-[10px] font-bold text-amber-500 mb-1">MÉDIA PRIORIDADE</div>
              <p className="text-[11px] leading-tight">3 usuários sem autenticação em duas etapas (2FA) ativa.</p>
            </div>
            <div className="p-3 rounded border border-cyan-500/20 bg-cyan-500/5">
              <div className="text-[10px] font-bold text-cyan-500 mb-1">DICA DE GOVERNANÇA</div>
              <p className="text-[11px] leading-tight">Revisar política de retenção de documentos do Jurídico.</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
        {/* Cofre de Credenciais (Mock UI) */}
        <Card className="bg-slate-900/50 border-cyan-500/20 text-cyan-400">
          <CardHeader>
            <CardTitle className="text-xs font-bold uppercase flex items-center gap-2">
              <FileKey className="w-4 h-4" /> COFRE DE CREDENCIAIS
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center p-2 bg-slate-950 rounded border border-white/5">
              <div className="text-[10px] font-bold">API_STRIPE_PROD</div>
              <div className="text-[10px] opacity-40">sk_live_••••••••1234</div>
              <Eye className="w-3 h-3 cursor-pointer hover:text-white" />
            </div>
            <div className="flex justify-between items-center p-2 bg-slate-950 rounded border border-white/5">
              <div className="text-[10px] font-bold">AWS_S3_UPLOADS</div>
              <div className="text-[10px] opacity-40">AKIA••••••••7890</div>
              <Eye className="w-3 h-3 cursor-pointer hover:text-white" />
            </div>
          </CardContent>
        </Card>

        {/* Sistema de Aprovações */}
        <Card className="bg-slate-900/50 border-cyan-500/20 text-cyan-400">
          <CardHeader>
            <CardTitle className="text-xs font-bold uppercase flex items-center gap-2">
              <Fingerprint className="w-4 h-4" /> APROVAÇÕES PENDENTES
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-center py-8">
            <ShieldCheck className="w-12 h-12 mx-auto opacity-10 mb-2" />
            <p className="text-[10px] opacity-40">NENHUMA AÇÃO CRÍTICA AGUARDANDO APROVAÇÃO</p>
          </CardContent>
        </Card>

        {/* Políticas de Segurança */}
        <Card className="bg-slate-900/50 border-cyan-500/20 text-cyan-400">
          <CardHeader>
            <CardTitle className="text-xs font-bold uppercase flex items-center gap-2">
              <Lock className="w-4 h-4" /> POLÍTICAS ATIVAS
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-2">
            {['2FA_OBRIGATORIO', 'LOGOUT_60MIN', 'RESTRICAO_IP', 'AUDIT_FULL', 'LGPD_COMPLIANT', 'ENCRYPT_AT_REST'].map(policy => (
            <Badge key={policy} variant="outline" className="text-[8px] border-cyan-500/20 text-cyan-500 justify-center">
                {policy}
              </Badge>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-6">
        {/* Central de Compliance (LGPD/ISO/SOC2) */}
        <Card className="bg-slate-900/50 border-cyan-500/20 text-cyan-400">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-bold uppercase flex items-center gap-2">
              <Scale className="w-4 h-4" /> STATUS DE COMPLIANCE
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-bold">LGPD (Brasil)</span>
              <Badge className="bg-green-600 text-white text-[8px]">100% OK</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-bold">ISO 27001</span>
              <Badge className="bg-amber-600 text-white text-[8px]">82% ATIVO</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-bold">SOC2 Type II</span>
              <Badge className="bg-blue-600 text-white text-[8px]">EM AUDITORIA</Badge>
            </div>
          </CardContent>
        </Card>

        {/* Gestão de Incidentes de Compliance */}
        <Card className="md:col-span-2 bg-slate-900/50 border-cyan-500/20 text-cyan-400">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-bold uppercase flex items-center gap-2">
              <LifeBuoy className="w-4 h-4" /> GESTÃO DE INCIDENTES & REMEDIAÇÃO
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="p-2 rounded border border-cyan-500/20 bg-cyan-500/5 flex justify-between items-center">
                <div>
                  <div className="text-[10px] font-bold">INC_2026_05_10_A</div>
                  <div className="text-[8px] opacity-60">Acesso indevido ao módulo RH detectado e bloqueado.</div>
                </div>
                <Badge variant="outline" className="text-[8px] border-green-500 text-green-500">RESOLVIDO</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-6 pb-20">
        {/* Sistema de Reputação de Usuários */}
        <Card className="bg-slate-900/50 border-cyan-500/20 text-cyan-400">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-bold uppercase flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-green-400" /> REPUTAÇÃO DE USUÁRIOS
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center text-[10px]">
              <span className="opacity-60 italic">admin@ocs.com</span>
              <span className="font-bold text-green-400">99 pts</span>
            </div>
            <div className="flex justify-between items-center text-[10px]">
              <span className="opacity-60 italic">user_tmp_9@...</span>
              <span className="font-bold text-amber-400">72 pts</span>
            </div>
            <div className="text-[8px] opacity-40 uppercase mt-4">Fatores: Comportamento, 2FA, Histórico</div>
          </CardContent>
        </Card>

        {/* Confiança de Dispositivos & Sessões */}
        <Card className="bg-slate-900/50 border-cyan-500/20 text-cyan-400">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-bold uppercase flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-cyan-400" /> CONFIANÇA DE DISPOSITIVOS
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center text-[10px]">
              <span className="font-bold">MacBook Pro (São Paulo)</span>
              <Badge className="bg-green-600 text-white text-[8px]">CONFIÁVEL</Badge>
            </div>
            <div className="flex justify-between items-center text-[10px]">
              <span className="font-bold">Mobile (Nova York)</span>
              <Badge className="bg-red-600 text-white text-[8px]">SUSPEITO</Badge>
            </div>
          </CardContent>
        </Card>

        {/* Score de Integrações Externas */}
        <Card className="bg-slate-900/50 border-cyan-500/20 text-cyan-400">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-bold uppercase flex items-center gap-2">
              <Building2 className="w-4 h-4 text-blue-400" /> REPUTAÇÃO DE EMPRESAS
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-center py-6">
            <div className="text-3xl font-black text-cyan-500">A+</div>
            <p className="text-[10px] opacity-60 uppercase">NÍVEL DE CONFIANÇA CORPORATIVO</p>
          </CardContent>
        </Card>

        {/* Reputação de Módulos (Uptime/Erros) */}
        <Card className="bg-slate-900/50 border-cyan-500/20 text-cyan-400">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-bold uppercase flex items-center gap-2">
              <Cpu className="w-4 h-4 text-purple-400" /> INTEGRIDADE DE MÓDULOS
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center text-[9px] uppercase font-bold">
              <span>Financeiro</span>
              <span className="text-green-500">ESTÁVEL</span>
            </div>
            <div className="flex justify-between items-center text-[9px] uppercase font-bold">
              <span>Jarbas Core</span>
              <span className="text-green-500">ESTÁVEL</span>
            </div>
            <div className="flex justify-between items-center text-[9px] uppercase font-bold">
              <span>Ocs Guard</span>
              <span className="text-cyan-500">OTIMIZADO</span>
            </div>
          </CardContent>
        </Card>

        {/* Cadeia de Custódia / Evidências */}
        <Card className="bg-slate-900/50 border-cyan-500/20 text-cyan-400">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-bold uppercase flex items-center gap-2">
              <ClipboardCheck className="w-4 h-4" /> CADEIA DE CUSTÓDIA
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2 p-2 bg-slate-950 rounded border border-white/5 cursor-pointer hover:bg-slate-900">
              <Database className="w-3 h-3 opacity-40" />
              <div className="text-[9px]">Snapshot de Logs Integridade [SHA-256]</div>
            </div>
            <div className="flex items-center gap-2 p-2 bg-slate-950 rounded border border-white/5 cursor-pointer hover:bg-slate-900">
              <FileKey className="w-3 h-3 opacity-40" />
              <div className="text-[9px]">Evidência de Backup Criptografado</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Footer Estilo Central de Operações */}
      <div className="fixed bottom-0 left-0 right-0 p-2 px-6 flex justify-between items-center text-[8px] uppercase tracking-widest opacity-40 bg-black/40 backdrop-blur-md">
        <div className="flex gap-4">
          <span className="flex items-center gap-1"><Zap className="w-2 h-2" /> SOC_STATUS: ACTIVE</span>
          <span className="flex items-center gap-1"><Database className="w-2 h-2" /> DATA_ENCRYPTION: AES-256</span>
        </div>
        <span>OCS-GUARD-SECURITY-SUITE // VERSION 1.0.2</span>
      </div>
    </div>
  );
}
