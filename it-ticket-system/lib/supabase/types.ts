import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      organizations: {
        Row: {
          id: string;
          name: string;
          slug: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          created_at?: string;
        };
      };
      profiles: {
        Row: {
          id: string;
          organization_id: string | null;
          full_name: string;
          email: string;
          avatar_url: string | null;
          role: 'owner' | 'admin' | 'agent' | 'requester';
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          organization_id?: string | null;
          full_name: string;
          email: string;
          avatar_url?: string | null;
          role?: 'owner' | 'admin' | 'agent' | 'requester';
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string | null;
          full_name?: string;
          email?: string;
          avatar_url?: string | null;
          role?: 'owner' | 'admin' | 'agent' | 'requester';
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      tickets: {
        Row: {
          id: string;
          organization_id: string;
          title: string;
          description: string;
          category: string | null;
          tags: string[] | null;
          priority: 'low' | 'medium' | 'high' | 'critical';
          status: 'open' | 'in_progress' | 'resolved' | 'closed';
          created_by: string | null;
          assigned_to: string | null;
          created_at: string;
          updated_at: string;
          resolved_at: string | null;
          closed_at: string | null;
        };
        Insert: {
          id?: string;
          organization_id: string;
          title: string;
          description: string;
          category?: string | null;
          tags?: string[] | null;
          priority?: 'low' | 'medium' | 'high' | 'critical';
          status?: 'open' | 'in_progress' | 'resolved' | 'closed';
          created_by?: string | null;
          assigned_to?: string | null;
          created_at?: string;
          updated_at?: string;
          resolved_at?: string | null;
          closed_at?: string | null;
        };
        Update: {
          id?: string;
          organization_id?: string;
          title?: string;
          description?: string;
          category?: string | null;
          tags?: string[] | null;
          priority?: 'low' | 'medium' | 'high' | 'critical';
          status?: 'open' | 'in_progress' | 'resolved' | 'closed';
          assigned_to?: string | null;
          created_at?: string;
          updated_at?: string;
          resolved_at?: string | null;
          closed_at?: string | null;
        };
      };
      comments: {
        Row: {
          id: string;
          ticket_id: string;
          user_id: string | null;
          message: string;
          is_internal: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          ticket_id: string;
          user_id?: string | null;
          message: string;
          is_internal?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          ticket_id?: string;
          user_id?: string | null;
          message?: string;
          is_internal?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      ticket_activity_logs: {
        Row: {
          id: string;
          ticket_id: string;
          user_id: string | null;
          action: string;
          old_value: string | null;
          new_value: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          ticket_id: string;
          user_id?: string | null;
          action: string;
          old_value?: string | null;
          new_value?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          ticket_id?: string;
          user_id?: string | null;
          action?: string;
          old_value?: string | null;
          new_value?: string | null;
          created_at?: string;
        };
      };
      organization_invitations: {
        Row: {
          id: string;
          organization_id: string;
          email: string;
          role: 'owner' | 'admin' | 'agent' | 'requester';
          invited_by: string | null;
          token: string;
          expires_at: string;
          status: 'pending' | 'accepted' | 'expired' | 'revoked';
          created_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          email: string;
          role?: 'owner' | 'admin' | 'agent' | 'requester';
          invited_by?: string | null;
          token: string;
          expires_at: string;
          status?: 'pending' | 'accepted' | 'expired' | 'revoked';
          created_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          email?: string;
          role?: 'owner' | 'admin' | 'agent' | 'requester';
          invited_by?: string | null;
          token?: string;
          expires_at?: string;
          status?: 'pending' | 'accepted' | 'expired' | 'revoked';
          created_at?: string;
        };
      };
    };
  };
}

// Signup related types
export type SignupUserType = 'owner' | 'employee' | 'customer';

export interface SignupInput {
  full_name: string;
  email: string;
  password: string;
  user_type: SignupUserType;
  organization_name?: string; // Only for owner
  invitation_code?: string; // Only for employee/customer
}

export interface InvitationValidationResult {
  success: boolean;
  error?: string;
  error_type?: 'validation' | 'invalid' | 'expired' | 'revoked' | 'already_used' | 'org_not_found' | 'email_mismatch' | 'no_invitation' | 'system';
  invitation_id?: string;
  organization_id?: string;
  organization_name?: string;
  email?: string;
  role?: 'owner' | 'admin' | 'agent' | 'requester';
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
  role?: 'owner' | 'admin' | 'agent' | 'requester';
}

export interface JoinOrganizationResult {
  success: boolean;
  error?: string;
  error_type?: string;
  organization_id?: string;
  organization_name?: string;
  role?: 'owner' | 'admin' | 'agent' | 'requester';
  message?: string;
}

// Invitation types
export interface Invitation {
  id: string;
  organization_id: string;
  email: string;
  role: 'owner' | 'admin' | 'agent' | 'requester';
  invited_by: string | null;
  token: string;
  expires_at: string;
  status: 'pending' | 'accepted' | 'expired' | 'revoked';
  created_at: string;
}

export interface CreateInvitationParams {
  organization_id: string;
  email: string;
  role?: 'admin' | 'agent' | 'requester';
  expires_in_days?: number;
}

export interface CreateInvitationResult {
  success: boolean;
  error?: string;
  invitation_id?: string;
  token?: string;
  email?: string;
  role?: 'admin' | 'agent' | 'requester';
  expires_at?: string;
  message?: string;
}

export interface GetPendingInvitationsResult {
  success: boolean;
  error?: string;
  invitations?: Invitation[];
}

export interface RevokeInvitationResult {
  success: boolean;
  error?: string;
  message?: string;
}

