import { jarbasCore } from "./jarbasCore";
import { supabase } from "@/integrations/supabase/client";

export interface KnowledgeEntry {
  id: string;
  category: "procedure" | "norm" | "training" | "technical" | "history";
  title: string;
  content: string;
  tags: string[];
  lastUpdated: string;
}

class JarbasKnowledgeBase {
  private static instance: JarbasKnowledgeBase;
  private memory: KnowledgeEntry[] = [];

  private constructor() {
    this.initializeBaseKnowledge();
  }

  public static getInstance(): JarbasKnowledgeBase {
    if (!JarbasKnowledgeBase.instance) {
      JarbasKnowledgeBase.instance = new JarbasKnowledgeBase();
    }
    return JarbasKnowledgeBase.instance;
  }

  private initializeBaseKnowledge() {
    this.memory = [
      {
        id: "kb-1",
        category: "procedure",
        title: "Abertura de Ordem de Serviço (OS)",
        content: "Para abrir uma OS, acesse o módulo de Engenharia, selecione 'Nova OS', anexe o RFI e defina a prioridade conforme a matriz de risco.",
        tags: ["OS", "Engenharia", "Procedimento"],
        lastUpdated: new Date().toISOString()
      },
      {
        id: "kb-2",
        category: "norm",
        title: "Segurança em Altura (NR-35)",
        content: "Todos os técnicos em campo devem utilizar cinto de segurança tipo paraquedista e trava-quedas para atividades acima de 2 metros.",
        tags: ["Segurança", "NR-35", "Campo"],
        lastUpdated: new Date().toISOString()
      },
      {
        id: "kb-3",
        category: "technical",
        title: "Especificação Fibra Óptica G.652.D",
        content: "O padrão utilizado no ERP OCS para projetos de backbone é o G.652.D com baixa perda de curvatura.",
        tags: ["Fibra", "Engenharia", "Especificação"],
        lastUpdated: new Date().toISOString()
      }
    ];
  }

  public query(searchTerm: string): KnowledgeEntry[] {
    const term = searchTerm.toLowerCase();
    return this.memory.filter(entry => 
      entry.title.toLowerCase().includes(term) || 
      entry.content.toLowerCase().includes(term) ||
      entry.tags.some(tag => tag.toLowerCase().includes(term))
    );
  }

  public async learnDocument(title: string, content: string, category: KnowledgeEntry["category"]) {
    const newEntry: KnowledgeEntry = {
      id: `kb-${Math.random().toString(36).substr(2, 9)}`,
      category,
      title,
      content,
      tags: this.extractTags(content),
      lastUpdated: new Date().toISOString()
    };
    
    this.memory.push(newEntry);
    
    // Registrar evento de aprendizado no core
    jarbasCore.registerEvent({
      module: "communication",
      type: "knowledge_learned",
      title: "Novo Conhecimento Adquirido",
      description: `O Jarbas aprendeu o documento: ${title}`,
      severity: "low"
    });

    return newEntry;
  }

  private extractTags(content: string): string[] {
    // Lógica simples de extração de palavras-chave baseada em termos corporativos
    const commonKeywords = ["fibra", "os", "segurança", "projeto", "financeiro", "obra", "contrato"];
    return commonKeywords.filter(k => content.toLowerCase().includes(k));
  }

  public getFullKnowledge() {
    return this.memory;
  }
}

export const jarbasKnowledge = JarbasKnowledgeBase.getInstance();
