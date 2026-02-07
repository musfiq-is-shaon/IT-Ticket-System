'use client';

import { createClient } from '@/lib/supabase/client';
import { useState } from 'react';
import { Users, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

interface InvitationCodeEntryProps {
  onSuccess?: () => void;
}

export default function InvitationCodeEntry({ onSuccess }: InvitationCodeEntryProps) {
  const supabase = createClient();
  const [invitationCode, setInvitationCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [invitationData, setInvitationData] = useState<{
    organization_name: string;
    role: string;
  } | null>(null);

  const validateInvitation = async (code: string) => {
    if (!code.trim()) {
      setInvitationData(null);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error: rpcError } = await supabase.rpc('validate_invitation_code', {
        p_invitation_code: code.trim(),
      });

      if (rpcError || !data?.success) {
        setInvitationData(null);
        setError(data?.error || 'Invalid invitation code');
        setLoading(false);
        return;
      }

      setInvitationData({
        organization_name: data.organization_name,
        role: data.role,
      });
      setError(null);
    } catch (err) {
      console.error('Invitation validation error:', err);
      setInvitationData(null);
      setError('Failed to validate invitation');
    } finally {
      setLoading(false);
    }
  };

  const handleCodeChange = async (code: string) => {
    setInvitationCode(code);
    await validateInvitation(code);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!invitationCode.trim()) {
      setError('Please enter your invitation code');
      return;
    }

    if (!invitationData) {
      setError('Please enter a valid invitation code');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setError('You must be logged in to join an organization');
        setLoading(false);
        return;
      }

      // Get user's profile to get their email
      const { data: profile } = await supabase
        .from('profiles')
        .select('email, full_name, avatar_url')
        .eq('id', user.id)
        .single();

      if (!profile) {
        setError('Profile not found');
        setLoading(false);
        return;
      }

      // Join organization via invitation code
      const { data: joinData, error: rpcError } = await supabase.rpc(
        'join_organization_by_invitation',
        {
          p_user_id: user.id,
          p_full_name: profile.full_name,
          p_email: profile.email,
          p_avatar_url: profile.avatar_url,
          p_invitation_code: invitationCode.trim(),
        }
      );

      if (rpcError) {
        setError('Failed to join organization. Please check your invitation code.');
        setLoading(false);
        return;
      }

      if (!joinData?.success) {
        setError(joinData?.error || 'Invalid invitation code');
        setLoading(false);
        return;
      }

      setSuccess(`Successfully joined ${invitationData.organization_name} as ${invitationData.role}!`);
      setInvitationCode('');
      setInvitationData(null);
      
      // Refresh the page or callback
      if (onSuccess) {
        onSuccess();
      } else {
        window.location.reload();
      }
    } catch (err) {
      console.error('Invitation error:', err);
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
          <Users className="w-5 h-5 text-blue-600" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Enter Invitation Code</h2>
          <p className="text-sm text-slate-500">Join an organization as an employee</p>
        </div>
      </div>

      {success && (
        <div className="mb-4 p-4 rounded-lg bg-green-50 border border-green-200 flex items-start gap-3">
          <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
          <p className="text-sm text-green-600">{success}</p>
        </div>
      )}

      {error && (
        <div className="mb-4 p-4 rounded-lg bg-red-50 border border-red-200 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="invitationCode" className="block text-sm font-medium text-slate-700 mb-1">
            Invitation Code
          </label>
          <div className="relative">
            <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              id="invitationCode"
              type="text"
              value={invitationCode}
              onChange={(e) => handleCodeChange(e.target.value.toUpperCase())}
              placeholder="XXXX-XXXX-XXXX"
              className="input pl-10 font-mono"
              disabled={loading}
            />
            {loading && (
              <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 animate-spin" />
            )}
          </div>
        </div>

        {/* Invitation validation status */}
        {invitationData && (
          <div className="p-3 rounded-lg bg-green-50 border border-green-200">
            <div className="flex items-center gap-2 text-sm text-green-700">
              <CheckCircle2 className="w-4 h-4" />
              <span className="font-medium">Valid invitation</span>
            </div>
            <div className="mt-2 text-xs text-green-600">
              <p>Organization: <strong>{invitationData.organization_name}</strong></p>
              <p>Role: <strong>{invitationData.role}</strong></p>
            </div>
          </div>
        )}

        {error && !invitationData && (
          <div className="p-3 rounded-lg bg-red-50 border border-red-200">
            <div className="flex items-center gap-2 text-sm text-red-700">
              <AlertCircle className="w-4 h-4" />
              <span>{error}</span>
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={loading || !invitationData}
          className="btn-primary w-full justify-center"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Joining...
            </>
          ) : (
            <>
              Join Organization
            </>
          )}
        </button>
      </form>

      <p className="mt-4 text-xs text-slate-500 text-center">
        Enter the invitation code provided by your organization admin to join as an employee.
      </p>
    </div>
  );
}

