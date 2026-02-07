import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { 
  Users, 
  Search, 
  MessageSquare, 
  Mail, 
  Calendar,
  Filter,
  UserPlus,
  MoreHorizontal,
  Ticket,
  Eye
} from 'lucide-react';
import { formatRelativeTime, getStatusColor } from '@/lib/utils';

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

interface CustomerWithTickets extends Profile {
  ticket_count: number;
  open_tickets: number;
  assigned_to_name: string | null;
}

async function getCustomersData(userId: string) {
  const supabase = await createClient();

  // Get user profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (!profile) {
    return { profile: null, customers: [], orgName: null, orgId: null };
  }

  const orgId = profile.organization_id;

  if (!orgId) {
    return { 
      profile: profile as Profile, 
      customers: [], 
      orgName: null, 
      orgId: null 
    };
  }

  // Get organization name
  const { data: orgData } = await supabase
    .from('organizations')
    .select('name')
    .eq('id', orgId)
    .single();

  const org = orgData;

  // Get all customers (requesters) in the organization
  const { data: customers } = await supabase
    .from('profiles')
    .select('*')
    .eq('organization_id', orgId)
    .eq('role', 'requester')
    .order('full_name');

  // Get ticket counts for each customer
  // Count tickets where created_by = customer.id OR ticket_code matches
  const customersWithTickets = await Promise.all(
    (customers || []).map(async (customer) => {
      // Count all tickets for this customer (created_by OR ticket_code match)
      const { count: ticketCount } = await supabase
        .from('tickets')
        .select('id', { count: 'exact', head: true })
        .eq('organization_id', orgId)
        .or(`created_by.eq.${customer.id},ticket_code.eq.${customer.ticket_code}`);

      // Count open tickets
      const { count: openCount } = await supabase
        .from('tickets')
        .select('id', { count: 'exact', head: true })
        .eq('organization_id', orgId)
        .eq('status', 'open')
        .or(`created_by.eq.${customer.id},ticket_code.eq.${customer.ticket_code}`);

      // Get the most recent ticket's assigned agent
      const { data: recentTickets } = await supabase
        .from('tickets')
        .select('assigned_to')
        .eq('organization_id', orgId)
        .or(`created_by.eq.${customer.id},ticket_code.eq.${customer.ticket_code}`)
        .order('created_at', { ascending: false })
        .limit(1);

      const recentTicket = recentTickets?.[0];
      let assignedToName: string | null = null;
      
      if (recentTicket?.assigned_to) {
        const { data: assigneeProfile } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', recentTicket.assigned_to)
          .single();
        assignedToName = assigneeProfile?.full_name || null;
      }

      return {
        ...customer,
        ticket_count: ticketCount || 0,
        open_tickets: openCount || 0,
        assigned_to_name: assignedToName,
      } as CustomerWithTickets;
    })
  );

  return {
    profile: profile as Profile,
    customers: customersWithTickets,
    orgName: org?.name ?? null,
    orgId: orgId,
  };
}

export default async function CustomersPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const data = await getCustomersData(user.id);

  // Redirect to login if no profile found
  if (!data.profile) {
    redirect('/login');
  }

  // Only owners and admins can access this page
  const userRole = data.profile.role;
  if (userRole !== 'owner' && userRole !== 'admin') {
    redirect('/dashboard');
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Customers</h1>
          <p className="text-slate-600 mt-1">
            View and manage customers who have signed up with ticket codes
          </p>
        </div>
        <div className="text-sm text-slate-500">
          {data.customers.length} customer{data.customers.length !== 1 ? 's' : ''}
        </div>
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
                placeholder="Search customers..."
                className="input pl-10"
              />
            </div>
            <div className="flex gap-2">
              <select name="status" className="input w-40">
                <option value="">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
              <button type="submit" className="btn-outline">
                <Filter className="w-4 h-4" />
                Filter
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Customers list */}
      <div className="card">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="text-left py-3 px-4 text-xs font-medium uppercase tracking-wider text-slate-500">
                  Customer
                </th>
                <th className="text-left py-3 px-4 text-xs font-medium uppercase tracking-wider text-slate-500">
                  Contact
                </th>
                <th className="text-left py-3 px-4 text-xs font-medium uppercase tracking-wider text-slate-500 hidden md:table-cell">
                  Tickets
                </th>
                <th className="text-left py-3 px-4 text-xs font-medium uppercase tracking-wider text-slate-500">
                  Open
                </th>
                <th className="text-left py-3 px-4 text-xs font-medium uppercase tracking-wider text-slate-500">
                  Assigned To
                </th>
                <th className="text-left py-3 px-4 text-xs font-medium uppercase tracking-wider text-slate-500 hidden lg:table-cell">
                  Joined
                </th>
                <th className="text-right py-3 px-4 text-xs font-medium uppercase tracking-wider text-slate-500">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {data.customers.length > 0 ? (
                data.customers.map((customer) => (
                  <tr key={customer.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center">
                          <span className="text-sm font-medium text-slate-600">
                            {customer.full_name?.charAt(0) ?? 'U'}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-slate-900">
                            {customer.full_name}
                          </p>
                          <p className="text-xs text-slate-500 capitalize">
                            {customer.role}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <Mail className="w-3 h-3 text-slate-400" />
                        <span className="text-sm text-slate-600">
                          {customer.email}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4 hidden md:table-cell">
                      <div className="flex items-center gap-1">
                        <MessageSquare className="w-3 h-3 text-slate-400" />
                        <span className="text-sm font-medium text-slate-700">
                          {customer.ticket_count}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`badge ${customer.open_tickets > 0 ? 'bg-orange-100 text-orange-700' : 'bg-slate-100 text-slate-600'}`}>
                        {customer.open_tickets} open
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {customer.assigned_to_name ? (
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center">
                            <span className="text-xs font-medium text-white">
                              {customer.assigned_to_name.charAt(0)}
                            </span>
                          </div>
                          <span className="text-sm text-slate-700">
                            {customer.assigned_to_name}
                          </span>
                        </div>
                      ) : (
                        <span className="text-sm text-slate-400">Unassigned</span>
                      )}
                    </td>
                    <td className="py-3 px-4 hidden lg:table-cell text-sm text-slate-500">
                      {formatRelativeTime(customer.created_at)}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/dashboard/tickets?customer=${customer.id}`}
                          className="text-primary hover:underline text-sm"
                          title="View tickets"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-12 text-center">
                    <Users className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-slate-900 mb-1">
                      No customers yet
                    </h3>
                    <p className="text-slate-500">
                      Customers will appear here when they sign up with a ticket code
                    </p>
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

