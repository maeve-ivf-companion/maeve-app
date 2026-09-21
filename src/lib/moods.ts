import type { Mood } from "@/lib/supabase/types";

// One source for the mood scale so the Home check-in, the post-appointment
// Feeling Ping, and the Support history all agree. 1 to 3 keep their original
// meaning (good / neutral / sad or tired); 4 and 5 add anger and anxiety,
// which read as "hard" days for the history and pattern detection.
export const MOOD_OPTIONS: { mood: Mood; emoji: string; dot: string; level: number }[] = [
  { mood: 1, emoji: "😊", dot: "bg-grow-500", level: 2 },
  { mood: 2, emoji: "😐", dot: "bg-berry-300", level: 1 },
  { mood: 3, emoji: "😔", dot: "bg-berry-500", level: 0 },
  { mood: 4, emoji: "😠", dot: "bg-berry-600", level: 0 },
  { mood: 5, emoji: "😰", dot: "bg-berry-400", level: 0 },
];

export const isHardMood = (mood: number) => mood >= 3;
