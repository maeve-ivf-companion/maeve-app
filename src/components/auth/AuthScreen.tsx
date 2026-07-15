"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useT } from "@/lib/i18n/provider";
import { Logo } from "@/components/Logo";
import { LanguageToggle } from "@/components/LanguageToggle";
import { AuthForm } from "./AuthForm";

export function AuthScreen({ mode }: { mode: "signin" | "signup" }) {
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
            <h1 className="font-display text-3xl text-ink">
              {mode === "signup" ? t.auth.signUpTitle : t.auth.signInTitle}
            </h1>
            <p className="mb-8 mt-2 text-muted">
              {mode === "signup" ? t.auth.signUpSubtitle : t.auth.signInSubtitle}
            </p>
            <Suspense>
              <AuthForm mode={mode} />
            </Suspense>
          </div>
        </div>
      </div>
    </div>
  );
}
