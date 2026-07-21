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
  /** BMR used for the reserves-days illustration (kcal/day). */
  bmrKcal: number | null;
  /**
   * Days of caloric reserves at BMR:
   * ((actual − ideal) lb × 3500) ÷ BMR.
   */
  daysOfCaloricReserves: number | null;
  /** Full formula line — use once (e.g. weight forecast). */
  reservesLine: string;
  /** Short reserves figure for summaries elsewhere. */
  reservesShort: string;
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
  opts?: { tdee?: number; bmr?: number; maxDailyDrawKcal?: number },
): FatStoreEstimate | null {
  if (!m.heightCm || !m.weightKg) return null;

  const heightM = m.heightCm / 100;
  const idealWeightKg = IDEAL_BMI * heightM * heightM;
  const idealWeightLb = kgToLb(idealWeightKg);
  const currentWeightLb = kgToLb(m.weightKg);
  const currentBmi = bmi(m.heightCm, m.weightKg);
  const excessLb = Math.max(0, Math.round((currentWeightLb - idealWeightLb) * 10) / 10);
  const estimatedStoreKcal = Math.round(excessLb * KCAL_PER_LB_FAT);

  const bmrKcal =
    opts?.bmr && opts.bmr > 0 ? Math.round(opts.bmr) : null;

  // Days of caloric reserves: excess energy ÷ BMR
  // = ((actual − ideal) lb × 3500 kcal/lb) ÷ BMR kcal/day
  const daysOfCaloricReserves =
    bmrKcal && excessLb > 0
      ? Math.round((estimatedStoreKcal / bmrKcal) * 10) / 10
      : excessLb <= 0
        ? 0
        : null;

  const reservesLine =
    excessLb <= 0
      ? `You have ~0 days of caloric reserves (at or near ideal weight).`
      : daysOfCaloricReserves != null && bmrKcal
        ? `You have ~${daysOfCaloricReserves} days of caloric reserves ((${excessLb} lb over ideal × ${KCAL_PER_LB_FAT} kcal/lb) ÷ BMR ${bmrKcal} kcal/day).`
        : `You have caloric reserves of ~${excessLb} lb over ideal (~${estimatedStoreKcal.toLocaleString()} kcal); BMR needed to convert to days.`;

  const reservesShort =
    excessLb <= 0
      ? `~0 days of fat stores (at/near ideal weight)`
      : daysOfCaloricReserves != null
        ? `~${daysOfCaloricReserves} days of fat stores (~${excessLb} lb over ideal)`
        : `~${excessLb} lb over ideal as fat stores`;

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
      : `~${excessLb} lb above ideal (~${idealWeightLb} lb at BMI ${IDEAL_BMI}) modeled as ~${estimatedStoreKcal.toLocaleString()} kcal fat stores. ${reservesLine} Alternative plans may draw ~${dailyDrawKcal} kcal/day from those stores so food mainly covers protein + micronutrients.`;

  return {
    disclaimer: FAT_STORE_DISCLAIMER,
    idealBmi: IDEAL_BMI,
    idealWeightLb,
    currentWeightLb,
    currentBmi,
    excessLb,
    estimatedStoreKcal,
    bmrKcal,
    daysOfCaloricReserves,
    reservesLine,
    reservesShort,
    dailyDrawKcal,
    weeksOfStoresAtDraw,
    summary,
  };
}
