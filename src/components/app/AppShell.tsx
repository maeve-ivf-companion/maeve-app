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

  // Fixed app-style order, left to right.
  const items: Item[] = [
    { href: "/app/learn", label: t.nav.learn, d: icons.learn },
    { href: "/app/portals", label: t.nav.portals, d: icons.portals },
    { href: "/app", label: t.nav.home, d: icons.home },
    { href: "/app/partner", label: t.nav.partner, d: icons.partner },
    { href: "/app/account", label: t.nav.account, d: icons.account },
  ];

  const isActive = (href: string) =>
    href === "/app" ? pathname === "/app" : pathname.startsWith(href);

  return (
    <div className="flex min-h-dvh flex-col overflow-x-hidden bg-cream">
      {/* Top bar — logo beside the language toggle */}
      <header className="sticky top-0 z-20 border-b border-line bg-cream/85 backdrop-blur">
        <div className="mx-auto flex w-full max-w-3xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <Link href="/app">
            <Logo />
          </Link>
          <LanguageToggle />
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 pb-28">
        <div className="mx-auto w-full max-w-3xl px-4 py-6 sm:px-6">
          {children}
        </div>
      </main>

      {/* App-style bottom navigation */}
      <nav className="fixed inset-x-0 bottom-0 z-30">
        <div className="mx-auto flex max-w-md items-stretch justify-around gap-1 border-t border-line bg-white/95 px-2 py-1.5 backdrop-blur sm:mb-3 sm:rounded-2xl sm:border sm:shadow-lg sm:shadow-plum-900/10">
          {items.map((it) => {
            const active = isActive(it.href);
            return (
              <Link
                key={it.href}
                href={it.href}
                aria-label={it.label}
                aria-current={active ? "page" : undefined}
                className={`flex min-w-0 flex-1 flex-col items-center gap-0.5 rounded-xl py-1.5 transition ${
                  active ? "text-berry-500" : "text-faint hover:text-plum-700"
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
