import React, { useState, useEffect } from "react";
import { 
  Share2, 
  Webhook, 
  Cpu, 
  MessageSquare, 
  Mail, 
  Send, 
  Settings, 
  Zap, 
  Power, 
  Plus,
  RefreshCcw,
  ExternalLink,
  ShieldCheck,
  Bot
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const JarbasIntegrationHub = () => {
  const [integrations, setIntegrations] = useState<any[]>([]);
  const [activity, setActivity] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const integrationOptions = [
    { provider: 'whatsapp', name: 'WhatsApp Business', icon: MessageSquare, color: 'text-green-500' },
    { provider: 'email', name: 'SMTP Service', icon: Mail, color: 'text-blue-500' },
    { provider: 'telegram', name: 'Telegram Bot', icon: Send, color: 'text-sky-500' },
    { provider: 'crm', name: 'HubSpot CRM', icon: Zap, color: 'text-orange-500' },
    { provider: 'external_erp', name: 'SAP Integration', icon: Cpu, color: 'text-cyan-500' },
    { provider: 'iot', name: 'IoT Sensors', icon: Share2, color: 'text-purple-500' },
  ];

  useEffect(() => {
    void load();
  }, []);

  const load = async () => {
    try {
      const [intRes, logRes] = await Promise.all([
        supabase.from('jarbas_integrations').select('*').order('created_at', { ascending: false }),
        supabase.from('jarbas_external_logs').select('id, action_type, status, created_at, payload, integration_id').order('created_at', { ascending: false }).limit(20),
      ]);
      setIntegrations(intRes.data ?? []);
      setActivity(logRes.data ?? []);
    } catch (error) {
      console.error("Error fetching integrations:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    try {
      const { error } = await supabase
        .from('jarbas_integrations')
        .update({ status: newStatus })
        .eq('id', id);
      if (error) throw error;
      setIntegrations(prev => prev.map(i => i.id === id ? { ...i, status: newStatus } : i));
      toast.success(`Integração ${newStatus === 'active' ? 'ativada' : 'desativada'}`);
    } catch (error) {
      toast.error("Erro ao alterar status");
    }
  };

  return (
    <div className="min-h-screen bg-[#02020a] text-[#00f2ff] p-6 font-mono relative overflow-hidden">
      <div className="absolute inset-0 bg-[linear-gradient(rgba(0,242,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,242,255,0.03)_1px,transparent_1px)] bg-[size:40px_40px]" />
      
      <div className="relative z-10 max-w-7xl mx-auto space-y-8">
        <header className="flex justify-between items-center border-b border-cyan-500/30 pb-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-cyan-500/10 rounded-lg border border-cyan-500/50 relative">
              <Share2 className="w-8 h-8 text-cyan-400" />
              <div className="absolute inset-0 bg-cyan-500/20 blur-xl rounded-full" />
            </div>
            <div>
              <h1 className="text-3xl font-black tracking-tighter uppercase italic">Jarbas API Brain</h1>
              <p className="text-xs text-cyan-400/60 font-bold uppercase tracking-[0.2em]">Hub de Integração e Automação Universal</p>
            </div>
          </div>
          
          <div className="flex gap-4">
             <Button className="bg-cyan-500 hover:bg-cyan-400 text-black font-black uppercase text-xs">
               <Plus className="w-4 h-4 mr-2" /> Nova Integração
             </Button>
             <Button variant="outline" className="border-cyan-500/30 text-cyan-400 h-10 px-4 text-xs font-bold uppercase">
               <Webhook className="w-4 h-4 mr-2" /> Configurar Webhooks
             </Button>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Active Integrations */}
          <div className="lg:col-span-2 space-y-6">
            <h2 className="text-sm font-bold uppercase tracking-[0.3em] flex items-center gap-2">
              <Bot className="w-4 h-4 text-cyan-400" /> Conectores Ativos
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {integrationOptions.map((opt, i) => {
                const active = integrations.find(integ => integ.provider === opt.provider);
                return (
                  <Card key={i} className={`bg-cyan-950/20 border-cyan-500/20 transition-all ${active ? 'opacity-100' : 'opacity-40 grayscale'}`}>
                    <CardContent className="pt-6">
                      <div className="flex justify-between items-start mb-4">
                        <div className={`p-2 rounded bg-white/5 ${opt.color}`}>
                          <opt.icon className="w-5 h-5" />
                        </div>
                        <Switch 
                          checked={active?.status === 'active'} 
                          onCheckedChange={() => active && toggleStatus(active.id, active.status)}
                          disabled={!active}
                        />
                      </div>
                      <h3 className="text-xs font-bold uppercase mb-1">{opt.name}</h3>
                      <div className="flex justify-between items-center">
                        <p className="text-[10px] opacity-60">Status: {active ? active.status : 'não configurado'}</p>
                        {active && (
                          <Button variant="ghost" size="sm" className="h-6 p-0 text-cyan-400 hover:text-cyan-300">
                            <Settings className="w-3 h-3" />
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            <Card className="bg-cyan-950/10 border-cyan-500/20">
              <CardHeader>
                <CardTitle className="text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                  <RefreshCcw className="w-4 h-4 text-cyan-400" /> Atividade Externa Recente
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[300px] pr-4">
                  <div className="space-y-3">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div key={i} className="p-3 border border-white/5 bg-white/5 rounded flex items-center justify-between group hover:bg-white/10 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                          <div>
                            <p className="text-[10px] font-bold uppercase">Envio de Alerta via WhatsApp</p>
                            <p className="text-[8px] opacity-40">Destinatário: Equipe Engenharia (+55 11...)</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="text-[8px] opacity-40">Há 5 min</span>
                          <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer" />
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>

          {/* Webhook & Automation Settings */}
          <div className="space-y-6">
            <h2 className="text-sm font-bold uppercase tracking-[0.3em] flex items-center gap-2">
              <Webhook className="w-4 h-4 text-cyan-400" /> Webhook Engine
            </h2>
            <Card className="bg-cyan-950/20 border-cyan-500/20">
              <CardContent className="pt-6 space-y-6">
                <div className="p-4 rounded border border-cyan-500/30 bg-cyan-500/5">
                  <div className="flex justify-between items-center mb-4">
                    <p className="text-[10px] font-bold uppercase text-cyan-400">Endpoint Principal</p>
                    <Badge className="bg-cyan-500 text-black text-[8px]">SSL_ENCRYPTED</Badge>
                  </div>
                  <code className="text-[9px] block bg-black/40 p-2 rounded break-all border border-white/5">
                    https://api.ocs.erp/v1/jarbas/webhook/xyz-123
                  </code>
                  <Button variant="ghost" size="sm" className="w-full h-8 text-[9px] mt-2 uppercase font-bold text-cyan-400 hover:bg-cyan-500/10">
                    Copiar URL do Webhook
                  </Button>
                </div>

                <div className="space-y-4">
                  <p className="text-[10px] font-bold uppercase opacity-60">Gatilhos de Automação</p>
                  {[
                    { label: 'Risco Crítico Detectado', status: true },
                    { label: 'Atraso de Cronograma', status: true },
                    { label: 'Anomalia Visual (Vision AI)', status: false },
                    { label: 'Relatório Semanal Pronto', status: true },
                  ].map((trigger, i) => (
                    <div key={i} className="flex justify-between items-center">
                      <span className="text-[10px]">{trigger.label}</span>
                      <Switch checked={trigger.status} />
                    </div>
                  ))}
                </div>

                <div className="pt-4 border-t border-white/5">
                  <div className="flex items-center gap-2 p-3 rounded bg-blue-500/5 border border-blue-500/20">
                    <ShieldCheck className="w-4 h-4 text-blue-500" />
                    <div>
                      <p className="text-[9px] font-bold uppercase text-blue-500">Segurança de API</p>
                      <p className="text-[8px] opacity-60 italic">Criptografia RSA-2048 ativa em todas as requisições externas.</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="p-4 border border-cyan-500/30 bg-cyan-500/5 rounded relative overflow-hidden group cursor-pointer hover:bg-cyan-500/10 transition-all">
              <Zap className="absolute -right-4 -bottom-4 w-20 h-20 opacity-5 group-hover:opacity-10 transition-opacity" />
              <p className="text-[10px] font-bold text-cyan-400 mb-1">IA EXTERNAL ACTION:</p>
              <p className="text-[9px] leading-relaxed italic opacity-80">
                "Jarbas pode agora disparar ordens de compra automáticas via SAP quando o estoque de materiais críticos atinge o ponto de ressuprimento."
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
