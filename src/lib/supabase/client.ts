import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Singleton Supabase browser client.
 * Returns null if env vars are missing (the app then falls back to localStorage),
 * so the build/dev never crashes when Supabase isn't configured.
 */
let cached: SupabaseClient | null | undefined;

export function getSupabase(): SupabaseClient | null {
  if (cached !== undefined) return cached;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim();
  cached = url && key ? createClient(url, key, { auth: { persistSession: false } }) : null;
  return cached;
}
