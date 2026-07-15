"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { useT } from "@/lib/i18n/provider";
import { Button, Input, Label, PasswordInput, Spinner } from "@/components/ui";

export function AuthForm({ mode }: { mode: "signin" | "signup" }) {
  const t = useT();
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") ?? "/app";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);
  // CASL: express consent must be an opt-in. Never default this to true.
  const [marketingOptIn, setMarketingOptIn] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ??
    (typeof window !== "undefined" ? window.location.origin : "");

  // Consent rides along in signUp's options.data, which Supabase stores on
  // auth.users.raw_user_meta_data. The handle_new_user trigger reads it and
  // writes the profile columns and the consents audit rows. It has to work this
  // way: with email confirmation on there is no session at signup, so the client
  // cannot insert into `consents` itself (RLS, auth.uid() is null).
  const signupMeta = {
    terms_accepted: true,
    marketing_opt_in: marketingOptIn,
  };

  /** Returns false and shows an error if signup consent is missing. */
  function consentBlocked() {
    if (mode === "signup" && !termsAccepted) {
      setError(t.auth.termsRequired);
      return true;
    }
    return false;
  }

  async function handlePassword(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    if (!isSupabaseConfigured) {
      setError("Supabase isn't connected yet.");
      return;
    }
    if (consentBlocked()) return;
    setLoading(true);
    const supabase = createClient();
    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${siteUrl}/auth/callback?next=/onboarding`,
            data: signupMeta,
          },
        });
        if (error) throw error;
        if (data.session) {
          router.push("/onboarding");
          router.refresh();
        } else {
          setMessage(t.auth.checkEmail);
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        router.push(next);
        router.refresh();
      }
    } catch {
      setError(t.auth.errorGeneric);
    } finally {
      setLoading(false);
    }
  }

  async function handleMagicLink() {
    setError(null);
    setMessage(null);
    if (!isSupabaseConfigured) {
      setError("Supabase isn't connected yet.");
      return;
    }
    if (!email) {
      setError(t.auth.errorGeneric);
      return;
    }
    if (consentBlocked()) return;
    setLoading(true);
    const supabase = createClient();
    const redirect = mode === "signup" ? "/onboarding" : next;
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${siteUrl}/auth/callback?next=${redirect}`,
        // Magic link creates the user too, so consent must ride along here as
        // well, or a magic-link signup would land with no consent recorded.
        ...(mode === "signup" ? { data: signupMeta } : {}),
      },
    });
    setLoading(false);
    if (error) setError(t.auth.errorGeneric);
    else setMessage(t.auth.magicLinkSent);
  }

  return (
    <div>
      <form onSubmit={handlePassword} className="space-y-4">
        <div>
          <Label htmlFor="email">{t.auth.email}</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@email.com"
          />
        </div>
        <div>
          <Label htmlFor="password">{t.auth.password}</Label>
          <PasswordInput
            id="password"
            autoComplete={mode === "signup" ? "new-password" : "current-password"}
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            showLabel={t.auth.showPassword}
            hideLabel={t.auth.hidePassword}
          />
        </div>

        {mode === "signup" && (
          <div className="space-y-3 pt-1">
            <label className="flex cursor-pointer items-start gap-3">
              <input
                type="checkbox"
                required
                checked={termsAccepted}
                onChange={(e) => setTermsAccepted(e.target.checked)}
                className="mt-0.5 h-5 w-5 shrink-0 accent-berry-500"
              />
              <span className="text-sm text-plum-700">
                {t.auth.termsPrefix}{" "}
                <Link
                  href="/terms"
                  target="_blank"
                  className="font-semibold text-berry-500 underline hover:text-berry-600"
                >
                  {t.auth.termsLink}
                </Link>{" "}
                {t.auth.termsAnd}{" "}
                <Link
                  href="/privacy"
                  target="_blank"
                  className="font-semibold text-berry-500 underline hover:text-berry-600"
                >
                  {t.auth.privacyLink}
                </Link>
                .
              </span>
            </label>

            <label className="flex cursor-pointer items-start gap-3">
              <input
                type="checkbox"
                checked={marketingOptIn}
                onChange={(e) => setMarketingOptIn(e.target.checked)}
                className="mt-0.5 h-5 w-5 shrink-0 accent-berry-500"
              />
              <span className="text-sm text-muted">
                {t.auth.marketingLabel}{" "}
                <span className="text-faint">{t.auth.marketingHint}</span>
              </span>
            </label>
          </div>
        )}

        {error && <p className="text-sm text-berry-500">{error}</p>}
        {message && <p className="text-sm text-grow-500">{message}</p>}

        <Button
          type="submit"
          size="lg"
          className="w-full"
          disabled={loading || (mode === "signup" && !termsAccepted)}
        >
          {loading && <Spinner />}
          {mode === "signup" ? t.auth.signUp : t.auth.signIn}
        </Button>
      </form>

      <div className="my-5 flex items-center gap-3 text-xs text-faint">
        <span className="h-px flex-1 bg-line" />
        {t.auth.orContinue}
        <span className="h-px flex-1 bg-line" />
      </div>

      <Button
        type="button"
        variant="soft"
        size="lg"
        className="w-full"
        onClick={handleMagicLink}
        disabled={loading}
      >
        {t.auth.magicLink}
      </Button>

      <p className="mt-6 text-center text-sm text-muted">
        {mode === "signup" ? t.auth.hasAccount : t.auth.noAccount}{" "}
        <Link
          href={mode === "signup" ? "/login" : "/signup"}
          className="font-semibold text-berry-500 hover:text-berry-600"
        >
          {mode === "signup" ? t.auth.signIn : t.auth.signUp}
        </Link>
      </p>
    </div>
  );
}
