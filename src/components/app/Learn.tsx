"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useLanguage } from "@/lib/i18n/provider";
import { PageHeader } from "@/components/app/PageHeader";
import { Button, Card, Spinner, Textarea } from "@/components/ui";
import type { LearnVideo, VideoCategory } from "@/lib/supabase/types";

const CATEGORIES: VideoCategory[] = [
  "injections",
  "medications",
  "procedures",
  "emotional",
];

export function Learn() {
  const { t, lang } = useLanguage();
  const supabase = createClient();
  const [videos, setVideos] = useState<LearnVideo[]>([]);
  const [loading, setLoading] = useState(true);

  const [question, setQuestion] = useState("");
  const [asking, setAsking] = useState(false);
  const [answer, setAnswer] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("learn_videos")
        .select("*")
        .order("sort_order", { ascending: true });
      setVideos((data as LearnVideo[]) ?? []);
      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function ask() {
    if (!question.trim()) return;
    setAsking(true);
    setAnswer(null);
    const res = await fetch("/api/whatif", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question, lang }),
    });
    const data = await res.json();
    setAsking(false);
    if (data.answer) setAnswer(data.answer);
  }

  return (
    <div>
      <PageHeader title={t.learn.title} subtitle={t.learn.subtitle} />

      {/* What-if AI */}
      <Card className="space-y-3">
        <div>
          <h2 className="font-display text-xl text-plum-700">
            {t.learn.whatIfTitle}
          </h2>
          <p className="text-sm text-muted">{t.learn.whatIfSubtitle}</p>
        </div>
        <Textarea
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder={t.learn.whatIfPlaceholder}
          className="min-h-[80px]"
        />
        <div className="flex justify-end">
          <Button onClick={ask} disabled={asking || !question.trim()}>
            {asking && <Spinner />}
            {asking ? t.learn.whatIfAsking : t.learn.whatIfAsk}
          </Button>
        </div>
        {answer && (
          <div className="rounded-xl bg-plum-50 p-4">
            <p className="text-sm text-plum-700">{answer}</p>
            <p className="mt-3 text-xs text-faint">
              {t.common.notMedicalAdvice}
            </p>
          </div>
        )}
      </Card>

      {/* Video library */}
      <h2 className="mb-4 mt-8 font-display text-xl text-plum-700">
        {t.learn.videosTitle}
      </h2>
      {loading ? (
        <div className="flex justify-center py-10 text-muted">
          <Spinner />
        </div>
      ) : (
        <div className="space-y-8">
          {CATEGORIES.map((cat) => {
            const items = videos.filter((v) => v.category === cat);
            if (items.length === 0) return null;
            return (
              <section key={cat}>
                <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-faint">
                  {t.learn.categories[cat]}
                </h3>
                <div className="grid gap-3 sm:grid-cols-2">
                  {items.map((v) => (
                    <a
                      key={v.id}
                      href={v.url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Card className="flex h-full items-start gap-3 transition hover:border-berry-400 hover:shadow-md">
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blush-100 text-berry-500">
                          ▶
                        </span>
                        <div>
                          <p className="font-medium text-plum-700">
                            {lang === "fr" ? v.title_fr : v.title_en}
                          </p>
                          <p className="text-sm text-muted">
                            {lang === "fr"
                              ? v.description_fr
                              : v.description_en}
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
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
