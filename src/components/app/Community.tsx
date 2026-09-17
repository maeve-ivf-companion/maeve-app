"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useLanguage } from "@/lib/i18n/provider";
import { PageHeader } from "@/components/app/PageHeader";
import { Button, Card, Spinner, Textarea } from "@/components/ui";
import { COMMUNITY_TOPICS, topicForStage } from "@/lib/community";
import { deriveStages } from "@/lib/stages";
import { Chat } from "@/components/app/Chat";
import type {
  CommunityPost,
  CommunityReply,
  CommunityTopic,
  Profile,
  ScheduleEvent,
} from "@/lib/supabase/types";

export function Community() {
  const { t, lang } = useLanguage();
  const supabase = createClient();
  const [topic, setTopic] = useState<CommunityTopic | null>(null);
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [replies, setReplies] = useState<Record<string, CommunityReply[]>>({});
  const [draft, setDraft] = useState("");
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  const composeRef = useRef<HTMLTextAreaElement>(null);

  function selectTopic(key: CommunityTopic) {
    setTopic(key);
    // Jump straight to the compose box, per request: picking a topic should
    // feel like it opens straight to typing, not just switch a filter.
    setTimeout(() => {
      composeRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      composeRef.current?.focus();
    }, 50);
  }

  useEffect(() => {
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      let currentTopic: CommunityTopic = "questions";
      if (user) {
        const [{ data: prof }, { data: events }] = await Promise.all([
          supabase.from("profiles").select("*").eq("id", user.id).single(),
          supabase.from("schedule_events").select("*").eq("user_id", user.id),
        ]);
        const stages = deriveStages(prof as Profile, (events as ScheduleEvent[]) ?? []);
        const current = stages.find((s) => s.status === "current") ?? null;
        currentTopic = topicForStage(current?.key ?? null);
      }
      setTopic(currentTopic);
      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!topic) return;
    void loadPosts(topic);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [topic]);

  async function loadPosts(t: CommunityTopic) {
    setLoading(true);
    const { data } = await supabase
      .from("community_posts")
      .select("*")
      .eq("topic", t)
      .order("created_at", { ascending: false })
      .limit(30);
    const rows = (data as CommunityPost[]) ?? [];
    setPosts(rows);
    if (rows.length > 0) {
      const { data: replyRows } = await supabase
        .from("community_replies")
        .select("*")
        .in("post_id", rows.map((r) => r.id))
        .order("created_at", { ascending: true });
      const grouped: Record<string, CommunityReply[]> = {};
      (replyRows as CommunityReply[] | null)?.forEach((r) => {
        grouped[r.post_id] = [...(grouped[r.post_id] ?? []), r];
      });
      setReplies(grouped);
    } else {
      setReplies({});
    }
    setLoading(false);
  }

  async function post() {
    if (!draft.trim() || !topic) return;
    setPosting(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      await supabase.from("community_posts").insert({
        user_id: user.id,
        topic,
        body: draft.trim(),
      });
      setDraft("");
      await loadPosts(topic);
    }
    setPosting(false);
  }

  async function reply(postId: string) {
    const body = replyDrafts[postId]?.trim();
    if (!body) return;
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      await supabase.from("community_replies").insert({ post_id: postId, user_id: user.id, body });
      setReplyDrafts((d) => ({ ...d, [postId]: "" }));
      if (topic) await loadPosts(topic);
    }
  }

  return (
    <div>
      <PageHeader title={t.community.title} subtitle={t.community.subtitle} />

      <Card className="mb-6">
        <p className="text-sm text-muted">{t.community.intro}</p>
      </Card>

      <h2 className="mb-3 font-display text-lg text-white">{t.community.topicsSubtitle}</h2>
      <div className="grid grid-cols-2 gap-3">
        {COMMUNITY_TOPICS.map(({ key, emoji }) => (
          <button key={key} onClick={() => selectTopic(key)} className="text-left">
            <Card
              className={`flex flex-col items-center gap-2 py-5 text-center transition hover:border-berry-400 ${
                topic === key ? "border-berry-400 bg-blush-50" : ""
              }`}
            >
              <span className="text-3xl">{emoji}</span>
              <span className="text-sm font-medium text-white">{t.community.topics[key]}</span>
              {topic === key && (
                <span className="text-[10px] font-semibold uppercase tracking-wide text-berry-500">
                  {t.community.yourStageTopic}
                </span>
              )}
            </Card>
          </button>
        ))}
      </div>

      {topic && (
        <div className="mt-6">
          <Card className="space-y-3">
            <Textarea
              ref={composeRef}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder={t.community.composePlaceholder}
              className="min-h-[80px]"
            />
            <Button onClick={post} disabled={posting || !draft.trim()}>
              {posting && <Spinner />}
              {posting ? t.community.posting : t.community.post}
            </Button>
          </Card>

          {loading ? (
            <div className="flex justify-center py-8 text-muted">
              <Spinner />
            </div>
          ) : posts.length === 0 ? (
            <p className="mt-4 text-sm text-faint">{t.community.empty}</p>
          ) : (
            <div className="mt-4 space-y-3">
              {posts.map((p) => (
                <Card key={p.id} className="space-y-3">
                  <p className="text-xs font-medium text-berry-500">{t.community.anonymousMember}</p>
                  <p className="text-white">{p.body}</p>
                  <p className="text-xs text-faint">
                    {new Date(p.created_at).toLocaleDateString(lang, {
                      month: "short",
                      day: "numeric",
                    })}
                  </p>
                  {(replies[p.id] ?? []).length > 0 && (
                    <div className="space-y-2 border-t border-line pt-3">
                      <p className="text-xs font-medium text-muted">{t.community.replies}</p>
                      {replies[p.id].map((r) => (
                        <div key={r.id} className="rounded-lg bg-cream/60 p-2 text-sm text-white">
                          {r.body}
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="flex gap-2">
                    <input
                      value={replyDrafts[p.id] ?? ""}
                      onChange={(e) => setReplyDrafts((d) => ({ ...d, [p.id]: e.target.value }))}
                      placeholder={t.community.replyPlaceholder}
                      className="flex-1 rounded-xl border border-line bg-cream/60 px-3 py-2 text-sm"
                    />
                    <Button size="sm" variant="soft" onClick={() => reply(p.id)}>
                      {t.community.reply}
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      <Card className="mt-6 bg-blush-50">
        <p className="text-xs text-plum-700/70">{t.community.disclaimer}</p>
      </Card>

      {/* Ask Maeve — embedded and already open, not a link to click through to */}
      <div className="mt-6">
        <p className="font-display text-lg text-white">{t.community.askMaeveTitle}</p>
        <p className="mb-3 text-sm text-muted">{t.community.askMaeveBody}</p>
        <Chat compact />
      </div>

      <Link href="/app/portals">
        <Card className="mt-3 flex items-center justify-between gap-3 transition hover:border-berry-400">
          <div>
            <p className="font-medium text-white">{t.community.portalsTitle}</p>
            <p className="text-sm text-muted">{t.community.portalsBody}</p>
          </div>
          <span className="shrink-0 text-berry-500">→</span>
        </Card>
      </Link>
    </div>
  );
}
