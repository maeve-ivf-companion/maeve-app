"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { useT } from "@/lib/i18n/provider";
import { Button, Input, Label, Spinner } from "@/components/ui";

export function AuthForm({ mode }: { mode: "signin" | "signup" }) {
  const t = useT();
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") ?? "/app";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ??
    (typeof window !== "undefined" ? window.location.origin : "");

  async function handlePassword(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    if (!isSupabaseConfigured) {
      setError("Supabase isn't connected yet.");
      return;
    }
    setLoading(true);
    const supabase = createClient();
    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: `${siteUrl}/auth/callback?next=/onboarding` },
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
    setLoading(true);
    const supabase = createClient();
    const redirect = mode === "signup" ? "/onboarding" : next;
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${siteUrl}/auth/callback?next=${redirect}` },
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
          <Input
            id="password"
            type="password"
            autoComplete={mode === "signup" ? "new-password" : "current-password"}
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
          />
        </div>

        {error && <p className="text-sm text-berry-500">{error}</p>}
        {message && <p className="text-sm text-grow-500">{message}</p>}

        <Button type="submit" size="lg" className="w-full" disabled={loading}>
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
