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
      companies: {
        Row: {
          ativo: boolean
          cnpj: string | null
          contato_email: string | null
          contato_nome: string | null
          contato_whatsapp: string | null
          created_at: string
          id: string
          nome: string
          pix_chave: string | null
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          cnpj?: string | null
          contato_email?: string | null
          contato_nome?: string | null
          contato_whatsapp?: string | null
          created_at?: string
          id?: string
          nome: string
          pix_chave?: string | null
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          cnpj?: string | null
          contato_email?: string | null
          contato_nome?: string | null
          contato_whatsapp?: string | null
          created_at?: string
          id?: string
          nome?: string
          pix_chave?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      company_branding: {
        Row: {
          company_id: string
          id: string
          letterhead_url: string | null
          logo_url: string | null
          primary_color: string | null
          rodape: string | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          company_id: string
          id?: string
          letterhead_url?: string | null
          logo_url?: string | null
          primary_color?: string | null
          rodape?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          company_id?: string
          id?: string
          letterhead_url?: string | null
          logo_url?: string | null
          primary_color?: string | null
          rodape?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      company_module_permissions: {
        Row: {
          can_delete: boolean
          can_edit: boolean
          can_view: boolean
          company_id: string
          id: string
          module_key: string
          updated_at: string
          user_id: string
        }
        Insert: {
          can_delete?: boolean
          can_edit?: boolean
          can_view?: boolean
          company_id: string
          id?: string
          module_key: string
          updated_at?: string
          user_id: string
        }
        Update: {
          can_delete?: boolean
          can_edit?: boolean
          can_view?: boolean
          company_id?: string
          id?: string
          module_key?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_module_permissions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_module_permissions_module_key_fkey"
            columns: ["module_key"]
            isOneToOne: false
            referencedRelation: "plan_modules_catalog"
            referencedColumns: ["key"]
          },
        ]
      }
      company_plan_payments: {
        Row: {
          company_plan_id: string
          competencia: string
          created_at: string
          data_pagamento: string
          id: string
          observacao: string | null
          registrado_por: string | null
          valor_pago: number
        }
        Insert: {
          company_plan_id: string
          competencia: string
          created_at?: string
          data_pagamento: string
          id?: string
          observacao?: string | null
          registrado_por?: string | null
          valor_pago?: number
        }
        Update: {
          company_plan_id?: string
          competencia?: string
          created_at?: string
          data_pagamento?: string
          id?: string
          observacao?: string | null
          registrado_por?: string | null
          valor_pago?: number
        }
        Relationships: [
          {
            foreignKeyName: "company_plan_payments_company_plan_id_fkey"
            columns: ["company_plan_id"]
            isOneToOne: false
            referencedRelation: "company_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      company_plans: {
        Row: {
          company_id: string
          created_at: string
          dia_vencimento: number
          id: string
          integrations: string[]
          modules: string[]
          observacoes: string | null
          status: string
          updated_at: string
          valor_mensal: number
        }
        Insert: {
          company_id: string
          created_at?: string
          dia_vencimento?: number
          id?: string
          integrations?: string[]
          modules?: string[]
          observacoes?: string | null
          status?: string
          updated_at?: string
          valor_mensal?: number
        }
        Update: {
          company_id?: string
          created_at?: string
          dia_vencimento?: number
          id?: string
          integrations?: string[]
          modules?: string[]
          observacoes?: string | null
          status?: string
          updated_at?: string
          valor_mensal?: number
        }
        Relationships: [
          {
            foreignKeyName: "company_plans_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: true
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      company_theme_settings: {
        Row: {
          accent_color: string | null
          animation_level: string | null
          background_color: string | null
          background_image_url: string | null
          background_overlay_alpha: number | null
          border_color: string | null
          border_radius: string | null
          button_style: string | null
          card_style: string | null
          company_id: string
          contrast_level: string | null
          created_at: string
          danger_color: string | null
          dashboard_density: string | null
          font_family: string | null
          glass_intensity: number | null
          id: string
          info_color: string | null
          is_active: boolean
          muted_text_color: string | null
          primary_color: string | null
          secondary_color: string | null
          shadow_style: string | null
          sidebar_style: string | null
          success_color: string | null
          surface_color: string | null
          table_density: string | null
          text_color: string | null
          theme_preset: string
          updated_at: string
          updated_by: string | null
          warning_color: string | null
        }
        Insert: {
          accent_color?: string | null
          animation_level?: string | null
          background_color?: string | null
          background_image_url?: string | null
          background_overlay_alpha?: number | null
          border_color?: string | null
          border_radius?: string | null
          button_style?: string | null
          card_style?: string | null
          company_id: string
          contrast_level?: string | null
          created_at?: string
          danger_color?: string | null
          dashboard_density?: string | null
          font_family?: string | null
          glass_intensity?: number | null
          id?: string
          info_color?: string | null
          is_active?: boolean
          muted_text_color?: string | null
          primary_color?: string | null
          secondary_color?: string | null
          shadow_style?: string | null
          sidebar_style?: string | null
          success_color?: string | null
          surface_color?: string | null
          table_density?: string | null
          text_color?: string | null
          theme_preset?: string
          updated_at?: string
          updated_by?: string | null
          warning_color?: string | null
        }
        Update: {
          accent_color?: string | null
          animation_level?: string | null
          background_color?: string | null
          background_image_url?: string | null
          background_overlay_alpha?: number | null
          border_color?: string | null
          border_radius?: string | null
          button_style?: string | null
          card_style?: string | null
          company_id?: string
          contrast_level?: string | null
          created_at?: string
          danger_color?: string | null
          dashboard_density?: string | null
          font_family?: string | null
          glass_intensity?: number | null
          id?: string
          info_color?: string | null
          is_active?: boolean
          muted_text_color?: string | null
          primary_color?: string | null
          secondary_color?: string | null
          shadow_style?: string | null
          sidebar_style?: string | null
          success_color?: string | null
          surface_color?: string | null
          table_density?: string | null
          text_color?: string | null
          theme_preset?: string
          updated_at?: string
          updated_by?: string | null
          warning_color?: string | null
        }
        Relationships: []
      }
      company_users: {
        Row: {
          company_id: string
          created_at: string
          id: string
          is_company_admin: boolean
          user_id: string
        }
        Insert: {
          company_id: string
          created_at?: string
          id?: string
          is_company_admin?: boolean
          user_id: string
        }
        Update: {
          company_id?: string
          created_at?: string
          id?: string
          is_company_admin?: boolean
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_users_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      crea_admin_config: {
        Row: {
          key: string
          updated_at: string
          updated_by: string | null
          value: string
        }
        Insert: {
          key: string
          updated_at?: string
          updated_by?: string | null
          value: string
        }
        Update: {
          key?: string
          updated_at?: string
          updated_by?: string | null
          value?: string
        }
        Relationships: []
      }
      crea_ai_questions: {
        Row: {
          company_id: string | null
          created_at: string
          fontes: Json | null
          id: string
          pergunta: string
          resposta: string | null
          user_id: string | null
        }
        Insert: {
          company_id?: string | null
          created_at?: string
          fontes?: Json | null
          id?: string
          pergunta: string
          resposta?: string | null
          user_id?: string | null
        }
        Update: {
          company_id?: string | null
          created_at?: string
          fontes?: Json | null
          id?: string
          pergunta?: string
          resposta?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      crea_ai_sources: {
        Row: {
          ativo: boolean
          company_id: string | null
          conteudo: string | null
          created_at: string
          data: Json | null
          delete_reason: string | null
          deleted_at: string | null
          deleted_by: string | null
          id: string
          is_deleted: boolean
          link: string | null
          tags: string[] | null
          tipo: string | null
          titulo: string
          uf: string | null
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          company_id?: string | null
          conteudo?: string | null
          created_at?: string
          data?: Json | null
          delete_reason?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          id?: string
          is_deleted?: boolean
          link?: string | null
          tags?: string[] | null
          tipo?: string | null
          titulo: string
          uf?: string | null
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          company_id?: string | null
          conteudo?: string | null
          created_at?: string
          data?: Json | null
          delete_reason?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          id?: string
          is_deleted?: boolean
          link?: string | null
          tags?: string[] | null
          tipo?: string | null
          titulo?: string
          uf?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      crea_arts: {
        Row: {
          anexo_url: string | null
          company_id: string
          contratado: string | null
          contratante: string | null
          created_at: string
          data: Json | null
          data_baixa: string | null
          data_emissao: string | null
          data_pagamento: string | null
          delete_reason: string | null
          deleted_at: string | null
          deleted_by: string | null
          empresa_id: string | null
          engineer_id: string | null
          escopo: string | null
          id: string
          is_deleted: boolean
          link: string | null
          numero: string
          observacoes: string | null
          rt_id: string | null
          setor: string | null
          site_ref: string | null
          status: string | null
          uf: string | null
          updated_at: string
          valor: number | null
        }
        Insert: {
          anexo_url?: string | null
          company_id: string
          contratado?: string | null
          contratante?: string | null
          created_at?: string
          data?: Json | null
          data_baixa?: string | null
          data_emissao?: string | null
          data_pagamento?: string | null
          delete_reason?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          empresa_id?: string | null
          engineer_id?: string | null
          escopo?: string | null
          id?: string
          is_deleted?: boolean
          link?: string | null
          numero: string
          observacoes?: string | null
          rt_id?: string | null
          setor?: string | null
          site_ref?: string | null
          status?: string | null
          uf?: string | null
          updated_at?: string
          valor?: number | null
        }
        Update: {
          anexo_url?: string | null
          company_id?: string
          contratado?: string | null
          contratante?: string | null
          created_at?: string
          data?: Json | null
          data_baixa?: string | null
          data_emissao?: string | null
          data_pagamento?: string | null
          delete_reason?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          empresa_id?: string | null
          engineer_id?: string | null
          escopo?: string | null
          id?: string
          is_deleted?: boolean
          link?: string | null
          numero?: string
          observacoes?: string | null
          rt_id?: string | null
          setor?: string | null
          site_ref?: string | null
          status?: string | null
          uf?: string | null
          updated_at?: string
          valor?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "crea_arts_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "crea_companies_crea"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crea_arts_engineer_id_fkey"
            columns: ["engineer_id"]
            isOneToOne: false
            referencedRelation: "crea_engineers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crea_arts_rt_id_fkey"
            columns: ["rt_id"]
            isOneToOne: false
            referencedRelation: "crea_responsible_technicians"
            referencedColumns: ["id"]
          },
        ]
      }
      crea_audit_logs: {
        Row: {
          action: string
          company_id: string | null
          created_at: string
          entidade_id: string | null
          entidade_tipo: string | null
          id: number
          ip_origem: string | null
          modulo: string
          nome_entidade: string | null
          observacoes: string | null
          payload: Json | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          company_id?: string | null
          created_at?: string
          entidade_id?: string | null
          entidade_tipo?: string | null
          id?: number
          ip_origem?: string | null
          modulo: string
          nome_entidade?: string | null
          observacoes?: string | null
          payload?: Json | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          company_id?: string | null
          created_at?: string
          entidade_id?: string | null
          entidade_tipo?: string | null
          id?: number
          ip_origem?: string | null
          modulo?: string
          nome_entidade?: string | null
          observacoes?: string | null
          payload?: Json | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      crea_cats: {
        Row: {
          art_id: string | null
          atestado: string | null
          company_id: string
          created_at: string
          data: Json | null
          data_emissao: string | null
          data_solicitacao: string | null
          delete_reason: string | null
          deleted_at: string | null
          deleted_by: string | null
          empresa_id: string | null
          id: string
          is_deleted: boolean
          link: string | null
          numero: string | null
          observacoes: string | null
          rt_id: string | null
          status: string | null
          tipo: string | null
          uf: string | null
          updated_at: string
        }
        Insert: {
          art_id?: string | null
          atestado?: string | null
          company_id: string
          created_at?: string
          data?: Json | null
          data_emissao?: string | null
          data_solicitacao?: string | null
          delete_reason?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          empresa_id?: string | null
          id?: string
          is_deleted?: boolean
          link?: string | null
          numero?: string | null
          observacoes?: string | null
          rt_id?: string | null
          status?: string | null
          tipo?: string | null
          uf?: string | null
          updated_at?: string
        }
        Update: {
          art_id?: string | null
          atestado?: string | null
          company_id?: string
          created_at?: string
          data?: Json | null
          data_emissao?: string | null
          data_solicitacao?: string | null
          delete_reason?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          empresa_id?: string | null
          id?: string
          is_deleted?: boolean
          link?: string | null
          numero?: string | null
          observacoes?: string | null
          rt_id?: string | null
          status?: string | null
          tipo?: string | null
          uf?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "crea_cats_art_id_fkey"
            columns: ["art_id"]
            isOneToOne: false
            referencedRelation: "crea_arts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crea_cats_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "crea_companies_crea"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crea_cats_rt_id_fkey"
            columns: ["rt_id"]
            isOneToOne: false
            referencedRelation: "crea_responsible_technicians"
            referencedColumns: ["id"]
          },
        ]
      }
      crea_certificates: {
        Row: {
          anexo_url: string | null
          company_id: string
          created_at: string
          data: Json | null
          data_emissao: string | null
          delete_reason: string | null
          deleted_at: string | null
          deleted_by: string | null
          empresa_id: string | null
          id: string
          is_deleted: boolean
          link: string | null
          numero: string | null
          observacoes: string | null
          rt_id: string | null
          status: string | null
          tipo: string
          uf: string | null
          updated_at: string
          validade: string | null
        }
        Insert: {
          anexo_url?: string | null
          company_id: string
          created_at?: string
          data?: Json | null
          data_emissao?: string | null
          delete_reason?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          empresa_id?: string | null
          id?: string
          is_deleted?: boolean
          link?: string | null
          numero?: string | null
          observacoes?: string | null
          rt_id?: string | null
          status?: string | null
          tipo: string
          uf?: string | null
          updated_at?: string
          validade?: string | null
        }
        Update: {
          anexo_url?: string | null
          company_id?: string
          created_at?: string
          data?: Json | null
          data_emissao?: string | null
          delete_reason?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          empresa_id?: string | null
          id?: string
          is_deleted?: boolean
          link?: string | null
          numero?: string | null
          observacoes?: string | null
          rt_id?: string | null
          status?: string | null
          tipo?: string
          uf?: string | null
          updated_at?: string
          validade?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "crea_certificates_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "crea_companies_crea"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crea_certificates_rt_id_fkey"
            columns: ["rt_id"]
            isOneToOne: false
            referencedRelation: "crea_responsible_technicians"
            referencedColumns: ["id"]
          },
        ]
      }
      crea_companies_crea: {
        Row: {
          cnpj: string | null
          company_id: string
          created_at: string
          data: Json | null
          delete_reason: string | null
          deleted_at: string | null
          deleted_by: string | null
          empresa: string
          id: string
          is_deleted: boolean
          link_portal: string | null
          observacoes: string | null
          registro: string | null
          rt_principal_id: string | null
          status: string | null
          uf: string
          updated_at: string
          validade: string | null
          visto: string | null
        }
        Insert: {
          cnpj?: string | null
          company_id: string
          created_at?: string
          data?: Json | null
          delete_reason?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          empresa: string
          id?: string
          is_deleted?: boolean
          link_portal?: string | null
          observacoes?: string | null
          registro?: string | null
          rt_principal_id?: string | null
          status?: string | null
          uf: string
          updated_at?: string
          validade?: string | null
          visto?: string | null
        }
        Update: {
          cnpj?: string | null
          company_id?: string
          created_at?: string
          data?: Json | null
          delete_reason?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          empresa?: string
          id?: string
          is_deleted?: boolean
          link_portal?: string | null
          observacoes?: string | null
          registro?: string | null
          rt_principal_id?: string | null
          status?: string | null
          uf?: string
          updated_at?: string
          validade?: string | null
          visto?: string | null
        }
        Relationships: []
      }
      crea_credentials: {
        Row: {
          company_id: string
          created_at: string
          created_by: string | null
          data: Json | null
          delete_reason: string | null
          deleted_at: string | null
          deleted_by: string | null
          empresa_crea_id: string | null
          id: string
          is_deleted: boolean
          login: string | null
          observacoes: string | null
          portal_url: string | null
          rt_id: string | null
          senha_enc: string | null
          status: string | null
          uf: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          company_id: string
          created_at?: string
          created_by?: string | null
          data?: Json | null
          delete_reason?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          empresa_crea_id?: string | null
          id?: string
          is_deleted?: boolean
          login?: string | null
          observacoes?: string | null
          portal_url?: string | null
          rt_id?: string | null
          senha_enc?: string | null
          status?: string | null
          uf: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          company_id?: string
          created_at?: string
          created_by?: string | null
          data?: Json | null
          delete_reason?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          empresa_crea_id?: string | null
          id?: string
          is_deleted?: boolean
          login?: string | null
          observacoes?: string | null
          portal_url?: string | null
          rt_id?: string | null
          senha_enc?: string | null
          status?: string | null
          uf?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "crea_credentials_empresa_crea_id_fkey"
            columns: ["empresa_crea_id"]
            isOneToOne: false
            referencedRelation: "crea_companies_crea"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crea_credentials_rt_id_fkey"
            columns: ["rt_id"]
            isOneToOne: false
            referencedRelation: "crea_responsible_technicians"
            referencedColumns: ["id"]
          },
        ]
      }
      crea_deadlines: {
        Row: {
          company_id: string
          created_at: string
          data: Json | null
          delete_reason: string | null
          deleted_at: string | null
          deleted_by: string | null
          id: string
          is_deleted: boolean
          observacoes: string | null
          prazo: string
          ref_id: string | null
          ref_table: string | null
          status: string | null
          tipo: string
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          data?: Json | null
          delete_reason?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          id?: string
          is_deleted?: boolean
          observacoes?: string | null
          prazo: string
          ref_id?: string | null
          ref_table?: string | null
          status?: string | null
          tipo: string
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          data?: Json | null
          delete_reason?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          id?: string
          is_deleted?: boolean
          observacoes?: string | null
          prazo?: string
          ref_id?: string | null
          ref_table?: string | null
          status?: string | null
          tipo?: string
          updated_at?: string
        }
        Relationships: []
      }
      crea_deregistrations: {
        Row: {
          art_id: string | null
          company_id: string
          created_at: string
          data: Json | null
          data_concluida: string | null
          data_solicitada: string | null
          delete_reason: string | null
          deleted_at: string | null
          deleted_by: string | null
          empresa_id: string | null
          id: string
          is_deleted: boolean
          observacoes: string | null
          protocolo_id: string | null
          rt_id: string | null
          status: string | null
          tipo: string
          uf: string | null
          updated_at: string
        }
        Insert: {
          art_id?: string | null
          company_id: string
          created_at?: string
          data?: Json | null
          data_concluida?: string | null
          data_solicitada?: string | null
          delete_reason?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          empresa_id?: string | null
          id?: string
          is_deleted?: boolean
          observacoes?: string | null
          protocolo_id?: string | null
          rt_id?: string | null
          status?: string | null
          tipo: string
          uf?: string | null
          updated_at?: string
        }
        Update: {
          art_id?: string | null
          company_id?: string
          created_at?: string
          data?: Json | null
          data_concluida?: string | null
          data_solicitada?: string | null
          delete_reason?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          empresa_id?: string | null
          id?: string
          is_deleted?: boolean
          observacoes?: string | null
          protocolo_id?: string | null
          rt_id?: string | null
          status?: string | null
          tipo?: string
          uf?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "crea_deregistrations_art_id_fkey"
            columns: ["art_id"]
            isOneToOne: false
            referencedRelation: "crea_arts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crea_deregistrations_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "crea_companies_crea"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crea_deregistrations_protocolo_id_fkey"
            columns: ["protocolo_id"]
            isOneToOne: false
            referencedRelation: "crea_protocols"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crea_deregistrations_rt_id_fkey"
            columns: ["rt_id"]
            isOneToOne: false
            referencedRelation: "crea_responsible_technicians"
            referencedColumns: ["id"]
          },
        ]
      }
      crea_documents: {
        Row: {
          anexo_url: string | null
          company_id: string
          created_at: string
          data: Json | null
          delete_reason: string | null
          deleted_at: string | null
          deleted_by: string | null
          escopo: string | null
          id: string
          is_deleted: boolean
          modelo_url: string | null
          nome: string
          obrigatorio: boolean | null
          observacoes: string | null
          responsavel: string | null
          status: string | null
          tipo: string | null
          uf: string | null
          updated_at: string
          validade: string | null
        }
        Insert: {
          anexo_url?: string | null
          company_id: string
          created_at?: string
          data?: Json | null
          delete_reason?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          escopo?: string | null
          id?: string
          is_deleted?: boolean
          modelo_url?: string | null
          nome: string
          obrigatorio?: boolean | null
          observacoes?: string | null
          responsavel?: string | null
          status?: string | null
          tipo?: string | null
          uf?: string | null
          updated_at?: string
          validade?: string | null
        }
        Update: {
          anexo_url?: string | null
          company_id?: string
          created_at?: string
          data?: Json | null
          delete_reason?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          escopo?: string | null
          id?: string
          is_deleted?: boolean
          modelo_url?: string | null
          nome?: string
          obrigatorio?: boolean | null
          observacoes?: string | null
          responsavel?: string | null
          status?: string | null
          tipo?: string | null
          uf?: string | null
          updated_at?: string
          validade?: string | null
        }
        Relationships: []
      }
      crea_engineers: {
        Row: {
          company_id: string
          cpf_mask: string | null
          crea: string | null
          created_at: string
          data: Json | null
          delete_reason: string | null
          deleted_at: string | null
          deleted_by: string | null
          email: string | null
          id: string
          is_deleted: boolean
          modalidade: string | null
          nome: string
          status: string | null
          telefone: string | null
          titulo: string | null
          uf: string | null
          updated_at: string
        }
        Insert: {
          company_id: string
          cpf_mask?: string | null
          crea?: string | null
          created_at?: string
          data?: Json | null
          delete_reason?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          email?: string | null
          id?: string
          is_deleted?: boolean
          modalidade?: string | null
          nome: string
          status?: string | null
          telefone?: string | null
          titulo?: string | null
          uf?: string | null
          updated_at?: string
        }
        Update: {
          company_id?: string
          cpf_mask?: string | null
          crea?: string | null
          created_at?: string
          data?: Json | null
          delete_reason?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          email?: string | null
          id?: string
          is_deleted?: boolean
          modalidade?: string | null
          nome?: string
          status?: string | null
          telefone?: string | null
          titulo?: string | null
          uf?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      crea_links_oficiais: {
        Row: {
          atendimento: string | null
          certidoes: string | null
          consulta_art: string | null
          consulta_cat: string | null
          created_at: string
          data: Json | null
          delete_reason: string | null
          deleted_at: string | null
          deleted_by: string | null
          id: string
          is_deleted: boolean
          login_empresa: string | null
          login_profissional: string | null
          normas: string | null
          observacoes: string | null
          portal_principal: string | null
          portal_servicos: string | null
          protocolo: string | null
          uf: string
          updated_at: string
        }
        Insert: {
          atendimento?: string | null
          certidoes?: string | null
          consulta_art?: string | null
          consulta_cat?: string | null
          created_at?: string
          data?: Json | null
          delete_reason?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          id?: string
          is_deleted?: boolean
          login_empresa?: string | null
          login_profissional?: string | null
          normas?: string | null
          observacoes?: string | null
          portal_principal?: string | null
          portal_servicos?: string | null
          protocolo?: string | null
          uf: string
          updated_at?: string
        }
        Update: {
          atendimento?: string | null
          certidoes?: string | null
          consulta_art?: string | null
          consulta_cat?: string | null
          created_at?: string
          data?: Json | null
          delete_reason?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          id?: string
          is_deleted?: boolean
          login_empresa?: string | null
          login_profissional?: string | null
          normas?: string | null
          observacoes?: string | null
          portal_principal?: string | null
          portal_servicos?: string | null
          protocolo?: string | null
          uf?: string
          updated_at?: string
        }
        Relationships: []
      }
      crea_module_permissions: {
        Row: {
          can_approve_publication: boolean
          can_create: boolean
          can_delete: boolean
          can_edit: boolean
          can_export: boolean
          can_import: boolean
          can_manage_ai_sources: boolean
          can_manage_credentials: boolean
          can_manage_norms: boolean
          can_view: boolean
          can_view_credentials: boolean
          can_view_sensitive: boolean
          company_id: string
          created_at: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          can_approve_publication?: boolean
          can_create?: boolean
          can_delete?: boolean
          can_edit?: boolean
          can_export?: boolean
          can_import?: boolean
          can_manage_ai_sources?: boolean
          can_manage_credentials?: boolean
          can_manage_norms?: boolean
          can_view?: boolean
          can_view_credentials?: boolean
          can_view_sensitive?: boolean
          company_id: string
          created_at?: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          can_approve_publication?: boolean
          can_create?: boolean
          can_delete?: boolean
          can_edit?: boolean
          can_export?: boolean
          can_import?: boolean
          can_manage_ai_sources?: boolean
          can_manage_credentials?: boolean
          can_manage_norms?: boolean
          can_view?: boolean
          can_view_credentials?: boolean
          can_view_sensitive?: boolean
          company_id?: string
          created_at?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      crea_module_settings: {
        Row: {
          company_id: string
          created_at: string
          data: Json | null
          enabled: boolean
          id: string
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          data?: Json | null
          enabled?: boolean
          id?: string
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          data?: Json | null
          enabled?: boolean
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      crea_norms: {
        Row: {
          ano: number | null
          arquivo_url: string | null
          created_at: string
          data: Json | null
          data_vigencia: string | null
          delete_reason: string | null
          deleted_at: string | null
          deleted_by: string | null
          id: string
          is_deleted: boolean
          link: string | null
          numero: string | null
          orgao: string | null
          resumo: string | null
          status: string | null
          tags: string[] | null
          tema: string | null
          tipo: string
          uf: string | null
          updated_at: string
        }
        Insert: {
          ano?: number | null
          arquivo_url?: string | null
          created_at?: string
          data?: Json | null
          data_vigencia?: string | null
          delete_reason?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          id?: string
          is_deleted?: boolean
          link?: string | null
          numero?: string | null
          orgao?: string | null
          resumo?: string | null
          status?: string | null
          tags?: string[] | null
          tema?: string | null
          tipo: string
          uf?: string | null
          updated_at?: string
        }
        Update: {
          ano?: number | null
          arquivo_url?: string | null
          created_at?: string
          data?: Json | null
          data_vigencia?: string | null
          delete_reason?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          id?: string
          is_deleted?: boolean
          link?: string | null
          numero?: string | null
          orgao?: string | null
          resumo?: string | null
          status?: string | null
          tags?: string[] | null
          tema?: string | null
          tipo?: string
          uf?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      crea_protocols: {
        Row: {
          company_id: string
          created_at: string
          data: Json | null
          data_abertura: string | null
          delete_reason: string | null
          deleted_at: string | null
          deleted_by: string | null
          empresa_id: string | null
          exigencia: string | null
          id: string
          is_deleted: boolean
          link: string | null
          login_relacionado: string | null
          numero: string | null
          prazo_esperado: string | null
          responsavel_interno: string | null
          rt_id: string | null
          status: string | null
          tipo: string
          tratativa: string | null
          uf: string | null
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          data?: Json | null
          data_abertura?: string | null
          delete_reason?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          empresa_id?: string | null
          exigencia?: string | null
          id?: string
          is_deleted?: boolean
          link?: string | null
          login_relacionado?: string | null
          numero?: string | null
          prazo_esperado?: string | null
          responsavel_interno?: string | null
          rt_id?: string | null
          status?: string | null
          tipo: string
          tratativa?: string | null
          uf?: string | null
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          data?: Json | null
          data_abertura?: string | null
          delete_reason?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          empresa_id?: string | null
          exigencia?: string | null
          id?: string
          is_deleted?: boolean
          link?: string | null
          login_relacionado?: string | null
          numero?: string | null
          prazo_esperado?: string | null
          responsavel_interno?: string | null
          rt_id?: string | null
          status?: string | null
          tipo?: string
          tratativa?: string | null
          uf?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "crea_protocols_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "crea_companies_crea"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crea_protocols_rt_id_fkey"
            columns: ["rt_id"]
            isOneToOne: false
            referencedRelation: "crea_responsible_technicians"
            referencedColumns: ["id"]
          },
        ]
      }
      crea_responsible_technicians: {
        Row: {
          company_id: string
          created_at: string
          data: Json | null
          delete_reason: string | null
          deleted_at: string | null
          deleted_by: string | null
          empresa_vinculada: string | null
          engineer_id: string | null
          fim_vinculo: string | null
          id: string
          inicio_vinculo: string | null
          is_deleted: boolean
          observacoes: string | null
          setor: string | null
          status: string | null
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          data?: Json | null
          delete_reason?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          empresa_vinculada?: string | null
          engineer_id?: string | null
          fim_vinculo?: string | null
          id?: string
          inicio_vinculo?: string | null
          is_deleted?: boolean
          observacoes?: string | null
          setor?: string | null
          status?: string | null
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          data?: Json | null
          delete_reason?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          empresa_vinculada?: string | null
          engineer_id?: string | null
          fim_vinculo?: string | null
          id?: string
          inicio_vinculo?: string | null
          is_deleted?: boolean
          observacoes?: string | null
          setor?: string | null
          status?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "crea_responsible_technicians_engineer_id_fkey"
            columns: ["engineer_id"]
            isOneToOne: false
            referencedRelation: "crea_engineers"
            referencedColumns: ["id"]
          },
        ]
      }
      crea_treatments: {
        Row: {
          art_id: string | null
          canal: string | null
          cat_id: string | null
          certificate_id: string | null
          company_id: string
          created_at: string
          data: Json | null
          data_evento: string | null
          delete_reason: string | null
          deleted_at: string | null
          deleted_by: string | null
          descricao: string | null
          id: string
          is_deleted: boolean
          prazo: string | null
          protocol_id: string | null
          proximo_passo: string | null
          responsavel: string | null
          tipo: string | null
          updated_at: string
        }
        Insert: {
          art_id?: string | null
          canal?: string | null
          cat_id?: string | null
          certificate_id?: string | null
          company_id: string
          created_at?: string
          data?: Json | null
          data_evento?: string | null
          delete_reason?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          descricao?: string | null
          id?: string
          is_deleted?: boolean
          prazo?: string | null
          protocol_id?: string | null
          proximo_passo?: string | null
          responsavel?: string | null
          tipo?: string | null
          updated_at?: string
        }
        Update: {
          art_id?: string | null
          canal?: string | null
          cat_id?: string | null
          certificate_id?: string | null
          company_id?: string
          created_at?: string
          data?: Json | null
          data_evento?: string | null
          delete_reason?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          descricao?: string | null
          id?: string
          is_deleted?: boolean
          prazo?: string | null
          protocol_id?: string | null
          proximo_passo?: string | null
          responsavel?: string | null
          tipo?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "crea_treatments_art_id_fkey"
            columns: ["art_id"]
            isOneToOne: false
            referencedRelation: "crea_arts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crea_treatments_cat_id_fkey"
            columns: ["cat_id"]
            isOneToOne: false
            referencedRelation: "crea_cats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crea_treatments_certificate_id_fkey"
            columns: ["certificate_id"]
            isOneToOne: false
            referencedRelation: "crea_certificates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crea_treatments_protocol_id_fkey"
            columns: ["protocol_id"]
            isOneToOne: false
            referencedRelation: "crea_protocols"
            referencedColumns: ["id"]
          },
        ]
      }
      eng_admin_config: {
        Row: {
          key: string
          updated_at: string
          updated_by: string | null
          value: string | null
        }
        Insert: {
          key: string
          updated_at?: string
          updated_by?: string | null
          value?: string | null
        }
        Update: {
          key?: string
          updated_at?: string
          updated_by?: string | null
          value?: string | null
        }
        Relationships: []
      }
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
          delete_reason: string | null
          deleted_at: string | null
          deleted_by: string | null
          descricao: string | null
          id: string
          is_deleted: boolean
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
          delete_reason?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          descricao?: string | null
          id?: string
          is_deleted?: boolean
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
          delete_reason?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          descricao?: string | null
          id?: string
          is_deleted?: boolean
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
          delete_reason: string | null
          deleted_at: string | null
          deleted_by: string | null
          descricao: string
          estoque: number | null
          id: string
          is_deleted: boolean
          reservado: number | null
          site_id: string | null
          unidade: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          data?: Json | null
          delete_reason?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          descricao: string
          estoque?: number | null
          id?: string
          is_deleted?: boolean
          reservado?: number | null
          site_id?: string | null
          unidade?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          data?: Json | null
          delete_reason?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          descricao?: string
          estoque?: number | null
          id?: string
          is_deleted?: boolean
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
          delete_reason: string | null
          deleted_at: string | null
          deleted_by: string | null
          id: string
          is_deleted: boolean
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
          delete_reason?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          id?: string
          is_deleted?: boolean
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
          delete_reason?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          id?: string
          is_deleted?: boolean
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
          delete_reason: string | null
          deleted_at: string | null
          deleted_by: string | null
          descricao: string | null
          id: string
          is_deleted: boolean
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
          delete_reason?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          descricao?: string | null
          id?: string
          is_deleted?: boolean
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
          delete_reason?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          descricao?: string | null
          id?: string
          is_deleted?: boolean
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
          cep: string | null
          cidade: string | null
          codigo: string | null
          created_at: string
          data: Json | null
          delete_reason: string | null
          deleted_at: string | null
          deleted_by: string | null
          delivery_date: string | null
          endereco: string | null
          id: string
          is_deleted: boolean
          latitude: number | null
          longitude: number | null
          maps_url: string | null
          nome: string
          responsavel: string | null
          status: string | null
          total_value: number
          trigger_date: string | null
          uf: string | null
          updated_at: string
        }
        Insert: {
          cep?: string | null
          cidade?: string | null
          codigo?: string | null
          created_at?: string
          data?: Json | null
          delete_reason?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          delivery_date?: string | null
          endereco?: string | null
          id?: string
          is_deleted?: boolean
          latitude?: number | null
          longitude?: number | null
          maps_url?: string | null
          nome: string
          responsavel?: string | null
          status?: string | null
          total_value?: number
          trigger_date?: string | null
          uf?: string | null
          updated_at?: string
        }
        Update: {
          cep?: string | null
          cidade?: string | null
          codigo?: string | null
          created_at?: string
          data?: Json | null
          delete_reason?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          delivery_date?: string | null
          endereco?: string | null
          id?: string
          is_deleted?: boolean
          latitude?: number | null
          longitude?: number | null
          maps_url?: string | null
          nome?: string
          responsavel?: string | null
          status?: string | null
          total_value?: number
          trigger_date?: string | null
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
          delete_reason: string | null
          deleted_at: string | null
          deleted_by: string | null
          descricao: string | null
          id: string
          is_deleted: boolean
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
          delete_reason?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          descricao?: string | null
          id?: string
          is_deleted?: boolean
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
          delete_reason?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          descricao?: string | null
          id?: string
          is_deleted?: boolean
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
      hrdp_admission_checklist_items: {
        Row: {
          admission_id: string
          anexo_path: string | null
          categoria: string
          company_id: string
          concluido: boolean
          concluido_em: string | null
          concluido_por: string | null
          created_at: string
          descricao: string | null
          id: string
          obrigatorio: boolean
          ordem: number
          titulo: string
          updated_at: string
        }
        Insert: {
          admission_id: string
          anexo_path?: string | null
          categoria?: string
          company_id: string
          concluido?: boolean
          concluido_em?: string | null
          concluido_por?: string | null
          created_at?: string
          descricao?: string | null
          id?: string
          obrigatorio?: boolean
          ordem?: number
          titulo: string
          updated_at?: string
        }
        Update: {
          admission_id?: string
          anexo_path?: string | null
          categoria?: string
          company_id?: string
          concluido?: boolean
          concluido_em?: string | null
          concluido_por?: string | null
          created_at?: string
          descricao?: string | null
          id?: string
          obrigatorio?: boolean
          ordem?: number
          titulo?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "hrdp_admission_checklist_items_admission_id_fkey"
            columns: ["admission_id"]
            isOneToOne: false
            referencedRelation: "hrdp_admissions"
            referencedColumns: ["id"]
          },
        ]
      }
      hrdp_admissions: {
        Row: {
          candidato_email: string | null
          candidato_nome: string | null
          cargo: string | null
          company_id: string
          created_at: string
          created_by: string | null
          data: Json
          data_admissao_efetiva: string | null
          data_inicio_prevista: string | null
          delete_reason: string | null
          deleted_at: string | null
          deleted_by: string | null
          employee_id: string | null
          etapa: string
          id: string
          is_deleted: boolean
          observacoes: string | null
          responsavel_id: string | null
          setor: string | null
          status: string
          updated_at: string
        }
        Insert: {
          candidato_email?: string | null
          candidato_nome?: string | null
          cargo?: string | null
          company_id: string
          created_at?: string
          created_by?: string | null
          data?: Json
          data_admissao_efetiva?: string | null
          data_inicio_prevista?: string | null
          delete_reason?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          employee_id?: string | null
          etapa?: string
          id?: string
          is_deleted?: boolean
          observacoes?: string | null
          responsavel_id?: string | null
          setor?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          candidato_email?: string | null
          candidato_nome?: string | null
          cargo?: string | null
          company_id?: string
          created_at?: string
          created_by?: string | null
          data?: Json
          data_admissao_efetiva?: string | null
          data_inicio_prevista?: string | null
          delete_reason?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          employee_id?: string | null
          etapa?: string
          id?: string
          is_deleted?: boolean
          observacoes?: string | null
          responsavel_id?: string | null
          setor?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "hrdp_admissions_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "hrdp_employees"
            referencedColumns: ["id"]
          },
        ]
      }
      hrdp_benefit_quotes: {
        Row: {
          aprovado_em: string | null
          aprovado_por: string | null
          company_id: string
          created_at: string
          created_by: string | null
          data: Json | null
          delete_reason: string | null
          deleted_at: string | null
          deleted_by: string | null
          faixa: string | null
          fornecedor: string | null
          id: string
          is_deleted: boolean
          link_referencia: string | null
          modalidade: string | null
          observacoes: string | null
          qtd_estim_colaboradores: number | null
          status: string
          tipo: string
          titulo: string
          updated_at: string
          valor_total_estimado: number | null
          valor_unitario_estimado: number | null
        }
        Insert: {
          aprovado_em?: string | null
          aprovado_por?: string | null
          company_id: string
          created_at?: string
          created_by?: string | null
          data?: Json | null
          delete_reason?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          faixa?: string | null
          fornecedor?: string | null
          id?: string
          is_deleted?: boolean
          link_referencia?: string | null
          modalidade?: string | null
          observacoes?: string | null
          qtd_estim_colaboradores?: number | null
          status?: string
          tipo: string
          titulo: string
          updated_at?: string
          valor_total_estimado?: number | null
          valor_unitario_estimado?: number | null
        }
        Update: {
          aprovado_em?: string | null
          aprovado_por?: string | null
          company_id?: string
          created_at?: string
          created_by?: string | null
          data?: Json | null
          delete_reason?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          faixa?: string | null
          fornecedor?: string | null
          id?: string
          is_deleted?: boolean
          link_referencia?: string | null
          modalidade?: string | null
          observacoes?: string | null
          qtd_estim_colaboradores?: number | null
          status?: string
          tipo?: string
          titulo?: string
          updated_at?: string
          valor_total_estimado?: number | null
          valor_unitario_estimado?: number | null
        }
        Relationships: []
      }
      hrdp_benefits: {
        Row: {
          company_id: string
          created_at: string
          data: Json | null
          data_fim: string | null
          data_inicio: string | null
          delete_reason: string | null
          deleted_at: string | null
          deleted_by: string | null
          employee_id: string | null
          fornecedor: string | null
          id: string
          is_deleted: boolean
          observacoes: string | null
          plano: string | null
          status: string
          tipo: string
          updated_at: string
          valor_colaborador: number | null
          valor_empresa: number | null
        }
        Insert: {
          company_id: string
          created_at?: string
          data?: Json | null
          data_fim?: string | null
          data_inicio?: string | null
          delete_reason?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          employee_id?: string | null
          fornecedor?: string | null
          id?: string
          is_deleted?: boolean
          observacoes?: string | null
          plano?: string | null
          status?: string
          tipo: string
          updated_at?: string
          valor_colaborador?: number | null
          valor_empresa?: number | null
        }
        Update: {
          company_id?: string
          created_at?: string
          data?: Json | null
          data_fim?: string | null
          data_inicio?: string | null
          delete_reason?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          employee_id?: string | null
          fornecedor?: string | null
          id?: string
          is_deleted?: boolean
          observacoes?: string | null
          plano?: string | null
          status?: string
          tipo?: string
          updated_at?: string
          valor_colaborador?: number | null
          valor_empresa?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "hrdp_benefits_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "hrdp_employees"
            referencedColumns: ["id"]
          },
        ]
      }
      hrdp_candidates: {
        Row: {
          area: string | null
          company_id: string
          consentimento_lgpd: boolean | null
          created_at: string
          curriculo_path: string | null
          data: Json | null
          delete_reason: string | null
          deleted_at: string | null
          deleted_by: string | null
          email: string | null
          etapa: string | null
          id: string
          is_deleted: boolean
          linkedin_url: string | null
          nome: string
          observacoes: string | null
          origem: string | null
          pretensao_salarial: number | null
          score: number | null
          status: string
          tags: string[] | null
          telefone: string | null
          updated_at: string
          vaga: string | null
        }
        Insert: {
          area?: string | null
          company_id: string
          consentimento_lgpd?: boolean | null
          created_at?: string
          curriculo_path?: string | null
          data?: Json | null
          delete_reason?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          email?: string | null
          etapa?: string | null
          id?: string
          is_deleted?: boolean
          linkedin_url?: string | null
          nome: string
          observacoes?: string | null
          origem?: string | null
          pretensao_salarial?: number | null
          score?: number | null
          status?: string
          tags?: string[] | null
          telefone?: string | null
          updated_at?: string
          vaga?: string | null
        }
        Update: {
          area?: string | null
          company_id?: string
          consentimento_lgpd?: boolean | null
          created_at?: string
          curriculo_path?: string | null
          data?: Json | null
          delete_reason?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          email?: string | null
          etapa?: string | null
          id?: string
          is_deleted?: boolean
          linkedin_url?: string | null
          nome?: string
          observacoes?: string | null
          origem?: string | null
          pretensao_salarial?: number | null
          score?: number | null
          status?: string
          tags?: string[] | null
          telefone?: string | null
          updated_at?: string
          vaga?: string | null
        }
        Relationships: []
      }
      hrdp_contract_amendments: {
        Row: {
          arquivo_path: string | null
          company_id: string
          contract_id: string
          created_at: string
          created_by: string | null
          data_vigencia: string
          descricao: string
          id: string
          nova_jornada: number | null
          novo_salario: number | null
          tipo: string
        }
        Insert: {
          arquivo_path?: string | null
          company_id: string
          contract_id: string
          created_at?: string
          created_by?: string | null
          data_vigencia: string
          descricao: string
          id?: string
          nova_jornada?: number | null
          novo_salario?: number | null
          tipo?: string
        }
        Update: {
          arquivo_path?: string | null
          company_id?: string
          contract_id?: string
          created_at?: string
          created_by?: string | null
          data_vigencia?: string
          descricao?: string
          id?: string
          nova_jornada?: number | null
          novo_salario?: number | null
          tipo?: string
        }
        Relationships: [
          {
            foreignKeyName: "hrdp_contract_amendments_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "hrdp_contracts"
            referencedColumns: ["id"]
          },
        ]
      }
      hrdp_contracts: {
        Row: {
          arquivo_path: string | null
          company_id: string
          created_at: string
          created_by: string | null
          data: Json | null
          data_fim: string | null
          data_fim_experiencia: string | null
          data_inicio: string
          delete_reason: string | null
          deleted_at: string | null
          deleted_by: string | null
          employee_id: string
          experiencia_dias: number | null
          id: string
          is_deleted: boolean
          jornada_horas: number | null
          modelo: string | null
          numero: string | null
          observacoes: string | null
          salario: number | null
          status: string
          tipo: string
          updated_at: string
        }
        Insert: {
          arquivo_path?: string | null
          company_id: string
          created_at?: string
          created_by?: string | null
          data?: Json | null
          data_fim?: string | null
          data_fim_experiencia?: string | null
          data_inicio: string
          delete_reason?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          employee_id: string
          experiencia_dias?: number | null
          id?: string
          is_deleted?: boolean
          jornada_horas?: number | null
          modelo?: string | null
          numero?: string | null
          observacoes?: string | null
          salario?: number | null
          status?: string
          tipo?: string
          updated_at?: string
        }
        Update: {
          arquivo_path?: string | null
          company_id?: string
          created_at?: string
          created_by?: string | null
          data?: Json | null
          data_fim?: string | null
          data_fim_experiencia?: string | null
          data_inicio?: string
          delete_reason?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          employee_id?: string
          experiencia_dias?: number | null
          id?: string
          is_deleted?: boolean
          jornada_horas?: number | null
          modelo?: string | null
          numero?: string | null
          observacoes?: string | null
          salario?: number | null
          status?: string
          tipo?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "hrdp_contracts_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "hrdp_employees"
            referencedColumns: ["id"]
          },
        ]
      }
      hrdp_employee_documents: {
        Row: {
          admission_id: string | null
          company_id: string
          created_at: string
          data_emissao: string | null
          data_vencimento: string | null
          delete_reason: string | null
          deleted_at: string | null
          deleted_by: string | null
          descricao: string | null
          employee_id: string | null
          id: string
          is_deleted: boolean
          mime_type: string | null
          sensivel: boolean
          storage_path: string
          tamanho_bytes: number | null
          tipo: string
          titulo: string
          updated_at: string
          uploaded_by: string | null
        }
        Insert: {
          admission_id?: string | null
          company_id: string
          created_at?: string
          data_emissao?: string | null
          data_vencimento?: string | null
          delete_reason?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          descricao?: string | null
          employee_id?: string | null
          id?: string
          is_deleted?: boolean
          mime_type?: string | null
          sensivel?: boolean
          storage_path: string
          tamanho_bytes?: number | null
          tipo: string
          titulo: string
          updated_at?: string
          uploaded_by?: string | null
        }
        Update: {
          admission_id?: string | null
          company_id?: string
          created_at?: string
          data_emissao?: string | null
          data_vencimento?: string | null
          delete_reason?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          descricao?: string | null
          employee_id?: string | null
          id?: string
          is_deleted?: boolean
          mime_type?: string | null
          sensivel?: boolean
          storage_path?: string
          tamanho_bytes?: number | null
          tipo?: string
          titulo?: string
          updated_at?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "hrdp_employee_documents_admission_id_fkey"
            columns: ["admission_id"]
            isOneToOne: false
            referencedRelation: "hrdp_admissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hrdp_employee_documents_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "hrdp_employees"
            referencedColumns: ["id"]
          },
        ]
      }
      hrdp_employee_requests: {
        Row: {
          anexo_path: string | null
          aprovado_em: string | null
          aprovador_id: string | null
          comentarios: Json | null
          company_id: string
          concluido_em: string | null
          created_at: string
          data: Json | null
          data_abertura: string
          delete_reason: string | null
          deleted_at: string | null
          deleted_by: string | null
          descricao: string | null
          employee_id: string
          id: string
          is_deleted: boolean
          prazo_sla: string | null
          prioridade: string
          resposta: string | null
          sla_dias: number | null
          status: string
          tipo: string
          titulo: string
          updated_at: string
        }
        Insert: {
          anexo_path?: string | null
          aprovado_em?: string | null
          aprovador_id?: string | null
          comentarios?: Json | null
          company_id: string
          concluido_em?: string | null
          created_at?: string
          data?: Json | null
          data_abertura?: string
          delete_reason?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          descricao?: string | null
          employee_id: string
          id?: string
          is_deleted?: boolean
          prazo_sla?: string | null
          prioridade?: string
          resposta?: string | null
          sla_dias?: number | null
          status?: string
          tipo: string
          titulo: string
          updated_at?: string
        }
        Update: {
          anexo_path?: string | null
          aprovado_em?: string | null
          aprovador_id?: string | null
          comentarios?: Json | null
          company_id?: string
          concluido_em?: string | null
          created_at?: string
          data?: Json | null
          data_abertura?: string
          delete_reason?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          descricao?: string | null
          employee_id?: string
          id?: string
          is_deleted?: boolean
          prazo_sla?: string | null
          prioridade?: string
          resposta?: string | null
          sla_dias?: number | null
          status?: string
          tipo?: string
          titulo?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "hrdp_employee_requests_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "hrdp_employees"
            referencedColumns: ["id"]
          },
        ]
      }
      hrdp_employees: {
        Row: {
          cargo: string | null
          company_id: string
          cpf: string | null
          created_at: string
          created_by: string | null
          dados_bancarios: Json | null
          data: Json
          data_admissao: string | null
          data_desligamento: string | null
          delete_reason: string | null
          deleted_at: string | null
          deleted_by: string | null
          email: string | null
          endereco: Json | null
          gestor_id: string | null
          id: string
          is_deleted: boolean
          nome: string
          observacoes: string | null
          rg: string | null
          salario: number | null
          setor: string | null
          status: string
          telefone: string | null
          updated_at: string
          user_id: string | null
          vinculo: string | null
        }
        Insert: {
          cargo?: string | null
          company_id: string
          cpf?: string | null
          created_at?: string
          created_by?: string | null
          dados_bancarios?: Json | null
          data?: Json
          data_admissao?: string | null
          data_desligamento?: string | null
          delete_reason?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          email?: string | null
          endereco?: Json | null
          gestor_id?: string | null
          id?: string
          is_deleted?: boolean
          nome: string
          observacoes?: string | null
          rg?: string | null
          salario?: number | null
          setor?: string | null
          status?: string
          telefone?: string | null
          updated_at?: string
          user_id?: string | null
          vinculo?: string | null
        }
        Update: {
          cargo?: string | null
          company_id?: string
          cpf?: string | null
          created_at?: string
          created_by?: string | null
          dados_bancarios?: Json | null
          data?: Json
          data_admissao?: string | null
          data_desligamento?: string | null
          delete_reason?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          email?: string | null
          endereco?: Json | null
          gestor_id?: string | null
          id?: string
          is_deleted?: boolean
          nome?: string
          observacoes?: string | null
          rg?: string | null
          salario?: number | null
          setor?: string | null
          status?: string
          telefone?: string | null
          updated_at?: string
          user_id?: string | null
          vinculo?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "hrdp_employees_gestor_id_fkey"
            columns: ["gestor_id"]
            isOneToOne: false
            referencedRelation: "hrdp_employees"
            referencedColumns: ["id"]
          },
        ]
      }
      hrdp_interview_questions: {
        Row: {
          area: string | null
          ativo: boolean
          categoria: string | null
          company_id: string
          created_at: string
          id: string
          ordem: number
          pergunta: string
          peso: number
          updated_at: string
          vaga: string | null
        }
        Insert: {
          area?: string | null
          ativo?: boolean
          categoria?: string | null
          company_id: string
          created_at?: string
          id?: string
          ordem?: number
          pergunta: string
          peso?: number
          updated_at?: string
          vaga?: string | null
        }
        Update: {
          area?: string | null
          ativo?: boolean
          categoria?: string | null
          company_id?: string
          created_at?: string
          id?: string
          ordem?: number
          pergunta?: string
          peso?: number
          updated_at?: string
          vaga?: string | null
        }
        Relationships: []
      }
      hrdp_interviews: {
        Row: {
          candidate_id: string
          company_id: string
          created_at: string
          data_agendada: string | null
          entrevistador_id: string | null
          entrevistador_nome: string | null
          etapa: string | null
          id: string
          parecer: string | null
          recomendacao: string | null
          respostas: Json | null
          score_final: number | null
          status: string
          updated_at: string
        }
        Insert: {
          candidate_id: string
          company_id: string
          created_at?: string
          data_agendada?: string | null
          entrevistador_id?: string | null
          entrevistador_nome?: string | null
          etapa?: string | null
          id?: string
          parecer?: string | null
          recomendacao?: string | null
          respostas?: Json | null
          score_final?: number | null
          status?: string
          updated_at?: string
        }
        Update: {
          candidate_id?: string
          company_id?: string
          created_at?: string
          data_agendada?: string | null
          entrevistador_id?: string | null
          entrevistador_nome?: string | null
          etapa?: string | null
          id?: string
          parecer?: string | null
          recomendacao?: string | null
          respostas?: Json | null
          score_final?: number | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "hrdp_interviews_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "hrdp_candidates"
            referencedColumns: ["id"]
          },
        ]
      }
      hrdp_module_permissions: {
        Row: {
          can_approve: boolean
          can_create: boolean
          can_delete: boolean
          can_edit: boolean
          can_export: boolean
          can_import: boolean
          can_manage_settings: boolean
          can_view: boolean
          can_view_sensitive: boolean
          company_id: string
          created_at: string
          id: string
          submodule_key: string
          updated_at: string
          user_id: string
        }
        Insert: {
          can_approve?: boolean
          can_create?: boolean
          can_delete?: boolean
          can_edit?: boolean
          can_export?: boolean
          can_import?: boolean
          can_manage_settings?: boolean
          can_view?: boolean
          can_view_sensitive?: boolean
          company_id: string
          created_at?: string
          id?: string
          submodule_key: string
          updated_at?: string
          user_id: string
        }
        Update: {
          can_approve?: boolean
          can_create?: boolean
          can_delete?: boolean
          can_edit?: boolean
          can_export?: boolean
          can_import?: boolean
          can_manage_settings?: boolean
          can_view?: boolean
          can_view_sensitive?: boolean
          company_id?: string
          created_at?: string
          id?: string
          submodule_key?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      hrdp_module_settings: {
        Row: {
          company_id: string
          config: Json
          created_at: string
          id: string
          jornada_padrao_horas: number
          regra_ferias: Json
          regra_he: Json
          submodulos_ativos: string[]
          updated_at: string
        }
        Insert: {
          company_id: string
          config?: Json
          created_at?: string
          id?: string
          jornada_padrao_horas?: number
          regra_ferias?: Json
          regra_he?: Json
          submodulos_ativos?: string[]
          updated_at?: string
        }
        Update: {
          company_id?: string
          config?: Json
          created_at?: string
          id?: string
          jornada_padrao_horas?: number
          regra_ferias?: Json
          regra_he?: Json
          submodulos_ativos?: string[]
          updated_at?: string
        }
        Relationships: []
      }
      hrdp_overtime_requests: {
        Row: {
          aprovado_em: string | null
          aprovador_id: string | null
          company_id: string
          created_at: string
          created_by: string | null
          data_ref: string
          destino: string
          employee_id: string
          hora_fim: string
          hora_inicio: string
          id: string
          motivo: string | null
          obs_aprovador: string | null
          status: string
          tipo: string
          total_horas: number | null
          updated_at: string
        }
        Insert: {
          aprovado_em?: string | null
          aprovador_id?: string | null
          company_id: string
          created_at?: string
          created_by?: string | null
          data_ref: string
          destino?: string
          employee_id: string
          hora_fim: string
          hora_inicio: string
          id?: string
          motivo?: string | null
          obs_aprovador?: string | null
          status?: string
          tipo?: string
          total_horas?: number | null
          updated_at?: string
        }
        Update: {
          aprovado_em?: string | null
          aprovador_id?: string | null
          company_id?: string
          created_at?: string
          created_by?: string | null
          data_ref?: string
          destino?: string
          employee_id?: string
          hora_fim?: string
          hora_inicio?: string
          id?: string
          motivo?: string | null
          obs_aprovador?: string | null
          status?: string
          tipo?: string
          total_horas?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "hrdp_overtime_requests_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "hrdp_employees"
            referencedColumns: ["id"]
          },
        ]
      }
      hrdp_payroll_closings: {
        Row: {
          company_id: string
          competencia: string
          created_at: string
          data: Json
          delete_reason: string | null
          deleted_at: string | null
          deleted_by: string | null
          fechado_em: string | null
          fechado_por: string | null
          id: string
          is_deleted: boolean
          observacoes: string | null
          qtd_colaboradores: number
          status: string
          total_descontos: number
          total_liquido: number
          total_proventos: number
          updated_at: string
        }
        Insert: {
          company_id: string
          competencia: string
          created_at?: string
          data?: Json
          delete_reason?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          fechado_em?: string | null
          fechado_por?: string | null
          id?: string
          is_deleted?: boolean
          observacoes?: string | null
          qtd_colaboradores?: number
          status?: string
          total_descontos?: number
          total_liquido?: number
          total_proventos?: number
          updated_at?: string
        }
        Update: {
          company_id?: string
          competencia?: string
          created_at?: string
          data?: Json
          delete_reason?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          fechado_em?: string | null
          fechado_por?: string | null
          id?: string
          is_deleted?: boolean
          observacoes?: string | null
          qtd_colaboradores?: number
          status?: string
          total_descontos?: number
          total_liquido?: number
          total_proventos?: number
          updated_at?: string
        }
        Relationships: []
      }
      hrdp_payslips: {
        Row: {
          closing_id: string | null
          company_id: string
          competencia: string
          created_at: string
          data: Json
          delete_reason: string | null
          deleted_at: string | null
          deleted_by: string | null
          descontos: number
          employee_id: string
          id: string
          is_deleted: boolean
          liquido: number
          observacoes: string | null
          pdf_path: string | null
          proventos: number
          publicado_em: string | null
          rubricas: Json
          salario_base: number
          status: string
          updated_at: string
        }
        Insert: {
          closing_id?: string | null
          company_id: string
          competencia: string
          created_at?: string
          data?: Json
          delete_reason?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          descontos?: number
          employee_id: string
          id?: string
          is_deleted?: boolean
          liquido?: number
          observacoes?: string | null
          pdf_path?: string | null
          proventos?: number
          publicado_em?: string | null
          rubricas?: Json
          salario_base?: number
          status?: string
          updated_at?: string
        }
        Update: {
          closing_id?: string | null
          company_id?: string
          competencia?: string
          created_at?: string
          data?: Json
          delete_reason?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          descontos?: number
          employee_id?: string
          id?: string
          is_deleted?: boolean
          liquido?: number
          observacoes?: string | null
          pdf_path?: string | null
          proventos?: number
          publicado_em?: string | null
          rubricas?: Json
          salario_base?: number
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "hrdp_payslips_closing_id_fkey"
            columns: ["closing_id"]
            isOneToOne: false
            referencedRelation: "hrdp_payroll_closings"
            referencedColumns: ["id"]
          },
        ]
      }
      hrdp_submodules_catalog: {
        Row: {
          area: string
          ativo: boolean
          created_at: string
          descricao: string | null
          id: string
          key: string
          nome: string
          ordem: number
          updated_at: string
        }
        Insert: {
          area: string
          ativo?: boolean
          created_at?: string
          descricao?: string | null
          id?: string
          key: string
          nome: string
          ordem?: number
          updated_at?: string
        }
        Update: {
          area?: string
          ativo?: boolean
          created_at?: string
          descricao?: string | null
          id?: string
          key?: string
          nome?: string
          ordem?: number
          updated_at?: string
        }
        Relationships: []
      }
      hrdp_time_bank: {
        Row: {
          company_id: string
          created_at: string
          created_by: string | null
          data_ref: string
          descricao: string | null
          employee_id: string
          horas: number
          id: string
          origem_he: string | null
          tipo: string
        }
        Insert: {
          company_id: string
          created_at?: string
          created_by?: string | null
          data_ref: string
          descricao?: string | null
          employee_id: string
          horas: number
          id?: string
          origem_he?: string | null
          tipo?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          created_by?: string | null
          data_ref?: string
          descricao?: string | null
          employee_id?: string
          horas?: number
          id?: string
          origem_he?: string | null
          tipo?: string
        }
        Relationships: [
          {
            foreignKeyName: "hrdp_time_bank_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "hrdp_employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hrdp_time_bank_origem_he_fkey"
            columns: ["origem_he"]
            isOneToOne: false
            referencedRelation: "hrdp_overtime_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      hrdp_time_entries: {
        Row: {
          ajuste_aprovado_em: string | null
          ajuste_aprovado_por: string | null
          ajuste_de: string | null
          company_id: string
          created_at: string
          created_by: string | null
          data_ref: string
          employee_id: string
          hora: string
          id: string
          justificativa: string | null
          latitude: number | null
          longitude: number | null
          origem: string | null
          tipo: string
        }
        Insert: {
          ajuste_aprovado_em?: string | null
          ajuste_aprovado_por?: string | null
          ajuste_de?: string | null
          company_id: string
          created_at?: string
          created_by?: string | null
          data_ref: string
          employee_id: string
          hora: string
          id?: string
          justificativa?: string | null
          latitude?: number | null
          longitude?: number | null
          origem?: string | null
          tipo: string
        }
        Update: {
          ajuste_aprovado_em?: string | null
          ajuste_aprovado_por?: string | null
          ajuste_de?: string | null
          company_id?: string
          created_at?: string
          created_by?: string | null
          data_ref?: string
          employee_id?: string
          hora?: string
          id?: string
          justificativa?: string | null
          latitude?: number | null
          longitude?: number | null
          origem?: string | null
          tipo?: string
        }
        Relationships: [
          {
            foreignKeyName: "hrdp_time_entries_ajuste_de_fkey"
            columns: ["ajuste_de"]
            isOneToOne: false
            referencedRelation: "hrdp_time_entries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hrdp_time_entries_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "hrdp_employees"
            referencedColumns: ["id"]
          },
        ]
      }
      hrdp_vacation_provisions: {
        Row: {
          company_id: string
          competencia: string
          created_at: string
          data: Json | null
          dias_direito: number | null
          dias_gozados: number | null
          employee_id: string
          id: string
          observacoes: string | null
          salario_base: number | null
          saldo_dias: number | null
          updated_at: string
          valor_adicional_um_terco: number | null
          valor_estimado: number | null
        }
        Insert: {
          company_id: string
          competencia: string
          created_at?: string
          data?: Json | null
          dias_direito?: number | null
          dias_gozados?: number | null
          employee_id: string
          id?: string
          observacoes?: string | null
          salario_base?: number | null
          saldo_dias?: number | null
          updated_at?: string
          valor_adicional_um_terco?: number | null
          valor_estimado?: number | null
        }
        Update: {
          company_id?: string
          competencia?: string
          created_at?: string
          data?: Json | null
          dias_direito?: number | null
          dias_gozados?: number | null
          employee_id?: string
          id?: string
          observacoes?: string | null
          salario_base?: number | null
          saldo_dias?: number | null
          updated_at?: string
          valor_adicional_um_terco?: number | null
          valor_estimado?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "hrdp_vacation_provisions_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "hrdp_employees"
            referencedColumns: ["id"]
          },
        ]
      }
      hrdp_vacations: {
        Row: {
          adiantamento_13: boolean | null
          aprovado_em: string | null
          aprovador_id: string | null
          company_id: string
          created_at: string
          data: Json | null
          data_fim: string | null
          data_inicio: string | null
          delete_reason: string | null
          deleted_at: string | null
          deleted_by: string | null
          dias_abono: number | null
          dias_programados: number | null
          employee_id: string
          id: string
          is_deleted: boolean
          observacoes: string | null
          periodo_aquisitivo_fim: string
          periodo_aquisitivo_inicio: string
          status: string
          updated_at: string
        }
        Insert: {
          adiantamento_13?: boolean | null
          aprovado_em?: string | null
          aprovador_id?: string | null
          company_id: string
          created_at?: string
          data?: Json | null
          data_fim?: string | null
          data_inicio?: string | null
          delete_reason?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          dias_abono?: number | null
          dias_programados?: number | null
          employee_id: string
          id?: string
          is_deleted?: boolean
          observacoes?: string | null
          periodo_aquisitivo_fim: string
          periodo_aquisitivo_inicio: string
          status?: string
          updated_at?: string
        }
        Update: {
          adiantamento_13?: boolean | null
          aprovado_em?: string | null
          aprovador_id?: string | null
          company_id?: string
          created_at?: string
          data?: Json | null
          data_fim?: string | null
          data_inicio?: string | null
          delete_reason?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          dias_abono?: number | null
          dias_programados?: number | null
          employee_id?: string
          id?: string
          is_deleted?: boolean
          observacoes?: string | null
          periodo_aquisitivo_fim?: string
          periodo_aquisitivo_inicio?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "hrdp_vacations_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "hrdp_employees"
            referencedColumns: ["id"]
          },
        ]
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
      ocs_impersonation_sessions: {
        Row: {
          company_id: string
          data_access_granted: boolean
          ended_at: string | null
          id: string
          ocs_user_id: string
          reason: string | null
          started_at: string
        }
        Insert: {
          company_id: string
          data_access_granted?: boolean
          ended_at?: string | null
          id?: string
          ocs_user_id: string
          reason?: string | null
          started_at?: string
        }
        Update: {
          company_id?: string
          data_access_granted?: boolean
          ended_at?: string | null
          id?: string
          ocs_user_id?: string
          reason?: string | null
          started_at?: string
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
      plan_billing_runs: {
        Row: {
          canal: string
          company_plan_id: string
          competencia: string
          enviado_em: string
          id: string
          payload: Json | null
          tipo: string
        }
        Insert: {
          canal?: string
          company_plan_id: string
          competencia: string
          enviado_em?: string
          id?: string
          payload?: Json | null
          tipo: string
        }
        Update: {
          canal?: string
          company_plan_id?: string
          competencia?: string
          enviado_em?: string
          id?: string
          payload?: Json | null
          tipo?: string
        }
        Relationships: [
          {
            foreignKeyName: "plan_billing_runs_company_plan_id_fkey"
            columns: ["company_plan_id"]
            isOneToOne: false
            referencedRelation: "company_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      plan_integrations_catalog: {
        Row: {
          ativo: boolean
          descricao: string | null
          key: string
          label: string
          ordem: number
          preco_mensal: number
        }
        Insert: {
          ativo?: boolean
          descricao?: string | null
          key: string
          label: string
          ordem?: number
          preco_mensal?: number
        }
        Update: {
          ativo?: boolean
          descricao?: string | null
          key?: string
          label?: string
          ordem?: number
          preco_mensal?: number
        }
        Relationships: []
      }
      plan_modules_catalog: {
        Row: {
          ativo: boolean
          grupo: string
          key: string
          label: string
          ordem: number
          rota: string | null
          sempre_obrigatorio: boolean
        }
        Insert: {
          ativo?: boolean
          grupo: string
          key: string
          label: string
          ordem?: number
          rota?: string | null
          sempre_obrigatorio?: boolean
        }
        Update: {
          ativo?: boolean
          grupo?: string
          key?: string
          label?: string
          ordem?: number
          rota?: string | null
          sempre_obrigatorio?: boolean
        }
        Relationships: []
      }
      plan_packages: {
        Row: {
          ativo: boolean
          created_at: string
          descricao: string | null
          id: string
          modules: string[]
          nome: string
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          descricao?: string | null
          id?: string
          modules?: string[]
          nome: string
        }
        Update: {
          ativo?: boolean
          created_at?: string
          descricao?: string | null
          id?: string
          modules?: string[]
          nome?: string
        }
        Relationships: []
      }
      plan_pricing_config: {
        Row: {
          id: boolean
          precos_por_integracao: Json
          precos_por_modulo: Json
          updated_at: string
          updated_by: string | null
          valor_por_usuario: number
        }
        Insert: {
          id?: boolean
          precos_por_integracao?: Json
          precos_por_modulo?: Json
          updated_at?: string
          updated_by?: string | null
          valor_por_usuario?: number
        }
        Update: {
          id?: boolean
          precos_por_integracao?: Json
          precos_por_modulo?: Json
          updated_at?: string
          updated_by?: string | null
          valor_por_usuario?: number
        }
        Relationships: []
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
      theme_audit_logs: {
        Row: {
          action_type: string
          after_data: Json | null
          before_data: Json | null
          company_id: string
          created_at: string
          id: string
          user_id: string | null
        }
        Insert: {
          action_type: string
          after_data?: Json | null
          before_data?: Json | null
          company_id: string
          created_at?: string
          id?: string
          user_id?: string | null
        }
        Update: {
          action_type?: string
          after_data?: Json | null
          before_data?: Json | null
          company_id?: string
          created_at?: string
          id?: string
          user_id?: string | null
        }
        Relationships: []
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
      apply_calculated_value: { Args: { _company_id: string }; Returns: number }
      calc_company_plan_value: {
        Args: { _company_id: string }
        Returns: number
      }
      crea_can: {
        Args: { _action: string; _company: string; _uid: string }
        Returns: boolean
      }
      crea_log_audit: {
        Args: {
          _action: string
          _company: string
          _entidade_id?: string
          _entidade_tipo?: string
          _modulo: string
          _nome_entidade?: string
          _observacoes?: string
          _payload?: Json
        }
        Returns: undefined
      }
      crea_reveal_credential: {
        Args: { _id: string; _reason: string }
        Returns: Json
      }
      crea_save_credential: {
        Args: {
          _company: string
          _empresa_crea: string
          _id: string
          _login: string
          _obs: string
          _portal: string
          _rt: string
          _senha: string
          _status: string
          _uf: string
        }
        Returns: Json
      }
      crea_set_master_key: { Args: { _pwd: string }; Returns: Json }
      crea_soft_delete: {
        Args: { _id: string; _reason: string; _table: string }
        Returns: Json
      }
      current_user_modules: { Args: { _uid: string }; Returns: string[] }
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
      eng_set_delete_password: {
        Args: { _new_password: string }
        Returns: Json
      }
      eng_soft_delete: {
        Args: {
          _id: string
          _password: string
          _reason: string
          _table: string
        }
        Returns: Json
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
      hrdp_can: {
        Args: {
          _action: string
          _company: string
          _submodule: string
          _uid: string
        }
        Returns: boolean
      }
      hrdp_is_manager_of: {
        Args: { _employee_id: string; _uid: string }
        Returns: boolean
      }
      hrdp_is_self_doc: {
        Args: { _employee_id: string; _uid: string }
        Returns: boolean
      }
      is_company_admin: {
        Args: { _company: string; _uid: string }
        Returns: boolean
      }
      is_financeiro_ocs: { Args: { _uid: string }; Returns: boolean }
      user_company: { Args: { _uid: string }; Returns: string }
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
        | "financeiro_ocs"
        | "company_admin"
        | "rh_admin"
        | "dp_admin"
        | "gestor_area"
        | "colaborador"
        | "auditor_rh"
        | "crea_admin"
        | "crea_analista"
        | "crea_responsavel_tecnico"
        | "crea_auditor"
        | "crea_visualizador"
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
        "financeiro_ocs",
        "company_admin",
        "rh_admin",
        "dp_admin",
        "gestor_area",
        "colaborador",
        "auditor_rh",
        "crea_admin",
        "crea_analista",
        "crea_responsavel_tecnico",
        "crea_auditor",
        "crea_visualizador",
      ],
    },
  },
} as const
