/**
 * BIS Compliance Assistant — Supabase Client
 * 
 * Creates the Supabase client for browser-side usage.
 * Falls back gracefully when credentials are not configured
 * (allowing local development with mock data).
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';

/**
 * Whether Supabase is configured with real credentials.
 * When false, the application uses local mock data instead.
 */
export const isSupabaseConfigured =
  supabaseUrl.length > 0 && supabaseAnonKey.length > 0;

let _supabase: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient | null {
  if (!isSupabaseConfigured) return null;
  if (!_supabase) {
    _supabase = createClient(supabaseUrl, supabaseAnonKey);
  }
  return _supabase;
}

export { _supabase as supabase };
