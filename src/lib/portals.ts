import type { Portal } from "@/lib/supabase/types";
import type { Dictionary } from "@/lib/i18n/en";

export const PORTALS: {
  key: Portal;
  emoji: string;
  accent: string;
  tint: string;
}[] = [
  { key: "vent", emoji: "🔥", accent: "#c2185b", tint: "#fce4ec" },
  // "laugh" now also covers what used to be the separate Humour portal.
  { key: "laugh", emoji: "😂", accent: "#e8923a", tint: "#fdf0e2" },
  { key: "cry", emoji: "🌧️", accent: "#5a6db5", tint: "#e8ecf8" },
];

export function portalLabel(t: Dictionary, key: Portal) {
  return {
    vent: { title: t.portals.vent, desc: t.portals.ventDesc },
    cry: { title: t.portals.cry, desc: t.portals.cryDesc },
    laugh: { title: t.portals.laugh, desc: t.portals.laughDesc },
    humour: { title: t.portals.humour, desc: t.portals.humourDesc },
  }[key];
}

export const isPortal = (v: string): v is Portal =>
  ["vent", "cry", "laugh", "humour"].includes(v);
