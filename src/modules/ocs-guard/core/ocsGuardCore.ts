import { supabase } from "@/integrations/supabase/client";

export type OcsRole = 
  | 'cliente' 
  | 'funcionario_cliente' 
  | 'gestor_cliente' 
  | 'supervisor_interno' 
  | 'admin_ocs' 
  | 'root_ocs';

export interface SecurityStatus {
  isEmergencyMode: boolean;
  overallScore: number;
  activeVulnerabilities: number;
  pendingApprovals: number;
}

class OcsGuardCore {
  private static instance: OcsGuardCore;

  private constructor() {}

  public static getInstance(): OcsGuardCore {
    if (!OcsGuardCore.instance) {
      OcsGuardCore.instance = new OcsGuardCore();
    }
    return OcsGuardCore.instance;
  }

  public async logAction(params: {
    action: string;
    module: string;
    description: string;
    payload?: any;
    severity?: 'info' | 'warn' | 'critical';
  }) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Obter company_id do perfil
    const { data: profile } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', user.id)
      .single();

    return await supabase.from('security_audit_logs').insert({
      user_id: user.id,
      company_id: profile?.company_id,
      action_type: params.action,
      module: params.module,
      description: params.description,
      payload: params.payload,
      severity: params.severity || 'info'
    });
  }

  public async activateEmergencyMode(reason: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: profile } = await supabase
      .from('profiles')
      .select('company_id, role')
      .eq('id', user.id)
      .single();

    if (!['admin_ocs', 'root_ocs', 'gestor_cliente'].includes(profile?.role || '')) {
      throw new Error("Permissão insuficiente para ativar Modo de Emergência.");
    }

    await supabase.from('security_emergency_mode').insert({
      company_id: profile?.company_id,
      activated_by: user.id,
      status: true,
      reason,
      activated_at: new Date().toISOString()
    });

    await this.logAction({
      action: 'EMERGENCY_MODE_ACTIVATED',
      module: 'GUARD',
      description: `Modo de emergência ativado por ${profile?.role}. Motivo: ${reason}`,
      severity: 'critical'
    });

    return true;
  }

  public async getSecurityScore(companyId: string) {
    const { data } = await supabase
      .from('security_scores')
      .select('*')
      .eq('company_id', companyId)
      .single();
    return data;
  }
}

export const ocsGuard = OcsGuardCore.getInstance();
