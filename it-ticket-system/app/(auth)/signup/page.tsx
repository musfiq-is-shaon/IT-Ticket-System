'use client';

import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { useState, useCallback } from 'react';
import { Mail, Lock, User, Building2, Loader2, ArrowRight, MessageSquare, AlertCircle, CheckCircle2, Users, Key, Shield, UserCheck, ClipboardList, Ticket } from 'lucide-react';
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
  role: string;
  roleDescription: string;
  features: string[];
  color: string;
  bgColor: string;
}

const USER_TYPES: UserTypeOption[] = [
  {
    value: 'owner',
    label: 'Owner',
    description: 'Create a new organization and manage it',
    icon: <Building2 className="w-5 h-5" />,
    role: 'owner',
    roleDescription: 'Full organization access',
    features: [
      'Create your own organization',
      'Manage team members',
      'Access all tickets',
      'Organization settings',
    ],
    color: 'bg-purple-100 text-purple-700 border-purple-200',
    bgColor: 'bg-purple-50',
  },
  {
    value: 'employee',
    label: 'Employee',
    description: 'Join an existing organization as staff',
    icon: <Users className="w-5 h-5" />,
    role: 'agent',
    roleDescription: 'Support staff access',
    features: [
      'Join existing team',
      'Handle assigned tickets',
      'View team performance',
      'Collaborate with others',
    ],
    color: 'bg-blue-100 text-blue-700 border-blue-200',
    bgColor: 'bg-blue-50',
  },
  {
    value: 'customer',
    label: 'Customer',
    description: 'Join an organization using a ticket code',
    icon: <Ticket className="w-5 h-5" />,
    role: 'requester',
    roleDescription: 'Customer access',
    features: [
      'Submit support tickets',
      'Track your requests',
      'Communicate with support',
      'View ticket history',
    ],
    color: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    bgColor: 'bg-emerald-50',
  },
];

export default function SignupPage() {
  const router = useRouter();
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [organizationName, setOrganizationName] = useState('');
  const [userType, setUserType] = useState<UserType>('owner');
  const [invitationCode, setInvitationCode] = useState('');
  const [ticketCode, setTicketCode] = useState('');
  const [validatingInvitation, setValidatingInvitation] = useState(false);
  const [validatingTicket, setValidatingTicket] = useState(false);
  const [invitationData, setInvitationData] = useState<{
    organization_id: string;
    organization_name: string;
    role: string;
    email: string | null;
    expires_at: string;
  } | null>(null);
  const [ticketData, setTicketData] = useState<{
    ticket_id: string;
    ticket_title: string;
    organization_id: string;
    organization_name: string;
  } | null>(null);
  const [invitationError, setInvitationError] = useState<string | null>(null);
  const [ticketError, setTicketError] = useState<string | null>(null);
  const [step, setStep] = useState<'type' | 'details'>('type');

  // Get Supabase client
  const getSupabaseClient = useCallback(() => {
    return createClient();
  }, []);

  // Validate invitation code (for employees)
  const validateInvitation = useCallback(async (code: string) => {
    const supabase = getSupabaseClient();
    
    if (!code.trim()) {
      setInvitationData(null);
      setInvitationError(null);
      return;
    }

    setValidatingInvitation(true);
    setInvitationError(null);

    try {
      const { data, error: rpcError } = await supabase.rpc('validate_invitation_code', {
        p_invitation_code: code.trim(),
      });

      if (rpcError) {
        setInvitationError('Failed to validate invitation. Please try again.');
        setInvitationData(null);
        return;
      }

      if (data?.success) {
        setInvitationData({
          organization_id: data.organization_id,
          organization_name: data.organization_name,
          role: data.role,
          email: data.email,
          expires_at: data.expires_at,
        });
        setInvitationError(null);
      } else {
        setInvitationError(data?.error || 'Invalid invitation code');
        setInvitationData(null);
      }
    } catch (err) {
      console.error('Invitation validation error:', err);
      setInvitationError('Failed to validate invitation. Please try again.');
      setInvitationData(null);
    } finally {
      setValidatingInvitation(false);
    }
  }, [getSupabaseClient]);

  // Validate ticket code (for customers)
  const validateTicketCode = useCallback(async (code: string) => {
    const supabase = getSupabaseClient();
    
    if (!code.trim()) {
      setTicketData(null);
      setTicketError(null);
      return;
    }

    setValidatingTicket(true);
    setTicketError(null);

    try {
      const { data, error: rpcError } = await supabase.rpc('validate_ticket_code', {
        p_ticket_code: code.trim(),
      });

      if (rpcError) {
        setTicketError('Failed to validate ticket code. Please try again.');
        setTicketData(null);
        return;
      }

      if (data?.success) {
        setTicketData({
          ticket_id: data.ticket_id,
          ticket_title: data.ticket_title,
          organization_id: data.organization_id,
          organization_name: data.organization_name,
        });
        setTicketError(null);
      } else {
        setTicketError(data?.error || 'Invalid ticket code');
        setTicketData(null);
      }
    } catch (err) {
      console.error('Ticket code validation error:', err);
      setTicketError('Failed to validate ticket code. Please try again.');
      setTicketData(null);
    } finally {
      setValidatingTicket(false);
    }
  }, [getSupabaseClient]);

  // Handle user type change
  const handleUserTypeChange = (type: UserType) => {
    setUserType(type);
    setOrganizationName('');
    setInvitationCode('');
    setTicketCode('');
    setInvitationData(null);
    setTicketData(null);
    setInvitationError(null);
    setTicketError(null);
    if (type === 'owner') {
      setStep('details');
    } else {
      setStep('type');
    }
  };

  // Handle invitation code change
  const handleInvitationCodeChange = async (code: string) => {
    setInvitationCode(code);
    await validateInvitation(code);
  };

  // Handle ticket code change
  const handleTicketCodeChange = async (code: string) => {
    setTicketCode(code);
    await validateTicketCode(code);
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!fullName.trim()) {
      setError('Please enter your full name');
      return;
    }

    // Customer: Only need ticket code and name
    if (userType === 'customer') {
      if (!ticketData) {
        if (!ticketCode.trim()) {
          setError('Please enter your ticket code');
          return;
        }
        setError('Please enter a valid ticket code');
        return;
      }
      
      setLoading(true);

      try {
        const supabase = getSupabaseClient();
        
        // For customers: Generate random email and password
        // Customer will use magic link or just get auto-logged in
        const randomEmail = `customer+${Date.now()}@ticket.local`;
        const randomPassword = Math.random().toString(36).slice(-12);
        
        // Sign up with generated credentials
        const { data, error: signUpError } = await supabase.auth.signUp({
          email: randomEmail,
          password: randomPassword,
          options: {
            data: {
              full_name: fullName.trim(),
            },
          },
        });

        if (signUpError) {
          setError(signUpError.message);
          setLoading(false);
          return;
        }

        if (!data.user) {
          setError('Failed to create account');
          setLoading(false);
          return;
        }

        // Join organization via ticket code
        const { data: joinData, error: rpcError } = await supabase.rpc(
          'join_organization_by_ticket',
          {
            p_user_id: data.user.id,
            p_full_name: fullName.trim(),
            p_email: randomEmail,
            p_ticket_code: ticketCode.trim().toUpperCase(),
          }
        );

        if (rpcError) {
          console.error('Join organization via ticket error:', rpcError);
          setError('Failed to join organization. Please try again.');
          setLoading(false);
          return;
        }

        if (!joinData?.success) {
          console.error('Join organization via ticket failed:', joinData);
          setError(joinData?.error || 'Failed to join organization. Please try again.');
          setLoading(false);
          return;
        }

        setSuccess('Account created successfully! Redirecting to dashboard...');
        setTimeout(() => {
          router.push('/dashboard');
          router.refresh();
        }, 1500);
      } catch (err) {
        console.error('Signup error:', err);
        setError('An unexpected error occurred. Please try again.');
      } finally {
        setLoading(false);
      }
      return;
    }

    // Owner and Employee: Need email and password
    if (!email.trim()) {
      setError('Please enter your email');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (userType === 'owner') {
      if (!organizationName.trim()) {
        setError('Please enter your organization name');
        return;
      }
    } else if (userType === 'employee') {
      if (!invitationData) {
        if (!invitationCode.trim()) {
          setError('Please enter your invitation code');
          return;
        }
        setError('Please enter a valid invitation code');
        return;
      }
    }

    setLoading(true);

    try {
      const supabase = getSupabaseClient();
      
      // Step 1: Sign up with Supabase Auth
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName.trim(),
          },
        },
      });

      if (signUpError) {
        setError(signUpError.message);
        setLoading(false);
        return;
      }

      if (!data.user) {
        setError('Failed to create user');
        setLoading(false);
        return;
      }

      let orgData;

      if (userType === 'owner') {
        // Step 2a: Create new organization
        const { data: ownerData, error: rpcError } = await supabase.rpc(
          'create_organization_with_owner',
          {
            p_user_id: data.user.id,
            p_full_name: fullName.trim(),
            p_email: email,
            p_avatar_url: data.user.user_metadata?.avatar_url || null,
            p_organization_name: organizationName.trim(),
            p_role: 'owner',
          }
        );

        if (rpcError) {
          console.error('Organization creation error:', rpcError);
          setError('Failed to create organization. Please try again.');
          setLoading(false);
          return;
        }

        if (!ownerData?.success) {
          console.error('Organization creation failed:', ownerData?.error);
          setError(ownerData?.error || 'Failed to create organization. Please try again.');
          setLoading(false);
          return;
        }

        orgData = ownerData;
      } else if (userType === 'employee') {
        // Step 2b: Join organization via invitation
        const { data: joinData, error: rpcError } = await supabase.rpc(
          'join_organization_by_invitation',
          {
            p_user_id: data.user.id,
            p_full_name: fullName.trim(),
            p_email: email,
            p_avatar_url: data.user.user_metadata?.avatar_url || null,
            p_invitation_code: invitationCode.trim(),
          }
        );

        if (rpcError) {
          console.error('Join organization error:', rpcError);
          setError('Failed to join organization. Please try again.');
          setLoading(false);
          return;
        }

        if (!joinData?.success) {
          console.error('Join organization failed:', joinData);
          setError(joinData?.error || 'Failed to join organization. Please try again.');
          setLoading(false);
          return;
        }

        orgData = joinData;
      } else {
        // Step 2c: Join organization via ticket code (for customers)
        const { data: joinData, error: rpcError } = await supabase.rpc(
          'join_organization_by_ticket',
          {
            p_user_id: data.user.id,
            p_full_name: fullName.trim(),
            p_email: email,
            p_ticket_code: ticketCode.trim(),
          }
        );

        if (rpcError) {
          console.error('Join organization via ticket error:', rpcError);
          setError('Failed to join organization. Please try again.');
          setLoading(false);
          return;
        }

        if (!joinData?.success) {
          console.error('Join organization via ticket failed:', joinData);
          setError(joinData?.error || 'Failed to join organization. Please try again.');
          setLoading(false);
          return;
        }

        orgData = joinData;
      }

      console.log('Signup successful:', orgData);
      setSuccess('Account created successfully! Redirecting to dashboard...');
      
      // Success! Redirect to dashboard
      setTimeout(() => {
        router.push('/dashboard');
        router.refresh();
      }, 1500);
    } catch (err) {
      console.error('Signup error:', err);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const selectedType = USER_TYPES.find(t => t.value === userType)!;
  const showOwnerFields = userType === 'owner' && step === 'details';
  const showInvitationFields = userType === 'employee';
  const showTicketFields = userType === 'customer';
  const isEmployeeOrCustomer = userType === 'employee' || userType === 'customer';

  return (
    <div className="min-h-screen flex">
      {/* Left side - Form */}
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
            <h1 className="text-2xl font-bold text-slate-900">Create your account</h1>
            <p className="text-slate-600 mt-2">
              Join us to get started
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

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* User Type Selection */}
            {step === 'type' && (
              <div className="space-y-3">
                <label className="block text-sm font-medium text-slate-700">
                  How are you joining?
                </label>
                <div className="grid gap-3">
                  {USER_TYPES.map((type) => (
                    <button
                      key={type.value}
                      type="button"
                      onClick={() => handleUserTypeChange(type.value)}
                      className={`p-4 rounded-lg border-2 text-left transition-all ${
                        userType === type.value
                          ? type.color
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          userType === type.value ? 'bg-white/50' : 'bg-slate-100'
                        }`}>
                          {type.icon}
                        </div>
                        <div className="flex-1">
                          <div className="font-medium text-slate-900">{type.label}</div>
                          <div className="text-sm text-slate-500">{type.description}</div>
                        </div>
                        {userType === type.value && (
                          <CheckCircle2 className="w-5 h-5 text-primary" />
                        )}
                      </div>
                    </button>
                  ))}
                </div>
                {isEmployeeOrCustomer && (
                  <button
                    type="button"
                    onClick={() => setStep('details')}
                    className="text-sm text-primary hover:underline"
                  >
                    Continue with {selectedType.label} →
                  </button>
                )}
              </div>
            )}

            {/* Role badge preview */}
            {step === 'details' && (
              <div className={`p-3 rounded-lg border ${selectedType.color} ${selectedType.bgColor}`}>
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  <span className="text-sm font-medium">
                    You will join as: <strong>{selectedType.role}</strong>
                  </span>
                </div>
                <p className="text-xs mt-1 opacity-75">{selectedType.roleDescription}</p>
              </div>
            )}

            {/* Full Name */}
            <div className="space-y-2">
              <label htmlFor="fullName" className="block text-sm font-medium text-slate-700">
                Full Name
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  id="fullName"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="John Doe"
                  className="input pl-10"
                  required
                  disabled={loading}
                />
              </div>
            </div>

            {/* Owner: Organization Name */}
            {showOwnerFields && (
              <div className="space-y-2">
                <label htmlFor="organization" className="block text-sm font-medium text-slate-700">
                  Organization Name
                </label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    id="organization"
                    type="text"
                    value={organizationName}
                    onChange={(e) => setOrganizationName(e.target.value)}
                    placeholder="Acme Corporation"
                    className="input pl-10"
                    required={userType === 'owner'}
                    disabled={loading}
                  />
                </div>
                <p className="text-xs text-slate-500">
                  This will be your company&apos;s workspace
                </p>
              </div>
            )}

            {/* Employee: Invitation Code */}
            {showInvitationFields && (
              <div className="space-y-2">
                <label htmlFor="invitationCode" className="block text-sm font-medium text-slate-700">
                  Invitation Code
                </label>
                <div className="relative">
                  <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    id="invitationCode"
                    type="text"
                    value={invitationCode}
                    onChange={(e) => handleInvitationCodeChange(e.target.value)}
                    placeholder="XXXX-XXXX-XXXX"
                    className="input pl-10"
                    required={showInvitationFields}
                    disabled={loading || validatingInvitation}
                  />
                  {validatingInvitation && (
                    <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 animate-spin" />
                  )}
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
                
                {invitationError && (
                  <div className="p-3 rounded-lg bg-red-50 border border-red-200">
                    <div className="flex items-center gap-2 text-sm text-red-700">
                      <AlertCircle className="w-4 h-4" />
                      <span>{invitationError}</span>
                    </div>
                  </div>
                )}
                
                {!invitationCode && showInvitationFields && (
                  <p className="text-xs text-slate-500">
                    Enter the invitation code provided by your organization
                  </p>
                )}
              </div>
            )}

            {/* Customer: Ticket Code Only */}
            {showTicketFields && (
              <div className="space-y-4">
                <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200">
                  <p className="text-sm text-emerald-700">
                    <strong>Quick Signup:</strong> Just enter your ticket code and name to get access.
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
                      required={showTicketFields}
                      disabled={loading || validatingTicket}
                    />
                    {validatingTicket && (
                      <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 animate-spin" />
                    )}
                  </div>
                  
                  {/* Ticket validation status */}
                  {ticketData && (
                    <div className="p-3 rounded-lg bg-green-50 border border-green-200">
                      <div className="flex items-center gap-2 text-sm text-green-700">
                        <CheckCircle2 className="w-4 h-4" />
                        <span className="font-medium">Valid ticket code</span>
                      </div>
                      <div className="mt-2 text-xs text-green-600">
                        <p>Organization: <strong>{ticketData.organization_name}</strong></p>
                        <p>Ticket: <strong>{ticketData.ticket_title}</strong></p>
                      </div>
                    </div>
                  )}
                  
                  {ticketError && (
                    <div className="p-3 rounded-lg bg-red-50 border border-red-200">
                      <div className="flex items-center gap-2 text-sm text-red-700">
                        <AlertCircle className="w-4 h-4" />
                        <span>{ticketError}</span>
                      </div>
                    </div>
                  )}
                </div>

                <p className="text-xs text-slate-500">
                  Enter the ticket code provided by your support agent or from your ticket receipt.
                  Your account will be created automatically using your name.
                </p>
              </div>
            )}

            {/* Email */}
            {!showTicketFields && (
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
                    required={!showTicketFields}
                    disabled={loading}
                  />
                </div>
              </div>
            )}

            {/* Password */}
            {!showTicketFields && (
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
                    required={!showTicketFields}
                    disabled={loading}
                  />
                </div>
                <p className="text-xs text-slate-500">
                  Minimum 8 characters
                </p>
              </div>
            )}

            {/* Confirm Password */}
            {!showTicketFields && (
              <div className="space-y-2">
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-700">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="input pl-10"
                    required={!showTicketFields}
                    disabled={loading}
                  />
                </div>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || 
                (showInvitationFields && !invitationData && !!invitationCode) ||
                (showTicketFields && !ticketData && !!ticketCode)
              }
              className="btn-primary w-full justify-center"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creating account...
                </>
              ) : (
                <>
                  Create Account
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            {/* Back button */}
            {step === 'details' && (
              <button
                type="button"
                onClick={() => setStep('type')}
                className="w-full text-sm text-slate-500 hover:text-slate-700"
              >
                ← Choose a different account type
              </button>
            )}
          </form>

          <p className="text-center text-sm text-slate-600">
            Already have an account?{' '}
            <Link href="/login" className="font-medium text-primary hover:underline">
              Sign in
            </Link>
          </p>

          <p className="text-center text-xs text-slate-500">
            By creating an account, you agree to our Terms of Service and Privacy Policy.
          </p>
        </div>
      </div>

      {/* Right side - Decorative */}
      <div className="hidden lg:flex flex-1 bg-slate-900 items-center justify-center p-12">
        <div className="max-w-md text-white">
          <h2 className="text-3xl font-bold mb-6">
            {userType === 'owner' 
              ? 'Start your organization today'
              : userType === 'employee'
              ? 'Join your team'
              : 'Get support access'}
          </h2>
          
          {/* Role-specific features */}
          <div className={`rounded-xl p-6 mb-8 ${selectedType.bgColor} bg-opacity-10 border border-white/10`}>
            <div className="flex items-center gap-3 mb-4">
              <div className={`w-10 h-10 rounded-lg ${selectedType.color.split(' ')[0]} flex items-center justify-center`}>
                {selectedType.icon}
              </div>
              <div>
                <div className="font-semibold">{selectedType.label}</div>
                <div className="text-sm opacity-75">{selectedType.roleDescription}</div>
              </div>
            </div>
            <ul className="space-y-2">
              {selectedType.features.map((feature, i) => (
                <li key={i} className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-green-400" />
                  <span className="opacity-90">{feature}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Additional info */}
          <div className="space-y-4">
            {userType === 'owner' ? (
              <>
                <p className="text-slate-300">
                  Create your own organization and invite team members to collaborate on support tickets.
                </p>
                <div className="flex items-center gap-2 text-sm text-slate-400">
                  <UserCheck className="w-4 h-4" />
                  <span>You&apos;ll be the owner with full control</span>
                </div>
              </>
            ) : userType === 'employee' ? (
              <>
                <p className="text-slate-300">
                  Enter your invitation code to join your organization and start collaborating.
                </p>
                <div className="flex items-center gap-2 text-sm text-slate-400">
                  <ClipboardList className="w-4 h-4" />
                  <span>Your role will be assigned by the organization</span>
                </div>
              </>
            ) : (
              <>
                <p className="text-slate-300">
                  Enter the ticket code from your support agent or ticket receipt to access your organization.
                </p>
                <div className="flex items-center gap-2 text-sm text-slate-400">
                  <Ticket className="w-4 h-4" />
                  <span>Once joined, you can submit and track support tickets</span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

