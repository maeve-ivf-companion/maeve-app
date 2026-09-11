"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useT } from "@/lib/i18n/provider";
import { Logo } from "@/components/Logo";
import { LanguageToggle } from "@/components/LanguageToggle";
import type { Role } from "@/lib/supabase/types";

type Item = { href: string; label: string; d: string };

function Icon({ d }: { d: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-6 w-6 shrink-0"
    >
      <path d={d} />
    </svg>
  );
}

const icons = {
  home: "M3 11.5 12 4l9 7.5M5 10v10h14V10",
  portals: "M12 21s-7-4.35-7-10a7 7 0 0 1 14 0c0 5.65-7 10-7 10Z",
  partner: "M16 11a4 4 0 1 0-8 0 4 4 0 0 0 8 0Zm6 9a6 6 0 0 0-12 0M2 20a6 6 0 0 1 6-6",
  learn: "M12 6.5C10 4.5 6 4.5 4 6v13c2-1.5 6-1.5 8 0 2-1.5 6-1.5 8 0V6c-2-1.5-6-1.5-8 .5Z",
  account: "M12 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Zm-6.5 9a6.5 6.5 0 0 1 13 0",
  monitoring: "M3 12h4l2-7 4 14 2-7h6",
  journey: "M4 20c4-8 8 8 12 0M4 12h16M4 4c4 8 8-8 12 0",
  community: "M8 12a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm8 0a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM2 20a5 5 0 0 1 9-3 5 5 0 0 1 9 3",
};

export function AppShell({
  children,
}: {
  children: React.ReactNode;
  name?: string | null;
  role?: Role;
}) {
  const t = useT();
  const pathname = usePathname();

  // Fixed app-style order, left to right, per the Maeve Layout wireframes:
  // Home, Monitoring, Journey & Self-Care, Community, Support. Learn, Portals,
  // Track It, Schedule It, and Account are no longer bottom-nav tabs; they
  // stay reachable via links from these five pages and the top-bar icon below.
  const items: Item[] = [
    { href: "/app", label: t.nav.home, d: icons.home },
    { href: "/app/monitoring", label: t.nav.monitoring, d: icons.monitoring },
    { href: "/app/journey", label: t.nav.journey, d: icons.journey },
    { href: "/app/community", label: t.nav.community, d: icons.community },
    { href: "/app/partner", label: t.nav.partner, d: icons.partner },
  ];

  const isActive = (href: string) =>
    href === "/app" ? pathname === "/app" : pathname.startsWith(href);

  return (
    // Outer lane: on a wide screen this is just calm background either side
    // of the app; on a phone it's invisible because there's no room for it.
    <div className="min-h-dvh bg-plum-900">
      <div className="mx-auto flex min-h-dvh w-full max-w-[440px] flex-col overflow-x-hidden bg-cream sm:shadow-2xl sm:shadow-black/40 sm:ring-1 sm:ring-white/10">
        {/* Top bar — logo beside the language toggle */}
        <header className="sticky top-0 z-20 border-b border-line bg-cream/85 backdrop-blur">
          <div className="flex items-center justify-between gap-3 px-4 py-3">
            <Link href="/app">
              <Logo />
            </Link>
            <div className="flex items-center gap-3">
              <LanguageToggle />
              <Link
                href="/app/account"
                aria-label={t.nav.account}
                className={`flex h-9 w-9 items-center justify-center rounded-full transition ${
                  isActive("/app/account")
                    ? "bg-blush-100 text-berry-500"
                    : "text-faint hover:text-white"
                }`}
              >
                <Icon d={icons.account} />
              </Link>
            </div>
          </div>
        </header>

        {/* Content — bottom padding reserves space for the fixed nav below */}
        <main className="flex-1 pb-24">
          <div className="px-4 py-6">{children}</div>
        </main>
      </div>

      {/* App-style bottom navigation: truly fixed to the viewport, so it never
          scrolls out of view, centered to match the phone-width column above. */}
      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-cream/95 backdrop-blur">
        <div className="mx-auto flex max-w-[440px] items-stretch justify-around gap-1 px-2 py-1.5">
          {items.map((it) => {
            const active = isActive(it.href);
            return (
              <Link
                key={it.href}
                href={it.href}
                aria-label={it.label}
                aria-current={active ? "page" : undefined}
                className={`flex min-w-0 flex-1 flex-col items-center gap-0.5 rounded-xl py-1.5 transition ${
                  active ? "text-berry-500" : "text-faint hover:text-white"
                }`}
              >
                <span
                  className={`flex h-9 w-9 items-center justify-center rounded-full transition ${
                    active ? "bg-blush-100" : "bg-transparent"
                  }`}
                >
                  <Icon d={it.d} />
                </span>
                <span className="max-w-full truncate text-[10px] font-medium">
                  {it.label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
