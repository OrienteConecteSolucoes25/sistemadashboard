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
      acl_audit_logs: {
        Row: {
          action: string
          actor_user_id: string | null
          after: Json | null
          before: Json | null
          company_id: string | null
          created_at: string
          id: string
          permission_key: string | null
          reason: string | null
          target_user_id: string | null
        }
        Insert: {
          action: string
          actor_user_id?: string | null
          after?: Json | null
          before?: Json | null
          company_id?: string | null
          created_at?: string
          id?: string
          permission_key?: string | null
          reason?: string | null
          target_user_id?: string | null
        }
        Update: {
          action?: string
          actor_user_id?: string | null
          after?: Json | null
          before?: Json | null
          company_id?: string | null
          created_at?: string
          id?: string
          permission_key?: string | null
          reason?: string | null
          target_user_id?: string | null
        }
        Relationships: []
      }
      acl_internal_staff: {
        Row: {
          added_at: string
          added_by: string | null
          notes: string | null
          user_id: string
        }
        Insert: {
          added_at?: string
          added_by?: string | null
          notes?: string | null
          user_id: string
        }
        Update: {
          added_at?: string
          added_by?: string | null
          notes?: string | null
          user_id?: string
        }
        Relationships: []
      }
      acl_permissions_catalog: {
        Row: {
          action: string
          ativo: boolean
          created_at: string
          description: string | null
          key: string
          label: string
          module: string
          ordem: number
          resource: string
        }
        Insert: {
          action: string
          ativo?: boolean
          created_at?: string
          description?: string | null
          key: string
          label: string
          module: string
          ordem?: number
          resource: string
        }
        Update: {
          action?: string
          ativo?: boolean
          created_at?: string
          description?: string | null
          key?: string
          label?: string
          module?: string
          ordem?: number
          resource?: string
        }
        Relationships: []
      }
      acl_user_permissions: {
        Row: {
          company_id: string | null
          granted_at: string
          granted_by: string | null
          id: string
          permission_key: string
          reason: string | null
          user_id: string
        }
        Insert: {
          company_id?: string | null
          granted_at?: string
          granted_by?: string | null
          id?: string
          permission_key: string
          reason?: string | null
          user_id: string
        }
        Update: {
          company_id?: string | null
          granted_at?: string
          granted_by?: string | null
          id?: string
          permission_key?: string
          reason?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "acl_user_permissions_permission_key_fkey"
            columns: ["permission_key"]
            isOneToOne: false
            referencedRelation: "acl_permissions_catalog"
            referencedColumns: ["key"]
          },
        ]
      }
      ai_governance_logs: {
        Row: {
          action_executed: string | null
          agent_name: string
          approval_status: string | null
          approved_by: string | null
          classification:
            | Database["public"]["Enums"]["ai_action_classification"]
            | null
          company_id: string | null
          created_at: string | null
          id: string
          impact_description: string | null
          is_automated: boolean | null
          module: string
          prompt_text: string | null
          requires_approval: boolean | null
          response_text: string | null
          user_id: string
        }
        Insert: {
          action_executed?: string | null
          agent_name: string
          approval_status?: string | null
          approved_by?: string | null
          classification?:
            | Database["public"]["Enums"]["ai_action_classification"]
            | null
          company_id?: string | null
          created_at?: string | null
          id?: string
          impact_description?: string | null
          is_automated?: boolean | null
          module: string
          prompt_text?: string | null
          requires_approval?: boolean | null
          response_text?: string | null
          user_id: string
        }
        Update: {
          action_executed?: string | null
          agent_name?: string
          approval_status?: string | null
          approved_by?: string | null
          classification?:
            | Database["public"]["Enums"]["ai_action_classification"]
            | null
          company_id?: string | null
          created_at?: string | null
          id?: string
          impact_description?: string | null
          is_automated?: boolean | null
          module?: string
          prompt_text?: string | null
          requires_approval?: boolean | null
          response_text?: string | null
          user_id?: string
        }
        Relationships: []
      }
      comm_admin_config: {
        Row: {
          key: string
          updated_at: string | null
          updated_by: string | null
          value: string | null
        }
        Insert: {
          key: string
          updated_at?: string | null
          updated_by?: string | null
          value?: string | null
        }
        Update: {
          key?: string
          updated_at?: string | null
          updated_by?: string | null
          value?: string | null
        }
        Relationships: []
      }
      comm_ai_insights: {
        Row: {
          client_brand_id: string | null
          company_id: string
          created_at: string
          created_by: string | null
          id: string
          metrica_base: Json | null
          modelo: string | null
          periodo_ate: string | null
          periodo_de: string | null
          pontos_fortes: Json | null
          pontos_fracos: Json | null
          recomendacoes: Json | null
          ref_id: string | null
          resumo: string
          scope: string
        }
        Insert: {
          client_brand_id?: string | null
          company_id: string
          created_at?: string
          created_by?: string | null
          id?: string
          metrica_base?: Json | null
          modelo?: string | null
          periodo_ate?: string | null
          periodo_de?: string | null
          pontos_fortes?: Json | null
          pontos_fracos?: Json | null
          recomendacoes?: Json | null
          ref_id?: string | null
          resumo: string
          scope?: string
        }
        Update: {
          client_brand_id?: string | null
          company_id?: string
          created_at?: string
          created_by?: string | null
          id?: string
          metrica_base?: Json | null
          modelo?: string | null
          periodo_ate?: string | null
          periodo_de?: string | null
          pontos_fortes?: Json | null
          pontos_fracos?: Json | null
          recomendacoes?: Json | null
          ref_id?: string | null
          resumo?: string
          scope?: string
        }
        Relationships: []
      }
      comm_ai_quotas: {
        Row: {
          blocklist: string[] | null
          company_id: string
          daily_image_limit: number
          monthly_image_limit: number
          monthly_text_limit: number
          updated_at: string | null
        }
        Insert: {
          blocklist?: string[] | null
          company_id: string
          daily_image_limit?: number
          monthly_image_limit?: number
          monthly_text_limit?: number
          updated_at?: string | null
        }
        Update: {
          blocklist?: string[] | null
          company_id?: string
          daily_image_limit?: number
          monthly_image_limit?: number
          monthly_text_limit?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      comm_ai_usage: {
        Row: {
          company_id: string
          cost_credits: number | null
          created_at: string
          id: string
          kind: string
          model: string | null
          provider: string | null
          tokens_in: number | null
          tokens_out: number | null
          user_id: string | null
        }
        Insert: {
          company_id: string
          cost_credits?: number | null
          created_at?: string
          id?: string
          kind: string
          model?: string | null
          provider?: string | null
          tokens_in?: number | null
          tokens_out?: number | null
          user_id?: string | null
        }
        Update: {
          company_id?: string
          cost_credits?: number | null
          created_at?: string
          id?: string
          kind?: string
          model?: string | null
          provider?: string | null
          tokens_in?: number | null
          tokens_out?: number | null
          user_id?: string | null
        }
        Relationships: []
      }
      comm_approvals: {
        Row: {
          aprovado_em: string | null
          aprovado_por: string | null
          comentario: string | null
          company_id: string
          created_at: string | null
          created_by: string | null
          entidade_id: string
          entidade_tipo: string
          id: string
          motivo_reprovacao: string | null
          snapshot: Json | null
          status: string
          updated_at: string | null
          versao: number | null
        }
        Insert: {
          aprovado_em?: string | null
          aprovado_por?: string | null
          comentario?: string | null
          company_id: string
          created_at?: string | null
          created_by?: string | null
          entidade_id: string
          entidade_tipo: string
          id?: string
          motivo_reprovacao?: string | null
          snapshot?: Json | null
          status?: string
          updated_at?: string | null
          versao?: number | null
        }
        Update: {
          aprovado_em?: string | null
          aprovado_por?: string | null
          comentario?: string | null
          company_id?: string
          created_at?: string | null
          created_by?: string | null
          entidade_id?: string
          entidade_tipo?: string
          id?: string
          motivo_reprovacao?: string | null
          snapshot?: Json | null
          status?: string
          updated_at?: string | null
          versao?: number | null
        }
        Relationships: []
      }
      comm_audit_logs: {
        Row: {
          action: string
          company_id: string | null
          created_at: string
          entidade_id: string | null
          entidade_tipo: string | null
          id: string
          modulo: string | null
          nome_entidade: string | null
          observacoes: string | null
          payload: Json | null
          user_id: string | null
        }
        Insert: {
          action: string
          company_id?: string | null
          created_at?: string
          entidade_id?: string | null
          entidade_tipo?: string | null
          id?: string
          modulo?: string | null
          nome_entidade?: string | null
          observacoes?: string | null
          payload?: Json | null
          user_id?: string | null
        }
        Update: {
          action?: string
          company_id?: string | null
          created_at?: string
          entidade_id?: string | null
          entidade_tipo?: string | null
          id?: string
          modulo?: string | null
          nome_entidade?: string | null
          observacoes?: string | null
          payload?: Json | null
          user_id?: string | null
        }
        Relationships: []
      }
      comm_brand_kits: {
        Row: {
          company_id: string
          cores_principais: Json | null
          cores_secundarias: Json | null
          created_at: string | null
          created_by: string | null
          cta_padrao: string | null
          delete_reason: string | null
          deleted_at: string | null
          deleted_by: string | null
          descricao: string | null
          diferenciais: string | null
          estilo_visual: string | null
          fontes: Json | null
          id: string
          is_default: boolean | null
          is_deleted: boolean | null
          links: Json | null
          logo_url: string | null
          missao: string | null
          nome: string
          observacoes: string | null
          palavras_permitidas: string[] | null
          palavras_proibidas: string[] | null
          persona: string | null
          proposta_valor: string | null
          publico_alvo: string | null
          redes_sociais: Json | null
          segmento: string | null
          slogan: string | null
          tipo_linguagem: string | null
          tom_de_voz: string | null
          updated_at: string | null
          updated_by: string | null
          valores: string | null
          visao: string | null
          website: string | null
        }
        Insert: {
          company_id: string
          cores_principais?: Json | null
          cores_secundarias?: Json | null
          created_at?: string | null
          created_by?: string | null
          cta_padrao?: string | null
          delete_reason?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          descricao?: string | null
          diferenciais?: string | null
          estilo_visual?: string | null
          fontes?: Json | null
          id?: string
          is_default?: boolean | null
          is_deleted?: boolean | null
          links?: Json | null
          logo_url?: string | null
          missao?: string | null
          nome: string
          observacoes?: string | null
          palavras_permitidas?: string[] | null
          palavras_proibidas?: string[] | null
          persona?: string | null
          proposta_valor?: string | null
          publico_alvo?: string | null
          redes_sociais?: Json | null
          segmento?: string | null
          slogan?: string | null
          tipo_linguagem?: string | null
          tom_de_voz?: string | null
          updated_at?: string | null
          updated_by?: string | null
          valores?: string | null
          visao?: string | null
          website?: string | null
        }
        Update: {
          company_id?: string
          cores_principais?: Json | null
          cores_secundarias?: Json | null
          created_at?: string | null
          created_by?: string | null
          cta_padrao?: string | null
          delete_reason?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          descricao?: string | null
          diferenciais?: string | null
          estilo_visual?: string | null
          fontes?: Json | null
          id?: string
          is_default?: boolean | null
          is_deleted?: boolean | null
          links?: Json | null
          logo_url?: string | null
          missao?: string | null
          nome?: string
          observacoes?: string | null
          palavras_permitidas?: string[] | null
          palavras_proibidas?: string[] | null
          persona?: string | null
          proposta_valor?: string | null
          publico_alvo?: string | null
          redes_sociais?: Json | null
          segmento?: string | null
          slogan?: string | null
          tipo_linguagem?: string | null
          tom_de_voz?: string | null
          updated_at?: string | null
          updated_by?: string | null
          valores?: string | null
          visao?: string | null
          website?: string | null
        }
        Relationships: []
      }
      comm_campaigns: {
        Row: {
          brand_kit_id: string | null
          canais: string[] | null
          company_id: string
          conceito: string | null
          created_at: string | null
          created_by: string | null
          cta: string | null
          data_fim: string | null
          data_inicio: string | null
          delete_reason: string | null
          deleted_at: string | null
          deleted_by: string | null
          id: string
          is_deleted: boolean | null
          metricas_esperadas: Json | null
          nome: string
          objetivo: string | null
          orcamento: number | null
          pecas: Json | null
          produto: string | null
          promessa: string | null
          publico: string | null
          responsavel_id: string | null
          resultados: Json | null
          status: string | null
          tipo: string | null
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          brand_kit_id?: string | null
          canais?: string[] | null
          company_id: string
          conceito?: string | null
          created_at?: string | null
          created_by?: string | null
          cta?: string | null
          data_fim?: string | null
          data_inicio?: string | null
          delete_reason?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          id?: string
          is_deleted?: boolean | null
          metricas_esperadas?: Json | null
          nome: string
          objetivo?: string | null
          orcamento?: number | null
          pecas?: Json | null
          produto?: string | null
          promessa?: string | null
          publico?: string | null
          responsavel_id?: string | null
          resultados?: Json | null
          status?: string | null
          tipo?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          brand_kit_id?: string | null
          canais?: string[] | null
          company_id?: string
          conceito?: string | null
          created_at?: string | null
          created_by?: string | null
          cta?: string | null
          data_fim?: string | null
          data_inicio?: string | null
          delete_reason?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          id?: string
          is_deleted?: boolean | null
          metricas_esperadas?: Json | null
          nome?: string
          objetivo?: string | null
          orcamento?: number | null
          pecas?: Json | null
          produto?: string | null
          promessa?: string | null
          publico?: string | null
          responsavel_id?: string | null
          resultados?: Json | null
          status?: string | null
          tipo?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "comm_campaigns_brand_kit_id_fkey"
            columns: ["brand_kit_id"]
            isOneToOne: false
            referencedRelation: "comm_brand_kits"
            referencedColumns: ["id"]
          },
        ]
      }
      comm_canva_designs: {
        Row: {
          approval_status: string | null
          brand_kit_id: string | null
          briefing_id: string | null
          briefing_tipo: string | null
          canva_design_id: string | null
          canva_url: string | null
          company_id: string
          created_at: string | null
          created_by: string | null
          delete_reason: string | null
          deleted_at: string | null
          deleted_by: string | null
          exported_file_path: string | null
          exported_url: string | null
          formato: string | null
          id: string
          is_deleted: boolean | null
          linked_calendar_id: string | null
          linked_post_id: string | null
          prompt_briefing: string | null
          status: string | null
          titulo: string | null
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          approval_status?: string | null
          brand_kit_id?: string | null
          briefing_id?: string | null
          briefing_tipo?: string | null
          canva_design_id?: string | null
          canva_url?: string | null
          company_id: string
          created_at?: string | null
          created_by?: string | null
          delete_reason?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          exported_file_path?: string | null
          exported_url?: string | null
          formato?: string | null
          id?: string
          is_deleted?: boolean | null
          linked_calendar_id?: string | null
          linked_post_id?: string | null
          prompt_briefing?: string | null
          status?: string | null
          titulo?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          approval_status?: string | null
          brand_kit_id?: string | null
          briefing_id?: string | null
          briefing_tipo?: string | null
          canva_design_id?: string | null
          canva_url?: string | null
          company_id?: string
          created_at?: string | null
          created_by?: string | null
          delete_reason?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          exported_file_path?: string | null
          exported_url?: string | null
          formato?: string | null
          id?: string
          is_deleted?: boolean | null
          linked_calendar_id?: string | null
          linked_post_id?: string | null
          prompt_briefing?: string | null
          status?: string | null
          titulo?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "comm_canva_designs_brand_kit_id_fkey"
            columns: ["brand_kit_id"]
            isOneToOne: false
            referencedRelation: "comm_brand_kits"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comm_canva_designs_linked_calendar_id_fkey"
            columns: ["linked_calendar_id"]
            isOneToOne: false
            referencedRelation: "comm_editorial_calendar"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comm_canva_designs_linked_post_id_fkey"
            columns: ["linked_post_id"]
            isOneToOne: false
            referencedRelation: "comm_content_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      comm_carousel_slides: {
        Row: {
          carousel_id: string
          created_at: string | null
          design_sugerido: string | null
          id: string
          ordem: number
          texto: string | null
          titulo: string | null
        }
        Insert: {
          carousel_id: string
          created_at?: string | null
          design_sugerido?: string | null
          id?: string
          ordem?: number
          texto?: string | null
          titulo?: string | null
        }
        Update: {
          carousel_id?: string
          created_at?: string | null
          design_sugerido?: string | null
          id?: string
          ordem?: number
          texto?: string | null
          titulo?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "comm_carousel_slides_carousel_id_fkey"
            columns: ["carousel_id"]
            isOneToOne: false
            referencedRelation: "comm_carousels"
            referencedColumns: ["id"]
          },
        ]
      }
      comm_carousels: {
        Row: {
          ai_generated: boolean | null
          brand_kit_id: string | null
          canal: string | null
          company_id: string
          created_at: string | null
          created_by: string | null
          cta: string | null
          delete_reason: string | null
          deleted_at: string | null
          deleted_by: string | null
          hashtags: string[] | null
          id: string
          is_deleted: boolean | null
          legenda: string | null
          objetivo: string | null
          publico: string | null
          status: string | null
          tema: string | null
          titulo: string | null
          tom_de_voz: string | null
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          ai_generated?: boolean | null
          brand_kit_id?: string | null
          canal?: string | null
          company_id: string
          created_at?: string | null
          created_by?: string | null
          cta?: string | null
          delete_reason?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          hashtags?: string[] | null
          id?: string
          is_deleted?: boolean | null
          legenda?: string | null
          objetivo?: string | null
          publico?: string | null
          status?: string | null
          tema?: string | null
          titulo?: string | null
          tom_de_voz?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          ai_generated?: boolean | null
          brand_kit_id?: string | null
          canal?: string | null
          company_id?: string
          created_at?: string | null
          created_by?: string | null
          cta?: string | null
          delete_reason?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          hashtags?: string[] | null
          id?: string
          is_deleted?: boolean | null
          legenda?: string | null
          objetivo?: string | null
          publico?: string | null
          status?: string | null
          tema?: string | null
          titulo?: string | null
          tom_de_voz?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "comm_carousels_brand_kit_id_fkey"
            columns: ["brand_kit_id"]
            isOneToOne: false
            referencedRelation: "comm_brand_kits"
            referencedColumns: ["id"]
          },
        ]
      }
      comm_content_posts: {
        Row: {
          ai_generated: boolean | null
          ai_model: string | null
          ai_prompt: string | null
          brand_kit_id: string | null
          briefing_visual: string | null
          campaign_id: string | null
          canal: string | null
          company_id: string
          created_at: string | null
          created_by: string | null
          cta: string | null
          data_planejada: string | null
          delete_reason: string | null
          deleted_at: string | null
          deleted_by: string | null
          descricao_alternativa: string | null
          formato: string | null
          hashtags: string[] | null
          id: string
          is_deleted: boolean | null
          legenda: string | null
          objetivo: string | null
          observacoes: string | null
          palavras_chave: string[] | null
          produto_relacionado: string | null
          prompt_visual: string | null
          publico: string | null
          responsavel_id: string | null
          roteiro: string | null
          status: string
          tema: string | null
          texto_card: string | null
          titulo: string | null
          tom_de_voz: string | null
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          ai_generated?: boolean | null
          ai_model?: string | null
          ai_prompt?: string | null
          brand_kit_id?: string | null
          briefing_visual?: string | null
          campaign_id?: string | null
          canal?: string | null
          company_id: string
          created_at?: string | null
          created_by?: string | null
          cta?: string | null
          data_planejada?: string | null
          delete_reason?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          descricao_alternativa?: string | null
          formato?: string | null
          hashtags?: string[] | null
          id?: string
          is_deleted?: boolean | null
          legenda?: string | null
          objetivo?: string | null
          observacoes?: string | null
          palavras_chave?: string[] | null
          produto_relacionado?: string | null
          prompt_visual?: string | null
          publico?: string | null
          responsavel_id?: string | null
          roteiro?: string | null
          status?: string
          tema?: string | null
          texto_card?: string | null
          titulo?: string | null
          tom_de_voz?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          ai_generated?: boolean | null
          ai_model?: string | null
          ai_prompt?: string | null
          brand_kit_id?: string | null
          briefing_visual?: string | null
          campaign_id?: string | null
          canal?: string | null
          company_id?: string
          created_at?: string | null
          created_by?: string | null
          cta?: string | null
          data_planejada?: string | null
          delete_reason?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          descricao_alternativa?: string | null
          formato?: string | null
          hashtags?: string[] | null
          id?: string
          is_deleted?: boolean | null
          legenda?: string | null
          objetivo?: string | null
          observacoes?: string | null
          palavras_chave?: string[] | null
          produto_relacionado?: string | null
          prompt_visual?: string | null
          publico?: string | null
          responsavel_id?: string | null
          roteiro?: string | null
          status?: string
          tema?: string | null
          texto_card?: string | null
          titulo?: string | null
          tom_de_voz?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "comm_content_posts_brand_kit_id_fkey"
            columns: ["brand_kit_id"]
            isOneToOne: false
            referencedRelation: "comm_brand_kits"
            referencedColumns: ["id"]
          },
        ]
      }
      comm_content_variants: {
        Row: {
          conteudo: string | null
          created_at: string | null
          id: string
          ordem: number | null
          post_id: string
          tipo: string
        }
        Insert: {
          conteudo?: string | null
          created_at?: string | null
          id?: string
          ordem?: number | null
          post_id: string
          tipo: string
        }
        Update: {
          conteudo?: string | null
          created_at?: string | null
          id?: string
          ordem?: number | null
          post_id?: string
          tipo?: string
        }
        Relationships: [
          {
            foreignKeyName: "comm_content_variants_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "comm_content_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      comm_design_templates: {
        Row: {
          altura: number
          categoria: string | null
          company_id: string | null
          created_at: string | null
          delete_reason: string | null
          deleted_at: string | null
          deleted_by: string | null
          formato: string
          id: string
          is_deleted: boolean | null
          is_global: boolean | null
          largura: number
          nome: string
          schema: Json
          thumbnail_url: string | null
          updated_at: string | null
        }
        Insert: {
          altura: number
          categoria?: string | null
          company_id?: string | null
          created_at?: string | null
          delete_reason?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          formato: string
          id?: string
          is_deleted?: boolean | null
          is_global?: boolean | null
          largura: number
          nome: string
          schema?: Json
          thumbnail_url?: string | null
          updated_at?: string | null
        }
        Update: {
          altura?: number
          categoria?: string | null
          company_id?: string | null
          created_at?: string | null
          delete_reason?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          formato?: string
          id?: string
          is_deleted?: boolean | null
          is_global?: boolean | null
          largura?: number
          nome?: string
          schema?: Json
          thumbnail_url?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      comm_director_conversations: {
        Row: {
          allowed_modules: string[] | null
          brand_kit_id: string | null
          company_id: string
          created_at: string
          id: string
          is_deleted: boolean | null
          scope: string
          title: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          allowed_modules?: string[] | null
          brand_kit_id?: string | null
          company_id: string
          created_at?: string
          id?: string
          is_deleted?: boolean | null
          scope?: string
          title?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          allowed_modules?: string[] | null
          brand_kit_id?: string | null
          company_id?: string
          created_at?: string
          id?: string
          is_deleted?: boolean | null
          scope?: string
          title?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comm_director_conversations_brand_kit_id_fkey"
            columns: ["brand_kit_id"]
            isOneToOne: false
            referencedRelation: "comm_brand_kits"
            referencedColumns: ["id"]
          },
        ]
      }
      comm_director_messages: {
        Row: {
          content: string | null
          conversation_id: string
          created_at: string
          id: string
          role: string
          tool_calls: Json | null
          tool_results: Json | null
        }
        Insert: {
          content?: string | null
          conversation_id: string
          created_at?: string
          id?: string
          role: string
          tool_calls?: Json | null
          tool_results?: Json | null
        }
        Update: {
          content?: string | null
          conversation_id?: string
          created_at?: string
          id?: string
          role?: string
          tool_calls?: Json | null
          tool_results?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "comm_director_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "comm_director_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      comm_editorial_calendar: {
        Row: {
          brand_kit_id: string | null
          campaign_id: string | null
          canal: string | null
          company_id: string
          created_at: string | null
          created_by: string | null
          cta: string | null
          data_planejada: string
          delete_reason: string | null
          deleted_at: string | null
          deleted_by: string | null
          formato: string | null
          hora_planejada: string | null
          id: string
          internal_id: string | null
          is_deleted: boolean | null
          legenda: string | null
          newsletter_id: string | null
          notas: string | null
          post_id: string | null
          prioridade: string | null
          responsavel_id: string | null
          status: string | null
          tema: string | null
          texto: string | null
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          brand_kit_id?: string | null
          campaign_id?: string | null
          canal?: string | null
          company_id: string
          created_at?: string | null
          created_by?: string | null
          cta?: string | null
          data_planejada: string
          delete_reason?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          formato?: string | null
          hora_planejada?: string | null
          id?: string
          internal_id?: string | null
          is_deleted?: boolean | null
          legenda?: string | null
          newsletter_id?: string | null
          notas?: string | null
          post_id?: string | null
          prioridade?: string | null
          responsavel_id?: string | null
          status?: string | null
          tema?: string | null
          texto?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          brand_kit_id?: string | null
          campaign_id?: string | null
          canal?: string | null
          company_id?: string
          created_at?: string | null
          created_by?: string | null
          cta?: string | null
          data_planejada?: string
          delete_reason?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          formato?: string | null
          hora_planejada?: string | null
          id?: string
          internal_id?: string | null
          is_deleted?: boolean | null
          legenda?: string | null
          newsletter_id?: string | null
          notas?: string | null
          post_id?: string | null
          prioridade?: string | null
          responsavel_id?: string | null
          status?: string | null
          tema?: string | null
          texto?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "comm_editorial_calendar_brand_kit_id_fkey"
            columns: ["brand_kit_id"]
            isOneToOne: false
            referencedRelation: "comm_brand_kits"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comm_editorial_calendar_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "comm_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comm_editorial_calendar_internal_id_fkey"
            columns: ["internal_id"]
            isOneToOne: false
            referencedRelation: "comm_internal_comms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comm_editorial_calendar_newsletter_id_fkey"
            columns: ["newsletter_id"]
            isOneToOne: false
            referencedRelation: "comm_newsletters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comm_editorial_calendar_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "comm_content_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      comm_generated_designs: {
        Row: {
          altura: number | null
          approval_status: string | null
          brand_kit_id: string | null
          company_id: string
          conteudo: Json
          created_at: string | null
          created_by: string | null
          delete_reason: string | null
          deleted_at: string | null
          deleted_by: string | null
          export_url: string | null
          formato: string | null
          id: string
          is_deleted: boolean | null
          largura: number | null
          linked_post_id: string | null
          nome: string | null
          parent_design_id: string | null
          preview_url: string | null
          status: string | null
          template_id: string | null
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          altura?: number | null
          approval_status?: string | null
          brand_kit_id?: string | null
          company_id: string
          conteudo?: Json
          created_at?: string | null
          created_by?: string | null
          delete_reason?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          export_url?: string | null
          formato?: string | null
          id?: string
          is_deleted?: boolean | null
          largura?: number | null
          linked_post_id?: string | null
          nome?: string | null
          parent_design_id?: string | null
          preview_url?: string | null
          status?: string | null
          template_id?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          altura?: number | null
          approval_status?: string | null
          brand_kit_id?: string | null
          company_id?: string
          conteudo?: Json
          created_at?: string | null
          created_by?: string | null
          delete_reason?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          export_url?: string | null
          formato?: string | null
          id?: string
          is_deleted?: boolean | null
          largura?: number | null
          linked_post_id?: string | null
          nome?: string | null
          parent_design_id?: string | null
          preview_url?: string | null
          status?: string | null
          template_id?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "comm_generated_designs_brand_kit_id_fkey"
            columns: ["brand_kit_id"]
            isOneToOne: false
            referencedRelation: "comm_brand_kits"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comm_generated_designs_linked_post_id_fkey"
            columns: ["linked_post_id"]
            isOneToOne: false
            referencedRelation: "comm_content_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comm_generated_designs_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "comm_design_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      comm_generated_images: {
        Row: {
          approval_status: string | null
          approved_at: string | null
          approved_by: string | null
          brand_kit_id: string | null
          company_id: string
          cost_credits: number | null
          created_at: string | null
          delete_reason: string | null
          deleted_at: string | null
          deleted_by: string | null
          format: string | null
          generated_by: string | null
          id: string
          is_deleted: boolean | null
          linked_design_id: string | null
          linked_post_id: string | null
          model: string | null
          parent_image_id: string | null
          prompt: string
          prompt_revisado: string | null
          provider: string | null
          public_url: string | null
          rejection_reason: string | null
          status: string | null
          storage_path: string | null
          tokens_in: number | null
          tokens_out: number | null
          updated_at: string | null
        }
        Insert: {
          approval_status?: string | null
          approved_at?: string | null
          approved_by?: string | null
          brand_kit_id?: string | null
          company_id: string
          cost_credits?: number | null
          created_at?: string | null
          delete_reason?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          format?: string | null
          generated_by?: string | null
          id?: string
          is_deleted?: boolean | null
          linked_design_id?: string | null
          linked_post_id?: string | null
          model?: string | null
          parent_image_id?: string | null
          prompt: string
          prompt_revisado?: string | null
          provider?: string | null
          public_url?: string | null
          rejection_reason?: string | null
          status?: string | null
          storage_path?: string | null
          tokens_in?: number | null
          tokens_out?: number | null
          updated_at?: string | null
        }
        Update: {
          approval_status?: string | null
          approved_at?: string | null
          approved_by?: string | null
          brand_kit_id?: string | null
          company_id?: string
          cost_credits?: number | null
          created_at?: string | null
          delete_reason?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          format?: string | null
          generated_by?: string | null
          id?: string
          is_deleted?: boolean | null
          linked_design_id?: string | null
          linked_post_id?: string | null
          model?: string | null
          parent_image_id?: string | null
          prompt?: string
          prompt_revisado?: string | null
          provider?: string | null
          public_url?: string | null
          rejection_reason?: string | null
          status?: string | null
          storage_path?: string | null
          tokens_in?: number | null
          tokens_out?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "comm_generated_images_brand_kit_id_fkey"
            columns: ["brand_kit_id"]
            isOneToOne: false
            referencedRelation: "comm_brand_kits"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comm_generated_images_linked_design_id_fkey"
            columns: ["linked_design_id"]
            isOneToOne: false
            referencedRelation: "comm_generated_designs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comm_generated_images_linked_post_id_fkey"
            columns: ["linked_post_id"]
            isOneToOne: false
            referencedRelation: "comm_content_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      comm_idea_bank: {
        Row: {
          brand_kit_id: string | null
          campaign_id: string | null
          categoria: string | null
          company_id: string
          created_at: string | null
          created_by: string | null
          delete_reason: string | null
          deleted_at: string | null
          deleted_by: string | null
          id: string
          ideia: string
          is_deleted: boolean | null
          observacoes: string | null
          origem: string | null
          prioridade: string | null
          responsavel_id: string | null
          status: string | null
          tags: string[] | null
          updated_at: string | null
          votos: number | null
        }
        Insert: {
          brand_kit_id?: string | null
          campaign_id?: string | null
          categoria?: string | null
          company_id: string
          created_at?: string | null
          created_by?: string | null
          delete_reason?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          id?: string
          ideia: string
          is_deleted?: boolean | null
          observacoes?: string | null
          origem?: string | null
          prioridade?: string | null
          responsavel_id?: string | null
          status?: string | null
          tags?: string[] | null
          updated_at?: string | null
          votos?: number | null
        }
        Update: {
          brand_kit_id?: string | null
          campaign_id?: string | null
          categoria?: string | null
          company_id?: string
          created_at?: string | null
          created_by?: string | null
          delete_reason?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          id?: string
          ideia?: string
          is_deleted?: boolean | null
          observacoes?: string | null
          origem?: string | null
          prioridade?: string | null
          responsavel_id?: string | null
          status?: string | null
          tags?: string[] | null
          updated_at?: string | null
          votos?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "comm_idea_bank_brand_kit_id_fkey"
            columns: ["brand_kit_id"]
            isOneToOne: false
            referencedRelation: "comm_brand_kits"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comm_idea_bank_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "comm_campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      comm_internal_comms: {
        Row: {
          company_id: string
          created_at: string | null
          created_by: string | null
          cta: string | null
          delete_reason: string | null
          deleted_at: string | null
          deleted_by: string | null
          id: string
          is_deleted: boolean | null
          mensagem_completa: string | null
          mensagem_curta: string | null
          prioridade: string | null
          publico_alvo: string | null
          status: string | null
          tipo: string | null
          titulo: string | null
          updated_at: string | null
          updated_by: string | null
          versao_email: string | null
          versao_mural: string | null
          versao_whatsapp: string | null
        }
        Insert: {
          company_id: string
          created_at?: string | null
          created_by?: string | null
          cta?: string | null
          delete_reason?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          id?: string
          is_deleted?: boolean | null
          mensagem_completa?: string | null
          mensagem_curta?: string | null
          prioridade?: string | null
          publico_alvo?: string | null
          status?: string | null
          tipo?: string | null
          titulo?: string | null
          updated_at?: string | null
          updated_by?: string | null
          versao_email?: string | null
          versao_mural?: string | null
          versao_whatsapp?: string | null
        }
        Update: {
          company_id?: string
          created_at?: string | null
          created_by?: string | null
          cta?: string | null
          delete_reason?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          id?: string
          is_deleted?: boolean | null
          mensagem_completa?: string | null
          mensagem_curta?: string | null
          prioridade?: string | null
          publico_alvo?: string | null
          status?: string | null
          tipo?: string | null
          titulo?: string | null
          updated_at?: string | null
          updated_by?: string | null
          versao_email?: string | null
          versao_mural?: string | null
          versao_whatsapp?: string | null
        }
        Relationships: []
      }
      comm_metrics: {
        Row: {
          alcance: number | null
          cliques: number | null
          comentarios: number | null
          company_id: string
          compartilhamentos: number | null
          conversoes: number | null
          created_at: string | null
          curtidas: number | null
          custo: number | null
          id: string
          impressoes: number | null
          inscricoes: number | null
          leads: number | null
          origem: string | null
          periodo_fim: string | null
          periodo_inicio: string | null
          publication_id: string | null
        }
        Insert: {
          alcance?: number | null
          cliques?: number | null
          comentarios?: number | null
          company_id: string
          compartilhamentos?: number | null
          conversoes?: number | null
          created_at?: string | null
          curtidas?: number | null
          custo?: number | null
          id?: string
          impressoes?: number | null
          inscricoes?: number | null
          leads?: number | null
          origem?: string | null
          periodo_fim?: string | null
          periodo_inicio?: string | null
          publication_id?: string | null
        }
        Update: {
          alcance?: number | null
          cliques?: number | null
          comentarios?: number | null
          company_id?: string
          compartilhamentos?: number | null
          conversoes?: number | null
          created_at?: string | null
          curtidas?: number | null
          custo?: number | null
          id?: string
          impressoes?: number | null
          inscricoes?: number | null
          leads?: number | null
          origem?: string | null
          periodo_fim?: string | null
          periodo_inicio?: string | null
          publication_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "comm_metrics_publication_id_fkey"
            columns: ["publication_id"]
            isOneToOne: false
            referencedRelation: "comm_publications"
            referencedColumns: ["id"]
          },
        ]
      }
      comm_module_permissions: {
        Row: {
          can_approve: boolean
          can_create: boolean
          can_delete: boolean
          can_edit: boolean
          can_export: boolean
          can_generate_content: boolean
          can_generate_design: boolean
          can_generate_image: boolean
          can_manage_brand: boolean
          can_manage_settings: boolean
          can_manage_templates: boolean
          can_publish: boolean
          can_view: boolean
          company_id: string
          created_at: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          can_approve?: boolean
          can_create?: boolean
          can_delete?: boolean
          can_edit?: boolean
          can_export?: boolean
          can_generate_content?: boolean
          can_generate_design?: boolean
          can_generate_image?: boolean
          can_manage_brand?: boolean
          can_manage_settings?: boolean
          can_manage_templates?: boolean
          can_publish?: boolean
          can_view?: boolean
          company_id: string
          created_at?: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          can_approve?: boolean
          can_create?: boolean
          can_delete?: boolean
          can_edit?: boolean
          can_export?: boolean
          can_generate_content?: boolean
          can_generate_design?: boolean
          can_generate_image?: boolean
          can_manage_brand?: boolean
          can_manage_settings?: boolean
          can_manage_templates?: boolean
          can_publish?: boolean
          can_view?: boolean
          company_id?: string
          created_at?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      comm_module_settings: {
        Row: {
          ai_enabled: boolean
          ai_image_enabled: boolean
          canva_enabled: boolean
          company_id: string | null
          config: Json
          created_at: string
          default_locale: string | null
          default_timezone: string | null
          enabled: boolean
          id: string
          updated_at: string
        }
        Insert: {
          ai_enabled?: boolean
          ai_image_enabled?: boolean
          canva_enabled?: boolean
          company_id?: string | null
          config?: Json
          created_at?: string
          default_locale?: string | null
          default_timezone?: string | null
          enabled?: boolean
          id?: string
          updated_at?: string
        }
        Update: {
          ai_enabled?: boolean
          ai_image_enabled?: boolean
          canva_enabled?: boolean
          company_id?: string | null
          config?: Json
          created_at?: string
          default_locale?: string | null
          default_timezone?: string | null
          enabled?: boolean
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      comm_newsletters: {
        Row: {
          abertura: string | null
          ai_generated: boolean | null
          assunto: string | null
          blocos: Json | null
          brand_kit_id: string | null
          company_id: string
          created_at: string | null
          created_by: string | null
          cta: string | null
          delete_reason: string | null
          deleted_at: string | null
          deleted_by: string | null
          id: string
          is_deleted: boolean | null
          pre_header: string | null
          publico: string | null
          rodape: string | null
          status: string
          updated_at: string | null
          updated_by: string | null
          versao_html: string | null
          versao_texto: string | null
        }
        Insert: {
          abertura?: string | null
          ai_generated?: boolean | null
          assunto?: string | null
          blocos?: Json | null
          brand_kit_id?: string | null
          company_id: string
          created_at?: string | null
          created_by?: string | null
          cta?: string | null
          delete_reason?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          id?: string
          is_deleted?: boolean | null
          pre_header?: string | null
          publico?: string | null
          rodape?: string | null
          status?: string
          updated_at?: string | null
          updated_by?: string | null
          versao_html?: string | null
          versao_texto?: string | null
        }
        Update: {
          abertura?: string | null
          ai_generated?: boolean | null
          assunto?: string | null
          blocos?: Json | null
          brand_kit_id?: string | null
          company_id?: string
          created_at?: string | null
          created_by?: string | null
          cta?: string | null
          delete_reason?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          id?: string
          is_deleted?: boolean | null
          pre_header?: string | null
          publico?: string | null
          rodape?: string | null
          status?: string
          updated_at?: string | null
          updated_by?: string | null
          versao_html?: string | null
          versao_texto?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "comm_newsletters_brand_kit_id_fkey"
            columns: ["brand_kit_id"]
            isOneToOne: false
            referencedRelation: "comm_brand_kits"
            referencedColumns: ["id"]
          },
        ]
      }
      comm_post_metrics: {
        Row: {
          caption: string | null
          clicks: number | null
          client_brand_id: string | null
          collected_at: string
          comments: number | null
          company_id: string
          created_at: string
          created_by: string | null
          engagement_rate: number | null
          entidade_id: string | null
          entidade_tipo: string | null
          external_post_id: string | null
          external_url: string | null
          id: string
          impressions: number | null
          likes: number | null
          provider: string | null
          publish_queue_id: string | null
          raw: Json | null
          reach: number | null
          saves: number | null
          shares: number | null
          social_account_id: string | null
          updated_at: string
          views: number | null
        }
        Insert: {
          caption?: string | null
          clicks?: number | null
          client_brand_id?: string | null
          collected_at?: string
          comments?: number | null
          company_id: string
          created_at?: string
          created_by?: string | null
          engagement_rate?: number | null
          entidade_id?: string | null
          entidade_tipo?: string | null
          external_post_id?: string | null
          external_url?: string | null
          id?: string
          impressions?: number | null
          likes?: number | null
          provider?: string | null
          publish_queue_id?: string | null
          raw?: Json | null
          reach?: number | null
          saves?: number | null
          shares?: number | null
          social_account_id?: string | null
          updated_at?: string
          views?: number | null
        }
        Update: {
          caption?: string | null
          clicks?: number | null
          client_brand_id?: string | null
          collected_at?: string
          comments?: number | null
          company_id?: string
          created_at?: string
          created_by?: string | null
          engagement_rate?: number | null
          entidade_id?: string | null
          entidade_tipo?: string | null
          external_post_id?: string | null
          external_url?: string | null
          id?: string
          impressions?: number | null
          likes?: number | null
          provider?: string | null
          publish_queue_id?: string | null
          raw?: Json | null
          reach?: number | null
          saves?: number | null
          shares?: number | null
          social_account_id?: string | null
          updated_at?: string
          views?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "comm_post_metrics_publish_queue_id_fkey"
            columns: ["publish_queue_id"]
            isOneToOne: false
            referencedRelation: "comm_social_publish_queue"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comm_post_metrics_social_account_id_fkey"
            columns: ["social_account_id"]
            isOneToOne: false
            referencedRelation: "comm_social_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      comm_product_items: {
        Row: {
          company_id: string
          created_at: string | null
          created_by: string | null
          criterios_aceite: string | null
          data_lancamento: string | null
          delete_reason: string | null
          deleted_at: string | null
          deleted_by: string | null
          descricao: string | null
          esforco: number | null
          feedback: string | null
          id: string
          impacto: number | null
          is_deleted: boolean | null
          metricas: Json | null
          modulo_relacionado: string | null
          pesquisa: Json | null
          posicionamento: Json | null
          prioridade: string | null
          release_note: string | null
          responsavel_id: string | null
          risco: string | null
          status: string | null
          status_kanban: string | null
          tipo: string | null
          titulo: string
          updated_at: string | null
          updated_by: string | null
          user_story: string | null
          valor_cliente: string | null
          versao_prevista: string | null
        }
        Insert: {
          company_id: string
          created_at?: string | null
          created_by?: string | null
          criterios_aceite?: string | null
          data_lancamento?: string | null
          delete_reason?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          descricao?: string | null
          esforco?: number | null
          feedback?: string | null
          id?: string
          impacto?: number | null
          is_deleted?: boolean | null
          metricas?: Json | null
          modulo_relacionado?: string | null
          pesquisa?: Json | null
          posicionamento?: Json | null
          prioridade?: string | null
          release_note?: string | null
          responsavel_id?: string | null
          risco?: string | null
          status?: string | null
          status_kanban?: string | null
          tipo?: string | null
          titulo: string
          updated_at?: string | null
          updated_by?: string | null
          user_story?: string | null
          valor_cliente?: string | null
          versao_prevista?: string | null
        }
        Update: {
          company_id?: string
          created_at?: string | null
          created_by?: string | null
          criterios_aceite?: string | null
          data_lancamento?: string | null
          delete_reason?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          descricao?: string | null
          esforco?: number | null
          feedback?: string | null
          id?: string
          impacto?: number | null
          is_deleted?: boolean | null
          metricas?: Json | null
          modulo_relacionado?: string | null
          pesquisa?: Json | null
          posicionamento?: Json | null
          prioridade?: string | null
          release_note?: string | null
          responsavel_id?: string | null
          risco?: string | null
          status?: string | null
          status_kanban?: string | null
          tipo?: string | null
          titulo?: string
          updated_at?: string | null
          updated_by?: string | null
          user_story?: string | null
          valor_cliente?: string | null
          versao_prevista?: string | null
        }
        Relationships: []
      }
      comm_prompt_library: {
        Row: {
          brand_kit_id: string | null
          canal: string | null
          categoria: string | null
          company_id: string
          created_at: string | null
          created_by: string | null
          delete_reason: string | null
          deleted_at: string | null
          deleted_by: string | null
          id: string
          is_deleted: boolean | null
          nome: string
          objetivo: string | null
          status: string | null
          texto: string
          updated_at: string | null
          variaveis: Json | null
        }
        Insert: {
          brand_kit_id?: string | null
          canal?: string | null
          categoria?: string | null
          company_id: string
          created_at?: string | null
          created_by?: string | null
          delete_reason?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          id?: string
          is_deleted?: boolean | null
          nome: string
          objetivo?: string | null
          status?: string | null
          texto: string
          updated_at?: string | null
          variaveis?: Json | null
        }
        Update: {
          brand_kit_id?: string | null
          canal?: string | null
          categoria?: string | null
          company_id?: string
          created_at?: string | null
          created_by?: string | null
          delete_reason?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          id?: string
          is_deleted?: boolean | null
          nome?: string
          objetivo?: string | null
          status?: string | null
          texto?: string
          updated_at?: string | null
          variaveis?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "comm_prompt_library_brand_kit_id_fkey"
            columns: ["brand_kit_id"]
            isOneToOne: false
            referencedRelation: "comm_brand_kits"
            referencedColumns: ["id"]
          },
        ]
      }
      comm_publications: {
        Row: {
          canal: string | null
          company_id: string
          created_at: string | null
          data_planejada: string | null
          data_publicada: string | null
          delete_reason: string | null
          deleted_at: string | null
          deleted_by: string | null
          id: string
          is_deleted: boolean | null
          link_publicacao: string | null
          metricas: Json | null
          post_id: string | null
          responsavel_id: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          canal?: string | null
          company_id: string
          created_at?: string | null
          data_planejada?: string | null
          data_publicada?: string | null
          delete_reason?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          id?: string
          is_deleted?: boolean | null
          link_publicacao?: string | null
          metricas?: Json | null
          post_id?: string | null
          responsavel_id?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          canal?: string | null
          company_id?: string
          created_at?: string | null
          data_planejada?: string | null
          data_publicada?: string | null
          delete_reason?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          id?: string
          is_deleted?: boolean | null
          link_publicacao?: string | null
          metricas?: Json | null
          post_id?: string | null
          responsavel_id?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "comm_publications_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "comm_content_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      comm_social_accounts: {
        Row: {
          account_handle: string | null
          account_name: string
          client_brand_id: string | null
          company_id: string
          created_at: string
          created_by: string | null
          delete_reason: string | null
          deleted_at: string | null
          deleted_by: string | null
          external_id: string | null
          id: string
          is_default: boolean | null
          is_deleted: boolean | null
          last_error: string | null
          metadata: Json | null
          page_id: string | null
          provider: string
          refresh_token_enc: string | null
          scopes: string[] | null
          status: string
          token_enc: string | null
          token_expires_at: string | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          account_handle?: string | null
          account_name: string
          client_brand_id?: string | null
          company_id: string
          created_at?: string
          created_by?: string | null
          delete_reason?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          external_id?: string | null
          id?: string
          is_default?: boolean | null
          is_deleted?: boolean | null
          last_error?: string | null
          metadata?: Json | null
          page_id?: string | null
          provider: string
          refresh_token_enc?: string | null
          scopes?: string[] | null
          status?: string
          token_enc?: string | null
          token_expires_at?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          account_handle?: string | null
          account_name?: string
          client_brand_id?: string | null
          company_id?: string
          created_at?: string
          created_by?: string | null
          delete_reason?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          external_id?: string | null
          id?: string
          is_default?: boolean | null
          is_deleted?: boolean | null
          last_error?: string | null
          metadata?: Json | null
          page_id?: string | null
          provider?: string
          refresh_token_enc?: string | null
          scopes?: string[] | null
          status?: string
          token_enc?: string | null
          token_expires_at?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      comm_social_publish_queue: {
        Row: {
          attempts: number
          caption: string | null
          client_brand_id: string | null
          company_id: string
          created_at: string
          created_by: string | null
          entidade_id: string
          entidade_tipo: string
          external_post_id: string | null
          external_url: string | null
          id: string
          last_error: string | null
          media_urls: string[] | null
          published_at: string | null
          scheduled_for: string | null
          social_account_id: string | null
          status: string
          updated_at: string
        }
        Insert: {
          attempts?: number
          caption?: string | null
          client_brand_id?: string | null
          company_id: string
          created_at?: string
          created_by?: string | null
          entidade_id: string
          entidade_tipo: string
          external_post_id?: string | null
          external_url?: string | null
          id?: string
          last_error?: string | null
          media_urls?: string[] | null
          published_at?: string | null
          scheduled_for?: string | null
          social_account_id?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          attempts?: number
          caption?: string | null
          client_brand_id?: string | null
          company_id?: string
          created_at?: string
          created_by?: string | null
          entidade_id?: string
          entidade_tipo?: string
          external_post_id?: string | null
          external_url?: string | null
          id?: string
          last_error?: string | null
          media_urls?: string[] | null
          published_at?: string | null
          scheduled_for?: string | null
          social_account_id?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "comm_social_publish_queue_social_account_id_fkey"
            columns: ["social_account_id"]
            isOneToOne: false
            referencedRelation: "comm_social_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      companies: {
        Row: {
          ativo: boolean
          cnpj: string | null
          contato_email: string | null
          contato_nome: string | null
          contato_whatsapp: string | null
          created_at: string
          id: string
          master_password_hash: string | null
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
          master_password_hash?: string | null
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
          master_password_hash?: string | null
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
      company_chart_preferences: {
        Row: {
          allowed_chart_types: string[]
          company_id: string | null
          created_at: string
          default_chart_type: string
          id: string
          is_active: boolean
          metric_key: string
          module_key: string
          subtab_key: string
          tab_key: string
          updated_at: string
          updated_by: string | null
          user_can_switch: boolean
        }
        Insert: {
          allowed_chart_types?: string[]
          company_id?: string | null
          created_at?: string
          default_chart_type?: string
          id?: string
          is_active?: boolean
          metric_key: string
          module_key: string
          subtab_key?: string
          tab_key?: string
          updated_at?: string
          updated_by?: string | null
          user_can_switch?: boolean
        }
        Update: {
          allowed_chart_types?: string[]
          company_id?: string | null
          created_at?: string
          default_chart_type?: string
          id?: string
          is_active?: boolean
          metric_key?: string
          module_key?: string
          subtab_key?: string
          tab_key?: string
          updated_at?: string
          updated_by?: string | null
          user_can_switch?: boolean
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
          company_id: string | null
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
          scope: string
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
          company_id?: string | null
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
          scope?: string
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
          company_id?: string | null
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
          scope?: string
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
          data_envio_validacao: string | null
          data_pagamento: string | null
          data_rascunho: string | null
          data_validada: string | null
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
          data_envio_validacao?: string | null
          data_pagamento?: string | null
          data_rascunho?: string | null
          data_validada?: string | null
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
          data_envio_validacao?: string | null
          data_pagamento?: string | null
          data_rascunho?: string | null
          data_validada?: string | null
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
          anexo_url: string | null
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
          anexo_url?: string | null
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
          anexo_url?: string | null
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
          anexo_url: string | null
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
          anexo_url?: string | null
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
          anexo_url?: string | null
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
          anexo_url: string | null
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
          anexo_url?: string | null
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
          anexo_url?: string | null
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
          anexo_url: string | null
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
          anexo_url?: string | null
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
          anexo_url?: string | null
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
          anexo_url: string | null
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
          anexo_url?: string | null
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
          anexo_url?: string | null
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
      crea_gov_alertas: {
        Row: {
          art_id: string | null
          company_id: string
          created_at: string
          criticidade: string
          delete_reason: string | null
          deleted_at: string | null
          deleted_by: string | null
          historico: Json
          id: string
          is_deleted: boolean
          observacoes: string | null
          pagamento_id: string | null
          prazo: string | null
          responsavel_id: string | null
          status: string
          tipo: string
          updated_at: string
        }
        Insert: {
          art_id?: string | null
          company_id: string
          created_at?: string
          criticidade?: string
          delete_reason?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          historico?: Json
          id?: string
          is_deleted?: boolean
          observacoes?: string | null
          pagamento_id?: string | null
          prazo?: string | null
          responsavel_id?: string | null
          status?: string
          tipo: string
          updated_at?: string
        }
        Update: {
          art_id?: string | null
          company_id?: string
          created_at?: string
          criticidade?: string
          delete_reason?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          historico?: Json
          id?: string
          is_deleted?: boolean
          observacoes?: string | null
          pagamento_id?: string | null
          prazo?: string | null
          responsavel_id?: string | null
          status?: string
          tipo?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "crea_gov_alertas_art_id_fkey"
            columns: ["art_id"]
            isOneToOne: false
            referencedRelation: "crea_gov_arts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crea_gov_alertas_pagamento_id_fkey"
            columns: ["pagamento_id"]
            isOneToOne: false
            referencedRelation: "crea_gov_pagamentos"
            referencedColumns: ["id"]
          },
        ]
      }
      crea_gov_art_atividades: {
        Row: {
          art_id: string
          codigo_tos: string | null
          created_at: string
          descricao: string | null
          id: string
          quantidade: number | null
          unidade_medida: string | null
        }
        Insert: {
          art_id: string
          codigo_tos?: string | null
          created_at?: string
          descricao?: string | null
          id?: string
          quantidade?: number | null
          unidade_medida?: string | null
        }
        Update: {
          art_id?: string
          codigo_tos?: string | null
          created_at?: string
          descricao?: string | null
          id?: string
          quantidade?: number | null
          unidade_medida?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "crea_gov_art_atividades_art_id_fkey"
            columns: ["art_id"]
            isOneToOne: false
            referencedRelation: "crea_gov_arts"
            referencedColumns: ["id"]
          },
        ]
      }
      crea_gov_art_setores_extra: {
        Row: {
          art_id: string
          setor_id: string
        }
        Insert: {
          art_id: string
          setor_id: string
        }
        Update: {
          art_id?: string
          setor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "crea_gov_art_setores_extra_art_id_fkey"
            columns: ["art_id"]
            isOneToOne: false
            referencedRelation: "crea_gov_arts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crea_gov_art_setores_extra_setor_id_fkey"
            columns: ["setor_id"]
            isOneToOne: false
            referencedRelation: "crea_gov_setores"
            referencedColumns: ["id"]
          },
        ]
      }
      crea_gov_art_tags: {
        Row: {
          art_id: string
          origem: string
          tag_id: string
        }
        Insert: {
          art_id: string
          origem?: string
          tag_id: string
        }
        Update: {
          art_id?: string
          origem?: string
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "crea_gov_art_tags_art_id_fkey"
            columns: ["art_id"]
            isOneToOne: false
            referencedRelation: "crea_gov_arts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crea_gov_art_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "crea_gov_tags"
            referencedColumns: ["id"]
          },
        ]
      }
      crea_gov_arts: {
        Row: {
          ano: number | null
          arquivo_origem_id: string | null
          atividades_texto: string | null
          boleto_numero: string | null
          centro_custo: string | null
          cep: string | null
          cidade: string | null
          classificado_em: string | null
          classificado_por: string | null
          codigo_tos: string | null
          company_id: string
          contratante_id: string | null
          crea_codigo: string | null
          created_at: string
          created_by: string | null
          data_baixa: string | null
          data_cadastro: string | null
          data_pagamento: string | null
          data_vencimento: string | null
          delete_reason: string | null
          deleted_at: string | null
          deleted_by: string | null
          duplicado_de: string | null
          empresa_id: string | null
          endereco: string | null
          escopo_ia_sugerido_id: string | null
          escopo_id: string | null
          forma_registro: string | null
          hash_unico: string | null
          id: string
          is_deleted: boolean
          mes: number | null
          natureza: string | null
          numero: string
          observacao: string | null
          participacao_tecnica: string | null
          proprietario: string | null
          quantidade: number | null
          raw: Json | null
          rt_id: string | null
          setor_ia_sugerido_id: string | null
          setor_principal_id: string | null
          status_analise: string | null
          status_baixa: string | null
          status_financeiro: string | null
          status_governanca: string | null
          tipo: string | null
          uf: string | null
          uf_obra: string | null
          unidade_medida: string | null
          updated_at: string
          updated_by: string | null
          valor_contrato: number | null
          valor_pago: number | null
          valor_taxa: number | null
        }
        Insert: {
          ano?: number | null
          arquivo_origem_id?: string | null
          atividades_texto?: string | null
          boleto_numero?: string | null
          centro_custo?: string | null
          cep?: string | null
          cidade?: string | null
          classificado_em?: string | null
          classificado_por?: string | null
          codigo_tos?: string | null
          company_id: string
          contratante_id?: string | null
          crea_codigo?: string | null
          created_at?: string
          created_by?: string | null
          data_baixa?: string | null
          data_cadastro?: string | null
          data_pagamento?: string | null
          data_vencimento?: string | null
          delete_reason?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          duplicado_de?: string | null
          empresa_id?: string | null
          endereco?: string | null
          escopo_ia_sugerido_id?: string | null
          escopo_id?: string | null
          forma_registro?: string | null
          hash_unico?: string | null
          id?: string
          is_deleted?: boolean
          mes?: number | null
          natureza?: string | null
          numero: string
          observacao?: string | null
          participacao_tecnica?: string | null
          proprietario?: string | null
          quantidade?: number | null
          raw?: Json | null
          rt_id?: string | null
          setor_ia_sugerido_id?: string | null
          setor_principal_id?: string | null
          status_analise?: string | null
          status_baixa?: string | null
          status_financeiro?: string | null
          status_governanca?: string | null
          tipo?: string | null
          uf?: string | null
          uf_obra?: string | null
          unidade_medida?: string | null
          updated_at?: string
          updated_by?: string | null
          valor_contrato?: number | null
          valor_pago?: number | null
          valor_taxa?: number | null
        }
        Update: {
          ano?: number | null
          arquivo_origem_id?: string | null
          atividades_texto?: string | null
          boleto_numero?: string | null
          centro_custo?: string | null
          cep?: string | null
          cidade?: string | null
          classificado_em?: string | null
          classificado_por?: string | null
          codigo_tos?: string | null
          company_id?: string
          contratante_id?: string | null
          crea_codigo?: string | null
          created_at?: string
          created_by?: string | null
          data_baixa?: string | null
          data_cadastro?: string | null
          data_pagamento?: string | null
          data_vencimento?: string | null
          delete_reason?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          duplicado_de?: string | null
          empresa_id?: string | null
          endereco?: string | null
          escopo_ia_sugerido_id?: string | null
          escopo_id?: string | null
          forma_registro?: string | null
          hash_unico?: string | null
          id?: string
          is_deleted?: boolean
          mes?: number | null
          natureza?: string | null
          numero?: string
          observacao?: string | null
          participacao_tecnica?: string | null
          proprietario?: string | null
          quantidade?: number | null
          raw?: Json | null
          rt_id?: string | null
          setor_ia_sugerido_id?: string | null
          setor_principal_id?: string | null
          status_analise?: string | null
          status_baixa?: string | null
          status_financeiro?: string | null
          status_governanca?: string | null
          tipo?: string | null
          uf?: string | null
          uf_obra?: string | null
          unidade_medida?: string | null
          updated_at?: string
          updated_by?: string | null
          valor_contrato?: number | null
          valor_pago?: number | null
          valor_taxa?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "crea_gov_arts_arquivo_origem_id_fkey"
            columns: ["arquivo_origem_id"]
            isOneToOne: false
            referencedRelation: "crea_gov_importacoes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crea_gov_arts_contratante_id_fkey"
            columns: ["contratante_id"]
            isOneToOne: false
            referencedRelation: "crea_gov_contratantes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crea_gov_arts_escopo_ia_sugerido_id_fkey"
            columns: ["escopo_ia_sugerido_id"]
            isOneToOne: false
            referencedRelation: "crea_gov_escopos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crea_gov_arts_escopo_id_fkey"
            columns: ["escopo_id"]
            isOneToOne: false
            referencedRelation: "crea_gov_escopos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crea_gov_arts_setor_ia_sugerido_id_fkey"
            columns: ["setor_ia_sugerido_id"]
            isOneToOne: false
            referencedRelation: "crea_gov_setores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crea_gov_arts_setor_principal_id_fkey"
            columns: ["setor_principal_id"]
            isOneToOne: false
            referencedRelation: "crea_gov_setores"
            referencedColumns: ["id"]
          },
        ]
      }
      crea_gov_classificacao_regras: {
        Row: {
          ativa: boolean
          company_id: string
          created_at: string
          escopo_id: string | null
          id: string
          is_regex: boolean
          palavra: string
          peso: number
          setor_id: string | null
          tag_id: string | null
          updated_at: string
        }
        Insert: {
          ativa?: boolean
          company_id: string
          created_at?: string
          escopo_id?: string | null
          id?: string
          is_regex?: boolean
          palavra: string
          peso?: number
          setor_id?: string | null
          tag_id?: string | null
          updated_at?: string
        }
        Update: {
          ativa?: boolean
          company_id?: string
          created_at?: string
          escopo_id?: string | null
          id?: string
          is_regex?: boolean
          palavra?: string
          peso?: number
          setor_id?: string | null
          tag_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "crea_gov_classificacao_regras_escopo_id_fkey"
            columns: ["escopo_id"]
            isOneToOne: false
            referencedRelation: "crea_gov_escopos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crea_gov_classificacao_regras_setor_id_fkey"
            columns: ["setor_id"]
            isOneToOne: false
            referencedRelation: "crea_gov_setores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crea_gov_classificacao_regras_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "crea_gov_tags"
            referencedColumns: ["id"]
          },
        ]
      }
      crea_gov_conciliacoes: {
        Row: {
          art_id: string | null
          company_id: string
          created_at: string
          created_by: string | null
          id: string
          motivo: string | null
          origem: string
          pagamento_id: string | null
          score: number | null
          status: string
        }
        Insert: {
          art_id?: string | null
          company_id: string
          created_at?: string
          created_by?: string | null
          id?: string
          motivo?: string | null
          origem?: string
          pagamento_id?: string | null
          score?: number | null
          status?: string
        }
        Update: {
          art_id?: string | null
          company_id?: string
          created_at?: string
          created_by?: string | null
          id?: string
          motivo?: string | null
          origem?: string
          pagamento_id?: string | null
          score?: number | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "crea_gov_conciliacoes_art_id_fkey"
            columns: ["art_id"]
            isOneToOne: false
            referencedRelation: "crea_gov_arts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crea_gov_conciliacoes_pagamento_id_fkey"
            columns: ["pagamento_id"]
            isOneToOne: false
            referencedRelation: "crea_gov_pagamentos"
            referencedColumns: ["id"]
          },
        ]
      }
      crea_gov_contratantes: {
        Row: {
          cidade: string | null
          cnpj: string | null
          company_id: string
          created_at: string
          created_by: string | null
          delete_reason: string | null
          deleted_at: string | null
          deleted_by: string | null
          id: string
          is_deleted: boolean
          nome: string
          observacoes: string | null
          uf: string | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          cidade?: string | null
          cnpj?: string | null
          company_id: string
          created_at?: string
          created_by?: string | null
          delete_reason?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          id?: string
          is_deleted?: boolean
          nome: string
          observacoes?: string | null
          uf?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          cidade?: string | null
          cnpj?: string | null
          company_id?: string
          created_at?: string
          created_by?: string | null
          delete_reason?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          id?: string
          is_deleted?: boolean
          nome?: string
          observacoes?: string | null
          uf?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      crea_gov_creas_config: {
        Row: {
          campos_personalizados: Json
          created_at: string
          id: string
          layout_xls: Json
          nome: string
          observacoes: string | null
          regras_extracao: Json
          status: string
          taxa_padrao: number | null
          uf: string
          updated_at: string
        }
        Insert: {
          campos_personalizados?: Json
          created_at?: string
          id?: string
          layout_xls?: Json
          nome: string
          observacoes?: string | null
          regras_extracao?: Json
          status?: string
          taxa_padrao?: number | null
          uf: string
          updated_at?: string
        }
        Update: {
          campos_personalizados?: Json
          created_at?: string
          id?: string
          layout_xls?: Json
          nome?: string
          observacoes?: string | null
          regras_extracao?: Json
          status?: string
          taxa_padrao?: number | null
          uf?: string
          updated_at?: string
        }
        Relationships: []
      }
      crea_gov_escopos: {
        Row: {
          company_id: string
          created_at: string
          created_by: string | null
          delete_reason: string | null
          deleted_at: string | null
          deleted_by: string | null
          descricao: string | null
          id: string
          is_deleted: boolean
          nome: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          company_id: string
          created_at?: string
          created_by?: string | null
          delete_reason?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          descricao?: string | null
          id?: string
          is_deleted?: boolean
          nome: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          company_id?: string
          created_at?: string
          created_by?: string | null
          delete_reason?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          descricao?: string | null
          id?: string
          is_deleted?: boolean
          nome?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      crea_gov_importacoes: {
        Row: {
          arquivo_nome: string | null
          arquivo_path: string | null
          company_id: string
          created_at: string
          falhas: number | null
          id: string
          kind: string
          log: Json | null
          mapeamento: Json | null
          ok: number | null
          ran_at: string
          ran_by: string | null
          status: string
          total_linhas: number | null
          uf: string | null
          updated_at: string
        }
        Insert: {
          arquivo_nome?: string | null
          arquivo_path?: string | null
          company_id: string
          created_at?: string
          falhas?: number | null
          id?: string
          kind: string
          log?: Json | null
          mapeamento?: Json | null
          ok?: number | null
          ran_at?: string
          ran_by?: string | null
          status?: string
          total_linhas?: number | null
          uf?: string | null
          updated_at?: string
        }
        Update: {
          arquivo_nome?: string | null
          arquivo_path?: string | null
          company_id?: string
          created_at?: string
          falhas?: number | null
          id?: string
          kind?: string
          log?: Json | null
          mapeamento?: Json | null
          ok?: number | null
          ran_at?: string
          ran_by?: string | null
          status?: string
          total_linhas?: number | null
          uf?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      crea_gov_pagamentos: {
        Row: {
          company_id: string
          conciliado_art_id: string | null
          created_at: string
          data_pagamento: string | null
          data_vencimento: string | null
          delete_reason: string | null
          deleted_at: string | null
          deleted_by: string | null
          id: string
          is_deleted: boolean
          numero_boleto: string | null
          origem_importacao_id: string | null
          raw: Json | null
          sacado: string | null
          status: string
          uf: string | null
          updated_at: string
          valor: number | null
        }
        Insert: {
          company_id: string
          conciliado_art_id?: string | null
          created_at?: string
          data_pagamento?: string | null
          data_vencimento?: string | null
          delete_reason?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          id?: string
          is_deleted?: boolean
          numero_boleto?: string | null
          origem_importacao_id?: string | null
          raw?: Json | null
          sacado?: string | null
          status?: string
          uf?: string | null
          updated_at?: string
          valor?: number | null
        }
        Update: {
          company_id?: string
          conciliado_art_id?: string | null
          created_at?: string
          data_pagamento?: string | null
          data_vencimento?: string | null
          delete_reason?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          id?: string
          is_deleted?: boolean
          numero_boleto?: string | null
          origem_importacao_id?: string | null
          raw?: Json | null
          sacado?: string | null
          status?: string
          uf?: string | null
          updated_at?: string
          valor?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "crea_gov_pagamentos_conciliado_art_id_fkey"
            columns: ["conciliado_art_id"]
            isOneToOne: false
            referencedRelation: "crea_gov_arts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crea_gov_pagamentos_origem_importacao_id_fkey"
            columns: ["origem_importacao_id"]
            isOneToOne: false
            referencedRelation: "crea_gov_importacoes"
            referencedColumns: ["id"]
          },
        ]
      }
      crea_gov_pdf_paginas: {
        Row: {
          company_id: string
          created_at: string
          delete_reason: string | null
          deleted_at: string | null
          deleted_by: string | null
          id: string
          importacao_id: string | null
          is_deleted: boolean
          metadata: Json
          numero_pagina: number
          status: string
          tabelas: Json
          texto: string | null
          total_paginas: number | null
          uf: string | null
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          delete_reason?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          id?: string
          importacao_id?: string | null
          is_deleted?: boolean
          metadata?: Json
          numero_pagina?: number
          status?: string
          tabelas?: Json
          texto?: string | null
          total_paginas?: number | null
          uf?: string | null
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          delete_reason?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          id?: string
          importacao_id?: string | null
          is_deleted?: boolean
          metadata?: Json
          numero_pagina?: number
          status?: string
          tabelas?: Json
          texto?: string | null
          total_paginas?: number | null
          uf?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "crea_gov_pdf_paginas_importacao_id_fkey"
            columns: ["importacao_id"]
            isOneToOne: false
            referencedRelation: "crea_gov_importacoes"
            referencedColumns: ["id"]
          },
        ]
      }
      crea_gov_setores: {
        Row: {
          company_id: string
          cor: string | null
          created_at: string
          created_by: string | null
          delete_reason: string | null
          deleted_at: string | null
          deleted_by: string | null
          descricao: string | null
          id: string
          is_deleted: boolean
          nome: string
          status: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          company_id: string
          cor?: string | null
          created_at?: string
          created_by?: string | null
          delete_reason?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          descricao?: string | null
          id?: string
          is_deleted?: boolean
          nome: string
          status?: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          company_id?: string
          cor?: string | null
          created_at?: string
          created_by?: string | null
          delete_reason?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          descricao?: string | null
          id?: string
          is_deleted?: boolean
          nome?: string
          status?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      crea_gov_tags: {
        Row: {
          company_id: string
          cor: string | null
          created_at: string
          created_by: string | null
          delete_reason: string | null
          deleted_at: string | null
          deleted_by: string | null
          id: string
          is_deleted: boolean
          nome: string
          regex_sugerido: string | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          company_id: string
          cor?: string | null
          created_at?: string
          created_by?: string | null
          delete_reason?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          id?: string
          is_deleted?: boolean
          nome: string
          regex_sugerido?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          company_id?: string
          cor?: string | null
          created_at?: string
          created_by?: string | null
          delete_reason?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          id?: string
          is_deleted?: boolean
          nome?: string
          regex_sugerido?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      crea_gov_user_filters: {
        Row: {
          company_id: string
          created_at: string
          filtros: Json
          id: string
          is_default: boolean
          nome: string
          updated_at: string
          user_id: string
        }
        Insert: {
          company_id: string
          created_at?: string
          filtros?: Json
          id?: string
          is_default?: boolean
          nome: string
          updated_at?: string
          user_id: string
        }
        Update: {
          company_id?: string
          created_at?: string
          filtros?: Json
          id?: string
          is_default?: boolean
          nome?: string
          updated_at?: string
          user_id?: string
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
          can_governance: boolean
          can_governance_audit: boolean
          can_governance_finance: boolean
          can_governance_import: boolean
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
          can_governance?: boolean
          can_governance_audit?: boolean
          can_governance_finance?: boolean
          can_governance_import?: boolean
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
          can_governance?: boolean
          can_governance_audit?: boolean
          can_governance_finance?: boolean
          can_governance_import?: boolean
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
          feature_flags: Json
          id: string
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          data?: Json | null
          enabled?: boolean
          feature_flags?: Json
          id?: string
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          data?: Json | null
          enabled?: boolean
          feature_flags?: Json
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      crea_norms: {
        Row: {
          anexo_url: string | null
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
          anexo_url?: string | null
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
          anexo_url?: string | null
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
          anexo_url: string | null
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
          anexo_url?: string | null
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
          anexo_url?: string | null
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
          anexo_url: string | null
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
          anexo_url?: string | null
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
          anexo_url?: string | null
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
          anexo_url: string | null
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
          anexo_url?: string | null
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
          anexo_url?: string | null
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
          base: string | null
          cnpj: string | null
          created_at: string
          current_city: string | null
          current_site: string | null
          data: Json | null
          delete_reason: string | null
          deleted_at: string | null
          deleted_by: string | null
          estados_atuacao: string[] | null
          id: string
          is_deleted: boolean | null
          leader_phone: string | null
          lider: string | null
          membros: Json | null
          nome: string
          quantidade_equipes: number | null
          scopes: string[] | null
          site_id: string | null
          status: string | null
          technicians: Json | null
          uf_base: string | null
          updated_at: string
        }
        Insert: {
          base?: string | null
          cnpj?: string | null
          created_at?: string
          current_city?: string | null
          current_site?: string | null
          data?: Json | null
          delete_reason?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          estados_atuacao?: string[] | null
          id?: string
          is_deleted?: boolean | null
          leader_phone?: string | null
          lider?: string | null
          membros?: Json | null
          nome: string
          quantidade_equipes?: number | null
          scopes?: string[] | null
          site_id?: string | null
          status?: string | null
          technicians?: Json | null
          uf_base?: string | null
          updated_at?: string
        }
        Update: {
          base?: string | null
          cnpj?: string | null
          created_at?: string
          current_city?: string | null
          current_site?: string | null
          data?: Json | null
          delete_reason?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          estados_atuacao?: string[] | null
          id?: string
          is_deleted?: boolean | null
          leader_phone?: string | null
          lider?: string | null
          membros?: Json | null
          nome?: string
          quantidade_equipes?: number | null
          scopes?: string[] | null
          site_id?: string | null
          status?: string | null
          technicians?: Json | null
          uf_base?: string | null
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
          meta: Json
          ordem: number | null
          value: string
        }
        Insert: {
          ativo?: boolean | null
          field_key: string
          id?: string
          label?: string | null
          meta?: Json
          ordem?: number | null
          value: string
        }
        Update: {
          ativo?: boolean | null
          field_key?: string
          id?: string
          label?: string | null
          meta?: Json
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
          auxiliar: string | null
          categoria: string | null
          centro_custo: string | null
          conta_financeira: string | null
          coordenador: string | null
          created_at: string
          created_by: string | null
          data_finalizacao_compra: string | null
          data_finalizacao_logistica: string | null
          data_solicitacao: string | null
          id: string
          item_descricao: string | null
          numero_documento: string
          observacao: string | null
          responsavel: string | null
          solicit_id: string
          status: string | null
          tipo_documento: string
          updated_at: string
        }
        Insert: {
          auxiliar?: string | null
          categoria?: string | null
          centro_custo?: string | null
          conta_financeira?: string | null
          coordenador?: string | null
          created_at?: string
          created_by?: string | null
          data_finalizacao_compra?: string | null
          data_finalizacao_logistica?: string | null
          data_solicitacao?: string | null
          id?: string
          item_descricao?: string | null
          numero_documento: string
          observacao?: string | null
          responsavel?: string | null
          solicit_id: string
          status?: string | null
          tipo_documento: string
          updated_at?: string
        }
        Update: {
          auxiliar?: string | null
          categoria?: string | null
          centro_custo?: string | null
          conta_financeira?: string | null
          coordenador?: string | null
          created_at?: string
          created_by?: string | null
          data_finalizacao_compra?: string | null
          data_finalizacao_logistica?: string | null
          data_solicitacao?: string | null
          id?: string
          item_descricao?: string | null
          numero_documento?: string
          observacao?: string | null
          responsavel?: string | null
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
      fin_bank_accounts: {
        Row: {
          account_type: string
          balance: number | null
          bank_name: string
          created_at: string
          currency: string | null
          id: string
          is_active: boolean | null
          open_finance_id: string | null
          profile_id: string
        }
        Insert: {
          account_type: string
          balance?: number | null
          bank_name: string
          created_at?: string
          currency?: string | null
          id?: string
          is_active?: boolean | null
          open_finance_id?: string | null
          profile_id: string
        }
        Update: {
          account_type?: string
          balance?: number | null
          bank_name?: string
          created_at?: string
          currency?: string | null
          id?: string
          is_active?: boolean | null
          open_finance_id?: string | null
          profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fin_bank_accounts_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "fin_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      fin_bills: {
        Row: {
          amount: number
          category_id: string | null
          created_at: string
          due_date: string
          id: string
          profile_id: string
          status: string
          supplier_customer_id: string | null
          title: string
          type: string
        }
        Insert: {
          amount: number
          category_id?: string | null
          created_at?: string
          due_date: string
          id?: string
          profile_id: string
          status?: string
          supplier_customer_id?: string | null
          title: string
          type: string
        }
        Update: {
          amount?: number
          category_id?: string | null
          created_at?: string
          due_date?: string
          id?: string
          profile_id?: string
          status?: string
          supplier_customer_id?: string | null
          title?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "fin_bills_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "fin_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fin_bills_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "fin_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      fin_categories: {
        Row: {
          color: string | null
          icon: string | null
          id: string
          is_system: boolean | null
          name: string
          parent_id: string | null
          profile_id: string | null
          type: string
        }
        Insert: {
          color?: string | null
          icon?: string | null
          id?: string
          is_system?: boolean | null
          name: string
          parent_id?: string | null
          profile_id?: string | null
          type: string
        }
        Update: {
          color?: string | null
          icon?: string | null
          id?: string
          is_system?: boolean | null
          name?: string
          parent_id?: string | null
          profile_id?: string | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "fin_categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "fin_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fin_categories_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "fin_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      fin_cost_centers: {
        Row: {
          budget_limit: number | null
          code: string | null
          company_id: string
          id: string
          is_active: boolean | null
          name: string
        }
        Insert: {
          budget_limit?: number | null
          code?: string | null
          company_id: string
          id?: string
          is_active?: boolean | null
          name: string
        }
        Update: {
          budget_limit?: number | null
          code?: string | null
          company_id?: string
          id?: string
          is_active?: boolean | null
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "fin_cost_centers_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      fin_credit_cards: {
        Row: {
          bank_account_id: string | null
          brand: string | null
          closing_day: number | null
          created_at: string
          due_day: number | null
          id: string
          limit_amount: number | null
          name: string
          profile_id: string
        }
        Insert: {
          bank_account_id?: string | null
          brand?: string | null
          closing_day?: number | null
          created_at?: string
          due_day?: number | null
          id?: string
          limit_amount?: number | null
          name: string
          profile_id: string
        }
        Update: {
          bank_account_id?: string | null
          brand?: string | null
          closing_day?: number | null
          created_at?: string
          due_day?: number | null
          id?: string
          limit_amount?: number | null
          name?: string
          profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fin_credit_cards_bank_account_id_fkey"
            columns: ["bank_account_id"]
            isOneToOne: false
            referencedRelation: "fin_bank_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fin_credit_cards_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "fin_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      fin_debts: {
        Row: {
          created_at: string
          creditor: string
          id: string
          interest_rate: number | null
          profile_id: string
          status: string | null
          total_amount: number
        }
        Insert: {
          created_at?: string
          creditor: string
          id?: string
          interest_rate?: number | null
          profile_id: string
          status?: string | null
          total_amount: number
        }
        Update: {
          created_at?: string
          creditor?: string
          id?: string
          interest_rate?: number | null
          profile_id?: string
          status?: string | null
          total_amount?: number
        }
        Relationships: [
          {
            foreignKeyName: "fin_debts_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "fin_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      fin_goals: {
        Row: {
          created_at: string
          current_amount: number | null
          deadline: string | null
          icon: string | null
          id: string
          name: string
          profile_id: string
          target_amount: number
        }
        Insert: {
          created_at?: string
          current_amount?: number | null
          deadline?: string | null
          icon?: string | null
          id?: string
          name: string
          profile_id: string
          target_amount: number
        }
        Update: {
          created_at?: string
          current_amount?: number | null
          deadline?: string | null
          icon?: string | null
          id?: string
          name?: string
          profile_id?: string
          target_amount?: number
        }
        Relationships: [
          {
            foreignKeyName: "fin_goals_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "fin_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      fin_profiles: {
        Row: {
          company_id: string | null
          created_at: string
          id: string
          is_active: boolean | null
          name: string
          settings: Json | null
          type: Database["public"]["Enums"]["financial_profile_type"]
          user_id: string
        }
        Insert: {
          company_id?: string | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          name: string
          settings?: Json | null
          type?: Database["public"]["Enums"]["financial_profile_type"]
          user_id: string
        }
        Update: {
          company_id?: string | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          name?: string
          settings?: Json | null
          type?: Database["public"]["Enums"]["financial_profile_type"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fin_profiles_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      fin_transactions: {
        Row: {
          account_id: string | null
          amount: number
          attachment_url: string | null
          category_id: string | null
          cost_center_id: string | null
          created_at: string
          credit_card_id: string | null
          date: string
          description: string
          id: string
          is_recurring: boolean | null
          profile_id: string
          recurring_period: string | null
          status: string
          tags: string[] | null
          type: string
        }
        Insert: {
          account_id?: string | null
          amount: number
          attachment_url?: string | null
          category_id?: string | null
          cost_center_id?: string | null
          created_at?: string
          credit_card_id?: string | null
          date?: string
          description: string
          id?: string
          is_recurring?: boolean | null
          profile_id: string
          recurring_period?: string | null
          status?: string
          tags?: string[] | null
          type: string
        }
        Update: {
          account_id?: string | null
          amount?: number
          attachment_url?: string | null
          category_id?: string | null
          cost_center_id?: string | null
          created_at?: string
          credit_card_id?: string | null
          date?: string
          description?: string
          id?: string
          is_recurring?: boolean | null
          profile_id?: string
          recurring_period?: string | null
          status?: string
          tags?: string[] | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "fin_transactions_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "fin_bank_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fin_transactions_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "fin_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fin_transactions_cost_center_id_fkey"
            columns: ["cost_center_id"]
            isOneToOne: false
            referencedRelation: "fin_cost_centers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fin_transactions_credit_card_id_fkey"
            columns: ["credit_card_id"]
            isOneToOne: false
            referencedRelation: "fin_credit_cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fin_transactions_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "fin_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      financial_security_alerts: {
        Row: {
          alert_type: string
          company_id: string
          created_at: string | null
          description: string | null
          details: Json | null
          id: string
          module: string | null
          resolved_at: string | null
          resolved_by: string | null
          severity: string | null
          status: string | null
          triggered_by: string | null
        }
        Insert: {
          alert_type: string
          company_id: string
          created_at?: string | null
          description?: string | null
          details?: Json | null
          id?: string
          module?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: string | null
          status?: string | null
          triggered_by?: string | null
        }
        Update: {
          alert_type?: string
          company_id?: string
          created_at?: string | null
          description?: string | null
          details?: Json | null
          id?: string
          module?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: string | null
          status?: string | null
          triggered_by?: string | null
        }
        Relationships: []
      }
      gov_dataset_columns: {
        Row: {
          col_index: number
          col_letter: string
          data_type: string
          format_hint: string | null
          formula_excel: string | null
          formula_js: string | null
          formula_purpose: string | null
          header: string
          id: string
          ignored: boolean
          is_formula: boolean
          key_normalized: string | null
          sheet_id: string
          width: number | null
        }
        Insert: {
          col_index: number
          col_letter: string
          data_type?: string
          format_hint?: string | null
          formula_excel?: string | null
          formula_js?: string | null
          formula_purpose?: string | null
          header: string
          id?: string
          ignored?: boolean
          is_formula?: boolean
          key_normalized?: string | null
          sheet_id: string
          width?: number | null
        }
        Update: {
          col_index?: number
          col_letter?: string
          data_type?: string
          format_hint?: string | null
          formula_excel?: string | null
          formula_js?: string | null
          formula_purpose?: string | null
          header?: string
          id?: string
          ignored?: boolean
          is_formula?: boolean
          key_normalized?: string | null
          sheet_id?: string
          width?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "gov_dataset_columns_sheet_id_fkey"
            columns: ["sheet_id"]
            isOneToOne: false
            referencedRelation: "gov_dataset_sheets"
            referencedColumns: ["id"]
          },
        ]
      }
      gov_dataset_rows: {
        Row: {
          computed: Json | null
          created_at: string
          id: string
          row_index: number
          sheet_id: string
          updated_at: string
          values: Json
        }
        Insert: {
          computed?: Json | null
          created_at?: string
          id?: string
          row_index: number
          sheet_id: string
          updated_at?: string
          values?: Json
        }
        Update: {
          computed?: Json | null
          created_at?: string
          id?: string
          row_index?: number
          sheet_id?: string
          updated_at?: string
          values?: Json
        }
        Relationships: [
          {
            foreignKeyName: "gov_dataset_rows_sheet_id_fkey"
            columns: ["sheet_id"]
            isOneToOne: false
            referencedRelation: "gov_dataset_sheets"
            referencedColumns: ["id"]
          },
        ]
      }
      gov_dataset_sheets: {
        Row: {
          col_count: number | null
          created_at: string
          dataset_id: string
          header_row_index: number | null
          id: string
          row_count: number | null
          sheet_name: string
          sheet_order: number | null
        }
        Insert: {
          col_count?: number | null
          created_at?: string
          dataset_id: string
          header_row_index?: number | null
          id?: string
          row_count?: number | null
          sheet_name: string
          sheet_order?: number | null
        }
        Update: {
          col_count?: number | null
          created_at?: string
          dataset_id?: string
          header_row_index?: number | null
          id?: string
          row_count?: number | null
          sheet_name?: string
          sheet_order?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "gov_dataset_sheets_dataset_id_fkey"
            columns: ["dataset_id"]
            isOneToOne: false
            referencedRelation: "gov_datasets"
            referencedColumns: ["id"]
          },
        ]
      }
      gov_datasets: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          module_key: string
          name: string
          sheet_count: number | null
          source_filename: string | null
          updated_at: string
          uploaded_by: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          module_key?: string
          name: string
          sheet_count?: number | null
          source_filename?: string | null
          updated_at?: string
          uploaded_by?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          module_key?: string
          name?: string
          sheet_count?: number | null
          source_filename?: string | null
          updated_at?: string
          uploaded_by?: string | null
        }
        Relationships: []
      }
      governance_action_plan: {
        Row: {
          acao: string | null
          ano: number | null
          area: string | null
          causa_raiz: string | null
          cliente: string | null
          created_at: string
          created_by: string | null
          descricao: string | null
          evidencia: string | null
          id: string
          mes: number | null
          module_key: string
          observacoes: string | null
          ofensor: string | null
          prazo: string | null
          prioridade: string
          responsavel: string | null
          resultado_esperado: string | null
          semana: string | null
          status: string
          titulo: string
          updated_at: string
        }
        Insert: {
          acao?: string | null
          ano?: number | null
          area?: string | null
          causa_raiz?: string | null
          cliente?: string | null
          created_at?: string
          created_by?: string | null
          descricao?: string | null
          evidencia?: string | null
          id?: string
          mes?: number | null
          module_key?: string
          observacoes?: string | null
          ofensor?: string | null
          prazo?: string | null
          prioridade?: string
          responsavel?: string | null
          resultado_esperado?: string | null
          semana?: string | null
          status?: string
          titulo: string
          updated_at?: string
        }
        Update: {
          acao?: string | null
          ano?: number | null
          area?: string | null
          causa_raiz?: string | null
          cliente?: string | null
          created_at?: string
          created_by?: string | null
          descricao?: string | null
          evidencia?: string | null
          id?: string
          mes?: number | null
          module_key?: string
          observacoes?: string | null
          ofensor?: string | null
          prazo?: string | null
          prioridade?: string
          responsavel?: string | null
          resultado_esperado?: string | null
          semana?: string | null
          status?: string
          titulo?: string
          updated_at?: string
        }
        Relationships: []
      }
      governance_settings: {
        Row: {
          edit_open_to_all: boolean
          id: boolean
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          edit_open_to_all?: boolean
          id?: boolean
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          edit_open_to_all?: boolean
          id?: boolean
          updated_at?: string
          updated_by?: string | null
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
      jarbas_checklists: {
        Row: {
          created_at: string
          id: string
          module_key: string
          name: string
          steps: Json
        }
        Insert: {
          created_at?: string
          id?: string
          module_key: string
          name: string
          steps: Json
        }
        Update: {
          created_at?: string
          id?: string
          module_key?: string
          name?: string
          steps?: Json
        }
        Relationships: []
      }
      jarbas_instruction_documents: {
        Row: {
          content: string
          created_at: string
          document_type: string | null
          id: string
          is_active: boolean | null
          module_key: string
          tags: string[] | null
          title: string
        }
        Insert: {
          content: string
          created_at?: string
          document_type?: string | null
          id?: string
          is_active?: boolean | null
          module_key: string
          tags?: string[] | null
          title: string
        }
        Update: {
          content?: string
          created_at?: string
          document_type?: string | null
          id?: string
          is_active?: boolean | null
          module_key?: string
          tags?: string[] | null
          title?: string
        }
        Relationships: []
      }
      jarbas_logs: {
        Row: {
          command: string | null
          created_at: string
          id: string
          response: string | null
          user_id: string
          was_voice: boolean | null
        }
        Insert: {
          command?: string | null
          created_at?: string
          id?: string
          response?: string | null
          user_id: string
          was_voice?: boolean | null
        }
        Update: {
          command?: string | null
          created_at?: string
          id?: string
          response?: string | null
          user_id?: string
          was_voice?: boolean | null
        }
        Relationships: []
      }
      jarbas_operational_context: {
        Row: {
          active_activity: string | null
          active_os_id: string | null
          checklist_id: string | null
          company_id: string | null
          current_module: string | null
          current_step_index: number | null
          id: string
          last_location: Json | null
          updated_at: string
          user_id: string
        }
        Insert: {
          active_activity?: string | null
          active_os_id?: string | null
          checklist_id?: string | null
          company_id?: string | null
          current_module?: string | null
          current_step_index?: number | null
          id?: string
          last_location?: Json | null
          updated_at?: string
          user_id: string
        }
        Update: {
          active_activity?: string | null
          active_os_id?: string | null
          checklist_id?: string | null
          company_id?: string | null
          current_module?: string | null
          current_step_index?: number | null
          id?: string
          last_location?: Json | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "jarbas_operational_context_checklist_id_fkey"
            columns: ["checklist_id"]
            isOneToOne: false
            referencedRelation: "jarbas_checklists"
            referencedColumns: ["id"]
          },
        ]
      }
      jarbas_operational_memory: {
        Row: {
          created_at: string
          expires_at: string | null
          id: string
          key: string
          updated_at: string
          user_id: string
          value: Json
        }
        Insert: {
          created_at?: string
          expires_at?: string | null
          id?: string
          key: string
          updated_at?: string
          user_id: string
          value: Json
        }
        Update: {
          created_at?: string
          expires_at?: string | null
          id?: string
          key?: string
          updated_at?: string
          user_id?: string
          value?: Json
        }
        Relationships: []
      }
      jarbas_safety_logs: {
        Row: {
          company_id: string | null
          context: Json | null
          created_at: string
          description: string
          event_type: string
          id: string
          module_key: string | null
          severity: string
          user_id: string
        }
        Insert: {
          company_id?: string | null
          context?: Json | null
          created_at?: string
          description: string
          event_type: string
          id?: string
          module_key?: string | null
          severity: string
          user_id: string
        }
        Update: {
          company_id?: string | null
          context?: Json | null
          created_at?: string
          description?: string
          event_type?: string
          id?: string
          module_key?: string | null
          severity?: string
          user_id?: string
        }
        Relationships: []
      }
      jarbas_training_patterns: {
        Row: {
          created_at: string
          description: string | null
          frequency: number | null
          id: string
          metadata: Json | null
          module_key: string | null
          pattern_type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          frequency?: number | null
          id?: string
          metadata?: Json | null
          module_key?: string | null
          pattern_type: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          frequency?: number | null
          id?: string
          metadata?: Json | null
          module_key?: string | null
          pattern_type?: string
          updated_at?: string
        }
        Relationships: []
      }
      market_carts: {
        Row: {
          id: string
          items: Json | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          id?: string
          items?: Json | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          id?: string
          items?: Json | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      market_categories: {
        Row: {
          created_at: string
          id: string
          image_url: string | null
          is_active: boolean | null
          name: string
          parent_id: string | null
          slug: string
        }
        Insert: {
          created_at?: string
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          name: string
          parent_id?: string | null
          slug: string
        }
        Update: {
          created_at?: string
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          name?: string
          parent_id?: string | null
          slug?: string
        }
        Relationships: [
          {
            foreignKeyName: "market_categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "market_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      market_coupons: {
        Row: {
          code: string
          created_at: string | null
          expires_at: string | null
          id: string
          is_active: boolean | null
          min_purchase_amount: number | null
          starts_at: string | null
          store_id: string | null
          type: string
          usage_count: number | null
          usage_limit: number | null
          value: number
        }
        Insert: {
          code: string
          created_at?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          min_purchase_amount?: number | null
          starts_at?: string | null
          store_id?: string | null
          type: string
          usage_count?: number | null
          usage_limit?: number | null
          value: number
        }
        Update: {
          code?: string
          created_at?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          min_purchase_amount?: number | null
          starts_at?: string | null
          store_id?: string | null
          type?: string
          usage_count?: number | null
          usage_limit?: number | null
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "market_coupons_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "market_stores"
            referencedColumns: ["id"]
          },
        ]
      }
      market_customers: {
        Row: {
          address: Json | null
          created_at: string | null
          document: string | null
          email: string
          full_name: string
          id: string
          phone: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          address?: Json | null
          created_at?: string | null
          document?: string | null
          email: string
          full_name: string
          id?: string
          phone?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          address?: Json | null
          created_at?: string | null
          document?: string | null
          email?: string
          full_name?: string
          id?: string
          phone?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      market_inventory_movements: {
        Row: {
          created_at: string | null
          id: string
          product_id: string
          quantity: number
          reason: string | null
          reference_id: string | null
          type: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          product_id: string
          quantity: number
          reason?: string | null
          reference_id?: string | null
          type: string
        }
        Update: {
          created_at?: string | null
          id?: string
          product_id?: string
          quantity?: number
          reason?: string | null
          reference_id?: string | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "market_inventory_movements_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "market_products"
            referencedColumns: ["id"]
          },
        ]
      }
      market_messages: {
        Row: {
          created_at: string | null
          customer_id: string
          id: string
          message: string
          order_id: string | null
          read_at: string | null
          sender_type: string
          store_id: string
        }
        Insert: {
          created_at?: string | null
          customer_id: string
          id?: string
          message: string
          order_id?: string | null
          read_at?: string | null
          sender_type: string
          store_id: string
        }
        Update: {
          created_at?: string | null
          customer_id?: string
          id?: string
          message?: string
          order_id?: string | null
          read_at?: string | null
          sender_type?: string
          store_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "market_messages_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "market_customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "market_messages_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "market_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "market_messages_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "market_stores"
            referencedColumns: ["id"]
          },
        ]
      }
      market_order_items: {
        Row: {
          id: string
          order_id: string | null
          price_at_purchase: number
          product_id: string | null
          quantity: number
        }
        Insert: {
          id?: string
          order_id?: string | null
          price_at_purchase: number
          product_id?: string | null
          quantity: number
        }
        Update: {
          id?: string
          order_id?: string | null
          price_at_purchase?: number
          product_id?: string | null
          quantity?: number
        }
        Relationships: [
          {
            foreignKeyName: "market_order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "market_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "market_order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "market_products"
            referencedColumns: ["id"]
          },
        ]
      }
      market_orders: {
        Row: {
          created_at: string
          id: string
          payment_method: string | null
          shipping_address: Json | null
          shipping_cost: number | null
          status: string
          store_id: string | null
          total_amount: number
          tracking_code: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          payment_method?: string | null
          shipping_address?: Json | null
          shipping_cost?: number | null
          status?: string
          store_id?: string | null
          total_amount: number
          tracking_code?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          payment_method?: string | null
          shipping_address?: Json | null
          shipping_cost?: number | null
          status?: string
          store_id?: string | null
          total_amount?: number
          tracking_code?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "market_orders_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "market_stores"
            referencedColumns: ["id"]
          },
        ]
      }
      market_products: {
        Row: {
          category_id: string | null
          created_at: string
          description: string | null
          id: string
          images: string[] | null
          is_active: boolean | null
          min_stock_alert: number | null
          name: string
          price: number
          promo_price: number | null
          sku: string | null
          slug: string
          specifications: Json | null
          stock_quantity: number | null
          store_id: string
          updated_at: string
        }
        Insert: {
          category_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          images?: string[] | null
          is_active?: boolean | null
          min_stock_alert?: number | null
          name: string
          price: number
          promo_price?: number | null
          sku?: string | null
          slug: string
          specifications?: Json | null
          stock_quantity?: number | null
          store_id: string
          updated_at?: string
        }
        Update: {
          category_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          images?: string[] | null
          is_active?: boolean | null
          min_stock_alert?: number | null
          name?: string
          price?: number
          promo_price?: number | null
          sku?: string | null
          slug?: string
          specifications?: Json | null
          stock_quantity?: number | null
          store_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "market_products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "market_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "market_products_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "market_stores"
            referencedColumns: ["id"]
          },
        ]
      }
      market_stores: {
        Row: {
          banner_url: string | null
          commission_rate: number | null
          company_id: string
          created_at: string
          description: string | null
          id: string
          logo_url: string | null
          name: string
          rating: number | null
          slug: string
          status: string
        }
        Insert: {
          banner_url?: string | null
          commission_rate?: number | null
          company_id: string
          created_at?: string
          description?: string | null
          id?: string
          logo_url?: string | null
          name: string
          rating?: number | null
          slug: string
          status?: string
        }
        Update: {
          banner_url?: string | null
          commission_rate?: number | null
          company_id?: string
          created_at?: string
          description?: string | null
          id?: string
          logo_url?: string | null
          name?: string
          rating?: number | null
          slug?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "market_stores_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
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
      ocs_guard_compliance_checks: {
        Row: {
          category: string
          company_id: string | null
          id: string
          question: string
          recommendation: string | null
          status: string | null
          updated_at: string
        }
        Insert: {
          category: string
          company_id?: string | null
          id?: string
          question: string
          recommendation?: string | null
          status?: string | null
          updated_at?: string
        }
        Update: {
          category?: string
          company_id?: string | null
          id?: string
          question?: string
          recommendation?: string | null
          status?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ocs_guard_compliance_checks_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      ocs_guard_incidents: {
        Row: {
          company_id: string | null
          containment_steps: Json | null
          created_at: string
          description: string | null
          id: string
          reporter_id: string | null
          resolved_at: string | null
          severity: string
          status: string
          title: string
        }
        Insert: {
          company_id?: string | null
          containment_steps?: Json | null
          created_at?: string
          description?: string | null
          id?: string
          reporter_id?: string | null
          resolved_at?: string | null
          severity: string
          status?: string
          title: string
        }
        Update: {
          company_id?: string | null
          containment_steps?: Json | null
          created_at?: string
          description?: string | null
          id?: string
          reporter_id?: string | null
          resolved_at?: string | null
          severity?: string
          status?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "ocs_guard_incidents_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      ocs_guard_security_logs: {
        Row: {
          created_at: string
          description: string | null
          event_type: string
          id: string
          ip_address: string | null
          severity: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          event_type: string
          id?: string
          ip_address?: string | null
          severity: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          event_type?: string
          id?: string
          ip_address?: string | null
          severity?: string
          user_agent?: string | null
          user_id?: string | null
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
      pixel_agent_conversations: {
        Row: {
          company_id: string | null
          created_at: string
          id: string
          is_deleted: boolean
          module_key: string
          title: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          company_id?: string | null
          created_at?: string
          id?: string
          is_deleted?: boolean
          module_key: string
          title?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          company_id?: string | null
          created_at?: string
          id?: string
          is_deleted?: boolean
          module_key?: string
          title?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pixel_agent_conversations_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      pixel_agent_messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          role: string
          tool_results: Json | null
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          role: string
          tool_results?: Json | null
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          role?: string
          tool_results?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "pixel_agent_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "pixel_agent_conversations"
            referencedColumns: ["id"]
          },
        ]
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
          z_index: number
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
          z_index?: number
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
          z_index?: number
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
      pixel_furniture: {
        Row: {
          created_at: string
          furniture_key: string
          id: string
          is_active: boolean
          is_locked: boolean
          name: string | null
          position_x: number
          position_y: number
          rotation: number
          updated_at: string
          workspace_id: string
          z_index: number
        }
        Insert: {
          created_at?: string
          furniture_key: string
          id?: string
          is_active?: boolean
          is_locked?: boolean
          name?: string | null
          position_x?: number
          position_y?: number
          rotation?: number
          updated_at?: string
          workspace_id: string
          z_index?: number
        }
        Update: {
          created_at?: string
          furniture_key?: string
          id?: string
          is_active?: boolean
          is_locked?: boolean
          name?: string | null
          position_x?: number
          position_y?: number
          rotation?: number
          updated_at?: string
          workspace_id?: string
          z_index?: number
        }
        Relationships: [
          {
            foreignKeyName: "pixel_furniture_workspace_id_fkey"
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
          is_typing: boolean | null
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
          is_typing?: boolean | null
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
          is_typing?: boolean | null
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
          last_heartbeat: string | null
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
          last_heartbeat?: string | null
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
          last_heartbeat?: string | null
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
          z_index: number
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
          z_index?: number
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
          z_index?: number
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
          company_id: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          last_login_at: string | null
          role: string | null
          session_timeout_minutes: number | null
          two_factor_enabled: boolean | null
        }
        Insert: {
          company_id?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          last_login_at?: string | null
          role?: string | null
          session_timeout_minutes?: number | null
          two_factor_enabled?: boolean | null
        }
        Update: {
          company_id?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          last_login_at?: string | null
          role?: string | null
          session_timeout_minutes?: number | null
          two_factor_enabled?: boolean | null
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
      security_approvals: {
        Row: {
          action_type: string
          approved_by: string | null
          company_id: string
          created_at: string | null
          id: string
          module: string
          payload: Json | null
          reason: string | null
          requested_by: string
          status: string | null
          updated_at: string | null
        }
        Insert: {
          action_type: string
          approved_by?: string | null
          company_id: string
          created_at?: string | null
          id?: string
          module: string
          payload?: Json | null
          reason?: string | null
          requested_by: string
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          action_type?: string
          approved_by?: string | null
          company_id?: string
          created_at?: string | null
          id?: string
          module?: string
          payload?: Json | null
          reason?: string | null
          requested_by?: string
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      security_audit_logs: {
        Row: {
          action_type: string
          company_id: string | null
          created_at: string | null
          description: string | null
          id: string
          ip_address: string | null
          module: string
          payload: Json | null
          severity: string | null
          user_agent: string | null
          user_id: string
        }
        Insert: {
          action_type: string
          company_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          ip_address?: string | null
          module: string
          payload?: Json | null
          severity?: string | null
          user_agent?: string | null
          user_id: string
        }
        Update: {
          action_type?: string
          company_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          ip_address?: string | null
          module?: string
          payload?: Json | null
          severity?: string | null
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      security_emergency_mode: {
        Row: {
          activated_at: string | null
          activated_by: string
          company_id: string
          deactivated_at: string | null
          id: string
          reason: string | null
          status: boolean | null
        }
        Insert: {
          activated_at?: string | null
          activated_by: string
          company_id: string
          deactivated_at?: string | null
          id?: string
          reason?: string | null
          status?: boolean | null
        }
        Update: {
          activated_at?: string | null
          activated_by?: string
          company_id?: string
          deactivated_at?: string | null
          id?: string
          reason?: string | null
          status?: boolean | null
        }
        Relationships: []
      }
      security_policies: {
        Row: {
          company_id: string
          created_at: string | null
          id: string
          is_active: boolean | null
          policy_type: string
          settings: Json
          updated_at: string | null
        }
        Insert: {
          company_id: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          policy_type: string
          settings?: Json
          updated_at?: string | null
        }
        Update: {
          company_id?: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          policy_type?: string
          settings?: Json
          updated_at?: string | null
        }
        Relationships: []
      }
      security_scores: {
        Row: {
          company_id: string
          eng_score: number | null
          finance_score: number | null
          hr_score: number | null
          id: string
          legal_score: number | null
          overall_score: number | null
          updated_at: string | null
        }
        Insert: {
          company_id: string
          eng_score?: number | null
          finance_score?: number | null
          hr_score?: number | null
          id?: string
          legal_score?: number | null
          overall_score?: number | null
          updated_at?: string | null
        }
        Update: {
          company_id?: string
          eng_score?: number | null
          finance_score?: number | null
          hr_score?: number | null
          id?: string
          legal_score?: number | null
          overall_score?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      security_vault: {
        Row: {
          company_id: string
          created_at: string | null
          encrypted_secret: string | null
          id: string
          integration_name: string
          key_hint: string | null
          last_accessed_at: string | null
        }
        Insert: {
          company_id: string
          created_at?: string | null
          encrypted_secret?: string | null
          id?: string
          integration_name: string
          key_hint?: string | null
          last_accessed_at?: string | null
        }
        Update: {
          company_id?: string
          created_at?: string | null
          encrypted_secret?: string | null
          id?: string
          integration_name?: string
          key_hint?: string | null
          last_accessed_at?: string | null
        }
        Relationships: []
      }
      security_vulnerabilities: {
        Row: {
          company_id: string
          description: string | null
          detected_at: string | null
          id: string
          mitigation_plan: string | null
          module: string
          resolved_at: string | null
          risk_level: string
          status: string | null
        }
        Insert: {
          company_id: string
          description?: string | null
          detected_at?: string | null
          id?: string
          mitigation_plan?: string | null
          module: string
          resolved_at?: string | null
          risk_level: string
          status?: string | null
        }
        Update: {
          company_id?: string
          description?: string | null
          detected_at?: string | null
          id?: string
          mitigation_plan?: string | null
          module?: string
          resolved_at?: string | null
          risk_level?: string
          status?: string | null
        }
        Relationships: []
      }
      theme_audit_logs: {
        Row: {
          action_type: string
          after_data: Json | null
          before_data: Json | null
          company_id: string | null
          created_at: string
          id: string
          user_id: string | null
        }
        Insert: {
          action_type: string
          after_data?: Json | null
          before_data?: Json | null
          company_id?: string | null
          created_at?: string
          id?: string
          user_id?: string | null
        }
        Update: {
          action_type?: string
          after_data?: Json | null
          before_data?: Json | null
          company_id?: string | null
          created_at?: string
          id?: string
          user_id?: string | null
        }
        Relationships: []
      }
      theme_permissions: {
        Row: {
          can_manage: boolean
          can_manage_brand: boolean
          can_manage_charts: boolean
          can_view: boolean
          can_view_audit: boolean
          company_id: string | null
          created_at: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          can_manage?: boolean
          can_manage_brand?: boolean
          can_manage_charts?: boolean
          can_view?: boolean
          can_view_audit?: boolean
          company_id?: string | null
          created_at?: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          can_manage?: boolean
          can_manage_brand?: boolean
          can_manage_charts?: boolean
          can_view?: boolean
          can_view_audit?: boolean
          company_id?: string | null
          created_at?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      ti_access_requests: {
        Row: {
          action_type: string
          approved_at: string | null
          approved_by: string | null
          company_id: string
          created_at: string
          id: string
          module_key: string
          status: string
          user_id: string
        }
        Insert: {
          action_type: string
          approved_at?: string | null
          approved_by?: string | null
          company_id: string
          created_at?: string
          id?: string
          module_key: string
          status?: string
          user_id: string
        }
        Update: {
          action_type?: string
          approved_at?: string | null
          approved_by?: string | null
          company_id?: string
          created_at?: string
          id?: string
          module_key?: string
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      ti_assets: {
        Row: {
          company_id: string
          created_at: string
          id: string
          name: string
          notes: string | null
          purchase_date: string | null
          serial_number: string | null
          specification: Json | null
          status: string
          type: string
          updated_at: string | null
          user_id: string | null
          warranty_until: string | null
        }
        Insert: {
          company_id: string
          created_at?: string
          id?: string
          name: string
          notes?: string | null
          purchase_date?: string | null
          serial_number?: string | null
          specification?: Json | null
          status?: string
          type: string
          updated_at?: string | null
          user_id?: string | null
          warranty_until?: string | null
        }
        Update: {
          company_id?: string
          created_at?: string
          id?: string
          name?: string
          notes?: string | null
          purchase_date?: string | null
          serial_number?: string | null
          specification?: Json | null
          status?: string
          type?: string
          updated_at?: string | null
          user_id?: string | null
          warranty_until?: string | null
        }
        Relationships: []
      }
      ti_knowledge_base: {
        Row: {
          attachments: string[] | null
          category: string
          content: string
          created_at: string
          id: string
          tags: string[] | null
          title: string
        }
        Insert: {
          attachments?: string[] | null
          category: string
          content: string
          created_at?: string
          id?: string
          tags?: string[] | null
          title: string
        }
        Update: {
          attachments?: string[] | null
          category?: string
          content?: string
          created_at?: string
          id?: string
          tags?: string[] | null
          title?: string
        }
        Relationships: []
      }
      ti_security_incidents: {
        Row: {
          actions_taken: string | null
          created_at: string
          description: string
          evidence_urls: string[] | null
          id: string
          incident_type: string
          involved_user_id: string | null
          responsible_id: string | null
          severity: string
          status: string
          updated_at: string
        }
        Insert: {
          actions_taken?: string | null
          created_at?: string
          description: string
          evidence_urls?: string[] | null
          id?: string
          incident_type: string
          involved_user_id?: string | null
          responsible_id?: string | null
          severity: string
          status?: string
          updated_at?: string
        }
        Update: {
          actions_taken?: string | null
          created_at?: string
          description?: string
          evidence_urls?: string[] | null
          id?: string
          incident_type?: string
          involved_user_id?: string | null
          responsible_id?: string | null
          severity?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      ti_ticket_comments: {
        Row: {
          attachments: string[] | null
          content: string
          created_at: string
          id: string
          ticket_id: string
          user_id: string
        }
        Insert: {
          attachments?: string[] | null
          content: string
          created_at?: string
          id?: string
          ticket_id: string
          user_id: string
        }
        Update: {
          attachments?: string[] | null
          content?: string
          created_at?: string
          id?: string
          ticket_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ti_ticket_comments_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "ti_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      ti_ticket_history: {
        Row: {
          action: string
          created_at: string
          id: string
          new_value: string | null
          old_value: string | null
          ticket_id: string
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string
          id?: string
          new_value?: string | null
          old_value?: string | null
          ticket_id: string
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string
          id?: string
          new_value?: string | null
          old_value?: string | null
          ticket_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ti_ticket_history_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "ti_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      ti_tickets: {
        Row: {
          assigned_to: string | null
          attachments: string[] | null
          category: string
          company_id: string | null
          created_at: string
          description: string
          diagnostic_info: Json | null
          id: string
          module_key: string | null
          priority: string
          resolved_at: string | null
          sla_deadline: string | null
          status: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          assigned_to?: string | null
          attachments?: string[] | null
          category: string
          company_id?: string | null
          created_at?: string
          description: string
          diagnostic_info?: Json | null
          id?: string
          module_key?: string | null
          priority: string
          resolved_at?: string | null
          sla_deadline?: string | null
          status?: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          assigned_to?: string | null
          attachments?: string[] | null
          category?: string
          company_id?: string | null
          created_at?: string
          description?: string
          diagnostic_info?: Json | null
          id?: string
          module_key?: string | null
          priority?: string
          resolved_at?: string | null
          sla_deadline?: string | null
          status?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_chart_preferences: {
        Row: {
          company_id: string
          created_at: string
          id: string
          metric_key: string
          module_key: string
          selected_chart_type: string
          tab_key: string
          updated_at: string
          user_id: string
        }
        Insert: {
          company_id: string
          created_at?: string
          id?: string
          metric_key: string
          module_key: string
          selected_chart_type: string
          tab_key?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          company_id?: string
          created_at?: string
          id?: string
          metric_key?: string
          module_key?: string
          selected_chart_type?: string
          tab_key?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_layout_preferences: {
        Row: {
          company_id: string | null
          created_at: string
          dashboard_density: string
          id: string
          internal_sidebar_collapsed: boolean
          module_key: string
          table_density: string
          updated_at: string
          user_id: string
        }
        Insert: {
          company_id?: string | null
          created_at?: string
          dashboard_density?: string
          id?: string
          internal_sidebar_collapsed?: boolean
          module_key: string
          table_density?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          company_id?: string | null
          created_at?: string
          dashboard_density?: string
          id?: string
          internal_sidebar_collapsed?: boolean
          module_key?: string
          table_density?: string
          updated_at?: string
          user_id?: string
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
      acl_grant: {
        Args: {
          _company: string
          _key: string
          _reason: string
          _target: string
        }
        Returns: Json
      }
      acl_revoke: {
        Args: {
          _company: string
          _key: string
          _reason: string
          _target: string
        }
        Returns: Json
      }
      apply_calculated_value: { Args: { _company_id: string }; Returns: number }
      calc_company_plan_value: {
        Args: { _company_id: string }
        Returns: number
      }
      can: {
        Args: { _company?: string; _key: string; _uid: string }
        Returns: boolean
      }
      comm_can: {
        Args: { _action: string; _company: string; _uid: string }
        Returns: boolean
      }
      comm_log_audit: {
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
      comm_social_save_account: {
        Args: {
          _account_handle: string
          _account_name: string
          _client_brand: string
          _company: string
          _expires_at: string
          _external_id: string
          _id: string
          _metadata: Json
          _page_id: string
          _provider: string
          _refresh_token: string
          _scopes: string[]
          _token: string
        }
        Returns: Json
      }
      comm_social_set_master_key: { Args: { _pwd: string }; Returns: Json }
      comm_soft_delete: {
        Args: { _id: string; _reason: string; _table: string }
        Returns: Json
      }
      comm_workflow_transition: {
        Args: {
          _action: string
          _comentario?: string
          _entidade_id: string
          _entidade_tipo: string
        }
        Returns: Json
      }
      crea_can: {
        Args: { _action: string; _company: string; _uid: string }
        Returns: boolean
      }
      crea_gov_conciliate_manual: {
        Args: { _art: string; _motivo: string; _pagamento: string }
        Returns: Json
      }
      crea_gov_conciliate_run: { Args: { _company: string }; Returns: Json }
      crea_gov_conciliate_unlink: {
        Args: { _conciliacao: string; _motivo: string }
        Returns: Json
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
      ensure_current_profile: { Args: never; Returns: undefined }
      gov_can_edit: {
        Args: { _module: string; _uid: string }
        Returns: boolean
      }
      gov_edit_open: { Args: never; Returns: boolean }
      gov_module_for_sheet: { Args: { _sheet: string }; Returns: string }
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
      is_internal_ocs: { Args: { _uid: string }; Returns: boolean }
      is_platform_owner: { Args: { _uid: string }; Returns: boolean }
      set_company_master_password: {
        Args: {
          _company_id: string
          _current_password?: string
          _new_password: string
        }
        Returns: boolean
      }
      theme_can: {
        Args: { _action: string; _company: string; _uid: string }
        Returns: boolean
      }
      theme_restore_default: {
        Args: { _company: string; _reason: string }
        Returns: Json
      }
      theme_save: { Args: { _company: string; _payload: Json }; Returns: Json }
      ti_is_it_staff: { Args: never; Returns: boolean }
      trigger_financial_alert: {
        Args: {
          p_alert_type: string
          p_company_id: string
          p_description: string
          p_details: Json
          p_severity?: string
        }
        Returns: string
      }
      update_pixel_heartbeat: { Args: { _uid: string }; Returns: undefined }
      user_company: { Args: { _uid: string }; Returns: string }
      user_group_ids: { Args: { _user_id: string }; Returns: string[] }
      user_in_group: {
        Args: { _group_id: string; _user_id: string }
        Returns: boolean
      }
      verify_company_master_password: {
        Args: { _company_id: string; _password: string }
        Returns: boolean
      }
    }
    Enums: {
      ai_action_classification:
        | "informativa"
        | "operacional"
        | "administrativa"
        | "critica"
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
        | "comunicacao_admin"
        | "social_media"
        | "designer"
        | "redator"
        | "aprovador"
        | "gestor_produto"
      financial_profile_type: "personal" | "business_small" | "corporate"
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
      ai_action_classification: [
        "informativa",
        "operacional",
        "administrativa",
        "critica",
      ],
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
        "comunicacao_admin",
        "social_media",
        "designer",
        "redator",
        "aprovador",
        "gestor_produto",
      ],
      financial_profile_type: ["personal", "business_small", "corporate"],
    },
  },
} as const
