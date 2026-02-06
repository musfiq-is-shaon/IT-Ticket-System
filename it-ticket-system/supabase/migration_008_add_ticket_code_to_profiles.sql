-- Migration: Add ticket_code to profiles to track customer's associated ticket
-- This ensures customers can only see their specific ticket

-- Add ticket_code column to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS ticket_code TEXT;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_profiles_ticket_code ON profiles(ticket_code);

-- Update join_organization_by_ticket to also save ticket_code in profile
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

  -- Insert or update profile with organization AND ticket_code
  INSERT INTO public.profiles (id, full_name, email, avatar_url, role, organization_id, ticket_code, is_active)
  VALUES (
    p_user_id,
    COALESCE(p_full_name, p_email),
    p_email,
    NULL,
    'requester',
    v_org_id,
    p_ticket_code,
    TRUE
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = COALESCE(p_full_name, EXCLUDED.full_name, p_email),
    email = p_email,
    role = 'requester',
    organization_id = v_org_id,
    ticket_code = p_ticket_code,
    is_active = TRUE,
    updated_at = NOW();

  RETURN json_build_object(
    'success', true,
    'organization_id', v_org_id,
    'organization_name', v_organization.name,
    'role', 'requester',
    'ticket_id', v_ticket.id,
    'ticket_code', v_ticket.ticket_code,
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

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.join_organization_by_ticket TO anon;
GRANT EXECUTE ON FUNCTION public.join_organization_by_ticket TO authenticated;
GRANT EXECUTE ON FUNCTION public.join_organization_by_ticket TO postgres;

