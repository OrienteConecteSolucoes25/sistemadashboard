import React, { useState, useRef } from "react";
import { 
  Camera, 
  Upload, 
  ScanSearch, 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle2, 
  Image as ImageIcon,
  Zap,
  Maximize2,
  RefreshCcw,
  Eye
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

export const JarbasVisionDashboard = () => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [results, setResults] = useState<any | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      simulateAnalysis();
    }
  };

  const simulateAnalysis = () => {
    setIsAnalyzing(true);
    setResults(null);
    
    setTimeout(() => {
      setIsAnalyzing(false);
      setResults({
        compliance: 85,
        detections: [
          { label: "Capacete de Segurança", status: "detected", type: "epi" },
          { label: "Luvas de Proteção", status: "missing", type: "epi" },
          { label: "Profundidade de Fundação", status: "warning", type: "quality", detail: "8% abaixo do padrão NR-18" },
          { label: "Ferragem Exposta", status: "detected", type: "anomaly" }
        ],
        feedback: "Jarbas Vision detectou a ausência de luvas de proteção no colaborador. A profundidade da fundação parece estar marginalmente abaixo do padrão esperado para este solo."
      });
      toast.success("Análise Visual Concluída");
    }, 3000);
  };

  return (
    <div className="min-h-screen bg-[#02020a] text-[#00f2ff] p-6 font-mono relative overflow-hidden">
      <div className="absolute inset-0 bg-[linear-gradient(rgba(0,242,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,242,255,0.03)_1px,transparent_1px)] bg-[size:40px_40px]" />
      
      <div className="relative z-10 max-w-7xl mx-auto space-y-8">
        <header className="flex justify-between items-center border-b border-cyan-500/30 pb-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-cyan-500/10 rounded-lg border border-cyan-500/50 relative">
              <Eye className="w-8 h-8 text-cyan-400" />
              <div className="absolute inset-0 bg-cyan-500/20 blur-xl rounded-full" />
            </div>
            <div>
              <h1 className="text-3xl font-black tracking-tighter uppercase italic">Jarbas Vision AI</h1>
              <p className="text-xs text-cyan-400/60 font-bold uppercase tracking-[0.2em]">Reconhecimento Visual e Validação de Campo</p>
            </div>
          </div>
          
          <div className="flex gap-4">
             <input 
               type="file" 
               accept="image/*" 
               className="hidden" 
               ref={fileInputRef} 
               onChange={handleFileChange}
             />
             <Button 
               onClick={() => fileInputRef.current?.click()}
               className="bg-cyan-500 hover:bg-cyan-400 text-black font-black uppercase tracking-tighter italic"
             >
               <Camera className="w-4 h-4 mr-2" /> Capturar/Upload Foto
             </Button>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Visual Analysis Area */}
          <Card className="bg-cyan-950/10 border-cyan-500/20 overflow-hidden relative min-h-[500px] flex flex-col">
            <div className="absolute top-4 left-4 z-20">
              <Badge className="bg-cyan-500 text-black font-bold border-none">LIVE_SCANNER</Badge>
            </div>
            
            <CardContent className="flex-1 flex items-center justify-center p-0 relative">
              {previewUrl ? (
                <div className="relative w-full h-full flex items-center justify-center bg-black">
                  <img src={previewUrl} alt="Preview" className="max-h-full object-contain" />
                  
                  {isAnalyzing && (
                    <motion.div 
                      initial={{ top: 0 }}
                      animate={{ top: "100%" }}
                      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                      className="absolute left-0 right-0 h-1 bg-cyan-500 shadow-[0_0_15px_rgba(0,242,255,1)] z-10"
                    />
                  )}

                  {/* Simulated Bounding Boxes */}
                  {!isAnalyzing && results && (
                    <div className="absolute inset-0 pointer-events-none">
                      <div className="absolute top-1/4 left-1/3 w-24 h-24 border-2 border-green-500 bg-green-500/10 rounded flex items-start justify-start p-1">
                        <span className="text-[8px] bg-green-500 text-white px-1">CAPACETE</span>
                      </div>
                      <div className="absolute bottom-1/4 right-1/4 w-32 h-16 border-2 border-red-500 bg-red-500/10 rounded flex items-start justify-start p-1">
                        <span className="text-[8px] bg-red-500 text-white px-1">SEM_LUVA</span>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center space-y-4 opacity-40">
                  <ImageIcon className="w-20 h-20 mx-auto" />
                  <p className="text-sm uppercase tracking-widest">Aguardando Mídia de Campo</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Analysis Results Side */}
          <div className="space-y-6">
            <Card className="bg-cyan-950/20 border-cyan-500/30">
              <CardHeader>
                <CardTitle className="text-sm font-bold uppercase tracking-widest flex items-center gap-2">
                  <ScanSearch className="w-4 h-4 text-cyan-400" /> Relatório de Visão Computacional
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {isAnalyzing ? (
                  <div className="py-12 text-center space-y-4">
                    <RefreshCcw className="w-10 h-10 animate-spin mx-auto text-cyan-400" />
                    <p className="text-xs animate-pulse">PROCESSANDO_REDE_NEURAL_VISION...</p>
                  </div>
                ) : results ? (
                  <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                    <div className="space-y-2">
                      <div className="flex justify-between text-[10px] uppercase font-bold">
                        <span>Score de Conformidade</span>
                        <span className="text-cyan-400">{results.compliance}%</span>
                      </div>
                      <Progress value={results.compliance} className="h-1 bg-cyan-950" />
                    </div>

                    <div className="grid grid-cols-1 gap-3">
                      {results.detections.map((d: any, i: number) => (
                        <div key={i} className={`p-3 rounded border flex items-center justify-between ${
                          d.status === 'missing' ? 'bg-red-500/5 border-red-500/20' : 
                          d.status === 'warning' ? 'bg-yellow-500/5 border-yellow-500/20' : 'bg-cyan-500/5 border-cyan-500/20'
                        }`}>
                          <div className="flex items-center gap-3">
                            {d.status === 'detected' ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : 
                             d.status === 'missing' ? <AlertTriangle className="w-4 h-4 text-red-500" /> : <AlertTriangle className="w-4 h-4 text-yellow-500" />}
                            <div>
                              <p className="text-[11px] font-bold uppercase">{d.label}</p>
                              {d.detail && <p className="text-[9px] opacity-60 italic">{d.detail}</p>}
                            </div>
                          </div>
                          <Badge variant="outline" className={`text-[8px] uppercase ${
                            d.type === 'epi' ? 'border-cyan-500/30 text-cyan-400' : 'border-yellow-500/30 text-yellow-400'
                          }`}>
                            {d.type}
                          </Badge>
                        </div>
                      ))}
                    </div>

                    <div className="p-4 rounded-lg bg-cyan-500/10 border border-cyan-500/20">
                      <p className="text-[10px] text-cyan-400 font-bold uppercase mb-2 flex items-center gap-2">
                        <Zap className="w-3 h-3" /> Feedback do Jarbas
                      </p>
                      <p className="text-xs leading-relaxed opacity-80 italic">
                        "{results.feedback}"
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="py-20 text-center opacity-30">
                    <p className="text-xs uppercase italic">Aguardando dados para validação visual</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <section>
              <h2 className="text-sm font-bold flex items-center gap-2 mb-4 uppercase tracking-widest">
                <ShieldCheck className="w-4 h-4 text-green-500" /> Histórico de Validações
              </h2>
              <ScrollArea className="h-[250px] pr-4">
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="p-3 bg-white/5 border border-white/10 rounded flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded bg-slate-800" />
                        <div>
                          <p className="text-[10px] font-bold uppercase">Validação de Fundação - Obra Leste</p>
                          <p className="text-[8px] opacity-40">Ontem às 16:45</p>
                        </div>
                      </div>
                      <Badge className="bg-green-500/20 text-green-500 border-none text-[8px]">APROVADO</Badge>
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
