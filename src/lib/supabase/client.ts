"use client";

import { createBrowserClient } from "@supabase/ssr";
import { SUPABASE_ANON_KEY, SUPABASE_URL } from "./config";

// Fall back to harmless placeholders when env isn't set yet (e.g. during a
// build before Supabase is connected) so client creation never throws. Real
// calls are gated behind isSupabaseConfigured at the auth boundary.
const url = SUPABASE_URL || "https://placeholder.supabase.co";
const key = SUPABASE_ANON_KEY || "placeholder-anon-key";

export function createClient() {
  return createBrowserClient(url, key);
}
