/**
 * Educational DIY lenses inspired by themes commonly discussed by popular
 * alternative / functional wellness educators. Not affiliated with, endorsed by,
 * or speaking for these individuals. Not medical advice.
 */

export type PerspectiveId = "blend" | "berg" | "ekberg" | "axe" | "jockers" | "clark";

export const PERSPECTIVES: Record<
  PerspectiveId,
  {
    id: PerspectiveId;
    label: string;
    shortName: string;
    themes: string[];
    /** Safe DIY habit prompts (lifestyle only — no diagnoses, no protocols as cures). */
    habitBank: string[];
  }
> = {
  blend: {
    id: "blend",
    label: "Blend (all lenses)",
    shortName: "Blend",
    themes: [
      "Metabolic flexibility and blood-sugar steadiness",
      "Whole foods and gut-friendly meals",
      "Stress load, sleep, and recovery",
      "Hydration and mineral balance",
      "Clean living and DIY self-tracking",
    ],
    habitBank: [
      "Build meals around protein + non-starchy vegetables before sweets or refined carbs.",
      "Protect 7–9 hours of sleep opportunity; late caffeine and screens fight recovery.",
      "Walk after meals when possible to support steadier energy.",
      "Drink water through the day; add a pinch of quality salt if you sweat heavily (unless a clinician restricted sodium).",
    ],
  },
  berg: {
    id: "berg",
    label: "Berg-style (metabolic / keto-leaning)",
    shortName: "Berg-style",
    themes: [
      "Intermittent fasting windows when appropriate",
      "Lower refined carbs; ketosis-friendly patterns for some adults",
      "Electrolytes (sodium, potassium, magnesium) with low-carb shifts",
      "Stress and “adrenal” load as recovery priorities",
    ],
    habitBank: [
      "If experimenting with a shorter eating window, start gently (e.g. 12:12) and stop if you feel unwell.",
      "Prioritize electrolytes and leafy greens when cutting refined carbs — don’t crash calories overnight.",
      "Treat chronic stress and poor sleep as blockers before aggressive fasting.",
      "Favor protein and healthy fats over grazing on sugary snacks for steadier daytime energy.",
    ],
  },
  ekberg: {
    id: "ekberg",
    label: "Ekberg-style (metabolic fitness)",
    shortName: "Ekberg-style",
    themes: [
      "Insulin sensitivity via movement and meal composition",
      "Strength + zone-2 style conditioning",
      "Circadian rhythm and morning light",
      "Reducing ultra-processed foods",
    ],
    habitBank: [
      "Pair resistance training 2–3×/week with easy aerobic work most other days.",
      "Get outdoor morning light and keep a consistent wake time.",
      "Swap ultra-processed snacks for whole-food versions you can prepare at home.",
      "Use post-meal walks as a simple DIY tool for energy and metabolic fitness.",
    ],
  },
  axe: {
    id: "axe",
    label: "Axe-style (food as medicine / gut)",
    shortName: "Axe-style",
    themes: [
      "Food-first habits and nutrient density",
      "Gut-friendly foods (fiber variety, fermented foods if tolerated)",
      "Bone broth / collagen-style kitchen staples as comfort nutrition",
      "Reducing inflammatory ultra-processed oils and sugar loads",
    ],
    habitBank: [
      "Cook one more meal at home this week using whole ingredients you recognize.",
      "Add a fermented food you tolerate (yogurt, kefir, sauerkraut) rather than chasing supplements first.",
      "Increase plant diversity across the week for gut-friendly fiber variety.",
      "Cut back on sugary drinks; replace with water, herbal tea, or mineral water.",
    ],
  },
  jockers: {
    id: "jockers",
    label: "Jockers-style (functional nutrition)",
    shortName: "Jockers-style",
    themes: [
      "Blood-sugar stability and anti-inflammatory plates",
      "Intermittent fasting and autophagy-oriented timing (gently)",
      "Gut barrier support via food quality",
      "Stress reduction as a metabolic lever",
    ],
    habitBank: [
      "Build an anti-inflammatory plate: colorful plants, quality protein, olive oil or avocado.",
      "Keep fasting experiments optional and mild; break the fast with a protein-forward meal.",
      "Schedule a daily downshift (breathing, prayer, walk, or stretch) to lower stress load.",
      "Track how sleep and mood change for 7 days when you stabilize meal timing.",
    ],
  },
  clark: {
    id: "clark",
    label: "Clark-style (clean living / DIY hygiene)",
    shortName: "Clark-style",
    themes: [
      "Clean water and reduced household chemical burden",
      "Food cleanliness and careful sourcing",
      "Personal hygiene and environmental awareness",
      "Self-observation with DIY logs (not self-diagnosis)",
    ],
    habitBank: [
      "Review water quality at home; filtered water is a practical first DIY step for many households.",
      "Read labels on cleaners and personal-care products; swap one product for a simpler option.",
      "Wash produce thoroughly and prefer less-processed pantry staples.",
      "Keep a short symptom/exposure log for clinician visits — never as a parasite self-diagnosis.",
    ],
  },
};

export const LENS_DISCLAIMER = `Guidance is framed through educational DIY lenses inspired by themes often discussed by wellness educators such as Dr. Eric Berg, Dr. Sten Ekberg, Dr. Josh Axe, Dr. David Jockers, and historical clean-living writers such as Dr. Hulda Clark — plus DIY pH self-tracking ideas found in naturopathic stress-pattern kits. VitalGauge is not affiliated with these individuals or their companies. Their ideas are debated; none of this is a diagnosis, prescription, or cure.`;

export function resolvePerspective(id: unknown): PerspectiveId {
  const v = String(id ?? "blend");
  if (v in PERSPECTIVES) return v as PerspectiveId;
  return "blend";
}

export function pickHabits(id: PerspectiveId, count: number): string[] {
  const bank = PERSPECTIVES[id].habitBank;
  const blend = id === "blend"
    ? [
        ...PERSPECTIVES.berg.habitBank.slice(0, 1),
        ...PERSPECTIVES.ekberg.habitBank.slice(0, 1),
        ...PERSPECTIVES.axe.habitBank.slice(0, 1),
        ...PERSPECTIVES.jockers.habitBank.slice(0, 1),
        ...PERSPECTIVES.clark.habitBank.slice(0, 1),
      ]
    : bank;
  return (id === "blend" ? blend : bank).slice(0, count);
}
