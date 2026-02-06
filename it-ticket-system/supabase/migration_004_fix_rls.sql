-- Migration: Fix RLS policies for signup to work properly
-- Run this in Supabase SQL Editor

-- =====================================================
-- 1. Allow authenticated users to create organizations
-- =====================================================

DROP POLICY IF EXISTS "Organizations can only be inserted by system" ON organizations;
CREATE POLICY "Authenticated users can create organizations"
  ON organizations FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- =====================================================
-- 2. Allow anyone to create profiles (needed for signup)
-- =====================================================

DROP POLICY IF EXISTS "Profiles can only be inserted by system" ON profiles;
CREATE POLICY "Anyone can insert profiles"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- =====================================================
-- 3. Allow profile owners to update their own profile
-- =====================================================

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- =====================================================
-- 4. Allow anyone to view organizations
-- =====================================================

DROP POLICY IF EXISTS "Organizations are viewable by everyone" ON organizations;
CREATE POLICY "Anyone can view organizations"
  ON organizations FOR SELECT
  USING (true);

-- =====================================================
-- 5. Users can view profiles in their organization
-- =====================================================

DROP POLICY IF EXISTS "Users can view profiles in their organization" ON profiles;
CREATE POLICY "Users can view profiles in their org"
  ON profiles FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  );

-- =====================================================
-- VERIFY: Check all policies
-- =====================================================

SELECT tablename, policyname 
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename;

-- =====================================================
-- END OF MIGRATION
-- =====================================================

