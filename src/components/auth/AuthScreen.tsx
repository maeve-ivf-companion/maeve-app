"use client";

import { Suspense } from "react";
import { useT } from "@/lib/i18n/provider";
import { AuthShell } from "./AuthShell";
import { AuthForm } from "./AuthForm";

export function AuthScreen({ mode }: { mode: "signin" | "signup" }) {
  const t = useT();
  return (
    <AuthShell
      title={mode === "signup" ? t.auth.signUpTitle : t.auth.signInTitle}
      subtitle={mode === "signup" ? t.auth.signUpSubtitle : t.auth.signInSubtitle}
    >
      <Suspense>
        <AuthForm mode={mode} />
      </Suspense>
    </AuthShell>
  );
}
