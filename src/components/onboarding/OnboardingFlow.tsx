"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useLanguage } from "@/lib/i18n/provider";
import { Logo } from "@/components/Logo";
import { LanguageToggle } from "@/components/LanguageToggle";
import { Button, Card, Input, Label, Spinner } from "@/components/ui";

type Role = "patient" | "partner";
type Step = "role" | "details" | "consent" | "pair";

export function OnboardingFlow() {
  const { t, lang } = useLanguage();
  const router = useRouter();
  const supabase = createClient();

  const [step, setStep] = useState<Step>("role");
  const [role, setRole] = useState<Role | null>(null);
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function chooseRole(r: Role) {
    setRole(r);
    setStep("details");
  }

  async function saveProfileBase() {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("no user");
    const { error } = await supabase
      .from("profiles")
      .update({
        role,
        display_name: name || null,
        language: lang,
      })
      .eq("id", user.id);
    if (error) throw error;
    return user.id;
  }

  async function finishPatient() {
    if (!agreed) {
      setError(t.onboarding.consentRequired);
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const userId = await saveProfileBase();
      await supabase
        .from("profiles")
        .update({
          consent_core: true,
          consent_journey: true,
          consent_health: true,
          onboarded: true,
        })
        .eq("id", userId);
      await supabase.from("consents").insert([
        { user_id: userId, scope: "core", granted: true },
        { user_id: userId, scope: "journey", granted: true },
        { user_id: userId, scope: "health", granted: true },
      ]);
      router.push("/app");
      router.refresh();
    } catch {
      setError(t.auth.errorGeneric);
      setLoading(false);
    }
  }

  async function finishPartner() {
    setError(null);
    setLoading(true);
    try {
      const userId = await saveProfileBase();
      if (code.trim()) {
        const { error: rpcError } = await supabase.rpc("connect_with_code", {
          code: code.trim().toUpperCase(),
        });
        if (rpcError) {
          setError(rpcError.message);
          setLoading(false);
          return;
        }
      }
      await supabase
        .from("profiles")
        .update({ consent_core: true, onboarded: true })
        .eq("id", userId);
      await supabase
        .from("consents")
        .insert([{ user_id: userId, scope: "core", granted: true }]);
      router.push("/app");
      router.refresh();
    } catch {
      setError(t.auth.errorGeneric);
      setLoading(false);
    }
  }

  return (
    <div className="min-h-dvh bg-blush-gradient">
      <header className="flex items-center justify-between p-6">
        <Logo />
        <LanguageToggle />
      </header>

      <main className="mx-auto flex max-w-lg flex-col px-6 pb-20">
        <h1 className="mb-8 font-display text-3xl text-ink animate-rise">
          {t.onboarding.title}
        </h1>

        {step === "role" && (
          <div className="space-y-4 animate-rise">
            <p className="text-muted">{t.onboarding.roleQuestion}</p>
            <button
              onClick={() => chooseRole("patient")}
              className="w-full rounded-2xl border border-line bg-white p-5 text-left transition hover:border-berry-400 hover:shadow-md"
            >
              <span className="font-display text-xl text-plum-700">
                {t.onboarding.rolePatient}
              </span>
              <span className="mt-1 block text-sm text-muted">
                {t.onboarding.rolePatientHint}
              </span>
            </button>
            <button
              onClick={() => chooseRole("partner")}
              className="w-full rounded-2xl border border-line bg-white p-5 text-left transition hover:border-berry-400 hover:shadow-md"
            >
              <span className="font-display text-xl text-plum-700">
                {t.onboarding.rolePartner}
              </span>
              <span className="mt-1 block text-sm text-muted">
                {t.onboarding.rolePartnerHint}
              </span>
            </button>
          </div>
        )}

        {step === "details" && (
          <Card className="space-y-5 animate-rise">
            <div>
              <Label htmlFor="name">{t.onboarding.nameLabel}</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t.onboarding.namePlaceholder}
                autoFocus
              />
            </div>
            <div>
              <Label>{t.onboarding.languageLabel}</Label>
              <LanguageToggle />
            </div>
            <div className="flex justify-between pt-2">
              <Button variant="ghost" onClick={() => setStep("role")}>
                {t.common.back}
              </Button>
              <Button
                onClick={() => setStep(role === "partner" ? "pair" : "consent")}
                disabled={!name.trim()}
              >
                {t.common.continue}
              </Button>
            </div>
          </Card>
        )}

        {step === "consent" && (
          <Card className="space-y-5 animate-rise">
            <div>
              <h2 className="font-display text-2xl text-ink">
                {t.onboarding.consentTitle}
              </h2>
              <p className="mt-2 text-sm text-muted">
                {t.onboarding.consentIntro}
              </p>
            </div>
            <ul className="space-y-3">
              {[
                [t.onboarding.consentCore, t.onboarding.consentCoreDesc],
                [t.onboarding.consentJourney, t.onboarding.consentJourneyDesc],
                [t.onboarding.consentHealth, t.onboarding.consentHealthDesc],
              ].map(([title, desc]) => (
                <li
                  key={title}
                  className="rounded-xl border border-line bg-cream/60 p-4"
                >
                  <p className="font-semibold text-plum-700">{title}</p>
                  <p className="text-sm text-muted">{desc}</p>
                </li>
              ))}
            </ul>
            <label className="flex cursor-pointer items-start gap-3 rounded-xl bg-blush-100 p-4">
              <input
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                className="mt-1 h-5 w-5 accent-berry-500"
              />
              <span className="text-sm text-plum-700">
                {t.onboarding.consentAgree}
              </span>
            </label>
            {error && <p className="text-sm text-berry-500">{error}</p>}
            <div className="flex justify-between pt-1">
              <Button variant="ghost" onClick={() => setStep("details")}>
                {t.common.back}
              </Button>
              <Button onClick={finishPatient} disabled={loading}>
                {loading && <Spinner />}
                {t.onboarding.finish}
              </Button>
            </div>
          </Card>
        )}

        {step === "pair" && (
          <Card className="space-y-5 animate-rise">
            <div>
              <h2 className="font-display text-2xl text-ink">
                {t.onboarding.welcomePartnerTitle}
              </h2>
              <p className="mt-2 text-sm text-muted">
                {t.onboarding.welcomePartnerBody}
              </p>
            </div>
            <div>
              <Label htmlFor="code">{t.onboarding.inviteCodeLabel}</Label>
              <Input
                id="code"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="MAEVE-XXXXX"
                className="uppercase tracking-widest"
              />
            </div>
            {error && <p className="text-sm text-berry-500">{error}</p>}
            <div className="flex justify-between pt-1">
              <Button variant="ghost" onClick={() => setStep("details")}>
                {t.common.back}
              </Button>
              <Button onClick={finishPartner} disabled={loading}>
                {loading && <Spinner />}
                {t.onboarding.finish}
              </Button>
            </div>
          </Card>
        )}
      </main>
    </div>
  );
}
