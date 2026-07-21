import { bmi, type MetricsInput } from "./plans";
import { IDEAL_BMI } from "./lifeExpectancy";

/** Classic teaching rule used for DIY fat-loss illustrations. */
export const KCAL_PER_LB_FAT = 3500;

export const FAT_STORE_DISCLAIMER = `Treating weight above an ideal BMI as “mobilizable fat stores” is an educational simplification. Real bodies include lean mass, water, and glycogen; not every pound over ideal is pure fat, and you cannot precisely meter oxidation of body fat day-to-day. This is not a medical clearance to under-eat.`;

export type FatStoreEstimate = {
  disclaimer: string;
  idealBmi: number;
  idealWeightLb: number;
  currentWeightLb: number;
  currentBmi: number;
  /** Pounds above ideal weight (floored at 0). */
  excessLb: number;
  /** Educational: excessLb × 3500 kcal. */
  estimatedStoreKcal: number;
  /** Suggested daily draw from stores for Alternative plans (kcal/day). */
  dailyDrawKcal: number;
  /** Rough weeks of stores at that daily draw. */
  weeksOfStoresAtDraw: number | null;
  summary: string;
};

function kgToLb(kg: number): number {
  return Math.round((kg / 0.45359237) * 10) / 10;
}

/**
 * Educational model: mass above ideal BMI is treated as fat energy available
 * to cover the gap between TDEE and food intake on Alternative plans.
 */
export function estimateFatStores(
  m: MetricsInput,
  opts?: { tdee?: number; maxDailyDrawKcal?: number },
): FatStoreEstimate | null {
  if (!m.heightCm || !m.weightKg) return null;

  const heightM = m.heightCm / 100;
  const idealWeightKg = IDEAL_BMI * heightM * heightM;
  const idealWeightLb = kgToLb(idealWeightKg);
  const currentWeightLb = kgToLb(m.weightKg);
  const currentBmi = bmi(m.heightCm, m.weightKg);
  const excessLb = Math.max(0, Math.round((currentWeightLb - idealWeightLb) * 10) / 10);
  const estimatedStoreKcal = Math.round(excessLb * KCAL_PER_LB_FAT);

  // Daily draw: prefer ~15–20% of TDEE, capped, and not more than ~1.5–2 lb/week educational
  const tdee = opts?.tdee ?? 2000;
  const maxDraw = opts?.maxDailyDrawKcal ?? 750;
  let dailyDrawKcal = 0;
  if (excessLb > 0) {
    dailyDrawKcal = Math.round(Math.min(maxDraw, Math.max(300, tdee * 0.18)));
    // Don't plan a draw larger than ~2 lb/week from the simple model
    dailyDrawKcal = Math.min(dailyDrawKcal, Math.round((2 * KCAL_PER_LB_FAT) / 7));
  }

  const weeksOfStoresAtDraw =
    dailyDrawKcal > 0 ? Math.round((estimatedStoreKcal / dailyDrawKcal / 7) * 10) / 10 : null;

  const summary =
    excessLb <= 0
      ? `At or near ideal BMI ${IDEAL_BMI} (~${idealWeightLb} lb) — little/no excess modeled as mobilizable fat stores.`
      : `~${excessLb} lb above ideal (~${idealWeightLb} lb at BMI ${IDEAL_BMI}) modeled as ~${estimatedStoreKcal.toLocaleString()} kcal fat stores. Alternative plans may draw ~${dailyDrawKcal} kcal/day from those stores so food mainly covers protein + micronutrients.`;

  return {
    disclaimer: FAT_STORE_DISCLAIMER,
    idealBmi: IDEAL_BMI,
    idealWeightLb,
    currentWeightLb,
    currentBmi,
    excessLb,
    estimatedStoreKcal,
    dailyDrawKcal,
    weeksOfStoresAtDraw,
    summary,
  };
}
