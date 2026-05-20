export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      ai_settings: {
        Row: {
          id: string
          provider: string
          model: string
          api_key: string | null
          features: Json
          updated_at: string
        }
        Insert: {
          id?: string
          provider?: string
          model?: string
          api_key?: string | null
          features?: Json
          updated_at?: string
        }
        Update: {
          id?: string
          provider?: string
          model?: string
          api_key?: string | null
          features?: Json
          updated_at?: string
        }
      }
      leads: {
        Row: {
          id: string
          customer_name: string
          customer_phone: string
          customer_vehicle: string | null
          unit_id: string | null
          manager_id: string | null
          last_message_at: string
          funnel_stage: string
          score: number | null
          wait_time_minutes: number
          sla_status: string
          ticket_value: number | null
          closing_summary: string | null
          created_at: string
        }
        Insert: {
          id: string
          customer_name: string
          customer_phone: string
          customer_vehicle?: string | null
          unit_id?: string | null
          manager_id?: string | null
          last_message_at: string
          funnel_stage?: string
          score?: number | null
          wait_time_minutes?: number
          sla_status?: string
          ticket_value?: number | null
          summary?: string | null
          closing_summary?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          customer_name?: string
          customer_phone?: string
          customer_vehicle?: string | null
          unit_id?: string | null
          manager_id?: string | null
          last_message_at?: string
          funnel_stage?: string
          score?: number | null
          wait_time_minutes?: number
          sla_status?: string
          ticket_value?: number | null
          summary?: string | null
          closing_summary?: string | null
          created_at?: string
        }
      }
      managers: {
        Row: {
          id: string
          name: string
          unit_id: string | null
          avatar: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          unit_id?: string | null
          avatar?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          unit_id?: string | null
          avatar?: string | null
          created_at?: string
        }
      }
      units: {
        Row: {
          id: string
          name: string
          created_at: string
        }
        Insert: {
          id: string
          name: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          created_at?: string
        }
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
