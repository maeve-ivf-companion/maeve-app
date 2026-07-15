"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useLanguage } from "@/lib/i18n/provider";
import { fmt } from "@/lib/i18n/format";
import { PageHeader } from "@/components/app/PageHeader";
import { PartnerBrief } from "@/components/app/PartnerBrief";
import { Button, Card, Input, Label, Select, Spinner, Textarea } from "@/components/ui";
import type { Profile, SharingLevel } from "@/lib/supabase/types";

export function PartnerHub() {
  const { t, lang } = useLanguage();
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
      <PageHeader title={t.partner.title} />
      {profile?.role === "partner" ? (
        <PartnerSide
          profile={profile}
          partnerName={partnerName}
          onConnected={load}
        />
      ) : (
        <PatientSide
          profile={profile!}
          partnerName={partnerName}
          onChange={load}
        />
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
      <h2 className="font-display text-xl text-plum-700">
        {t.partner.partnerViewTitle}
      </h2>
      <PartnerBrief role="partner" />
      {partnerName && (
        <p className="text-sm text-muted">
          {fmt(t.partner.connected, { name: partnerName })}
        </p>
      )}
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
  const [sharing, setSharing] = useState<SharingLevel>(
    profile.partner_sharing_level
  );
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

  async function updateSharing(level: SharingLevel) {
    setSharing(level);
    await supabase
      .from("profiles")
      .update({ partner_sharing_level: level })
      .eq("id", profile.id);
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
      <Card className="space-y-2">
        <p className="font-display text-lg text-plum-700">
          {t.partner.patientTitle}
        </p>
        <p className="text-sm text-muted">{t.partner.patientBody}</p>
      </Card>

      {/* Invite code */}
      <Card>
        <Label>{t.partner.yourCode}</Label>
        {profile.paired_with ? (
          <p className="text-grow-500">
            {partnerName
              ? fmt(t.partner.connected, { name: partnerName })
              : t.dashboard.partnerConnected}
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

      {/* Sharing level */}
      <Card>
        <Label>{t.partner.sharingTitle}</Label>
        <Select
          value={sharing}
          onChange={(e) => updateSharing(e.target.value as SharingLevel)}
        >
          <option value="insights">{t.partner.sharingNone}</option>
          <option value="mood">{t.partner.sharingMood}</option>
          <option value="schedule">{t.partner.sharingSchedule}</option>
          <option value="full">{t.partner.sharingFull}</option>
        </Select>
      </Card>

      {/* Send a brief */}
      <Card className="space-y-4">
        <Label>{t.partner.nudgeGenerate}</Label>
        <div className="flex justify-between">
          {moods.map((m, i) => (
            <button
              key={i}
              onClick={() => setMood(i + 1)}
              className={`flex h-12 w-12 items-center justify-center rounded-full text-2xl transition ${
                mood === i + 1
                  ? "bg-blush-100 ring-2 ring-berry-400"
                  : "opacity-60 hover:opacity-100"
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
        <Button
          onClick={sendBrief}
          disabled={sending || !profile.paired_with}
        >
          {sending && <Spinner />}
          {sending ? t.partner.nudgeGenerating : t.partner.nudgeGenerate}
        </Button>
        {!profile.paired_with && (
          <p className="text-sm text-faint">{t.partner.codeHint}</p>
        )}
        {preview && (
          <div className="rounded-xl bg-plum-50 p-4">
            <p className="text-sm text-muted">{t.partner.briefToday}</p>
            <p className="mt-1 font-display text-lg text-plum-700">
              “{preview}”
            </p>
          </div>
        )}
      </Card>
    </div>
  );
}
