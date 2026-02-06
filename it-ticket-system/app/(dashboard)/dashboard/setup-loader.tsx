'use client';

import { createClient } from '@/lib/supabase/client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function SetupLoader({ email }: { email: string }) {
  const router = useRouter();
  const [status, setStatus] = useState('Checking account status...');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkProfile = async () => {
      const supabase = createClient();
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setError('Session lost. Please sign in again.');
        return;
      }

      // Check if profile exists
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id, organization_id, full_name, role')
        .eq('id', user.id)
        .single();

      if (profile && profile.organization_id) {
        // Profile is ready, refresh to show dashboard
        router.refresh();
        router.push('/dashboard');
      } else {
        // Still setting up, check again in 2 seconds
        setStatus('Still setting up your account...');
        setTimeout(checkProfile, 2000);
      }
    };

    // Start checking after initial delay
    const timer = setTimeout(() => {
      checkProfile();
    }, 1500);

    return () => clearTimeout(timer);
  }, [router]);

  const handleRefresh = () => {
    router.refresh();
  };

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = '/login';
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          Welcome, {email.split('@')[0]}!
        </h1>
        <p className="text-slate-600 mt-1">
          Completing your account setup...
        </p>
      </div>

      <div className="card">
        <div className="card-content py-12">
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
            <h2 className="text-xl font-semibold text-slate-900 mb-2">Setting up your account</h2>
            <p className="text-slate-600 mb-2">{status}</p>
            
            <button
              onClick={handleRefresh}
              className="btn-primary mt-4"
            >
              Refresh Now
            </button>

            {error && (
              <p className="text-red-600 text-sm mt-4">{error}</p>
            )}

            <button
              onClick={handleLogout}
              className="text-sm text-slate-500 hover:text-slate-700 mt-6 block mx-auto"
            >
              Sign out and try again
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

