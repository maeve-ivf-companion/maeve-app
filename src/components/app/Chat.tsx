"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useLanguage } from "@/lib/i18n/provider";
import { PageHeader } from "@/components/app/PageHeader";
import { Button, Card, Input, Spinner } from "@/components/ui";
import type { ChatMessage } from "@/lib/supabase/types";

export function Chat() {
  const { t, lang } = useLanguage();
  const supabase = createClient();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("chat_messages")
        .select("*")
        .order("created_at", { ascending: true })
        .limit(50);
      setMessages((data as ChatMessage[]) ?? []);
      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function send() {
    if (!draft.trim() || sending) return;
    const text = draft.trim();
    setDraft("");
    setMessages((m) => [
      ...m,
      { id: `local-${Date.now()}`, user_id: "", role: "user", body: text, created_at: new Date().toISOString() },
    ]);
    setSending(true);
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: text, lang }),
    });
    const data = await res.json();
    setSending(false);
    if (data.reply) {
      setMessages((m) => [
        ...m,
        { id: `local-${Date.now()}-r`, user_id: "", role: "assistant", body: data.reply, created_at: new Date().toISOString() },
      ]);
    }
  }

  return (
    <div>
      <PageHeader title={t.chat.title} subtitle={t.chat.subtitle} />

      <Card className="flex h-[60vh] flex-col">
        <div className="flex-1 space-y-3 overflow-y-auto pr-1">
          {loading ? (
            <div className="flex justify-center py-8 text-muted">
              <Spinner />
            </div>
          ) : messages.length === 0 ? (
            <p className="text-sm text-faint">{t.chat.empty}</p>
          ) : (
            messages.map((m) => (
              <div
                key={m.id}
                className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm ${
                  m.role === "user"
                    ? "ml-auto bg-brand-gradient text-white"
                    : "bg-blush-50 text-plum-700"
                }`}
              >
                {m.body}
              </div>
            ))
          )}
          {sending && (
            <div className="max-w-[85%] rounded-2xl bg-blush-50 px-4 py-2.5 text-sm text-plum-700">
              <Spinner />
            </div>
          )}
          <div ref={bottomRef} />
        </div>
        <div className="mt-3 flex gap-2 border-t border-line pt-3">
          <Input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send()}
            placeholder={t.chat.placeholder}
          />
          <Button onClick={send} disabled={sending || !draft.trim()}>
            {sending ? t.chat.sending : t.chat.send}
          </Button>
        </div>
      </Card>
      <p className="mt-3 text-xs text-faint">{t.common.notMedicalAdvice}</p>
    </div>
  );
}
