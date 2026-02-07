'use client';

import { createClient } from '@/lib/supabase/client';
import { useState } from 'react';
import { Ticket, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

interface TicketCodeEntryProps {
  onSuccess?: () => void;
}

export default function TicketCodeEntry({ onSuccess }: TicketCodeEntryProps) {
  const supabase = createClient();
  const [ticketCode, setTicketCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!ticketCode.trim()) {
      setError('Please enter your ticket code');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setError('You must be logged in to enter a ticket code');
        setLoading(false);
        return;
      }

      // Get user's profile to get their email
      const { data: profile } = await supabase
        .from('profiles')
        .select('email, full_name')
        .eq('id', user.id)
        .single();

      if (!profile) {
        setError('Profile not found');
        setLoading(false);
        return;
      }

      // Try to join organization via ticket code
      const { data: joinData, error: rpcError } = await supabase.rpc(
        'join_organization_by_ticket',
        {
          p_user_id: user.id,
          p_full_name: profile.full_name,
          p_email: profile.email,
          p_ticket_code: ticketCode.trim().toUpperCase(),
        }
      );

      if (rpcError) {
        setError('Failed to join organization. Please check your ticket code.');
        setLoading(false);
        return;
      }

      if (!joinData?.success) {
        setError(joinData?.error || 'Invalid ticket code');
        setLoading(false);
        return;
      }

      setSuccess(`Successfully joined ${joinData.organization_name}!`);
      setTicketCode('');
      
      // Refresh the page or callback
      if (onSuccess) {
        onSuccess();
      } else {
        window.location.reload();
      }
    } catch (err) {
      console.error('Ticket code error:', err);
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
          <Ticket className="w-5 h-5 text-emerald-600" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Enter Ticket Code</h2>
          <p className="text-sm text-slate-500">Join an organization using your ticket code</p>
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
          <label htmlFor="ticketCode" className="block text-sm font-medium text-slate-700 mb-1">
            Ticket Code
          </label>
          <div className="relative">
            <Ticket className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              id="ticketCode"
              type="text"
              value={ticketCode}
              onChange={(e) => setTicketCode(e.target.value.toUpperCase())}
              placeholder="TC-XXXX-XXXX-XXXX"
              className="input pl-10 font-mono"
              disabled={loading}
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading || !ticketCode.trim()}
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
        Enter the ticket code provided by your support agent to access your organization's tickets.
      </p>
    </div>
  );
}

