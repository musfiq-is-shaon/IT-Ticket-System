'use client';

import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Loader2, X, CheckCircle2, User } from 'lucide-react';
import { TICKET_PRIORITIES, TICKET_STATUSES } from '@/lib/utils';

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
  assigned_to_profile?: Pick<Profile, 'id' | 'full_name' | 'email'> | null;
}

interface TeamMember {
  id: string;
  full_name: string;
  email: string;
  role: string;
}

interface TicketDetailActionsProps {
  ticket: Ticket;
  profile: Profile;
  canManage: boolean;
  canAssign: boolean;
}

export function TicketDetailActions({ ticket, profile, canManage, canAssign }: TicketDetailActionsProps) {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(ticket.status);
  const [priority, setPriority] = useState(ticket.priority);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedAssignee, setSelectedAssignee] = useState<string | null>(ticket.assigned_to || null);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);

  // Check if user is a customer (requester) - cannot edit tickets
  const isCustomer = profile.role === 'requester';

  // Customers cannot perform any edits - they can only view
  if (isCustomer) {
    return null;
  }

  const handleStatusUpdate = async (newStatus: string) => {
    setLoading(true);
    try {
      const updates: Record<string, unknown> = { 
        status: newStatus,
        updated_at: new Date().toISOString(),
      };
      
      if (newStatus === 'resolved') {
        updates.resolved_at = new Date().toISOString();
      }
      if (newStatus === 'closed') {
        updates.closed_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('tickets')
        .update(updates)
        .eq('id', ticket.id);

      if (error) throw error;
      setStatus(newStatus as typeof ticket.status);
      router.refresh();
    } catch (error) {
      console.error('Error updating status:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePriorityUpdate = async (newPriority: string) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('tickets')
        .update({ 
          priority: newPriority,
          updated_at: new Date().toISOString(),
        })
        .eq('id', ticket.id);

      if (error) throw error;
      setPriority(newPriority as typeof ticket.priority);
      router.refresh();
    } catch (error) {
      console.error('Error updating priority:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTeamMembers = async () => {
    // Only fetch employees (owner, admin, agent) - not customers
    const { data } = await supabase
      .from('profiles')
      .select('id, full_name, email, role')
      .eq('organization_id', profile.organization_id || '')
      .neq('id', profile.id)
      .in('role', ['owner', 'admin', 'agent']);

    if (data) {
      setTeamMembers(data as TeamMember[]);
    }
    setShowAssignModal(true);
  };

  const handleAssign = async () => {
    if (!selectedAssignee) return;
    setLoading(true);
    try {
      const { error } = await supabase
        .from('tickets')
        .update({ 
          assigned_to: selectedAssignee,
          updated_at: new Date().toISOString(),
        })
        .eq('id', ticket.id);

      if (error) throw error;
      setShowAssignModal(false);
      router.refresh();
    } catch (error) {
      console.error('Error assigning ticket:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="card">
        <div className="p-4 border-b border-slate-200">
          <h3 className="font-semibold text-slate-900">Actions</h3>
        </div>
        <div className="p-4 space-y-4">
          {/* Status */}
          <div>
            <label className="text-xs text-slate-500 uppercase tracking-wide block mb-2">
              Status
            </label>
            <div className="flex flex-wrap gap-2">
              {TICKET_STATUSES.map((s) => (
                <button
                  key={s.value}
                  onClick={() => handleStatusUpdate(s.value)}
                  disabled={loading || status === s.value}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                    status === s.value
                      ? 'bg-primary text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  } disabled:opacity-50`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Priority */}
          <div>
            <label className="text-xs text-slate-500 uppercase tracking-wide block mb-2">
              Priority
            </label>
            <div className="flex flex-wrap gap-2">
              {TICKET_PRIORITIES.map((p) => (
                <button
                  key={p.value}
                  onClick={() => handlePriorityUpdate(p.value)}
                  disabled={loading || priority === p.value}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                    priority === p.value
                      ? 'bg-primary text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  } disabled:opacity-50`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Assign */}
          {canAssign && (
            <div>
              <label className="text-xs text-slate-500 uppercase tracking-wide block mb-2">
                Assign To
              </label>
              <button
                onClick={fetchTeamMembers}
                disabled={loading}
                className="btn-outline w-full justify-center text-sm"
              >
                <User className="w-4 h-4" />
                {ticket.assigned_to ? 'Reassign' : 'Assign'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Assign Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md shadow-xl">
            <div className="flex items-center justify-between p-4 border-b border-slate-200">
              <h3 className="font-semibold text-slate-900">Assign Ticket</h3>
              <button
                onClick={() => setShowAssignModal(false)}
                className="p-1 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            <div className="p-4 space-y-2 max-h-64 overflow-y-auto">
              {teamMembers.map((member) => (
                <button
                  key={member.id}
                  onClick={() => setSelectedAssignee(member.id)}
                  className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors ${
                    selectedAssignee === member.id
                      ? 'bg-primary/5 border border-primary'
                      : 'hover:bg-slate-50 border border-transparent'
                  }`}
                >
                  <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                    <span className="text-sm font-medium text-white">
                      {member.full_name?.charAt(0) || 'U'}
                    </span>
                  </div>
                  <div className="flex-1 text-left">
                    <p className="font-medium text-slate-900">{member.full_name}</p>
                    <p className="text-xs text-slate-500">{member.email}</p>
                  </div>
                  {selectedAssignee === member.id && (
                    <CheckCircle2 className="w-5 h-5 text-primary" />
                  )}
                </button>
              ))}
            </div>
            <div className="flex items-center justify-end gap-3 p-4 border-t border-slate-200">
              <button
                onClick={() => setShowAssignModal(false)}
                className="btn-ghost"
              >
                Cancel
              </button>
              <button
                onClick={handleAssign}
                disabled={loading || !selectedAssignee}
                className="btn-primary"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Assign'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

