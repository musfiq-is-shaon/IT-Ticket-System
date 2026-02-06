// Database types for IT Ticket Management System
// Generated from Supabase schema

export type UserRole = 'owner' | 'admin' | 'agent' | 'requester';
export type TicketPriority = 'low' | 'medium' | 'high' | 'critical';
export type TicketStatus = 'open' | 'in_progress' | 'resolved' | 'closed';

export interface Organization {
  id: string;
  name: string;
  slug: string;
  created_at: string;
}

export interface Profile {
  id: string;
  organization_id: string | null;
  full_name: string;
  email: string;
  avatar_url: string | null;
  role: UserRole;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Ticket {
  id: string;
  organization_id: string;
  title: string;
  description: string;
  category: string | null;
  tags: string[] | null;
  priority: TicketPriority;
  status: TicketStatus;
  created_by: string | null;
  assigned_to: string | null;
  created_at: string;
  updated_at: string;
  resolved_at: string | null;
  closed_at: string | null;
  ticket_code: string | null; // For customer signup
}

// Ticket with joined profile data
export interface TicketWithDetails extends Ticket {
  // From created_by join
  created_by_name?: string | null;
  created_by_email?: string | null;
  // From assigned_to join  
  assigned_to_name?: string | null;
  assigned_to_email?: string | null;
  assigned_to_role?: UserRole | null;
  organization_name?: string | null;
  // Full profile joins
  created_by_profile?: Pick<Profile, 'id' | 'full_name' | 'email' | 'avatar_url' | 'role'> | null;
  assigned_to_profile?: Pick<Profile, 'id' | 'full_name' | 'email' | 'avatar_url' | 'role'> | null;
}

export interface Comment {
  id: string;
  ticket_id: string;
  user_id: string | null;
  message: string;
  is_internal: boolean;
  created_at: string;
  updated_at: string;
}

// Comment with joined user profile
export interface CommentWithUser extends Comment {
  user_profile?: Pick<Profile, 'id' | 'full_name' | 'email' | 'avatar_url' | 'role'> | null;
}

export interface TicketActivityLog {
  id: string;
  ticket_id: string;
  user_id: string | null;
  action: string;
  old_value: string | null;
  new_value: string | null;
  created_at: string;
}

// Activity with joined user profile
export interface TicketActivityWithUser extends TicketActivityLog {
  user_profile?: Pick<Profile, 'id' | 'full_name' | 'email'> | null;
}

export interface OrganizationInvitation {
  id: string;
  organization_id: string;
  email: string;
  role: UserRole;
  invited_by: string | null;
  token: string;
  expires_at: string;
  status: 'pending' | 'accepted' | 'expired' | 'revoked';
  created_at: string;
}

export interface DashboardStats {
  organization_id: string;
  open_tickets: number;
  in_progress_tickets: number;
  resolved_tickets: number;
  closed_tickets: number;
  critical_tickets: number;
  high_priority_tickets: number;
  total_tickets: number;
}

// Helper types for form submissions
export interface CreateTicketInput {
  title: string;
  description: string;
  category?: string;
  tags?: string[];
  priority?: TicketPriority;
}

export interface UpdateTicketInput {
  title?: string;
  description?: string;
  priority?: TicketPriority;
  status?: TicketStatus;
  assigned_to?: string | null;
}

export interface CreateCommentInput {
  message: string;
  is_internal?: boolean;
}

// Signup related types
export type SignupUserType = 'owner' | 'employee' | 'customer';

export interface SignupInput {
  full_name: string;
  email: string;
  password: string;
  user_type: SignupUserType;
  organization_name?: string; // Only for owner
  invitation_code?: string; // Only for employee
  ticket_code?: string; // Only for customer
}

export interface InvitationValidationResult {
  success: boolean;
  error?: string;
  error_type?: 'validation' | 'invalid' | 'expired' | 'revoked' | 'already_used' | 'org_not_found' | 'email_mismatch' | 'no_invitation' | 'system';
  invitation_id?: string;
  organization_id?: string;
  organization_name?: string;
  email?: string;
  role?: UserRole;
  invited_by?: string;
  expires_at?: string;
  message?: string;
  expected_email?: string;
}

export interface OrganizationCreationResult {
  success: boolean;
  error?: string;
  organization_id?: string;
  slug?: string;
  role?: UserRole;
}

export interface JoinOrganizationResult {
  success: boolean;
  error?: string;
  error_type?: string;
  organization_id?: string;
  organization_name?: string;
  role?: UserRole;
  message?: string;
}

// Database results
export type Tables = {
  organizations: Organization;
  profiles: Profile;
  tickets: Ticket;
  comments: Comment;
  ticket_activity_logs: TicketActivityLog;
  organization_invitations: OrganizationInvitation;
};

export type Enums = {
  user_role: UserRole;
  ticket_priority: TicketPriority;
  ticket_status: TicketStatus;
};

// =========================================
// TICKET CODE SIGNUP TYPES (NEW)
// =========================================

export interface TicketCodeValidationResult {
  success: boolean;
  error?: string;
  error_type?: 'validation' | 'invalid' | 'org_not_found' | 'system';
  ticket_id?: string;
  ticket_title?: string;
  organization_id?: string;
  organization_name?: string;
  message?: string;
}

export interface JoinByTicketResult {
  success: boolean;
  error?: string;
  error_type?: string;
  organization_id?: string;
  organization_name?: string;
  role?: UserRole;
  ticket_id?: string;
  ticket_title?: string;
  message?: string;
}

