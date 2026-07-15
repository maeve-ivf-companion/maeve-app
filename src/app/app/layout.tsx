import { redirect } from "next/navigation";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { getSessionProfile } from "@/lib/auth";
import { AppShell } from "@/components/app/AppShell";
import { NotConnected } from "@/components/app/NotConnected";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (!isSupabaseConfigured) {
    return <NotConnected />;
  }

  const session = await getSessionProfile();
  if (!session) redirect("/login");
  if (!session.profile?.onboarded) redirect("/onboarding");

  return (
    <AppShell
      name={session.profile.display_name}
      role={session.profile.role}
    >
      {children}
    </AppShell>
  );
}
