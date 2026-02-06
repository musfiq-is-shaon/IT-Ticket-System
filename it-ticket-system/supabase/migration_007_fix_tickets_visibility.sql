-- Migration: Fix tickets visibility and add ticket_code to existing tickets
-- Run this in Supabase SQL Editor to fix ticket display issues

-- =====================================================
-- 1. Fix RLS policies for tickets (resolve conflicts)
-- =====================================================

-- First, let's see what policies exist
SELECT tablename, policyname, cmd, qual
FROM pg_policies
WHERE schemaname = 'public'
AND tablename = 'tickets';

-- =====================================================
-- 2. Add ticket_code to existing tickets that don't have one
-- =====================================================

-- Create function to generate ticket code for existing tickets
CREATE OR REPLACE FUNCTION public.generate_ticket_code_for_existing()
RETURNS void AS $$
DECLARE
  t_record RECORD;
BEGIN
  FOR t_record IN 
    SELECT id FROM tickets WHERE ticket_code IS NULL OR ticket_code = ''
  LOOP
    UPDATE tickets 
    SET ticket_code = public.generate_ticket_code()
    WHERE id = t_record.id;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Run the function to update existing tickets
SELECT public.generate_ticket_code_for_existing();

-- Verify tickets now have codes
SELECT id, title, ticket_code FROM tickets LIMIT 10;

-- =====================================================
-- 3. Fix RLS policies for tickets visibility
-- =====================================================

-- Drop all existing ticket policies
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

-- Re-enable RLS
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;

-- Simple policy: users can view tickets in their organization
CREATE POLICY "Users can view tickets in their organization"
  ON tickets FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  );

-- Users can create tickets if they have a profile
CREATE POLICY "Users with profile can create tickets"
  ON tickets FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
    )
  );

-- Users can update tickets they created
CREATE POLICY "Users can update their own tickets"
  ON tickets FOR UPDATE
  USING (
    created_by = auth.uid()
    OR assigned_to = auth.uid()
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'owner')
    )
  );

-- =====================================================
-- 4. Grant proper permissions
-- =====================================================

GRANT SELECT ON tickets TO authenticated, anon;
GRANT INSERT ON tickets TO authenticated;
GRANT UPDATE ON tickets TO authenticated;

-- =====================================================
-- 5. Verify the fix
-- =====================================================

-- Check policies
SELECT tablename, policyname, cmd, qual
FROM pg_policies
WHERE schemaname = 'public'
AND tablename = 'tickets';

-- Check ticket_code column
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'tickets' 
AND column_name = 'ticket_code';

-- Count tickets
SELECT COUNT(*) as total_tickets FROM tickets;

-- =====================================================
-- END OF MIGRATION
-- =====================================================

