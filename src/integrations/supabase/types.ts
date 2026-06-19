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
      ai_memories: {
        Row: {
          context: string
          created_at: string
          embedding: string | null
          id: string
          lead_id: string | null
          unit_id: string
        }
        Insert: {
          context: string
          created_at?: string
          embedding?: string | null
          id?: string
          lead_id?: string | null
          unit_id: string
        }
        Update: {
          context?: string
          created_at?: string
          embedding?: string | null
          id?: string
          lead_id?: string | null
          unit_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_memories_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_memories_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_settings: {
        Row: {
          api_key: string | null
          api_url: string | null
          embedding_provider: string | null
          evaluation_criteria: Json | null
          features: Json
          gcp_credentials: Json | null
          gcp_project_id: string | null
          gcp_region: string | null
          id: string
          model: string
          off_hours_batching: boolean | null
          provider: string
          system_prompt: string | null
          updated_at: string
        }
        Insert: {
          api_key?: string | null
          api_url?: string | null
          embedding_provider?: string | null
          evaluation_criteria?: Json | null
          features?: Json
          gcp_credentials?: Json | null
          gcp_project_id?: string | null
          gcp_region?: string | null
          id?: string
          model?: string
          off_hours_batching?: boolean | null
          provider?: string
          system_prompt?: string | null
          updated_at?: string
        }
        Update: {
          api_key?: string | null
          api_url?: string | null
          embedding_provider?: string | null
          evaluation_criteria?: Json | null
          features?: Json
          gcp_credentials?: Json | null
          gcp_project_id?: string | null
          gcp_region?: string | null
          id?: string
          model?: string
          off_hours_batching?: boolean | null
          provider?: string
          system_prompt?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      ai_task_queue: {
        Row: {
          completed_at: string | null
          content_preview: string | null
          created_at: string
          error_message: string | null
          id: string
          latency_ms: number | null
          lead_id: string | null
          message_id: string | null
          model: string | null
          provider: string | null
          sender_type: string | null
          started_at: string | null
          status: string
          tokens_used: number | null
        }
        Insert: {
          completed_at?: string | null
          content_preview?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          latency_ms?: number | null
          lead_id?: string | null
          message_id?: string | null
          model?: string | null
          provider?: string | null
          sender_type?: string | null
          started_at?: string | null
          status?: string
          tokens_used?: number | null
        }
        Update: {
          completed_at?: string | null
          content_preview?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          latency_ms?: number | null
          lead_id?: string | null
          message_id?: string | null
          model?: string | null
          provider?: string | null
          sender_type?: string | null
          started_at?: string | null
          status?: string
          tokens_used?: number | null
        }
        Relationships: []
      }
      audit_answers: {
        Row: {
          audit_id: string
          category: string
          created_at: string | null
          id: string
          is_conform: boolean
          item_name: string
          observation: string | null
          photo_url: string
        }
        Insert: {
          audit_id: string
          category: string
          created_at?: string | null
          id?: string
          is_conform: boolean
          item_name: string
          observation?: string | null
          photo_url: string
        }
        Update: {
          audit_id?: string
          category?: string
          created_at?: string | null
          id?: string
          is_conform?: boolean
          item_name?: string
          observation?: string | null
          photo_url?: string
        }
        Relationships: [
          {
            foreignKeyName: "audit_answers_audit_id_fkey"
            columns: ["audit_id"]
            isOneToOne: false
            referencedRelation: "audits"
            referencedColumns: ["id"]
          },
        ]
      }
      audits: {
        Row: {
          auditor_name: string | null
          completed_at: string | null
          id: string
          score_percentage: number | null
          started_at: string | null
          status: string | null
          unit_id: string
        }
        Insert: {
          auditor_name?: string | null
          completed_at?: string | null
          id?: string
          score_percentage?: number | null
          started_at?: string | null
          status?: string | null
          unit_id: string
        }
        Update: {
          auditor_name?: string | null
          completed_at?: string | null
          id?: string
          score_percentage?: number | null
          started_at?: string | null
          status?: string | null
          unit_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "audits_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_messages: {
        Row: {
          ai_audited: boolean | null
          ai_insight: string | null
          ai_summary: string | null
          ai_transcription: string | null
          chatwoot_message_id: number | null
          content: string
          created_at: string
          embedding: string | null
          id: string
          lead_id: string
          media_type: string | null
          media_url: string | null
          sender_type: string
        }
        Insert: {
          ai_audited?: boolean | null
          ai_insight?: string | null
          ai_summary?: string | null
          ai_transcription?: string | null
          chatwoot_message_id?: number | null
          content: string
          created_at?: string
          embedding?: string | null
          id?: string
          lead_id: string
          media_type?: string | null
          media_url?: string | null
          sender_type: string
        }
        Update: {
          ai_audited?: boolean | null
          ai_insight?: string | null
          ai_summary?: string | null
          ai_transcription?: string | null
          chatwoot_message_id?: number | null
          content?: string
          created_at?: string
          embedding?: string | null
          id?: string
          lead_id?: string
          media_type?: string | null
          media_url?: string | null
          sender_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      cycle_steps: {
        Row: {
          cycle_id: string | null
          evaluated_at: string | null
          id: string
          is_compliant: boolean | null
          reason_failed: string | null
          step_number: number
        }
        Insert: {
          cycle_id?: string | null
          evaluated_at?: string | null
          id?: string
          is_compliant?: boolean | null
          reason_failed?: string | null
          step_number: number
        }
        Update: {
          cycle_id?: string | null
          evaluated_at?: string | null
          id?: string
          is_compliant?: boolean | null
          reason_failed?: string | null
          step_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "cycle_steps_cycle_id_fkey"
            columns: ["cycle_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_cycles"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_digests: {
        Row: {
          created_at: string | null
          id: string
          leads_processed: number | null
          summary_text: string
          target_date: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          leads_processed?: number | null
          summary_text: string
          target_date: string
        }
        Update: {
          created_at?: string | null
          id?: string
          leads_processed?: number | null
          summary_text?: string
          target_date?: string
        }
        Relationships: []
      }
      daily_score_snapshots: {
        Row: {
          created_at: string
          global_score: number | null
          id: string
          scored_leads: number
          snapshot_date: string
          total_leads: number
          unit_breakdown: Json | null
        }
        Insert: {
          created_at?: string
          global_score?: number | null
          id?: string
          scored_leads?: number
          snapshot_date: string
          total_leads?: number
          unit_breakdown?: Json | null
        }
        Update: {
          created_at?: string
          global_score?: number | null
          id?: string
          scored_leads?: number
          snapshot_date?: string
          total_leads?: number
          unit_breakdown?: Json | null
        }
        Relationships: []
      }
      google_reviews_log: {
        Row: {
          id: string
          logged_date: string | null
          review_count_diff: number | null
          unit_id: string | null
        }
        Insert: {
          id?: string
          logged_date?: string | null
          review_count_diff?: number | null
          unit_id?: string | null
        }
        Update: {
          id?: string
          logged_date?: string | null
          review_count_diff?: number | null
          unit_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "google_reviews_log_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      integration_settings: {
        Row: {
          business_hours: Json | null
          chatwoot_account_id: number | null
          chatwoot_token: string | null
          chatwoot_url: string | null
          chatwoot_webhook_secret: string | null
          id: string
          ignored_labels: Json | null
          updated_at: string
        }
        Insert: {
          business_hours?: Json | null
          chatwoot_account_id?: number | null
          chatwoot_token?: string | null
          chatwoot_url?: string | null
          chatwoot_webhook_secret?: string | null
          id?: string
          ignored_labels?: Json | null
          updated_at?: string
        }
        Update: {
          business_hours?: Json | null
          chatwoot_account_id?: number | null
          chatwoot_token?: string | null
          chatwoot_url?: string | null
          chatwoot_webhook_secret?: string | null
          id?: string
          ignored_labels?: Json | null
          updated_at?: string
        }
        Relationships: []
      }
      lead_memories: {
        Row: {
          compressed_history: string
          created_at: string | null
          last_processed_message_id: string | null
          lead_id: string
          updated_at: string | null
        }
        Insert: {
          compressed_history: string
          created_at?: string | null
          last_processed_message_id?: string | null
          lead_id: string
          updated_at?: string | null
        }
        Update: {
          compressed_history?: string
          created_at?: string | null
          last_processed_message_id?: string | null
          lead_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lead_memories_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: true
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          ai_feedback: string | null
          audit_checklist: Json | null
          audit_checklist_messages: Json | null
          audit_reasons: Json | null
          chatwoot_contact_id: number | null
          chatwoot_conversation_id: number | null
          closing_summary: string | null
          created_at: string
          customer_name: string
          customer_phone: string
          customer_vehicle: string | null
          etapa_scores: Json | null
          funnel_stage: string
          funnel_stage_reason: string | null
          id: string
          is_cross_unit: boolean | null
          last_agent_message_at: string | null
          last_client_message_at: string | null
          last_message_at: string
          manager_id: string | null
          response_count: number | null
          score: number | null
          sla_status: string
          ticket_value: number | null
          total_response_time_minutes: number | null
          unit_id: string | null
          wait_time_minutes: number
        }
        Insert: {
          ai_feedback?: string | null
          audit_checklist?: Json | null
          audit_checklist_messages?: Json | null
          audit_reasons?: Json | null
          chatwoot_contact_id?: number | null
          chatwoot_conversation_id?: number | null
          closing_summary?: string | null
          created_at?: string
          customer_name: string
          customer_phone: string
          customer_vehicle?: string | null
          etapa_scores?: Json | null
          funnel_stage?: string
          funnel_stage_reason?: string | null
          id: string
          is_cross_unit?: boolean | null
          last_agent_message_at?: string | null
          last_client_message_at?: string | null
          last_message_at: string
          manager_id?: string | null
          response_count?: number | null
          score?: number | null
          sla_status?: string
          ticket_value?: number | null
          total_response_time_minutes?: number | null
          unit_id?: string | null
          wait_time_minutes?: number
        }
        Update: {
          ai_feedback?: string | null
          audit_checklist?: Json | null
          audit_checklist_messages?: Json | null
          audit_reasons?: Json | null
          chatwoot_contact_id?: number | null
          chatwoot_conversation_id?: number | null
          closing_summary?: string | null
          created_at?: string
          customer_name?: string
          customer_phone?: string
          customer_vehicle?: string | null
          etapa_scores?: Json | null
          funnel_stage?: string
          funnel_stage_reason?: string | null
          id?: string
          is_cross_unit?: boolean | null
          last_agent_message_at?: string | null
          last_client_message_at?: string | null
          last_message_at?: string
          manager_id?: string | null
          response_count?: number | null
          score?: number | null
          sla_status?: string
          ticket_value?: number | null
          total_response_time_minutes?: number | null
          unit_id?: string | null
          wait_time_minutes?: number
        }
        Relationships: [
          {
            foreignKeyName: "leads_manager_id_fkey"
            columns: ["manager_id"]
            isOneToOne: false
            referencedRelation: "managers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      llm_usage_logs: {
        Row: {
          created_at: string | null
          error_message: string | null
          id: string
          latency_ms: number | null
          model: string
          provider: string
          status: string
          tokens_used: number | null
        }
        Insert: {
          created_at?: string | null
          error_message?: string | null
          id?: string
          latency_ms?: number | null
          model: string
          provider: string
          status: string
          tokens_used?: number | null
        }
        Update: {
          created_at?: string | null
          error_message?: string | null
          id?: string
          latency_ms?: number | null
          model?: string
          provider?: string
          status?: string
          tokens_used?: number | null
        }
        Relationships: []
      }
      managers: {
        Row: {
          auth_user_id: string | null
          avatar: string | null
          created_at: string
          id: string
          name: string
          unit_id: string | null
        }
        Insert: {
          auth_user_id?: string | null
          avatar?: string | null
          created_at?: string
          id?: string
          name: string
          unit_id?: string | null
        }
        Update: {
          auth_user_id?: string | null
          avatar?: string | null
          created_at?: string
          id?: string
          name?: string
          unit_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "managers_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string | null
          email: string
          id: string
          is_admin: boolean | null
        }
        Insert: {
          created_at?: string | null
          email: string
          id: string
          is_admin?: boolean | null
        }
        Update: {
          created_at?: string | null
          email?: string
          id?: string
          is_admin?: boolean | null
        }
        Relationships: []
      }
      semantic_cache: {
        Row: {
          created_at: string | null
          embedding: string | null
          id: string
          input_hash: string
          output_json: Json
          ttl_expires_at: string | null
        }
        Insert: {
          created_at?: string | null
          embedding?: string | null
          id?: string
          input_hash: string
          output_json: Json
          ttl_expires_at?: string | null
        }
        Update: {
          created_at?: string | null
          embedding?: string | null
          id?: string
          input_hash?: string
          output_json?: Json
          ttl_expires_at?: string | null
        }
        Relationships: []
      }
      store_inspections: {
        Row: {
          auditor_user_id: string | null
          completed_at: string | null
          device_info: string | null
          id: string
          raw_payload: Json | null
          started_at: string
          status: string | null
          store_id: string
        }
        Insert: {
          auditor_user_id?: string | null
          completed_at?: string | null
          device_info?: string | null
          id?: string
          raw_payload?: Json | null
          started_at: string
          status?: string | null
          store_id: string
        }
        Update: {
          auditor_user_id?: string | null
          completed_at?: string | null
          device_info?: string | null
          id?: string
          raw_payload?: Json | null
          started_at?: string
          status?: string | null
          store_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "store_inspections_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      system_settings: {
        Row: {
          id: string
          key: string
          updated_at: string | null
          value: string
        }
        Insert: {
          id?: string
          key: string
          updated_at?: string | null
          value: string
        }
        Update: {
          id?: string
          key?: string
          updated_at?: string | null
          value?: string
        }
        Relationships: []
      }
      units: {
        Row: {
          chatwoot_inbox_id: number | null
          created_at: string
          id: string
          name: string
        }
        Insert: {
          chatwoot_inbox_id?: number | null
          created_at?: string
          id: string
          name: string
        }
        Update: {
          chatwoot_inbox_id?: number | null
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      whatsapp_cycles: {
        Row: {
          chatwoot_conversation_id: number | null
          customer_phone: string | null
          id: string
          manager_id: string | null
          max_response_time_breached: boolean | null
          started_at: string | null
        }
        Insert: {
          chatwoot_conversation_id?: number | null
          customer_phone?: string | null
          id?: string
          manager_id?: string | null
          max_response_time_breached?: boolean | null
          started_at?: string | null
        }
        Update: {
          chatwoot_conversation_id?: number | null
          customer_phone?: string | null
          id?: string
          manager_id?: string | null
          max_response_time_breached?: boolean | null
          started_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_cycles_manager_id_fkey"
            columns: ["manager_id"]
            isOneToOne: false
            referencedRelation: "managers"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      clean_old_media: { Args: never; Returns: undefined }
      cron_process_pending_ai_evaluations: { Args: never; Returns: undefined }
      is_admin: { Args: never; Returns: boolean }
      match_ai_memories: {
        Args: {
          match_count: number
          match_threshold: number
          p_unit_id: string
          query_embedding: string
        }
        Returns: {
          context: string
          id: string
          similarity: number
        }[]
      }
      match_messages: {
        Args: {
          match_count: number
          match_threshold: number
          query_embedding: string
        }
        Returns: {
          content: string
          id: string
          lead_id: string
          sender_type: string
          similarity: number
        }[]
      }
      my_unit_id: { Args: never; Returns: string }
      save_lead_audit: {
        Args: {
          p_audit_checklist: Json
          p_closing_summary: string
          p_lead_id: string
          p_score: number
        }
        Returns: undefined
      }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
