import { JarbasEvent, JarbasInsight, JarbasAlert, JarbasModule } from "./types";

class JarbasCentralCore {
  private static instance: JarbasCentralCore;
  private events: JarbasEvent[] = [];
  private insights: JarbasInsight[] = [];
  private alerts: JarbasAlert[] = [];

  private constructor() {
    // Initial mock data to simulate real-time monitoring
    this.initializeMockData();
  }

  public static getInstance(): JarbasCentralCore {
    if (!JarbasCentralCore.instance) {
      JarbasCentralCore.instance = new JarbasCentralCore();
    }
    return JarbasCentralCore.instance;
  }

  private initializeMockData() {
    this.events = [
      {
        id: "ev-1",
        module: "engineering",
        type: "delay",
        title: "Atraso na Obra Torre Norte",
        description: "Cronograma atrasado em 4 dias devido a falta de materiais.",
        severity: "high",
        timestamp: new Date().toISOString(),
      },
      {
        id: "ev-2",
        module: "finance",
        type: "budget_overflow",
        title: "Custo Elevado - Projeto Beta",
        description: "Gastos ultrapassaram 15% do orçamento previsto para a fase 2.",
        severity: "critical",
        timestamp: new Date().toISOString(),
      }
    ];

    this.insights = [
      {
        id: "in-1",
        title: "Otimização de Equipe",
        description: "A equipe de TI possui 20% de ociosidade nesta semana.",
        impact: "Redução de produtividade global.",
        recommendation: "Redistribuir tarefas do projeto 'Infra-2026' para adiantar o cronograma.",
        module: "ti",
        confidence: 0.92,
      }
    ];

    this.alerts = [
      {
        id: "al-1",
        module: "legal",
        message: "Contrato com Fornecedor Alpha expira em 5 dias.",
        severity: "medium",
        actionRequired: true,
        status: "pending",
      }
    ];
  }

  // --- Monitoring & Events ---
  public getEvents(module?: JarbasModule): JarbasEvent[] {
    return module ? this.events.filter(e => e.module === module) : this.events;
  }

  public registerEvent(event: Omit<JarbasEvent, "id" | "timestamp">) {
    const newEvent: JarbasEvent = {
      ...event,
      id: `ev-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
    };
    this.events.unshift(newEvent);
    this.processEvent(newEvent);
  }

  private processEvent(event: JarbasEvent) {
    // Trigger cross-module orchestration logic
    console.log(`[JarbasCore] Processing event: ${event.title}`);
    if (event.severity === "critical" || event.severity === "high") {
      this.alerts.unshift({
        id: `al-${Math.random().toString(36).substr(2, 9)}`,
        module: event.module,
        message: `ALERTA: ${event.title}`,
        severity: event.severity,
        actionRequired: true,
        status: "pending",
      });
    }
  }

  // --- Insights & Recommendations ---
  public getInsights(): JarbasInsight[] {
    return this.insights;
  }

  // --- Awareness ---
  public getOperationalStatus() {
    const criticalModules = Array.from(new Set(this.alerts.filter(a => a.severity === "critical").map(a => a.module)));
    return {
      healthScore: 85, // 0-100 scale
      activeAlerts: this.alerts.length,
      criticalModules,
      summary: `Operação estável com atenção em ${criticalModules.join(", ") || "nenhum módulo crítico"}.`
    };
  }

  public getAlerts(): JarbasAlert[] {
    return this.alerts;
  }
}

export const jarbasCore = JarbasCentralCore.getInstance();
