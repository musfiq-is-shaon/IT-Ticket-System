-- Seed Data for IT Ticket Management System
-- Run this after the main schema to add demo data

-- IMPORTANT: Replace 'your-organization-id' with actual UUID from organizations table

-- =====================================================
-- 1. CREATE DEMO ORGANIZATION
-- =====================================================

-- First, insert the organization (you'll need to run this and note the ID)
-- Or update the organization_id below after creating one

-- INSERT INTO organizations (name, slug) VALUES ('Acme Corporation', 'acme-corp');

-- =====================================================
-- 2. SEED USERS (Create these via Supabase Auth Console)
-- =====================================================
-- 
-- After signing up these emails in your app, update their roles:
--
-- UPDATE profiles SET role = 'owner' WHERE email = 'owner@acme.com';
-- UPDATE profiles SET role = 'admin' WHERE email = 'admin@acme.com';
-- UPDATE profiles SET role = 'agent' WHERE email = 'agent1@acme.com';
-- UPDATE profiles SET role = 'agent' WHERE email = 'agent2@acme.com';
-- UPDATE profiles SET role = 'requester' WHERE email = 'employee1@acme.com';
-- UPDATE profiles SET role = 'requester' WHERE email = 'employee2@acme.com';

-- =====================================================
-- 3. SAMPLE TICKETS
-- =====================================================

-- Replace 'your-organization-id', 'owner-id', 'agent-id' with actual UUIDs

/*
-- Sample tickets for demonstration:
INSERT INTO tickets (organization_id, title, description, category, priority, status, created_by, assigned_to)
VALUES 
  ('your-organization-id', 'Cannot connect to VPN', 'I am unable to connect to the corporate VPN. Getting timeout error after 30 seconds.', 'VPN & Remote Access', 'high', 'open', 'employee1-id', 'agent1-id'),
  ('your-organization-id', 'Email not syncing', 'Outlook is not syncing emails on my laptop. Shows disconnected status.', 'Email & Communication', 'medium', 'in_progress', 'employee2-id', 'agent2-id'),
  ('your-organization-id', 'Need new laptop', 'My current laptop is slow and frequently crashes. Need a replacement.', 'Hardware', 'low', 'resolved', 'employee1-id', 'agent1-id'),
  ('your-organization-id', 'Printer not working', 'Office printer is showing paper jam error but there is no jam.', 'Printer & Scanner', 'medium', 'open', 'employee2-id', NULL),
  ('your-organization-id', 'Software installation request', 'Please install Adobe Creative Cloud on my workstation.', 'Software', 'low', 'closed', 'employee1-id', 'agent2-id');

-- =====================================================
-- 4. SAMPLE COMMENTS
-- =====================================================

INSERT INTO comments (ticket_id, user_id, message, is_internal)
VALUES
  ('ticket-id-1', 'agent1-id', 'I will check the VPN server logs and get back to you shortly.', FALSE),
  ('ticket-id-1', 'agent1-id', 'Found an issue with the VPN server. Working on a fix.', TRUE),
  ('ticket-id-2', 'employee2-id', 'Any update on this issue? Meeting scheduled for tomorrow.', FALSE),
  ('ticket-id-4', 'agent1-id', 'Checked the printer, there was a small paper piece stuck. Fixed now.', FALSE);

-- =====================================================
-- 5. QUERY TO GET YOUR ORGANIZATION AND USER IDS
-- =====================================================

-- Run this to find your organization and user IDs:
SELECT id, name, slug FROM organizations;
SELECT id, full_name, email, role FROM profiles WHERE organization_id = 'your-organization-id';
*/

-- =====================================================
-- 6. FUNCTION TO CREATE DEMO DATA (Run after signup)
-- =====================================================

CREATE OR REPLACE FUNCTION create_demo_data_for_organization(org_id UUID)
RETURNS VOID AS $$
DECLARE
  owner_user_id UUID;
  admin_user_id UUID;
  agent1_user_id UUID;
  agent2_user_id UUID;
  requester1_user_id UUID;
  requester2_user_id UUID;
  ticket1_id UUID;
  ticket2_id UUID;
  ticket3_id UUID;
  ticket4_id UUID;
  ticket5_id UUID;
BEGIN
  -- Get the owner user (first user who signed up)
  SELECT id INTO owner_user_id 
  FROM profiles 
  WHERE organization_id = org_id 
  AND role = 'owner'
  LIMIT 1;

  IF owner_user_id IS NULL THEN
    RAISE EXCEPTION 'No owner found for this organization';
  END IF;

  -- Create admin user
  INSERT INTO profiles (organization_id, full_name, email, role)
  VALUES (org_id, 'Sarah Admin', 'sarah.admin@company.com', 'admin')
  RETURNING id INTO admin_user_id;

  -- Create agent users
  INSERT INTO profiles (organization_id, full_name, email, role)
  VALUES (org_id, 'Mike Support', 'mike.support@company.com', 'agent')
  RETURNING id INTO agent1_user_id;

  INSERT INTO profiles (organization_id, full_name, email, role)
  VALUES (org_id, 'Lisa Helpdesk', 'lisa.helpdesk@company.com', 'agent')
  RETURNING id INTO agent2_user_id;

  -- Create requester users
  INSERT INTO profiles (organization_id, full_name, email, role)
  VALUES (org_id, 'John Developer', 'john.developer@company.com', 'requester')
  RETURNING id INTO requester1_user_id;

  INSERT INTO profiles (organization_id, full_name, email, role)
  VALUES (org_id, 'Emily Marketing', 'emily.marketing@company.com', 'requester')
  RETURNING id INTO requester2_user_id;

  -- Create demo tickets
  INSERT INTO tickets (organization_id, title, description, category, priority, status, created_by, assigned_to)
  VALUES 
    (org_id, 'VPN Connection Timeout', 'Getting timeout error after 30 seconds when trying to connect to corporate VPN. This started yesterday after the network maintenance.', 'VPN & Remote Access', 'high', 'open', requester1_user_id, agent1_user_id),
    (org_id, 'Outlook Not Syncing', 'Outlook shows disconnected status and emails are not syncing. Have tried restarting Outlook but issue persists.', 'Email & Communication', 'medium', 'in_progress', requester2_user_id, agent2_user_id),
    (org_id, 'Laptop Screen Flickering', 'My laptop screen flickers every few minutes. This is affecting my work productivity.', 'Hardware', 'medium', 'open', requester1_user_id, agent1_user_id),
    (org_id, 'Need Adobe Acrobat Pro', 'Please install Adobe Acrobat Pro on my workstation. Have approval from manager.', 'Software', 'low', 'resolved', requester2_user_id, agent2_user_id),
    (org_id, 'Network Drive Not Accessible', 'Cannot access the shared network drive. Getting access denied error.', 'Network', 'critical', 'open', requester1_user_id, NULL)
  RETURNING id INTO ticket1_id;

  -- Add comments
  INSERT INTO comments (ticket_id, user_id, message, is_internal)
  VALUES
    (ticket1_id, agent1_user_id, 'I will check the VPN server logs and investigate this issue. Should have an update within the hour.', FALSE),
    (ticket1_id, agent1_user_id, 'Found that the VPN server had an overload. Implementing a fix now.', TRUE),
    (ticket2_id, agent2_user_id, 'This seems to be a common issue. Working on a batch fix for affected users.', TRUE),
    (ticket2_id, requester2_user_id, 'Any update on this? I have an important presentation tomorrow.', FALSE),
    (ticket3_id, agent1_user_id, 'Scheduled laptop replacement for tomorrow morning.', FALSE),
    (ticket4_id, agent2_user_id, 'Adobe Acrobat Pro has been installed successfully.', FALSE);

  -- Add activity logs
  INSERT INTO ticket_activity_logs (ticket_id, user_id, action, old_value, new_value)
  VALUES
    (ticket1_id, agent1_user_id, 'assigned', NULL, agent1_user_id::TEXT),
    (ticket1_id, agent1_user_id, 'status_changed', 'open', 'in_progress'),
    (ticket2_id, agent2_user_id, 'assigned', NULL, agent2_user_id::TEXT),
    (ticket2_id, agent2_user_id, 'priority_changed', 'medium', 'high'),
    (ticket4_id, agent2_user_id, 'status_changed', 'open', 'resolved');

  RAISE NOTICE 'Demo data created successfully!';
  RAISE NOTICE 'Created users: admin@%, support@%, requester@%', 
    (SELECT email FROM profiles WHERE id = admin_user_id),
    (SELECT email FROM profiles WHERE id = agent1_user_id),
    (SELECT email FROM profiles WHERE id = requester1_user_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 7. USAGE INSTRUCTIONS
-- =====================================================

/*
After setting up your Supabase project:

1. Sign up a new user at /signup with your email
2. This will create an organization automatically
3. Copy your organization ID from the organizations table
4. Run: SELECT create_demo_data_for_organization('your-org-id');
5. Login with the demo users (they won't have passwords, 
   so login as owner and reset their passwords in auth.users)
*/

-- =====================================================
-- END OF SEED DATA
-- =====================================================

