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
          avatar_clothes_key: string | null
          avatar_hair_key: string | null
          avatar_sprite_key: string | null
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
          avatar_clothes_key?: string | null
          avatar_hair_key?: string | null
          avatar_sprite_key?: string | null
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
          avatar_clothes_key?: string | null
          avatar_hair_key?: string | null
          avatar_sprite_key?: string | null
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
      app_role: "admin" | "user"
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
      app_role: ["admin", "user"],
    },
  },
} as const
