"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useLanguage } from "@/lib/i18n/provider";
import { Logo } from "@/components/Logo";
import { LanguageToggle } from "@/components/LanguageToggle";
import { Button, Card, Input, Label, Select, Spinner } from "@/components/ui";
import { buildStandardProtocol, type DraftEvent } from "@/lib/hormones";
import type { ProcedureType } from "@/lib/supabase/types";

type Role = "patient" | "partner";
type Step = "role" | "details" | "consent" | "intake" | "protocol" | "pair";

type DraftMed = { name: string; hormone: string; time: string; checked: boolean };

const PRESET_MEDS: DraftMed[] = [
  { name: "Gonal-F", hormone: "fsh", time: "20:00", checked: false },
  { name: "Menopur", hormone: "fsh", time: "20:00", checked: false },
  { name: "Cetrotide", hormone: "lh", time: "08:00", checked: false },
  { name: "Ovidrel (trigger)", hormone: "hcg", time: "21:00", checked: false },
  { name: "Progesterone support", hormone: "progesterone", time: "21:00", checked: false },
  { name: "Estrogen support", hormone: "estradiol", time: "08:00", checked: false },
];

const HAPPY_KEYS = [
  "quiet", "partnerTime", "outdoors", "journaling", "music",
  "reading", "comfortFood", "creative", "friends", "stillness",
] as const;

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

  // Intake (PDF page 2)
  const [username, setUsername] = useState("");
  const [procedureType, setProcedureType] = useState<ProcedureType>("ivf");
  const [notifOptIn, setNotifOptIn] = useState(true);
  const [age, setAge] = useState("");
  const [weight, setWeight] = useState("");
  const [cycleNumber, setCycleNumber] = useState(1);
  const [postalCode, setPostalCode] = useState("");
  const [durationWeeks, setDurationWeeks] = useState("");
  const [happyThing, setHappyThing] = useState<string | null>(null);
  const [meds, setMeds] = useState<DraftMed[]>(PRESET_MEDS);
  const [cycleStartDate, setCycleStartDate] = useState(
    () => new Date().toISOString().slice(0, 10)
  );
  const [draftEvents, setDraftEvents] = useState<DraftEvent[]>([]);

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

  async function acceptConsentAndContinue() {
    if (!agreed) {
      setError(t.onboarding.consentRequired);
      return;
    }
    setError(null);
    setStep("intake");
  }

  function goToProtocol() {
    const checkedMeds = meds.filter((m) => m.checked);
    setDraftEvents(
      buildStandardProtocol(
        new Date(cycleStartDate),
        checkedMeds.map((m) => ({ name: m.name, times: [m.time] }))
      )
    );
    setStep("protocol");
  }

  async function finishPatient() {
    setError(null);
    setLoading(true);
    try {
      const userId = await saveProfileBase();
      const checkedMeds = meds.filter((m) => m.checked);
      await supabase
        .from("profiles")
        .update({
          consent_core: true,
          consent_journey: true,
          consent_health: true,
          onboarded: true,
          cycle_start_date: cycleStartDate,
          age: age ? Number(age) : null,
          weight_kg: weight ? Number(weight) : null,
          postal_code: postalCode || null,
          procedure_type: procedureType,
          cycle_number: cycleNumber,
          procedure_duration_weeks: durationWeeks ? Number(durationWeeks) : null,
          notif_opt_in: notifOptIn,
          happy_thing: happyThing,
        })
        .eq("id", userId);
      await supabase.from("consents").insert([
        { user_id: userId, scope: "core", granted: true },
        { user_id: userId, scope: "journey", granted: true },
        { user_id: userId, scope: "health", granted: true },
      ]);
      if (checkedMeds.length > 0) {
        await supabase.from("medications").insert(
          checkedMeds.map((m) => ({
            user_id: userId,
            hormone: m.hormone,
            name: m.name,
            times: [m.time],
            reminder_minutes_before: 30,
          }))
        );
      }
      if (draftEvents.length > 0) {
        await supabase.from("schedule_events").insert(
          draftEvents.map((e) => ({
            user_id: userId,
            type: e.type,
            title: e.title,
            scheduled_at: e.scheduled_at,
          }))
        );
      }
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
              <Button onClick={acceptConsentAndContinue} disabled={loading}>
                {t.common.continue}
              </Button>
            </div>
          </Card>
        )}

        {step === "intake" && (
          <Card className="space-y-5 animate-rise">
            <h2 className="font-display text-2xl text-ink">{t.onboarding.intakeTitle}</h2>

            <div>
              <Label>{t.onboarding.usernameLabel}</Label>
              <Input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder={t.onboarding.usernamePlaceholder}
              />
            </div>

            <div>
              <Label>{t.onboarding.procedureLabel}</Label>
              <Select
                value={procedureType}
                onChange={(e) => setProcedureType(e.target.value as ProcedureType)}
              >
                {(Object.keys(t.onboarding.procedureTypes) as ProcedureType[]).map((key) => (
                  <option key={key} value={key}>
                    {t.onboarding.procedureTypes[key]}
                  </option>
                ))}
              </Select>
            </div>

            <label className="flex cursor-pointer items-center justify-between rounded-xl bg-cream/60 p-4">
              <span>
                <span className="block font-medium text-plum-700">{t.onboarding.notifLabel}</span>
                <span className="block text-sm text-muted">{t.onboarding.notifHint}</span>
              </span>
              <input
                type="checkbox"
                checked={notifOptIn}
                onChange={(e) => setNotifOptIn(e.target.checked)}
                className="h-5 w-5 accent-berry-500"
              />
            </label>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label>{t.onboarding.ageLabel}</Label>
                <Input type="number" inputMode="numeric" value={age} onChange={(e) => setAge(e.target.value)} />
              </div>
              <div>
                <Label>{t.onboarding.weightLabel}</Label>
                <Input type="number" inputMode="decimal" value={weight} onChange={(e) => setWeight(e.target.value)} />
              </div>
            </div>

            <div>
              <Label>{t.onboarding.cycleNumberLabel}</Label>
              <div className="flex gap-2">
                {[1, 2, 3, 4].map((n) => (
                  <button
                    key={n}
                    onClick={() => setCycleNumber(n)}
                    className={`flex-1 rounded-xl border px-3 py-2 text-sm font-medium transition ${
                      cycleNumber === n
                        ? "border-berry-400 bg-blush-100 text-berry-600"
                        : "border-line text-plum-700 hover:border-berry-300"
                    }`}
                  >
                    {n === 1
                      ? t.onboarding.cycleOptions.one
                      : n === 2
                        ? t.onboarding.cycleOptions.two
                        : n === 3
                          ? t.onboarding.cycleOptions.three
                          : t.onboarding.cycleOptions.fourPlus}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <Label>{t.onboarding.cycleStartLabel}</Label>
              <Input
                type="date"
                value={cycleStartDate}
                onChange={(e) => setCycleStartDate(e.target.value)}
              />
            </div>

            <div>
              <Label>{t.onboarding.medicationsTitle}</Label>
              <p className="mb-3 text-sm text-muted">{t.onboarding.medicationsHint}</p>
              <div className="space-y-2">
                {meds.map((med, i) => (
                  <div
                    key={med.name}
                    className="flex flex-wrap items-center gap-3 rounded-xl border border-line bg-cream/40 p-3"
                  >
                    <input
                      type="checkbox"
                      checked={med.checked}
                      onChange={(e) => {
                        const next = [...meds];
                        next[i] = { ...med, checked: e.target.checked };
                        setMeds(next);
                      }}
                      className="h-5 w-5 accent-berry-500"
                    />
                    <span className="flex-1 font-medium text-plum-700">{med.name}</span>
                    {med.checked && (
                      <Input
                        type="time"
                        value={med.time}
                        onChange={(e) => {
                          const next = [...meds];
                          next[i] = { ...med, time: e.target.value };
                          setMeds(next);
                        }}
                        className="w-32"
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div>
              <Label>{t.onboarding.happyTitle}</Label>
              <p className="mb-3 text-sm text-muted">{t.onboarding.happyHint}</p>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {HAPPY_KEYS.map((key) => (
                  <button
                    key={key}
                    onClick={() => setHappyThing(key)}
                    className={`rounded-xl border px-3 py-2 text-left text-sm transition ${
                      happyThing === key
                        ? "border-berry-400 bg-blush-100 text-berry-600"
                        : "border-line text-plum-700 hover:border-berry-300"
                    }`}
                  >
                    {t.onboarding.happyOptions[key]}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label>{t.onboarding.postalCodeLabel}</Label>
                <Input
                  value={postalCode}
                  onChange={(e) => setPostalCode(e.target.value)}
                  placeholder={t.onboarding.postalCodePlaceholder}
                />
              </div>
              <div>
                <Label>{t.onboarding.durationLabel}</Label>
                <Input
                  type="number"
                  inputMode="numeric"
                  value={durationWeeks}
                  onChange={(e) => setDurationWeeks(e.target.value)}
                />
              </div>
            </div>

            <div className="flex justify-between pt-1">
              <Button variant="ghost" onClick={() => setStep("consent")}>
                {t.common.back}
              </Button>
              <Button onClick={goToProtocol}>{t.common.continue}</Button>
            </div>
          </Card>
        )}

        {step === "protocol" && (
          <Card className="space-y-5 animate-rise">
            <div>
              <h2 className="font-display text-2xl text-ink">{t.onboarding.protocolTitle}</h2>
              <p className="mt-2 text-sm text-muted">{t.onboarding.protocolBody}</p>
            </div>
            <ul className="max-h-72 space-y-2 overflow-y-auto">
              {draftEvents.map((e, i) => (
                <li
                  key={i}
                  className="flex items-center justify-between rounded-xl border border-line bg-cream/40 px-3 py-2"
                >
                  <span className="text-sm font-medium text-plum-700">{e.title}</span>
                  <span className="text-xs text-faint">
                    {new Date(e.scheduled_at).toLocaleString(lang, {
                      month: "short",
                      day: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </span>
                </li>
              ))}
            </ul>
            {error && <p className="text-sm text-berry-500">{error}</p>}
            <div className="flex justify-between pt-1">
              <Button variant="ghost" onClick={() => setStep("intake")}>
                {t.common.back}
              </Button>
              <Button onClick={finishPatient} disabled={loading}>
                {loading && <Spinner />}
                {t.onboarding.protocolConfirm}
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
