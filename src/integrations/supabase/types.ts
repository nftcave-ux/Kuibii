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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      campaigns: {
        Row: {
          chain: string
          conditions: Json
          created_at: string
          decimals: number
          distribution_mode: string
          fixed_amount: number
          id: string
          manage_key_hash: string
          name: string
          registration_open: boolean
          symbol: string
          tiers: Json
          token_config: Json
          total_supply: number
          vesting: Json
        }
        Insert: {
          chain?: string
          conditions?: Json
          created_at?: string
          decimals?: number
          distribution_mode?: string
          fixed_amount?: number
          id?: string
          manage_key_hash: string
          name: string
          registration_open?: boolean
          symbol: string
          tiers?: Json
          token_config?: Json
          total_supply?: number
          vesting?: Json
        }
        Update: {
          chain?: string
          conditions?: Json
          created_at?: string
          decimals?: number
          distribution_mode?: string
          fixed_amount?: number
          id?: string
          manage_key_hash?: string
          name?: string
          registration_open?: boolean
          symbol?: string
          tiers?: Json
          token_config?: Json
          total_supply?: number
          vesting?: Json
        }
        Relationships: []
      }
      launches: {
        Row: {
          apr: number
          asset: string
          created_at: string
          description: string
          ends_at: string
          id: string
          name: string
          symbol: string
          token_config: Json
          token_pool: number
          yield_goal: number
        }
        Insert: {
          apr?: number
          asset?: string
          created_at?: string
          description?: string
          ends_at: string
          id?: string
          name: string
          symbol: string
          token_config?: Json
          token_pool?: number
          yield_goal?: number
        }
        Update: {
          apr?: number
          asset?: string
          created_at?: string
          description?: string
          ends_at?: string
          id?: string
          name?: string
          symbol?: string
          token_config?: Json
          token_pool?: number
          yield_goal?: number
        }
        Relationships: []
      }
      positions: {
        Row: {
          claimed_at: string | null
          claimed_tokens: number
          deposited_at: string
          id: string
          key_hash: string
          launch_id: string
          principal: number
          wallet: string
          withdrawn_at: string | null
        }
        Insert: {
          claimed_at?: string | null
          claimed_tokens?: number
          deposited_at?: string
          id?: string
          key_hash: string
          launch_id: string
          principal: number
          wallet: string
          withdrawn_at?: string | null
        }
        Update: {
          claimed_at?: string | null
          claimed_tokens?: number
          deposited_at?: string
          id?: string
          key_hash?: string
          launch_id?: string
          principal?: number
          wallet?: string
          withdrawn_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "positions_launch_id_fkey"
            columns: ["launch_id"]
            isOneToOne: false
            referencedRelation: "launches"
            referencedColumns: ["id"]
          },
        ]
      }
      recipients: {
        Row: {
          campaign_id: string
          created_at: string
          email: string | null
          id: string
          name: string | null
          source: string
          tier: string | null
          wallet: string
        }
        Insert: {
          campaign_id: string
          created_at?: string
          email?: string | null
          id?: string
          name?: string | null
          source?: string
          tier?: string | null
          wallet: string
        }
        Update: {
          campaign_id?: string
          created_at?: string
          email?: string | null
          id?: string
          name?: string | null
          source?: string
          tier?: string | null
          wallet?: string
        }
        Relationships: [
          {
            foreignKeyName: "recipients_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
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

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
