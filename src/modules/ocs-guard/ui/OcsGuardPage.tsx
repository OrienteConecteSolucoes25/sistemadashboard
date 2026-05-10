import { useState, useEffect } from "react";
import { 
  Shield, 
  Lock, 
  UserCheck, 
  AlertTriangle, 
  Eye, 
  FileText, 
  Activity, 
  Server,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Clock,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  Search,
  ArrowRight
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog";

// Mock data realista
const securityScore = 72;

const riskCards = [
  { title: "Senhas Fracas", count: 3, severity: "high", description: "Usuários com senhas fáceis de adivinhar.", icon: Lock },
  { title: "Ausência de 2FA", count: 8, severity: "critical", description: "Contas sem autenticação de dois fatores.", icon: ShieldCheck },
  { title: "Usuários Inativos", count: 2, severity: "medium", description: "Contas sem login há mais de 60 dias.", icon: Clock },
  { title: "Permissões Excessivas", count: 4, severity: "high", description: "Usuários com privilégios de admin sem necessidade.", icon: UserCheck },
];

const loginAudit = [
  { id: 1, user: "admin@ocs.com", event: "Login bem-sucedido", time: "Há 5 minutos", ip: "192.168.1.1", status: "success" },
  { id: 2, user: "gestor@ocs.com", event: "Falha de login", time: "Há 2 horas", ip: "201.45.12.89", status: "failed" },
  { id: 3, user: "visitante@gmail.com", event: "Acesso fora de horário", time: "Ontem às 23:45", ip: "187.5.22.10", status: "warning" },
  { id: 4, user: "brenda.goncalves@novacorrente.ind.br", event: "Login bem-sucedido", time: "Há 4 horas", ip: "192.168.1.5", status: "success" },
];

const dataSensitive = [
  { field: "CPF/CNPJ", module: "RH/DP", classification: "Sensível", protection: "Nenhuma", count: 1250 },
  { field: "Dados Bancários", module: "Planos", classification: "Crítico", protection: "Criptografia", count: 850 },
  { field: "Endereço", module: "Engenharia", classification: "Confidencial", protection: "Mascarado", count: 3400 },
];

const lgpdChecklist = [
  { question: "Existe um encarregado de dados (DPO) nomeado?", status: "compliant" },
  { question: "A política de privacidade está atualizada e visível?", status: "not_compliant" },
  { question: "Os usuários podem solicitar a exclusão de seus dados?", status: "compliant" },
  { question: "Dados sensíveis são armazenados com criptografia?", status: "pending" },
];

export default function OcsGuardPage() {
  const [activeTab, setActiveTab] = useState("dashboard");

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Shield className="w-8 h-8 text-primary" /> OCS Guard
          </h1>
          <p className="text-muted-foreground">Agente de Cibersegurança e Governança Digital</p>
        </div>
        <div className="flex items-center gap-3 bg-muted/50 p-3 rounded-lg border">
          <div className="text-right">
            <div className="text-xs text-muted-foreground uppercase font-semibold">Score de Segurança</div>
            <div className="text-2xl font-bold text-primary">{securityScore}/100</div>
          </div>
          <div className="w-16 h-16 relative">
             {/* Simulação de um gauge circular simplificado */}
             <div className="absolute inset-0 flex items-center justify-center">
                <ShieldCheck className="w-8 h-8 text-primary opacity-20" />
             </div>
             <svg className="w-full h-full transform -rotate-90">
               <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="4" fill="transparent" className="text-muted" />
               <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="4" fill="transparent" strokeDasharray={175.9} strokeDashoffset={175.9 * (1 - securityScore / 100)} className="text-primary" />
             </svg>
          </div>
        </div>
      </div>

      <Tabs defaultValue="dashboard" className="w-full" onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 lg:grid-cols-7 h-auto p-1">
          <TabsTrigger value="dashboard" className="flex items-center gap-2 py-2">
            <Activity className="w-4 h-4" /> <span className="hidden sm:inline">Dashboard</span>
          </TabsTrigger>
          <TabsTrigger value="audit" className="flex items-center gap-2 py-2">
            <Search className="w-4 h-4" /> <span className="hidden sm:inline">Auditoria</span>
          </TabsTrigger>
          <TabsTrigger value="permissions" className="flex items-center gap-2 py-2">
            <UserCheck className="w-4 h-4" /> <span className="hidden sm:inline">Governança</span>
          </TabsTrigger>
          <TabsTrigger value="data" className="flex items-center gap-2 py-2">
            <Lock className="w-4 h-4" /> <span className="hidden sm:inline">Dados</span>
          </TabsTrigger>
          <TabsTrigger value="lgpd" className="flex items-center gap-2 py-2">
            <FileText className="w-4 h-4" /> <span className="hidden sm:inline">LGPD</span>
          </TabsTrigger>
          <TabsTrigger value="integrations" className="flex items-center gap-2 py-2">
            <Server className="w-4 h-4" /> <span className="hidden sm:inline">Integrações</span>
          </TabsTrigger>
          <TabsTrigger value="incidents" className="flex items-center gap-2 py-2">
            <AlertCircle className="w-4 h-4" /> <span className="hidden sm:inline">Incidentes</span>
          </TabsTrigger>
        </TabsList>

        {/* DASHBOARD */}
        <TabsContent value="dashboard" className="space-y-6 mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {riskCards.map((card, i) => (
              <Card key={i} className="relative overflow-hidden group hover:shadow-md transition-shadow">
                <div className={`absolute top-0 left-0 w-1 h-full ${
                  card.severity === 'critical' ? 'bg-destructive' : 
                  card.severity === 'high' ? 'bg-orange-500' : 'bg-yellow-500'
                }`} />
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <card.icon className="w-5 h-5 text-muted-foreground" />
                    <Badge variant={card.severity === 'critical' ? 'destructive' : 'outline'}>
                      {card.severity.toUpperCase()}
                    </Badge>
                  </div>
                  <CardTitle className="text-lg mt-2">{card.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold mb-1">{card.count}</div>
                  <p className="text-xs text-muted-foreground">{card.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <ArrowRight className="w-4 h-4 text-primary" /> Ações Recomendadas
                </CardTitle>
                <CardDescription>Melhore seu score de segurança com estas ações rápidas.</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-[300px]">
                  <div className="divide-y">
                    {[
                      { action: "Ativar Autenticação de Dois Fatores (2FA)", priority: "Critical", time: "2 min", impact: "+15 pts" },
                      { action: "Revisar usuários sem login há 90 dias", priority: "High", time: "5 min", impact: "+8 pts" },
                      { action: "Criptografar campos de CPF no módulo RH", priority: "High", time: "10 min", impact: "+10 pts" },
                      { action: "Atualizar Política de Privacidade LGPD", priority: "Medium", time: "15 min", impact: "+5 pts" },
                    ].map((item, i) => (
                      <div key={i} className="flex items-center justify-between p-4 hover:bg-muted/30">
                        <div className="space-y-1">
                          <div className="text-sm font-medium">{item.action}</div>
                          <div className="flex items-center gap-2 text-[10px]">
                            <Badge variant={item.priority === 'Critical' ? 'destructive' : 'secondary'} className="px-1 py-0 h-4">
                              {item.priority}
                            </Badge>
                            <span className="text-muted-foreground flex items-center gap-0.5">
                              <Clock className="w-3 h-3" /> {item.time}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                           <span className="text-xs font-bold text-primary">{item.impact}</span>
                           <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                              <ChevronRight className="w-4 h-4" />
                           </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Distribuição de Riscos</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span>Identidade e Acesso</span>
                    <span className="font-bold">65%</span>
                  </div>
                  <Progress value={65} className="h-2" />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span>Proteção de Dados</span>
                    <span className="font-bold">40%</span>
                  </div>
                  <Progress value={40} className="h-2" />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span>Conformidade (LGPD)</span>
                    <span className="font-bold">85%</span>
                  </div>
                  <Progress value={85} className="h-2" />
                </div>
                <div className="pt-4 border-t text-xs text-muted-foreground">
                  <p>O foco principal deve ser em <strong>Proteção de Dados</strong> neste mês.</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* AUDITORIA */}
        <TabsContent value="audit" className="space-y-4 mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Auditoria de Acessos Recentes</CardTitle>
              <CardDescription>Monitoramento em tempo real de tentativas de entrada no sistema.</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Usuário</TableHead>
                    <TableHead>Evento</TableHead>
                    <TableHead>Horário</TableHead>
                    <TableHead>IP</TableHead>
                    <TableHead className="text-right">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loginAudit.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="font-medium text-xs">{log.user}</TableCell>
                      <TableCell className="text-xs">{log.event}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{log.time}</TableCell>
                      <TableCell className="text-xs font-mono">{log.ip}</TableCell>
                      <TableCell className="text-right">
                        {log.status === 'success' ? <CheckCircle2 className="w-4 h-4 text-green-500 ml-auto" /> : 
                         log.status === 'failed' ? <XCircle className="w-4 h-4 text-destructive ml-auto" /> :
                         <AlertTriangle className="w-4 h-4 text-orange-500 ml-auto" />}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* GOVERNANÇA */}
        <TabsContent value="permissions" className="space-y-4 mt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle className="text-lg">Governança de Permissões</CardTitle>
                <CardDescription>Usuários com privilégios que podem ser reduzidos (Princípio do Menor Privilégio).</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { user: "Brenda Gonçalves", role: "Gestora", module: "Engenharia", issue: "Acesso total ao Financeiro sem uso há 30 dias.", suggestion: "Remover permissão de Escrita no Financeiro." },
                    { user: "Clebson Silva", role: "Consultor", module: "Jurídico", issue: "Acesso a todos os documentos da empresa.", suggestion: "Limitar acesso apenas ao Setor Jurídico." },
                  ].map((p, i) => (
                    <div key={i} className="p-4 border rounded-lg flex items-start justify-between gap-4">
                      <div className="space-y-1">
                        <div className="font-semibold text-sm">{p.user} <Badge variant="outline" className="text-[10px] ml-2 font-normal">{p.role}</Badge></div>
                        <div className="text-xs text-destructive flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> {p.issue}</div>
                        <div className="text-xs text-muted-foreground mt-2 bg-muted p-2 rounded"><strong>Sugestão:</strong> {p.suggestion}</div>
                      </div>
                      <Button size="sm" variant="outline" className="shrink-0 h-8">Avaliar Ajuste</Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Métricas de Privilégio</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex justify-between items-center">
                   <span className="text-sm">Admins Totais</span>
                   <span className="text-2xl font-bold">12</span>
                </div>
                <div className="flex justify-between items-center">
                   <span className="text-sm">Super-usuários</span>
                   <span className="text-2xl font-bold">3</span>
                </div>
                <div className="pt-4 border-t">
                  <div className="text-xs text-muted-foreground mb-2">Qualidade do Privilégio</div>
                  <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-orange-500 w-[45%]" />
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-2 italic">Dica: Reduzir admins melhora o score em até 20 pontos.</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* DADOS */}
        <TabsContent value="data" className="space-y-4 mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Classificação de Dados Sensíveis</CardTitle>
              <CardDescription>Campos identificados que requerem proteção especial.</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Campo</TableHead>
                    <TableHead>Módulo</TableHead>
                    <TableHead>Classificação</TableHead>
                    <TableHead>Proteção Atual</TableHead>
                    <TableHead className="text-right">Registros</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dataSensitive.map((item, i) => (
                    <TableRow key={i}>
                      <TableCell className="font-medium text-xs">{item.field}</TableCell>
                      <TableCell className="text-xs">{item.module}</TableCell>
                      <TableCell>
                        <Badge variant={item.classification === 'Crítico' ? 'destructive' : 'outline'} className="text-[10px]">
                          {item.classification}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs">
                        <span className={item.protection === 'Nenhuma' ? 'text-destructive font-bold' : 'text-green-500'}>
                          {item.protection}
                        </span>
                      </TableCell>
                      <TableCell className="text-right text-xs font-mono">{item.count}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* LGPD */}
        <TabsContent value="lgpd" className="space-y-4 mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Checklist LGPD</CardTitle>
                <CardDescription>Avalie a conformidade da sua empresa com a Lei Geral de Proteção de Dados.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {lgpdChecklist.map((item, i) => (
                  <div key={i} className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="mt-0.5">
                      {item.status === 'compliant' ? <CheckCircle2 className="w-5 h-5 text-green-500" /> : 
                       item.status === 'not_compliant' ? <XCircle className="w-5 h-5 text-destructive" /> :
                       <Clock className="w-5 h-5 text-muted-foreground" />}
                    </div>
                    <div className="text-sm">{item.question}</div>
                  </div>
                ))}
                <Button className="w-full mt-4">Gerar Relatório de Conformidade</Button>
              </CardContent>
            </Card>
            <Card className="bg-primary/5 border-primary/20">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                   <ShieldCheck className="w-5 h-5 text-primary" /> Roadmap LGPD
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-3 bg-background border rounded-lg shadow-sm">
                  <div className="text-xs font-bold text-primary mb-1">PRÓXIMO PASSO</div>
                  <div className="text-sm font-medium">Publicar Aviso de Cookies</div>
                  <p className="text-xs text-muted-foreground mt-1">É obrigatório informar ao usuário sobre a coleta de dados de navegação.</p>
                </div>
                <div className="p-3 opacity-60">
                  <div className="text-[10px] font-bold mb-1 uppercase tracking-wider">Passo 2</div>
                  <div className="text-sm">Implementar Criptografia em Repouso</div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* INTEGRAÇÕES */}
        <TabsContent value="integrations" className="space-y-4 mt-6">
           <Card>
              <CardHeader>
                <CardTitle className="text-lg">Monitor de Integrações</CardTitle>
                <CardDescription>Conexões externas e chaves de API ativas.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { name: "Google Social Login", status: "Inativo", security: "Seguro", risk: "Baixo" },
                    { name: "Supabase Database Client", status: "Ativo", security: "Seguro", risk: "Baixo" },
                    { name: "Custom Webhook (financeiro)", status: "Ativo", security: "Token Antigo", risk: "Médio" },
                  ].map((int, i) => (
                    <div key={i} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Server className="w-4 h-4 text-muted-foreground" />
                        <div>
                          <div className="text-sm font-medium">{int.name}</div>
                          <div className="text-[10px] text-muted-foreground">{int.status} · Responsável: Admin</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={int.risk === 'Baixo' ? 'outline' : 'secondary'}>{int.risk} Risco</Badge>
                        <Button size="icon" variant="ghost" className="h-8 w-8"><ExternalLink className="w-4 h-4" /></Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
           </Card>
        </TabsContent>

        {/* INCIDENTES */}
        <TabsContent value="incidents" className="space-y-4 mt-6">
           <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="text-lg">Resposta a Incidentes</CardTitle>
                  <CardDescription>Assistente passo a passo para contenção de falhas de segurança.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="p-4 bg-muted rounded-xl border border-dashed border-muted-foreground/30 text-center space-y-3">
                    <AlertCircle className="w-10 h-10 text-muted-foreground/50 mx-auto" />
                    <div>
                      <div className="font-semibold">Nenhum incidente ativo</div>
                      <p className="text-xs text-muted-foreground">O sistema está operando normalmente.</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Button variant="destructive" className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4" /> Reportar Invasão
                    </Button>
                    <Button variant="outline" className="flex items-center gap-2">
                      <Lock className="w-4 h-4" /> Bloquear Acessos Externos
                    </Button>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Guia de Contenção</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-xs">
                  <div className="p-2 border rounded bg-yellow-500/10 border-yellow-500/20">
                    <strong>1. Identifique a Origem:</strong> Verifique os logs de auditoria para encontrar o IP atacante.
                  </div>
                  <div className="p-2 border rounded">
                    <strong>2. Isole o Sistema:</strong> Remova as chaves de API afetadas e troque senhas críticas.
                  </div>
                  <div className="p-2 border rounded">
                    <strong>3. Notifique as Partes:</strong> Informe os usuários se houver risco de vazamento de dados confidenciais.
                  </div>
                </CardContent>
              </Card>
           </div>
        </TabsContent>
      </Tabs>

      <div className="flex items-center gap-2 p-4 bg-muted/30 rounded-lg border text-[11px] text-muted-foreground">
        <ShieldCheck className="w-4 h-4 text-primary" />
        <span>OCS Guard — Monitoramento ativo desde {new Date().toLocaleDateString('pt-BR')}. Este sistema é exclusivamente defensivo.</span>
      </div>
    </div>
  );
}
