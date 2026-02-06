'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { X, Mail, Loader2, Copy, CheckCircle2, AlertCircle } from 'lucide-react';

interface InviteMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  organizationId: string;
  onInvitationCreated: () => void;
}

type UserRole = 'admin' | 'agent' | 'requester';

const ROLES: { value: UserRole; label: string; description: string }[] = [
  { value: 'admin', label: 'Admin', description: 'Can manage team and settings' },
  { value: 'agent', label: 'Agent', description: 'Can handle tickets' },
  { value: 'requester', label: 'Customer', description: 'Can submit tickets' },
];

export default function InviteMemberModal({ 
  isOpen, 
  onClose, 
  organizationId,
  onInvitationCreated 
}: InviteMemberModalProps) {
  const supabase = createClient();
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<UserRole>('agent');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<{ token: string; email: string; role: string } | null>(null);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!email.trim()) {
      setError('Please enter an email address');
      return;
    }

    setLoading(true);

    try {
      const { data, error: rpcError } = await supabase.rpc('create_invitation_code', {
        p_organization_id: organizationId,
        p_email: email.trim(),
        p_role: role,
        p_invited_by: null, // Will be set by the server from auth.uid()
        p_expires_in_days: 7,
      });

      if (rpcError) {
        setError('Failed to create invitation. Please try again.');
        console.error('RPC Error:', rpcError);
        setLoading(false);
        return;
      }

      if (data?.success) {
        setSuccess({
          token: data.token,
          email: data.email,
          role: data.role,
        });
        setEmail('');
        onInvitationCreated();
      } else {
        setError(data?.error || 'Failed to create invitation');
      }
    } catch (err) {
      console.error('Invitation error:', err);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md mx-4 z-10">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold text-slate-900">Invite Team Member</h2>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          {success ? (
            <div className="space-y-4">
              {/* Success message */}
              <div className="flex items-center gap-3 p-4 bg-green-50 rounded-lg">
                <CheckCircle2 className="w-6 h-6 text-green-500 shrink-0" />
                <div>
                  <p className="font-medium text-green-700">Invitation created!</p>
                  <p className="text-sm text-green-600">Send this code to {success.email}</p>
                </div>
              </div>

              {/* Invitation code */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-700">
                  Invitation Code
                </label>
                <div className="flex items-center gap-2">
                  <code className="flex-1 p-3 bg-slate-100 rounded-lg font-mono text-lg font-bold text-slate-900 tracking-wider">
                    {success.token}
                  </code>
                  <button
                    onClick={() => copyToClipboard(success.token)}
                    className="p-3 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                    title="Copy to clipboard"
                  >
                    {copied ? (
                      <CheckCircle2 className="w-5 h-5 text-green-500" />
                    ) : (
                      <Copy className="w-5 h-5 text-slate-500" />
                    )}
                  </button>
                </div>
                <p className="text-xs text-slate-500">
                  This code expires in 7 days. Share it with {success.email}
                </p>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setSuccess(null)}
                  className="flex-1 btn-secondary justify-center"
                >
                  Invite Another
                </button>
                <button
                  onClick={onClose}
                  className="flex-1 btn-primary justify-center"
                >
                  Done
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 rounded-lg bg-red-50 border border-red-200 flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              <div className="space-y-2">
                <label htmlFor="inviteEmail" className="block text-sm font-medium text-slate-700">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    id="inviteEmail"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="colleague@company.com"
                    className="input pl-10"
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-700">
                  Role
                </label>
                <div className="grid gap-2">
                  {ROLES.map((r) => (
                    <button
                      key={r.value}
                      type="button"
                      onClick={() => setRole(r.value)}
                      className={`p-3 rounded-lg border-2 text-left transition-all ${
                        role === r.value
                          ? 'border-primary bg-primary/5'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-slate-900">{r.label}</span>
                        {role === r.value && (
                          <CheckCircle2 className="w-5 h-5 text-primary" />
                        )}
                      </div>
                      <p className="text-sm text-slate-500 mt-0.5">{r.description}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 btn-secondary justify-center"
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 btn-primary justify-center"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    'Create Invitation'
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

