'use client';

import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { User, Mail, Shield, LogOut, Loader2, Save } from 'lucide-react';
import Link from 'next/link';

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

export default function SettingsPage() {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [fullName, setFullName] = useState('');

  useEffect(() => {
    getProfile();
  }, []);

  async function getProfile() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        router.push('/login');
        return;
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      
      setProfile(data as Profile);
      setFullName(data.full_name);
    } catch {
      setError('Failed to load profile');
    } finally {
      setLoading(false);
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: fullName.trim(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', profile?.id ?? '');

      if (error) throw error;
      setSuccess('Profile updated successfully');
    } catch {
      setError('Failed to update profile');
    } finally {
      setSaving(false);
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push('/login');
  }

  const roleColors: Record<string, string> = {
    owner: 'bg-purple-100 text-purple-700',
    admin: 'bg-indigo-100 text-indigo-700',
    agent: 'bg-blue-100 text-blue-700',
    requester: 'bg-slate-100 text-slate-700',
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
        <p className="text-slate-600 mt-1">
          Manage your account settings
        </p>
      </div>

      {/* Profile form */}
      <form onSubmit={handleSave} className="card space-y-6">
        <div className="p-4 border-b border-slate-200">
          <h2 className="font-semibold text-slate-900">Profile Information</h2>
          <p className="text-sm text-slate-500 mt-1">
            Update your personal information
          </p>
        </div>

        <div className="p-6 space-y-6">
          {error && (
            <div className="p-4 rounded-lg bg-red-50 border border-red-200 text-sm text-red-600">
              {error}
            </div>
          )}

          {success && (
            <div className="p-4 rounded-lg bg-green-50 border border-green-200 text-sm text-green-600">
              {success}
            </div>
          )}

          {/* Avatar */}
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-full bg-primary flex items-center justify-center">
              <span className="text-2xl font-medium text-white">
                {fullName?.charAt(0) ?? 'U'}
              </span>
            </div>
            <div>
              <p className="font-medium text-slate-900">{profile?.full_name}</p>
              <p className="text-sm text-slate-500">{profile?.email}</p>
            </div>
          </div>

          {/* Full name */}
          <div className="space-y-2">
            <label htmlFor="fullName" className="block text-sm font-medium text-slate-700">
              Full Name
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                id="fullName"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="input pl-10"
                disabled={saving}
              />
            </div>
          </div>

          {/* Email (read-only) */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-700">
              Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="email"
                value={profile?.email ?? ''}
                className="input pl-10 bg-slate-50"
                disabled
              />
            </div>
            <p className="text-xs text-slate-500">
              Email cannot be changed. Contact support if needed.
            </p>
          </div>

          {/* Role */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-700">
              Role
            </label>
            <div className="relative">
              <Shield className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={profile?.role ?? ''}
                className="input pl-10 bg-slate-50 capitalize"
                disabled
              />
            </div>
            <span className={`inline-block px-3 py-1 text-sm font-medium rounded-full capitalize ${roleColors[profile?.role ?? 'requester']}`}>
              {profile?.role}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 p-4 border-t border-slate-200">
          <button
            type="submit"
            disabled={saving}
            className="btn-primary"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Save Changes
              </>
            )}
          </button>
        </div>
      </form>

      {/* Logout */}
      <div className="card">
        <div className="p-4 border-b border-slate-200">
          <h2 className="font-semibold text-slate-900">Sign Out</h2>
          <p className="text-sm text-slate-500 mt-1">
            Sign out of your account
          </p>
        </div>
        <div className="p-4">
          <button
            onClick={handleLogout}
            className="btn-outline text-red-600 hover:bg-red-50 border-red-200"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}

