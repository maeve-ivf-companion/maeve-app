"use client";

import { useLanguage } from "@/lib/i18n/provider";

export function LanguageToggle({ className = "" }: { className?: string }) {
  const { lang, setLang } = useLanguage();
  return (
    <div
      className={`inline-flex items-center rounded-full border border-plum-100 bg-white/70 p-0.5 text-sm font-medium backdrop-blur ${className}`}
      role="group"
      aria-label="Language"
    >
      <button
        type="button"
        onClick={() => setLang("en")}
        aria-pressed={lang === "en"}
        className={`rounded-full px-3 py-1 transition ${
          lang === "en"
            ? "bg-plum-700 text-white shadow-sm"
            : "text-muted hover:text-plum-700"
        }`}
      >
        EN
      </button>
      <button
        type="button"
        onClick={() => setLang("fr")}
        aria-pressed={lang === "fr"}
        className={`rounded-full px-3 py-1 transition ${
          lang === "fr"
            ? "bg-plum-700 text-white shadow-sm"
            : "text-muted hover:text-plum-700"
        }`}
      >
        FR
      </button>
    </div>
  );
}
