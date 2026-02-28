import type { Database } from "./database";

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type Connection = Database["public"]["Tables"]["connections"]["Row"];
export type Conversation = Database["public"]["Tables"]["conversations"]["Row"];
export type ConversationParticipant = Database["public"]["Tables"]["conversation_participants"]["Row"];
export type Message = Database["public"]["Tables"]["messages"]["Row"];
export type JobPost = Database["public"]["Tables"]["job_posts"]["Row"];
export type JobApplication = Database["public"]["Tables"]["job_applications"]["Row"];