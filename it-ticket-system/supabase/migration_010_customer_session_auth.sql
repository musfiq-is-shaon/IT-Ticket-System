-- Migration: Token-based Customer Authentication
-- This fixes the customer login issue where email domain "ticket.local" is rejected
-- Instead of using magic links (which require valid email delivery),
-- we use a secure token exchange flow that bypasses email verification

-- =====================================================
-- 1. Create a table to store customer session tokens
-- =====================================================

CREATE TABLE IF NOT EXISTS public.customer_session_tokens (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  token TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  used_at TIMESTAMPTZ
);

-- Index for fast token lookup
CREATE INDEX IF NOT EXISTS idx_customer_session_tokens_token ON public.customer_session_tokens(token);
CREATE INDEX IF NOT EXISTS idx_customer_session_tokens_user ON public.customer_session_tokens(user_id);

-- =====================================================
-- 2. Update authenticate_customer_by_ticket to create and return a session token
-- =====================================================

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
  v_token TEXT;
  v_token_id UUID;
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

  -- Find profile by ticket_code and name
  SELECT p.*, o.name as organization_name INTO v_profile
  FROM profiles p
  JOIN organizations o ON p.organization_id = o.id
  WHERE p.ticket_code = p_ticket_code
    AND p.is_active = TRUE
    AND p.role = 'requester'
    AND p.full_name ILIKE TRIM(p_full_name)
  LIMIT 1;

  -- If not found by profile ticket_code, try matching via tickets table
  IF NOT FOUND OR v_profile.id IS NULL THEN
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

  -- Generate a secure session token
  v_token := ENCODE(gen_random_bytes(32), 'hex');
  
  -- Clean up expired tokens for this user first
  DELETE FROM public.customer_session_tokens 
  WHERE user_id = v_profile.id 
  AND expires_at < NOW();

  -- Insert the new token (expires in 15 minutes)
  INSERT INTO public.customer_session_tokens (user_id, token, expires_at)
  VALUES (v_profile.id, v_token, NOW() + INTERVAL '15 minutes')
  RETURNING id INTO v_token_id;

  -- Return success with login token
  RETURN json_build_object(
    'success', true,
    'user_id', v_profile.id,
    'email', v_profile.email,
    'full_name', v_profile.full_name,
    'organization_id', v_profile.organization_id,
    'organization_name', v_profile.organization_name,
    'role', v_profile.role,
    'login_token', v_token,
    'expires_in', 900,  -- 15 minutes in seconds
    'message', 'Customer verified successfully'
  );
END;
$$;

-- =====================================================
-- 3. Create function to exchange session token for a session
-- This creates a session directly without needing email verification
-- =====================================================

DROP FUNCTION IF EXISTS public.exchange_customer_session_token(TEXT);

CREATE OR REPLACE FUNCTION public.exchange_customer_session_token(
  p_token TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_token_record RECORD;
  v_profile RECORD;
BEGIN
  -- Validate input
  IF p_token IS NULL OR TRIM(p_token) = '' THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Session token is required'
    );
  END IF;

  -- Look up the token
  SELECT * INTO v_token_record
  FROM public.customer_session_tokens
  WHERE token = TRIM(p_token)
  LIMIT 1;

  -- Check if token exists
  IF v_token_record.id IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Invalid or expired session token',
      'error_type', 'invalid_token'
    );
  END IF;

  -- Check if token is expired
  IF v_token_record.expires_at < NOW() THEN
    -- Clean up expired token
    DELETE FROM public.customer_session_tokens WHERE id = v_token_record.id;
    RETURN json_build_object(
      'success', false,
      'error', 'Session token has expired. Please try logging in again.',
      'error_type', 'expired_token'
    );
  END IF;

  -- Check if token was already used
  IF v_token_record.used_at IS NOT NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Session token has already been used',
      'error_type', 'token_used'
    );
  END IF;

  -- Get the user profile
  SELECT * INTO v_profile
  FROM profiles
  WHERE id = v_token_record.user_id
  LIMIT 1;

  IF v_profile.id IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'User profile not found',
      'error_type', 'profile_not_found'
    );
  END IF;

  -- Mark token as used
  UPDATE public.customer_session_tokens
  SET used_at = NOW()
  WHERE id = v_token_record.id;

  -- Return success with user info
  RETURN json_build_object(
    'success', true,
    'user_id', v_profile.id,
    'email', v_profile.email,
    'full_name', v_profile.full_name,
    'organization_id', v_profile.organization_id,
    'organization_name', (SELECT name FROM organizations WHERE id = v_profile.organization_id),
    'role', v_profile.role,
    'message', 'Session token exchanged successfully'
  );
EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object(
    'success', false,
    'error', 'Failed to exchange session token: ' || SQLERRM,
    'error_type', 'system'
  );
END;
$$;

-- =====================================================
-- 4. Grant execute permissions
-- =====================================================

GRANT EXECUTE ON FUNCTION public.authenticate_customer_by_ticket(TEXT, TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.authenticate_customer_by_ticket(TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.authenticate_customer_by_ticket(TEXT, TEXT) TO postgres;

GRANT EXECUTE ON FUNCTION public.exchange_customer_session_token(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.exchange_customer_session_token(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.exchange_customer_session_token(TEXT) TO postgres;

GRANT SELECT, INSERT, DELETE ON public.customer_session_tokens TO anon, authenticated, postgres;

-- =====================================================
-- 5. Helper function to clean up expired tokens (can be called via cron)
-- =====================================================

DROP FUNCTION IF EXISTS public.cleanup_expired_customer_tokens();

CREATE OR REPLACE FUNCTION public.cleanup_expired_customer_tokens()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_deleted_count INTEGER;
BEGIN
  DELETE FROM public.customer_session_tokens WHERE expires_at < NOW();
  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
  RETURN v_deleted_count;
END;
$$;

GRANT EXECUTE ON FUNCTION public.cleanup_expired_customer_tokens() TO postgres;

-- =====================================================
-- 6. Verification
-- =====================================================

-- Check if functions exist
SELECT proname FROM pg_proc WHERE proname IN (
  'authenticate_customer_by_ticket',
  'exchange_customer_session_token',
  'cleanup_expired_customer_tokens'
);

-- Check if table exists
SELECT table_name FROM information_schema.tables 
WHERE table_name = 'customer_session_tokens';

-- List all customer session tokens (for debugging - limit to recent)
SELECT id, user_id, token, expires_at, created_at, used_at
FROM public.customer_session_tokens
ORDER BY created_at DESC
LIMIT 10;

-- =====================================================
-- END OF MIGRATION

