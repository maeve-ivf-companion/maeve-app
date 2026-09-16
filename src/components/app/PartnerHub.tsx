"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useLanguage } from "@/lib/i18n/provider";
import { fmt } from "@/lib/i18n/format";
import { PageHeader } from "@/components/app/PageHeader";
import { PartnerBrief } from "@/components/app/PartnerBrief";
import { Button, Card, Input, Label, Modal, Spinner, Textarea } from "@/components/ui";
import type {
  ConnectionMode,
  MoodCheckin,
  PartnerNote,
  Profile,
  SharedItemKey,
  SharingLevel,
} from "@/lib/supabase/types";

const ITEM_KEYS: SharedItemKey[] = [
  "medTimes",
  "fridgeReminder",
  "cycleDay",
  "hormoneTrends",
  "moodToday",
];
const MINIMAL_DEFAULTS: SharedItemKey[] = ["medTimes", "fridgeReminder", "cycleDay"];
const MAXIMAL_DEFAULTS: SharedItemKey[] = ITEM_KEYS;

export function PartnerHub() {
  const { t } = useLanguage();
  const supabase = createClient();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [partnerName, setPartnerName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function load() {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    const { data: prof } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();
    setProfile(prof as Profile);
    if (prof?.paired_with) {
      const { data: partner } = await supabase
        .from("profiles")
        .select("display_name")
        .eq("id", prof.paired_with)
        .single();
      setPartnerName(partner?.display_name ?? "your partner");
    }
    setLoading(false);
  }

  if (loading)
    return (
      <div className="flex justify-center py-20 text-muted">
        <Spinner />
      </div>
    );

  return (
    <div>
      <PageHeader title={t.partner.title} subtitle={t.partner.supportSubtitle} />
      {profile?.role === "partner" ? (
        <PartnerSide profile={profile} partnerName={partnerName} onConnected={load} />
      ) : (
        <PatientSide profile={profile!} partnerName={partnerName} onChange={load} />
      )}
    </div>
  );
}

/* -------------------------------- Partner -------------------------------- */
function PartnerSide({
  profile,
  partnerName,
  onConnected,
}: {
  profile: Profile;
  partnerName: string | null;
  onConnected: () => void;
}) {
  const { t } = useLanguage();
  const supabase = createClient();
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function connect() {
    setError(null);
    setBusy(true);
    const { error } = await supabase.rpc("connect_with_code", {
      code: code.trim().toUpperCase(),
    });
    setBusy(false);
    if (error) setError(error.message);
    else onConnected();
  }

  if (!profile.paired_with) {
    return (
      <Card className="space-y-4">
        <p className="text-muted">{t.partner.partnerWaiting}</p>
        <div>
          <Label htmlFor="code">{t.partner.enterCode}</Label>
          <Input
            id="code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="MAEVE-XXXXX"
            className="uppercase tracking-widest"
          />
        </div>
        {error && <p className="text-sm text-berry-500">{error}</p>}
        <Button onClick={connect} disabled={busy || !code.trim()}>
          {busy && <Spinner />}
          {t.partner.connect}
        </Button>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <MoodHistory patientId={profile.paired_with} />
      <h2 className="font-display text-xl text-white">{t.partner.partnerViewTitle}</h2>
      <PartnerBrief role="partner" />
      {partnerName && (
        <p className="text-sm text-muted">{fmt(t.partner.connected, { name: partnerName })}</p>
      )}
      <PartnerNotes profile={profile} otherName={partnerName} />
    </div>
  );
}

/* -------------------------------- Patient -------------------------------- */
function PatientSide({
  profile,
  partnerName,
  onChange,
}: {
  profile: Profile;
  partnerName: string | null;
  onChange: () => void;
}) {
  const { t, lang } = useLanguage();
  const supabase = createClient();
  const [copied, setCopied] = useState(false);
  const [connectionMode, setConnectionMode] = useState<ConnectionMode>(profile.connection_mode);
  const [sharing, setSharing] = useState<SharingLevel>(profile.partner_sharing_level);
  const [sharedItems, setSharedItems] = useState<SharedItemKey[]>(
    profile.shared_items?.length ? profile.shared_items : MINIMAL_DEFAULTS
  );
  const [picker, setPicker] = useState<"minimal" | "maximal" | null>(null);
  const [pickerSelection, setPickerSelection] = useState<Set<SharedItemKey>>(new Set());
  const [mood, setMood] = useState(2);
  const [note, setNote] = useState("");
  const [sending, setSending] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);

  async function copyCode() {
    if (!profile.invite_code) return;
    await navigator.clipboard.writeText(profile.invite_code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  async function updateConnectionMode(m: ConnectionMode) {
    setConnectionMode(m);
    await supabase.from("profiles").update({ connection_mode: m }).eq("id", profile.id);
  }

  // Minimal maps to the existing "schedule" sharing level; Maximal maps to
  // "full". hormone_logs stays owner-only at every level (AGENTS.md rule 6),
  // so hormoneTrends only ever surfaces trend insights, never raw readings,
  // regardless of which items are individually toggled on.
  const isMaximal = sharing === "full";

  function openPicker(level: "minimal" | "maximal") {
    const isCurrentLevel = sharing === (level === "minimal" ? "schedule" : "full");
    const base = isCurrentLevel && sharedItems.length
      ? sharedItems
      : level === "minimal"
        ? MINIMAL_DEFAULTS
        : MAXIMAL_DEFAULTS;
    setPickerSelection(new Set(base));
    setPicker(level);
  }

  function toggleItem(key: SharedItemKey) {
    setPickerSelection((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  async function savePicker() {
    if (!picker) return;
    const level: SharingLevel = picker === "minimal" ? "schedule" : "full";
    const items = Array.from(pickerSelection);
    setSharing(level);
    setSharedItems(items);
    await supabase
      .from("profiles")
      .update({ partner_sharing_level: level, shared_items: items })
      .eq("id", profile.id);
    setPicker(null);
  }

  async function sendBrief() {
    setSending(true);
    setPreview(null);
    const res = await fetch("/api/nudge", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mood, note, lang }),
    });
    const data = await res.json();
    setSending(false);
    if (data.body) setPreview(data.body);
  }

  const moods = ["😟", "😔", "😐", "🙂", "✨"];

  return (
    <div className="space-y-6">
      {/* Mood tracking support comes first, per request */}
      <MoodHistory patientId={profile.id} />

      <Card className="space-y-2">
        <p className="font-display text-lg text-white">{t.partner.patientTitle}</p>
        <p className="text-sm text-muted">{t.partner.patientBody}</p>
      </Card>

      {/* Who are you connecting with? */}
      <Card className="space-y-3">
        <Label>{t.partner.connectionTitle}</Label>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => updateConnectionMode("partner")}
            className={`rounded-xl border px-3 py-2.5 text-sm font-medium transition ${
              connectionMode === "partner"
                ? "border-berry-400 bg-blush-100 text-berry-600"
                : "border-line text-white hover:border-berry-300"
            }`}
          >
            {t.partner.connectionPartnerOption}
            {partnerName ? ` (${partnerName})` : ""}
          </button>
          <button
            onClick={() => updateConnectionMode("mee")}
            className={`rounded-xl border px-3 py-2.5 text-sm font-medium transition ${
              connectionMode === "mee"
                ? "border-berry-400 bg-blush-100 text-berry-600"
                : "border-line text-white hover:border-berry-300"
            }`}
          >
            {t.partner.connectionMeeOption}
          </button>
        </div>
        {connectionMode === "mee" && (
          <p className="text-sm text-muted">{t.partner.connectionMeeHint}</p>
        )}
      </Card>

      {/* Invite code */}
      {connectionMode === "partner" && (
        <Card>
          <Label>{t.partner.yourCode}</Label>
          {profile.paired_with ? (
            <p className="text-grow-500">
              {partnerName ? fmt(t.partner.connected, { name: partnerName }) : t.dashboard.partnerConnected}
            </p>
          ) : (
            <>
              <div className="flex items-center gap-3">
                <code className="flex-1 rounded-xl bg-blush-100 px-4 py-3 text-center text-lg font-semibold tracking-widest text-berry-600">
                  {profile.invite_code ?? "…"}
                </code>
                <Button variant="soft" onClick={copyCode}>
                  {copied ? t.partner.copied : t.partner.copy}
                </Button>
              </div>
              <p className="mt-2 text-sm text-muted">{t.partner.codeHint}</p>
            </>
          )}
        </Card>
      )}

      {/* Minimal / Maximal share level — tap either to open a picker and
          customize exactly which items are included, rather than only
          choosing between two fixed presets. */}
      <Card className="space-y-3">
        <Label>{t.partner.shareLevelTitle}</Label>
        <p className="-mt-2 text-xs text-faint">{t.partner.shareLevelHint}</p>
        <div className="grid gap-3">
          <button
            onClick={() => openPicker("minimal")}
            className={`rounded-xl border p-4 text-left transition ${
              !isMaximal ? "border-berry-400 bg-berry-500/25" : "border-line hover:border-berry-300"
            }`}
          >
            <p className="font-semibold text-white">{t.partner.shareLevelMinimalTitle}</p>
            <ul className="mt-2 space-y-1 text-sm text-muted">
              {(!isMaximal && sharedItems.length ? sharedItems : MINIMAL_DEFAULTS).map((key) => (
                <li key={key}>• {t.partner.shareItems[key]}</li>
              ))}
            </ul>
          </button>
          <button
            onClick={() => openPicker("maximal")}
            className={`rounded-xl border p-4 text-left transition ${
              isMaximal ? "border-berry-400 bg-berry-500/25" : "border-line hover:border-berry-300"
            }`}
          >
            <p className="font-semibold text-white">{t.partner.shareLevelMaximalTitle}</p>
            <ul className="mt-2 space-y-1 text-sm text-muted">
              {(isMaximal && sharedItems.length ? sharedItems : MAXIMAL_DEFAULTS).map((key) => (
                <li key={key}>• {t.partner.shareItems[key]}</li>
              ))}
            </ul>
          </button>
        </div>
      </Card>

      <Modal
        open={picker !== null}
        onClose={() => setPicker(null)}
        title={t.partner.shareItemsPickerTitle}
      >
        <p className="mb-4 text-sm text-muted">{t.partner.shareItemsPickerHint}</p>
        <div className="space-y-2">
          {ITEM_KEYS.map((key) => {
            const checked = pickerSelection.has(key);
            return (
              <button
                key={key}
                onClick={() => toggleItem(key)}
                className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left transition ${
                  checked ? "border-berry-400 bg-berry-500/25" : "border-line hover:border-berry-300"
                }`}
              >
                <span
                  className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 text-xs ${
                    checked ? "border-berry-500 bg-berry-500 text-white" : "border-line text-transparent"
                  }`}
                >
                  ✓
                </span>
                <span className="text-sm text-white">{t.partner.shareItems[key]}</span>
              </button>
            );
          })}
        </div>
        <div className="mt-5 flex gap-2">
          <Button variant="outline" className="flex-1" onClick={() => setPicker(null)}>
            {t.common.cancel}
          </Button>
          <Button className="flex-1" onClick={savePicker}>
            {t.common.save}
          </Button>
        </div>
      </Modal>

      {/* Support checklist */}
      <SupportChecklist profile={profile} />

      {/* Notes for each other */}
      <PartnerNotes profile={profile} otherName={partnerName} />

      {/* Send a brief */}
      <Card className="space-y-4">
        <Label>{t.partner.nudgeGenerate}</Label>
        <div className="flex justify-between">
          {moods.map((m, i) => (
            <button
              key={i}
              onClick={() => setMood(i + 1)}
              className={`flex h-12 w-12 items-center justify-center rounded-full text-2xl transition ${
                mood === i + 1 ? "bg-blush-100 ring-2 ring-berry-400" : "opacity-60 hover:opacity-100"
              }`}
              aria-label={`mood ${i + 1}`}
            >
              {m}
            </button>
          ))}
        </div>
        <Textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder={t.portals.composePlaceholder}
          className="min-h-[80px]"
        />
        <Button onClick={sendBrief} disabled={sending || !profile.paired_with}>
          {sending && <Spinner />}
          {sending ? t.partner.nudgeGenerating : t.partner.nudgeGenerate}
        </Button>
        {!profile.paired_with && <p className="text-sm text-faint">{t.partner.codeHint}</p>}
        {preview && (
          <div className="rounded-xl bg-plum-50 p-4">
            <p className="text-sm text-plum-700/80">{t.partner.briefToday}</p>
            <p className="mt-1 font-display text-lg text-plum-700">“{preview}”</p>
          </div>
        )}
      </Card>
    </div>
  );
}

/* ---------------------------- Support checklist --------------------------- */
function SupportChecklist({ profile }: { profile: Profile }) {
  const { t, lang } = useLanguage();
  const supabase = createClient();
  const [next, setNext] = useState<{ title: string; scheduled_at: string } | null>(null);
  const [loading, setLoading] = useState(true);
  // Read the clock inside an effect, not during render, so this component
  // stays pure (react-hooks/purity): Date.now() is an impure call.
  const [nowMs, setNowMs] = useState<number | null>(null);

  useEffect(() => {
    setNowMs(Date.now());
    (async () => {
      const { data } = await supabase
        .from("schedule_events")
        .select("title, scheduled_at")
        .gte("scheduled_at", new Date().toISOString())
        .order("scheduled_at", { ascending: true })
        .limit(1);
      setNext(data?.[0] ?? null);
      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const dayOf =
    profile.cycle_start_date && nowMs !== null
      ? Math.max(1, Math.floor((nowMs - new Date(profile.cycle_start_date).getTime()) / 86400000) + 1)
      : null;

  return (
    <Card className="space-y-2">
      <p className="font-display text-lg text-white">{t.partner.checklistTitle}</p>
      {dayOf && <p className="text-sm text-white">{fmt(t.partner.checklistDayOf, { n: dayOf })}</p>}
      <p className="text-sm text-muted">{t.partner.checklistMedTimes}</p>
      <p className="text-sm text-muted">{t.partner.checklistFridgeReminder}</p>
      {loading ? (
        <Spinner />
      ) : next ? (
        <p className="text-sm text-muted">
          {t.partner.checklistNextAppt}: {next.title} ·{" "}
          {new Date(next.scheduled_at).toLocaleDateString(lang, { month: "short", day: "numeric" })}
        </p>
      ) : null}
    </Card>
  );
}

/* --------------------------- Historical mood data -------------------------- */
function MoodHistory({ patientId }: { patientId: string }) {
  const { t, lang } = useLanguage();
  const supabase = createClient();
  const [checkins, setCheckins] = useState<MoodCheckin[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("mood_checkins")
        .select("*")
        .eq("user_id", patientId)
        .order("created_at", { ascending: true })
        .limit(30);
      setCheckins((data as MoodCheckin[]) ?? []);
      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [patientId]);

  const hardCount = checkins.filter((c) => c.mood === 3).length;
  const hasPattern = checkins.length >= 4 && hardCount / checkins.length > 0.3;

  // A happy-face scale reads at a glance far better than plain color bars:
  // the face itself says "good/neutral/hard", and its height on the scale
  // reinforces it, instead of relying on someone parsing a bar's color.
  const MOOD_FACE: Record<number, string> = { 1: "😊", 2: "😐", 3: "😔" };
  const MOOD_COLOR: Record<number, string> = {
    1: "bg-grow-500",
    2: "bg-berry-300",
    3: "bg-berry-500",
  };

  return (
    <Card className="space-y-3">
      <div>
        <p className="font-display text-lg text-white">{t.partner.moodHistoryTitle}</p>
        <p className="text-xs text-faint">{t.partner.moodHistorySubtitle}</p>
      </div>
      {loading ? (
        <Spinner />
      ) : checkins.length === 0 ? (
        <p className="text-sm text-faint">{t.partner.moodHistoryEmpty}</p>
      ) : (
        <div className="flex h-24 items-end gap-1.5 overflow-x-auto pb-1">
          {checkins.map((c) => (
            <div
              key={c.id}
              title={new Date(c.created_at).toLocaleDateString(lang)}
              className="flex shrink-0 flex-col items-center gap-1"
              style={{ marginBottom: `${(3 - c.mood) * 16}px` }}
            >
              <span className="text-xl leading-none">{MOOD_FACE[c.mood]}</span>
              <span className={`h-1.5 w-1.5 rounded-full ${MOOD_COLOR[c.mood]}`} />
            </div>
          ))}
        </div>
      )}
      <div className="rounded-xl bg-cream/60 p-3">
        <p className="text-sm font-medium text-white">{t.partner.predictedHardTitle}</p>
        <p className="mt-1 text-sm text-muted">
          {hasPattern ? t.partner.predictedHardBody : t.partner.predictedHardEmpty}
        </p>
      </div>
    </Card>
  );
}

/* ------------------------------ Partner notes ------------------------------ */
function PartnerNotes({ profile, otherName }: { profile: Profile; otherName: string | null }) {
  const { t } = useLanguage();
  const supabase = createClient();
  const [notes, setNotes] = useState<PartnerNote[]>([]);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function load() {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase
      .from("partner_notes")
      .select("*")
      .or(`from_user_id.eq.${user.id},to_user_id.eq.${user.id}`)
      .order("created_at", { ascending: false })
      .limit(10);
    setNotes((data as PartnerNote[]) ?? []);
    setLoading(false);
  }

  async function send() {
    if (!draft.trim() || !profile.paired_with) return;
    setSending(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      await supabase.from("partner_notes").insert({
        from_user_id: user.id,
        to_user_id: profile.paired_with,
        body: draft.trim(),
      });
      setDraft("");
      await load();
    }
    setSending(false);
  }

  return (
    <Card className="space-y-3">
      <p className="font-display text-lg text-white">{t.partner.notesTitle}</p>
      {loading ? (
        <Spinner />
      ) : notes.length === 0 ? (
        <p className="text-sm text-faint">{t.partner.notesEmpty}</p>
      ) : (
        <div className="space-y-2">
          {notes.map((n) => (
            <div key={n.id} className="rounded-xl bg-blush-50 p-3 text-sm text-plum-700">
              {n.from_user_id !== n.to_user_id && (
                <span className="mr-1 font-medium">
                  {fmt(t.partner.notesFrom, { name: otherName ?? "" })}
                </span>
              )}
              {n.body}
            </div>
          ))}
        </div>
      )}
      {profile.paired_with && (
        <div className="flex gap-2">
          <Input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder={t.partner.notesPlaceholder}
            onKeyDown={(e) => e.key === "Enter" && send()}
          />
          <Button onClick={send} disabled={sending || !draft.trim()}>
            {t.partner.notesSend}
          </Button>
        </div>
      )}
    </Card>
  );
}
