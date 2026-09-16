"use client";

import Link from "next/link";
import { useT } from "@/lib/i18n/provider";
import { Logo } from "@/components/Logo";
import { LanguageToggle } from "@/components/LanguageToggle";

// Shared split-panel shell for sign in, sign up, and the forgot/reset
// password pages, so all of them read as one continuous flow.
export function AuthShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  const t = useT();
  return (
    <div className="grid min-h-dvh lg:grid-cols-2">
      {/* Brand panel */}
      <div className="bg-brand-gradient relative hidden flex-col justify-between p-12 text-white lg:flex">
        <Link href="/">
          <Logo light showBy />
        </Link>
        <div className="max-w-md">
          <h2 className="font-display text-4xl leading-tight">
            {t.brand.tagline}
          </h2>
          <p className="mt-4 text-white/70">{t.landing.coupleBody}</p>
        </div>
        <p className="text-sm text-white/50">{t.landing.footerNote}</p>
      </div>

      {/* Form panel */}
      <div className="flex flex-col bg-cream">
        <div className="flex items-center justify-between p-6">
          <Link href="/" className="lg:invisible">
            <Logo showBy={false} />
          </Link>
          <LanguageToggle />
        </div>
        <div className="flex flex-1 items-center justify-center px-6 pb-16">
          <div className="w-full max-w-sm">
            <h1 className="font-display text-3xl text-ink">{title}</h1>
            <p className="mb-8 mt-2 text-muted">{subtitle}</p>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
