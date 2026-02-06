import { createClient } from '@/lib/supabase/server';
import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, 
  Clock, 
  User, 
  Tag, 
  Calendar,
  MessageSquare,
  Eye,
  Ticket,
  Copy,
  Check
} from 'lucide-react';
import { formatDate, formatRelativeTime, getPriorityColor, getStatusColor } from '@/lib/utils';
import { TicketDetailActions } from './ticket-detail-actions';
import { TicketComments } from './ticket-comments';
import { TicketCodeCard } from './ticket-code-card';

// Types for ticket data
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
  // Joined profile data
  created_by_profile?: Pick<Profile, 'id' | 'full_name' | 'email' | 'avatar_url' | 'role'> | null;
  assigned_to_profile?: Pick<Profile, 'id' | 'full_name' | 'email' | 'avatar_url' | 'role'> | null;
}

interface Comment {
  id: string;
  ticket_id: string;
  user_id: string | null;
  message: string;
  is_internal: boolean;
  created_at: string;
  updated_at: string;
  // Joined profile data
  user_profile?: Pick<Profile, 'id' | 'full_name' | 'email' | 'avatar_url' | 'role'> | null;
}

interface ActivityLog {
  id: string;
  ticket_id: string;
  user_id: string | null;
  action: string;
  old_value: string | null;
  new_value: string | null;
  created_at: string;
  // Joined profile data
  user_profile?: Pick<Profile, 'id' | 'full_name' | 'email'> | null;
}

interface PageParams {
  params: Promise<{ id: string }>;
}

async function getTicket(ticketId: string, userId: string) {
  const supabase = await createClient();

  // Get user profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (!profile) {
    return { profile: null, ticket: null, comments: [], activities: [] };
  }

  // Get ticket
  const { data: ticket } = await supabase
    .from('tickets')
    .select('*')
    .eq('id', ticketId)
    .eq('organization_id', profile.organization_id!)
    .single();

  if (!ticket) {
    return { profile, ticket: null, comments: [], activities: [] };
  }

  // Get created_by profile
  const { data: createdByProfile } = await supabase
    .from('profiles')
    .select('id, full_name, email, avatar_url, role')
    .eq('id', ticket.created_by || 'not-found')
    .single();

  // Get assigned_to profile
  const { data: assignedToProfile } = await supabase
    .from('profiles')
    .select('id, full_name, email, avatar_url, role')
    .eq('id', ticket.assigned_to || 'not-found')
    .single();

  // Merge profile data into ticket
  const ticketWithProfiles = {
    ...ticket,
    created_by_profile: createdByProfile,
    assigned_to_profile: assignedToProfile,
  };

  // Get comments
  const { data: comments } = await supabase
    .from('comments')
    .select('*')
    .eq('ticket_id', ticketId)
    .order('created_at', { ascending: true });

  // Get comment user profiles
  const commentsWithProfiles = await Promise.all(
    (comments || []).map(async (comment) => {
      const { data: userProfile } = await supabase
        .from('profiles')
        .select('id, full_name, email, avatar_url, role')
        .eq('id', comment.user_id || 'not-found')
        .single();
      
      return {
        ...comment,
        user_profile: userProfile,
      };
    })
  );

  // Get activities
  const { data: activities } = await supabase
    .from('ticket_activity_logs')
    .select('*')
    .eq('ticket_id', ticketId)
    .order('created_at', { ascending: false });

  // Get activity user profiles
  const activitiesWithProfiles = await Promise.all(
    (activities || []).map(async (activity) => {
      const { data: userProfile } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .eq('id', activity.user_id || 'not-found')
        .single();
      
      return {
        ...activity,
        user_profile: userProfile,
      };
    })
  );

  return {
    profile: profile as Profile,
    ticket: ticketWithProfiles as Ticket,
    comments: commentsWithProfiles as Comment[],
    activities: activitiesWithProfiles as ActivityLog[],
  };
}

export default async function TicketDetailPage({ params }: PageParams) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { profile, ticket, comments, activities } = await getTicket(id, user.id);

  if (!profile || !ticket) {
    notFound();
  }

  const canManage = profile.role === 'admin' || profile.role === 'owner';
  const isCreator = ticket.created_by === user.id;
  const isAssigned = ticket.assigned_to === user.id;
  const isCustomer = profile.role === 'requester';

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <Link
            href="/dashboard/tickets"
            className="p-2 rounded-lg hover:bg-slate-100 transition-colors mt-1"
          >
            <ArrowLeft className="w-5 h-5 text-slate-600" />
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-slate-900">{ticket.title}</h1>
              {ticket.ticket_code && (
                <TicketCodeCard ticketCode={ticket.ticket_code} />
              )}
            </div>
            <div className="flex items-center gap-3 mt-2">
              <span className={`badge ${getStatusColor(ticket.status)}`}>
                {ticket.status.replace('_', ' ')}
              </span>
              <span className={`badge ${getPriorityColor(ticket.priority)}`}>
                {ticket.priority}
              </span>
              {ticket.category && (
                <span className="badge bg-slate-100 text-slate-700">
                  {ticket.category}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Customer Read-Only Notice */}
      {isCustomer && (
        <div className="p-4 rounded-lg bg-emerald-50 border border-emerald-200 flex items-start gap-3">
          <Eye className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-emerald-700">View Only Mode</p>
            <p className="text-sm text-emerald-600">
              As a customer, you can view this ticket and add comments. 
              Only owners and employees can edit ticket status, priority, and assignments.
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description */}
          <div className="card">
            <div className="p-6 border-b border-slate-200">
              <h2 className="text-lg font-semibold text-slate-900">Description</h2>
            </div>
            <div className="p-6">
              <p className="whitespace-pre-wrap">{ticket.description}</p>
              <div className="flex items-center gap-2 mt-4 pt-4 border-t border-slate-100">
                <Calendar className="w-4 h-4 text-slate-400" />
                <span className="text-sm text-slate-500">
                  Created {formatRelativeTime(ticket.created_at)}
                </span>
              </div>
            </div>
          </div>

          {/* Comments */}
          <TicketComments
            ticketId={ticket.id}
            comments={comments}
            currentUserId={user.id}
            currentUserRole={profile.role}
            isInternal={profile.role === 'agent' || profile.role === 'admin' || profile.role === 'owner'}
          />
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Actions */}
          {(canManage || isCreator || isAssigned) && (
            <TicketDetailActions
              ticket={ticket}
              profile={profile}
              canManage={canManage}
            />
          )}

          {/* Details */}
          <div className="card">
            <div className="p-4 border-b border-slate-200">
              <h3 className="font-semibold text-slate-900">Details</h3>
            </div>
            <div className="p-4 space-y-4">
              {/* Created by */}
              <div className="flex items-start gap-3">
                <User className="w-4 h-4 text-slate-400 mt-1" />
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wide">Created by</p>
                  <p className="font-medium text-slate-900">
                    {ticket.created_by_profile?.full_name || 'Unknown'}
                  </p>
                  <p className="text-sm text-slate-500">
                    {formatDate(ticket.created_at)}
                  </p>
                </div>
              </div>

              {/* Assigned to */}
              <div className="flex items-start gap-3">
                <User className="w-4 h-4 text-slate-400 mt-1" />
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wide">Assigned to</p>
                  {ticket.assigned_to_profile ? (
                    <div>
                      <p className="font-medium text-slate-900">
                        {ticket.assigned_to_profile.full_name}
                      </p>
                      <p className="text-sm text-slate-500 capitalize">
                        {ticket.assigned_to_profile.role}
                      </p>
                    </div>
                  ) : (
                    <p className="text-sm text-slate-500">Unassigned</p>
                  )}
                </div>
              </div>

              {/* Category */}
              {ticket.category && (
                <div className="flex items-start gap-3">
                  <Tag className="w-4 h-4 text-slate-400 mt-1" />
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wide">Category</p>
                    <p className="font-medium text-slate-900">{ticket.category}</p>
                  </div>
                </div>
              )}

              {/* Ticket Code (for customer signup) */}
              {ticket.ticket_code && (
                <div className="flex items-start gap-3">
                  <Ticket className="w-4 h-4 text-slate-400 mt-1" />
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wide">Ticket Code</p>
                    <p className="font-mono text-sm font-medium text-slate-900">
                      {ticket.ticket_code}
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Use to create customer account
                    </p>
                  </div>
                </div>
              )}

              {/* Last updated */}
              <div className="flex items-start gap-3">
                <Clock className="w-4 h-4 text-slate-400 mt-1" />
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wide">Last updated</p>
                  <p className="text-sm text-slate-700">{formatRelativeTime(ticket.updated_at)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Activity */}
          <div className="card">
            <div className="p-4 border-b border-slate-200">
              <h3 className="font-semibold text-slate-900">Activity</h3>
            </div>
            <div className="p-4">
              {activities && activities.length > 0 ? (
                <div className="space-y-4">
                  {activities.slice(0, 10).map((activity) => (
                    <div key={activity.id} className="flex gap-3 text-sm">
                      <div className="w-2 h-2 mt-1.5 rounded-full bg-primary/50 shrink-0" />
                      <div>
                        <p className="text-slate-700">
                          <span className="font-medium text-slate-900">
                            {activity.user_profile?.full_name || 'System'}
                          </span>{' '}
                          {activity.action.replace(/_/g, ' ')}
                          {activity.new_value && activity.action !== 'created' && (
                            <span className="text-slate-500">
                              {' '}from {activity.old_value || 'none'} to {activity.new_value}
                            </span>
                          )}
                        </p>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {formatRelativeTime(activity.created_at)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-500">No activity yet</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

