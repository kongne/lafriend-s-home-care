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
      announcements: {
        Row: {
          background_color: string
          countdown_ends_at: string | null
          created_at: string
          created_by: string | null
          dismissible: boolean
          display_order: number
          display_pages: string[] | null
          ends_at: string
          icon: string | null
          id: string
          is_active: boolean
          link_text: string | null
          link_url: string | null
          message: string
          show_countdown: boolean
          starts_at: string
          status: string
          target_countries: string[] | null
          target_languages: string[] | null
          target_users: string
          text_color: string
          title: string
          updated_at: string
        }
        Insert: {
          background_color?: string
          countdown_ends_at?: string | null
          created_at?: string
          created_by?: string | null
          dismissible?: boolean
          display_order?: number
          display_pages?: string[] | null
          ends_at?: string
          icon?: string | null
          id?: string
          is_active?: boolean
          link_text?: string | null
          link_url?: string | null
          message: string
          show_countdown?: boolean
          starts_at?: string
          status?: string
          target_countries?: string[] | null
          target_languages?: string[] | null
          target_users?: string
          text_color?: string
          title?: string
          updated_at?: string
        }
        Update: {
          background_color?: string
          countdown_ends_at?: string | null
          created_at?: string
          created_by?: string | null
          dismissible?: boolean
          display_order?: number
          display_pages?: string[] | null
          ends_at?: string
          icon?: string | null
          id?: string
          is_active?: boolean
          link_text?: string | null
          link_url?: string | null
          message?: string
          show_countdown?: boolean
          starts_at?: string
          status?: string
          target_countries?: string[] | null
          target_languages?: string[] | null
          target_users?: string
          text_color?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          action: string
          browser: string | null
          category: string | null
          country: string | null
          created_at: string
          description: string | null
          device: string | null
          duration_ms: number | null
          id: string
          ip_address: string | null
          metadata: Json | null
          module: string | null
          new_value: Json | null
          old_value: Json | null
          os: string | null
          request_id: string | null
          session_id: string | null
          severity: string | null
          status: string | null
          target_id: string | null
          target_type: string | null
          user_agent: string | null
          user_id: string | null
          user_role: string | null
        }
        Insert: {
          action: string
          browser?: string | null
          category?: string | null
          country?: string | null
          created_at?: string
          description?: string | null
          device?: string | null
          duration_ms?: number | null
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          module?: string | null
          new_value?: Json | null
          old_value?: Json | null
          os?: string | null
          request_id?: string | null
          session_id?: string | null
          severity?: string | null
          status?: string | null
          target_id?: string | null
          target_type?: string | null
          user_agent?: string | null
          user_id?: string | null
          user_role?: string | null
        }
        Update: {
          action?: string
          browser?: string | null
          category?: string | null
          country?: string | null
          created_at?: string
          description?: string | null
          device?: string | null
          duration_ms?: number | null
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          module?: string | null
          new_value?: Json | null
          old_value?: Json | null
          os?: string | null
          request_id?: string | null
          session_id?: string | null
          severity?: string | null
          status?: string | null
          target_id?: string | null
          target_type?: string | null
          user_agent?: string | null
          user_id?: string | null
          user_role?: string | null
        }
        Relationships: []
      }
      backup_logs: {
        Row: {
          backup_mode: string
          backup_type: string
          checksum: string | null
          completed_at: string | null
          compressed: boolean
          created_at: string
          created_by: string | null
          database_version: string | null
          encrypted: boolean
          error_message: string | null
          file_name: string | null
          file_path: string | null
          file_size: number | null
          id: string
          retention_days: number
          schedule_config: Json | null
          started_at: string | null
          status: string
          storage_location: string
        }
        Insert: {
          backup_mode?: string
          backup_type?: string
          checksum?: string | null
          completed_at?: string | null
          compressed?: boolean
          created_at?: string
          created_by?: string | null
          database_version?: string | null
          encrypted?: boolean
          error_message?: string | null
          file_name?: string | null
          file_path?: string | null
          file_size?: number | null
          id?: string
          retention_days?: number
          schedule_config?: Json | null
          started_at?: string | null
          status?: string
          storage_location?: string
        }
        Update: {
          backup_mode?: string
          backup_type?: string
          checksum?: string | null
          completed_at?: string | null
          compressed?: boolean
          created_at?: string
          created_by?: string | null
          database_version?: string | null
          encrypted?: boolean
          error_message?: string | null
          file_name?: string | null
          file_path?: string | null
          file_size?: number | null
          id?: string
          retention_days?: number
          schedule_config?: Json | null
          started_at?: string | null
          status?: string
          storage_location?: string
        }
        Relationships: []
      }
      bookings: {
        Row: {
          address: string
          assigned_staff_id: string | null
          created_at: string
          discount_amount: number
          email: string
          full_name: string
          id: string
          is_paused: boolean
          is_recurring: boolean
          message: string | null
          parent_booking_id: string | null
          phone: string
          points_redeemed: number
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
          discount_amount?: number
          email: string
          full_name: string
          id?: string
          is_paused?: boolean
          is_recurring?: boolean
          message?: string | null
          parent_booking_id?: string | null
          phone: string
          points_redeemed?: number
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
          discount_amount?: number
          email?: string
          full_name?: string
          id?: string
          is_paused?: boolean
          is_recurring?: boolean
          message?: string | null
          parent_booking_id?: string | null
          phone?: string
          points_redeemed?: number
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
      chat_messages: {
        Row: {
          content: string | null
          created_at: string
          deleted_at: string | null
          id: string
          is_edited: boolean
          is_pinned: boolean
          media_metadata: Json | null
          media_url: string | null
          parent_message_id: string | null
          room_id: string
          type: string
          user_id: string
        }
        Insert: {
          content?: string | null
          created_at?: string
          deleted_at?: string | null
          id?: string
          is_edited?: boolean
          is_pinned?: boolean
          media_metadata?: Json | null
          media_url?: string | null
          parent_message_id?: string | null
          room_id: string
          type?: string
          user_id: string
        }
        Update: {
          content?: string | null
          created_at?: string
          deleted_at?: string | null
          id?: string
          is_edited?: boolean
          is_pinned?: boolean
          media_metadata?: Json | null
          media_url?: string | null
          parent_message_id?: string | null
          room_id?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_parent_message_id_fkey"
            columns: ["parent_message_id"]
            isOneToOne: false
            referencedRelation: "chat_messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_messages_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "chat_rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_participants: {
        Row: {
          id: string
          joined_at: string
          last_read_at: string | null
          role: string
          room_id: string
          user_id: string
        }
        Insert: {
          id?: string
          joined_at?: string
          last_read_at?: string | null
          role?: string
          room_id: string
          user_id: string
        }
        Update: {
          id?: string
          joined_at?: string
          last_read_at?: string | null
          role?: string
          room_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_participants_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "chat_rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_read_receipts: {
        Row: {
          id: string
          message_id: string
          read_at: string
          user_id: string
        }
        Insert: {
          id?: string
          message_id: string
          read_at?: string
          user_id: string
        }
        Update: {
          id?: string
          message_id?: string
          read_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_read_receipts_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "chat_messages"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_rooms: {
        Row: {
          booking_id: string | null
          created_at: string
          created_by: string | null
          id: string
          metadata: Json | null
          name: string | null
          type: string
          updated_at: string
        }
        Insert: {
          booking_id?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          metadata?: Json | null
          name?: string | null
          type?: string
          updated_at?: string
        }
        Update: {
          booking_id?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          metadata?: Json | null
          name?: string | null
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_rooms_booking_id_fkey"
            columns: ["booking_id"]
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
      customer_kyc: {
        Row: {
          created_at: string | null
          document_status: string
          document_type: string
          document_url: string | null
          id: string
          rejection_reason: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          document_status?: string
          document_type: string
          document_url?: string | null
          id?: string
          rejection_reason?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          document_status?: string
          document_type?: string
          document_url?: string | null
          id?: string
          rejection_reason?: string | null
          updated_at?: string | null
          user_id?: string
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
      error_logs: {
        Row: {
          assigned_to: string | null
          browser: string | null
          code: string | null
          comment: string | null
          created_at: string
          environment: string | null
          error_type: string
          file: string | null
          function: string | null
          id: string
          ip_address: string | null
          line: number | null
          message: string
          metadata: Json | null
          method: string | null
          os: string | null
          request_id: string | null
          resolved: boolean
          resolved_at: string | null
          resolved_by: string | null
          severity: string
          stack_trace: string | null
          status_code: number | null
          url: string | null
          user_id: string | null
        }
        Insert: {
          assigned_to?: string | null
          browser?: string | null
          code?: string | null
          comment?: string | null
          created_at?: string
          environment?: string | null
          error_type?: string
          file?: string | null
          function?: string | null
          id?: string
          ip_address?: string | null
          line?: number | null
          message: string
          metadata?: Json | null
          method?: string | null
          os?: string | null
          request_id?: string | null
          resolved?: boolean
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: string
          stack_trace?: string | null
          status_code?: number | null
          url?: string | null
          user_id?: string | null
        }
        Update: {
          assigned_to?: string | null
          browser?: string | null
          code?: string | null
          comment?: string | null
          created_at?: string
          environment?: string | null
          error_type?: string
          file?: string | null
          function?: string | null
          id?: string
          ip_address?: string | null
          line?: number | null
          message?: string
          metadata?: Json | null
          method?: string | null
          os?: string | null
          request_id?: string | null
          resolved?: boolean
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: string
          stack_trace?: string | null
          status_code?: number | null
          url?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      feedback: {
        Row: {
          created_at: string
          email: string
          id: string
          message: string
          name: string
          phone: string | null
          service: string | null
          status: string
          subject: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          message: string
          name: string
          phone?: string | null
          service?: string | null
          status?: string
          subject?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          message?: string
          name?: string
          phone?: string | null
          service?: string | null
          status?: string
          subject?: string | null
          updated_at?: string
        }
        Relationships: []
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
      identity_documents: {
        Row: {
          back_url: string | null
          created_at: string
          doc_type: string
          expires_at: string | null
          front_url: string | null
          id: string
          rejection_reason: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          selfie_url: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          back_url?: string | null
          created_at?: string
          doc_type: string
          expires_at?: string | null
          front_url?: string | null
          id?: string
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          selfie_url?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          back_url?: string | null
          created_at?: string
          doc_type?: string
          expires_at?: string | null
          front_url?: string | null
          id?: string
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          selfie_url?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      kyc_decision_audit: {
        Row: {
          created_at: string
          decided_by: string
          decision: string
          email_error: string | null
          email_status: string
          id: string
          identity_document_id: string
          recipient_email: string | null
          rejection_reason: string | null
          subject_user_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          decided_by: string
          decision: string
          email_error?: string | null
          email_status?: string
          id?: string
          identity_document_id: string
          recipient_email?: string | null
          rejection_reason?: string | null
          subject_user_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          decided_by?: string
          decision?: string
          email_error?: string | null
          email_status?: string
          id?: string
          identity_document_id?: string
          recipient_email?: string | null
          rejection_reason?: string | null
          subject_user_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "kyc_decision_audit_identity_document_id_fkey"
            columns: ["identity_document_id"]
            isOneToOne: false
            referencedRelation: "identity_documents"
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
      maintenance_events: {
        Row: {
          allowed_ips: string[]
          allowed_role: string
          countdown_ends_at: string | null
          created_at: string
          created_by: string | null
          custom_page_html: string | null
          duration_minutes: number | null
          ended_at: string | null
          id: string
          is_active: boolean
          maintenance_type: string
          reason: string | null
          started_at: string | null
        }
        Insert: {
          allowed_ips?: string[]
          allowed_role?: string
          countdown_ends_at?: string | null
          created_at?: string
          created_by?: string | null
          custom_page_html?: string | null
          duration_minutes?: number | null
          ended_at?: string | null
          id?: string
          is_active?: boolean
          maintenance_type?: string
          reason?: string | null
          started_at?: string | null
        }
        Update: {
          allowed_ips?: string[]
          allowed_role?: string
          countdown_ends_at?: string | null
          created_at?: string
          created_by?: string | null
          custom_page_html?: string | null
          duration_minutes?: number | null
          ended_at?: string | null
          id?: string
          is_active?: boolean
          maintenance_type?: string
          reason?: string | null
          started_at?: string | null
        }
        Relationships: []
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
      permissions: {
        Row: {
          code: string
          created_at: string
          description: string | null
          id: string
          module: string
          name: string
        }
        Insert: {
          code: string
          created_at?: string
          description?: string | null
          id?: string
          module: string
          name: string
        }
        Update: {
          code?: string
          created_at?: string
          description?: string | null
          id?: string
          module?: string
          name?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          address: string | null
          created_at: string
          full_name: string | null
          id: string
          is_verified: boolean
          loyalty_points: number | null
          loyalty_tier: string | null
          phone: string | null
          preferred_time_slot: string | null
          special_instructions: string | null
          total_spent: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          address?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          is_verified?: boolean
          loyalty_points?: number | null
          loyalty_tier?: string | null
          phone?: string | null
          preferred_time_slot?: string | null
          special_instructions?: string | null
          total_spent?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          address?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          is_verified?: boolean
          loyalty_points?: number | null
          loyalty_tier?: string | null
          phone?: string | null
          preferred_time_slot?: string | null
          special_instructions?: string | null
          total_spent?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      project_images: {
        Row: {
          created_at: string
          display_order: number
          id: string
          image_type: string
          image_url: string
          is_featured: boolean
          project_id: string
        }
        Insert: {
          created_at?: string
          display_order?: number
          id?: string
          image_type: string
          image_url: string
          is_featured?: boolean
          project_id: string
        }
        Update: {
          created_at?: string
          display_order?: number
          id?: string
          image_type?: string
          image_url?: string
          is_featured?: boolean
          project_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_images_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          category: string
          completion_date: string | null
          created_at: string
          description: string | null
          detail_description: string | null
          duration_or_stats: string | null
          id: string
          is_featured: boolean
          location: string | null
          slug: string
          stats_label: string | null
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          category: string
          completion_date?: string | null
          created_at?: string
          description?: string | null
          detail_description?: string | null
          duration_or_stats?: string | null
          id?: string
          is_featured?: boolean
          location?: string | null
          slug: string
          stats_label?: string | null
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          category?: string
          completion_date?: string | null
          created_at?: string
          description?: string | null
          detail_description?: string | null
          duration_or_stats?: string | null
          id?: string
          is_featured?: boolean
          location?: string | null
          slug?: string
          stats_label?: string | null
          status?: string
          title?: string
          updated_at?: string
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
      restore_logs: {
        Row: {
          affected_tables: string[]
          backup_id: string | null
          completed_at: string | null
          created_at: string
          created_by: string | null
          database_version: string | null
          error_message: string | null
          estimated_downtime: number
          id: string
          restore_type: string
          rollback_status: string | null
          started_at: string | null
          status: string
          validation_passed: boolean | null
        }
        Insert: {
          affected_tables?: string[]
          backup_id?: string | null
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          database_version?: string | null
          error_message?: string | null
          estimated_downtime?: number
          id?: string
          restore_type?: string
          rollback_status?: string | null
          started_at?: string | null
          status?: string
          validation_passed?: boolean | null
        }
        Update: {
          affected_tables?: string[]
          backup_id?: string | null
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          database_version?: string | null
          error_message?: string | null
          estimated_downtime?: number
          id?: string
          restore_type?: string
          rollback_status?: string | null
          started_at?: string | null
          status?: string
          validation_passed?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "restore_logs_backup_id_fkey"
            columns: ["backup_id"]
            isOneToOne: false
            referencedRelation: "backup_logs"
            referencedColumns: ["id"]
          },
        ]
      }
      reviews: {
        Row: {
          booking_id: string
          comment: string | null
          created_at: string
          id: string
          is_public: boolean
          rating: number
          staff_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          booking_id: string
          comment?: string | null
          created_at?: string
          id?: string
          is_public?: boolean
          rating: number
          staff_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          booking_id?: string
          comment?: string | null
          created_at?: string
          id?: string
          is_public?: boolean
          rating?: number
          staff_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      role_permissions: {
        Row: {
          created_at: string
          permission_id: string
          role_id: string
        }
        Insert: {
          created_at?: string
          permission_id: string
          role_id: string
        }
        Update: {
          created_at?: string
          permission_id?: string
          role_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "role_permissions_permission_id_fkey"
            columns: ["permission_id"]
            isOneToOne: false
            referencedRelation: "permissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "role_permissions_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
        ]
      }
      roles: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_system: boolean
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_system?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_system?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      security_events: {
        Row: {
          country: string | null
          created_at: string
          details: Json | null
          device: string | null
          event_type: string
          id: string
          ip_address: string | null
          resolved: boolean
          resolved_at: string | null
          session_id: string | null
          severity: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          country?: string | null
          created_at?: string
          details?: Json | null
          device?: string | null
          event_type: string
          id?: string
          ip_address?: string | null
          resolved?: boolean
          resolved_at?: string | null
          session_id?: string | null
          severity?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          country?: string | null
          created_at?: string
          details?: Json | null
          device?: string | null
          event_type?: string
          id?: string
          ip_address?: string | null
          resolved?: boolean
          resolved_at?: string | null
          session_id?: string | null
          severity?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      service_addons: {
        Row: {
          created_at: string
          description: string | null
          duration: string | null
          id: string
          name: string
          price: number | null
          service_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          duration?: string | null
          id?: string
          name: string
          price?: number | null
          service_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          duration?: string | null
          id?: string
          name?: string
          price?: number | null
          service_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_addons_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      service_analytics: {
        Row: {
          created_at: string
          event_type: string
          id: string
          service_id: string
        }
        Insert: {
          created_at?: string
          event_type: string
          id?: string
          service_id: string
        }
        Update: {
          created_at?: string
          event_type?: string
          id?: string
          service_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_analytics_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      service_categories: {
        Row: {
          banner: string | null
          created_at: string
          description: string | null
          display_order: number
          icon: string | null
          id: string
          name: string
          parent_id: string | null
          slug: string
          status: string
          updated_at: string
        }
        Insert: {
          banner?: string | null
          created_at?: string
          description?: string | null
          display_order?: number
          icon?: string | null
          id?: string
          name: string
          parent_id?: string | null
          slug: string
          status?: string
          updated_at?: string
        }
        Update: {
          banner?: string | null
          created_at?: string
          description?: string | null
          display_order?: number
          icon?: string | null
          id?: string
          name?: string
          parent_id?: string | null
          slug?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "service_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      service_faqs: {
        Row: {
          answer: string
          created_at: string
          display_order: number
          id: string
          question: string
          service_id: string
        }
        Insert: {
          answer: string
          created_at?: string
          display_order?: number
          id?: string
          question: string
          service_id: string
        }
        Update: {
          answer?: string
          created_at?: string
          display_order?: number
          id?: string
          question?: string
          service_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_faqs_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      service_features: {
        Row: {
          created_at: string
          display_order: number
          feature: string
          id: string
          is_included: boolean
          service_id: string
        }
        Insert: {
          created_at?: string
          display_order?: number
          feature: string
          id?: string
          is_included?: boolean
          service_id: string
        }
        Update: {
          created_at?: string
          display_order?: number
          feature?: string
          id?: string
          is_included?: boolean
          service_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_features_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      service_images: {
        Row: {
          caption: string | null
          created_at: string
          display_order: number
          id: string
          image_type: string
          image_url: string
          service_id: string
        }
        Insert: {
          caption?: string | null
          created_at?: string
          display_order?: number
          id?: string
          image_type: string
          image_url: string
          service_id: string
        }
        Update: {
          caption?: string | null
          created_at?: string
          display_order?: number
          id?: string
          image_type?: string
          image_url?: string
          service_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_images_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      service_locations: {
        Row: {
          created_at: string
          id: string
          location: string
          location_type: string
          service_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          location: string
          location_type?: string
          service_id: string
        }
        Update: {
          created_at?: string
          id?: string
          location?: string
          location_type?: string
          service_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_locations_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      services: {
        Row: {
          banner_image: string | null
          base_price: number | null
          best_seller: boolean
          canonical_url: string | null
          category_id: string | null
          created_at: string
          currency: string
          deposit_required: boolean
          description: string | null
          discount_price: number | null
          duration: string | null
          estimated_duration: string | null
          featured: boolean
          featured_image: string | null
          id: string
          instant_booking: boolean
          is_appointment_required: boolean
          keywords: string | null
          limited_time_offer: boolean
          maximum_time: string | null
          minimum_charge: number | null
          minimum_time: string | null
          name: string
          og_image: string | null
          online_payment_enabled: boolean
          popular: boolean
          price_type: string
          quote_required: boolean
          recommended: boolean
          seasonal_offer: boolean
          seo_description: string | null
          seo_title: string | null
          service_code: string | null
          service_icon: string | null
          short_description: string | null
          slug: string
          status: string
          tax_included: boolean
          total_bookings: number
          total_views: number
          updated_at: string
        }
        Insert: {
          banner_image?: string | null
          base_price?: number | null
          best_seller?: boolean
          canonical_url?: string | null
          category_id?: string | null
          created_at?: string
          currency?: string
          deposit_required?: boolean
          description?: string | null
          discount_price?: number | null
          duration?: string | null
          estimated_duration?: string | null
          featured?: boolean
          featured_image?: string | null
          id?: string
          instant_booking?: boolean
          is_appointment_required?: boolean
          keywords?: string | null
          limited_time_offer?: boolean
          maximum_time?: string | null
          minimum_charge?: number | null
          minimum_time?: string | null
          name: string
          og_image?: string | null
          online_payment_enabled?: boolean
          popular?: boolean
          price_type?: string
          quote_required?: boolean
          recommended?: boolean
          seasonal_offer?: boolean
          seo_description?: string | null
          seo_title?: string | null
          service_code?: string | null
          service_icon?: string | null
          short_description?: string | null
          slug: string
          status?: string
          tax_included?: boolean
          total_bookings?: number
          total_views?: number
          updated_at?: string
        }
        Update: {
          banner_image?: string | null
          base_price?: number | null
          best_seller?: boolean
          canonical_url?: string | null
          category_id?: string | null
          created_at?: string
          currency?: string
          deposit_required?: boolean
          description?: string | null
          discount_price?: number | null
          duration?: string | null
          estimated_duration?: string | null
          featured?: boolean
          featured_image?: string | null
          id?: string
          instant_booking?: boolean
          is_appointment_required?: boolean
          keywords?: string | null
          limited_time_offer?: boolean
          maximum_time?: string | null
          minimum_charge?: number | null
          minimum_time?: string | null
          name?: string
          og_image?: string | null
          online_payment_enabled?: boolean
          popular?: boolean
          price_type?: string
          quote_required?: boolean
          recommended?: boolean
          seasonal_offer?: boolean
          seo_description?: string | null
          seo_title?: string | null
          service_code?: string | null
          service_icon?: string | null
          short_description?: string | null
          slug?: string
          status?: string
          tax_included?: boolean
          total_bookings?: number
          total_views?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "services_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "service_categories"
            referencedColumns: ["id"]
          },
        ]
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
      system_settings: {
        Row: {
          created_at: string
          description: string | null
          id: string
          key: string
          module: string
          updated_at: string
          value: Json | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          key: string
          module?: string
          updated_at?: string
          value?: Json | null
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          key?: string
          module?: string
          updated_at?: string
          value?: Json | null
        }
        Relationships: []
      }
      testimonials: {
        Row: {
          avatar_url: string | null
          client_name: string
          company: string | null
          content: string
          created_at: string
          id: string
          is_active: boolean
          location: string | null
          rating: number | null
          role: string | null
          sort_order: number
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          client_name: string
          company?: string | null
          content: string
          created_at?: string
          id?: string
          is_active?: boolean
          location?: string | null
          rating?: number | null
          role?: string | null
          sort_order?: number
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          client_name?: string
          company?: string | null
          content?: string
          created_at?: string
          id?: string
          is_active?: boolean
          location?: string | null
          rating?: number | null
          role?: string | null
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          role_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          role_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          role_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_sessions: {
        Row: {
          browser: string | null
          country: string | null
          created_at: string
          device: string | null
          id: string
          ip_address: string | null
          is_active: boolean
          last_activity_at: string
          logged_in_at: string
          logged_out_at: string | null
          os: string | null
          session_id: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          browser?: string | null
          country?: string | null
          created_at?: string
          device?: string | null
          id?: string
          ip_address?: string | null
          is_active?: boolean
          last_activity_at?: string
          logged_in_at?: string
          logged_out_at?: string | null
          os?: string | null
          session_id: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          browser?: string | null
          country?: string | null
          created_at?: string
          device?: string | null
          id?: string
          ip_address?: string | null
          is_active?: boolean
          last_activity_at?: string
          logged_in_at?: string
          logged_out_at?: string | null
          os?: string | null
          session_id?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      worker_kyw: {
        Row: {
          created_at: string | null
          document_status: string
          document_type: string
          document_url: string | null
          id: string
          rejection_reason: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          document_status?: string
          document_type: string
          document_url?: string | null
          id?: string
          rejection_reason?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          document_status?: string
          document_type?: string
          document_url?: string | null
          id?: string
          rejection_reason?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      webhook_deliveries: {
        Row: {
          attempt_number: number
          created_at: string
          duration_ms: number | null
          endpoint_id: string
          error_message: string | null
          event_id: string
          http_status: number | null
          id: string
          response_body: string | null
          status: string
        }
        Insert: {
          attempt_number?: number
          created_at?: string
          duration_ms?: number | null
          endpoint_id: string
          error_message?: string | null
          event_id: string
          http_status?: number | null
          id?: string
          response_body?: string | null
          status?: string
        }
        Update: {
          attempt_number?: number
          created_at?: string
          duration_ms?: number | null
          endpoint_id?: string
          error_message?: string | null
          event_id?: string
          http_status?: number | null
          id?: string
          response_body?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "webhook_deliveries_endpoint_id_fkey"
            columns: ["endpoint_id"]
            isOneToOne: false
            referencedRelation: "webhook_endpoints"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "webhook_deliveries_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "webhook_events"
            referencedColumns: ["id"]
          },
        ]
      }
      webhook_endpoints: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          events: string[]
          id: string
          is_active: boolean
          secret: string
          updated_at: string
          url: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          events?: string[]
          id?: string
          is_active?: boolean
          secret: string
          updated_at?: string
          url: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          events?: string[]
          id?: string
          is_active?: boolean
          secret?: string
          updated_at?: string
          url?: string
        }
        Relationships: []
      }
      webhook_events: {
        Row: {
          created_at: string
          error_message: string | null
          event_type: string
          id: string
          max_retries: number
          next_retry_at: string | null
          payload: Json
          processed_at: string | null
          retry_count: number
          source: string
          status: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          event_type: string
          id?: string
          max_retries?: number
          next_retry_at?: string | null
          payload?: Json
          processed_at?: string | null
          retry_count?: number
          source?: string
          status?: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          event_type?: string
          id?: string
          max_retries?: number
          next_retry_at?: string | null
          payload?: Json
          processed_at?: string | null
          retry_count?: number
          source?: string
          status?: string
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
      admin_get_user_email: { Args: { _user_id: string }; Returns: string }
      admin_toggle_user_ban: { Args: { _user_id: string; _lock: boolean }; Returns: undefined }
      calculate_loyalty_tier: { Args: { points: number }; Returns: string }
      check_referral_limit: { Args: { p_user_id: string }; Returns: boolean }
      emit_webhook_event: {
        Args: { _event_type: string; _payload: Json; _source: string }
        Returns: string
      }
      generate_referral_code: { Args: { p_user_id: string }; Returns: string }
      get_user_permissions: {
        Args: { _user_id: string }
        Returns: {
          code: string
          module: string
          name: string
        }[]
      }
      get_user_roles_with_details: {
        Args: { _user_id: string }
        Returns: {
          assigned_at: string
          role_id: string
          role_name: string
        }[]
      }
      has_any_permission: {
        Args: { _permission_codes: string[]; _user_id: string }
        Returns: boolean
      }
      has_permission: {
        Args: { _permission_code: string; _user_id: string }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      increment_service_views: {
        Args: { service_slug: string }
        Returns: undefined
      }
      is_room_participant: {
        Args: { _room_id: string; _user_id: string }
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
      redeem_points_for_booking: {
        Args: { p_booking_id: string; p_points: number; p_user_id: string }
        Returns: number
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
