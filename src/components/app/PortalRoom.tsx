"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useLanguage } from "@/lib/i18n/provider";
import { PORTALS, portalLabel } from "@/lib/portals";
import { Button, Card, Spinner, Textarea } from "@/components/ui";
import type { Portal, PortalPost } from "@/lib/supabase/types";

export function PortalRoom({ portal }: { portal: Portal }) {
  const { t, lang } = useLanguage();
  const supabase = createClient();
  const meta = PORTALS.find((p) => p.key === portal)!;
  const label = portalLabel(t, portal);

  const [body, setBody] = useState("");
  const [community, setCommunity] = useState(false);
  const [posting, setPosting] = useState(false);
  const [mine, setMine] = useState<PortalPost[]>([]);
  const [feed, setFeed] = useState<PortalPost[]>([]);
  const [uid, setUid] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [portal]);

  async function load() {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    setUid(user?.id ?? null);
    const { data } = await supabase
      .from("portal_posts")
      .select("*")
      .eq("portal", portal)
      .order("created_at", { ascending: false })
      .limit(60);
    const rows = (data as PortalPost[]) ?? [];
    setMine(rows.filter((r) => r.user_id === user?.id));
    setFeed(rows.filter((r) => r.visibility === "community" && r.user_id !== user?.id));
    setLoading(false);
  }

  async function post() {
    if (!body.trim()) return;
    setPosting(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      await supabase.from("portal_posts").insert({
        user_id: user.id,
        portal,
        body: body.trim(),
        visibility: community ? "community" : "private",
      });
      setBody("");
      await load();
    }
    setPosting(false);
  }

  const fmtDate = (d: string) =>
    new Date(d).toLocaleDateString(lang, {
      month: "short",
      day: "numeric",
    });

  return (
    <div>
      <Link
        href="/app/portals"
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted hover:text-berry-500"
      >
        ← {t.portals.title}
      </Link>

      <div
        className="rounded-2xl p-6"
        style={{ backgroundColor: meta.tint }}
      >
        <span className="text-3xl">{meta.emoji}</span>
        <h1 className="mt-2 font-display text-3xl" style={{ color: meta.accent }}>
          {label.title}
        </h1>
        <p className="mt-1 text-plum-700/70">{label.desc}</p>
      </div>

      {/* Compose */}
      <Card className="mt-6 space-y-3">
        <label className="text-sm font-medium text-plum-700">
          {t.portals.composePrompt}
        </label>
        <Textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder={t.portals.composePlaceholder}
        />
        <div className="flex flex-wrap items-center justify-between gap-3">
          <label className="flex cursor-pointer items-center gap-2 text-sm text-muted">
            <input
              type="checkbox"
              checked={community}
              onChange={(e) => setCommunity(e.target.checked)}
              className="h-4 w-4 accent-berry-500"
            />
            {community ? t.portals.privacyCommunity : t.portals.privacyPrivate}
          </label>
          <Button onClick={post} disabled={posting || !body.trim()}>
            {posting && <Spinner />}
            {t.portals.post}
          </Button>
        </div>
      </Card>

      {loading ? (
        <div className="flex justify-center py-12 text-muted">
          <Spinner />
        </div>
      ) : (
        <div className="mt-8 grid gap-8 lg:grid-cols-2">
          <section>
            <h2 className="mb-3 font-display text-lg text-plum-700">
              {t.portals.yourEntries}
            </h2>
            <div className="space-y-3">
              {mine.length === 0 && (
                <p className="text-sm text-faint">{t.portals.empty}</p>
              )}
              {mine.map((p) => (
                <Entry key={p.id} post={p} date={fmtDate(p.created_at)} mine />
              ))}
            </div>
          </section>
          <section>
            <h2 className="mb-3 font-display text-lg text-plum-700">
              {t.portals.communityFeed}
            </h2>
            <div className="space-y-3">
              {feed.length === 0 && (
                <p className="text-sm text-faint">{t.portals.empty}</p>
              )}
              {feed.map((p) => (
                <Entry key={p.id} post={p} date={fmtDate(p.created_at)} />
              ))}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

function Entry({
  post,
  date,
  mine,
}: {
  post: PortalPost;
  date: string;
  mine?: boolean;
}) {
  return (
    <div className="rounded-xl border border-line bg-white p-4">
      <p className="whitespace-pre-wrap text-plum-700">{post.body}</p>
      <p className="mt-2 text-xs text-faint">
        {date}
        {mine && post.visibility === "community" ? " · 🌍" : ""}
      </p>
    </div>
  );
}
