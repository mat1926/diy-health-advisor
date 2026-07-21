import { bmi, type MetricsInput } from "./plans";
import type { DetailedTargets } from "./targets";
import { IDEAL_BMI } from "./lifeExpectancy";

export const PROGRESS_DISCLAIMER = `Illustrative only (~3,500 kcal ≈ 1 lb teaching rule). Not a clinical weight-loss prescription — stop and seek care if you feel unwell or lose weight very rapidly.`;

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
    category: "overweight" | "obesity" | "within_range";
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
  /** Trajectory toward ideal weight (BMI 22.5 educational model). */
  toHealthyBmi: {
    targetBmi: number;
    targetWeightLb: number;
    poundsToGo: number;
    estimatedWeeks: number | null;
    summary: string;
  };
  /** True when Alternative protein/micros plan drives the forecast. */
  alternative: boolean;
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
 * Educational weight-change forecast toward ideal weight (BMI 22.5).
 * - CDC: when BMI ≥ 25
 * - Alternative (protein/micros): whenever the plan runs a calorie deficit (default)
 */
export function buildWeightProgressForecast(
  m: MetricsInput,
  targets: DetailedTargets | null,
): WeightProgressForecast | null {
  if (!targets || !m.heightCm || !m.weightKg) return null;
  const currentBmi = bmi(m.heightCm, m.weightKg);
  const altProteinMicros = targets.priorityFocus === "alt_protein_micros";
  const dietGap = Math.max(0, targets.calories.tdee - targets.calories.dailyTarget);

  if (!altProteinMicros && currentBmi < OVERWEIGHT_BMI) return null;
  if (altProteinMicros && dietGap <= 0 && currentBmi < OVERWEIGHT_BMI) return null;

  const weightLb = kgToLb(m.weightKg);
  const calorieAdjust = m.calorieAdjust ?? 0;
  const exerciseBonusKcal = m.exerciseBonusKcal ?? 0;
  const dailyDeficitKcal = Math.max(0, dietGap + exerciseBonusKcal);
  let weeklyLossLb = Math.round(((dailyDeficitKcal * 7) / 3500) * 10) / 10;

  let note = altProteinMicros
    ? targets.fatStores && targets.fatStores.excessLb > 0
      ? `~${dailyDeficitKcal} kcal/day from fat stores`
      : "Protein-forward deficit (carbs/fat flexible)"
    : "From calorie gap ÷ 3,500 kcal/lb";
  if (weeklyLossLb > 2) {
    weeklyLossLb = 2;
    note = "Capped at ~2 lb/week — faster loss needs clinician supervision";
  }
  if (weeklyLossLb < 0.2 && dailyDeficitKcal > 0) {
    note = "Very small gap — progress will look slow";
  }
  if (dailyDeficitKcal <= 0) {
    weeklyLossLb = 0;
    note = "No deficit — add exercise burn to project loss";
  }

  const monthlyLossLb = Math.round(weeklyLossLb * 4.3 * 10) / 10;
  const heightM = m.heightCm / 100;
  // Align with life-expectancy / fat-store ideal (not the overweight cut-point 24.9)
  const targetBmi = IDEAL_BMI;
  const targetWeightLb =
    targets.fatStores?.idealWeightLb ??
    kgToLb(targetBmi * heightM * heightM);
  const poundsToGo = Math.max(0, Math.round((weightLb - targetWeightLb) * 10) / 10);
  const idealLabel = `ideal weight ~${targetWeightLb} lb`;

  const milestones: ProgressMilestone[] = [];
  for (const weeks of [4, 8, 12]) {
    const lost = Math.round(weeklyLossLb * weeks * 10) / 10;
    const nextLb = Math.round((weightLb - lost) * 10) / 10;
    const nextKg = lbToKg(Math.max(nextLb, targetWeightLb * 0.95));
    const displayLb = Math.round((nextKg / 0.45359237) * 10) / 10;
    milestones.push({
      weeks,
      weightLb: displayLb,
      bmi: Math.round((nextKg / (heightM * heightM)) * 10) / 10,
      lostLb: Math.round((weightLb - displayLb) * 10) / 10,
    });
  }

  const estimatedWeeks =
    weeklyLossLb > 0 && poundsToGo > 0 ? Math.ceil(poundsToGo / weeklyLossLb) : null;

  let summary: string;
  if (dailyDeficitKcal <= 0) {
    summary = "No deficit on this setting — no fat-loss trajectory.";
  } else if (poundsToGo <= 0) {
    summary = `Already at or near ${idealLabel}.`;
  } else if (currentBmi < OVERWEIGHT_BMI) {
    summary = `~${weeklyLossLb} lb/week toward ${idealLabel} (~${dailyDeficitKcal} kcal/day). BMI already under 25 — only if a clinician agrees.`;
  } else if (!estimatedWeeks) {
    summary = `~${weeklyLossLb} lb/week toward ${idealLabel}.`;
  } else if (estimatedWeeks > 104) {
    summary = `~${weeklyLossLb} lb/week → ${idealLabel} would take well over 2 years on this model.`;
  } else {
    const stores =
      altProteinMicros && targets.fatStores && targets.fatStores.excessLb > 0
        ? `${targets.fatStores.reservesShort}. `
        : "";
    summary = `${stores}~${weeklyLossLb} lb/week → ${idealLabel} in ~${estimatedWeeks} weeks (illustrative).`;
  }

  const category: WeightProgressForecast["current"]["category"] =
    currentBmi >= 30 ? "obesity" : currentBmi >= OVERWEIGHT_BMI ? "overweight" : "within_range";

  return {
    disclaimer: PROGRESS_DISCLAIMER,
    eligible: true,
    current: {
      weightLb,
      bmi: currentBmi,
      category,
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
    alternative: altProteinMicros,
    modifiersHint: altProteinMicros
      ? "Energy gap from fat stores; raise exercise burn below to speed the forecast. No calorie target on Alternative."
      : "Cut calories or add exercise burn, then update the forecast.",
  };
}
