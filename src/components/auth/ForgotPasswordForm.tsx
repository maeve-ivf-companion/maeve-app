"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { useT } from "@/lib/i18n/provider";
import { Button, Input, Label, Spinner } from "@/components/ui";

export function ForgotPasswordForm() {
  const t = useT();

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ??
    (typeof window !== "undefined" ? window.location.origin : "");

  async function send(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!isSupabaseConfigured) {
      setError("Supabase isn't connected yet.");
      return;
    }
    if (!email) return;
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${siteUrl}/auth/callback?next=/reset-password`,
    });
    setLoading(false);
    if (error) {
      setError(t.auth.errorGeneric);
      return;
    }
    // Same generic confirmation regardless of whether the email has an
    // account, matching Supabase's own signup convention, so this form
    // can't be used to check which emails are registered.
    setSent(true);
  }

  if (sent) {
    return (
      <div className="space-y-6">
        <p className="text-sm text-grow-500">{t.auth.forgotPasswordSent}</p>
        <Link
          href="/login"
          className="text-sm font-semibold text-berry-500 hover:text-berry-600"
        >
          {t.auth.backToSignIn}
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={send} className="space-y-4">
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

      {error && <p className="text-sm text-berry-500">{error}</p>}

      <Button type="submit" size="lg" className="w-full" disabled={loading}>
        {loading && <Spinner />}
        {loading ? t.auth.forgotPasswordSending : t.auth.forgotPasswordSend}
      </Button>

      <p className="text-center text-sm text-muted">
        <Link
          href="/login"
          className="font-semibold text-berry-500 hover:text-berry-600"
        >
          {t.auth.backToSignIn}
        </Link>
      </p>
    </form>
  );
}
