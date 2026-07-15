"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useLanguage } from "@/lib/i18n/provider";
import { PageHeader } from "@/components/app/PageHeader";
import { LanguageToggle } from "@/components/LanguageToggle";
import { Button, Card, Input, Label, Spinner } from "@/components/ui";
import type { Profile } from "@/lib/supabase/types";

const DATA_TABLES = [
  "portal_posts",
  "hormone_logs",
  "schedule_events",
  "whatif_queries",
  "nudges",
] as const;

export function AccountManager() {
  const { t, lang, setLang } = useLanguage();
  const supabase = createClient();
  const router = useRouter();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(true);

  const [name, setName] = useState("");
  const [savingName, setSavingName] = useState(false);
  const [nameSaved, setNameSaved] = useState(false);

  const [newEmail, setNewEmail] = useState("");
  const [emailMsg, setEmailMsg] = useState<string | null>(null);
  const [emailBusy, setEmailBusy] = useState(false);

  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [pwMsg, setPwMsg] = useState<string | null>(null);
  const [pwErr, setPwErr] = useState<string | null>(null);
  const [pwBusy, setPwBusy] = useState(false);

  const [confirm, setConfirm] = useState("");
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      setEmail(user.email ?? "");
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();
      const p = data as Profile;
      setProfile(p);
      setName(p?.display_name ?? "");
      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function saveDetails() {
    if (!profile) return;
    setSavingName(true);
    setNameSaved(false);
    await supabase
      .from("profiles")
      .update({ display_name: name || null, language: lang })
      .eq("id", profile.id);
    setSavingName(false);
    setNameSaved(true);
    setTimeout(() => setNameSaved(false), 2000);
  }

  async function updateEmail() {
    if (!newEmail) return;
    setEmailBusy(true);
    setEmailMsg(null);
    const { error } = await supabase.auth.updateUser({ email: newEmail });
    setEmailBusy(false);
    setEmailMsg(error ? t.account.errorGeneric : t.account.emailUpdateSent);
    if (!error) setNewEmail("");
  }

  async function updatePassword() {
    setPwErr(null);
    setPwMsg(null);
    if (pw.length < 6) return setPwErr(t.account.passwordTooShort);
    if (pw !== pw2) return setPwErr(t.account.passwordMismatch);
    setPwBusy(true);
    const { error } = await supabase.auth.updateUser({ password: pw });
    setPwBusy(false);
    if (error) setPwErr(t.account.errorGeneric);
    else {
      setPwMsg(t.account.passwordUpdated);
      setPw("");
      setPw2("");
    }
  }

  async function downloadData() {
    if (!profile) return;
    const bundle: Record<string, unknown> = { profile, email };
    for (const table of DATA_TABLES) {
      const { data } = await supabase.from(table).select("*");
      bundle[table] = data ?? [];
    }
    const blob = new Blob([JSON.stringify(bundle, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "maeve-my-data.json";
    a.click();
    URL.revokeObjectURL(url);
  }

  async function deleteData() {
    if (!profile || confirm !== "DELETE") return;
    setDeleting(true);
    for (const table of DATA_TABLES) {
      await supabase.from(table).delete().eq("user_id", profile.id);
    }
    await supabase
      .from("profiles")
      .update({ paired_with: null, cycle_start_date: null })
      .eq("id", profile.id);
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  async function signOut() {
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  if (loading)
    return (
      <div className="flex justify-center py-20 text-muted">
        <Spinner />
      </div>
    );

  return (
    <div className="space-y-6">
      <PageHeader title={t.account.title} subtitle={t.account.subtitle} />

      {/* Details */}
      <Card className="space-y-4">
        <h2 className="font-display text-lg text-plum-700">
          {t.account.detailsTitle}
        </h2>
        <div>
          <Label htmlFor="name">{t.account.displayName}</Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div>
          <Label>{t.account.language}</Label>
          <LanguageToggle />
        </div>
        <div className="flex items-center gap-3">
          <Button onClick={saveDetails} disabled={savingName}>
            {savingName && <Spinner />}
            {t.account.save}
          </Button>
          {nameSaved && (
            <span className="text-sm text-grow-500">{t.account.saved}</span>
          )}
        </div>
      </Card>

      {/* Email */}
      <Card className="space-y-4">
        <h2 className="font-display text-lg text-plum-700">
          {t.account.emailTitle}
        </h2>
        <p className="text-sm text-muted">
          {t.account.currentEmail}:{" "}
          <span className="break-all font-medium text-plum-700">{email}</span>
        </p>
        <div>
          <Label htmlFor="newEmail">{t.account.newEmail}</Label>
          <Input
            id="newEmail"
            type="email"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
          />
        </div>
        {emailMsg && <p className="text-sm text-grow-500">{emailMsg}</p>}
        <Button
          variant="secondary"
          onClick={updateEmail}
          disabled={emailBusy || !newEmail}
        >
          {emailBusy && <Spinner />}
          {t.account.updateEmail}
        </Button>
      </Card>

      {/* Password */}
      <Card className="space-y-4">
        <h2 className="font-display text-lg text-plum-700">
          {t.account.passwordTitle}
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="pw">{t.account.newPassword}</Label>
            <Input
              id="pw"
              type="password"
              autoComplete="new-password"
              value={pw}
              onChange={(e) => setPw(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="pw2">{t.account.confirmPassword}</Label>
            <Input
              id="pw2"
              type="password"
              autoComplete="new-password"
              value={pw2}
              onChange={(e) => setPw2(e.target.value)}
            />
          </div>
        </div>
        {pwErr && <p className="text-sm text-berry-500">{pwErr}</p>}
        {pwMsg && <p className="text-sm text-grow-500">{pwMsg}</p>}
        <Button
          variant="secondary"
          onClick={updatePassword}
          disabled={pwBusy || !pw}
        >
          {pwBusy && <Spinner />}
          {t.account.updatePassword}
        </Button>
      </Card>

      {/* Privacy */}
      <Card className="space-y-4">
        <h2 className="font-display text-lg text-plum-700">
          {t.account.privacyTitle}
        </h2>
        <p className="text-sm text-muted">{t.account.privacyBody}</p>
        <Button variant="soft" onClick={downloadData}>
          {t.account.downloadData}
        </Button>
      </Card>

      {/* Sign out */}
      <Button variant="ghost" onClick={signOut} className="w-full">
        {t.account.signOut}
      </Button>

      {/* Danger zone */}
      <Card className="space-y-3 border-berry-300/60 bg-blush-50">
        <h2 className="font-display text-lg text-berry-600">
          {t.account.dangerTitle}
        </h2>
        <p className="text-sm text-muted">{t.account.dangerBody}</p>
        <p className="text-sm text-muted">{t.account.deleteConfirm}</p>
        <Input
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          placeholder="DELETE"
        />
        <Button
          onClick={deleteData}
          disabled={confirm !== "DELETE" || deleting}
          className="bg-berry-600 hover:bg-berry-600"
        >
          {deleting && <Spinner />}
          {t.account.deleteAccount}
        </Button>
      </Card>
    </div>
  );
}
