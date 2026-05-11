import React from "react";
import { 
  ShieldCheck, 
  FileLock, 
  EyeOff, 
  History, 
  AlertCircle, 
  Fingerprint,
  Lock,
  Search,
  CheckCircle2,
  Scale
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";

export const ComplianceGovernanceDashboard = () => {
  return (
    <div className="min-h-screen bg-[#f8fafc] p-6 space-y-6">
      <header className="flex justify-between items-center mb-8 border-b pb-6">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-indigo-100 rounded-xl">
            <ShieldCheck className="w-8 h-8 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Compliance & Governança OCS</h1>
            <p className="text-slate-500 text-sm">Estrutura de conformidade corporativa e proteção de dados</p>
          </div>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="gap-2">
            <History className="w-4 h-4" /> Log de Auditoria
          </Button>
          <Button className="bg-indigo-600 hover:bg-indigo-700 gap-2">
            <Scale className="w-4 h-4" /> Relatório de Conformidade
          </Button>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between items-start mb-4">
              <div className="p-2 bg-green-100 rounded-lg text-green-600">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <Badge variant="outline" className="text-green-600 border-green-200">92% OK</Badge>
            </div>
            <h3 className="text-sm font-semibold text-slate-700">LGPD Adequação</h3>
            <p className="text-2xl font-bold text-slate-900 mt-1">Conforme</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between items-start mb-4">
              <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                <Lock className="w-5 h-5" />
              </div>
              <Badge variant="outline" className="text-blue-600 border-blue-200">ISO 27001</Badge>
            </div>
            <h3 className="text-sm font-semibold text-slate-700">Segurança da Informação</h3>
            <p className="text-2xl font-bold text-slate-900 mt-1">Auditado</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between items-start mb-4">
              <div className="p-2 bg-amber-100 rounded-lg text-amber-600">
                <AlertCircle className="w-5 h-5" />
              </div>
              <Badge className="bg-amber-500">2 Alertas</Badge>
            </div>
            <h3 className="text-sm font-semibold text-slate-700">Incidentes Ativos</h3>
            <p className="text-2xl font-bold text-slate-900 mt-1">Crítico</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between items-start mb-4">
              <div className="p-2 bg-purple-100 rounded-lg text-purple-600">
                <Fingerprint className="w-5 h-5" />
              </div>
              <Badge variant="outline" className="text-purple-600 border-purple-200">SOC2 Type II</Badge>
            </div>
            <h3 className="text-sm font-semibold text-slate-700">Trust Services</h3>
            <p className="text-2xl font-bold text-slate-900 mt-1">Validado</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="bg-slate-100 border p-1">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="policies">Políticas & Gestão</TabsTrigger>
          <TabsTrigger value="evidence">Evidências de Auditoria</TabsTrigger>
          <TabsTrigger value="checklist">Checklist de Adequação</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="text-lg">Trilha de Governança Enterprise</CardTitle>
              <CardDescription>Rastreabilidade completa de ações administrativas e estruturais</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <div className="space-y-4">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div key={i} className="flex items-start gap-4 p-4 border rounded-lg hover:bg-slate-50 transition-colors">
                      <div className="p-2 bg-slate-100 rounded text-slate-500">
                        <History className="w-4 h-4" />
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between">
                          <p className="text-sm font-semibold text-slate-900 underline">Alteração Estrutural de Permissões</p>
                          <span className="text-[10px] text-slate-400 font-mono">ID: {8821 + i}</span>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">Usuário: Admin OCS | Módulo: ADM - Visibilidade</p>
                        <p className="text-xs text-slate-600 mt-2 italic bg-slate-100 p-2 rounded border-l-4 border-indigo-400">
                          "Ocultado módulo Financeiro para a empresa cliente ID_882."
                        </p>
                      </div>
                      <div className="text-right">
                        <Badge className="bg-indigo-100 text-indigo-700 border-indigo-200 text-[10px]">OPERACIONAL</Badge>
                        <p className="text-[10px] text-slate-400 mt-2">Há {i * 10} min</p>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Modo Invisível (ADM)</CardTitle>
                <CardDescription>Status da separação de ambientes</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center p-3 border rounded bg-slate-50">
                  <div className="flex items-center gap-2 text-sm text-slate-700">
                    <EyeOff className="w-4 h-4 text-slate-400" /> Proteção Estrutural
                  </div>
                  <Badge className="bg-green-500">ATIVO</Badge>
                </div>
                <div className="flex justify-between items-center p-3 border rounded bg-slate-50">
                  <div className="flex items-center gap-2 text-sm text-slate-700">
                    <FileLock className="w-4 h-4 text-slate-400" /> Logs Globais Ocultos
                  </div>
                  <Badge className="bg-green-500">ATIVO</Badge>
                </div>
                <div className="p-3 border-l-4 border-amber-500 bg-amber-50 rounded text-xs text-amber-700 italic">
                  "Ambiente do cliente restrito à visão operacional básica. Infraestrutura OCS protegida."
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Score de Confiança</CardTitle>
                <CardDescription>Status de risco atual do sistema</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center py-4">
                  <span className="text-4xl font-black text-slate-900">98.4</span>
                  <p className="text-xs text-slate-500 mt-1 uppercase tracking-widest font-bold">Risco Baixo</p>
                </div>
                <Progress value={98} className="h-2" />
                <div className="space-y-2">
                  <div className="flex justify-between text-[10px] uppercase font-bold text-slate-500">
                    <span>Usuários</span>
                    <span className="text-green-600">SEGURO</span>
                  </div>
                  <div className="flex justify-between text-[10px] uppercase font-bold text-slate-500">
                    <span>Integrações</span>
                    <span className="text-amber-600">ALERTA</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
