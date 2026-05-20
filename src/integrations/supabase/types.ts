export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      organizations: {
        Row: {
          created_at: string
          id: string
          logo_url: string | null
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          logo_url?: string | null
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          logo_url?: string | null
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          company_contact: string | null
          company_logo_url: string | null
          company_name: string | null
          company_website: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          updated_at: string
        }
        Insert: {
          company_contact?: string | null
          company_logo_url?: string | null
          company_name?: string | null
          company_website?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          company_contact?: string | null
          company_logo_url?: string | null
          company_name?: string | null
          company_website?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      simulations: {
        Row: {
          admin_fee_rate: number
          best_scenario: string
          client_name: string | null
          contemplation_month: number
          created_at: string
          credit_value: number
          id: string
          investment_return: number
          monthly_payment: number
          plan_duration: number
          rental_yield: number
          reserve_fund_rate: number
          sale_profit: number
          scenario_difference: number
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_fee_rate: number
          best_scenario: string
          client_name?: string | null
          contemplation_month: number
          created_at?: string
          credit_value: number
          id?: string
          investment_return: number
          monthly_payment: number
          plan_duration: number
          rental_yield: number
          reserve_fund_rate: number
          sale_profit: number
          scenario_difference: number
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_fee_rate?: number
          best_scenario?: string
          client_name?: string | null
          contemplation_month?: number
          created_at?: string
          credit_value?: number
          id?: string
          investment_return?: number
          monthly_payment?: number
          plan_duration?: number
          rental_yield?: number
          reserve_fund_rate?: number
          sale_profit?: number
          scenario_difference?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      system_settings: {
        Row: {
          id: string
          key: string
          value: string
          updated_at: string
        }
        Insert: {
          id?: string
          key: string
          value: string
          updated_at?: string
        }
        Update: {
          id?: string
          key?: string
          value?: string
          updated_at?: string
        }
        Relationships: []
      }
      units: {
        Row: {
          id: string
          name: string
          google_place_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          google_place_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          google_place_id?: string | null
          created_at?: string
        }
        Relationships: []
      }
      managers: {
        Row: {
          id: string
          unit_id: string | null
          full_name: string
          phone: string | null
          chatwoot_inbox_id: number | null
          created_at: string
        }
        Insert: {
          id?: string
          unit_id?: string | null
          full_name: string
          phone?: string | null
          chatwoot_inbox_id?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          unit_id?: string | null
          full_name?: string
          phone?: string | null
          chatwoot_inbox_id?: number | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "managers_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          }
        ]
      }
      whatsapp_cycles: {
        Row: {
          id: string
          manager_id: string | null
          customer_phone: string | null
          started_at: string
          max_response_time_breached: boolean | null
          chatwoot_conversation_id: number | null
        }
        Insert: {
          id?: string
          manager_id?: string | null
          customer_phone?: string | null
          started_at?: string
          max_response_time_breached?: boolean | null
          chatwoot_conversation_id?: number | null
        }
        Update: {
          id?: string
          manager_id?: string | null
          customer_phone?: string | null
          started_at?: string
          max_response_time_breached?: boolean | null
          chatwoot_conversation_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_cycles_manager_id_fkey"
            columns: ["manager_id"]
            isOneToOne: false
            referencedRelation: "managers"
            referencedColumns: ["id"]
          }
        ]
      }
      cycle_steps: {
        Row: {
          id: string
          cycle_id: string | null
          step_number: number
          is_compliant: boolean | null
          reason_failed: string | null
          evaluated_at: string
        }
        Insert: {
          id?: string
          cycle_id?: string | null
          step_number: number
          is_compliant?: boolean | null
          reason_failed?: string | null
          evaluated_at?: string
        }
        Update: {
          id?: string
          cycle_id?: string | null
          step_number?: number
          is_compliant?: boolean | null
          reason_failed?: string | null
          evaluated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cycle_steps_cycle_id_fkey"
            columns: ["cycle_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_cycles"
            referencedColumns: ["id"]
          }
        ]
      }
      google_reviews_log: {
        Row: {
          id: string
          unit_id: string | null
          review_count_diff: number | null
          logged_date: string | null
        }
        Insert: {
          id?: string
          unit_id?: string | null
          review_count_diff?: number | null
          logged_date?: string | null
        }
        Update: {
          id?: string
          unit_id?: string | null
          review_count_diff?: number | null
          logged_date?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "google_reviews_log_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
