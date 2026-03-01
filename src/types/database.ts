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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      audit_log: {
        Row: {
          action: string
          actor_id: string | null
          company_id: string | null
          created_at: string
          id: string
          metadata: Json | null
          target_id: string | null
          target_type: string | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          company_id?: string | null
          created_at?: string
          id?: string
          metadata?: Json | null
          target_id?: string | null
          target_type?: string | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          company_id?: string | null
          created_at?: string
          id?: string
          metadata?: Json | null
          target_id?: string | null
          target_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_log_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_log_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "production_companies"
            referencedColumns: ["id"]
          },
        ]
      }
      company_invitations: {
        Row: {
          company_id: string
          created_at: string
          expires_at: string
          id: string
          invited_by: string
          invited_email: string | null
          invited_user_id: string | null
          responded_at: string | null
          role: Database["public"]["Enums"]["company_role"]
          status: Database["public"]["Enums"]["invitation_status"]
        }
        Insert: {
          company_id: string
          created_at?: string
          expires_at?: string
          id?: string
          invited_by: string
          invited_email?: string | null
          invited_user_id?: string | null
          responded_at?: string | null
          role?: Database["public"]["Enums"]["company_role"]
          status?: Database["public"]["Enums"]["invitation_status"]
        }
        Update: {
          company_id?: string
          created_at?: string
          expires_at?: string
          id?: string
          invited_by?: string
          invited_email?: string | null
          invited_user_id?: string | null
          responded_at?: string | null
          role?: Database["public"]["Enums"]["company_role"]
          status?: Database["public"]["Enums"]["invitation_status"]
        }
        Relationships: [
          {
            foreignKeyName: "company_invitations_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "production_companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_invitations_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_invitations_invited_user_id_fkey"
            columns: ["invited_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      connections: {
        Row: {
          created_at: string
          id: string
          recipient_id: string
          requester_id: string
          status: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          recipient_id: string
          requester_id: string
          status?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          recipient_id?: string
          requester_id?: string
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "connections_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "connections_requester_id_fkey"
            columns: ["requester_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      conversation_participants: {
        Row: {
          conversation_id: string
          id: string
          joined_at: string
          user_id: string
        }
        Insert: {
          conversation_id: string
          id?: string
          joined_at?: string
          user_id: string
        }
        Update: {
          conversation_id?: string
          id?: string
          joined_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversation_participants_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversation_participants_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          created_at: string
          id: string
        }
        Insert: {
          created_at?: string
          id?: string
        }
        Update: {
          created_at?: string
          id?: string
        }
        Relationships: []
      }
      job_applications: {
        Row: {
          applicant_id: string
          cover_message: string | null
          created_at: string
          id: string
          job_id: string
          status: string | null
        }
        Insert: {
          applicant_id: string
          cover_message?: string | null
          created_at?: string
          id?: string
          job_id: string
          status?: string | null
        }
        Update: {
          applicant_id?: string
          cover_message?: string | null
          created_at?: string
          id?: string
          job_id?: string
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "job_applications_applicant_id_fkey"
            columns: ["applicant_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_applications_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "job_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      job_posts: {
        Row: {
          category: string | null
          company: string | null
          compensation: string | null
          created_at: string
          deadline: string | null
          description: string
          experience_level: string | null
          flagged_reason: string | null
          id: string
          is_active: boolean | null
          is_flagged: boolean
          is_remote: boolean | null
          location: string | null
          posted_by: string
          production_id: string | null
          project_type: string | null
          title: string
          type: string | null
          updated_at: string
        }
        Insert: {
          category?: string | null
          company?: string | null
          compensation?: string | null
          created_at?: string
          deadline?: string | null
          description: string
          experience_level?: string | null
          flagged_reason?: string | null
          id?: string
          is_active?: boolean | null
          is_flagged?: boolean
          is_remote?: boolean | null
          location?: string | null
          posted_by: string
          production_id?: string | null
          project_type?: string | null
          title: string
          type?: string | null
          updated_at?: string
        }
        Update: {
          category?: string | null
          company?: string | null
          compensation?: string | null
          created_at?: string
          deadline?: string | null
          description?: string
          experience_level?: string | null
          flagged_reason?: string | null
          id?: string
          is_active?: boolean | null
          is_flagged?: boolean
          is_remote?: boolean | null
          location?: string | null
          posted_by?: string
          production_id?: string | null
          project_type?: string | null
          title?: string
          type?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_posts_posted_by_fkey"
            columns: ["posted_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_posts_production_id_fkey"
            columns: ["production_id"]
            isOneToOne: false
            referencedRelation: "productions"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          body: string
          conversation_id: string
          created_at: string
          id: string
          read_at: string | null
          sender_id: string
        }
        Insert: {
          body: string
          conversation_id: string
          created_at?: string
          id?: string
          read_at?: string | null
          sender_id: string
        }
        Update: {
          body?: string
          conversation_id?: string
          created_at?: string
          id?: string
          read_at?: string | null
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      production_companies: {
        Row: {
          city: string | null
          country: string | null
          created_at: string
          deleted_at: string | null
          description: string | null
          id: string
          is_verified: boolean
          logo_url: string | null
          max_active_jobs_per_production: number
          max_active_productions: number
          name: string
          owner_id: string
          slug: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          tier: Database["public"]["Enums"]["company_tier"]
          tier_cancel_at: string | null
          tier_expires_at: string | null
          tier_started_at: string | null
          tier_status: Database["public"]["Enums"]["tier_status"]
          updated_at: string
          website_url: string | null
        }
        Insert: {
          city?: string | null
          country?: string | null
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          id?: string
          is_verified?: boolean
          logo_url?: string | null
          max_active_jobs_per_production?: number
          max_active_productions?: number
          name: string
          owner_id: string
          slug: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          tier?: Database["public"]["Enums"]["company_tier"]
          tier_cancel_at?: string | null
          tier_expires_at?: string | null
          tier_started_at?: string | null
          tier_status?: Database["public"]["Enums"]["tier_status"]
          updated_at?: string
          website_url?: string | null
        }
        Update: {
          city?: string | null
          country?: string | null
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          id?: string
          is_verified?: boolean
          logo_url?: string | null
          max_active_jobs_per_production?: number
          max_active_productions?: number
          name?: string
          owner_id?: string
          slug?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          tier?: Database["public"]["Enums"]["company_tier"]
          tier_cancel_at?: string | null
          tier_expires_at?: string | null
          tier_started_at?: string | null
          tier_status?: Database["public"]["Enums"]["tier_status"]
          updated_at?: string
          website_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "production_companies_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      production_company_members: {
        Row: {
          company_id: string
          created_at: string
          id: string
          permissions: Json | null
          role: Database["public"]["Enums"]["company_role"]
          user_id: string
        }
        Insert: {
          company_id: string
          created_at?: string
          id?: string
          permissions?: Json | null
          role?: Database["public"]["Enums"]["company_role"]
          user_id: string
        }
        Update: {
          company_id?: string
          created_at?: string
          id?: string
          permissions?: Json | null
          role?: Database["public"]["Enums"]["company_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "production_company_members_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "production_companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "production_company_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      productions: {
        Row: {
          budget_range: Database["public"]["Enums"]["budget_range"] | null
          company_id: string
          country: string | null
          created_at: string
          created_by: string
          deleted_at: string | null
          description: string | null
          end_date: string | null
          id: string
          is_published: boolean
          location: string | null
          poster_url: string | null
          production_type: Database["public"]["Enums"]["production_type"] | null
          slug: string
          start_date: string | null
          status: Database["public"]["Enums"]["production_status"]
          title: string
          updated_at: string
        }
        Insert: {
          budget_range?: Database["public"]["Enums"]["budget_range"] | null
          company_id: string
          country?: string | null
          created_at?: string
          created_by: string
          deleted_at?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          is_published?: boolean
          location?: string | null
          poster_url?: string | null
          production_type?:
            | Database["public"]["Enums"]["production_type"]
            | null
          slug: string
          start_date?: string | null
          status?: Database["public"]["Enums"]["production_status"]
          title: string
          updated_at?: string
        }
        Update: {
          budget_range?: Database["public"]["Enums"]["budget_range"] | null
          company_id?: string
          country?: string | null
          created_at?: string
          created_by?: string
          deleted_at?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          is_published?: boolean
          location?: string | null
          poster_url?: string | null
          production_type?:
            | Database["public"]["Enums"]["production_type"]
            | null
          slug?: string
          start_date?: string | null
          status?: Database["public"]["Enums"]["production_status"]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "productions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "production_companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "productions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          availability_status: string | null
          bio: string | null
          country: string | null
          created_at: string
          display_name: string | null
          email: string
          experience_years: number | null
          has_completed_setup: boolean
          id: string
          imdb_url: string | null
          is_premium: boolean | null
          is_verified: boolean | null
          location: string | null
          position: string | null
          profile_image_url: string | null
          showreel_url: string | null
          skills: string[] | null
          updated_at: string
          username: string
          website_url: string | null
        }
        Insert: {
          availability_status?: string | null
          bio?: string | null
          country?: string | null
          created_at?: string
          display_name?: string | null
          email: string
          experience_years?: number | null
          has_completed_setup?: boolean
          id: string
          imdb_url?: string | null
          is_premium?: boolean | null
          is_verified?: boolean | null
          location?: string | null
          position?: string | null
          profile_image_url?: string | null
          showreel_url?: string | null
          skills?: string[] | null
          updated_at?: string
          username: string
          website_url?: string | null
        }
        Update: {
          availability_status?: string | null
          bio?: string | null
          country?: string | null
          created_at?: string
          display_name?: string | null
          email?: string
          experience_years?: number | null
          has_completed_setup?: boolean
          id?: string
          imdb_url?: string | null
          is_premium?: boolean | null
          is_verified?: boolean | null
          location?: string | null
          position?: string | null
          profile_image_url?: string | null
          showreel_url?: string | null
          skills?: string[] | null
          updated_at?: string
          username?: string
          website_url?: string | null
        }
        Relationships: []
      }
      reserved_slugs: {
        Row: {
          slug: string
        }
        Insert: {
          slug: string
        }
        Update: {
          slug?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      accept_company_invitation: {
        Args: { p_invitation_id: string }
        Returns: string
      }
      count_active_jobs: { Args: { p_production_id: string }; Returns: number }
      count_active_productions: {
        Args: { p_company_id: string }
        Returns: number
      }
      decline_company_invitation: {
        Args: { p_invitation_id: string }
        Returns: undefined
      }
      find_or_create_conversation: {
        Args: { target_user_id: string }
        Returns: string
      }
      get_company_role: {
        Args: { p_company_id: string; p_user_id?: string }
        Returns: Database["public"]["Enums"]["company_role"]
      }
      get_unread_count: { Args: never; Returns: number }
      is_company_admin: {
        Args: { p_company_id: string; p_user_id?: string }
        Returns: boolean
      }
      is_company_member: {
        Args: { p_company_id: string; p_user_id?: string }
        Returns: boolean
      }
      is_company_owner: {
        Args: { p_company_id: string; p_user_id?: string }
        Returns: boolean
      }
      is_conversation_member: { Args: { conv_id: string }; Returns: boolean }
      is_production_admin: {
        Args: { p_production_id: string; p_user_id?: string }
        Returns: boolean
      }
      is_production_member: {
        Args: { p_production_id: string; p_user_id?: string }
        Returns: boolean
      }
      transfer_company_ownership: {
        Args: { p_company_id: string; p_new_owner_id: string }
        Returns: undefined
      }
      validate_slug: { Args: { input_slug: string }; Returns: boolean }
    }
    Enums: {
      budget_range: "micro" | "low" | "mid" | "high"
      company_role: "owner" | "admin" | "member"
      company_tier: "free" | "pro" | "enterprise"
      invitation_status:
        | "pending"
        | "accepted"
        | "declined"
        | "revoked"
        | "expired"
      production_status:
        | "pre_production"
        | "in_production"
        | "post_production"
        | "wrapped"
        | "cancelled"
      production_type:
        | "feature_film"
        | "short_film"
        | "commercial"
        | "music_video"
        | "series"
        | "documentary"
        | "corporate"
        | "other"
      tier_status: "active" | "past_due" | "cancelled" | "suspended"
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
      budget_range: ["micro", "low", "mid", "high"],
      company_role: ["owner", "admin", "member"],
      company_tier: ["free", "pro", "enterprise"],
      invitation_status: [
        "pending",
        "accepted",
        "declined",
        "revoked",
        "expired",
      ],
      production_status: [
        "pre_production",
        "in_production",
        "post_production",
        "wrapped",
        "cancelled",
      ],
      production_type: [
        "feature_film",
        "short_film",
        "commercial",
        "music_video",
        "series",
        "documentary",
        "corporate",
        "other",
      ],
      tier_status: ["active", "past_due", "cancelled", "suspended"],
    },
  },
} as const
