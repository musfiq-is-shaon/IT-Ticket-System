-- IT Ticket Management System - Database Schema
-- Execute this file in your Supabase SQL Editor

-- =====================================================
-- 1. ENUMS
-- =====================================================

-- User roles hierarchy: owner > admin > agent > requester
CREATE TYPE user_role AS ENUM ('owner', 'admin', 'agent', 'requester');

-- Ticket priority levels
CREATE TYPE ticket_priority AS ENUM ('low', 'medium', 'high', 'critical');

-- Ticket status flow: open -> in_progress -> resolved -> closed
CREATE TYPE ticket_status AS ENUM ('open', 'in_progress', 'resolved', 'closed');

-- =====================================================
-- 2. ORGANIZATIONS TABLE
-- =====================================================

CREATE TABLE organizations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  CONSTRAINT organizations_name_length CHECK (LENGTH(TRIM(name)) >= 2)
);

-- =====================================================
-- 3. PROFILES TABLE (extends Supabase auth.users)
-- =====================================================

CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  avatar_url TEXT,
  role user_role DEFAULT 'requester' NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  CONSTRAINT profiles_name_length CHECK (LENGTH(TRIM(full_name)) >= 2),
  CONSTRAINT profiles_email_format CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

-- Index for faster lookups
CREATE INDEX idx_profiles_organization ON profiles(organization_id);
CREATE INDEX idx_profiles_role ON profiles(role);

-- =====================================================
-- 4. TICKETS TABLE
-- =====================================================

CREATE TABLE tickets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  
  -- Ticket content
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT,
  tags TEXT[],
  
  -- Status tracking
  priority ticket_priority DEFAULT 'medium' NOT NULL,
  status ticket_status DEFAULT 'open' NOT NULL,
  
  -- Relationships
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  assigned_to UUID REFERENCES profiles(id) ON DELETE SET NULL,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  resolved_at TIMESTAMPTZ,
  closed_at TIMESTAMPTZ,
  
  CONSTRAINT tickets_title_length CHECK (LENGTH(TRIM(title)) >= 5),
  CONSTRAINT tickets_description_length CHECK (LENGTH(TRIM(description)) >= 10)
);

-- Indexes for efficient queries
CREATE INDEX idx_tickets_organization ON tickets(organization_id);
CREATE INDEX idx_tickets_created_by ON tickets(created_by);
CREATE INDEX idx_tickets_assigned_to ON tickets(assigned_to);
CREATE INDEX idx_tickets_status ON tickets(status);
CREATE INDEX idx_tickets_priority ON tickets(priority);
CREATE INDEX idx_tickets_created_at ON tickets(created_at DESC);

-- =====================================================
-- 5. COMMENTS TABLE
-- =====================================================

CREATE TABLE comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_id UUID REFERENCES tickets(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL NOT NULL,
  message TEXT NOT NULL,
  is_internal BOOLEAN DEFAULT FALSE, -- Internal notes only visible to staff
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  CONSTRAINT comments_message_length CHECK (LENGTH(TRIM(message)) >= 1)
);

-- Indexes
CREATE INDEX idx_comments_ticket ON comments(ticket_id);
CREATE INDEX idx_comments_user ON comments(user_id);
CREATE INDEX idx_comments_created_at ON comments(created_at ASC);

-- =====================================================
-- 6. TICKET ACTIVITY LOGS (Audit Trail)
-- =====================================================

CREATE TABLE ticket_activity_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_id UUID REFERENCES tickets(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  
  -- Action types
  action TEXT NOT NULL,
  old_value TEXT,
  new_value TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Indexes
CREATE INDEX idx_activity_ticket ON ticket_activity_logs(ticket_id);
CREATE INDEX idx_activity_user ON ticket_activity_logs(user_id);
CREATE INDEX idx_activity_created_at ON ticket_activity_logs(created_at DESC);

-- =====================================================
-- 7. ORGANIZATION INVITATIONS
-- =====================================================

CREATE TABLE organization_invitations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  email TEXT NOT NULL,
  role user_role DEFAULT 'requester' NOT NULL,
  invited_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  token TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired', 'revoked')),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  CONSTRAINT invitation_email_format CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
  CONSTRAINT invitation_expiry CHECK (expires_at > NOW())
);

CREATE INDEX idx_invitations_organization ON organization_invitations(organization_id);
CREATE INDEX idx_invitations_token ON organization_invitations(token);
CREATE INDEX idx_invitations_email ON organization_invitations(email);

-- =====================================================
-- 8. ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_invitations ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- ORGANIZATIONS RLS
-- =====================================================

-- Everyone can view organizations (limited info)
CREATE POLICY "Organizations are viewable by everyone"
  ON organizations FOR SELECT
  USING (true);

-- Only system can insert organizations (via trigger)
CREATE POLICY "Organizations can only be inserted by system"
  ON organizations FOR INSERT
  WITH CHECK (false);

-- =====================================================
-- PROFILES RLS
-- =====================================================

-- Users can view all profiles within their organization
CREATE POLICY "Users can view profiles in their organization"
  ON profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles AS p2
      WHERE p2.id = auth.uid()
      AND p2.organization_id = profiles.organization_id
    )
  );

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (id = auth.uid());

-- Only admins/owners can update other profiles
CREATE POLICY "Admins can update profiles in their organization"
  ON profiles FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles AS updater
      WHERE updater.id = auth.uid()
      AND updater.organization_id = profiles.organization_id
      AND updater.role IN ('admin', 'owner')
    )
  );

-- Only system can insert profiles (via trigger)
CREATE POLICY "Profiles can only be inserted by system"
  ON profiles FOR INSERT
  WITH CHECK (false);

-- =====================================================
-- TICKETS RLS
-- =====================================================

-- Requesters: View only their own tickets
CREATE POLICY "Requesters can view own tickets"
  ON tickets FOR SELECT
  USING (
    created_by = auth.uid()
    OR assigned_to = auth.uid()
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'owner', 'agent')
    )
  );

-- Agents: View tickets assigned to them
CREATE POLICY "Agents can view assigned tickets"
  ON tickets FOR SELECT
  USING (
    assigned_to = auth.uid()
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'owner')
    )
  );

-- Admins/Owners: View all tickets in organization
CREATE POLICY "Admins can view all tickets in organization"
  ON tickets FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND organization_id = tickets.organization_id
      AND role IN ('admin', 'owner')
    )
  );

-- Requesters: Create tickets
CREATE POLICY "Authenticated users can create tickets"
  ON tickets FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
    )
  );

-- Requesters: Update their own tickets (limited fields)
CREATE POLICY "Requesters can update own tickets"
  ON tickets FOR UPDATE
  USING (
    created_by = auth.uid()
    AND status IN ('open', 'in_progress')
  )
  WITH CHECK (
    created_by = auth.uid()
    AND status IN ('open', 'in_progress', 'resolved')
  );

-- Agents: Update assigned tickets
CREATE POLICY "Agents can update assigned tickets"
  ON tickets FOR UPDATE
  USING (
    assigned_to = auth.uid()
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'owner')
    )
  );

-- Admins: Update any ticket in organization
CREATE POLICY "Admins can update all tickets in organization"
  ON tickets FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND organization_id = tickets.organization_id
      AND role IN ('admin', 'owner')
    )
  );

-- =====================================================
-- COMMENTS RLS
-- =====================================================

-- Users in organization can view comments
CREATE POLICY "Users can view comments on tickets they can access"
  ON comments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM tickets
      WHERE id = comments.ticket_id
      AND (
        created_by = auth.uid()
        OR assigned_to = auth.uid()
        OR EXISTS (
          SELECT 1 FROM profiles
          WHERE id = auth.uid()
          AND role IN ('admin', 'owner')
        )
      )
    )
  );

-- Authenticated users can create comments
CREATE POLICY "Authenticated users can create comments"
  ON comments FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Users can update their own comments
CREATE POLICY "Users can update own comments"
  ON comments FOR UPDATE
  USING (user_id = auth.uid());

-- Admins can update any comment
CREATE POLICY "Admins can update any comment"
  ON comments FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'owner')
    )
  );

-- =====================================================
-- ACTIVITY LOGS RLS
-- =====================================================

-- View activity logs for accessible tickets
CREATE POLICY "Users can view activity logs for accessible tickets"
  ON ticket_activity_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM tickets
      WHERE id = ticket_activity_logs.ticket_id
      AND (
        created_by = auth.uid()
        OR assigned_to = auth.uid()
        OR EXISTS (
          SELECT 1 FROM profiles
          WHERE id = auth.uid()
          AND role IN ('admin', 'owner')
        )
      )
    )
  );

-- Only system inserts activity logs (via trigger)
CREATE POLICY "Activity logs only inserted by system"
  ON ticket_activity_logs FOR INSERT
  WITH CHECK (false);

-- =====================================================
-- INVITATIONS RLS
-- =====================================================

-- Invited users can view their pending invitations
CREATE POLICY "Users can view their own invitations"
  ON organization_invitations FOR SELECT
  USING (
    email IN (SELECT email FROM profiles WHERE id = auth.uid())
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'owner')
    )
  );

-- Admins can manage invitations
CREATE POLICY "Admins can manage invitations"
  ON organization_invitations FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'owner')
    )
  );

-- =====================================================
-- 9. FUNCTIONS & TRIGGERS
-- =====================================================

-- Function to handle new user signup - creates organization and profile
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  org_id UUID;
  org_name TEXT;
  org_slug TEXT;
BEGIN
  -- Get organization name from metadata
  org_name := NEW.raw_user_meta_data->>'organization_name';
  
  -- If no organization name provided, use email domain or default
  IF org_name IS NULL OR org_name = '' THEN
    org_name := COALESCE(SPLIT_PART(NEW.email, '@', 2), 'default') || ' Organization';
  END IF;
  
  -- Create slug from organization name
  org_slug := LOWER(REGEXP_REPLACE(COALESCE(org_name, 'organization'), '[^a-z0-9]+', '-', 'g'));
  org_slug := TRIM(BOTH '-' FROM org_slug);
  
  -- Check if organization with this slug exists, create if not
  SELECT id INTO org_id FROM organizations WHERE slug = org_slug LIMIT 1;
  
  IF org_id IS NULL THEN
    -- Create new organization
    INSERT INTO organizations (name, slug) VALUES (org_name, org_slug)
    RETURNING id INTO org_id;
  END IF;
  
  -- Insert profile with organization
  INSERT INTO public.profiles (id, full_name, email, avatar_url, role, organization_id)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NEW.email,
    NEW.raw_user_meta_data->>'avatar_url',
    'owner', -- First user becomes owner
    org_id
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE 'plpgsql';

-- Apply updated_at triggers
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tickets_updated_at
  BEFORE UPDATE ON tickets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_comments_updated_at
  BEFORE UPDATE ON comments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to log ticket activity
CREATE OR REPLACE FUNCTION log_ticket_activity()
RETURNS TRIGGER AS $$
DECLARE
  old_status TEXT;
  new_status TEXT;
  old_priority TEXT;
  new_priority TEXT;
  old_assigned UUID;
  new_assigned UUID;
  actor_id UUID;
BEGIN
  actor_id := auth.uid();
  
  -- Log status changes
  IF TG_OP = 'UPDATE' AND (OLD.status IS DISTINCT FROM NEW.status) THEN
    old_status := OLD.status::TEXT;
    new_status := NEW.status::TEXT;
    INSERT INTO ticket_activity_logs (ticket_id, user_id, action, old_value, new_value)
    VALUES (NEW.id, actor_id, 'status_changed', old_status, new_status);
  END IF;
  
  -- Log priority changes
  IF TG_OP = 'UPDATE' AND (OLD.priority IS DISTINCT FROM NEW.priority) THEN
    old_priority := OLD.priority::TEXT;
    new_priority := NEW.priority::TEXT;
    INSERT INTO ticket_activity_logs (ticket_id, user_id, action, old_value, new_value)
    VALUES (NEW.id, actor_id, 'priority_changed', old_priority, new_priority);
  END IF;
  
  -- Log assignment changes
  IF TG_OP = 'UPDATE' AND (OLD.assigned_to IS DISTINCT FROM NEW.assigned_to) THEN
    old_assigned := OLD.assigned_to;
    new_assigned := NEW.assigned_to;
    INSERT INTO ticket_activity_logs (ticket_id, user_id, action, old_value, new_value)
    VALUES (NEW.id, actor_id, 'assigned', old_assigned::TEXT, new_assigned::TEXT);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for activity logging
CREATE TRIGGER ticket_activity_trigger
  AFTER UPDATE ON tickets
  FOR EACH ROW EXECUTE FUNCTION log_ticket_activity();

-- =====================================================
-- 10. VIEWS
-- =====================================================

-- View for tickets with assignee details
CREATE OR REPLACE VIEW tickets_with_details AS
SELECT 
  t.*,
  creator.full_name as created_by_name,
  creator.email as created_by_email,
  assignee.full_name as assigned_to_name,
  assignee.email as assigned_to_email,
  assignee.role as assigned_to_role,
  org.name as organization_name
FROM tickets t
LEFT JOIN profiles creator ON t.created_by = creator.id
LEFT JOIN profiles assignee ON t.assigned_to = assignee.id
LEFT JOIN organizations org ON t.organization_id = org.id;

-- View for dashboard statistics
CREATE OR REPLACE VIEW dashboard_stats AS
SELECT 
  organization_id,
  COUNT(*) FILTER (WHERE status = 'open') as open_tickets,
  COUNT(*) FILTER (WHERE status = 'in_progress') as in_progress_tickets,
  COUNT(*) FILTER (WHERE status = 'resolved') as resolved_tickets,
  COUNT(*) FILTER (WHERE status = 'closed') as closed_tickets,
  COUNT(*) FILTER (WHERE priority = 'critical') as critical_tickets,
  COUNT(*) FILTER (WHERE priority = 'high') as high_priority_tickets,
  COUNT(*) as total_tickets
FROM tickets
GROUP BY organization_id;

-- =====================================================
-- 11. SEED DATA (Optional - Run separately)
-- =====================================================

-- Create a demo organization
-- INSERT INTO organizations (name, slug) VALUES ('Demo Company', 'demo-company');

-- =====================================================
-- END OF SCHEMA
-- =====================================================

