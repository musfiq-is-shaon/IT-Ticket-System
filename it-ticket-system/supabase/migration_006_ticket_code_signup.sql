-- Migration: Ticket Code Signup & Customer Permissions
-- Run this in Supabase SQL Editor to enable:
-- 1. Ticket codes for customer signup
-- 2. Restrict customers from editing tickets

-- =====================================================
-- 1. Add ticket_code column to tickets table
-- =====================================================

ALTER TABLE tickets ADD COLUMN IF NOT EXISTS ticket_code TEXT UNIQUE;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_tickets_ticket_code ON tickets(ticket_code);

-- =====================================================
-- 2. Drop existing functions if they exist
-- =====================================================
DROP FUNCTION IF EXISTS public.validate_ticket_code(TEXT);
DROP FUNCTION IF EXISTS public.join_organization_by_ticket(UUID, TEXT, TEXT, TEXT);
DROP FUNCTION IF EXISTS public.generate_ticket_code(UUID);

-- =====================================================
-- 3. Create RPC function to validate ticket code
-- Returns ticket/organization info if valid for signup
-- =====================================================

CREATE OR REPLACE FUNCTION public.validate_ticket_code(
  p_ticket_code TEXT
) RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_ticket RECORD;
  v_organization RECORD;
BEGIN
  -- Validate inputs
  IF p_ticket_code IS NULL OR p_ticket_code = '' THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Ticket code is required',
      'error_type', 'validation'
    );
  END IF;

  -- Normalize ticket code (uppercase, trim spaces)
  p_ticket_code := UPPER(TRIM(p_ticket_code));

  -- Look up ticket by ticket_code
  SELECT * INTO v_ticket
  FROM tickets
  WHERE ticket_code = p_ticket_code
  LIMIT 1;

  -- Check if ticket exists
  IF v_ticket.id IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Invalid ticket code. Please check and try again.',
      'error_type', 'invalid'
    );
  END IF;

  -- Check if ticket has a valid organization
  IF v_ticket.organization_id IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Ticket does not belong to an organization',
      'error_type', 'org_not_found'
    );
  END IF;

  -- Get organization details
  SELECT * INTO v_organization
  FROM organizations
  WHERE id = v_ticket.organization_id
  LIMIT 1;

  IF v_organization.id IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Organization not found',
      'error_type', 'org_not_found'
    );
  END IF;

  -- Return success with ticket and organization details
  RETURN json_build_object(
    'success', true,
    'ticket_id', v_ticket.id,
    'ticket_title', v_ticket.title,
    'organization_id', v_ticket.organization_id,
    'organization_name', v_organization.name,
    'message', 'Ticket code is valid. You can now create an account.'
  );
EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object(
    'success', false,
    'error', 'Failed to validate ticket code: ' || SQLERRM,
    'error_type', 'system'
  );
END;
$$;

-- =====================================================
-- 4. Create RPC function to join organization via ticket code
-- Creates user profile with 'requester' role
-- =====================================================

CREATE OR REPLACE FUNCTION public.join_organization_by_ticket(
  p_user_id UUID,
  p_full_name TEXT,
  p_email TEXT,
  p_ticket_code TEXT
) RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_ticket RECORD;
  v_organization RECORD;
  v_org_id UUID;
BEGIN
  -- Validate inputs
  IF p_user_id IS NULL OR p_email IS NULL OR p_ticket_code IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Missing required parameters'
    );
  END IF;

  -- Normalize ticket code
  p_ticket_code := UPPER(TRIM(p_ticket_code));

  -- Look up ticket by ticket_code
  SELECT * INTO v_ticket
  FROM tickets
  WHERE ticket_code = p_ticket_code
  LIMIT 1;

  -- Check if ticket exists
  IF v_ticket.id IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Invalid ticket code. Please check and try again.',
      'error_type', 'invalid_ticket'
    );
  END IF;

  -- Check if ticket has organization
  IF v_ticket.organization_id IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Ticket does not belong to an organization',
      'error_type', 'org_not_found'
    );
  END IF;

  v_org_id := v_ticket.organization_id;

  -- Verify organization exists
  SELECT * INTO v_organization
  FROM organizations
  WHERE id = v_org_id
  LIMIT 1;

  IF v_organization.id IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Organization not found',
      'error_type', 'org_not_found'
    );
  END IF;

  -- Insert or update profile with organization (as requester/customer)
  INSERT INTO public.profiles (id, full_name, email, avatar_url, role, organization_id, is_active)
  VALUES (
    p_user_id,
    COALESCE(p_full_name, p_email),
    p_email,
    NULL,
    'requester',  -- Customers always get 'requester' role
    v_org_id,
    TRUE
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = COALESCE(p_full_name, EXCLUDED.full_name, p_email),
    email = p_email,
    role = 'requester',  -- Ensure customers are requesters
    organization_id = v_org_id,
    is_active = TRUE,
    updated_at = NOW();

  RETURN json_build_object(
    'success', true,
    'organization_id', v_org_id,
    'organization_name', v_organization.name,
    'role', 'requester',
    'ticket_id', v_ticket.id,
    'ticket_title', v_ticket.title,
    'message', 'Successfully joined ' || v_organization.name || ' as a customer'
  );
EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object(
    'success', false,
    'error', 'Failed to join organization: ' || SQLERRM,
    'error_type', 'system'
  );
END;
$$;

-- =====================================================
-- 5. Create function to generate unique ticket code
-- =====================================================

CREATE OR REPLACE FUNCTION public.generate_ticket_code()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  v_code TEXT;
  v_exists BOOLEAN;
BEGIN
  -- Generate unique ticket code (format: TC-XXXX-XXXX-XXXX)
  LOOP
    v_code := 'TC-' || 
      UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 4)) || '-' ||
      UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 4)) || '-' ||
      UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 4));
    
    -- Check if code already exists
    SELECT EXISTS (
      SELECT 1 FROM tickets WHERE ticket_code = v_code
    ) INTO v_exists;
    
    EXIT WHEN NOT v_exists;
  END LOOP;
  
  RETURN v_code;
END;
$$;

-- =====================================================
-- 6. Update RLS policies for TICKETS
-- Prevent customers (requester role) from editing tickets
-- =====================================================

ALTER TABLE tickets DISABLE ROW LEVEL SECURITY;

-- Drop existing ticket policies
DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN 
    SELECT policyname FROM pg_policies 
    WHERE tablename = 'tickets' 
    AND schemaname = 'public'
  LOOP
    EXECUTE 'DROP POLICY IF EXISTS "' || pol.policyname || '" ON tickets';
  END LOOP;
END $$;

-- =====================================================
-- TICKETS SELECT POLICY - View tickets
-- =====================================================

-- Requesters: View only their own tickets (read-only)
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

-- =====================================================
-- TICKETS INSERT POLICY - Create tickets
-- =====================================================

-- Authenticated users can create tickets (checked via profile exists)
CREATE POLICY "Authenticated users can create tickets"
  ON tickets FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
    )
  );

-- =====================================================
-- TICKETS UPDATE POLICY - Edit tickets
-- =====================================================

-- Agents: Can update assigned tickets (status, priority, assignment)
CREATE POLICY "Agents can update assigned tickets"
  ON tickets FOR UPDATE
  USING (
    assigned_to = auth.uid()
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'owner')
    )
  )
  WITH CHECK (
    assigned_to = auth.uid()
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'owner')
    )
  );

-- Admins/Owners: Can update any ticket in organization
CREATE POLICY "Admins can update all tickets in organization"
  ON tickets FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND organization_id = tickets.organization_id
      AND role IN ('admin', 'owner')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND organization_id = tickets.organization_id
      AND role IN ('admin', 'owner')
    )
  );

-- CRITICAL: Requesters CANNOT update tickets (read-only)
-- By not creating an UPDATE policy for requesters, they cannot update
-- The SELECT policy above only grants read access

-- Enable RLS
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 7. Grant execute permissions
-- =====================================================

GRANT EXECUTE ON FUNCTION public.validate_ticket_code TO authenticated;
GRANT EXECUTE ON FUNCTION public.validate_ticket_code TO anon;
GRANT EXECUTE ON FUNCTION public.validate_ticket_code TO postgres;

GRANT EXECUTE ON FUNCTION public.join_organization_by_ticket TO authenticated;
GRANT EXECUTE ON FUNCTION public.join_organization_by_ticket TO anon;
GRANT EXECUTE ON FUNCTION public.join_organization_by_ticket TO postgres;

GRANT EXECUTE ON FUNCTION public.generate_ticket_code TO authenticated;
GRANT EXECUTE ON FUNCTION public.generate_ticket_code TO postgres;

-- =====================================================
-- 8. Update trigger to auto-generate ticket_code
-- =====================================================

DROP TRIGGER IF EXISTS generate_ticket_code ON tickets;

CREATE OR REPLACE FUNCTION set_ticket_code()
RETURNS TRIGGER AS $$
BEGIN
  -- Only set ticket_code if not already set
  IF NEW.ticket_code IS NULL OR NEW.ticket_code = '' THEN
    NEW.ticket_code := public.generate_ticket_code();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER generate_ticket_code
  BEFORE INSERT ON tickets
  FOR EACH ROW
  EXECUTE FUNCTION set_ticket_code();

-- =====================================================
-- 9. Verification
-- =====================================================

-- Check if functions exist
SELECT proname FROM pg_proc WHERE proname IN (
  'validate_ticket_code',
  'join_organization_by_ticket',
  'generate_ticket_code',
  'set_ticket_code'
);

-- List all ticket policies
SELECT tablename, policyname, cmd, qual
FROM pg_policies
WHERE schemaname = 'public'
AND tablename = 'tickets'
ORDER BY policyname;

-- Check if ticket_code column exists
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'tickets' 
AND column_name = 'ticket_code';

-- =====================================================
-- END OF MIGRATION

