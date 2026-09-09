"use client";

import { useLanguage } from "@/lib/i18n/provider";

export function LanguageToggle({
  className = "",
  light = true,
}: {
  className?: string;
  light?: boolean;
}) {
  const { lang, setLang } = useLanguage();
  return (
    <div
      className={`inline-flex items-center rounded-full border p-0.5 text-sm font-medium backdrop-blur ${
        light ? "border-white/25 bg-white/10" : "border-plum-100 bg-white/70"
      } ${className}`}
      role="group"
      aria-label="Language"
    >
      <button
        type="button"
        onClick={() => setLang("en")}
        aria-pressed={lang === "en"}
        className={`rounded-full px-3 py-1 transition ${
          lang === "en"
            ? light
              ? "bg-white text-plum-700 shadow-sm"
              : "bg-plum-700 text-white shadow-sm"
            : light
              ? "text-white/70 hover:text-white"
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
            ? light
              ? "bg-white text-plum-700 shadow-sm"
              : "bg-plum-700 text-white shadow-sm"
            : light
              ? "text-white/70 hover:text-white"
              : "text-muted hover:text-plum-700"
        }`}
      >
        FR
      </button>
    </div>
  );
}
