"use client";

import Link from "next/link";
import { Logo } from "@/components/Logo";
import { LanguageToggle } from "@/components/LanguageToggle";
import { useLanguage } from "@/lib/i18n/provider";
import { legalEn } from "@/lib/legal/en";
import { legalFr } from "@/lib/legal/fr";

export function LegalPage({ doc }: { doc: "terms" | "privacy" }) {
  const { lang, t } = useLanguage();
  const content = (lang === "fr" ? legalFr : legalEn)[doc];

  return (
    <div className="min-h-dvh bg-blush-gradient">
      <header className="flex items-center justify-between p-6">
        <Link href="/">
          <Logo />
        </Link>
        <LanguageToggle />
      </header>

      <main className="mx-auto max-w-2xl px-6 pb-24">
        <h1 className="font-display text-3xl text-ink">{content.title}</h1>
        <p className="mt-2 text-sm text-faint">{content.updated}</p>

        <p className="mt-6 rounded-xl border border-berry-500/30 bg-blush-100 p-4 text-sm text-plum-700">
          {content.draftNotice}
        </p>

        <p className="mt-6 text-muted">{content.intro}</p>

        <div className="mt-10 space-y-8">
          {content.sections.map((section) => (
            <section key={section.heading}>
              <h2 className="font-display text-xl text-white">
                {section.heading}
              </h2>
              <div className="mt-3 space-y-3">
                {section.body.map((paragraph, i) => (
                  <p key={i} className="text-sm leading-relaxed text-muted">
                    {paragraph}
                  </p>
                ))}
              </div>
            </section>
          ))}
        </div>

        <p className="mt-10 border-t border-line pt-6 text-sm text-muted">
          {content.contact}
        </p>

        <p className="mt-8 text-center text-sm">
          <Link
            href="/"
            className="font-semibold text-berry-500 hover:text-berry-600"
          >
            {t.common.back}
          </Link>
        </p>
      </main>
    </div>
  );
}
