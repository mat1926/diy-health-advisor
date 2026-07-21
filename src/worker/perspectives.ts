/**
 * Educational plan lenses. User-facing copy never names individual clinicians.
 * Not medical advice. Not affiliated with CDC or any private practitioner.
 */

export type PerspectiveId =
  | "cdc"
  | "alternative"
  | "metabolic"
  | "fitness"
  | "food_first"
  | "functional"
  | "clean_living";

/** Map legacy form values to current IDs. */
const LEGACY: Record<string, PerspectiveId> = {
  blend: "alternative",
  berg: "metabolic",
  ekberg: "fitness",
  axe: "food_first",
  jockers: "functional",
  clark: "clean_living",
};

export const PERSPECTIVES: Record<
  PerspectiveId,
  {
    id: PerspectiveId;
    label: string;
    shortName: string;
    themes: string[];
    habitBank: string[];
  }
> = {
  cdc: {
    id: "cdc",
    label: "CDC-style recommended habits",
    shortName: "CDC-style",
    themes: [
      "150+ minutes moderate activity per week (or equivalent)",
      "Muscle-strengthening 2+ days per week",
      "Fruit and vegetable–forward eating pattern",
      "Limit added sugars, saturated fat, and excess sodium",
      "7+ hours of sleep for most adults",
      "Don’t smoke; limit alcohol if you drink",
    ],
    habitBank: [
      "Build toward 150 minutes of moderate activity this week (brisk walking counts).",
      "Add muscle-strengthening on 2 non-consecutive days.",
      "Fill half your plate with fruits and vegetables at most meals.",
      "Cut back on sugary drinks and highly processed snacks; watch sodium at packaged meals.",
      "Aim for at least 7 hours of sleep most nights.",
    ],
  },
  alternative: {
    id: "alternative",
    label: "Alternative doctors (blended themes)",
    shortName: "Alternative",
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
  metabolic: {
    id: "metabolic",
    label: "Alternative: metabolic / lower-carb leaning",
    shortName: "Alt · metabolic",
    themes: [
      "Gentle meal-timing windows when appropriate",
      "Lower refined carbs for some adults",
      "Electrolytes with lower-carb shifts",
      "Stress and recovery before aggressive diet experiments",
    ],
    habitBank: [
      "If experimenting with a shorter eating window, start gently (e.g. 12:12) and stop if you feel unwell.",
      "Prioritize electrolytes and leafy greens when cutting refined carbs — don’t crash calories overnight.",
      "Treat chronic stress and poor sleep as blockers before aggressive fasting.",
      "Favor protein and healthy fats over grazing on sugary snacks for steadier daytime energy.",
    ],
  },
  fitness: {
    id: "fitness",
    label: "Alternative: metabolic fitness",
    shortName: "Alt · fitness",
    themes: [
      "Insulin sensitivity via movement and meal composition",
      "Strength + easy aerobic conditioning",
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
  food_first: {
    id: "food_first",
    label: "Alternative: food-first / gut focus",
    shortName: "Alt · food-first",
    themes: [
      "Food-first habits and nutrient density",
      "Gut-friendly foods (fiber variety, fermented foods if tolerated)",
      "Kitchen staples you can prepare at home",
      "Reducing ultra-processed oils and sugar loads",
    ],
    habitBank: [
      "Cook one more meal at home this week using whole ingredients you recognize.",
      "Add a fermented food you tolerate (yogurt, kefir, sauerkraut) rather than chasing supplements first.",
      "Increase plant diversity across the week for gut-friendly fiber variety.",
      "Cut back on sugary drinks; replace with water, herbal tea, or mineral water.",
    ],
  },
  functional: {
    id: "functional",
    label: "Alternative: functional nutrition",
    shortName: "Alt · functional",
    themes: [
      "Blood-sugar stability and anti-inflammatory plates",
      "Optional gentle meal timing when recovered",
      "Gut support via food quality",
      "Stress reduction as a metabolic lever",
    ],
    habitBank: [
      "Build an anti-inflammatory plate: colorful plants, quality protein, olive oil or avocado.",
      "Keep fasting experiments optional and mild; break the fast with a protein-forward meal.",
      "Schedule a daily downshift (breathing, prayer, walk, or stretch) to lower stress load.",
      "Track how sleep and mood change for 7 days when you stabilize meal timing.",
    ],
  },
  clean_living: {
    id: "clean_living",
    label: "Alternative: clean living / DIY hygiene",
    shortName: "Alt · clean living",
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
      "Keep a short symptom/exposure log for clinician visits — never as a self-diagnosis checklist.",
    ],
  },
};

export const LENS_DISCLAIMER = `Guidance may follow a CDC-style habit framework or educational themes often discussed by alternative doctors and wellness educators, plus optional DIY self-tracking (including pH strips). VitalGauge is not affiliated with the CDC or any private clinician. These ideas can be debated; none of this is a diagnosis, prescription, or cure.`;

export const CDC_NOTE = `CDC-style targets here are educational summaries of common public-health habit guidance (activity, strength, produce, sleep, limiting added sugars/sodium). They are not a personal medical plan from the CDC.`;

export function resolvePerspective(id: unknown): PerspectiveId {
  const raw = String(id ?? "cdc");
  if (raw in PERSPECTIVES) return raw as PerspectiveId;
  if (raw in LEGACY) return LEGACY[raw];
  return "cdc";
}

export function pickHabits(id: PerspectiveId, count: number): string[] {
  const bank = PERSPECTIVES[id].habitBank;
  if (id === "alternative") {
    return [
      ...PERSPECTIVES.metabolic.habitBank.slice(0, 1),
      ...PERSPECTIVES.fitness.habitBank.slice(0, 1),
      ...PERSPECTIVES.food_first.habitBank.slice(0, 1),
      ...PERSPECTIVES.functional.habitBank.slice(0, 1),
      ...PERSPECTIVES.clean_living.habitBank.slice(0, 1),
    ].slice(0, count);
  }
  return bank.slice(0, count);
}
