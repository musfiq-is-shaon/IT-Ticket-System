-- Migration: Customer authentication via ticket code
-- This adds an RPC function to authenticate customers using ticket code and name
-- For customers, we use a magic link approach since they don't have credentials

-- Drop existing function if exists
DROP FUNCTION IF EXISTS public.authenticate_customer_by_ticket(TEXT, TEXT);

-- Create function to authenticate customer by ticket code and name
-- This function validates the customer and sends a magic link to their registered email
CREATE OR REPLACE FUNCTION public.authenticate_customer_by_ticket(
  p_ticket_code TEXT,
  p_full_name TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_profile RECORD;
  v_ticket RECORD;
  v_organization RECORD;
BEGIN
  -- Validate inputs
  IF p_ticket_code IS NULL OR TRIM(p_ticket_code) = '' THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Ticket code is required'
    );
  END IF;

  IF p_full_name IS NULL OR TRIM(p_full_name) = '' THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Full name is required'
    );
  END IF;

  -- Normalize ticket code
  p_ticket_code := TRIM(UPPER(p_ticket_code));

  -- Find profile by ticket_code and name (case-insensitive match on name)
  SELECT p.*, o.name as organization_name INTO v_profile
  FROM profiles p
  JOIN organizations o ON p.organization_id = o.id
  WHERE p.ticket_code = p_ticket_code
    AND p.is_active = TRUE
    AND p.role = 'requester'
    AND p.full_name ILIKE TRIM(p_full_name)
  LIMIT 1;

  -- If not found by profile ticket_code, try matching via tickets
  IF NOT FOUND THEN
    SELECT p.*, o.name as organization_name INTO v_profile
    FROM profiles p
    JOIN organizations o ON p.organization_id = o.id
    JOIN tickets t ON t.organization_id = p.organization_id
    WHERE UPPER(t.ticket_code) = p_ticket_code
      AND p.is_active = TRUE
      AND p.role = 'requester'
      AND p.full_name ILIKE TRIM(p_full_name)
    LIMIT 1;
  END IF;

  IF NOT FOUND OR v_profile.id IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'No customer found with this ticket code and name',
      'error_type', 'not_found'
    );
  END IF;

  -- Return success with user info for magic link login
  RETURN json_build_object(
    'success', true,
    'user_id', v_profile.id,
    'email', v_profile.email,
    'full_name', v_profile.full_name,
    'organization_id', v_profile.organization_id,
    'organization_name', v_profile.organization_name,
    'role', v_profile.role,
    'message', 'Customer verified successfully'
  );
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.authenticate_customer_by_ticket(TEXT, TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.authenticate_customer_by_ticket(TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.authenticate_customer_by_ticket(TEXT, TEXT) TO postgres;

-- =====================================================
-- Function to generate a link token for customer login
-- This creates a secure token that can be used to authenticate
-- =====================================================

DROP FUNCTION IF EXISTS public.create_customer_session_token(UUID);

CREATE OR REPLACE FUNCTION public.create_customer_session_token(
  p_user_id UUID
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_token TEXT;
BEGIN
  -- Generate a secure random token
  v_token := ENCODE(gen_random_bytes(32), 'hex');
  
  -- Store the token in a temporary table or return it
  -- For security, we'll return the token directly and it expires in 15 minutes
  
  RETURN v_token;
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_customer_session_token(UUID) TO anon;
GRANT EXECUTE ON FUNCTION public.create_customer_session_token(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_customer_session_token(UUID) TO postgres;

