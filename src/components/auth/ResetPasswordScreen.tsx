"use client";

import { useT } from "@/lib/i18n/provider";
import { AuthShell } from "./AuthShell";
import { ResetPasswordForm } from "./ResetPasswordForm";

export function ResetPasswordScreen() {
  const t = useT();
  return (
    <AuthShell
      title={t.auth.resetPasswordTitle}
      subtitle={t.auth.resetPasswordSubtitle}
    >
      <ResetPasswordForm />
    </AuthShell>
  );
}
