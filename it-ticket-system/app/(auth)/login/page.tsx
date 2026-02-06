'use client';

import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { useState, Suspense, useCallback } from 'react';
import { Mail, Lock, Loader2, ArrowRight, MessageSquare, User, Ticket, Building2, Users, CheckCircle2, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import type { ReactNode } from 'react';

export const dynamic = 'force-dynamic';

// User type options
type UserType = 'owner' | 'employee' | 'customer';

interface UserTypeOption {
  value: UserType;
  label: string;
  description: string;
  icon: ReactNode;
}

const LOGIN_TYPES: UserTypeOption[] = [
  {
    value: 'owner',
    label: 'Owner / Admin',
    description: 'Organization owner or admin',
    icon: <Building2 className="w-5 h-5" />,
  },
  {
    value: 'employee',
    label: 'Employee',
    description: 'Staff member or agent',
    icon: <Users className="w-5 h-5" />,
  },
  {
    value: 'customer',
    label: 'Customer',
    description: 'Customer with ticket code',
    icon: <Ticket className="w-5 h-5" />,
  },
];

function LoginForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [userType, setUserType] = useState<UserType>('owner');
  
  // Standard auth fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // Customer auth fields
  const [ticketCode, setTicketCode] = useState('');
  const [fullName, setFullName] = useState('');
  const [validatingTicket, setValidatingTicket] = useState(false);
  const [ticketValidation, setTicketValidation] = useState<{
    success: boolean;
    error?: string;
    full_name?: string;
    organization_name?: string;
  } | null>(null);

  // Validate ticket code for customers
  const validateTicketCode = useCallback(async (code: string, name: string) => {
    if (!code.trim() || !name.trim()) {
      setTicketValidation(null);
      return;
    }

    setValidatingTicket(true);
    setError(null);

    try {
      const supabase = createClient();
      const { data, error: rpcError } = await supabase.rpc('authenticate_customer_by_ticket', {
        p_ticket_code: code.trim(),
        p_full_name: name.trim(),
      });

      if (rpcError) {
        setTicketValidation({
          success: false,
          error: 'Failed to validate. Please try again.',
        });
        return;
      }

      if (data?.success) {
        setTicketValidation({
          success: true,
          full_name: data.full_name,
          organization_name: data.organization_name,
        });
        setError(null);
      } else {
        setTicketValidation({
          success: false,
          error: data?.error || 'Invalid ticket code or name',
        });
      }
    } catch (err) {
      console.error('Ticket validation error:', err);
      setTicketValidation({
        success: false,
        error: 'Failed to validate. Please try again.',
      });
    } finally {
      setValidatingTicket(false);
    }
  }, []);

  // Handle ticket code change
  const handleTicketCodeChange = async (code: string) => {
    setTicketCode(code);
    await validateTicketCode(code, fullName);
  };

  // Handle name change for customers
  const handleNameChange = async (name: string) => {
    setFullName(name);
    if (ticketCode.trim()) {
      await validateTicketCode(ticketCode, name);
    }
  };

  // Handle standard email/password login
  const handleStandardLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      
      const { error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        setError(authError.message);
        return;
      }

      router.push('/dashboard');
      router.refresh();
    } catch {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  // Handle customer login via ticket code
  const handleCustomerLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!ticketCode.trim() || !fullName.trim()) {
      setError('Please enter both ticket code and your name');
      return;
    }

    if (!ticketValidation?.success) {
      setError('Please enter a valid ticket code and name');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      
      // Get the user's email from the validation result
      const { data: profileData, error: profileError } = await supabase.rpc(
        'authenticate_customer_by_ticket',
        {
          p_ticket_code: ticketCode.trim(),
          p_full_name: fullName.trim(),
        }
      );

      if (profileError || !profileData?.success) {
        setError(profileData?.error || 'Authentication failed');
        setLoading(false);
        return;
      }

      // Send magic link to the customer's email
      const { error: magicLinkError } = await supabase.auth.signInWithOtp({
        email: profileData.email,
        options: {
          shouldCreateUser: false,
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (magicLinkError) {
        setError(magicLinkError.message);
        setLoading(false);
        return;
      }

      setSuccess('Magic link sent! Check your email to sign in.');
    } catch (err) {
      console.error('Customer login error:', err);
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const isCustomerLogin = userType === 'customer';

  return (
    <div className="flex-1 flex items-center justify-center p-8">
      <div className="w-full max-w-md space-y-8">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
            <MessageSquare className="w-6 h-6 text-white" />
          </div>
          <span className="font-bold text-xl text-slate-900">IT Ticket System</span>
        </div>

        <div>
          <h1 className="text-2xl font-bold text-slate-900">Welcome back</h1>
          <p className="text-slate-600 mt-2">
            Sign in to your account to continue
          </p>
        </div>

        {/* Success message */}
        {success && (
          <div className="p-4 rounded-lg bg-green-50 border border-green-200 flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
            <p className="text-sm text-green-600">{success}</p>
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className="p-4 rounded-lg bg-red-50 border border-red-200 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* User Type Selection */}
        <div className="space-y-3">
          <label className="block text-sm font-medium text-slate-700">
            How are you signing in?
          </label>
          <div className="grid gap-2">
            {LOGIN_TYPES.map((type) => (
              <button
                key={type.value}
                type="button"
                onClick={() => setUserType(type.value)}
                className={`p-3 rounded-lg border-2 text-left transition-all flex items-center gap-3 ${
                  userType === type.value
                    ? type.value === 'owner'
                      ? 'bg-purple-50 border-purple-200 text-purple-700'
                      : type.value === 'employee'
                      ? 'bg-blue-50 border-blue-200 text-blue-700'
                      : 'bg-emerald-50 border-emerald-200 text-emerald-700'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                  userType === type.value
                    ? type.value === 'owner'
                      ? 'bg-purple-100'
                      : type.value === 'employee'
                      ? 'bg-blue-100'
                      : 'bg-emerald-100'
                    : 'bg-slate-100'
                }`}>
                  {type.icon}
                </div>
                <div className="flex-1">
                  <div className="font-medium text-slate-900">{type.label}</div>
                  <div className="text-xs text-slate-500">{type.description}</div>
                </div>
                {userType === type.value && (
                  <CheckCircle2 className="w-5 h-5 text-primary" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Customer Login Form */}
        {isCustomerLogin ? (
          <form onSubmit={handleCustomerLogin} className="space-y-4">
            <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200">
              <p className="text-sm text-emerald-700">
                <strong>Customer Login:</strong> Enter your ticket code and name to access your support tickets.
              </p>
            </div>

            <div className="space-y-2">
              <label htmlFor="ticketCode" className="block text-sm font-medium text-slate-700">
                Ticket Code
              </label>
              <div className="relative">
                <Ticket className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  id="ticketCode"
                  type="text"
                  value={ticketCode}
                  onChange={(e) => handleTicketCodeChange(e.target.value.toUpperCase())}
                  placeholder="TC-XXXX-XXXX-XXXX"
                  className="input pl-10 font-mono"
                  required={isCustomerLogin}
                  disabled={loading}
                />
                {validatingTicket && (
                  <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 animate-spin" />
                )}
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="fullName" className="block text-sm font-medium text-slate-700">
                Your Full Name
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  id="fullName"
                  type="text"
                  value={fullName}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="John Doe"
                  className="input pl-10"
                  required={isCustomerLogin}
                  disabled={loading}
                />
              </div>
            </div>

            {/* Ticket validation status */}
            {ticketValidation && (
              ticketValidation.success ? (
                <div className="p-3 rounded-lg bg-green-50 border border-green-200">
                  <div className="flex items-center gap-2 text-sm text-green-700">
                    <CheckCircle2 className="w-4 h-4" />
                    <span className="font-medium">Verified: {ticketValidation.full_name}</span>
                  </div>
                  <div className="mt-1 text-xs text-green-600">
                    Organization: <strong>{ticketValidation.organization_name}</strong>
                  </div>
                </div>
              ) : ticketValidation.error && (
                <div className="p-3 rounded-lg bg-red-50 border border-red-200">
                  <div className="flex items-center gap-2 text-sm text-red-700">
                    <AlertCircle className="w-4 h-4" />
                    <span>{ticketValidation.error}</span>
                  </div>
                </div>
              )
            )}

            <button
              type="submit"
              disabled={loading || (ticketCode && fullName && !ticketValidation?.success)}
              className="btn-primary w-full justify-center"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Sending magic link...
                </>
              ) : (
                <>
                  Sign In with Ticket Code
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            <p className="text-xs text-slate-500 text-center">
              A magic link will be sent to your registered email address.
            </p>
          </form>
        ) : (
          /* Standard Email/Password Login */
          <form onSubmit={handleStandardLogin} className="space-y-6">
            <div className="space-y-2">
              <label htmlFor="email" className="block text-sm font-medium text-slate-700">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  className="input pl-10"
                  required={!isCustomerLogin}
                  disabled={loading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="block text-sm font-medium text-slate-700">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="input pl-10"
                  required={!isCustomerLogin}
                  disabled={loading}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full justify-center"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  Sign In
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}

        <p className="text-center text-sm text-slate-600">
          Don't have an account?{' '}
          <Link href="/signup" className="font-medium text-primary hover:underline">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}

function LoginLoading() {
  return (
    <div className="flex-1 flex items-center justify-center p-8">
      <div className="w-full max-w-md space-y-8">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
            <MessageSquare className="w-6 h-6 text-white" />
          </div>
          <span className="font-bold text-xl text-slate-900">IT Ticket System</span>
        </div>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex">
      {/* Left side - Form */}
      <Suspense fallback={<LoginLoading />}>
        <LoginForm />
      </Suspense>

      {/* Right side - Decorative */}
      <div className="hidden lg:flex flex-1 bg-slate-900 items-center justify-center p-12">
        <div className="max-w-md text-white">
          <h2 className="text-3xl font-bold mb-6">
            Streamline your IT support operations
          </h2>
          <p className="text-slate-300 mb-8">
            A modern helpdesk solution built for enterprise IT teams. 
            Manage tickets, assign tasks, and resolve issues faster.
          </p>
          <div className="space-y-4">
            {[
              'Role-based access control',
              'Real-time ticket updates',
              'Internal notes for collaboration',
              'Complete audit trail',
            ].map((feature, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center">
                  <div className="w-2 h-2 rounded-full bg-primary" />
                </div>
                <span className="text-slate-300">{feature}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

