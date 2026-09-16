"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useT } from "@/lib/i18n/provider";
import { Button, Label, PasswordInput, Spinner } from "@/components/ui";

// Reached only via the recovery link's /auth/callback?next=/reset-password
// redirect, which already exchanged the email link for a real (recovery)
// session, so all this needs to do is call updateUser with the new password.
export function ResetPasswordForm() {
  const t = useT();
  const router = useRouter();
  const supabase = createClient();

  const [checking, setChecking] = useState(true);
  const [hasSession, setHasSession] = useState(false);
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setHasSession(!!data.user);
      setChecking(false);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password.length < 6) {
      setError(t.auth.errorGeneric);
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) {
      setError(t.auth.errorGeneric);
      return;
    }
    router.push("/app");
    router.refresh();
  }

  if (checking) {
    return (
      <div className="flex justify-center py-10 text-muted">
        <Spinner />
      </div>
    );
  }

  if (!hasSession) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-berry-500">{t.auth.resetLinkInvalid}</p>
        <Link
          href="/forgot-password"
          className="text-sm font-semibold text-berry-500 hover:text-berry-600"
        >
          {t.auth.forgotPassword}
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={save} className="space-y-4">
      <div>
        <Label htmlFor="password">{t.auth.newPassword}</Label>
        <PasswordInput
          id="password"
          autoComplete="new-password"
          required
          minLength={6}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          showLabel={t.auth.showPassword}
          hideLabel={t.auth.hidePassword}
        />
      </div>

      {error && <p className="text-sm text-berry-500">{error}</p>}

      <Button type="submit" size="lg" className="w-full" disabled={loading}>
        {loading && <Spinner />}
        {loading ? t.auth.resetPasswordSaving : t.auth.resetPasswordSave}
      </Button>
    </form>
  );
}
