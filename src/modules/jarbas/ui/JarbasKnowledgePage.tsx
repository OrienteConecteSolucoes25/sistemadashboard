import React, { useState } from "react";
import { 
  BookOpen, 
  Search, 
  FileText, 
  GraduationCap, 
  History, 
  Bookmark,
  ChevronRight,
  Database,
  ArrowRight
} from "lucide-react";
import { jarbasKnowledge, KnowledgeEntry } from "../core/jarbasKnowledge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion, AnimatePresence } from "framer-motion";

export const JarbasKnowledgePage = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const results = searchTerm ? jarbasKnowledge.query(searchTerm) : jarbasKnowledge.getFullKnowledge();

  const categories = [
    { id: "all", label: "Todos", icon: Database },
    { id: "procedure", label: "Procedimentos", icon: FileText },
    { id: "norm", label: "Normas", icon: Bookmark },
    { id: "training", label: "Treinamentos", icon: GraduationCap },
    { id: "history", label: "Histórico", icon: History },
  ];

  return (
    <div className="min-h-screen bg-[#050510] text-[#00f2ff] p-6 font-mono selection:bg-cyan-500/30">
      {/* Header Estilo Biblioteca Futurista */}
      <div className="flex justify-between items-center mb-8 border-b border-cyan-500/30 pb-4">
        <div className="flex items-center gap-3">
          <BookOpen className="w-8 h-8 text-cyan-400" />
          <div>
            <h1 className="text-xl font-bold uppercase tracking-widest">Base de Conhecimento Jarbas</h1>
            <p className="text-[10px] text-cyan-400/60 uppercase">Memória Corporativa & Inteligência Técnica OCS</p>
          </div>
        </div>
        <div className="relative w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-cyan-500/50" />
          <Input 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="CONSULTAR MEMÓRIA..." 
            className="pl-10 bg-cyan-950/20 border-cyan-500/30 text-cyan-400 placeholder:text-cyan-800 focus-visible:ring-cyan-500"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Navegação de Categorias */}
        <div className="md:col-span-3 space-y-2">
          {categories.map((cat) => (
            <button
              key={cat.id}
              className="w-full flex items-center gap-3 px-4 py-3 rounded border border-transparent hover:border-cyan-500/30 hover:bg-cyan-500/5 transition-all text-left group"
            >
              <cat.icon className="w-4 h-4 text-cyan-500/70 group-hover:text-cyan-400" />
              <span className="text-xs uppercase font-bold tracking-wider">{cat.label}</span>
              <ChevronRight className="w-4 h-4 ml-auto opacity-0 group-hover:opacity-100" />
            </button>
          ))}

          <div className="mt-8 p-4 rounded border border-cyan-500/20 bg-cyan-950/10">
            <h3 className="text-[10px] uppercase font-bold text-cyan-500 mb-2">Estado da Memória</h3>
            <div className="space-y-2 text-[9px] opacity-60">
              <div className="flex justify-between">
                <span>Entradas Totais:</span>
                <span>{jarbasKnowledge.getFullKnowledge().length}</span>
              </div>
              <div className="flex justify-between">
                <span>Integridade:</span>
                <span className="text-green-500 font-bold text-[8px]">OPTIMAL</span>
              </div>
              <div className="flex justify-between">
                <span>Último Aprendizado:</span>
                <span>HOJE</span>
              </div>
            </div>
          </div>
        </div>

        {/* Lista de Conhecimento */}
        <div className="md:col-span-9">
          <ScrollArea className="h-[calc(100vh-200px)]">
            <div className="grid grid-cols-1 gap-4 pr-4">
              <AnimatePresence mode="popLayout">
                {results.map((entry) => (
                  <motion.div
                    key={entry.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="p-5 rounded border border-cyan-500/20 bg-cyan-950/10 hover:border-cyan-500/50 transition-colors group"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-[8px] border-cyan-500/50 text-cyan-400 uppercase">
                          {entry.category}
                        </Badge>
                        <h2 className="text-sm font-bold uppercase tracking-tight group-hover:text-cyan-300 transition-colors">
                          {entry.title}
                        </h2>
                      </div>
                      <span className="text-[8px] opacity-40 uppercase">UID: {entry.id}</span>
                    </div>
                    
                    <p className="text-xs leading-relaxed opacity-80 mb-4 border-l-2 border-cyan-500/30 pl-4">
                      {entry.content}
                    </p>

                    <div className="flex items-center gap-2">
                      {entry.tags.map(tag => (
                        <span key={tag} className="text-[8px] bg-cyan-500/10 px-2 py-0.5 rounded text-cyan-500/70 border border-cyan-500/20">
                          #{tag}
                        </span>
                      ))}
                      <button className="ml-auto text-[9px] font-bold text-cyan-400 flex items-center gap-1 hover:gap-2 transition-all">
                        ACESSAR DOCUMENTAÇÃO COMPLETA <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
              
              {results.length === 0 && (
                <div className="text-center py-20 opacity-30 italic text-sm">
                  Nenhum registro encontrado na memória central.
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
      </div>

      {/* Footer SO */}
      <div className="fixed bottom-0 left-0 right-0 p-2 px-6 flex justify-between items-center text-[8px] uppercase tracking-widest opacity-40 bg-black/40 backdrop-blur-md">
        <span>OCS-KNOWLEDGE-BASE // MEM_SYNC_ACTIVE</span>
        <span>INDEXING: 100% SUCCESS</span>
      </div>
    </div>
  );
};
