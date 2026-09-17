"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useLanguage } from "@/lib/i18n/provider";
import { PageHeader } from "@/components/app/PageHeader";
import { Card, Spinner } from "@/components/ui";
import { fmt } from "@/lib/i18n/format";
import { deriveStages, type StageStatus } from "@/lib/stages";
import type { LearnVideo, Profile, ScheduleEvent } from "@/lib/supabase/types";

function StatusDot({ status }: { status: StageStatus }) {
  if (status === "complete")
    return (
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-plum-700 text-xs text-white">
        ✓
      </span>
    );
  if (status === "current")
    return (
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 border-berry-500 bg-berry-500">
        <span className="h-2 w-2 rounded-full bg-blush-100" />
      </span>
    );
  return <span className="h-6 w-6 shrink-0 rounded-full border-2 border-line bg-transparent" />;
}

export function Journey() {
  const { t, lang } = useLanguage();
  const supabase = createClient();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [events, setEvents] = useState<ScheduleEvent[]>([]);
  const [videos, setVideos] = useState<LearnVideo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }
      const [{ data: prof }, { data: ev }, { data: vids }] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", user.id).single(),
        supabase.from("schedule_events").select("*").eq("user_id", user.id),
        supabase
          .from("learn_videos")
          .select("*")
          .in("category", ["injections", "medications"])
          .order("sort_order", { ascending: true })
          .limit(4),
      ]);
      setProfile((prof as Profile) ?? null);
      setEvents((ev as ScheduleEvent[]) ?? []);
      setVideos((vids as LearnVideo[]) ?? []);
      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading)
    return (
      <div className="flex justify-center py-20 text-muted">
        <Spinner />
      </div>
    );

  const stages = deriveStages(profile, events);

  return (
    <div>
      <PageHeader title={t.journey.title} subtitle={t.journey.subtitle} />

      {/* Timeline */}
      <Card>
        <div className="mb-4 flex items-baseline justify-between">
          <h2 className="font-display text-lg text-white">
            {t.journey.timelineTitle}
          </h2>
          {profile?.cycle_start_date && (
            <p className="text-xs text-faint">
              {fmt(t.journey.startedOn, {
                date: new Date(profile.cycle_start_date).toLocaleDateString(lang, {
                  month: "long",
                  day: "numeric",
                }),
              })}
            </p>
          )}
        </div>

        {!profile?.cycle_start_date ? (
          <p className="text-sm text-faint">{t.journey.noCycle}</p>
        ) : (
          <ol className="space-y-0">
            {stages.map((stage, i) => (
              <li key={stage.key} className="relative flex gap-3 pb-5 last:pb-0">
                {i < stages.length - 1 && (
                  <span
                    className={`absolute left-3 top-6 h-full w-px ${
                      stage.status === "complete" ? "bg-plum-700" : "bg-line"
                    }`}
                  />
                )}
                <StatusDot status={stage.status} />
                <div
                  className={`min-w-0 flex-1 rounded-xl px-3 py-2 ${
                    stage.status === "current" ? "bg-berry-500/25" : ""
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <p
                      className={`font-medium ${
                        stage.status === "upcoming" ? "text-faint" : "text-white"
                      }`}
                    >
                      {t.journey.stages[stage.key]}
                    </p>
                    {stage.status !== "upcoming" && (
                      <span
                        className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                          stage.status === "current"
                            ? "bg-blush-100 text-berry-600"
                            : "bg-white/10 text-white"
                        }`}
                      >
                        {stage.status === "current"
                          ? t.journey.statusCurrent
                          : t.journey.statusComplete}
                      </span>
                    )}
                  </div>
                  {stage.detail && stage.status === "current" && (
                    <p className="text-sm text-muted">
                      {stage.detail.total
                        ? fmt(t.journey.dayOfStageTotal, {
                            n: stage.detail.day,
                            total: stage.detail.total,
                          })
                        : fmt(t.journey.dayOfStage, { n: stage.detail.day })}
                    </p>
                  )}
                </div>
              </li>
            ))}
          </ol>
        )}
      </Card>

      {/* How-to videos */}
      {videos.length > 0 && (
        <>
          <h2 className="mb-3 mt-8 font-display text-lg text-white">
            {t.journey.howToTitle}
          </h2>
          <div className="grid gap-3">
            {videos.map((v) => (
              <a key={v.id} href={v.url} target="_blank" rel="noopener noreferrer">
                <Card className="flex h-full items-start gap-3 transition hover:border-berry-400 hover:shadow-md">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blush-100 text-berry-500">
                    ▶
                  </span>
                  <div>
                    <p className="font-medium text-white">
                      {lang === "fr" ? v.title_fr : v.title_en}
                    </p>
                    {v.duration_min && (
                      <p className="mt-1 text-xs text-faint">
                        {v.duration_min} min · {t.learn.watch}
                      </p>
                    )}
                  </div>
                </Card>
              </a>
            ))}
          </div>
        </>
      )}

      {/* Self-care */}
      <h2 className="mb-3 mt-8 font-display text-lg text-white">
        {t.journey.selfCareTitle}
      </h2>
      <div className="grid gap-3">
        <Card className="flex flex-col gap-1">
          <span className="text-2xl">🧘</span>
          <p className="font-medium text-white">
            {t.journey.selfCare.meditationTitle}
          </p>
          <p className="text-sm text-muted">{t.journey.selfCare.meditationBody}</p>
        </Card>
        <Card className="flex flex-col gap-1">
          <span className="text-2xl">🤸</span>
          <p className="font-medium text-white">{t.journey.selfCare.yogaTitle}</p>
          <p className="text-sm text-muted">{t.journey.selfCare.yogaBody}</p>
        </Card>
        <Card className="flex flex-col gap-1">
          <span className="text-2xl">🥗</span>
          <p className="font-medium text-white">
            {t.journey.selfCare.nutritionTitle}
          </p>
          <p className="text-sm text-muted">{t.journey.selfCare.nutritionBody}</p>
        </Card>
      </div>

      <Link href="/app/learn">
        <Card className="mt-6 flex items-center justify-between gap-3 transition hover:border-berry-400">
          <p className="font-medium text-white">{t.journey.learnLink}</p>
          <span className="shrink-0 text-berry-500">→</span>
        </Card>
      </Link>
    </div>
  );
}
