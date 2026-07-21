import { bmi, type MetricsInput } from "./plans";
import type { DetailedTargets } from "./targets";

export const PROGRESS_DISCLAIMER = `Weight-progress forecasts are rough DIY illustrations only. They assume a steady calorie gap, ~3,500 kcal ≈ 1 lb of body weight (a simplified teaching rule), and that you follow the plan without medical complications. Real results vary widely. This is not a clinical weight-loss prescription. Stop and seek care if you feel unwell, lose weight very rapidly, or have an eating-disorder history.`;

/** Show progress tools when BMI is in overweight+ range (educational WHO cut-point). */
export const OVERWEIGHT_BMI = 25;

export type ProgressMilestone = {
  weeks: number;
  weightLb: number;
  bmi: number;
  lostLb: number;
};

export type WeightProgressForecast = {
  disclaimer: string;
  eligible: true;
  current: {
    weightLb: number;
    bmi: number;
    category: "overweight" | "obesity";
  };
  plan: {
    dailyCalories: number;
    tdee: number;
    dailyDeficitKcal: number;
    exerciseBurnKcal: number;
    calorieAdjust: number;
    exerciseBonusKcal: number;
  };
  pace: {
    weeklyLossLb: number;
    monthlyLossLb: number;
    note: string;
  };
  milestones: ProgressMilestone[];
  toHealthyBmi: {
    targetBmi: number;
    targetWeightLb: number;
    poundsToGo: number;
    estimatedWeeks: number | null;
    summary: string;
  };
  modifiersHint: string;
};

function kgToLb(kg: number): number {
  return Math.round((kg / 0.45359237) * 10) / 10;
}

function lbToKg(lb: number): number {
  return lb * 0.45359237;
}

export function isOverweightForForecast(m: MetricsInput): boolean {
  if (!m.heightCm || !m.weightKg) return false;
  return bmi(m.heightCm, m.weightKg) >= OVERWEIGHT_BMI;
}

/**
 * Educational weight-change forecast when BMI ≥ 25.
 * Deficit = (TDEE − intake) + intentional exercise burn beyond what’s already
 * baked into a sedentary baseline — we use TDEE − dailyTarget as the diet gap,
 * plus optional exerciseBonusKcal the user elects to add.
 */
export function buildWeightProgressForecast(
  m: MetricsInput,
  targets: DetailedTargets | null,
): WeightProgressForecast | null {
  if (!targets || !m.heightCm || !m.weightKg) return null;
  const currentBmi = bmi(m.heightCm, m.weightKg);
  if (currentBmi < OVERWEIGHT_BMI) return null;

  const weightLb = kgToLb(m.weightKg);
  const calorieAdjust = m.calorieAdjust ?? 0;
  const exerciseBonusKcal = m.exerciseBonusKcal ?? 0;

  const dietGap = Math.max(0, targets.calories.tdee - targets.calories.dailyTarget);
  // Count a fraction of planned exercise burn as additional deficit only when
  // the user adds an explicit bonus on top of the baseline plan.
  const dailyDeficitKcal = Math.max(0, dietGap + exerciseBonusKcal);
  let weeklyLossLb = Math.round(((dailyDeficitKcal * 7) / 3500) * 10) / 10;

  let note = "Educational pace from calorie gap ÷ 3,500 kcal per lb.";
  if (weeklyLossLb > 2) {
    weeklyLossLb = 2;
    note =
      "Capped at ~2 lb/week for this illustration — faster loss needs clinician supervision.";
  }
  if (weeklyLossLb < 0.2 && dailyDeficitKcal > 0) {
    note = "Very small gap — progress will look slow; modifiers can increase the deficit.";
  }
  if (dailyDeficitKcal <= 0) {
    weeklyLossLb = 0;
    note = "No calorie deficit in this plan — add a calorie cut or exercise bonus to project loss.";
  }

  const monthlyLossLb = Math.round(weeklyLossLb * 4.3 * 10) / 10;
  const heightM = m.heightCm / 100;
  const targetBmi = 24.9;
  const targetWeightKg = targetBmi * heightM * heightM;
  const targetWeightLb = kgToLb(targetWeightKg);
  const poundsToGo = Math.max(0, Math.round((weightLb - targetWeightLb) * 10) / 10);

  const milestones: ProgressMilestone[] = [];
  for (const weeks of [4, 8, 12]) {
    const lost = Math.round(weeklyLossLb * weeks * 10) / 10;
    const nextLb = Math.max(targetWeightLb, Math.round((weightLb - lost) * 10) / 10);
    const nextKg = lbToKg(nextLb);
    milestones.push({
      weeks,
      weightLb: nextLb,
      bmi: Math.round((nextKg / (heightM * heightM)) * 10) / 10,
      lostLb: Math.round((weightLb - nextLb) * 10) / 10,
    });
  }

  const estimatedWeeks =
    weeklyLossLb > 0 ? Math.ceil(poundsToGo / weeklyLossLb) : null;

  let summary: string;
  if (!estimatedWeeks || weeklyLossLb <= 0) {
    summary =
      "With the current calorie/exercise settings there isn’t a clear loss trajectory to BMI &lt; 25 on this simple model.";
  } else if (estimatedWeeks > 104) {
    summary = `At ~${weeklyLossLb} lb/week, reaching BMI ~${targetBmi} (~${targetWeightLb} lb) would take well over 2 years on this simple model — consider a larger sustainable deficit or more daily walking.`;
  } else {
    summary = `At ~${weeklyLossLb} lb/week, reaching BMI ~${targetBmi} (~${targetWeightLb} lb) is roughly ${estimatedWeeks} weeks on this simple model — illustrative only.`;
  }
  summary = summary.replace(/&lt;/g, "<");

  return {
    disclaimer: PROGRESS_DISCLAIMER,
    eligible: true,
    current: {
      weightLb,
      bmi: currentBmi,
      category: currentBmi >= 30 ? "obesity" : "overweight",
    },
    plan: {
      dailyCalories: targets.calories.dailyTarget,
      tdee: targets.calories.tdee,
      dailyDeficitKcal,
      exerciseBurnKcal: targets.exercise.dailyBurnTargetKcal,
      calorieAdjust,
      exerciseBonusKcal,
    },
    pace: {
      weeklyLossLb,
      monthlyLossLb,
      note,
    },
    milestones,
    toHealthyBmi: {
      targetBmi,
      targetWeightLb,
      poundsToGo,
      estimatedWeeks,
      summary,
    },
    modifiersHint:
      "Use the controls below to cut more calories or add exercise burn, then update the forecast and food plan.",
  };
}
