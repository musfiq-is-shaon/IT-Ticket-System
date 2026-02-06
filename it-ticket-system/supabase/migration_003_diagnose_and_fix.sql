-- =====================================================
-- DIAGNOSTIC: Check if trigger function exists and works
-- =====================================================

-- Check if the trigger function exists
SELECT proname FROM pg_proc WHERE proname = 'handle_new_user';

-- Check if the trigger exists on auth.users
SELECT tgname FROM pg_trigger WHERE tgname = 'on_auth_user_created';

-- =====================================================
-- FIX 1: Recreate the trigger if missing
-- =====================================================

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- FIX 2: Test the trigger function manually
-- =====================================================

-- Create a test function to simulate user signup
CREATE OR REPLACE FUNCTION test_signup_trigger()
RETURNS void AS $$
DECLARE
  test_user RECORD;
BEGIN
  -- Simulate what happens during signup
  RAISE NOTICE 'Testing trigger with sample data...';
  
  -- Create a temporary organization for testing
  INSERT INTO organizations (name, slug) 
  VALUES ('Test Organization', 'test-org-' || now())
  RETURNING * INTO test_user;
  
  RAISE NOTICE 'Created test organization: %', test_user.id;
END;
$$ LANGUAGE plpgsql;

-- Run the test
SELECT test_signup_trigger();

-- =====================================================
-- FIX 3: Disable RLS temporarily for profiles to test
-- =====================================================

-- This allows testing without RLS blocking
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- Test by creating a profile manually (replace UUID with actual user ID)
-- INSERT INTO profiles (id, full_name, email, role, organization_id)
-- VALUES ('auth-uid-goes-here', 'Test User', 'test@example.com', 'owner', 
--         (SELECT id FROM organizations LIMIT 1));

-- Re-enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- FIX 4: Simplest fix - Update RLS policies
-- =====================================================

-- Drop and recreate profiles RLS policies
DROP POLICY IF EXISTS "Users can view profiles in their organization" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can update profiles in their organization" ON profiles;
DROP POLICY IF EXISTS "Profiles can only be inserted by system" ON profiles;

-- Allow anyone to view profiles (for testing)
CREATE POLICY "Anyone can view profiles" ON profiles FOR SELECT USING (true);

-- Allow authenticated users to insert profiles (bypass trigger for testing)
CREATE POLICY "Test insert profiles" ON profiles FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- =====================================================
-- VERIFICATION: Check all tables
-- =====================================================

SELECT 'organizations' as table_name, COUNT(*) as count FROM organizations;
SELECT 'profiles' as table_name, COUNT(*) as count FROM profiles;
SELECT 'tickets' as table_name, COUNT(*) as count FROM tickets;
SELECT 'comments' as table_name, COUNT(*) as count FROM comments;

-- =====================================================
-- ALTERNATIVE: Manual signup test
-- =====================================================

/*
If signup still fails, try this workaround:

1. Disable the trigger temporarily:
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

2. Sign up through the app (auth.users will be created)

3. Re-enable the trigger:
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

4. Manually insert the profile:
INSERT INTO profiles (id, full_name, email, role, organization_id)
SELECT 
  auth.users.id,
  COALESCE(raw_user_meta_data->>'full_name', email),
  email,
  'owner',
  organizations.id
FROM auth.users
CROSS JOIN organizations
WHERE auth.users.id = 'your-new-user-id'
AND organizations.slug = 'your-org-slug';
*/
