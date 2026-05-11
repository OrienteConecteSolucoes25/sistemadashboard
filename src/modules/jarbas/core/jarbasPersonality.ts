import { jarbasKnowledge } from "./jarbasKnowledge";

export type JarbasTone = 'professional' | 'technical' | 'urgent' | 'cautionary' | 'calm' | 'instructional';

export interface JarbasPersonalityResponse {
  content: string;
  tone: JarbasTone;
  suggestedAction?: string;
  action?: any;
}

class JarbasPersonalityEngine {
  private static instance: JarbasPersonalityEngine;
  
  private constructor() {}

  public static getInstance(): JarbasPersonalityEngine {
    if (!JarbasPersonalityEngine.instance) {
      JarbasPersonalityEngine.instance = new JarbasPersonalityEngine();
    }
    return JarbasPersonalityEngine.instance;
  }

  /**
   * Processa uma entrada e retorna uma resposta com a personalidade do Jarbas OCS.
   * Foca em objetividade, clareza e autoridade técnica.
   */
  public generateResponse(input: string, context: any = {}): JarbasPersonalityResponse {
    const lowerInput = input.toLowerCase();
    
    // Identificação de Urgência
    if (this.containsUrgency(lowerInput)) {
      return {
        content: this.formatProfessionalResponse("Detectei uma anomalia que requer atenção imediata. Recomendo revisar os logs de execução e os indicadores de segurança no site correspondente."),
        tone: 'urgent',
        suggestedAction: 'Abrir Command Center'
      };
    }

    // Identificação de Consultas Técnicas
    if (this.isTechnicalQuery(lowerInput)) {
      return {
        content: this.formatProfessionalResponse("De acordo com os padrões técnicos vigentes, o procedimento solicitado deve seguir as normas de segurança NR-18 e os parâmetros de qualidade definidos no projeto estrutural."),
        tone: 'technical'
      };
    }

    // Identificação de Status Operacional
    if (lowerInput.includes('status') || lowerInput.includes('como está') || lowerInput.includes('está tudo bem')) {
      return {
        content: this.formatProfessionalResponse("Todos os sistemas operacionais estão estáveis. O monitoramento vision não detectou inconformidades nos últimos ciclos de análise."),
        tone: 'calm'
      };
    }

    // Office Navigation Commands
    if (lowerInput.includes('vá para') || lowerInput.includes('mova') || lowerInput.includes('navegar') || lowerInput.includes('ir para')) {
      if (lowerInput.includes('mesa')) {
        return {
          content: this.formatProfessionalResponse("Iniciando deslocamento até a estação de trabalho solicitada."),
          tone: 'instructional',
          action: { type: 'pixel_office_move', target: 'desk' }
        };
      }
      if (lowerInput.includes('sala') || lowerInput.includes('reunião')) {
        return {
          content: this.formatProfessionalResponse("Deslocando sua representação para a sala de reuniões."),
          tone: 'instructional',
          action: { type: 'pixel_office_move', target: 'room' }
        };
      }
    }

    // Resposta Padrão Professional
    return {
      content: this.formatProfessionalResponse("Entendido. Estou processando sua solicitação com base nos dados operacionais integrados. Em que mais posso auxiliar na supervisão técnica agora?"),
      tone: 'professional'
    };
  }

  private formatProfessionalResponse(text: string): string {
    // Garante que o Jarbas nunca use linguagem infantil ou excessiva
    return text.trim();
  }

  private containsUrgency(text: string): boolean {
    const urgentTerms = ['erro', 'atraso', 'urgente', 'perigo', 'risco', 'falha', 'parou', 'crítico'];
    return urgentTerms.some(term => text.includes(term));
  }

  private isTechnicalQuery(text: string): boolean {
    const technicalTerms = ['norma', 'padrão', 'fundação', 'epi', 'técnico', 'procedimento', 'execução', 'obra'];
    return technicalTerms.some(term => text.includes(term));
  }

  /**
   * Adapta a linguagem baseado no módulo atual (Context Adaptation)
   */
  public adaptToContext(module: string): string {
    const contextMap: Record<string, string> = {
      'engenharia': "Jarbas OCS: Supervisor de Engenharia Ativo.",
      'financeiro': "Jarbas OCS: Auditor Financeiro em Execução.",
      'juridico': "Jarbas OCS: Compliance Jurídico Sincronizado.",
      'marketplace': "Jarbas OCS: Monitor de Comércio Eletrônico Online."
    };
    return contextMap[module] || "Jarbas OCS: Consciência Operacional Ativa.";
  }
}

export const jarbasPersonality = JarbasPersonalityEngine.getInstance();
