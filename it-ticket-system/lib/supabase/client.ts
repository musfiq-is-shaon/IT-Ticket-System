import { createBrowserClient } from '@supabase/ssr';

// For client components
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

// Singleton pattern for client-side usage
let supabaseClient: ReturnType<typeof createBrowserClient> | null = null;

export function getSupabaseClient() {
  if (typeof window === 'undefined') {
    return createClient();
  }
  
  if (!supabaseClient) {
    supabaseClient = createClient();
  }
  
  return supabaseClient;
}

