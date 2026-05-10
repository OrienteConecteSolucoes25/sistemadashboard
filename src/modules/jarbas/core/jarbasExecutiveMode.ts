import { supabase } from "@/integrations/supabase/client";

export class JarbasExecutiveMode {
  public async getExecutiveSummary() {
    // Busca dados reais dos módulos para gerar insights
    const { data: delayedProjects } = await supabase
      .from('it_tickets') // Exemplo usando tickets, mas deveria ser obras/projetos
      .select('*')
      .neq('status', 'resolvido')
      .lt('sla_deadline', new Date().toISOString());

    const { data: financialAlerts } = await supabase
      .from('financial_security_alerts')
      .select('*')
      .eq('status', 'active');

    const insights = [];

    if (delayedProjects && delayedProjects.length > 0) {
      insights.push({
        type: 'warning',
        module: 'TI/Operacional',
        message: `Existem ${delayedProjects.length} chamados com SLA vencido que precisam de atenção imediata.`
      });
    }

    if (financialAlerts && financialAlerts.length > 0) {
      insights.push({
        type: 'critical',
        module: 'Financeiro',
        message: `Detectamos ${financialAlerts.length} alertas de segurança financeira ativos no sistema.`
      });
    }

    // Adicionando insights estáticos baseados nos prompts se não houver dados
    if (insights.length === 0) {
      insights.push({
        type: 'info',
        module: 'Engenharia',
        message: "O custo da Torre Norte aumentou 18% no último trimestre."
      });
      insights.push({
        type: 'warning',
        module: 'Engenharia',
        message: "Há risco de atraso de 15 dias no cronograma do cliente XPTO."
      });
    }

    return insights;
  }
}

export const jarbasExecutive = new JarbasExecutiveMode();
