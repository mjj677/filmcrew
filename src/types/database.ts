export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          username: string;
          display_name: string | null;
          bio: string | null;
          position: string | null;
          location: string | null;
          country: string | null;
          profile_image_url: string | null;
          showreel_url: string | null;
          skills: string[];
          experience_years: number | null;
          availability_status: "available" | "busy" | "not_looking";
          is_verified: boolean;
          is_premium: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          username: string;
          display_name?: string | null;
          bio?: string | null;
          position?: string | null;
          location?: string | null;
          country?: string | null;
          profile_image_url?: string | null;
          showreel_url?: string | null;
          skills?: string[];
          experience_years?: number | null;
          availability_status?: "available" | "busy" | "not_looking";
          is_verified?: boolean;
          is_premium?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          email?: string;
          username?: string;
          display_name?: string | null;
          bio?: string | null;
          position?: string | null;
          location?: string | null;
          country?: string | null;
          profile_image_url?: string | null;
          showreel_url?: string | null;
          skills?: string[];
          experience_years?: number | null;
          availability_status?: "available" | "busy" | "not_looking";
          is_verified?: boolean;
          is_premium?: boolean;
        };
      };
      connections: {
        Row: {
          id: string;
          requester_id: string;
          recipient_id: string;
          status: "pending" | "accepted" | "declined";
          created_at: string;
        };
        Insert: {
          id?: string;
          requester_id: string;
          recipient_id: string;
          status?: "pending" | "accepted" | "declined";
          created_at?: string;
        };
        Update: {
          status?: "pending" | "accepted" | "declined";
        };
      };
      conversations: {
        Row: {
          id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          created_at?: string;
        };
        Update: never;
      };
      conversation_participants: {
        Row: {
          id: string;
          conversation_id: string;
          user_id: string;
          joined_at: string;
        };
        Insert: {
          id?: string;
          conversation_id: string;
          user_id: string;
          joined_at?: string;
        };
        Update: never;
      };
      messages: {
        Row: {
          id: string;
          conversation_id: string;
          sender_id: string;
          body: string;
          read_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          conversation_id: string;
          sender_id: string;
          body: string;
          read_at?: string | null;
          created_at?: string;
        };
        Update: {
          read_at?: string | null;
        };
      };
      job_posts: {
        Row: {
          id: string;
          posted_by: string;
          title: string;
          company: string | null;
          description: string;
          location: string | null;
          is_remote: boolean;
          type: "full-time" | "part-time" | "contract" | "freelance" | null;
          category: string | null;
          experience_level: "entry" | "mid" | "senior" | "any" | null;
          project_type: string | null;
          compensation: string | null;
          deadline: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          posted_by: string;
          title: string;
          company?: string | null;
          description: string;
          location?: string | null;
          is_remote?: boolean;
          type?: "full-time" | "part-time" | "contract" | "freelance" | null;
          category?: string | null;
          experience_level?: "entry" | "mid" | "senior" | "any" | null;
          project_type?: string | null;
          compensation?: string | null;
          deadline?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          title?: string;
          company?: string | null;
          description?: string;
          location?: string | null;
          is_remote?: boolean;
          type?: "full-time" | "part-time" | "contract" | "freelance" | null;
          category?: string | null;
          experience_level?: "entry" | "mid" | "senior" | "any" | null;
          project_type?: string | null;
          compensation?: string | null;
          deadline?: string | null;
          is_active?: boolean;
        };
      };
      job_applications: {
        Row: {
          id: string;
          job_id: string;
          applicant_id: string;
          cover_message: string | null;
          status: "pending" | "reviewed" | "accepted" | "rejected";
          created_at: string;
        };
        Insert: {
          id?: string;
          job_id: string;
          applicant_id: string;
          cover_message?: string | null;
          status?: "pending" | "reviewed" | "accepted" | "rejected";
          created_at?: string;
        };
        Update: {
          cover_message?: string | null;
          status?: "pending" | "reviewed" | "accepted" | "rejected";
        };
      };
    };
  };
};

// Convenience types
export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type Connection = Database["public"]["Tables"]["connections"]["Row"];
export type Conversation = Database["public"]["Tables"]["conversations"]["Row"];
export type ConversationParticipant = Database["public"]["Tables"]["conversation_participants"]["Row"];
export type Message = Database["public"]["Tables"]["messages"]["Row"];
export type JobPost = Database["public"]["Tables"]["job_posts"]["Row"];
export type JobApplication = Database["public"]["Tables"]["job_applications"]["Row"];