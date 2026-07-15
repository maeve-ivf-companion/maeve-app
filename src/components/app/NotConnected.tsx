import Link from "next/link";
import { Logo } from "@/components/Logo";

// Shown when Supabase env vars aren't set yet, so the app area still renders
// a friendly message instead of crashing during early setup.
export function NotConnected() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-blush-gradient px-6 text-center">
      <Logo />
      <h1 className="mt-6 font-display text-2xl text-ink">
        Almost there
      </h1>
      <p className="mt-2 max-w-md text-muted">
        Maeve&apos;s accounts and data turn on once Supabase is connected. Add{" "}
        <code className="rounded bg-white px-1.5 py-0.5 text-sm text-berry-600">
          NEXT_PUBLIC_SUPABASE_URL
        </code>{" "}
        and{" "}
        <code className="rounded bg-white px-1.5 py-0.5 text-sm text-berry-600">
          NEXT_PUBLIC_SUPABASE_ANON_KEY
        </code>{" "}
        to your environment.
      </p>
      <Link
        href="/"
        className="mt-6 text-sm font-semibold text-berry-500 hover:text-berry-600"
      >
        Back to home
      </Link>
    </div>
  );
}
