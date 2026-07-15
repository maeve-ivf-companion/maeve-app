"use client";

import Link from "next/link";
import { useLanguage } from "@/lib/i18n/provider";
import { PORTALS, portalLabel } from "@/lib/portals";
import { PageHeader } from "@/components/app/PageHeader";

export function PortalsGrid() {
  const { t } = useLanguage();
  return (
    <div>
      <PageHeader title={t.portals.title} subtitle={t.portals.subtitle} />
      <div className="flex flex-col gap-4">
        {PORTALS.map((p) => {
          const label = portalLabel(t, p.key);
          return (
            <Link key={p.key} href={`/app/portals/${p.key}`}>
              <div
                className="group flex items-center gap-4 rounded-2xl border border-line p-5 transition hover:-translate-y-0.5 hover:shadow-lg"
                style={{ backgroundColor: p.tint }}
              >
                <span className="text-4xl">{p.emoji}</span>
                <div className="min-w-0">
                  <h2
                    className="font-display text-2xl"
                    style={{ color: p.accent }}
                  >
                    {label.title}
                  </h2>
                  <p className="mt-0.5 text-sm text-plum-700/70">{label.desc}</p>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
