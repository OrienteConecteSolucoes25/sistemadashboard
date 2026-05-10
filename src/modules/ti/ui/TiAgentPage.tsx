import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { 
  Ticket, 
  Search, 
  Cpu, 
  Shield, 
  Users, 
  BarChart3, 
  Plus, 
  Bot, 
  MessageSquare,
  AlertCircle,
  CheckCircle2,
  Clock,
  ArrowRight
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

type TicketStatus = 'aberto' | 'em_analise' | 'aguardando_usuario' | 'em_execucao' | 'resolvido' | 'cancelado';
type TicketPriority = 'baixa' | 'media' | 'alta' | 'critica';
type TicketCategory = 'acesso' | 'erro_sistema' | 'lentidao' | 'integracao' | 'infraestrutura' | 'seguranca' | 'treinamento' | 'melhoria';

interface ITicket {
  id: string;
  title: string;
  description: string;
  category: TicketCategory;
  priority: TicketPriority;
  status: TicketStatus;
  created_at: string;
}

interface ITicketComment {
  id: string;
  ticket_id: string;
  user_id: string;
  content: string;
  created_at: string;
}

interface IAsset {
  id: string;
  name: string;
  type: string;
  serial_number: string | null;
  status: string;
  user_id: string | null;
}

export default function TiAgentPage() {
  const { user, isAdmin } = useAuth();
  const [tickets, setTickets] = useState<ITicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<ITicket | null>(null);
  const [activeTab, setActiveTab] = useState("chamados");
  const [comments, setComments] = useState<ITicketComment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [assets, setAssets] = useState<IAsset[]>([]);

  // Form states
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newCat, setNewCat] = useState<TicketCategory>("erro_sistema");
  const [newPri, setNewPriority] = useState<TicketPriority>("media");

  // Diagnostic states
  const [diagnosticStep, setDiagnosticStep] = useState(0);
  const [diagnosticAnswers, setDiagnosticInfo] = useState<Record<string, string>>({});

  const loadTickets = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("ti_tickets")
      .select("*")
      .order("created_at", { ascending: false });
    
    if (error) {
      toast.error("Erro ao carregar chamados");
    } else {
      setTickets(data as ITicket[]);
    }
    setLoading(false);
  };

  const loadComments = async (ticketId: string) => {
    const { data, error } = await supabase
      .from("ti_ticket_comments")
      .select("*")
      .eq("ticket_id", ticketId)
      .order("created_at", { ascending: true });
    
    if (!error) setComments(data as ITicketComment[]);
  };

  const loadAssets = async () => {
    const { data, error } = await supabase.from("ti_assets").select("*");
    if (!error) setAssets(data as IAsset[]);
  };

  useEffect(() => {
    loadTickets();
  }, []);

  useEffect(() => {
    if (activeTab === "ativos") loadAssets();
  }, [activeTab]);

  const handleCreateTicket = async () => {
    if (!newTitle || !newDesc) {
      toast.error("Preencha título e descrição");
      return;
    }

    const { error } = await supabase.from("ti_tickets").insert({
      user_id: user?.id,
      title: newTitle,
      description: newDesc,
      category: newCat,
      priority: newPri,
      diagnostic_info: diagnosticAnswers,
      status: 'aberto'
    });

    if (error) {
      toast.error("Erro ao criar chamado");
    } else {
      toast.success("Chamado aberto com sucesso");
      setIsCreating(false);
      setNewTitle("");
      setNewDesc("");
      setDiagnosticStep(0);
      setDiagnosticInfo({});
      loadTickets();
    }
  };

  const handleAddComment = async () => {
    if (!selectedTicket || !newComment) return;
    const { error } = await supabase.from("ti_ticket_comments").insert({
      ticket_id: selectedTicket.id,
      user_id: user?.id,
      content: newComment
    });
    if (!error) {
      setNewComment("");
      loadComments(selectedTicket.id);
    }
  };

  const updateTicketStatus = async (id: string, newStatus: TicketStatus) => {
    const { error } = await supabase.from("ti_tickets").update({ status: newStatus }).eq("id", id);
    if (!error) {
      toast.success("Status atualizado");
      loadTickets();
      if (selectedTicket?.id === id) setSelectedTicket({ ...selectedTicket, status: newStatus });
    }
  };

  const diagnosticQuestions = [
    { 
      q: "O problema impede você de trabalhar completamente?", 
      options: ["Sim, sistema travado", "Não, consigo trabalhar com limitações", "Apenas uma dúvida"],
      key: "impacto"
    },
    { 
      q: "Quando o problema começou?", 
      options: ["Agora mesmo", "Hoje cedo", "Há alguns dias", "Sempre foi assim"],
      key: "quando"
    },
    { 
      q: "Você já tentou reiniciar ou limpar o cache do navegador?", 
      options: ["Sim, sem sucesso", "Não tentei ainda", "Não sei como fazer"],
      key: "tentativa_limpeza"
    }
  ];

  const nextDiagnostic = (answer: string) => {
    const key = diagnosticQuestions[diagnosticStep].key;
    setDiagnosticInfo({ ...diagnosticAnswers, [key]: answer });
    setDiagnosticStep(diagnosticStep + 1);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Cpu className="w-6 h-6 text-primary" /> Agente de TI OCS
          </h1>
          <p className="text-sm text-muted-foreground">Central de suporte técnico e governança digital.</p>
        </div>
        {!isCreating && !selectedTicket && (
          <Button onClick={() => setIsCreating(true)}>
            <Plus className="w-4 h-4 mr-2" /> Novo Chamado
          </Button>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4 md:grid-cols-6 lg:grid-cols-8 h-auto p-1">
          <TabsTrigger value="chamados" className="flex items-center gap-2 py-2">
            <Ticket className="w-4 h-4" /> Chamados
          </TabsTrigger>
          <TabsTrigger value="conhecimento" className="flex items-center gap-2 py-2">
            <Search className="w-4 h-4" /> Base de Conhecimento
          </TabsTrigger>
          <TabsTrigger value="ativos" className="flex items-center gap-2 py-2">
            <Cpu className="w-4 h-4" /> Ativos
          </TabsTrigger>
          <TabsTrigger value="acessos" className="flex items-center gap-2 py-2">
            <Users className="w-4 h-4" /> Acessos
          </TabsTrigger>
          <TabsTrigger value="seguranca" className="flex items-center gap-2 py-2">
            <Shield className="w-4 h-4" /> Segurança
          </TabsTrigger>
          <TabsTrigger value="dashboard" className="flex items-center gap-2 py-2">
            <BarChart3 className="w-4 h-4" /> Dashboard
          </TabsTrigger>
        </TabsList>

        <TabsContent value="chamados" className="mt-6">
          {isCreating ? (
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Abrir Novo Chamado</CardTitle>
                  <CardDescription>Detalhe sua necessidade técnica.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Assunto</Label>
                    <Input value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="Ex: Erro ao gerar relatório" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Categoria</Label>
                      <Select value={newCat} onValueChange={(v: any) => setNewCat(v)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="acesso">Acesso</SelectItem>
                          <SelectItem value="erro_sistema">Erro no Sistema</SelectItem>
                          <SelectItem value="lentidao">Lentidão</SelectItem>
                          <SelectItem value="integracao">Integração</SelectItem>
                          <SelectItem value="infraestrutura">Infraestrutura</SelectItem>
                          <SelectItem value="seguranca">Segurança</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Prioridade</Label>
                      <Select value={newPri} onValueChange={(v: any) => setNewPriority(v)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="baixa">Baixa</SelectItem>
                          <SelectItem value="media">Média</SelectItem>
                          <SelectItem value="alta">Alta</SelectItem>
                          <SelectItem value="critica">Crítica</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Descrição detalhada</Label>
                    <Textarea 
                      value={newDesc} 
                      onChange={e => setNewDesc(e.target.value)} 
                      placeholder="Descreva o que aconteceu, o erro que apareceu, etc."
                      className="min-h-[120px]"
                    />
                  </div>
                  <div className="flex gap-2 justify-end">
                    <Button variant="ghost" onClick={() => setIsCreating(false)}>Cancelar</Button>
                    <Button onClick={handleCreateTicket} disabled={diagnosticStep < diagnosticQuestions.length}>
                      Enviar Chamado
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-primary/5 border-primary/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bot className="w-5 h-5 text-primary" /> Diagnóstico Inteligente
                  </CardTitle>
                  <CardDescription>Responda para agilizar seu atendimento.</CardDescription>
                </CardHeader>
                <CardContent>
                  {diagnosticStep < diagnosticQuestions.length ? (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                      <div className="p-4 bg-background rounded-lg border border-primary/20">
                        <p className="font-medium text-sm mb-4">{diagnosticQuestions[diagnosticStep].q}</p>
                        <div className="space-y-2">
                          {diagnosticQuestions[diagnosticStep].options.map((opt, i) => (
                            <Button 
                              key={i} 
                              variant="outline" 
                              className="w-full justify-start text-xs h-auto py-2"
                              onClick={() => nextDiagnostic(opt)}
                            >
                              <ArrowRight className="w-3 h-3 mr-2 text-primary" /> {opt}
                            </Button>
                          ))}
                        </div>
                      </div>
                      <div className="flex gap-1 justify-center">
                        {diagnosticQuestions.map((_, i) => (
                          <div key={i} className={`h-1.5 w-8 rounded-full transition-colors ${i <= diagnosticStep ? 'bg-primary' : 'bg-muted'}`} />
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center space-y-4 py-8 animate-in zoom-in-95">
                      <div className="bg-green-500/20 w-12 h-12 rounded-full flex items-center justify-center mx-auto">
                        <CheckCircle2 className="text-green-600 w-6 h-6" />
                      </div>
                      <div className="space-y-1">
                        <p className="font-bold text-sm">Diagnóstico Concluído!</p>
                        <p className="text-xs text-muted-foreground">As informações coletadas foram anexadas ao seu chamado.</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="grid gap-4">
              {loading ? (
                <div className="text-center py-20 text-muted-foreground">Carregando chamados...</div>
              ) : tickets.length === 0 ? (
                <Card>
                  <CardContent className="py-20 text-center space-y-4">
                    <Bot className="w-12 h-12 text-muted-foreground mx-auto opacity-20" />
                    <p className="text-muted-foreground">Você não possui chamados abertos no momento.</p>
                    <Button variant="outline" onClick={() => setIsCreating(true)}>Abrir primeiro chamado</Button>
                  </CardContent>
                </Card>
              ) : (
                <>
                  {selectedTicket ? (
                    <div className="space-y-4 animate-in fade-in zoom-in-95">
                      <Button variant="ghost" size="sm" onClick={() => setSelectedTicket(null)}>
                        ← Voltar para lista
                      </Button>
                      <div className="grid md:grid-cols-3 gap-6">
                        <div className="md:col-span-2 space-y-4">
                          <Card>
                            <CardHeader className="pb-2">
                              <div className="flex justify-between items-start">
                                <div>
                                  <Badge variant="outline" className="mb-2 uppercase text-[10px]">{selectedTicket.category.replace('_', ' ')}</Badge>
                                  <CardTitle>{selectedTicket.title}</CardTitle>
                                  <CardDescription>Aberto em {new Date(selectedTicket.created_at).toLocaleString()}</CardDescription>
                                </div>
                                <Badge className={selectedTicket.priority === 'critica' ? 'bg-destructive' : 'bg-primary'}>
                                  {selectedTicket.priority.toUpperCase()}
                                </Badge>
                              </div>
                            </CardHeader>
                            <CardContent className="space-y-6">
                              <div className="p-4 bg-muted/50 rounded-lg text-sm whitespace-pre-wrap">
                                {selectedTicket.description}
                              </div>
                              <div className="space-y-4">
                                <h3 className="text-sm font-bold flex items-center gap-2">
                                  <MessageSquare className="w-4 h-4" /> Comentários e Histórico
                                </h3>
                                <ScrollArea className="h-[300px] border rounded-md p-4 bg-background">
                                  <div className="space-y-4">
                                    {comments.map(comment => (
                                      <div key={comment.id} className={`p-3 rounded-lg text-sm ${comment.user_id === user?.id ? 'bg-primary/5 ml-8 border border-primary/10' : 'bg-muted mr-8'}`}>
                                        <div className="flex justify-between items-center mb-1 text-[10px] text-muted-foreground">
                                          <span className="font-bold">{comment.user_id === user?.id ? 'Você' : 'Técnico'}</span>
                                          <span>{new Date(comment.created_at).toLocaleString()}</span>
                                        </div>
                                        {comment.content}
                                      </div>
                                    ))}
                                    {comments.length === 0 && <p className="text-center text-muted-foreground text-xs py-10">Nenhum comentário ainda.</p>}
                                  </div>
                                </ScrollArea>
                                <div className="flex gap-2">
                                  <Textarea 
                                    value={newComment} 
                                    onChange={e => setNewComment(e.target.value)} 
                                    placeholder="Adicionar comentário..." 
                                    className="min-h-[80px]"
                                  />
                                </div>
                                <Button className="w-full" onClick={handleAddComment}>Enviar Comentário</Button>
                              </div>
                            </CardContent>
                          </Card>
                        </div>
                        <div className="space-y-4">
                          <Card>
                            <CardHeader className="p-4"><CardTitle className="text-sm">Controle Técnico</CardTitle></CardHeader>
                            <CardContent className="p-4 pt-0 space-y-4">
                              <div className="space-y-2">
                                <Label className="text-xs uppercase text-muted-foreground">Status do Chamado</Label>
                                <Select 
                                  value={selectedTicket.status} 
                                  onValueChange={(v: TicketStatus) => updateTicketStatus(selectedTicket.id, v)}
                                  disabled={!isAdmin}
                                >
                                  <SelectTrigger><SelectValue /></SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="aberto">Aberto</SelectItem>
                                    <SelectItem value="em_analise">Em Análise</SelectItem>
                                    <SelectItem value="em_execucao">Em Execução</SelectItem>
                                    <SelectItem value="aguardando_usuario">Aguardando Usuário</SelectItem>
                                    <SelectItem value="resolvido">Resolvido</SelectItem>
                                    <SelectItem value="cancelado">Cancelado</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </CardContent>
                          </Card>
                        </div>
                      </div>
                    </div>
                  ) : (
                    tickets.map(ticket => (
                      <Card 
                        key={ticket.id} 
                        className="hover:bg-muted/30 transition-colors cursor-pointer group mb-4"
                        onClick={() => {
                          setSelectedTicket(ticket);
                          loadComments(ticket.id);
                        }}
                      >
                        <CardContent className="p-4 flex items-center justify-between gap-4">
                          <div className="flex items-center gap-4 flex-1">
                            <div className={`p-2 rounded-full ${
                              ticket.status === 'resolvido' ? 'bg-green-500/10 text-green-600' :
                              ticket.status === 'em_analise' ? 'bg-blue-500/10 text-blue-600' :
                              'bg-amber-500/10 text-amber-600'
                            }`}>
                              {ticket.status === 'resolvido' ? <CheckCircle2 className="w-5 h-5" /> : 
                               ticket.status === 'aberto' ? <AlertCircle className="w-5 h-5" /> : 
                               <Clock className="w-5 h-5" />}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-bold text-sm truncate">{ticket.title}</span>
                                <Badge variant="outline" className="text-[10px] uppercase h-4">{ticket.category.replace('_', ' ')}</Badge>
                              </div>
                              <p className="text-xs text-muted-foreground line-clamp-1">{ticket.description}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-6 shrink-0">
                             <div className="text-right hidden sm:block">
                                <Badge variant="secondary" className="text-[10px]">{ticket.status.replace('_', ' ')}</Badge>
                             </div>
                             <Badge className={`text-[10px] ${
                               ticket.priority === 'critica' ? 'bg-destructive' :
                               ticket.priority === 'alta' ? 'bg-orange-500' :
                               'bg-primary'
                             }`}>{ticket.priority}</Badge>
                             <div className="text-right text-[10px] text-muted-foreground">
                                {new Date(ticket.created_at).toLocaleDateString()}
                             </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </>
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="conhecimento" className="mt-6">
           <Card>
              <CardHeader>
                 <CardTitle>Base de Conhecimento</CardTitle>
                 <CardDescription>Encontre soluções rápidas para problemas comuns.</CardDescription>
                 <div className="relative mt-2">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input className="pl-10" placeholder="Buscar por 'VPN', 'Senha', 'Impressora'..." />
                 </div>
              </CardHeader>
              <CardContent>
                 <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[
                      { t: "Como trocar minha senha do ERP?", c: "Segurança", desc: "Passo a passo para recuperação e troca de senha interna." },
                      { t: "Configurando VPN OCS", c: "Infraestrutura", desc: "Guia para acesso remoto seguro aos sistemas da empresa." },
                      { t: "Limpeza de Cache do Navegador", c: "Treinamento", desc: "Como resolver problemas de carregamento e lentidão." }
                    ].map((art, i) => (
                      <Card key={i} className="hover:border-primary/50 transition-colors cursor-pointer">
                        <CardHeader className="p-4">
                          <Badge variant="outline" className="w-fit mb-2 text-[10px]">{art.c}</Badge>
                          <CardTitle className="text-sm">{art.t}</CardTitle>
                          <CardDescription className="text-xs line-clamp-2">{art.desc}</CardDescription>
                        </CardHeader>
                      </Card>
                    ))}
                 </div>
              </CardContent>
           </Card>
        </TabsContent>
        
        <TabsContent value="ativos" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Gestão de Ativos</CardTitle>
              <CardDescription>Inventário de hardware e software.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {assets.map(asset => (
                  <Card key={asset.id}>
                    <CardHeader className="p-4">
                      <div className="flex justify-between items-start">
                        <Badge variant="outline" className="text-[10px]">{asset.type}</Badge>
                        <Badge variant={asset.status === 'disponivel' ? 'secondary' : 'default'} className="text-[10px]">
                          {asset.status}
                        </Badge>
                      </div>
                      <CardTitle className="text-sm mt-2">{asset.name}</CardTitle>
                      <CardDescription className="text-xs">S/N: {asset.serial_number || 'N/A'}</CardDescription>
                    </CardHeader>
                  </Card>
                ))}
                {assets.length === 0 && (
                  <div className="col-span-full py-10 text-center text-muted-foreground">
                    Nenhum ativo cadastrado.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {["acessos", "seguranca", "dashboard"].map(tab => (
          <TabsContent key={tab} value={tab} className="mt-6">
            <Card>
               <CardContent className="py-20 text-center space-y-4">
                  <Bot className="w-12 h-12 text-muted-foreground mx-auto opacity-20" />
                  <p className="text-muted-foreground">A funcionalidade de <strong>{tab.toUpperCase()}</strong> está sendo preparada pelo time de TI.</p>
               </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
