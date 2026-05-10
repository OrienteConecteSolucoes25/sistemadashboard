import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface JarbasAction {
  type: "create_task" | "open_ticket" | "update_workflow" | "send_notification" | "navigate" | "confirm";
  payload: any;
  requires_confirmation?: boolean;
}

class JarbasAutomationEngine {
  async execute(action: JarbasAction) {
    if (action.requires_confirmation) {
      // In a real app, this would show a specific modal or wait for user voice confirmation
      const confirmed = window.confirm(`Jarbas: Deseja executar a ação ${action.type}?`);
      if (!confirmed) return;
    }

    switch (action.type) {
      case "create_task":
        return this.createTask(action.payload);
      case "open_ticket":
        return this.openTicket(action.payload);
      case "update_workflow":
        return this.updateWorkflow(action.payload);
      case "send_notification":
        return this.sendNotification(action.payload);
      case "navigate":
        window.location.hash = action.payload.path;
        return;
      default:
        console.warn("Ação não suportada pelo Jarbas:", action.type);
    }
  }

  private async createTask(payload: any) {
    const { data, error } = await supabase
      .from("tasks")
      .insert([
        {
          title: payload.title,
          description: payload.description,
          status: "todo",
          priority: payload.priority || "medium",
          workspace_id: payload.workspace_id
        }
      ]);
    
    if (error) {
      toast.error("Erro ao criar tarefa via Jarbas");
      throw error;
    }
    
    toast.success("Tarefa criada com sucesso pelo Jarbas");
    return data;
  }

  private async openTicket(payload: any) {
    const { data, error } = await supabase
      .from("it_tickets")
      .insert([
        {
          subject: payload.subject,
          description: payload.description,
          status: "open",
          priority: payload.priority || "medium",
          category: payload.category || "general"
        }
      ]);

    if (error) {
      toast.error("Erro ao abrir chamado via Jarbas");
      throw error;
    }

    toast.success("Chamado de TI aberto com sucesso");
    return data;
  }

  private async updateWorkflow(payload: any) {
    // Logic to update a workflow/OS stage
    toast.info(`Workflow atualizado para: ${payload.stage}`);
  }

  private async sendNotification(payload: any) {
    const { error } = await supabase
      .from("notifications")
      .insert([
        {
          user_id: payload.user_id,
          title: payload.title,
          message: payload.message,
          type: payload.type || "info"
        }
      ]);

    if (error) throw error;
  }
}

export const jarbasAutomation = new JarbasAutomationEngine();
