/**
 * BIS Compliance Assistant — Supabase Client
 * 
 * Creates the Supabase client for browser-side usage.
 * Falls back gracefully when credentials are not configured
 * (allowing local development with mock data).
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY && !process.env.SUPABASE_SERVICE_ROLE_KEY.includes('placeholder')
  ? process.env.SUPABASE_SERVICE_ROLE_KEY
  : anonKey;

let _supabase: SupabaseClient | null = null;
if (url.length > 0 && anonKey.length > 0) {
  _supabase = createClient(url, anonKey);
}

let _adminSupabase: SupabaseClient | null = null;
if (url.length > 0 && serviceKey.length > 0) {
  _adminSupabase = createClient(url, serviceKey);
}

export function getSupabase(): SupabaseClient | null {
  return _supabase;
}

export function getAdminSupabase(): SupabaseClient | null {
  return _adminSupabase;
}

export { _supabase as supabase };
