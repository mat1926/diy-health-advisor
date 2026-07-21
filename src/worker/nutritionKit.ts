import type { MetricsInput } from "./plans";
import type { DetailedTargets } from "./targets";

export const NUTRITION_KIT_DISCLAIMER = `This Nutrition Kit plan maps educational VitalGauge targets to specific retail products for DIY convenience. It is not medical advice, a prescription, or an FDA-evaluated protocol. Multivitamins and vitamin D do not replace food or lab-guided care. Do not take high-dose vitamin D without clinician guidance. Choose ADAM or EVE by sex — do not combine unless a clinician directs. Product labels override any summary here.`;

export type KitProduct = {
  asin: string;
  name: string;
  url: string;
  role: string;
};

export const KIT_PRODUCTS = {
  whey: {
    asin: "B06XX65GS1",
    name: "Raw grass-fed whey protein (unflavored, 5 lb)",
    url: "https://www.amazon.com/dp/B06XX65GS1",
    role: "Close daily protein / essential amino acid gap",
  },
  shaker: {
    asin: "B084PVQGH1",
    name: "BlenderBottle Strada shaker (24 oz)",
    url: "https://www.amazon.com/dp/B084PVQGH1",
    role: "Mix shakes and support fluid intake",
  },
  d3: {
    asin: "B00F45EQ4W",
    name: "NOW Vitamin D3 10,000 IU softgels",
    url: "https://www.amazon.com/dp/B00F45EQ4W",
    role: "Optional high-potency vitamin D — clinician/labs only",
  },
  adam: {
    asin: "B0013OVWWM",
    name: "NOW ADAM men’s multivitamin (120 tablets)",
    url: "https://www.amazon.com/dp/B0013OVWWM",
    role: "Daily vitamins & minerals for many adult men",
  },
  eve: {
    asin: "B000JN6MBO",
    name: "NOW EVE women’s multivitamin (180 tablets)",
    url: "https://www.amazon.com/dp/B000JN6MBO",
    role: "Daily vitamins & minerals for many adult women (includes iron)",
  },
} as const satisfies Record<string, KitProduct>;

/** Label claim varies by lot — educational default scoop size. */
const WHEY_PROTEIN_G_PER_SCOOP = 25;
const SHAKE_FLUID_OZ = 24;

export type NutritionKitPlan = {
  disclaimer: string;
  title: string;
  summary: string;
  daily: {
    caloriesTarget: number;
    proteinTargetG: number;
    proteinFromFoodG: number;
    proteinFromWheyG: number;
    wheyScoops: number;
    waterLiters: number;
    shakerFills: number;
  };
  products: Array<KitProduct & { howToUse: string; caution?: string }>;
  schedule: string[];
  sampleDay: string[];
  gaps: string[];
};

export function buildNutritionKitPlan(
  m: MetricsInput,
  targets: DetailedTargets | null,
): NutritionKitPlan | null {
  if (!targets) return null;

  const proteinTargetG = targets.macros.proteinG;
  // Assume ~60% of protein from ordinary food; whey closes the rest (educational)
  const proteinFromFoodG = Math.round(proteinTargetG * 0.6);
  const gap = Math.max(0, proteinTargetG - proteinFromFoodG);
  const wheyScoops = Math.min(3, Math.max(0, Math.ceil(gap / WHEY_PROTEIN_G_PER_SCOOP)));
  const proteinFromWheyG = wheyScoops * WHEY_PROTEIN_G_PER_SCOOP;
  const waterLiters = targets.macros.waterLiters;
  const shakerFills = Math.max(1, Math.ceil((waterLiters * 33.814) / SHAKE_FLUID_OZ));

  const sex = m.sex ?? "prefer_not";
  const useEve = sex === "female";
  const useAdam = sex === "male";
  const multiUnclear = !useEve && !useAdam;

  const products: NutritionKitPlan["products"] = [
    {
      ...KIT_PRODUCTS.whey,
      howToUse:
        wheyScoops === 0
          ? `Food may already cover ~${proteinTargetG}g protein — keep whey optional for busy days.`
          : `Mix about ${wheyScoops} scoop(s)/day (~${proteinFromWheyG}g protein) in the Strada to help reach ~${proteinTargetG}g total. Confirm scoop grams on your bag label.`,
    },
    {
      ...KIT_PRODUCTS.shaker,
      howToUse: `Use for whey shakes and as ~${SHAKE_FLUID_OZ} oz fluid blocks. About ${shakerFills} fills/day helps toward ~${waterLiters} L educational fluid target (food moisture counts too).`,
    },
  ];

  if (useAdam) {
    products.push({
      ...KIT_PRODUCTS.adam,
      howToUse: "Take 1 tablet daily with food (per label) as a men’s multi toward vitamin/mineral coverage.",
      caution: "Does not replace vegetables, protein foods, or clinician-ordered labs.",
    });
  } else if (useEve) {
    products.push({
      ...KIT_PRODUCTS.eve,
      howToUse: "Take as directed on the label with food (often 3 tablets daily) as a women’s multi; includes iron.",
      caution: "Iron-containing — not a default multi for most men. Follow label; ask a clinician if pregnant or anemic.",
    });
  } else {
    products.push({
      ...KIT_PRODUCTS.adam,
      howToUse: "Sex not specified — do not guess. Prefer ADAM only if male-typical needs apply.",
      caution: "If you need a women’s formula with iron, use EVE instead after clinician/input clarity.",
    });
    products.push({
      ...KIT_PRODUCTS.eve,
      howToUse: "Sex not specified — EVE is the iron-containing women’s option when appropriate.",
      caution: "Pick one multi aligned with your sex/clinician advice — do not double up.",
    });
  }

  products.push({
    ...KIT_PRODUCTS.d3,
    howToUse: `App educational vitamin D target is often ~${targets.vitamins.find((v) => v.name.startsWith("Vitamin D"))?.amount ?? 600} IU/day — far below 10,000 IU.`,
    caution:
      "Do not start NOW D3 10,000 IU as a casual daily dose from this app. Use only with clinician guidance and labs, or choose a lower-dose D3.",
  });

  const schedule = [
    "Morning: breakfast + multivitamin (ADAM or EVE) with food.",
    wheyScoops > 0
      ? `Protein: ${wheyScoops} whey shake(s) in the Strada — place mid-morning and/or post-activity.`
      : "Protein: prioritize food first; keep whey optional.",
    `Fluids: work toward ~${waterLiters} L/day using the Strada among other drinks.`,
    "Vitamin D3 10,000 IU: skip unless a clinician cleared this exact potency.",
    "Evening: finish remaining food protein/carbs/fat toward calorie & macro targets from the app.",
  ];

  const sampleDay = [
    `Calories target ≈ ${targets.calories.dailyTarget} kcal (educational).`,
    `Protein ≈ ${proteinTargetG}g → food ~${proteinFromFoodG}g + whey ~${proteinFromWheyG}g.`,
    `Carbs ≈ ${targets.macros.carbsG}g · Fat ≈ ${targets.macros.fatG}g · Fiber ≈ ${targets.macros.fiberG}g (from meals, not the kit).`,
    useEve
      ? "Multi: EVE with a meal (label dose)."
      : useAdam
        ? "Multi: ADAM 1 tablet with a meal."
        : "Multi: choose ADAM or EVE after clarifying sex/clinician advice.",
    "Kit does not measure pH, HR, or blood pressure — log those separately if you have tools.",
  ];

  if (multiUnclear) {
    sampleDay.push("Set sex in the form for a cleaner ADAM vs EVE recommendation next run.");
  }

  const gaps = [
    "No saliva/urine pH strips, BP cuff, or HR tool in this kit.",
    "Carbs, fat, sodium, and potassium still come mostly from food.",
    "High-dose D3 is not aligned with typical DIY educational IU targets.",
    "Supplements are not a substitute for clinical care or bloodwork.",
  ];

  return {
    disclaimer: NUTRITION_KIT_DISCLAIMER,
    title: "Nutrition Kit plan (whey · shaker · multi · D3)",
    summary: `Use the Amazon nutrition kit to help hit ~${proteinTargetG}g protein and daily multi coverage while following VitalGauge calorie/macro targets. D3 10,000 IU stays clinician-gated.`,
    daily: {
      caloriesTarget: targets.calories.dailyTarget,
      proteinTargetG,
      proteinFromFoodG,
      proteinFromWheyG,
      wheyScoops,
      waterLiters,
      shakerFills,
    },
    products,
    schedule,
    sampleDay,
    gaps,
  };
}
