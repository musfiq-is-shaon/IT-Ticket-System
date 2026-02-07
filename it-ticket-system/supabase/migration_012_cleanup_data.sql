-- Migration: Clean up all existing data
-- Run this in Supabase SQL Editor to delete all existing users, profiles, and tickets

-- Step 1: Disable RLS temporarily (using DO block to handle errors)
DO $$ 
BEGIN
  ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$ 
BEGIN
  ALTER TABLE tickets DISABLE ROW LEVEL SECURITY;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$ 
BEGIN
  ALTER TABLE comments DISABLE ROW LEVEL SECURITY;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$ 
BEGIN
  ALTER TABLE ticket_activity_logs DISABLE ROW LEVEL SECURITY;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$ 
BEGIN
  ALTER TABLE organization_invitations DISABLE ROW LEVEL SECURITY;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- Step 2: Delete all data from all tables (in order due to foreign keys)
DO $$
BEGIN
  DELETE FROM ticket_activity_logs;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$
BEGIN
  DELETE FROM comments;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$
BEGIN
  DELETE FROM tickets;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$
BEGIN
  DELETE FROM organization_invitations;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$
BEGIN
  DELETE FROM profiles;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$
BEGIN
  DELETE FROM organizations;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- Step 3: Re-enable RLS (using DO block to handle errors)
DO $$ 
BEGIN
  ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$ 
BEGIN
  ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$ 
BEGIN
  ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$ 
BEGIN
  ALTER TABLE ticket_activity_logs ENABLE ROW LEVEL SECURITY;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$ 
BEGIN
  ALTER TABLE organization_invitations ENABLE ROW LEVEL SECURITY;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- Step 4: Verify cleanup
SELECT 'profiles' as table_name, COUNT(*) as count FROM profiles
UNION ALL SELECT 'tickets', COUNT(*) FROM tickets
UNION ALL SELECT 'organizations', COUNT(*) FROM organizations;

-- Step 5: Delete all auth.users manually
-- Go to Supabase Dashboard → Authentication → Users → Delete all users

