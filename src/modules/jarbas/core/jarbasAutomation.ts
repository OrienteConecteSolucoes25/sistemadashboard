import { jarbasCore } from "./jarbasCore";
import { supabase } from "@/integrations/supabase/client";

export type AutomationAction = 
  | "create_task" 
  | "open_ticket" 
  | "update_os" 
  | "move_workflow" 
  | "generate_report" 
  | "send_notification";

export interface JarbasAutomation {
  id: string;
  type: AutomationAction;
  params: any;
  requiresConfirmation: boolean;
  status: "pending" | "confirmed" | "executing" | "completed" | "failed";
}

class JarbasAutomationEngine {
  private static instance: JarbasAutomationEngine;
  private pendingAutomations: Map<string, JarbasAutomation> = new Map();

  private constructor() {}

  public static getInstance(): JarbasAutomationEngine {
    if (!JarbasAutomationEngine.instance) {
      JarbasAutomationEngine.instance = new JarbasAutomationEngine();
    }
    return JarbasAutomationEngine.instance;
  }

  public async planAutomation(type: AutomationAction, params: any, requiresConfirmation: boolean = true): Promise<JarbasAutomation> {
    const id = `auto-${Math.random().toString(36).substr(2, 9)}`;
    const automation: JarbasAutomation = {
      id,
      type,
      params,
      requiresConfirmation,
      status: "pending"
    };
    
    if (requiresConfirmation) {
      this.pendingAutomations.set(id, automation);
    } else {
      await this.executeAutomation(automation);
    }
    
    return automation;
  }

  public async confirmAutomation(id: string): Promise<boolean> {
    const automation = this.pendingAutomations.get(id);
    if (!automation) return false;

    automation.status = "confirmed";
    const success = await this.executeAutomation(automation);
    this.pendingAutomations.delete(id);
    return success;
  }

  private async executeAutomation(automation: JarbasAutomation): Promise<boolean> {
    automation.status = "executing";
    console.log(`[JarbasAutomation] Executing ${automation.type}`, automation.params);

    try {
      switch (automation.type) {
        case "create_task":
          await this.executeTaskCreation(automation.params);
          break;
        case "open_ticket":
          await this.executeTicketOpening(automation.params);
          break;
        case "send_notification":
          await this.executeNotification(automation.params);
          break;
        // Adicionar outros cases conforme necessidade
      }
      automation.status = "completed";
      
      // Registrar evento no core
      jarbasCore.registerEvent({
        module: automation.params.module || "communication",
        type: "automation_completed",
        title: `Automação Concluída: ${automation.type}`,
        description: `O Jarbas executou com sucesso a ação de ${automation.type}.`,
        severity: "low"
      });

      return true;
    } catch (error) {
      console.error(`[JarbasAutomation] Error executing ${automation.type}`, error);
      automation.status = "failed";
      return false;
    }
  }

  private async executeTaskCreation(params: any) {
    // Corrigindo para os campos reais da tabela pixel_messages
    return await supabase.from('pixel_messages').insert({
      message: `[JARBAS_AUTO_TASK] ${params.title}: ${params.description}`,
      workspace_id: params.workspaceId,
      sender_user_id: params.senderId,
      message_type: 'system'
    });
  }

  private async executeTicketOpening(params: any) {
    // Simulação de abertura de chamado no módulo de TI
    console.log("Abrindo chamado de TI via Jarbas...", params);
  }

  private async executeNotification(params: any) {
    // Notificação real via Supabase/Realtime ou Push futuramente
    console.log("Enviando notificação global...", params);
  }
}

export const jarbasAutomation = JarbasAutomationEngine.getInstance();
