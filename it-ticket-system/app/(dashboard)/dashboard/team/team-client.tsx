'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { Users, Shield, Mail, Calendar, Loader2, X } from 'lucide-react';
import { formatDate, formatRelativeTime } from '@/lib/utils';
import InviteMemberModal from './invite-modal';

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

interface Invitation {
  id: string;
  email: string;
  role: 'owner' | 'admin' | 'agent' | 'requester';
  token: string;
  status: string;
  expires_at: string;
  created_at: string;
}

export default function TeamClient({ 
  profile, 
  teamMembers, 
  orgName,
  organizationId 
}: { 
  profile: Profile;
  teamMembers: Profile[];
  orgName: string;
  organizationId: string;
}) {
  const router = useRouter();
  const supabase = createClient();
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loadingInvitations, setLoadingInvitations] = useState(false);
  const [showInvitations, setShowInvitations] = useState(false);

  const userRole = profile.role;
  const canManage = userRole === 'admin' || userRole === 'owner';

  const roleColors: Record<string, string> = {
    owner: 'bg-purple-100 text-purple-700',
    admin: 'bg-indigo-100 text-indigo-700',
    agent: 'bg-blue-100 text-blue-700',
    requester: 'bg-slate-100 text-slate-700',
  };

  const loadInvitations = async () => {
    setLoadingInvitations(true);
    try {
      const { data, error } = await supabase.rpc('get_pending_invitations', {
        p_organization_id: organizationId,
      });
      
      if (error) {
        console.error('Failed to load invitations:', error);
      } else if (data?.success && data.invitations) {
        setInvitations(data.invitations);
      }
    } catch (err) {
      console.error('Error loading invitations:', err);
    } finally {
      setLoadingInvitations(false);
    }
  };

  const handleShowInvitations = async () => {
    setShowInvitations(!showInvitations);
    if (!showInvitations) {
      await loadInvitations();
    }
  };

  const handleInvitationCreated = () => {
    loadInvitations();
    router.refresh();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Team</h1>
          <p className="text-slate-600 mt-1">
            {orgName ? `Manage team members of ${orgName}` : 'Your organization team'}
          </p>
        </div>
        <div className="flex gap-2">
          {canManage && (
            <>
              <button
                onClick={handleShowInvitations}
                className="btn-secondary"
              >
                <Mail className="w-4 h-4" />
                Invitations
                {loadingInvitations && <Loader2 className="w-4 h-4 animate-spin ml-2" />}
              </button>
              <button
                onClick={() => setShowInviteModal(true)}
                className="btn-primary"
              >
                <Users className="w-4 h-4" />
                Invite Member
              </button>
            </>
          )}
        </div>
      </div>

      {/* Pending Invitations */}
      {showInvitations && (
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Pending Invitations</h2>
            <p className="card-description">
              {invitations.length} pending invitation{invitations.length !== 1 ? 's' : ''}
            </p>
          </div>
          <div className="card-content">
            {loadingInvitations ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
              </div>
            ) : invitations.length > 0 ? (
              <div className="divide-y divide-slate-100">
                {invitations.map((invitation) => (
                  <div
                    key={invitation.id}
                    className="flex items-center justify-between py-3 first:pt-0 last:pb-0"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center">
                        <Mail className="w-5 h-5 text-slate-500" />
                      </div>
                      <div>
                        <p className="font-medium text-slate-900">{invitation.email}</p>
                        <p className="text-xs text-slate-500">
                          Invited {formatRelativeTime(invitation.created_at)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`badge ${roleColors[invitation.role]}`}>
                        {invitation.role}
                      </span>
                      <code className="text-sm bg-slate-100 px-2 py-1 rounded font-mono">
                        {invitation.token}
                      </code>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Mail className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500">No pending invitations</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Team stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card">
          <div className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                <Shield className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-slate-600">Owners</p>
                <p className="text-xl font-bold text-slate-900">
                  {teamMembers.filter((m) => m.role === 'owner').length}
                </p>
              </div>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center">
                <Shield className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <p className="text-sm text-slate-600">Admins</p>
                <p className="text-xl font-bold text-slate-900">
                  {teamMembers.filter((m) => m.role === 'admin').length}
                </p>
              </div>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-slate-600">Agents</p>
                <p className="text-xl font-bold text-slate-900">
                  {teamMembers.filter((m) => m.role === 'agent').length}
                </p>
              </div>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center">
                <Users className="w-5 h-5 text-slate-600" />
              </div>
              <div>
                <p className="text-sm text-slate-600">Customers</p>
                <p className="text-xl font-bold text-slate-900">
                  {teamMembers.filter((m) => m.role === 'requester').length}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Team list */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">All Team Members</h2>
          <p className="card-description">
            {teamMembers.length} member{teamMembers.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="card-content">
          {teamMembers.length > 0 ? (
            <div className="divide-y divide-slate-100">
              {teamMembers.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between py-4 first:pt-0 last:pb-0"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center">
                      <span className="text-lg font-medium text-white">
                        {member.full_name?.charAt(0) ?? 'U'}
                      </span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-slate-900">{member.full_name}</p>
                        {member.id === profile.id && (
                          <span className="text-xs text-slate-500">(you)</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Mail className="w-3.5 h-3.5 text-slate-400" />
                        <p className="text-sm text-slate-500">{member.email}</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className={`badge ${roleColors[member.role]}`}>
                      {member.role}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Users className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-900 mb-1">No team members</h3>
              <p className="text-slate-500">
                You are the first member of your organization.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Invite Modal */}
      <InviteMemberModal
        isOpen={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        organizationId={organizationId}
        onInvitationCreated={handleInvitationCreated}
      />
    </div>
  );
}

