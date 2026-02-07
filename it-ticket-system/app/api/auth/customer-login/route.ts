import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// This API route handles customer login by:
// 1. Validating the ticket code and name
// 2. Reconstructing the password
// 3. Signing in with email/password
// If the user doesn't exist with the new password, it creates/updates them

export async function POST(request: Request) {
  try {
    const { ticketCode, fullName } = await request.json();

    if (!ticketCode?.trim() || !fullName?.trim()) {
      return NextResponse.json(
        { error: 'Ticket code and full name are required' },
        { status: 400 }
      );
    }

    const cookieStore = await cookies();
    
    // Create server client
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet: Array<{ name: string; value: string; options?: any }>) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              );
            } catch {
              // The `setAll` method was called from a Server Component.
            }
          },
        },
      }
    );

    // Step 1: Authenticate customer to get their email
    const { data: authData, error: authError } = await supabase.rpc(
      'authenticate_customer_by_ticket',
      {
        p_ticket_code: ticketCode.trim(),
        p_full_name: fullName.trim(),
      }
    );

    if (authError || !authData?.success) {
      return NextResponse.json(
        { error: authData?.error || 'Authentication failed' },
        { status: 401 }
      );
    }

    const userEmail = authData.email;
    const userId = authData.user_id;

    // Step 2: Reconstruct the password
    // Password = ticketCode_FULLNAME_REVERSED
    const reconstructedPassword = `${ticketCode.trim().toUpperCase()}_${fullName.trim().split(' ').reverse().join('_')}`;

    // Step 3: Try to sign in with the reconstructed password
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: userEmail,
      password: reconstructedPassword,
    });

    if (signInError) {
      // Login failed - either wrong password or user needs to be recreated
      // Create a new session by re-signing up (this will fail if email exists)
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: userEmail,
        password: reconstructedPassword,
        options: {
          data: {
            full_name: fullName.trim(),
          },
        },
      });

      if (signUpError) {
        // Email already exists - we need to update the password
        // For this, we need to use admin API, which requires service role
        const supabaseAdmin = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!,
          {
            auth: {
              autoRefreshToken: false,
              persistSession: false,
            },
          }
        );

        // Update the user's password using admin API
        const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
          userId,
          { password: reconstructedPassword }
        );

        if (updateError) {
          return NextResponse.json(
            { error: 'Failed to update password. Please try signing up again with the same ticket code.' },
            { status: 500 }
          );
        }
      }

      // Try signing in again after password update
      const { error: retryError } = await supabase.auth.signInWithPassword({
        email: userEmail,
        password: reconstructedPassword,
      });

      if (retryError) {
        return NextResponse.json(
          { error: 'Login failed after password update' },
          { status: 401 }
        );
      }
    }

    // Get the current session
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json(
        { error: 'Failed to create session' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      user: {
        id: session.user.id,
        email: session.user.email,
        full_name: fullName.trim(),
        organization_id: authData.organization_id,
        organization_name: authData.organization_name,
      },
    });

  } catch (error) {
    console.error('Customer login error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

