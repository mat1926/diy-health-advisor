import { type MetricsInput } from "./plans";
import { resolvePerspective } from "./perspectives";

export const TARGETS_DISCLAIMER = `These numeric targets are DIY educational estimates from your demographics (age, sex, height, weight, activity, goal). They are not medical prescriptions, lab orders, or personalized clinical nutrition. Vitamin, mineral, and amino-acid figures lean on general adult reference ranges and scale with body weight where noted. Do not megadose supplements from this table — discuss labs and supplements with a licensed clinician.`;

export type NutrientTarget = {
  name: string;
  amount: number;
  unit: string;
  note?: string;
};

export type DetailedTargets = {
  disclaimer: string;
  method: string;
  sleep: {
    hoursMin: number;
    hoursTarget: number;
    hoursMax: number;
    label: string;
  };
  calories: {
    bmr: number;
    tdee: number;
    dailyTarget: number;
    goalAdjustment: string;
  };
  exercise: {
    dailyBurnTargetKcal: number;
    weeklyBurnTargetKcal: number;
    examples: string[];
  };
  macros: {
    proteinG: number;
    carbsG: number;
    fatG: number;
    proteinPct: number;
    carbsPct: number;
    fatPct: number;
    fiberG: number;
    waterLiters: number;
  };
  aminoAcids: NutrientTarget[];
  vitamins: NutrientTarget[];
  minerals: NutrientTarget[];
};

function activityFactor(level: MetricsInput["activityLevel"]): number {
  switch (level) {
    case "sedentary":
      return 1.2;
    case "light":
      return 1.375;
    case "moderate":
      return 1.55;
    case "active":
      return 1.725;
    case "very_active":
      return 1.9;
    default:
      return 1.55;
  }
}

/** Mifflin–St Jeor BMR (kcal/day). */
function mifflinBmr(m: MetricsInput): number | null {
  if (!m.age || !m.heightCm || !m.weightKg) return null;
  const base = 10 * m.weightKg + 6.25 * m.heightCm - 5 * m.age;
  if (m.sex === "female") return Math.round(base - 161);
  if (m.sex === "male") return Math.round(base + 5);
  // Midpoint if unspecified
  return Math.round(base - 78);
}

function round(n: number, digits = 0): number {
  const p = 10 ** digits;
  return Math.round(n * p) / p;
}

function aa(name: string, mgPerKg: number, weightKg: number, note?: string): NutrientTarget {
  return {
    name,
    amount: Math.round(mgPerKg * weightKg),
    unit: "mg/day",
    note: note ?? `~${mgPerKg} mg/kg (educational)`,
  };
}

/**
 * Build detailed numeric targets after demographics are complete.
 * Educational only — not clinical dosing.
 */
export function buildDetailedTargets(m: MetricsInput): DetailedTargets | null {
  const bmr = mifflinBmr(m);
  if (bmr == null || !m.weightKg) return null;

  const perspective = resolvePerspective(m.perspective);
  const goal = m.primaryGoal ?? "general";
  const factor = activityFactor(m.activityLevel);
  const tdee = Math.round(bmr * factor);

  // Sleep hours
  let hoursMin = 7;
  let hoursTarget = 8;
  let hoursMax = 9;
  if (goal === "sleep" || goal === "stress") {
    hoursMin = 7.5;
    hoursTarget = 8.5;
    hoursMax = 9.5;
  }
  if (goal === "strength") {
    hoursTarget = 8.5;
  }
  if (typeof m.sleepHours === "number" && m.sleepHours < 6) {
    hoursMin = 7;
    hoursTarget = 8;
    hoursMax = 9;
  }

  // Calorie target
  let dailyTarget = tdee;
  let goalAdjustment = "Maintenance estimate (activity-adjusted TDEE).";
  if (goal === "weight") {
    dailyTarget = Math.max(1200, Math.round(tdee - 400));
    goalAdjustment = "About −400 kcal vs TDEE for a modest educational deficit (not a crash diet).";
  } else if (goal === "strength") {
    dailyTarget = Math.round(tdee + 200);
    goalAdjustment = "About +200 kcal vs TDEE to support training (educational surplus).";
  } else if (goal === "energy") {
    dailyTarget = tdee;
    goalAdjustment = "Maintenance calories with protein-forward meals for steadier energy.";
  }

  // Lens nudges (mild)
  if (perspective === "metabolic" && goal === "weight") {
    goalAdjustment += " Alternative metabolic lens: keep protein high if lowering refined carbs.";
  }
  if (perspective === "cdc" && goal === "weight") {
    goalAdjustment += " CDC-style lens: favor a modest deficit with produce-forward meals.";
  }

  // Exercise burn — portion of TDEE beyond sedentary BMR*1.2
  const sedentaryTdee = Math.round(bmr * 1.2);
  const activityGap = Math.max(150, tdee - sedentaryTdee);
  let dailyBurnTargetKcal = Math.round(activityGap * 0.55);
  if (m.activityLevel === "sedentary" || m.activityLevel === "light") {
    dailyBurnTargetKcal = Math.max(150, Math.round(bmr * 0.12));
  }
  if (
    (typeof m.sleepHours === "number" && m.sleepHours < 6) ||
    (typeof m.stressLevel === "number" && m.stressLevel >= 8)
  ) {
    dailyBurnTargetKcal = Math.min(dailyBurnTargetKcal, 200);
  }
  const weeklyBurnTargetKcal = dailyBurnTargetKcal * 7;

  // Macros — protein first, then fat/carb split of remaining kcal by lens.
  // CDC-style stays carb-forward; alternative lenses lean lower-carb (educational, not keto Rx).
  let proteinPerKg = 1.4;
  if (goal === "strength") proteinPerKg = 1.8;
  if (goal === "weight") proteinPerKg = 1.8;
  if (
    perspective === "metabolic" ||
    perspective === "functional" ||
    perspective === "fitness" ||
    perspective === "alternative"
  ) {
    proteinPerKg = Math.max(proteinPerKg, 1.6);
  }

  const proteinG = Math.round(proteinPerKg * m.weightKg);

  /** Relative fat:carb shares of calories left after protein (not “fill leftover with carbs”). */
  let fatShareOfRemainder = 0.4;
  let carbShareOfRemainder = 0.6;

  if (perspective === "cdc") {
    // AMDR-style: more carbs, moderate fat
    fatShareOfRemainder = goal === "strength" ? 0.3 : 0.35;
    carbShareOfRemainder = 1 - fatShareOfRemainder;
  } else if (perspective === "metabolic") {
    // Lower-carb leaning alternative (~15–25% of total kcal carbs for many adults)
    fatShareOfRemainder = 0.7;
    carbShareOfRemainder = 0.3;
  } else if (
    perspective === "fitness" ||
    perspective === "alternative" ||
    perspective === "functional"
  ) {
    // Metabolic-fitness / blended alt — lower refined-carb pattern, not CDC plate
    fatShareOfRemainder = goal === "strength" ? 0.55 : 0.65;
    carbShareOfRemainder = 1 - fatShareOfRemainder;
  } else if (perspective === "food_first") {
    // Whole-food carbs still welcome for fiber, but below CDC
    fatShareOfRemainder = 0.55;
    carbShareOfRemainder = 0.45;
  } else {
    // clean_living and any other alt
    fatShareOfRemainder = 0.6;
    carbShareOfRemainder = 0.4;
  }

  const proteinKcal = proteinG * 4;
  const remaining = Math.max(400, dailyTarget - proteinKcal);
  const fatG = Math.round((remaining * fatShareOfRemainder) / 9);
  const carbsG = Math.round((remaining * carbShareOfRemainder) / 4);
  const proteinPct = Math.round((proteinKcal * 100) / dailyTarget);
  const fatPctFinal = Math.round((fatG * 9 * 100) / dailyTarget);
  const carbsPctFinal = Math.max(0, 100 - proteinPct - fatPctFinal);

  const fiberG = Math.min(45, Math.max(25, Math.round(14 * (dailyTarget / 1000))));
  const waterLiters = round(Math.max(2.0, m.weightKg * 0.033), 1);

  const female = m.sex === "female";
  const over50 = (m.age ?? 30) >= 51;
  const over70 = (m.age ?? 30) >= 71;

  // Amino acids — WHO/FAO adult scoring pattern style (mg/kg), educational
  const w = m.weightKg;
  const aminoAcids: NutrientTarget[] = [
    aa("Histidine", 10, w),
    aa("Isoleucine", 20, w),
    aa("Leucine", 39, w, "Key for muscle protein synthesis (educational)"),
    aa("Lysine", 30, w),
    aa("Methionine + Cysteine", 15, w),
    aa("Phenylalanine + Tyrosine", 25, w),
    aa("Threonine", 15, w),
    aa("Tryptophan", 4, w),
    aa("Valine", 26, w),
    {
      name: "Total essential amino acids (sum of above)",
      amount: Math.round((10 + 20 + 39 + 30 + 15 + 25 + 15 + 4 + 26) * w),
      unit: "mg/day",
      note: "Usually met when daily protein target is hit from varied foods",
    },
  ];

  const vitamins: NutrientTarget[] = [
    { name: "Vitamin A (RAE)", amount: female ? 700 : 900, unit: "mcg/day" },
    { name: "Vitamin C", amount: female ? 75 : 90, unit: "mg/day" },
    { name: "Vitamin D", amount: over70 ? 800 : 600, unit: "IU/day", note: "Get labs before high-dose supplements" },
    { name: "Vitamin E", amount: 15, unit: "mg/day" },
    { name: "Vitamin K", amount: female ? 90 : 120, unit: "mcg/day" },
    { name: "Thiamin (B1)", amount: female ? 1.1 : 1.2, unit: "mg/day" },
    { name: "Riboflavin (B2)", amount: female ? 1.1 : 1.3, unit: "mg/day" },
    { name: "Niacin (B3)", amount: female ? 14 : 16, unit: "mg NE/day" },
    { name: "Vitamin B6", amount: over50 ? (female ? 1.5 : 1.7) : (female ? 1.3 : 1.3), unit: "mg/day" },
    { name: "Folate (DFE)", amount: 400, unit: "mcg/day" },
    { name: "Vitamin B12", amount: 2.4, unit: "mcg/day" },
    { name: "Pantothenic acid (B5)", amount: 5, unit: "mg/day" },
    { name: "Biotin", amount: 30, unit: "mcg/day" },
    { name: "Choline", amount: female ? 425 : 550, unit: "mg/day" },
  ];

  const minerals: NutrientTarget[] = [
    {
      name: "Calcium",
      amount: over50 ? 1200 : 1000,
      unit: "mg/day",
    },
    {
      name: "Iron",
      amount: female && !over50 ? 18 : 8,
      unit: "mg/day",
      note: female && !over50 ? "Higher for many premenopausal adults" : undefined,
    },
    {
      name: "Magnesium",
      amount: female ? (over30(m) ? 320 : 310) : over30(m) ? 420 : 400,
      unit: "mg/day",
    },
    { name: "Zinc", amount: female ? 8 : 11, unit: "mg/day" },
    { name: "Potassium", amount: female ? 2600 : 3400, unit: "mg/day", note: "AI-style adequate intake (educational)" },
    {
      name: "Sodium",
      amount: 2300,
      unit: "mg/day",
      note: "Upper educational limit for many adults — clinician may set lower",
    },
    { name: "Phosphorus", amount: 700, unit: "mg/day" },
    { name: "Selenium", amount: 55, unit: "mcg/day" },
    { name: "Iodine", amount: 150, unit: "mcg/day" },
    { name: "Copper", amount: 0.9, unit: "mg/day" },
    { name: "Manganese", amount: female ? 1.8 : 2.3, unit: "mg/day" },
    { name: "Chromium", amount: female ? (over50 ? 20 : 25) : over50 ? 30 : 35, unit: "mcg/day" },
  ];

  return {
    disclaimer: TARGETS_DISCLAIMER,
    method:
      "Sleep band from goal; calories via Mifflin–St Jeor BMR × activity factor with goal offset; exercise kcal from activity gap; macros from protein g/kg + fat/carb split by plan style (CDC-style carb-forward; alternative lenses lower-carb leaning, educational only); amino acids from mg/kg educational patterns; vitamins/minerals from general adult reference ranges by sex/age.",
    sleep: {
      hoursMin,
      hoursTarget,
      hoursMax,
      label: `${hoursTarget} hours target (${hoursMin}–${hoursMax} band)`,
    },
    calories: {
      bmr,
      tdee,
      dailyTarget,
      goalAdjustment,
    },
    exercise: {
      dailyBurnTargetKcal,
      weeklyBurnTargetKcal,
      examples: [
        `~${dailyBurnTargetKcal} kcal/day from intentional movement (walks + training), educational estimate`,
        `~${Math.round(dailyBurnTargetKcal / 4)} kcal ≈ a brisk ~${Math.max(15, Math.round(dailyBurnTargetKcal / 5))}–${Math.max(25, Math.round(dailyBurnTargetKcal / 4))} min walk for many adults (very rough)`,
        `Weekly movement burn target ≈ ${weeklyBurnTargetKcal} kcal`,
      ],
    },
    macros: {
      proteinG,
      carbsG,
      fatG,
      proteinPct,
      carbsPct: carbsPctFinal,
      fatPct: fatPctFinal,
      fiberG,
      waterLiters,
    },
    aminoAcids,
    vitamins: vitamins.map((v) => ({
      ...v,
      amount: typeof v.amount === "number" ? round(v.amount, v.amount < 10 ? 1 : 0) : v.amount,
    })),
    minerals: minerals.map((v) => ({
      ...v,
      amount: typeof v.amount === "number" ? round(v.amount, v.amount < 10 ? 1 : 0) : v.amount,
    })),
  };
}

function over30(m: MetricsInput): boolean {
  return (m.age ?? 30) >= 31;
}
