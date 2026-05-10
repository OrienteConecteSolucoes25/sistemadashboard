import React from "react";
import { 
  Ticket, 
  Search, 
  Plus, 
  Filter, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  MessageSquare, 
  User, 
  Building,
  MoreVertical,
  ChevronRight,
  Send,
  ShieldCheck,
  History
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
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
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function CentralChamadosPage() {
  const [tickets, setTickets] = React.useState<any[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [searchTerm, setSearchTerm] = React.useState("");
  const [isCreateOpen, setIsCreateOpen] = React.useState(false);
  const [isDetailOpen, setIsDetailOpen] = React.useState(false);
  const [selectedTicket, setSelectedTicket] = React.useState<any>(null);
  const [newTicket, setNewTicket] = React.useState({
    title: "",
    description: "",
    priority: "media",
    category: "software"
  });
  const [comments, setComments] = React.useState<any[]>([]);
  const [newComment, setNewComment] = React.useState("");
  const [isSendingComment, setIsSendingComment] = React.useState(false);

  React.useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('it_tickets')
        .select(`
          *,
          profiles:user_id(full_name, email),
          technician:technician_id(full_name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTickets(data || []);
    } catch (e: any) {
      toast.error("Erro ao carregar chamados: " + e.message);
    } finally {
      setIsLoading(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critica': return 'bg-red-500 text-white';
      case 'alta': return 'bg-orange-500 text-white';
      case 'media': return 'bg-blue-500 text-white';
      default: return 'bg-slate-500 text-white';
    }
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      'aberto': 'Aberto',
      'em_analise': 'Em Análise',
      'aguardando_usuario': 'Aguardando Usuário',
      'em_execucao': 'Em Execução',
      'resolvido': 'Resolvido',
      'cancelado': 'Cancelado'
    };
    return labels[status] || status;
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-4 md:p-8 font-sans text-slate-900">
      {/* Breadcrumb & Header */}
      <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 text-[10px] uppercase font-bold text-slate-400 mb-1 tracking-widest">
            <Building className="w-3 h-3" /> ERP OCS / Módulo TI / Central de Chamados
          </div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-3">
            <Ticket className="w-8 h-8 text-blue-600" /> CENTRAL DE CHAMADOS
          </h1>
        </div>

        <div className="flex gap-3">
          <Button variant="outline" className="font-bold text-xs uppercase tracking-widest gap-2">
            <Filter className="w-3 h-3" /> Filtros
          </Button>
          <Button className="bg-blue-600 hover:bg-blue-700 font-bold text-xs uppercase tracking-widest gap-2 shadow-lg shadow-blue-500/20">
            <Plus className="w-3 h-3" /> Abrir Chamado
          </Button>
        </div>
      </div>

      {/* Stats Quick View */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total Ativos', value: tickets.filter(t => t.status !== 'resolvido').length, icon: Ticket, color: 'text-blue-600' },
          { label: 'Críticos', value: tickets.filter(t => t.priority === 'critica').length, icon: AlertCircle, color: 'text-red-600' },
          { label: 'Aguardando', value: tickets.filter(t => t.status === 'aguardando_usuario').length, icon: Clock, color: 'text-amber-600' },
          { label: 'Resolvidos (Hoje)', value: 0, icon: CheckCircle2, color: 'text-green-600' },
        ].map((stat, i) => (
          <Card key={i} className="border-none shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-6 flex items-center gap-4">
              <div className={`p-3 rounded-xl bg-slate-100 ${stat.color}`}>
                <stat.icon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] uppercase font-black text-slate-400 tracking-wider">{stat.label}</p>
                <p className="text-2xl font-black text-slate-800">{stat.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Search & Actions */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mb-8">
        <div className="p-4 border-b border-slate-100 flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input 
              placeholder="Buscar por número, título ou solicitante..." 
              className="pl-10 border-none bg-slate-50 focus-visible:ring-blue-500 font-medium"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <Table>
          <TableHeader className="bg-slate-50">
            <TableRow className="hover:bg-transparent border-slate-100">
              <TableHead className="text-[10px] uppercase font-black text-slate-400 tracking-widest py-4"># Chamado</TableHead>
              <TableHead className="text-[10px] uppercase font-black text-slate-400 tracking-widest">Assunto</TableHead>
              <TableHead className="text-[10px] uppercase font-black text-slate-400 tracking-widest">Solicitante</TableHead>
              <TableHead className="text-[10px] uppercase font-black text-slate-400 tracking-widest">Prioridade</TableHead>
              <TableHead className="text-[10px] uppercase font-black text-slate-400 tracking-widest">Status</TableHead>
              <TableHead className="text-[10px] uppercase font-black text-slate-400 tracking-widest">SLA Limite</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-20 text-slate-400 font-bold uppercase text-xs tracking-widest">
                  Carregando chamados...
                </TableCell>
              </TableRow>
            ) : tickets.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-20 text-slate-400 font-bold uppercase text-xs tracking-widest">
                  Nenhum chamado encontrado.
                </TableCell>
              </TableRow>
            ) : (
              tickets.map((ticket) => (
                <TableRow key={ticket.id} className="group hover:bg-slate-50 border-slate-100 transition-colors">
                  <TableCell className="font-black text-blue-600 text-xs py-5">
                    #{ticket.ticket_number.toString().padStart(5, '0')}
                  </TableCell>
                  <TableCell>
                    <div className="max-w-[300px]">
                      <p className="font-bold text-slate-800 text-sm mb-1 truncate">{ticket.title}</p>
                      <Badge variant="outline" className="text-[8px] uppercase tracking-widest border-slate-200 text-slate-400">
                        {ticket.category}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center">
                        <User className="w-4 h-4 text-slate-500" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-700">{ticket.profiles?.full_name || 'Usuário Externo'}</p>
                        <p className="text-[10px] text-slate-400 italic">ERP OCS Client</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={`${getPriorityColor(ticket.priority)} text-[9px] uppercase font-black tracking-widest px-2 py-0.5`}>
                      {ticket.priority}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className={`w-1.5 h-1.5 rounded-full ${ticket.status === 'resolvido' ? 'bg-green-500' : 'bg-blue-500 animate-pulse'}`}></div>
                      <span className="text-xs font-bold text-slate-600">{getStatusLabel(ticket.status)}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="text-[10px] font-bold text-slate-500">
                        {ticket.sla_deadline ? format(new Date(ticket.sla_deadline), "dd/MM 'às' HH:mm", { locale: ptBR }) : 'N/A'}
                      </span>
                      {ticket.sla_deadline && new Date(ticket.sla_deadline) < new Date() && ticket.status !== 'resolvido' && (
                        <span className="text-[8px] text-red-500 font-black uppercase tracking-tighter mt-1">SLA VENCIDO</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="text-slate-400 hover:text-blue-600">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="font-bold text-xs">
                        <DropdownMenuItem className="gap-2">
                          <ChevronRight className="w-3 h-3" /> Ver Detalhes
                        </DropdownMenuItem>
                        <DropdownMenuItem className="gap-2">
                          <MessageSquare className="w-3 h-3" /> Adicionar Comentário
                        </DropdownMenuItem>
                        <DropdownMenuItem className="gap-2 text-red-600">
                          <AlertCircle className="w-3 h-3" /> Alterar Prioridade
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Footer Branding */}
      <div className="flex justify-between items-center text-[9px] uppercase font-black text-slate-300 tracking-[0.3em] mt-10">
        <span>ERP OCS // IT MANAGEMENT SUITE</span>
        <span className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
          AI AGENT INTEGRATED: READY
        </span>
      </div>
    </div>
  );
}
