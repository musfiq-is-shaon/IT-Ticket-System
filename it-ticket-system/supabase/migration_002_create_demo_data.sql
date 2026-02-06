-- Migration: Create demo data for the current user's organization
-- Run this in Supabase SQL Editor after signing up

-- First, find your organization ID:
SELECT id, name FROM organizations;

-- Then run this function to create demo data:
SELECT create_demo_data_for_organization((SELECT id FROM organizations ORDER BY created_at DESC LIMIT 1));

-- Or use this combined query that does both:
DO $$
DECLARE
  org_id UUID;
BEGIN
  -- Get the most recent organization
  SELECT id INTO org_id FROM organizations ORDER BY created_at DESC LIMIT 1;
  
  -- Create demo data
  PERFORM create_demo_data_for_organization(org_id);
  
  -- Show the result
  RAISE NOTICE 'Demo data created for organization: %', org_id;
END $$;

-- Verify the demo data was created:
SELECT 'profiles' as table_name, COUNT(*) as count FROM profiles
UNION ALL
SELECT 'tickets', COUNT(*) FROM tickets
UNION ALL
SELECT 'comments', COUNT(*) FROM comments;
