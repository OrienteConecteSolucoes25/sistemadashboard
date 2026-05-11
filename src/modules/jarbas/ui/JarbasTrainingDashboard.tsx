import React, { useState, useEffect } from "react";
import { 
  GraduationCap, 
  BookOpen, 
  Award, 
  Play, 
  CheckCircle2, 
  ChevronRight, 
  Brain, 
  Mic, 
  Trophy,
  History,
  Timer
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const JarbasTrainingDashboard = () => {
  const [paths, setPaths] = useState<any[]>([]);
  const [certs, setCerts] = useState<any[]>([]);
  const [activity, setActivity] = useState<any[]>([]);
  const [globalLevel, setGlobalLevel] = useState<string>("—");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void load();
  }, []);

  const load = async () => {
    try {
      const { data: u } = await supabase.auth.getUser();
      const uid = u.user?.id;

      const [pathsRes, certsRes, sessionsRes] = await Promise.all([
        supabase.from("training_paths").select("*, training_modules(*)"),
        uid ? supabase.from("operational_certifications").select("*, training_paths(title, category)").eq("user_id", uid).eq("status", "active") : Promise.resolve({ data: [] as any[] }),
        uid ? supabase.from("training_sessions").select("id, status, score, started_at, completed_at, training_modules(title, path_id)").eq("user_id", uid).order("started_at", { ascending: false }).limit(10) : Promise.resolve({ data: [] as any[] }),
      ]);

      setPaths(pathsRes.data ?? []);
      setCerts((certsRes as any).data ?? []);
      setActivity((sessionsRes as any).data ?? []);

      const cnt = ((certsRes as any).data ?? []).length;
      setGlobalLevel(cnt >= 10 ? "Master" : cnt >= 5 ? "Senior" : cnt >= 1 ? "Pleno" : "Iniciante");
    } catch (error) {
      console.error("Error fetching training data:", error);
      toast.error("Erro ao carregar trilhas de treinamento");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#02020a] text-[#00f2ff] p-6 font-mono relative overflow-hidden">
      <div className="absolute inset-0 bg-[linear-gradient(rgba(0,242,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,242,255,0.03)_1px,transparent_1px)] bg-[size:40px_40px]" />
      
      <div className="relative z-10 max-w-7xl mx-auto">
        <header className="flex justify-between items-center mb-10 border-b border-cyan-500/30 pb-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-cyan-500/10 rounded-lg border border-cyan-500/50 relative">
              <GraduationCap className="w-8 h-8 text-cyan-400" />
              <div className="absolute inset-0 bg-cyan-500/20 blur-xl rounded-full" />
            </div>
            <div>
              <h1 className="text-3xl font-black tracking-tighter uppercase italic">Jarbas Training AI</h1>
              <p className="text-xs text-cyan-400/60 font-bold uppercase tracking-[0.2em]">Centro de Excelência e Onboarding Inteligente</p>
            </div>
          </div>
          
          <div className="flex gap-4">
            <div className="text-right px-4 border-r border-cyan-500/20">
              <p className="text-[10px] opacity-50 uppercase">Certificações</p>
              <p className="text-2xl font-bold">12</p>
            </div>
            <div className="text-right px-4">
              <p className="text-[10px] opacity-50 uppercase">Nível Global</p>
              <p className="text-2xl font-bold text-yellow-500">Master</p>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content - Learning Paths */}
          <div className="lg:col-span-2 space-y-8">
            <section>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold flex items-center gap-2 uppercase tracking-widest">
                  <BookOpen className="w-5 h-5 text-cyan-400" /> Trilhas de Aprendizado
                </h2>
                <Badge variant="outline" className="border-cyan-500/30 text-cyan-400">
                  {paths.length} Disponíveis
                </Badge>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {paths.map((path) => (
                  <motion.div
                    key={path.id}
                    whileHover={{ scale: 1.02 }}
                    className="group"
                  >
                    <Card className="bg-cyan-950/20 border-cyan-500/20 hover:border-cyan-400/50 transition-all cursor-pointer overflow-hidden relative">
                      <div className="absolute top-0 right-0 p-2">
                        <Badge className="bg-cyan-500 text-black text-[10px] uppercase font-bold">
                          {path.category || 'Geral'}
                        </Badge>
                      </div>
                      <CardHeader>
                        <CardTitle className="text-cyan-400 text-sm uppercase group-hover:text-cyan-300">
                          {path.title}
                        </CardTitle>
                        <CardDescription className="text-cyan-400/60 text-[10px] line-clamp-2">
                          {path.description || 'Inicie sua jornada operacional com o Jarbas.'}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div className="flex justify-between text-[10px] font-bold uppercase">
                            <span>Progresso</span>
                            <span>35%</span>
                          </div>
                          <Progress value={35} className="h-1 bg-cyan-950" />
                          <div className="flex items-center justify-between pt-2">
                            <span className="text-[10px] opacity-60 flex items-center gap-1">
                              <Timer className="w-3 h-3" /> 2h 30min
                            </span>
                            <Button size="sm" variant="outline" className="h-7 text-[10px] border-cyan-500/50 hover:bg-cyan-500/10 text-cyan-400 uppercase font-bold">
                              Continuar <ChevronRight className="ml-1 w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </section>

            <section className="bg-cyan-500/5 border border-cyan-500/20 rounded-xl p-6 relative overflow-hidden">
              <div className="absolute -right-10 -bottom-10 opacity-10">
                <Brain className="w-64 h-64 text-cyan-400" />
              </div>
              <div className="relative z-10">
                <h2 className="text-lg font-bold mb-4 uppercase tracking-widest flex items-center gap-2">
                  <Mic className="w-5 h-5 text-red-500 animate-pulse" /> Treinamento por Voz Ativo
                </h2>
                <p className="text-sm opacity-80 mb-6 max-w-xl">
                  Jarbas está pronto para simular um cenário operacional real com você. Pratique sua comunicação e tomada de decisão.
                </p>
                <div className="flex gap-4">
                  <Button className="bg-cyan-500 hover:bg-cyan-400 text-black font-black uppercase tracking-tighter italic">
                    Iniciar Simulação de Voz
                  </Button>
                  <Button variant="outline" className="border-cyan-500/30 text-cyan-400 font-bold uppercase">
                    Configurar Áudio
                  </Button>
                </div>
              </div>
            </section>
          </div>

          {/* Sidebar - Certifications & History */}
          <div className="space-y-8">
            <section>
              <h2 className="text-sm font-bold flex items-center gap-2 mb-6 uppercase tracking-widest">
                <Award className="w-4 h-4 text-yellow-500" /> Certificações Ativas
              </h2>
              <div className="space-y-3">
                {[1, 2].map((i) => (
                  <div key={i} className="p-3 bg-yellow-500/5 border border-yellow-500/20 rounded flex items-center gap-3">
                    <Trophy className="w-8 h-8 text-yellow-500 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] font-bold text-yellow-500 uppercase truncate">Eletricista de Redes Nível 1</p>
                      <p className="text-[9px] opacity-50 uppercase">Validade: Mai 2027</p>
                    </div>
                    <Badge variant="outline" className="text-[8px] border-yellow-500/30 text-yellow-500">VER</Badge>
                  </div>
                ))}
              </div>
            </section>

            <section>
              <h2 className="text-sm font-bold flex items-center gap-2 mb-6 uppercase tracking-widest">
                <History className="w-4 h-4 text-cyan-400" /> Atividade Recente
              </h2>
              <ScrollArea className="h-[400px] pr-4">
                <div className="space-y-4">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="relative pl-6 pb-4 border-l border-cyan-500/20">
                      <div className="absolute left-[-5px] top-0 w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(0,242,255,0.8)]" />
                      <div className="text-[10px] opacity-40 uppercase mb-1">Hoje às 14:30</div>
                      <p className="text-[11px] font-bold uppercase mb-1">Concluiu Módulo: Segurança em Altura</p>
                      <p className="text-[10px] text-cyan-400/60">Pontuação Final: 9.5/10</p>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};
