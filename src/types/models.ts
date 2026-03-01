import type { Database } from "./database";

// ── Existing tables ─────────────────────────────────────────

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type Connection = Database["public"]["Tables"]["connections"]["Row"];
export type Conversation = Database["public"]["Tables"]["conversations"]["Row"];
export type ConversationParticipant = Database["public"]["Tables"]["conversation_participants"]["Row"];
export type Message = Database["public"]["Tables"]["messages"]["Row"];
export type JobPost = Database["public"]["Tables"]["job_posts"]["Row"];
export type JobApplication = Database["public"]["Tables"]["job_applications"]["Row"];

// ── Production company tables ───────────────────────────────

export type ProductionCompany = Database["public"]["Tables"]["production_companies"]["Row"];
export type ProductionCompanyInsert = Database["public"]["Tables"]["production_companies"]["Insert"];
export type ProductionCompanyUpdate = Database["public"]["Tables"]["production_companies"]["Update"];

export type CompanyMember = Database["public"]["Tables"]["production_company_members"]["Row"];
export type CompanyMemberInsert = Database["public"]["Tables"]["production_company_members"]["Insert"];

export type CompanyInvitation = Database["public"]["Tables"]["company_invitations"]["Row"];
export type CompanyInvitationInsert = Database["public"]["Tables"]["company_invitations"]["Insert"];

export type Production = Database["public"]["Tables"]["productions"]["Row"];
export type ProductionInsert = Database["public"]["Tables"]["productions"]["Insert"];
export type ProductionUpdate = Database["public"]["Tables"]["productions"]["Update"];

export type AuditLogEntry = Database["public"]["Tables"]["audit_log"]["Row"];

// ── Enums ───────────────────────────────────────────────────

export type CompanyRole = Database["public"]["Enums"]["company_role"];
export type CompanyTier = Database["public"]["Enums"]["company_tier"];
export type TierStatus = Database["public"]["Enums"]["tier_status"];
export type ProductionStatus = Database["public"]["Enums"]["production_status"];
export type ProductionType = Database["public"]["Enums"]["production_type"];
export type BudgetRange = Database["public"]["Enums"]["budget_range"];
export type InvitationStatus = Database["public"]["Enums"]["invitation_status"];