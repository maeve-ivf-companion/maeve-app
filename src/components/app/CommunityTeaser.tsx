"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useLanguage } from "@/lib/i18n/provider";
import { Card, Spinner } from "@/components/ui";
import { topicLabel } from "@/lib/community";
import type { CommunityPost } from "@/lib/supabase/types";

// Home page widget (PDF page 3): "Bitch about it! -> shows latest community
// update from community page, click will take you there."
export function CommunityTeaser() {
  const { t } = useLanguage();
  const supabase = createClient();
  const [post, setPost] = useState<CommunityPost | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("community_posts")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(1);
      setPost((data?.[0] as CommunityPost) ?? null);
      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Link href="/app/community">
      <Card className="transition hover:border-berry-400 hover:shadow-md">
        <div className="flex items-center justify-between">
          <p className="font-display text-lg text-plum-700">
            {t.dashboard.communityTeaserTitle}
          </p>
          <span className="text-berry-500">→</span>
        </div>
        {loading ? (
          <div className="flex justify-center py-3 text-muted">
            <Spinner />
          </div>
        ) : !post ? (
          <p className="mt-2 text-sm text-faint">{t.dashboard.communityTeaserEmpty}</p>
        ) : (
          <div className="mt-2">
            <span className="text-xs font-medium uppercase tracking-wide text-berry-500">
              {topicLabel(t, post.topic)}
            </span>
            <p className="mt-1 line-clamp-2 text-sm text-muted">{post.body}</p>
          </div>
        )}
      </Card>
    </Link>
  );
}
