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

type DraftMed = {
  name: string;
  /** Generic name first, brands after, so it's recognizable either way. */
  label: string;
  hormone: string;
  time: string;
  /** "" means "use the default for this medication" (see effectiveStart). */
  startDate: string;
  /** One-off dose such as a trigger shot, not a daily course. */
  single?: boolean;
  checked: boolean;
};

const PRESET_MEDS: DraftMed[] = [
  { name: "Gonal-F", label: "Follitropin alfa (Gonal-F)", hormone: "fsh", time: "20:00", startDate: "", checked: false },
  { name: "Menopur", label: "Menotropins (Menopur)", hormone: "fsh", time: "20:00", startDate: "", checked: false },
  { name: "Cetrotide", label: "Cetrorelix (Cetrotide)", hormone: "lh", time: "08:00", startDate: "", checked: false },
  { name: "Ovidrel (trigger)", label: "Choriogonadotropin alfa (Ovidrel), trigger", hormone: "hcg", time: "21:00", startDate: "", single: true, checked: false },
  { name: "HCG (trigger)", label: "HCG (Pregnyl, Novarel), trigger", hormone: "hcg", time: "21:00", startDate: "", single: true, checked: false },
  { name: "Progesterone support", label: "Progesterone (Prometrium, Crinone)", hormone: "progesterone", time: "21:00", startDate: "", checked: false },
  { name: "Estrogen support", label: "Estradiol (Estrace, Estradot)", hormone: "estradiol", time: "08:00", startDate: "", checked: false },
];

// Parse "YYYY-MM-DD" as a local date. new Date("2026-09-17") is UTC midnight,
// which lands on the previous day in any timezone behind UTC.
function localDate(dateOnly: string): Date {
  const [y, m, d] = dateOnly.split("-").map(Number);
  return new Date(y, m - 1, d);
}
function toDateOnly(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
function toLocalInput(iso: string): string {
  const d = new Date(iso);
  return `${toDateOnly(d)}T${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

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
  const [happyThings, setHappyThings] = useState<string[]>([]);
  const [meds, setMeds] = useState<DraftMed[]>(PRESET_MEDS);
  const [cycleStartDate, setCycleStartDate] = useState(
    () => toDateOnly(new Date())
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

  function effectiveStart(med: DraftMed): string {
    if (med.startDate) return med.startDate;
    const start = localDate(cycleStartDate);
    if (med.single) start.setDate(start.getDate() + 10);
    return toDateOnly(start);
  }

  function goToProtocol() {
    const checkedMeds = meds.filter((m) => m.checked);
    setDraftEvents(
      buildStandardProtocol(
        localDate(cycleStartDate),
        checkedMeds.map((m) => ({
          name: m.name,
          times: [m.time],
          startDate: effectiveStart(m),
          single: m.single,
        }))
      )
    );
    setStep("protocol");
  }

  function toggleHappyThing(key: string) {
    setHappyThings((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
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
          happy_things: happyThings,
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
              className="w-full rounded-2xl border border-line bg-white/5 p-5 text-left transition hover:border-berry-400 hover:bg-white/10"
            >
              <span className="font-display text-xl text-white">
                {t.onboarding.rolePatient}
              </span>
              <span className="mt-1 block text-sm text-muted">
                {t.onboarding.rolePatientHint}
              </span>
            </button>
            <button
              onClick={() => chooseRole("partner")}
              className="w-full rounded-2xl border border-line bg-white/5 p-5 text-left transition hover:border-berry-400 hover:bg-white/10"
            >
              <span className="font-display text-xl text-white">
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
                  <p className="font-semibold text-white">{title}</p>
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
                <span className="block font-medium text-white">{t.onboarding.notifLabel}</span>
                <span className="block text-sm text-muted">{t.onboarding.notifHint}</span>
              </span>
              <input
                type="checkbox"
                checked={notifOptIn}
                onChange={(e) => setNotifOptIn(e.target.checked)}
                className="h-5 w-5 accent-berry-500"
              />
            </label>

            <div className="grid gap-4">
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
                        : "border-line text-white hover:border-berry-300"
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
                    className="space-y-3 rounded-xl border border-line bg-cream/40 p-3"
                  >
                    <label className="flex cursor-pointer items-center gap-3">
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
                      <span className="flex-1 font-medium text-white">{med.label}</span>
                    </label>
                    {med.checked && (
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label>{t.onboarding.medicationStartLabel}</Label>
                          <Input
                            type="date"
                            value={effectiveStart(med)}
                            onChange={(e) => {
                              const next = [...meds];
                              next[i] = { ...med, startDate: e.target.value };
                              setMeds(next);
                            }}
                          />
                        </div>
                        <div>
                          <Label>{t.onboarding.medicationTimeLabel}</Label>
                          <Input
                            type="time"
                            value={med.time}
                            onChange={(e) => {
                              const next = [...meds];
                              next[i] = { ...med, time: e.target.value };
                              setMeds(next);
                            }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div>
              <Label>{t.onboarding.happyTitle}</Label>
              <p className="mb-3 text-sm text-muted">{t.onboarding.happyHint}</p>
              <div className="grid grid-cols-2 gap-2">
                {HAPPY_KEYS.map((key) => {
                  const selected = happyThings.includes(key);
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => toggleHappyThing(key)}
                      aria-pressed={selected}
                      className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-left text-sm transition ${
                        selected
                          ? "border-berry-400 bg-blush-100 text-berry-600"
                          : "border-line text-white hover:border-berry-300"
                      }`}
                    >
                      <span
                        className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                          selected ? "border-berry-500 bg-berry-500 text-white" : "border-line"
                        }`}
                      >
                        {selected && "✓"}
                      </span>
                      {t.onboarding.happyOptions[key]}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid gap-4">
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
            <ul className="max-h-96 space-y-2 overflow-y-auto">
              {draftEvents.map((e, i) => (
                <li
                  key={i}
                  className="space-y-2 rounded-xl border border-line bg-cream/40 p-3"
                >
                  <div className="flex items-center gap-2">
                    <Input
                      value={e.title}
                      onChange={(ev) =>
                        setDraftEvents((prev) =>
                          prev.map((d, j) => (j === i ? { ...d, title: ev.target.value } : d))
                        )
                      }
                      aria-label={t.schedule.eventTitle}
                    />
                    <button
                      type="button"
                      onClick={() => setDraftEvents((prev) => prev.filter((_, j) => j !== i))}
                      aria-label={t.common.delete}
                      className="shrink-0 rounded-lg px-2 py-1 text-faint transition hover:text-berry-400"
                    >
                      ✕
                    </button>
                  </div>
                  <Input
                    type="datetime-local"
                    value={toLocalInput(e.scheduled_at)}
                    onChange={(ev) => {
                      if (!ev.target.value) return;
                      const iso = new Date(ev.target.value).toISOString();
                      setDraftEvents((prev) =>
                        prev.map((d, j) => (j === i ? { ...d, scheduled_at: iso } : d))
                      );
                    }}
                    aria-label={t.schedule.when}
                  />
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
