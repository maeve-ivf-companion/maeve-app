"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { en } from "./en";
import { fr } from "./fr";
import type { Dictionary } from "./en";

export type Lang = "en" | "fr";

const dictionaries: Record<Lang, Dictionary> = { en, fr };

type LanguageContextValue = {
  lang: Lang;
  setLang: (lang: Lang) => void;
  toggle: () => void;
  t: Dictionary;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

const COOKIE = "maeve_lang";

function readInitial(): Lang {
  if (typeof document === "undefined") return "en";
  const fromCookie = document.cookie
    .split("; ")
    .find((c) => c.startsWith(`${COOKIE}=`))
    ?.split("=")[1];
  if (fromCookie === "fr" || fromCookie === "en") return fromCookie;
  const browser = navigator.language?.toLowerCase() ?? "en";
  return browser.startsWith("fr") ? "fr" : "en";
}

export function LanguageProvider({
  children,
  initialLang,
}: {
  children: React.ReactNode;
  initialLang?: Lang;
}) {
  const [lang, setLangState] = useState<Lang>(initialLang ?? "en");

  useEffect(() => {
    if (!initialLang) setLangState(readInitial());
  }, [initialLang]);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const setLang = (next: Lang) => {
    setLangState(next);
    document.cookie = `${COOKIE}=${next}; path=/; max-age=31536000; samesite=lax`;
  };

  const toggle = () => setLang(lang === "en" ? "fr" : "en");

  return (
    <LanguageContext.Provider
      value={{ lang, setLang, toggle, t: dictionaries[lang] }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within LanguageProvider");
  return ctx;
}

/** Convenience hook returning just the active dictionary. */
export function useT(): Dictionary {
  return useLanguage().t;
}
