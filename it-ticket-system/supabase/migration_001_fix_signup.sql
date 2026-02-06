-- Migration: Fix signup to auto-create organization
-- Run this in Supabase SQL Editor to update the trigger function

-- =====================================================
-- 1. Update the handle_new_user function
-- =====================================================

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

-- =====================================================
-- 2. Verify the trigger exists
-- =====================================================

SELECT tgname FROM pg_trigger WHERE tgname = 'on_auth_user_created';

-- If no row returned, recreate the trigger:
-- DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
-- CREATE TRIGGER on_auth_user_created
--   AFTER INSERT ON auth.users
--   FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- END OF MIGRATION
-- =====================================================
