import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export function getSupabaseServerClient(): SupabaseClient | null {
  if (supabaseUrl && supabaseKey && !supabaseUrl.includes('mock')) {
    return createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: false
      }
    });
  }
  return null;
}
