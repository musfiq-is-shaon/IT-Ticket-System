import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import TeamClient from './team-client';

interface Profile {
  id: string;
  organization_id: string | null;
  full_name: string;
  email: string;
  avatar_url: string | null;
  role: 'owner' | 'admin' | 'agent' | 'requester';
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

async function getTeamData(userId: string) {
  const supabase = await createClient();

  // Get user profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (!profile) {
    return { profile: null, teamMembers: [], orgName: null, orgId: null };
  }

  const orgId = profile.organization_id;

  if (!orgId) {
    return { 
      profile: profile as Profile, 
      teamMembers: [], 
      orgName: null, 
      orgId: null 
    };
  }

  // Get organization name
  const { data: org } = await supabase
    .from('organizations')
    .select('name')
    .eq('id', orgId)
    .single();

  // Get all team members
  const { data: teamMembers } = await supabase
    .from('profiles')
    .select('*')
    .eq('organization_id', orgId)
    .order('role')
    .order('full_name');

  return {
    profile: profile as Profile,
    teamMembers: teamMembers as Profile[] | null,
    orgName: org?.name ?? null,
    orgId: orgId,
  };
}

export default async function TeamPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const data = await getTeamData(user.id);

  // Redirect to login if no profile found
  if (!data.profile) {
    redirect('/login');
  }

  return (
    <TeamClient
      profile={data.profile!}
      teamMembers={data.teamMembers || []}
      orgName={data.orgName || 'Unknown Organization'}
      organizationId={data.orgId || ''}
    />
  );
}

