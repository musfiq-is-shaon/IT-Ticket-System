'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  MessageSquare, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  ArrowUpRight,
  Users,
  TrendingUp,
  Calendar,
  Settings,
  Plus,
  Eye,
  Filter,
  BarChart3,
  UserCheck,
  UserPlus
} from 'lucide-react';
import { formatRelativeTime, getPriorityColor, getStatusColor } from '@/lib/utils';

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
  created_by_name?: string | null;
  assigned_to_name?: string | null;
}

interface DashboardClientProps {
  profile: Profile;
  tickets: Ticket[] | null;
  stats: {
    open: number;
    inProgress: number;
    resolved: number;
    critical: number;
    total: number;
  };
}

const ROLE_CONFIG = {
  owner: {
    label: 'Owner',
    color: 'bg-purple-100 text-purple-700',
    permissions: ['create_ticket', 'view_all_tickets', 'assign_tickets', 'manage_team', 'manage_settings', 'view_stats'],
    features: ['Team Management', 'Organization Settings', 'All Tickets', 'Performance Analytics'],
  },
  admin: {
    label: 'Admin',
    color: 'bg-indigo-100 text-indigo-700',
    permissions: ['create_ticket', 'view_all_tickets', 'assign_tickets', 'manage_team', 'view_stats'],
    features: ['Team Management', 'All Tickets', 'Performance Analytics'],
  },
  agent: {
    label: 'Agent',
    color: 'bg-blue-100 text-blue-700',
    permissions: ['create_ticket', 'view_assigned_tickets', 'update_tickets'],
    features: ['My Tickets', 'Assigned Tickets', 'Ticket Updates'],
  },
  requester: {
    label: 'Customer',
    color: 'bg-slate-100 text-slate-700',
    permissions: ['create_ticket', 'view_own_tickets'],
    features: ['My Tickets', 'Submit Tickets'],
  },
};

export default function DashboardClient({ profile, tickets, stats }: DashboardClientProps) {
  const router = useRouter();
  const supabase = createClient();
  const userRole = profile.role;
  const roleConfig = ROLE_CONFIG[userRole];
  const canViewAllTickets = userRole === 'owner' || userRole === 'admin';
  const canAssignTickets = userRole === 'owner' || userRole === 'admin' || userRole === 'agent';
  const canManageTeam = userRole === 'owner' || userRole === 'admin';
  const isOwner = userRole === 'owner';
  const isAdmin = userRole === 'admin';
  const isAgent = userRole === 'agent';
  const isRequester = userRole === 'requester';

  return (
    <div className="space-y-8">
      {/* Welcome header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-900">
              Welcome back, {profile.full_name?.split(' ')[0] ?? 'User'}!
            </h1>
            <span className={`badge ${roleConfig.color} capitalize`}>
              {roleConfig.label}
            </span>
          </div>
          <p className="text-slate-600 mt-1">
            Here&apos;s what&apos;s happening with your tickets today.
          </p>
        </div>
        <Link href="/dashboard/tickets/new" className="btn-primary">
          <Plus className="w-4 h-4" />
          New Ticket
        </Link>
      </div>

      {/* Role-specific quick actions */}
      <div className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-xl p-4 border border-primary/20">
        <div className="flex items-center gap-2 mb-3">
          <BarChart3 className="w-5 h-5 text-primary" />
          <h2 className="font-semibold text-slate-900">Your Dashboard</h2>
        </div>
        <p className="text-sm text-slate-600 mb-4">
          As a <span className="font-medium capitalize">{roleConfig.label}</span>, you can:
        </p>
        <div className="flex flex-wrap gap-2">
          {roleConfig.features.map((feature, i) => (
            <span 
              key={i}
              className="inline-flex items-center gap-1 px-3 py-1.5 bg-white rounded-lg text-sm text-slate-700 border border-primary/20"
            >
              <CheckCircle2 className="w-4 h-4 text-green-500" />
              {feature}
            </span>
          ))}
        </div>
      </div>

      {/* Stats grid - role-based */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Open Tickets"
          value={stats.open}
          icon={MessageSquare}
          color="bg-slate-500"
          href="/dashboard/tickets?status=open"
        />
        <StatCard
          title="In Progress"
          value={stats.inProgress}
          icon={Clock}
          color="bg-blue-500"
          href="/dashboard/tickets?status=in_progress"
        />
        <StatCard
          title="Resolved"
          value={stats.resolved}
          icon={CheckCircle2}
          color="bg-green-500"
          href="/dashboard/tickets?status=resolved"
        />
        <StatCard
          title="Critical"
          value={stats.critical}
          icon={AlertCircle}
          color="bg-red-500"
          href="/dashboard/tickets?priority=critical"
        />
      </div>

      {/* Main content - role-based layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* CUSTOMER VIEW: Only show their own ticket */}
        {isRequester && (
          <div className="lg:col-span-3">
            {tickets && tickets.length > 0 ? (
              <div className="card">
                <div className="card-header">
                  <h2 className="card-title">Your Support Ticket</h2>
                  <p className="card-description">
                    Track the status of your support request
                  </p>
                </div>
                <div className="card-content">
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
                          <th className="text-left py-3 px-4 text-xs font-medium uppercase tracking-wider text-slate-500 hidden md:table-cell">
                            Priority
                          </th>
                          <th className="text-left py-3 px-4 text-xs font-medium uppercase tracking-wider text-slate-500 hidden md:table-cell">
                            Created
                          </th>
                          <th className="text-right py-3 px-4 text-xs font-medium uppercase tracking-wider text-slate-500">
                            Action
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {tickets.map((ticket) => (
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
                            <td className="py-3 px-4 hidden md:table-cell">
                              <span className={`badge ${getPriorityColor(ticket.priority)}`}>
                                {ticket.priority}
                              </span>
                            </td>
                            <td className="py-3 px-4 hidden md:table-cell text-sm text-slate-500">
                              {formatRelativeTime(ticket.created_at)}
                            </td>
                            <td className="py-3 px-4 text-right">
                              <Link
                                href={`/dashboard/tickets/${ticket.id}`}
                                className="text-primary hover:underline text-sm"
                              >
                                View
                              </Link>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            ) : (
              <div className="card">
                <div className="card-content text-center py-12">
                  <MessageSquare className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-slate-900 mb-1">No tickets yet</h3>
                  <p className="text-slate-500 mb-4">You haven&apos;t submitted any support tickets.</p>
                  <Link href="/dashboard/tickets/new" className="btn-primary">
                    Submit Ticket
                  </Link>
                </div>
              </div>
            )}

            {/* Additional info for customers */}
            <div className="card mt-6">
              <div className="card-content text-center py-8">
                <h3 className="text-lg font-medium text-slate-900 mb-2">Need support?</h3>
                <p className="text-slate-500 mb-4">Submit a new support ticket for any issues.</p>
                <Link href="/dashboard/tickets/new" className="btn-primary">
                  Submit Ticket
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* AGENT VIEW: Only show assigned tickets */}
        {isAgent && (
          <div className="lg:col-span-3">
            {tickets && tickets.length > 0 ? (
              <div className="card">
                <div className="card-header">
                  <h2 className="card-title">Your Assigned Tickets</h2>
                  <p className="card-description">
                    Tickets currently assigned to you
                  </p>
                </div>
                <div className="card-content">
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
                          <th className="text-left py-3 px-4 text-xs font-medium uppercase tracking-wider text-slate-500 hidden md:table-cell">
                            Priority
                          </th>
                          <th className="text-left py-3 px-4 text-xs font-medium uppercase tracking-wider text-slate-500 hidden md:table-cell">
                            Created
                          </th>
                          <th className="text-right py-3 px-4 text-xs font-medium uppercase tracking-wider text-slate-500">
                            Action
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {tickets.map((ticket) => (
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
                            <td className="py-3 px-4 hidden md:table-cell">
                              <span className={`badge ${getPriorityColor(ticket.priority)}`}>
                                {ticket.priority}
                              </span>
                            </td>
                            <td className="py-3 px-4 hidden md:table-cell text-sm text-slate-500">
                              {formatRelativeTime(ticket.created_at)}
                            </td>
                            <td className="py-3 px-4 text-right">
                              <Link
                                href={`/dashboard/tickets/${ticket.id}`}
                                className="text-primary hover:underline text-sm"
                              >
                                View
                              </Link>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            ) : (
              <div className="card">
                <div className="card-content text-center py-12">
                  <MessageSquare className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-slate-900 mb-1">No assigned tickets</h3>
                  <p className="text-slate-500 mb-4">You don&apos;t have any tickets assigned to you yet.</p>
                  <Link href="/dashboard/tickets" className="btn-primary">
                    View All Tickets
                  </Link>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ADMIN/OWNER VIEW: Full dashboard with team management */}
        {canManageTeam && !isAgent && (
          <div className="lg:col-span-2">
            <div className="card">
              <div className="card-header flex flex-row items-center justify-between">
                <div>
                  <h2 className="card-title">Recent Tickets</h2>
                  <p className="card-description">
                    All recent ticket activity
                  </p>
                </div>
                <Link
                  href="/dashboard/tickets"
                  className="text-sm text-primary font-medium flex items-center gap-1 hover:underline"
                >
                  View all
                  <ArrowUpRight className="w-4 h-4" />
                </Link>
              </div>
              <div className="card-content">
                {tickets && tickets.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-slate-100">
                          <th className="text-left py-3 px-4 text-xs font-medium uppercase tracking-wider text-slate-500">
                            Ticket
                          </th>
                          <th className="text-left py-3 px-4 text-xs font-medium uppercase tracking-wider text-slate-500 hidden md:table-cell">
                            Status
                          </th>
                          <th className="text-left py-3 px-4 text-xs font-medium uppercase tracking-wider text-slate-500 hidden lg:table-cell">
                            Priority
                          </th>
                          <th className="text-left py-3 px-4 text-xs font-medium uppercase tracking-wider text-slate-500 hidden lg:table-cell">
                            Created
                          </th>
                          <th className="text-right py-3 px-4 text-xs font-medium uppercase tracking-wider text-slate-500">
                            Action
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {tickets.slice(0, 10).map((ticket) => (
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
                            <td className="py-3 px-4 hidden md:table-cell">
                              <span className={`badge ${getStatusColor(ticket.status)}`}>
                                {ticket.status.replace('_', ' ')}
                              </span>
                            </td>
                            <td className="py-3 px-4 hidden lg:table-cell">
                              <span className={`badge ${getPriorityColor(ticket.priority)}`}>
                                {ticket.priority}
                              </span>
                            </td>
                            <td className="py-3 px-4 hidden lg:table-cell text-sm text-slate-500">
                              {formatRelativeTime(ticket.created_at)}
                            </td>
                            <td className="py-3 px-4 text-right">
                              <Link
                                href={`/dashboard/tickets/${ticket.id}`}
                                className="text-primary hover:underline text-sm"
                              >
                                View
                              </Link>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <MessageSquare className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-slate-900 mb-1">No tickets yet</h3>
                    <p className="text-slate-500 mb-4">Create your first ticket to get started.</p>
                    <Link href="/dashboard/tickets/new" className="btn-primary">
                      Create Ticket
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Side panel - only for admins/owners */}
        {canManageTeam && !isAgent && (
          <div className="space-y-6">
            {/* Quick Stats */}
            <div className="card">
              <div className="card-header">
                <h2 className="card-title flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-primary" />
                  Performance
                </h2>
                <p className="card-description">Organization overview</p>
              </div>
              <div className="card-content">
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                        <MessageSquare className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium text-slate-900">Total Tickets</p>
                        <p className="text-sm text-slate-500">All time</p>
                      </div>
                    </div>
                    <p className="text-2xl font-bold text-slate-900">{stats.total}</p>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                        <CheckCircle2 className="w-5 h-5 text-green-600" />
                      </div>
                      <div>
                        <p className="font-medium text-slate-900">Resolution Rate</p>
                        <p className="text-sm text-slate-500">This month</p>
                      </div>
                    </div>
                    <p className="text-2xl font-bold text-slate-900">
                      {stats.total > 0 
                        ? Math.round((stats.resolved / stats.total) * 100) 
                        : 0}%
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="card">
              <div className="card-header">
                <h2 className="card-title flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-primary" />
                  Quick Actions
                </h2>
                <p className="card-description">Common tasks</p>
              </div>
              <div className="card-content">
                <div className="grid grid-cols-2 gap-3">
                  <Link
                    href="/dashboard/tickets/new"
                    className="flex flex-col items-center gap-2 p-4 rounded-lg border border-slate-200 hover:border-primary/50 hover:bg-primary/5 transition-colors"
                  >
                    <Plus className="w-6 h-6 text-primary" />
                    <span className="text-sm font-medium text-slate-700">New Ticket</span>
                  </Link>
                  <Link
                    href="/dashboard/tickets?status=open"
                    className="flex flex-col items-center gap-2 p-4 rounded-lg border border-slate-200 hover:border-primary/50 hover:bg-primary/5 transition-colors"
                  >
                    <Clock className="w-6 h-6 text-blue-600" />
                    <span className="text-sm font-medium text-slate-700">Open</span>
                  </Link>
                  {canManageTeam && (
                    <Link
                      href="/dashboard/team"
                      className="flex flex-col items-center gap-2 p-4 rounded-lg border border-slate-200 hover:border-primary/50 hover:bg-primary/5 transition-colors"
                    >
                      <Users className="w-6 h-6 text-indigo-600" />
                      <span className="text-sm font-medium text-slate-700">Team</span>
                    </Link>
                  )}
                  <Link
                    href="/dashboard/settings"
                    className="flex flex-col items-center gap-2 p-4 rounded-lg border border-slate-200 hover:border-primary/50 hover:bg-primary/5 transition-colors"
                  >
                    <Settings className="w-6 h-6 text-slate-600" />
                    <span className="text-sm font-medium text-slate-700">Settings</span>
                  </Link>
                </div>
              </div>
            </div>

            {/* Role-specific info */}
            {isOwner && (
              <div className="card bg-purple-50 border-purple-200">
                <div className="card-header">
                  <h2 className="card-title flex items-center gap-2 text-purple-700">
                    <UserCheck className="w-5 h-5" />
                    Owner Controls
                  </h2>
                </div>
                <div className="card-content">
                  <p className="text-sm text-purple-600 mb-3">
                    As the organization owner, you have full access to:
                  </p>
                  <ul className="text-sm text-purple-700 space-y-1">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4" />
                      Manage team members
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4" />
                      Organization settings
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4" />
                      Transfer ownership
                    </li>
                  </ul>
                </div>
              </div>
            )}

            {isAdmin && (
              <div className="card bg-indigo-50 border-indigo-200">
                <div className="card-header">
                  <h2 className="card-title flex items-center gap-2 text-indigo-700">
                    <UserCheck className="w-5 h-5" />
                    Admin Controls
                  </h2>
                </div>
                <div className="card-content">
                  <p className="text-sm text-indigo-600 mb-3">
                    As an admin, you have elevated access to:
                  </p>
                  <ul className="text-sm text-indigo-700 space-y-1">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4" />
                      Manage team members
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4" />
                      View all tickets
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4" />
                      Assign tickets
                    </li>
                  </ul>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  icon: Icon,
  color,
  href,
}: {
  title: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  href: string;
}) {
  return (
    <Link href={href} className="card hover:shadow-md transition-shadow">
      <div className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-600">{title}</p>
            <p className="text-3xl font-bold text-slate-900 mt-1">{value}</p>
          </div>
          <div className={`w-12 h-12 rounded-xl ${color} flex items-center justify-center`}>
            <Icon className="w-6 h-6 text-white" />
          </div>
        </div>
      </div>
    </Link>
  );
}

