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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      bookings: {
        Row: {
          address: string
          assigned_staff_id: string | null
          created_at: string
          email: string
          full_name: string
          id: string
          is_recurring: boolean
          message: string | null
          parent_booking_id: string | null
          phone: string
          preferred_date: string
          preferred_time: string
          recurrence_end_date: string | null
          recurrence_type: string | null
          service_type: string
          status: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          address: string
          assigned_staff_id?: string | null
          created_at?: string
          email: string
          full_name: string
          id?: string
          is_recurring?: boolean
          message?: string | null
          parent_booking_id?: string | null
          phone: string
          preferred_date: string
          preferred_time: string
          recurrence_end_date?: string | null
          recurrence_type?: string | null
          service_type: string
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          address?: string
          assigned_staff_id?: string | null
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          is_recurring?: boolean
          message?: string | null
          parent_booking_id?: string | null
          phone?: string
          preferred_date?: string
          preferred_time?: string
          recurrence_end_date?: string | null
          recurrence_type?: string | null
          service_type?: string
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bookings_assigned_staff_id_fkey"
            columns: ["assigned_staff_id"]
            isOneToOne: false
            referencedRelation: "staff_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_parent_booking_id_fkey"
            columns: ["parent_booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_submissions: {
        Row: {
          created_at: string
          email: string
          full_name: string
          id: string
          message: string
          phone: string | null
          status: string
          subject: string
          submission_ip: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          email: string
          full_name: string
          id?: string
          message: string
          phone?: string | null
          status?: string
          subject: string
          submission_ip?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          message?: string
          phone?: string | null
          status?: string
          subject?: string
          submission_ip?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      customer_rewards: {
        Row: {
          booking_id: string | null
          created_at: string
          expires_at: string
          id: string
          redeemed_at: string
          reward_id: string
          status: string
          transaction_id: string | null
          used_at: string | null
          user_id: string
        }
        Insert: {
          booking_id?: string | null
          created_at?: string
          expires_at: string
          id?: string
          redeemed_at?: string
          reward_id: string
          status?: string
          transaction_id?: string | null
          used_at?: string | null
          user_id: string
        }
        Update: {
          booking_id?: string | null
          created_at?: string
          expires_at?: string
          id?: string
          redeemed_at?: string
          reward_id?: string
          status?: string
          transaction_id?: string | null
          used_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "customer_rewards_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_rewards_reward_id_fkey"
            columns: ["reward_id"]
            isOneToOne: false
            referencedRelation: "loyalty_rewards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_rewards_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "loyalty_transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      email_reminders: {
        Row: {
          booking_id: string | null
          created_at: string
          email: string
          id: string
          last_error: string | null
          reminder_type: string
          retry_count: number | null
          scheduled_send_time: string
          sent_at: string | null
          status: string
        }
        Insert: {
          booking_id?: string | null
          created_at?: string
          email: string
          id?: string
          last_error?: string | null
          reminder_type?: string
          retry_count?: number | null
          scheduled_send_time: string
          sent_at?: string | null
          status?: string
        }
        Update: {
          booking_id?: string | null
          created_at?: string
          email?: string
          id?: string
          last_error?: string | null
          reminder_type?: string
          retry_count?: number | null
          scheduled_send_time?: string
          sent_at?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_reminders_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      feedback_ratings: {
        Row: {
          booking_id: string | null
          cleanliness_rating: number
          comment: string | null
          created_at: string
          id: string
          is_verified_booking: boolean | null
          professionalism_rating: number
          punctuality_rating: number
          rating: number
          user_id: string | null
        }
        Insert: {
          booking_id?: string | null
          cleanliness_rating?: number
          comment?: string | null
          created_at?: string
          id?: string
          is_verified_booking?: boolean | null
          professionalism_rating?: number
          punctuality_rating?: number
          rating: number
          user_id?: string | null
        }
        Update: {
          booking_id?: string | null
          cleanliness_rating?: number
          comment?: string | null
          created_at?: string
          id?: string
          is_verified_booking?: boolean | null
          professionalism_rating?: number
          punctuality_rating?: number
          rating?: number
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "feedback_ratings_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      loyalty_rewards: {
        Row: {
          created_at: string
          current_redemptions: number
          description: string
          id: string
          is_active: boolean
          max_redemptions: number | null
          name: string
          points_required: number
          reward_type: string
          reward_value: number | null
          service_type: string | null
          updated_at: string
          valid_days: number | null
        }
        Insert: {
          created_at?: string
          current_redemptions?: number
          description: string
          id?: string
          is_active?: boolean
          max_redemptions?: number | null
          name: string
          points_required: number
          reward_type: string
          reward_value?: number | null
          service_type?: string | null
          updated_at?: string
          valid_days?: number | null
        }
        Update: {
          created_at?: string
          current_redemptions?: number
          description?: string
          id?: string
          is_active?: boolean
          max_redemptions?: number | null
          name?: string
          points_required?: number
          reward_type?: string
          reward_value?: number | null
          service_type?: string | null
          updated_at?: string
          valid_days?: number | null
        }
        Relationships: []
      }
      loyalty_transactions: {
        Row: {
          balance_after: number
          booking_id: string | null
          created_at: string
          description: string
          id: string
          points: number
          transaction_type: string
          user_id: string
        }
        Insert: {
          balance_after: number
          booking_id?: string | null
          created_at?: string
          description: string
          id?: string
          points: number
          transaction_type: string
          user_id: string
        }
        Update: {
          balance_after?: number
          booking_id?: string | null
          created_at?: string
          description?: string
          id?: string
          points?: number
          transaction_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "loyalty_transactions_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      newsletter_subscribers: {
        Row: {
          email: string
          id: string
          is_active: boolean
          subscribed_at: string
        }
        Insert: {
          email: string
          id?: string
          is_active?: boolean
          subscribed_at?: string
        }
        Update: {
          email?: string
          id?: string
          is_active?: boolean
          subscribed_at?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          is_archived: boolean | null
          is_read: boolean
          link: string | null
          message: string
          title: string
          type: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          is_archived?: boolean | null
          is_read?: boolean
          link?: string | null
          message: string
          title: string
          type?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          is_archived?: boolean | null
          is_read?: boolean
          link?: string | null
          message?: string
          title?: string
          type?: string
          user_id?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          address: string | null
          created_at: string
          full_name: string | null
          id: string
          loyalty_points: number | null
          loyalty_tier: string | null
          phone: string | null
          total_spent: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          address?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          loyalty_points?: number | null
          loyalty_tier?: string | null
          phone?: string | null
          total_spent?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          address?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          loyalty_points?: number | null
          loyalty_tier?: string | null
          phone?: string | null
          total_spent?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      referrals: {
        Row: {
          bonus_points: number
          completed_at: string | null
          created_at: string
          id: string
          referral_code: string
          referred_email: string
          referred_user_id: string | null
          referrer_id: string
          status: string
        }
        Insert: {
          bonus_points?: number
          completed_at?: string | null
          created_at?: string
          id?: string
          referral_code: string
          referred_email: string
          referred_user_id?: string | null
          referrer_id: string
          status?: string
        }
        Update: {
          bonus_points?: number
          completed_at?: string | null
          created_at?: string
          id?: string
          referral_code?: string
          referred_email?: string
          referred_user_id?: string | null
          referrer_id?: string
          status?: string
        }
        Relationships: []
      }
      staff_availability: {
        Row: {
          created_at: string
          day_of_week: number
          end_time: string
          id: string
          is_available: boolean
          staff_id: string
          start_time: string
        }
        Insert: {
          created_at?: string
          day_of_week: number
          end_time: string
          id?: string
          is_available?: boolean
          staff_id: string
          start_time: string
        }
        Update: {
          created_at?: string
          day_of_week?: number
          end_time?: string
          id?: string
          is_available?: boolean
          staff_id?: string
          start_time?: string
        }
        Relationships: [
          {
            foreignKeyName: "staff_availability_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff_members"
            referencedColumns: ["id"]
          },
        ]
      }
      staff_emails: {
        Row: {
          created_at: string
          email: string
          id: string
          is_active: boolean
          name: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          is_active?: boolean
          name?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          is_active?: boolean
          name?: string | null
        }
        Relationships: []
      }
      staff_members: {
        Row: {
          created_at: string
          email: string
          full_name: string
          hourly_rate: number | null
          id: string
          is_active: boolean
          phone: string | null
          photo_url: string | null
          specializations: string[] | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          email: string
          full_name: string
          hourly_rate?: number | null
          id?: string
          is_active?: boolean
          phone?: string | null
          photo_url?: string | null
          specializations?: string[] | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string
          hourly_rate?: number | null
          id?: string
          is_active?: boolean
          phone?: string | null
          photo_url?: string | null
          specializations?: string[] | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      staff_time_off: {
        Row: {
          created_at: string
          end_date: string
          id: string
          reason: string | null
          staff_id: string
          start_date: string
        }
        Insert: {
          created_at?: string
          end_date: string
          id?: string
          reason?: string | null
          staff_id: string
          start_date: string
        }
        Update: {
          created_at?: string
          end_date?: string
          id?: string
          reason?: string | null
          staff_id?: string
          start_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "staff_time_off_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff_members"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      add_loyalty_points: {
        Args: {
          p_booking_id?: string
          p_description: string
          p_points: number
          p_transaction_type: string
          p_user_id: string
        }
        Returns: number
      }
      calculate_loyalty_tier: { Args: { points: number }; Returns: string }
      generate_referral_code: { Args: { p_user_id: string }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      process_referral: {
        Args: { p_new_user_id: string; p_referral_code: string }
        Returns: boolean
      }
      redeem_loyalty_reward: {
        Args: { p_reward_id: string; p_user_id: string }
        Returns: string
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
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
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const
