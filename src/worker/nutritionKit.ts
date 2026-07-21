import type { MetricsInput } from "./plans";
import type { DetailedTargets } from "./targets";

export const NUTRITION_KIT_DISCLAIMER = `This Nutrition Kit plan maps educational VitalGauge targets to specific retail products for DIY convenience. It is not medical advice, a prescription, or an FDA-evaluated protocol. Multivitamins and vitamin D do not replace food or lab-guided care. Home pH strips, BP cuffs, and smart scales are for self-tracking only — not diagnoses. Do not take high-dose vitamin D without clinician guidance. Choose ADAM or EVE by sex — do not combine unless a clinician directs. Product labels override any summary here.`;

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
  phStrips: {
    asin: "B01GFSEB00",
    name: "pH test strips (saliva & urine)",
    url: "https://www.amazon.com/dp/B01GFSEB00",
    role: "Log DIY saliva pH (and optional urine pH) in VitalGauge",
  },
  renphoBp: {
    asin: "B07WFTQ94B",
    name: "RENPHO upper-arm blood pressure monitor",
    url: "https://www.amazon.com/dp/B07WFTQ94B",
    role: "Home BP seated + standing + pulse for VitalGauge vitals",
  },
  renphoScale: {
    asin: "B01N1UX8RW",
    name: "RENPHO smart body scale",
    url: "https://www.amazon.com/dp/B01N1UX8RW",
    role: "Track weight (and optional body metrics) for demographics & progress",
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

  products.push({
    ...KIT_PRODUCTS.phStrips,
    howToUse:
      "Test saliva mid-morning (before brushing/eating when possible). Compare to the bottle chart and enter saliva pH in VitalGauge demographics. Optional: urine pH is separate from Multistix pads.",
    caution: "Home pH strips are educational self-tracking — not a lab diagnosis or “acid body type” test.",
  });

  products.push({
    ...KIT_PRODUCTS.renphoBp,
    howToUse:
      "Sit quietly 5 minutes, then measure seated BP and pulse. For orthostatic check, stand and remeasure after ~1 minute. Enter seated/standing BP and resting HR in VitalGauge.",
    caution: "Home BP is not a medical diagnosis. Seek care for very high readings, chest pain, or severe dizziness.",
  });

  products.push({
    ...KIT_PRODUCTS.renphoScale,
    howToUse:
      "Weigh at a consistent time (e.g. morning, after bathroom, before breakfast). Enter weight in demographics; use trends for progress, not day-to-day noise.",
    caution: "Smart-scale body-fat estimates vary — treat weight as the primary input for VitalGauge.",
  });

  const schedule = [
    "Morning: weigh on RENPHO scale → breakfast + multivitamin (ADAM or EVE) with food.",
    "Optional: saliva pH strip mid-morning → log in VitalGauge.",
    wheyScoops > 0
      ? `Protein: ${wheyScoops} whey shake(s) in the Strada — place mid-morning and/or post-activity.`
      : "Protein: prioritize food first; keep whey optional.",
    `Fluids: work toward ~${waterLiters} L/day using the Strada among other drinks.`,
    "1–2×/week: RENPHO BP seated (+ standing if checking orthostatic) and resting pulse → log vitals.",
    "Vitamin D3 10,000 IU: skip unless a clinician cleared this exact potency.",
    "Evening: finish remaining food protein/carbs/fat toward calorie & macro targets from the app.",
  ];

  const altKit = targets.priorityFocus === "alt_protein_micros";
  const sampleDay = altKit
    ? [
        `Protein goal ≈ ${proteinTargetG}g → food ~${proteinFromFoodG}g + whey ~${proteinFromWheyG}g.`,
        `Food energy ≈ ${targets.calories.dailyTarget} kcal (supporting, not the primary goal on Alternative).`,
        `Carbs ≈ ${targets.macros.carbsG}g · Fat ≈ ${targets.macros.fatG}g · Fiber ≈ ${targets.macros.fiberG}g (from meals, not the kit).`,
      ]
    : [
        `Calories target ≈ ${targets.calories.dailyTarget} kcal (educational).`,
        `Protein ≈ ${proteinTargetG}g → food ~${proteinFromFoodG}g + whey ~${proteinFromWheyG}g.`,
        `Carbs ≈ ${targets.macros.carbsG}g · Fat ≈ ${targets.macros.fatG}g · Fiber ≈ ${targets.macros.fiberG}g (from meals, not the kit).`,
      ];
  sampleDay.push(
    useEve
      ? "Multi: EVE with a meal (label dose)."
      : useAdam
        ? "Multi: ADAM 1 tablet with a meal."
        : "Multi: choose ADAM or EVE after clarifying sex/clinician advice.",
    "Measure: RENPHO scale (weight) · pH strips (saliva) · RENPHO BP (seated/standing + pulse) when logging vitals.",
  );

  if (multiUnclear) {
    sampleDay.push("Set sex in the form for a cleaner ADAM vs EVE recommendation next run.");
  }

  const gaps = [
    "Urine Multistix 10 SG is still a separate add-on for the full urine pad panel (not covered by basic pH strips).",
    "Carbs, fat, sodium, and potassium still come mostly from food.",
    "High-dose D3 is not aligned with typical DIY educational IU targets.",
    "Supplements and home devices are not a substitute for clinical care or bloodwork.",
  ];

  return {
    disclaimer: NUTRITION_KIT_DISCLAIMER,
    title: "Nutrition Kit plan (whey · multi · D3 · pH · RENPHO BP · scale)",
    summary: `Use the Amazon kit for ~${proteinTargetG}g protein support, multi coverage, and DIY vitals (pH strips, RENPHO BP, RENPHO scale) while following VitalGauge targets. D3 10,000 IU stays clinician-gated.`,
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
