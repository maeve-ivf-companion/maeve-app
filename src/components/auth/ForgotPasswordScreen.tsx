"use client";

import { useT } from "@/lib/i18n/provider";
import { AuthShell } from "./AuthShell";
import { ForgotPasswordForm } from "./ForgotPasswordForm";

export function ForgotPasswordScreen() {
  const t = useT();
  return (
    <AuthShell
      title={t.auth.forgotPasswordTitle}
      subtitle={t.auth.forgotPasswordSubtitle}
    >
      <ForgotPasswordForm />
    </AuthShell>
  );
}
