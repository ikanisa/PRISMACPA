/**
 * Supabase Client — OpenClaw Control UI
 * 
 * Initializes Supabase for Google OAuth authentication.
 * Config comes from Vite environment variables.
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js';

// Vite injects these at build time via import.meta.env
const supabaseUrl = (import.meta as { env?: Record<string, string> }).env?.VITE_SUPABASE_URL
    || 'https://your-project.supabase.co';
const supabaseAnonKey = (import.meta as { env?: Record<string, string> }).env?.VITE_SUPABASE_ANON_KEY
    || '';

if (!supabaseAnonKey) {
    console.warn('[Supabase] VITE_SUPABASE_ANON_KEY not set. Auth will not work.');
}

export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey);

export { type Session, type User } from '@supabase/supabase-js';
