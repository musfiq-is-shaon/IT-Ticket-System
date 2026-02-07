import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import DashboardClient from './dashboard-client';
import SetupLoader from './setup-loader';
import TicketCodeEntry from './ticket-code-entry';
import InvitationCodeEntry from './invitation-code-entry';

// Types
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
  ticket_code: string | null; // Customer's associated ticket code
}

interface Ticket {
  id: string;
  organization_id: string;
  title: string;
  description: string;
  category: string | null;
  tags: string[] | null;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  created_by: string | null;
  assigned_to: string | null;
  created_at: string;
  updated_at: string;
  resolved_at: string | null;
  closed_at: string | null;
  created_by_name?: string | null;
  created_by_email?: string | null;
  assigned_to_name?: string | null;
  assigned_to_email?: string | null;
  assigned_to_role?: string | null;
  organization_name?: string | null;
}

interface DashboardStats {
  open: number;
  inProgress: number;
  resolved: number;
  critical: number;
  total: number;
}

async function getDashboardData(userId: string): Promise<{
  profile: Profile;
  tickets: Ticket[] | null;
  stats: DashboardStats;
} | null> {
  const supabase = await createClient();

  // Get user profile
  const { data: profileData } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (!profileData) {
    return null;
  }

  const profile = profileData as Profile;
  const orgId = profile.organization_id;

  if (!orgId) {
    return { 
      profile, 
      tickets: [], 
      stats: { open: 0, inProgress: 0, resolved: 0, critical: 0, total: 0 } 
    };
  }

  // Build query based on role
  let ticketsQuery = supabase
    .from('tickets')
    .select('*')
    .eq('organization_id', orgId)
    .order('created_at', { ascending: false })
    .limit(10);

  // Apply role-based filtering
  if (profile.role === 'requester') {
    // For customers, show tickets matching their ticket_code OR tickets they created
    // This ensures consistency with the My Tickets page
    if (profile.ticket_code) {
      ticketsQuery = ticketsQuery.or(`ticket_code.eq.${profile.ticket_code},created_by.eq.${userId}`);
    } else {
      // Fallback: show tickets they created
      ticketsQuery = ticketsQuery.eq('created_by', userId);
    }
  } else if (profile.role === 'agent') {
    ticketsQuery = ticketsQuery.eq('assigned_to', userId);
  }
  // Admins and owners see all tickets

  const { data: ticketsData } = await ticketsQuery;

  // Get stats - only count tickets user can see
  let statsQuery = supabase
    .from('tickets')
    .select('status, priority, created_by, assigned_to, ticket_code')
    .eq('organization_id', orgId);

  let statsData = (await statsQuery).data || [];
  
  if (profile.role === 'requester' && profile.ticket_code) {
    // Customer: Count tickets matching their ticket_code OR they created
    statsData = statsData.filter(t => t.ticket_code === profile.ticket_code || t.created_by === userId);
  } else if (profile.role === 'requester') {
    // Fallback
    statsData = statsData.filter(t => t.created_by === userId);
  } else if (profile.role === 'agent') {
    statsData = statsData.filter(t => t.assigned_to === userId);
  }

  const stats: DashboardStats = {
    open: statsData.filter(t => t.status === 'open').length || 0,
    inProgress: statsData.filter(t => t.status === 'in_progress').length || 0,
    resolved: statsData.filter(t => t.status === 'resolved').length || 0,
    critical: statsData.filter(t => t.priority === 'critical').length || 0,
    total: statsData.length || 0,
  };

  return {
    profile,
    tickets: ticketsData as Ticket[] | null,
    stats,
  };
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const data = await getDashboardData(user.id);

  // If no profile exists, show the setup loader which auto-refreshes
  if (!data) {
    return <SetupLoader email={user.email || ''} />;
  }

  // If customer has no organization, show ticket code entry
  if (data.profile.role === 'requester' && !data.profile.organization_id) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <TicketCodeEntry />
        </div>
      </div>
    );
  }

  // If employee has no organization, show invitation code entry
  if (data.profile.role === 'agent' && !data.profile.organization_id) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <InvitationCodeEntry />
        </div>
      </div>
    );
  }

  return (
    <DashboardClient
      profile={data.profile}
      tickets={data.tickets}
      stats={data.stats}
    />
  );
}

