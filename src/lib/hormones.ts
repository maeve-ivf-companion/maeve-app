// Non-personalized reference material for the Monitoring page (PDF page 4).
// Deliberately generic: "statements of fact, not a recommendation," per the
// PDF's own note on the hormone flashcards. Nothing here is tailored to an
// individual user's protocol or history, matching docs/PDF-BUILD-PLAN.md's
// Phase 3 note that a personalized target needs clinical input Maeve can't
// invent.

export type HormoneKey =
  | "estradiol"
  | "lh"
  | "fsh"
  | "progesterone"
  | "hcg"
  | "amh";

export const HORMONE_KEYS: HormoneKey[] = [
  "estradiol",
  "lh",
  "fsh",
  "progesterone",
  "hcg",
  "amh",
];

/** A typical mid-stimulation reference band, shown only as "on track" vs
 * "worth a look" context, never as a personal target. */
export const HORMONE_REFERENCE: Record<
  HormoneKey,
  { low: number; high: number; unit: string }
> = {
  estradiol: { low: 500, high: 4000, unit: "pg/mL" },
  lh: { low: 1, high: 20, unit: "mIU/mL" },
  fsh: { low: 3, high: 20, unit: "mIU/mL" },
  progesterone: { low: 0.5, high: 1.5, unit: "ng/mL" },
  hcg: { low: 0, high: 5, unit: "mIU/mL" },
  amh: { low: 1, high: 4, unit: "ng/mL" },
};

// One accent color per hormone, reusing the same hue family as
// EVENT_TYPE_ACCENT so the app's data-viz palette stays coordinated rather
// than introducing new one-off colors.
export const HORMONE_COLOR: Record<HormoneKey, string> = {
  estradiol: "#c2185b",
  lh: "#5a6db5",
  fsh: "#e8923a",
  progesterone: "#7a4b9e",
  hcg: "#2f8f7a",
  amh: "#4caf50",
};

export function hormoneStatus(hormone: HormoneKey, value: number): "onTrack" | "watch" {
  const ref = HORMONE_REFERENCE[hormone];
  return value >= ref.low && value <= ref.high ? "onTrack" : "watch";
}

type HormoneFacts = { en: string; fr: string };

// Generic, factual, non-personalized. Framed as "here's what this hormone
// does" rather than "here's what your number means" per the PDF's note that
// these are "generic ... info not tailored to user."
export const HORMONE_FACTS: Record<HormoneKey, HormoneFacts> = {
  estradiol: {
    en: "Estradiol (E2) rises as follicles grow during stimulation. Many people notice bloating, breast tenderness, or mood shifts as it climbs, that's a normal response to more follicles developing, not a sign anything is wrong.",
    fr: "L'estradiol (E2) augmente à mesure que les follicules se développent pendant la stimulation. Plusieurs ressentent des ballonnements, une sensibilité mammaire ou des changements d'humeur en cours de route, c'est une réponse normale au développement des follicules, pas un signe que quelque chose ne va pas.",
  },
  lh: {
    en: "LH (luteinizing hormone) triggers ovulation. During stimulation it's usually suppressed by medication so the clinic can control exactly when eggs are released, a planned trigger shot causes the LH-like surge instead.",
    fr: "La LH (hormone lutéinisante) déclenche l'ovulation. Pendant la stimulation, elle est généralement supprimée par les médicaments pour que la clinique contrôle exactement le moment de la libération des ovocytes, une injection déclencheuse planifiée provoque plutôt la montée souhaitée.",
  },
  fsh: {
    en: "FSH (follicle-stimulating hormone) is what stimulation medications mimic, it's the signal that tells the ovaries to grow multiple follicles at once instead of the usual one per cycle.",
    fr: "La FSH (hormone folliculo-stimulante) est ce que les médicaments de stimulation imitent, c'est le signal qui indique aux ovaires de faire croître plusieurs follicules à la fois plutôt qu'un seul par cycle.",
  },
  progesterone: {
    en: "Progesterone rises after ovulation or retrieval to prepare the uterine lining. Feeling more tired or warm around this time is common and expected.",
    fr: "La progestérone augmente après l'ovulation ou la ponction pour préparer la muqueuse utérine. Se sentir plus fatiguée ou avoir plus chaud à ce moment est fréquent et attendu.",
  },
  hcg: {
    en: "hCG (beta) is either the trigger shot medication clearing your system, or, later, the hormone a pregnancy produces. Timing matters a lot for reading this number, which is why the clinic tells you exactly when to test.",
    fr: "L'hCG (beta) est soit le médicament de l'injection déclencheuse qui s'élimine de votre organisme, soit, plus tard, l'hormone produite par une grossesse. Le moment compte beaucoup pour interpréter ce chiffre, c'est pourquoi la clinique vous indique précisément quand faire le test.",
  },
  amh: {
    en: "AMH (anti-Müllerian hormone) reflects egg reserve and is usually measured once before a cycle starts rather than tracked day to day during stimulation.",
    fr: "L'AMH (hormone anti-müllérienne) reflète la réserve ovarienne et est habituellement mesurée une fois avant le début d'un cycle plutôt que suivie jour après jour pendant la stimulation.",
  },
};

// ---------------------------------------------------------------------------
// Standard protocol generator (sign-up page 2: "Maeve will automatically
// insert the retrieval and subsequent steps based on usual standard x/2
// weeks protocol. Then calendar loads and asks user to confirm/make edits.")
// These offsets are a common, simplified pattern, not a clinical protocol.
// The confirm/edit step this feeds into is exactly where a clinic's real
// dates should override them.
// ---------------------------------------------------------------------------

export type DraftEvent = {
  type: "injection" | "appointment" | "trigger" | "retrieval" | "transfer" | "bloodwork";
  title: string;
  scheduled_at: string; // ISO
};

const DAY_MS = 86400000;
const at = (base: Date, days: number, hour: number, minute = 0) => {
  const d = new Date(base.getTime() + days * DAY_MS);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
};

export function buildStandardProtocol(
  cycleStart: Date,
  medications: { name: string; times: string[] }[]
): DraftEvent[] {
  const events: DraftEvent[] = [];
  const STIM_DAYS = 10;
  const RETRIEVAL_DAY = 12;
  const TRANSFER_OFFSET = 5;
  const BLOODWORK_OFFSET = 14;

  events.push({ type: "appointment", title: "Baseline scan", scheduled_at: at(cycleStart, 2, 8, 30) });
  [2, 5, 8].forEach((day) => {
    events.push({
      type: "appointment",
      title: "Monitoring appointment",
      scheduled_at: at(cycleStart, day, 8, 30),
    });
  });

  for (let day = 0; day < STIM_DAYS; day++) {
    for (const med of medications) {
      const times = med.times.length > 0 ? med.times : ["20:00"];
      for (const time of times) {
        const [h, m] = time.split(":").map((n) => parseInt(n, 10) || 0);
        events.push({
          type: "injection",
          title: med.name,
          scheduled_at: at(cycleStart, day, h, m),
        });
      }
    }
  }

  events.push({ type: "trigger", title: "Trigger shot", scheduled_at: at(cycleStart, STIM_DAYS, 20, 0) });
  events.push({ type: "retrieval", title: "Egg retrieval", scheduled_at: at(cycleStart, RETRIEVAL_DAY, 8, 0) });
  const transferDate = new Date(at(cycleStart, RETRIEVAL_DAY + TRANSFER_OFFSET, 9, 0));
  events.push({ type: "transfer", title: "Transfer", scheduled_at: transferDate.toISOString() });
  events.push({
    type: "bloodwork",
    title: "Beta / two-week wait bloodwork",
    scheduled_at: at(transferDate, BLOODWORK_OFFSET, 8, 0),
  });

  return events.sort((a, b) => a.scheduled_at.localeCompare(b.scheduled_at));
}
