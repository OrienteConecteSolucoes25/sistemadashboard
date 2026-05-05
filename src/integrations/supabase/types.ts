export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      eng_art: {
        Row: {
          created_at: string
          data: Json | null
          data_emissao: string | null
          id: string
          numero: string | null
          responsavel_tecnico: string | null
          site_id: string | null
          status: string | null
          updated_at: string
          valor: number | null
        }
        Insert: {
          created_at?: string
          data?: Json | null
          data_emissao?: string | null
          id?: string
          numero?: string | null
          responsavel_tecnico?: string | null
          site_id?: string | null
          status?: string | null
          updated_at?: string
          valor?: number | null
        }
        Update: {
          created_at?: string
          data?: Json | null
          data_emissao?: string | null
          id?: string
          numero?: string | null
          responsavel_tecnico?: string | null
          site_id?: string | null
          status?: string | null
          updated_at?: string
          valor?: number | null
        }
        Relationships: []
      }
      eng_atividades: {
        Row: {
          created_at: string
          data: Json | null
          descricao: string | null
          id: string
          prazo: string | null
          projeto_id: string | null
          responsavel: string | null
          site_id: string | null
          status: string | null
          titulo: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          data?: Json | null
          descricao?: string | null
          id?: string
          prazo?: string | null
          projeto_id?: string | null
          responsavel?: string | null
          site_id?: string | null
          status?: string | null
          titulo: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          data?: Json | null
          descricao?: string | null
          id?: string
          prazo?: string | null
          projeto_id?: string | null
          responsavel?: string | null
          site_id?: string | null
          status?: string | null
          titulo?: string
          updated_at?: string
        }
        Relationships: []
      }
      eng_auditoria: {
        Row: {
          acao: string
          created_at: string
          id: string
          modulo: string | null
          observacoes: string | null
          payload: Json | null
          user_id: string | null
        }
        Insert: {
          acao: string
          created_at?: string
          id?: string
          modulo?: string | null
          observacoes?: string | null
          payload?: Json | null
          user_id?: string | null
        }
        Update: {
          acao?: string
          created_at?: string
          id?: string
          modulo?: string | null
          observacoes?: string | null
          payload?: Json | null
          user_id?: string | null
        }
        Relationships: []
      }
      eng_demandas: {
        Row: {
          created_at: string
          data: Json | null
          descricao: string | null
          id: string
          prazo: string | null
          prioridade: string | null
          responsavel: string | null
          site_id: string | null
          status: string | null
          titulo: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          data?: Json | null
          descricao?: string | null
          id?: string
          prazo?: string | null
          prioridade?: string | null
          responsavel?: string | null
          site_id?: string | null
          status?: string | null
          titulo: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          data?: Json | null
          descricao?: string | null
          id?: string
          prazo?: string | null
          prioridade?: string | null
          responsavel?: string | null
          site_id?: string | null
          status?: string | null
          titulo?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "eng_demandas_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "eng_sites"
            referencedColumns: ["id"]
          },
        ]
      }
      eng_emails_log: {
        Row: {
          assunto: string | null
          created_at: string
          destinatario: string | null
          id: string
          payload: Json | null
          status: string | null
        }
        Insert: {
          assunto?: string | null
          created_at?: string
          destinatario?: string | null
          id?: string
          payload?: Json | null
          status?: string | null
        }
        Update: {
          assunto?: string | null
          created_at?: string
          destinatario?: string | null
          id?: string
          payload?: Json | null
          status?: string | null
        }
        Relationships: []
      }
      eng_equipes: {
        Row: {
          created_at: string
          data: Json | null
          id: string
          lider: string | null
          membros: Json | null
          nome: string
          site_id: string | null
          status: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          data?: Json | null
          id?: string
          lider?: string | null
          membros?: Json | null
          nome: string
          site_id?: string | null
          status?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          data?: Json | null
          id?: string
          lider?: string | null
          membros?: Json | null
          nome?: string
          site_id?: string | null
          status?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      eng_fibra_checklist_items: {
        Row: {
          checklist_id: string
          created_at: string
          data_final: string | null
          data_inicio: string | null
          entrega_final: string | null
          id: string
          observacao: string | null
          ordem: number
          padrao: string
          processo: string
          responsavel: string | null
          updated_at: string
        }
        Insert: {
          checklist_id: string
          created_at?: string
          data_final?: string | null
          data_inicio?: string | null
          entrega_final?: string | null
          id?: string
          observacao?: string | null
          ordem?: number
          padrao: string
          processo: string
          responsavel?: string | null
          updated_at?: string
        }
        Update: {
          checklist_id?: string
          created_at?: string
          data_final?: string | null
          data_inicio?: string | null
          entrega_final?: string | null
          id?: string
          observacao?: string | null
          ordem?: number
          padrao?: string
          processo?: string
          responsavel?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      eng_fibra_checklists: {
        Row: {
          cidade: string | null
          cliente: string | null
          created_at: string
          created_by: string | null
          id: string
          itens: Json | null
          km: string | null
          obra_id: string | null
          observacoes: string | null
          responsavel_geral: string | null
          status_geral: string | null
          uf: string | null
          updated_at: string
        }
        Insert: {
          cidade?: string | null
          cliente?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          itens?: Json | null
          km?: string | null
          obra_id?: string | null
          observacoes?: string | null
          responsavel_geral?: string | null
          status_geral?: string | null
          uf?: string | null
          updated_at?: string
        }
        Update: {
          cidade?: string | null
          cliente?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          itens?: Json | null
          km?: string | null
          obra_id?: string | null
          observacoes?: string | null
          responsavel_geral?: string | null
          status_geral?: string | null
          uf?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "eng_fibra_checklists_obra_id_fkey"
            columns: ["obra_id"]
            isOneToOne: false
            referencedRelation: "eng_fibra_obras"
            referencedColumns: ["id"]
          },
        ]
      }
      eng_fibra_obras: {
        Row: {
          created_at: string
          data: Json | null
          id: string
          nome: string
          site_id: string | null
          status: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          data?: Json | null
          id?: string
          nome: string
          site_id?: string | null
          status?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          data?: Json | null
          id?: string
          nome?: string
          site_id?: string | null
          status?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      eng_field_options: {
        Row: {
          ativo: boolean | null
          field_key: string
          id: string
          label: string | null
          ordem: number | null
          value: string
        }
        Insert: {
          ativo?: boolean | null
          field_key: string
          id?: string
          label?: string | null
          ordem?: number | null
          value: string
        }
        Update: {
          ativo?: boolean | null
          field_key?: string
          id?: string
          label?: string | null
          ordem?: number | null
          value?: string
        }
        Relationships: []
      }
      eng_gov_action_plan: {
        Row: {
          acao: string
          ano: number | null
          area: string | null
          causa_raiz: string | null
          cliente: string | null
          created_at: string
          evidencia: string | null
          id: string
          mes: number | null
          observacoes: string | null
          ofensor: string | null
          prazo: string | null
          prioridade: string | null
          responsavel: string | null
          resultado_esperado: string | null
          semana: string | null
          status: string | null
          updated_at: string
        }
        Insert: {
          acao: string
          ano?: number | null
          area?: string | null
          causa_raiz?: string | null
          cliente?: string | null
          created_at?: string
          evidencia?: string | null
          id?: string
          mes?: number | null
          observacoes?: string | null
          ofensor?: string | null
          prazo?: string | null
          prioridade?: string | null
          responsavel?: string | null
          resultado_esperado?: string | null
          semana?: string | null
          status?: string | null
          updated_at?: string
        }
        Update: {
          acao?: string
          ano?: number | null
          area?: string | null
          causa_raiz?: string | null
          cliente?: string | null
          created_at?: string
          evidencia?: string | null
          id?: string
          mes?: number | null
          observacoes?: string | null
          ofensor?: string | null
          prazo?: string | null
          prioridade?: string | null
          responsavel?: string | null
          resultado_esperado?: string | null
          semana?: string | null
          status?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      eng_gov_atividades_raw: {
        Row: {
          id: string
          imported_at: string
          payload: Json
        }
        Insert: {
          id?: string
          imported_at?: string
          payload?: Json
        }
        Update: {
          id?: string
          imported_at?: string
          payload?: Json
        }
        Relationships: []
      }
      eng_gov_faturamento_raw: {
        Row: {
          id: string
          imported_at: string
          payload: Json
        }
        Insert: {
          id?: string
          imported_at?: string
          payload?: Json
        }
        Update: {
          id?: string
          imported_at?: string
          payload?: Json
        }
        Relationships: []
      }
      eng_gov_resultados_raw: {
        Row: {
          id: string
          imported_at: string
          payload: Json
        }
        Insert: {
          id?: string
          imported_at?: string
          payload?: Json
        }
        Update: {
          id?: string
          imported_at?: string
          payload?: Json
        }
        Relationships: []
      }
      eng_gov_settings: {
        Row: {
          edit_open_to_all: boolean
          id: boolean
          updated_at: string
        }
        Insert: {
          edit_open_to_all?: boolean
          id?: boolean
          updated_at?: string
        }
        Update: {
          edit_open_to_all?: boolean
          id?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      eng_governanca_master: {
        Row: {
          area_atuacao: string | null
          categoria_on_hold: string | null
          categoria_problema_1: string | null
          categoria_problema_2: string | null
          categoria_problema_3: string | null
          causa_raiz: string | null
          cliente: string | null
          created_at: string
          custo_total_direto_real: number | null
          custos_diversos_total: number | null
          data_acionamento: string | null
          faturamento_total: number | null
          id: string
          localizador: string | null
          margem_real: number | null
          ofensor: string | null
          pct_conclusao_campo: number | null
          prazo_final: string | null
          prioridade: string | null
          quantidade_replan_total: number | null
          raw: Json | null
          responsavel: string | null
          resultado_real: number | null
          sla_aprovacao: number | null
          status: string | null
          status_bi: string | null
          tempo_execucao_real: number | null
          termino_real: string | null
          tipo_atividade: string | null
          updated_at: string
          valor_inicial: number | null
        }
        Insert: {
          area_atuacao?: string | null
          categoria_on_hold?: string | null
          categoria_problema_1?: string | null
          categoria_problema_2?: string | null
          categoria_problema_3?: string | null
          causa_raiz?: string | null
          cliente?: string | null
          created_at?: string
          custo_total_direto_real?: number | null
          custos_diversos_total?: number | null
          data_acionamento?: string | null
          faturamento_total?: number | null
          id?: string
          localizador?: string | null
          margem_real?: number | null
          ofensor?: string | null
          pct_conclusao_campo?: number | null
          prazo_final?: string | null
          prioridade?: string | null
          quantidade_replan_total?: number | null
          raw?: Json | null
          responsavel?: string | null
          resultado_real?: number | null
          sla_aprovacao?: number | null
          status?: string | null
          status_bi?: string | null
          tempo_execucao_real?: number | null
          termino_real?: string | null
          tipo_atividade?: string | null
          updated_at?: string
          valor_inicial?: number | null
        }
        Update: {
          area_atuacao?: string | null
          categoria_on_hold?: string | null
          categoria_problema_1?: string | null
          categoria_problema_2?: string | null
          categoria_problema_3?: string | null
          causa_raiz?: string | null
          cliente?: string | null
          created_at?: string
          custo_total_direto_real?: number | null
          custos_diversos_total?: number | null
          data_acionamento?: string | null
          faturamento_total?: number | null
          id?: string
          localizador?: string | null
          margem_real?: number | null
          ofensor?: string | null
          pct_conclusao_campo?: number | null
          prazo_final?: string | null
          prioridade?: string | null
          quantidade_replan_total?: number | null
          raw?: Json | null
          responsavel?: string | null
          resultado_real?: number | null
          sla_aprovacao?: number | null
          status?: string | null
          status_bi?: string | null
          tempo_execucao_real?: number | null
          termino_real?: string | null
          tipo_atividade?: string | null
          updated_at?: string
          valor_inicial?: number | null
        }
        Relationships: []
      }
      eng_integracoes: {
        Row: {
          ativa: boolean | null
          chave: string | null
          config: Json | null
          descricao: string | null
          id: string
          updated_at: string
        }
        Insert: {
          ativa?: boolean | null
          chave?: string | null
          config?: Json | null
          descricao?: string | null
          id?: string
          updated_at?: string
        }
        Update: {
          ativa?: boolean | null
          chave?: string | null
          config?: Json | null
          descricao?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      eng_internal_notifications: {
        Row: {
          created_at: string
          created_by: string | null
          detalhe: string | null
          id: string
          lida: boolean
          modulo: string | null
          origem: string
          origem_id: string | null
          route: string | null
          tipo: string
          titulo: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          detalhe?: string | null
          id?: string
          lida?: boolean
          modulo?: string | null
          origem: string
          origem_id?: string | null
          route?: string | null
          tipo?: string
          titulo: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          detalhe?: string | null
          id?: string
          lida?: boolean
          modulo?: string | null
          origem?: string
          origem_id?: string | null
          route?: string | null
          tipo?: string
          titulo?: string
          user_id?: string | null
        }
        Relationships: []
      }
      eng_ligacoes_energia: {
        Row: {
          concessionaria: string | null
          created_at: string
          data: Json | null
          data_ligacao: string | null
          data_solicitacao: string | null
          id: string
          protocolo: string | null
          site_id: string | null
          status: string | null
          updated_at: string
        }
        Insert: {
          concessionaria?: string | null
          created_at?: string
          data?: Json | null
          data_ligacao?: string | null
          data_solicitacao?: string | null
          id?: string
          protocolo?: string | null
          site_id?: string | null
          status?: string | null
          updated_at?: string
        }
        Update: {
          concessionaria?: string | null
          created_at?: string
          data?: Json | null
          data_ligacao?: string | null
          data_solicitacao?: string | null
          id?: string
          protocolo?: string | null
          site_id?: string | null
          status?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      eng_materiais: {
        Row: {
          created_at: string
          data: Json | null
          descricao: string
          estoque: number | null
          id: string
          reservado: number | null
          site_id: string | null
          unidade: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          data?: Json | null
          descricao: string
          estoque?: number | null
          id?: string
          reservado?: number | null
          site_id?: string | null
          unidade?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          data?: Json | null
          descricao?: string
          estoque?: number | null
          id?: string
          reservado?: number | null
          site_id?: string | null
          unidade?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      eng_module_permissions: {
        Row: {
          can_delete: boolean
          can_edit: boolean
          can_view: boolean
          created_at: string
          id: string
          module: string
          updated_at: string
          user_id: string
        }
        Insert: {
          can_delete?: boolean
          can_edit?: boolean
          can_view?: boolean
          created_at?: string
          id?: string
          module: string
          updated_at?: string
          user_id: string
        }
        Update: {
          can_delete?: boolean
          can_edit?: boolean
          can_view?: boolean
          created_at?: string
          id?: string
          module?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      eng_pendencias: {
        Row: {
          created_at: string
          data: Json | null
          id: string
          prazo: string | null
          prioridade: string | null
          responsavel: string | null
          site_id: string | null
          status: string | null
          titulo: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          data?: Json | null
          id?: string
          prazo?: string | null
          prioridade?: string | null
          responsavel?: string | null
          site_id?: string | null
          status?: string | null
          titulo: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          data?: Json | null
          id?: string
          prazo?: string | null
          prioridade?: string | null
          responsavel?: string | null
          site_id?: string | null
          status?: string | null
          titulo?: string
          updated_at?: string
        }
        Relationships: []
      }
      eng_projetos: {
        Row: {
          cliente: string | null
          created_at: string
          created_by: string | null
          data: Json | null
          id: string
          nome: string
          status: string | null
          updated_at: string
        }
        Insert: {
          cliente?: string | null
          created_at?: string
          created_by?: string | null
          data?: Json | null
          id?: string
          nome: string
          status?: string | null
          updated_at?: string
        }
        Update: {
          cliente?: string | null
          created_at?: string
          created_by?: string | null
          data?: Json | null
          id?: string
          nome?: string
          status?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      eng_projetos_elaboracao: {
        Row: {
          cidade: string | null
          cliente: string | null
          conta: string | null
          created_at: string
          created_by: string | null
          data_inicio_real: string | null
          data_solicitacao: string | null
          data_termino_real: string | null
          delta_horas: number | null
          dentro_prazo: string | null
          descricao: string | null
          diferenca_tempo: number | null
          escopo: string | null
          escopo_generico: string | null
          id: string
          link_pasta: string | null
          local_elaboracao: string | null
          observacao: string | null
          peso: number | null
          prazo_conclusao: string | null
          prioridade: string | null
          projetista: string | null
          responsavel_solicitante: string | null
          site: string | null
          status: string | null
          tempo_previsto: string | null
          tempo_real: string | null
          tempo_resposta_previsto: number | null
          tempo_resposta_real: number | null
          uf: string | null
          updated_at: string
        }
        Insert: {
          cidade?: string | null
          cliente?: string | null
          conta?: string | null
          created_at?: string
          created_by?: string | null
          data_inicio_real?: string | null
          data_solicitacao?: string | null
          data_termino_real?: string | null
          delta_horas?: number | null
          dentro_prazo?: string | null
          descricao?: string | null
          diferenca_tempo?: number | null
          escopo?: string | null
          escopo_generico?: string | null
          id?: string
          link_pasta?: string | null
          local_elaboracao?: string | null
          observacao?: string | null
          peso?: number | null
          prazo_conclusao?: string | null
          prioridade?: string | null
          projetista?: string | null
          responsavel_solicitante?: string | null
          site?: string | null
          status?: string | null
          tempo_previsto?: string | null
          tempo_real?: string | null
          tempo_resposta_previsto?: number | null
          tempo_resposta_real?: number | null
          uf?: string | null
          updated_at?: string
        }
        Update: {
          cidade?: string | null
          cliente?: string | null
          conta?: string | null
          created_at?: string
          created_by?: string | null
          data_inicio_real?: string | null
          data_solicitacao?: string | null
          data_termino_real?: string | null
          delta_horas?: number | null
          dentro_prazo?: string | null
          descricao?: string | null
          diferenca_tempo?: number | null
          escopo?: string | null
          escopo_generico?: string | null
          id?: string
          link_pasta?: string | null
          local_elaboracao?: string | null
          observacao?: string | null
          peso?: number | null
          prazo_conclusao?: string | null
          prioridade?: string | null
          projetista?: string | null
          responsavel_solicitante?: string | null
          site?: string | null
          status?: string | null
          tempo_previsto?: string | null
          tempo_real?: string | null
          tempo_resposta_previsto?: number | null
          tempo_resposta_real?: number | null
          uf?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      eng_relatorios: {
        Row: {
          autor: string | null
          created_at: string
          data: string | null
          id: string
          payload: Json | null
          site_id: string | null
          tipo: string | null
          titulo: string
          updated_at: string
        }
        Insert: {
          autor?: string | null
          created_at?: string
          data?: string | null
          id?: string
          payload?: Json | null
          site_id?: string | null
          tipo?: string | null
          titulo: string
          updated_at?: string
        }
        Update: {
          autor?: string | null
          created_at?: string
          data?: string | null
          id?: string
          payload?: Json | null
          site_id?: string | null
          tipo?: string | null
          titulo?: string
          updated_at?: string
        }
        Relationships: []
      }
      eng_rfi: {
        Row: {
          assunto: string | null
          created_at: string
          data: Json | null
          descricao: string | null
          id: string
          numero: string | null
          prazo: string | null
          site_id: string | null
          status: string | null
          updated_at: string
        }
        Insert: {
          assunto?: string | null
          created_at?: string
          data?: Json | null
          descricao?: string | null
          id?: string
          numero?: string | null
          prazo?: string | null
          site_id?: string | null
          status?: string | null
          updated_at?: string
        }
        Update: {
          assunto?: string | null
          created_at?: string
          data?: Json | null
          descricao?: string | null
          id?: string
          numero?: string | null
          prazo?: string | null
          site_id?: string | null
          status?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "eng_rfi_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "eng_sites"
            referencedColumns: ["id"]
          },
        ]
      }
      eng_roadmap_ia: {
        Row: {
          area: string | null
          created_at: string
          descricao: string | null
          id: string
          prioridade: string | null
          status: string | null
          titulo: string
          updated_at: string
        }
        Insert: {
          area?: string | null
          created_at?: string
          descricao?: string | null
          id?: string
          prioridade?: string | null
          status?: string | null
          titulo: string
          updated_at?: string
        }
        Update: {
          area?: string | null
          created_at?: string
          descricao?: string | null
          id?: string
          prioridade?: string | null
          status?: string | null
          titulo?: string
          updated_at?: string
        }
        Relationships: []
      }
      eng_shared_records: {
        Row: {
          created_at: string
          created_by: string | null
          data: Json
          id: string
          kind: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          data?: Json
          id?: string
          kind: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          data?: Json
          id?: string
          kind?: string
          updated_at?: string
        }
        Relationships: []
      }
      eng_site_costs: {
        Row: {
          categoria: string
          created_at: string
          created_by: string | null
          data_lancamento: string | null
          descricao: string | null
          id: string
          observacao: string | null
          origem: string | null
          origem_id: string | null
          site_id: string | null
          site_name: string | null
          valor: number
        }
        Insert: {
          categoria: string
          created_at?: string
          created_by?: string | null
          data_lancamento?: string | null
          descricao?: string | null
          id?: string
          observacao?: string | null
          origem?: string | null
          origem_id?: string | null
          site_id?: string | null
          site_name?: string | null
          valor?: number
        }
        Update: {
          categoria?: string
          created_at?: string
          created_by?: string | null
          data_lancamento?: string | null
          descricao?: string | null
          id?: string
          observacao?: string | null
          origem?: string | null
          origem_id?: string | null
          site_id?: string | null
          site_name?: string | null
          valor?: number
        }
        Relationships: []
      }
      eng_sites: {
        Row: {
          cidade: string | null
          codigo: string | null
          created_at: string
          data: Json | null
          id: string
          latitude: number | null
          longitude: number | null
          nome: string
          responsavel: string | null
          status: string | null
          uf: string | null
          updated_at: string
        }
        Insert: {
          cidade?: string | null
          codigo?: string | null
          created_at?: string
          data?: Json | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          nome: string
          responsavel?: string | null
          status?: string | null
          uf?: string | null
          updated_at?: string
        }
        Update: {
          cidade?: string | null
          codigo?: string | null
          created_at?: string
          data?: Json | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          nome?: string
          responsavel?: string | null
          status?: string | null
          uf?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      eng_solicitacao_sc_rc: {
        Row: {
          categoria: string | null
          centro_custo: string | null
          conta_financeira: string | null
          created_at: string
          created_by: string | null
          id: string
          numero_documento: string
          observacao: string | null
          solicit_id: string
          status: string | null
          tipo_documento: string
          updated_at: string
        }
        Insert: {
          categoria?: string | null
          centro_custo?: string | null
          conta_financeira?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          numero_documento: string
          observacao?: string | null
          solicit_id: string
          status?: string | null
          tipo_documento: string
          updated_at?: string
        }
        Update: {
          categoria?: string | null
          centro_custo?: string | null
          conta_financeira?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          numero_documento?: string
          observacao?: string | null
          solicit_id?: string
          status?: string | null
          tipo_documento?: string
          updated_at?: string
        }
        Relationships: []
      }
      eng_suprimentos: {
        Row: {
          created_at: string
          data: Json | null
          descricao: string | null
          id: string
          itens: Json | null
          numero: string | null
          prazo: string | null
          responsavel: string | null
          solicitante: string | null
          status: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          data?: Json | null
          descricao?: string | null
          id?: string
          itens?: Json | null
          numero?: string | null
          prazo?: string | null
          responsavel?: string | null
          solicitante?: string | null
          status?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          data?: Json | null
          descricao?: string | null
          id?: string
          itens?: Json | null
          numero?: string | null
          prazo?: string | null
          responsavel?: string | null
          solicitante?: string | null
          status?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      eng_sync_runs: {
        Row: {
          file_name: string | null
          id: string
          kind: string
          message: string | null
          mode: string | null
          ran_at: string
          ran_by: string | null
          row_count: number | null
          sheet_name: string | null
          status: string
        }
        Insert: {
          file_name?: string | null
          id?: string
          kind: string
          message?: string | null
          mode?: string | null
          ran_at?: string
          ran_by?: string | null
          row_count?: number | null
          sheet_name?: string | null
          status: string
        }
        Update: {
          file_name?: string | null
          id?: string
          kind?: string
          message?: string | null
          mode?: string | null
          ran_at?: string
          ran_by?: string | null
          row_count?: number | null
          sheet_name?: string | null
          status?: string
        }
        Relationships: []
      }
      eng_ui_overrides: {
        Row: {
          alvo: string
          ativo: boolean
          config: Json
          created_at: string
          escopo: string
          id: string
          updated_at: string
        }
        Insert: {
          alvo: string
          ativo?: boolean
          config?: Json
          created_at?: string
          escopo: string
          id?: string
          updated_at?: string
        }
        Update: {
          alvo?: string
          ativo?: boolean
          config?: Json
          created_at?: string
          escopo?: string
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      module_visibility_settings: {
        Row: {
          default_assignment: string
          module_key: string
          module_label: string
          restricted: boolean
          updated_at: string
        }
        Insert: {
          default_assignment?: string
          module_key: string
          module_label: string
          restricted?: boolean
          updated_at?: string
        }
        Update: {
          default_assignment?: string
          module_key?: string
          module_label?: string
          restricted?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      pixel_admin_actions: {
        Row: {
          action_type: string
          admin_user_id: string
          created_at: string
          description: string | null
          id: string
          metadata: Json | null
          target_user_id: string | null
        }
        Insert: {
          action_type: string
          admin_user_id: string
          created_at?: string
          description?: string | null
          id?: string
          metadata?: Json | null
          target_user_id?: string | null
        }
        Update: {
          action_type?: string
          admin_user_id?: string
          created_at?: string
          description?: string | null
          id?: string
          metadata?: Json | null
          target_user_id?: string | null
        }
        Relationships: []
      }
      pixel_desks: {
        Row: {
          created_at: string
          desk_name: string | null
          desk_type: string
          id: string
          is_active: boolean
          is_locked: boolean
          position_x: number
          position_y: number
          rotation: number
          updated_at: string
          user_id: string | null
          workspace_id: string
        }
        Insert: {
          created_at?: string
          desk_name?: string | null
          desk_type?: string
          id?: string
          is_active?: boolean
          is_locked?: boolean
          position_x?: number
          position_y?: number
          rotation?: number
          updated_at?: string
          user_id?: string | null
          workspace_id: string
        }
        Update: {
          created_at?: string
          desk_name?: string | null
          desk_type?: string
          id?: string
          is_active?: boolean
          is_locked?: boolean
          position_x?: number
          position_y?: number
          rotation?: number
          updated_at?: string
          user_id?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pixel_desks_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "pixel_workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      pixel_meeting_participants: {
        Row: {
          created_at: string
          id: string
          joined_at: string | null
          left_at: string | null
          meeting_id: string
          participant_status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          joined_at?: string | null
          left_at?: string | null
          meeting_id: string
          participant_status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          joined_at?: string | null
          left_at?: string | null
          meeting_id?: string
          participant_status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pixel_meeting_participants_meeting_id_fkey"
            columns: ["meeting_id"]
            isOneToOne: false
            referencedRelation: "pixel_meetings"
            referencedColumns: ["id"]
          },
        ]
      }
      pixel_meetings: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          ends_at: string | null
          id: string
          room_id: string | null
          starts_at: string | null
          status: string
          title: string
          updated_at: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          ends_at?: string | null
          id?: string
          room_id?: string | null
          starts_at?: string | null
          status?: string
          title: string
          updated_at?: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          ends_at?: string | null
          id?: string
          room_id?: string | null
          starts_at?: string | null
          status?: string
          title?: string
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pixel_meetings_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "pixel_rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pixel_meetings_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "pixel_workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      pixel_messages: {
        Row: {
          created_at: string
          deleted_by: string | null
          id: string
          is_deleted: boolean
          message: string
          message_type: string
          room_id: string | null
          sender_user_id: string
          updated_at: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          deleted_by?: string | null
          id?: string
          is_deleted?: boolean
          message: string
          message_type?: string
          room_id?: string | null
          sender_user_id: string
          updated_at?: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          deleted_by?: string | null
          id?: string
          is_deleted?: boolean
          message?: string
          message_type?: string
          room_id?: string | null
          sender_user_id?: string
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pixel_messages_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "pixel_rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pixel_messages_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "pixel_workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      pixel_positions: {
        Row: {
          current_action: string
          direction: string
          id: string
          is_sitting: boolean
          last_moved_at: string
          position_x: number
          position_y: number
          target_x: number | null
          target_y: number | null
          updated_at: string
          user_id: string
          workspace_id: string | null
        }
        Insert: {
          current_action?: string
          direction?: string
          id?: string
          is_sitting?: boolean
          last_moved_at?: string
          position_x?: number
          position_y?: number
          target_x?: number | null
          target_y?: number | null
          updated_at?: string
          user_id: string
          workspace_id?: string | null
        }
        Update: {
          current_action?: string
          direction?: string
          id?: string
          is_sitting?: boolean
          last_moved_at?: string
          position_x?: number
          position_y?: number
          target_x?: number | null
          target_y?: number | null
          updated_at?: string
          user_id?: string
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pixel_positions_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "pixel_workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      pixel_profiles: {
        Row: {
          age: number | null
          avatar_accessory_key: string | null
          avatar_body_key: string | null
          avatar_bottom_key: string | null
          avatar_clothes_key: string | null
          avatar_earring_key: string | null
          avatar_glasses_key: string | null
          avatar_hair_color: string | null
          avatar_hair_key: string | null
          avatar_hat_key: string | null
          avatar_lipstick_key: string | null
          avatar_outfit_color: string | null
          avatar_outfit_key: string | null
          avatar_shoes_key: string | null
          avatar_skin_tone: string | null
          avatar_sprite_key: string | null
          avatar_tool_key: string | null
          created_at: string
          department: string | null
          display_name: string | null
          id: string
          is_blocked: boolean
          is_visible: boolean
          job_title: string | null
          linkedin_url: string | null
          sector_description: string | null
          show_age: boolean
          status: string
          updated_at: string
          user_id: string
          visibility_group_id: string | null
        }
        Insert: {
          age?: number | null
          avatar_accessory_key?: string | null
          avatar_body_key?: string | null
          avatar_bottom_key?: string | null
          avatar_clothes_key?: string | null
          avatar_earring_key?: string | null
          avatar_glasses_key?: string | null
          avatar_hair_color?: string | null
          avatar_hair_key?: string | null
          avatar_hat_key?: string | null
          avatar_lipstick_key?: string | null
          avatar_outfit_color?: string | null
          avatar_outfit_key?: string | null
          avatar_shoes_key?: string | null
          avatar_skin_tone?: string | null
          avatar_sprite_key?: string | null
          avatar_tool_key?: string | null
          created_at?: string
          department?: string | null
          display_name?: string | null
          id?: string
          is_blocked?: boolean
          is_visible?: boolean
          job_title?: string | null
          linkedin_url?: string | null
          sector_description?: string | null
          show_age?: boolean
          status?: string
          updated_at?: string
          user_id: string
          visibility_group_id?: string | null
        }
        Update: {
          age?: number | null
          avatar_accessory_key?: string | null
          avatar_body_key?: string | null
          avatar_bottom_key?: string | null
          avatar_clothes_key?: string | null
          avatar_earring_key?: string | null
          avatar_glasses_key?: string | null
          avatar_hair_color?: string | null
          avatar_hair_key?: string | null
          avatar_hat_key?: string | null
          avatar_lipstick_key?: string | null
          avatar_outfit_color?: string | null
          avatar_outfit_key?: string | null
          avatar_shoes_key?: string | null
          avatar_skin_tone?: string | null
          avatar_sprite_key?: string | null
          avatar_tool_key?: string | null
          created_at?: string
          department?: string | null
          display_name?: string | null
          id?: string
          is_blocked?: boolean
          is_visible?: boolean
          job_title?: string | null
          linkedin_url?: string | null
          sector_description?: string | null
          show_age?: boolean
          status?: string
          updated_at?: string
          user_id?: string
          visibility_group_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pixel_profiles_visibility_group_id_fkey"
            columns: ["visibility_group_id"]
            isOneToOne: false
            referencedRelation: "visibility_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      pixel_rooms: {
        Row: {
          capacity: number
          created_at: string
          id: string
          is_active: boolean
          name: string
          position_x: number
          position_y: number
          room_key: string
          room_type: string
          updated_at: string
          workspace_id: string
        }
        Insert: {
          capacity?: number
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          position_x?: number
          position_y?: number
          room_key: string
          room_type?: string
          updated_at?: string
          workspace_id: string
        }
        Update: {
          capacity?: number
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          position_x?: number
          position_y?: number
          room_key?: string
          room_type?: string
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pixel_rooms_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "pixel_workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      pixel_workspaces: {
        Row: {
          background_asset_key: string | null
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          layout_mode: string
          name: string
          updated_at: string
          visibility_group_id: string
          workspace_key: string
        }
        Insert: {
          background_asset_key?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          layout_mode?: string
          name: string
          updated_at?: string
          visibility_group_id: string
          workspace_key: string
        }
        Update: {
          background_asset_key?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          layout_mode?: string
          name?: string
          updated_at?: string
          visibility_group_id?: string
          workspace_key?: string
        }
        Relationships: [
          {
            foreignKeyName: "pixel_workspaces_visibility_group_id_fkey"
            columns: ["visibility_group_id"]
            isOneToOne: true
            referencedRelation: "visibility_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          full_name: string | null
          id: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
        }
        Update: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
        }
        Relationships: []
      }
      projetos: {
        Row: {
          cliente: string | null
          created_at: string
          created_by: string | null
          id: string
          nome: string
          status: string
        }
        Insert: {
          cliente?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          nome: string
          status?: string
        }
        Update: {
          cliente?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          nome?: string
          status?: string
        }
        Relationships: []
      }
      record_visibility: {
        Row: {
          group_id: string
          id: string
          record_id: string
          record_table: string
        }
        Insert: {
          group_id: string
          id?: string
          record_id: string
          record_table: string
        }
        Update: {
          group_id?: string
          id?: string
          record_id?: string
          record_table?: string
        }
        Relationships: [
          {
            foreignKeyName: "record_visibility_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "visibility_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_visibility_groups: {
        Row: {
          group_id: string
          user_id: string
        }
        Insert: {
          group_id: string
          user_id: string
        }
        Update: {
          group_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_visibility_groups_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "visibility_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      visibility_audit: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string
          details: Json | null
          id: string
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string
          details?: Json | null
          id?: string
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string
          details?: Json | null
          id?: string
        }
        Relationships: []
      }
      visibility_groups: {
        Row: {
          color: string
          created_at: string
          description: string | null
          id: string
          name: string
        }
        Insert: {
          color?: string
          created_at?: string
          description?: string | null
          id?: string
          name: string
        }
        Update: {
          color?: string
          created_at?: string
          description?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      eng_can_edit: { Args: { _uid: string }; Returns: boolean }
      eng_log_audit: {
        Args: {
          _acao: string
          _dados_antes?: Json
          _dados_depois?: Json
          _entidade_id?: string
          _entidade_tipo?: string
          _ip_origem?: string
          _modulo: string
          _nome_entidade?: string
          _observacoes?: string
          _user_agent?: string
        }
        Returns: undefined
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      has_visibility: {
        Args: { _record_id: string; _table: string; _user_id: string }
        Returns: boolean
      }
      user_group_ids: { Args: { _user_id: string }; Returns: string[] }
      user_in_group: {
        Args: { _group_id: string; _user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role:
        | "admin"
        | "user"
        | "planejamento"
        | "diretoria"
        | "engenharia"
        | "suprimentos"
        | "fibra"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: [
        "admin",
        "user",
        "planejamento",
        "diretoria",
        "engenharia",
        "suprimentos",
        "fibra",
      ],
    },
  },
} as const
