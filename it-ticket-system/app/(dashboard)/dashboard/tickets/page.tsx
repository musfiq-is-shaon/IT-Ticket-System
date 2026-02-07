import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Plus, Search, Filter, MessageSquare, Calendar, ArrowUpDown, Ticket } from 'lucide-react';
import { formatRelativeTime, getPriorityColor, getStatusColor } from '@/lib/utils';

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
  ticket_code: string | null; // For customer signup
  created_by_profile?: Pick<Profile, 'id' | 'full_name' | 'email' | 'avatar_url'> | null;
  assigned_to_profile?: Pick<Profile, 'id' | 'full_name' | 'email' | 'avatar_url'> | null;
}

interface SearchParams {
  status?: string;
  priority?: string;
  search?: string;
}

async function getTickets(userId: string, searchParams: SearchParams) {
  const supabase = await createClient();

  // Get user profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (!profile) {
    return { profile: null, tickets: [], filters: searchParams };
  }

  const orgId = profile.organization_id;

  if (!orgId) {
    return { profile: profile as Profile, tickets: [], filters: searchParams };
  }

  // Build query with profile joins
  let query = supabase
    .from('tickets')
    .select(`
      *,
      created_by_profile:profiles!created_by(id, full_name, email, avatar_url, role),
      assigned_to_profile:profiles!assigned_to(id, full_name, email, avatar_url, role)
    `)
    .eq('organization_id', orgId)
    .order('created_at', { ascending: false });

  // Apply role-based filtering
  if (profile.role === 'requester') {
    // For customers, show tickets matching their ticket_code OR tickets they created
    // This ensures consistency with the dashboard which shows by ticket_code
    if (profile.ticket_code) {
      query = query.or(`ticket_code.eq.${profile.ticket_code},created_by.eq.${userId}`);
    } else {
      // Fallback: show tickets they created
      query = query.eq('created_by', userId);
    }
  } else if (profile.role === 'agent') {
    query = query.eq('assigned_to', userId);
  }
  // Admins and owners see all tickets

  // Apply filters
  if (searchParams.status) {
    query = query.eq('status', searchParams.status);
  }

  if (searchParams.priority) {
    query = query.eq('priority', searchParams.priority);
  }

  if (searchParams.search) {
    query = query.or(`title.ilike.%${searchParams.search}%,description.ilike.%${searchParams.search}%`);
  }

  const { data: tickets } = await query;

  return {
    profile: profile as Profile,
    tickets: tickets as Ticket[] | null,
    filters: searchParams,
  };
}

export default async function TicketsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const resolvedSearchParams = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { profile, tickets, filters } = await getTickets(user.id, resolvedSearchParams);

  if (!profile) {
    redirect('/login');
  }

  const userRole = profile.role;
  const canManage = userRole === 'admin' || userRole === 'owner';
  const isRequester = userRole === 'requester';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Tickets</h1>
          <p className="text-slate-600 mt-1">
            Manage and track all support tickets
          </p>
        </div>
        {/* Only show New Ticket button for customers */}
        {isRequester && (
          <Link href="/dashboard/tickets/new" className="btn-primary">
            <Plus className="w-4 h-4" />
            New Ticket
          </Link>
        )}
      </div>

      {/* Filters */}
      <div className="card">
        <div className="p-4">
          <form className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                name="search"
                placeholder="Search tickets..."
                defaultValue={filters.search}
                className="input pl-10"
              />
            </div>
            <div className="flex gap-2">
              <select name="status" defaultValue={filters.status} className="input w-40">
                <option value="">All Status</option>
                <option value="open">Open</option>
                <option value="in_progress">In Progress</option>
                <option value="resolved">Resolved</option>
                <option value="closed">Closed</option>
              </select>
              <select name="priority" defaultValue={filters.priority} className="input w-40">
                <option value="">All Priority</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
              <button type="submit" className="btn-outline">
                <Filter className="w-4 h-4" />
                Filter
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Tickets list */}
      <div className="card">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="text-left py-3 px-4 text-xs font-medium uppercase tracking-wider text-slate-500">
                  Ticket
                </th>
                <th className="text-left py-3 px-4 text-xs font-medium uppercase tracking-wider text-slate-500">
                  Status
                </th>
                <th className="text-left py-3 px-4 text-xs font-medium uppercase tracking-wider text-slate-500">
                  Priority
                </th>
                {canManage && (
                  <th className="text-left py-3 px-4 text-xs font-medium uppercase tracking-wider text-slate-500 hidden lg:table-cell">
                    Created By
                  </th>
                )}
                {canManage && (
                  <th className="text-left py-3 px-4 text-xs font-medium uppercase tracking-wider text-slate-500 hidden lg:table-cell">
                    Assigned To
                  </th>
                )}
                <th className="text-left py-3 px-4 text-xs font-medium uppercase tracking-wider text-slate-500 hidden md:table-cell">
                  Created
                </th>
                {canManage && (
                  <th className="text-left py-3 px-4 text-xs font-medium uppercase tracking-wider text-slate-500 hidden xl:table-cell">
                    Code
                  </th>
                )}
                <th className="text-right py-3 px-4 text-xs font-medium uppercase tracking-wider text-slate-500">
                  Action
                </th>
              </tr>
            </thead>
            <tbody>
              {tickets && tickets.length > 0 ? (
                tickets.map((ticket) => (
                  <tr key={ticket.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                    <td className="py-3 px-4">
                      <Link
                        href={`/dashboard/tickets/${ticket.id}`}
                        className="font-medium text-slate-900 hover:text-primary transition-colors"
                      >
                        {ticket.title}
                      </Link>
                      <p className="text-sm text-slate-500 mt-0.5 truncate max-w-xs">
                        {ticket.description?.slice(0, 60)}...
                      </p>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`badge ${getStatusColor(ticket.status)}`}>
                        {ticket.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`badge ${getPriorityColor(ticket.priority)}`}>
                        {ticket.priority}
                      </span>
                    </td>
                    {canManage && (
                      <td className="py-3 px-4 hidden lg:table-cell">
                        {ticket.created_by_profile ? (
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                              <span className="text-xs font-medium text-white">
                                {ticket.created_by_profile.full_name?.charAt(0) ?? 'U'}
                              </span>
                            </div>
                            <span className="text-sm text-slate-700">
                              {ticket.created_by_profile.full_name}
                            </span>
                          </div>
                        ) : (
                          <span className="text-sm text-slate-400">Unknown</span>
                        )}
                      </td>
                    )}
                    {canManage && (
                      <td className="py-3 px-4 hidden lg:table-cell">
                        {ticket.assigned_to_profile ? (
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center">
                              <span className="text-xs font-medium text-white">
                                {ticket.assigned_to_profile.full_name?.charAt(0) ?? 'U'}
                              </span>
                            </div>
                            <span className="text-sm text-slate-700">
                              {ticket.assigned_to_profile.full_name}
                            </span>
                          </div>
                        ) : (
                          <span className="text-sm text-slate-400">Unassigned</span>
                        )}
                      </td>
                    )}
                    <td className="py-3 px-4 hidden md:table-cell text-sm text-slate-500">
                      {formatRelativeTime(ticket.created_at)}
                    </td>
                    {canManage && (
                      <td className="py-3 px-4 hidden xl:table-cell">
                        {ticket.ticket_code ? (
                          <div className="flex items-center gap-1">
                            <Ticket className="w-3 h-3 text-slate-400" />
                            <span className="font-mono text-xs text-slate-600">
                              {ticket.ticket_code}
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400">-</span>
                        )}
                      </td>
                    )}
                    <td className="py-3 px-4 text-right">
                      <Link
                        href={`/dashboard/tickets/${ticket.id}`}
                        className="text-primary hover:underline text-sm"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={canManage ? 8 : 5} className="py-12 text-center">
                    <MessageSquare className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-slate-900 mb-1">
                      No tickets found
                    </h3>
                    <p className="text-slate-500 mb-4">
                      {filters.search || filters.status || filters.priority
                        ? 'Try adjusting your filters'
                        : 'Create your first ticket to get started'}
                    </p>
                    {!filters.search && !filters.status && !filters.priority && (
                      <Link href="/dashboard/tickets/new" className="btn-primary">
                        <Plus className="w-4 h-4" />
                        Create Ticket
                      </Link>
                    )}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

