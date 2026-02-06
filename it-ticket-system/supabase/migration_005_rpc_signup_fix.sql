-- Migration: RPC Function for reliable signup with user type selection
-- Run this in Supabase SQL Editor to fix the signup database error

-- =====================================================
-- 1. Drop existing functions if they exist
-- =====================================================
DROP FUNCTION IF EXISTS public.create_organization_with_owner(UUID, TEXT, TEXT, TEXT, TEXT);
DROP FUNCTION IF EXISTS public.validate_invitation_code(TEXT);
DROP FUNCTION IF EXISTS public.join_organization_by_invitation(UUID, TEXT, TEXT, TEXT, TEXT);
DROP FUNCTION IF EXISTS public.create_invitation_code(UUID, TEXT, TEXT, UUID, INTEGER);
DROP FUNCTION IF EXISTS public.get_pending_invitations(UUID);
DROP FUNCTION IF EXISTS public.revoke_invitation(UUID);

-- =====================================================
-- 2. Create RPC function for OWNER - creates new organization
-- =====================================================

CREATE OR REPLACE FUNCTION public.create_organization_with_owner(
  p_user_id UUID,
  p_full_name TEXT,
  p_email TEXT,
  p_avatar_url TEXT,
  p_organization_name TEXT,
  p_role TEXT DEFAULT 'owner'
) RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_org_id UUID;
  v_org_slug TEXT;
  v_role user_role;
BEGIN
  -- Validate inputs
  IF p_user_id IS NULL OR p_organization_name IS NULL OR p_email IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Missing required parameters'
    );
  END IF;

  -- Validate role
  v_role := LOWER(p_role)::user_role;
  IF v_role NOT IN ('owner', 'admin', 'agent', 'requester') THEN
    v_role := 'owner';
  END IF;

  -- Create slug from organization name (only for owner)
  IF v_role = 'owner' THEN
    v_org_slug := LOWER(REGEXP_REPLACE(p_organization_name, '[^a-z0-9]+', '-', 'g'));
    v_org_slug := TRIM(BOTH '-' FROM v_org_slug);
    v_org_slug := v_org_slug || '-' || LEFT(MD5(p_user_id::TEXT), 8);
    
    -- Create new organization
    INSERT INTO organizations (name, slug) 
    VALUES (p_organization_name, v_org_slug)
    ON CONFLICT (slug) DO NOTHING
    RETURNING id INTO v_org_id;
    
    -- If org_id is null (conflict), get the existing one
    IF v_org_id IS NULL THEN
      SELECT id INTO v_org_id FROM organizations WHERE slug = v_org_slug LIMIT 1;
    END IF;
  ELSE
    -- For non-owner, organization will be set via invitation
    v_org_id := NULL;
  END IF;
  
  -- Insert profile (use ON CONFLICT to be idempotent)
  INSERT INTO public.profiles (id, full_name, email, avatar_url, role, organization_id)
  VALUES (
    p_user_id,
    COALESCE(p_full_name, p_email),
    p_email,
    p_avatar_url,
    v_role,
    v_org_id
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = COALESCE(p_full_name, p_email),
    email = p_email,
    avatar_url = COALESCE(p_avatar_url, EXCLUDED.avatar_url),
    role = EXCLUDED.role,
    organization_id = COALESCE(EXCLUDED.organization_id, public.profiles.organization_id),
    updated_at = NOW();
  
  RETURN json_build_object(
    'success', true,
    'organization_id', v_org_id,
    'slug', v_org_slug,
    'role', v_role
  );
EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object(
    'success', false,
    'error', SQLERRM,
    'detail', SQLDIAG
  );
END;
$$;

-- =====================================================
-- 3. Create RPC function to validate invitation code
-- Returns organization info if valid, error otherwise
-- =====================================================

CREATE OR REPLACE FUNCTION public.validate_invitation_code(
  p_invitation_code TEXT
) RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_invitation RECORD;
  v_organization RECORD;
BEGIN
  -- Validate inputs
  IF p_invitation_code IS NULL OR p_invitation_code = '' THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Invitation code is required',
      'error_type', 'validation'
    );
  END IF;

  -- Look up invitation by token
  SELECT * INTO v_invitation
  FROM organization_invitations
  WHERE token = p_invitation_code
    AND status = 'pending'
    AND expires_at > NOW()
  LIMIT 1;

  -- Check if invitation exists
  IF v_invitation.id IS NULL THEN
    -- Also check for expired or revoked invitations for better error messages
    SELECT * INTO v_invitation
    FROM organization_invitations
    WHERE token = p_invitation_code
    LIMIT 1;
    
    IF v_invitation.id IS NULL THEN
      RETURN json_build_object(
        'success', false,
        'error', 'Invalid invitation code. Please check and try again.',
        'error_type', 'invalid'
      );
    ELSIF v_invitation.status = 'expired' THEN
      RETURN json_build_object(
        'success', false,
        'error', 'This invitation has expired. Please request a new one.',
        'error_type', 'expired'
      );
    ELSIF v_invitation.status = 'revoked' THEN
      RETURN json_build_object(
        'success', false,
        'error', 'This invitation has been revoked.',
        'error_type', 'revoked'
      );
    ELSIF v_invitation.status = 'accepted' THEN
      RETURN json_build_object(
        'success', false,
        'error', 'This invitation has already been used.',
        'error_type', 'already_used'
      );
    END IF;
  END IF;

  -- Get organization details
  SELECT * INTO v_organization
  FROM organizations
  WHERE id = v_invitation.organization_id
  LIMIT 1;

  IF v_organization.id IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Organization not found',
      'error_type', 'org_not_found'
    );
  END IF;

  -- Return success with invitation details
  RETURN json_build_object(
    'success', true,
    'invitation_id', v_invitation.id,
    'organization_id', v_invitation.organization_id,
    'organization_name', v_organization.name,
    'email', v_invitation.email,
    'role', v_invitation.role,
    'invited_by', v_invitation.invited_by,
    'expires_at', v_invitation.expires_at,
    'message', 'Invitation is valid. You can now join this organization.'
  );
EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object(
    'success', false,
    'error', 'Failed to validate invitation: ' || SQLERRM,
    'error_type', 'system'
  );
END;
$$;

-- =====================================================
-- 4. Create RPC function to join organization via invitation
-- Smart handling: accepts invitation code OR auto-joins by email match
-- =====================================================

CREATE OR REPLACE FUNCTION public.join_organization_by_invitation(
  p_user_id UUID,
  p_full_name TEXT,
  p_email TEXT,
  p_avatar_url TEXT,
  p_invitation_code TEXT DEFAULT NULL
) RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_invitation RECORD;
  v_organization RECORD;
  v_role user_role;
  v_org_id UUID;
BEGIN
  -- Validate inputs
  IF p_user_id IS NULL OR p_email IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Missing required parameters'
    );
  END IF;

  -- Initialize
  v_invitation := NULL;
  v_role := 'requester'; -- Default role

  -- SMART INVITATION HANDLING:
  -- 1. If invitation code provided, validate it
  -- 2. If no code but email matches a pending invitation, auto-join
  
  IF p_invitation_code IS NOT NULL AND p_invitation_code != '' THEN
    -- Look up invitation by token
    SELECT * INTO v_invitation
    FROM organization_invitations
    WHERE token = p_invitation_code
      AND status = 'pending'
      AND expires_at > NOW()
    LIMIT 1;
    
    IF v_invitation.id IS NULL THEN
      -- Try to find any invitation with this token for better error message
      SELECT * INTO v_invitation
      FROM organization_invitations
      WHERE token = p_invitation_code
      LIMIT 1;
      
      IF v_invitation.id IS NULL THEN
        RETURN json_build_object(
          'success', false,
          'error', 'Invalid invitation code. Please check and try again.',
          'error_type', 'invalid_code'
        );
      ELSIF v_invitation.status = 'expired' THEN
        RETURN json_build_object(
          'success', false,
          'error', 'This invitation has expired. Please request a new one.',
          'error_type', 'expired'
        );
      ELSIF v_invitation.status = 'accepted' THEN
        RETURN json_build_object(
          'success', false,
          'error', 'This invitation has already been used.',
          'error_type', 'already_used'
        );
      ELSE
        RETURN json_build_object(
          'success', false,
          'error', 'This invitation is no longer valid.',
          'error_type', 'invalid'
        );
      END IF;
    END IF;
    
    -- Check if email matches (if invitation specifies email)
    IF v_invitation.email IS NOT NULL AND v_invitation.email != '' THEN
      IF LOWER(v_invitation.email) != LOWER(p_email) THEN
        RETURN json_build_object(
          'success', false,
          'error', 'This invitation was sent to a different email address.',
          'error_type', 'email_mismatch',
          'expected_email', v_invitation.email
        );
      END IF;
    END IF;
    
    -- Use role from invitation
    v_role := v_invitation.role;
    v_org_id := v_invitation.organization_id;
    
  ELSE
    -- No invitation code - look for pending invitation by email
    SELECT * INTO v_invitation
    FROM organization_invitations
    WHERE LOWER(email) = LOWER(p_email)
      AND status = 'pending'
      AND expires_at > NOW()
    ORDER BY created_at DESC
    LIMIT 1;
    
    IF v_invitation.id IS NOT NULL THEN
      -- Auto-join via email match
      v_role := v_invitation.role;
      v_org_id := v_invitation.organization_id;
    ELSE
      RETURN json_build_object(
        'success', false,
        'error', 'No invitation found for this email. Please provide an invitation code or request an invitation from your organization.',
        'error_type', 'no_invitation'
      );
    END IF;
  END IF;

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

  -- Insert or update profile with organization
  INSERT INTO public.profiles (id, full_name, email, avatar_url, role, organization_id, is_active)
  VALUES (
    p_user_id,
    COALESCE(p_full_name, p_email),
    p_email,
    p_avatar_url,
    v_role,
    v_org_id,
    TRUE
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = COALESCE(p_full_name, EXCLUDED.full_name, p_email),
    email = p_email,
    avatar_url = COALESCE(p_avatar_url, EXCLUDED.avatar_url),
    role = EXCLUDED.role,
    organization_id = v_org_id,
    is_active = TRUE,
    updated_at = NOW();

  -- Mark invitation as accepted
  UPDATE organization_invitations
  SET status = 'accepted'
  WHERE id = v_invitation.id;

  RETURN json_build_object(
    'success', true,
    'organization_id', v_org_id,
    'organization_name', v_organization.name,
    'role', v_role,
    'message', 'Successfully joined ' || v_organization.name
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
-- 5. Create RPC function to generate invitation codes
-- Owners/Admins can create invitations for team members
-- =====================================================

CREATE OR REPLACE FUNCTION public.create_invitation_code(
  p_organization_id UUID,
  p_email TEXT,
  p_role TEXT DEFAULT 'agent',
  p_invited_by UUID DEFAULT NULL,
  p_expires_in_days INTEGER DEFAULT 7
) RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_token TEXT;
  v_invitation_id UUID;
  v_role user_role;
BEGIN
  -- Validate inputs
  IF p_organization_id IS NULL OR p_email IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Organization ID and email are required'
    );
  END IF;

  -- Validate role
  BEGIN
    v_role := LOWER(p_role)::user_role;
  EXCEPTION
    WHEN OTHERS THEN v_role := 'agent';
  END;

  IF v_role NOT IN ('admin', 'agent', 'requester') THEN
    v_role := 'agent';
  END IF;

  -- Generate unique token (format: XXXX-XXXX-XXXX)
  v_token := UPPER(
    SUBSTRING(MD5(p_organization_id::TEXT || p_email || NOW()::TEXT) FROM 1 FOR 4) || '-' ||
    SUBSTRING(MD5(p_email || NOW()::TEXT) FROM 1 FOR 4) || '-' ||
    SUBSTRING(MD5(p_organization_id::TEXT || NOW()::TEXT) FROM 1 FOR 4)
  );

  -- Check if invitation already exists for this email (pending)
  SELECT id INTO v_invitation_id
  FROM organization_invitations
  WHERE organization_id = p_organization_id
    AND LOWER(email) = LOWER(p_email)
    AND status = 'pending'
    AND expires_at > NOW()
  LIMIT 1;

  IF v_invitation_id IS NOT NULL THEN
    -- Update existing invitation with new token and expiry
    UPDATE organization_invitations
    SET token = v_token,
        role = v_role,
        invited_by = p_invited_by,
        expires_at = NOW() + (p_expires_in_days || ' days')::INTERVAL,
        status = 'pending'
    WHERE id = v_invitation_id;
  ELSE
    -- Create new invitation
    INSERT INTO organization_invitations (
      organization_id,
      email,
      role,
      invited_by,
      token,
      expires_at,
      status
    ) VALUES (
      p_organization_id,
      p_email,
      v_role,
      p_invited_by,
      v_token,
      NOW() + (p_expires_in_days || ' days')::INTERVAL,
      'pending'
    )
    RETURNING id INTO v_invitation_id;
  END IF;

  RETURN json_build_object(
    'success', true,
    'invitation_id', v_invitation_id,
    'token', v_token,
    'email', p_email,
    'role', v_role,
    'expires_at', NOW() + (p_expires_in_days || ' days')::INTERVAL,
    'message', 'Invitation created successfully'
  );
EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object(
    'success', false,
    'error', 'Failed to create invitation: ' || SQLERRM
  );
END;
$$;

-- =====================================================
-- 6. Create RPC function to get pending invitations
-- =====================================================

CREATE OR REPLACE FUNCTION public.get_pending_invitations(
  p_organization_id UUID
) RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF p_organization_id IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Organization ID is required'
    );
  END IF;

  RETURN json_build_object(
    'success', true,
    'invitations', (
      SELECT json_agg(
        json_build_object(
          'id', id,
          'email', email,
          'role', role,
          'token', token,
          'status', status,
          'expires_at', expires_at,
          'created_at', created_at
        )
      )
      FROM organization_invitations
      WHERE organization_id = p_organization_id
        AND status = 'pending'
        AND expires_at > NOW()
      ORDER BY created_at DESC
    )
  );
EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object(
    'success', false,
    'error', 'Failed to get invitations: ' || SQLERRM
  );
END;
$$;

-- =====================================================
-- 7. Create RPC function to revoke invitation
-- =====================================================

CREATE OR REPLACE FUNCTION public.revoke_invitation(
  p_invitation_id UUID
) RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF p_invitation_id IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Invitation ID is required'
    );
  END IF;

  UPDATE organization_invitations
  SET status = 'revoked'
  WHERE id = p_invitation_id;

  RETURN json_build_object(
    'success', true,
    'message', 'Invitation revoked successfully'
  );
EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object(
    'success', false,
    'error', 'Failed to revoke invitation: ' || SQLERRM
  );
END;
$$;

-- =====================================================
-- 8. Fix RLS policies for profiles - make them permissive
-- =====================================================

ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN 
    SELECT policyname FROM pg_policies 
    WHERE tablename = 'profiles' 
    AND schemaname = 'public'
  LOOP
    EXECUTE 'DROP POLICY IF EXISTS "' || pol.policyname || '" ON profiles';
  END LOOP;
END $$;

-- Allow anyone to read profiles (needed for dashboard)
CREATE POLICY "Anyone can read profiles" ON profiles
  FOR SELECT USING (true);

-- Allow users to insert their own profile
CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Allow users to update their own profile
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 9. Fix RLS policies for organizations
-- =====================================================

ALTER TABLE organizations DISABLE ROW LEVEL SECURITY;

DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN 
    SELECT policyname FROM pg_policies 
    WHERE tablename = 'organizations' 
    AND schemaname = 'public'
  LOOP
    EXECUTE 'DROP POLICY IF EXISTS "' || pol.policyname || '" ON organizations';
  END LOOP;
END $$;

CREATE POLICY "Public read organizations" ON organizations
  FOR SELECT USING (true);

CREATE POLICY "Anyone can insert organizations" ON organizations
  FOR INSERT WITH CHECK (true);

ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 10. Add RLS policies for organization_invitations
-- =====================================================

ALTER TABLE organization_invitations DISABLE ROW LEVEL SECURITY;

DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN 
    SELECT policyname FROM pg_policies 
    WHERE tablename = 'organization_invitations' 
    AND schemaname = 'public'
  LOOP
    EXECUTE 'DROP POLICY IF EXISTS "' || pol.policyname || '" ON organization_invitations';
  END LOOP;
END $$;

-- Admins/Owners can manage invitations in their organization
CREATE POLICY "Admins can view invitations" ON organization_invitations
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND organization_id = organization_invitations.organization_id
      AND role IN ('admin', 'owner')
    )
  );

CREATE POLICY "Admins can create invitations" ON organization_invitations
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND organization_id = organization_invitations.organization_id
      AND role IN ('admin', 'owner')
    )
  );

CREATE POLICY "Admins can update invitations" ON organization_invitations
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND organization_id = organization_invitations.organization_id
      AND role IN ('admin', 'owner')
    )
  );

ALTER TABLE organization_invitations ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 11. Grant execute permission on the RPC functions
-- =====================================================

GRANT EXECUTE ON FUNCTION public.create_organization_with_owner TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_organization_with_owner TO anon;
GRANT EXECUTE ON FUNCTION public.create_organization_with_owner TO postgres;

GRANT EXECUTE ON FUNCTION public.validate_invitation_code TO authenticated;
GRANT EXECUTE ON FUNCTION public.validate_invitation_code TO anon;
GRANT EXECUTE ON FUNCTION public.validate_invitation_code TO postgres;

GRANT EXECUTE ON FUNCTION public.join_organization_by_invitation TO authenticated;
GRANT EXECUTE ON FUNCTION public.join_organization_by_invitation TO anon;
GRANT EXECUTE ON FUNCTION public.join_organization_by_invitation TO postgres;

GRANT EXECUTE ON FUNCTION public.create_invitation_code TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_invitation_code TO anon;
GRANT EXECUTE ON FUNCTION public.create_invitation_code TO postgres;

GRANT EXECUTE ON FUNCTION public.get_pending_invitations TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_pending_invitations TO anon;
GRANT EXECUTE ON FUNCTION public.get_pending_invitations TO postgres;

GRANT EXECUTE ON FUNCTION public.revoke_invitation TO authenticated;
GRANT EXECUTE ON FUNCTION public.revoke_invitation TO anon;
GRANT EXECUTE ON FUNCTION public.revoke_invitation TO postgres;

-- =====================================================
-- 12. Disable the trigger that auto-creates profile
-- (We handle this via RPC function now)
-- =====================================================

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- =====================================================
-- 13. Verification
-- =====================================================

-- Check if functions exist
SELECT proname FROM pg_proc WHERE proname IN (
  'create_organization_with_owner',
  'validate_invitation_code',
  'join_organization_by_invitation',
  'create_invitation_code',
  'get_pending_invitations',
  'revoke_invitation'
);

-- List all policies
SELECT tablename, policyname, cmd, qual
FROM pg_policies
WHERE schemaname = 'public'
AND tablename IN ('profiles', 'organizations', 'organization_invitations')
ORDER BY tablename;

-- =====================================================
-- END OF MIGRATION

