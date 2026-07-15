"use client";

import Link from "next/link";
import { useLanguage } from "@/lib/i18n/provider";
import { Logo } from "@/components/Logo";
import { LanguageToggle } from "@/components/LanguageToggle";
import { Button } from "@/components/ui";

export function Landing() {
  const { t } = useLanguage();

  const pillars = [
    {
      emoji: "💞",
      title: t.landing.pillars.companionTitle,
      body: t.landing.pillars.companionBody,
    },
    {
      emoji: "🫂",
      title: t.landing.pillars.portalsTitle,
      body: t.landing.pillars.portalsBody,
    },
    {
      emoji: "📈",
      title: t.landing.pillars.trackTitle,
      body: t.landing.pillars.trackBody,
    },
    {
      emoji: "🗓️",
      title: t.landing.pillars.scheduleTitle,
      body: t.landing.pillars.scheduleBody,
    },
  ];

  return (
    <div className="flex min-h-dvh flex-col">
      {/* Nav */}
      <header className="sticky top-0 z-30 border-b border-line/60 bg-cream/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-5 py-4 sm:px-10 lg:px-16">
          <Logo showBy={false} className="shrink-0" />
          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            <LanguageToggle />
            <Link
              href="/login"
              className="hidden text-sm font-medium text-plum-700 hover:text-berry-500 sm:block"
            >
              {t.auth.signIn}
            </Link>
            <Link href="/signup">
              <Button size="sm">{t.landing.heroCta}</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="bg-blush-gradient absolute inset-0 -z-10" />
        <div className="mx-auto max-w-4xl px-6 sm:px-10 lg:px-16 py-20 text-center sm:py-28">
          <span className="inline-block rounded-full bg-white/70 px-4 py-1.5 text-sm font-medium text-berry-600 shadow-sm animate-rise">
            {t.landing.heroEyebrow}
          </span>
          <h1 className="mx-auto mt-6 max-w-3xl font-display text-5xl leading-[1.05] text-ink sm:text-6xl animate-rise">
            {t.landing.heroTitle}
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted animate-rise">
            {t.landing.heroBody}
          </p>
          <div className="mt-9 flex flex-wrap items-center justify-center gap-4 animate-rise">
            <Link href="/signup">
              <Button size="lg">{t.landing.heroCta}</Button>
            </Link>
            <a href="#how">
              <Button size="lg" variant="outline">
                {t.landing.heroSecondary}
              </Button>
            </a>
          </div>
        </div>
      </section>

      {/* Problem */}
      <section className="mx-auto max-w-4xl px-6 sm:px-10 lg:px-16 py-20 text-center">
        <h2 className="font-display text-3xl text-ink sm:text-4xl">
          {t.landing.problemTitle}
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-muted">
          {t.landing.problemBody}
        </p>
      </section>

      {/* Pillars */}
      <section id="how" className="bg-white py-24">
        <div className="mx-auto max-w-6xl px-6 sm:px-10 lg:px-16">
          <h2 className="text-center font-display text-3xl text-ink sm:text-4xl">
            {t.landing.featuresTitle}
          </h2>
          <div className="mt-14 grid gap-7 sm:grid-cols-2 lg:grid-cols-4">
            {pillars.map((p) => (
              <div
                key={p.title}
                className="rounded-2xl border border-line bg-cream/50 p-7"
              >
                <span className="text-3xl">{p.emoji}</span>
                <h3 className="mt-4 font-display text-xl text-plum-700">
                  {p.title}
                </h3>
                <p className="mt-2 text-sm text-muted">{p.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Couple section */}
      <section className="bg-brand-gradient py-24 text-white">
        <div className="mx-auto max-w-3xl px-6 sm:px-10 lg:px-16 text-center">
          <h2 className="font-display text-3xl sm:text-4xl">
            {t.landing.coupleTitle}
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-white/80">
            {t.landing.coupleBody}
          </p>
          <div className="mx-auto mt-10 max-w-sm rounded-2xl bg-white/10 p-6 backdrop-blur">
            <p className="text-sm text-white/60">
              {t.partner.briefToday}
            </p>
            <p className="mt-2 font-display text-2xl">
              “{t.partner.patientBody.split(".")[0]}.”
            </p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-3xl px-6 sm:px-10 lg:px-16 py-24 text-center">
        <h2 className="font-display text-4xl text-ink">{t.landing.ctaTitle}</h2>
        <p className="mt-4 text-muted">{t.landing.ctaBody}</p>
        <Link href="/signup" className="mt-8 inline-block">
          <Button size="lg">{t.landing.ctaButton}</Button>
        </Link>
      </section>

      {/* Footer */}
      <footer className="border-t border-line py-10">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 sm:px-10 lg:px-16 sm:flex-row">
          <Logo />
          <p className="text-sm text-faint">{t.landing.footerNote}</p>
          <LanguageToggle />
        </div>
      </footer>
    </div>
  );
}
