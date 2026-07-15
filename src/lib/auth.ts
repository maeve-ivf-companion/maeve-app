import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/supabase/types";

/** Returns the signed-in user's profile (server-side), or null. */
export async function getSessionProfile(): Promise<{
  userId: string;
  profile: Profile | null;
} | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  return { userId: user.id, profile: (profile as Profile) ?? null };
}
