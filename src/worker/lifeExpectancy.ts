import { bmi, type MetricsInput } from "./plans";

export const LIFE_EXPECTANCY_DISCLAIMER = `Illustrative only — not an actuarial or medical prediction. Genetics, history, and unmeasured factors matter more than this simple model.`;

/** Mid “healthy” BMI used for the ideal comparison (educational, not personalized). */
export const IDEAL_BMI = 22.5;

type SexKey = NonNullable<MetricsInput["sex"]> | "unknown";

/** Rough US-style period life expectancy at birth (years) — illustrative only. */
function baseExpectancyAtBirth(sex: SexKey): number {
  switch (sex) {
    case "female":
      return 81.1;
    case "male":
      return 75.8;
    case "other":
    case "unknown":
    default:
      return 78.4;
  }
}

function activityYears(level: MetricsInput["activityLevel"]): number {
  switch (level) {
    case "sedentary":
      return -3.2;
    case "light":
      return -1.4;
    case "moderate":
      return 0.4;
    case "active":
      return 1.8;
    case "very_active":
      return 2.2;
    default:
      return 0;
  }
}

function bmiYears(value: number | null): number {
  if (value == null) return 0;
  if (value < 18.5) return -2.0;
  if (value < 25) return 1.2; // educational “healthy range” bump
  if (value < 30) return -1.8;
  if (value < 35) return -4.0;
  if (value < 40) return -6.0;
  return -8.0;
}

function sleepYears(hours: number | undefined): number {
  if (hours == null) return 0;
  if (hours < 6) return -2.2;
  if (hours < 7) return -0.6;
  if (hours <= 9) return 1.0;
  return -0.5;
}

function stressYears(level: number | undefined): number {
  if (level == null) return 0;
  if (level >= 8) return -2.0;
  if (level >= 5) return -0.6;
  return 0.5;
}

function restingHrYears(hr: number | undefined): number {
  if (hr == null) return 0;
  if (hr > 100) return -1.5;
  if (hr > 85) return -0.6;
  if (hr >= 55 && hr <= 70) return 0.6;
  return 0;
}

function clampExpectedAge(age: number, expectedAge: number): number {
  // Never show an expected age of death younger than current age + 1
  return Math.max(age + 1, Math.round(expectedAge * 10) / 10);
}

export type LifeExpectancyEstimate = {
  disclaimer: string;
  method: string;
  current: {
    bmi: number | null;
    expectedAge: number;
    remainingYears: number;
    adjustmentsYears: number;
  };
  ideal: {
    label: string;
    bmi: number;
    idealWeightLb: number | null;
    expectedAge: number;
    remainingYears: number;
    assumptions: string[];
  };
  comparison: {
    yearsVsIdeal: number;
    summary: string;
  };
};

function expectedAgeFrom(
  age: number,
  sex: SexKey,
  adjustments: number,
): { expectedAge: number; remainingYears: number; base: number } {
  const base = baseExpectancyAtBirth(sex);
  // Simple aging compression: remaining shrinks as age rises, then lifestyle adj.
  const crudeRemaining = Math.max(3, base - age);
  const adjustedRemaining = Math.max(1, crudeRemaining + adjustments);
  const expectedAge = clampExpectedAge(age, age + adjustedRemaining);
  return {
    base,
    expectedAge,
    remainingYears: Math.round((expectedAge - age) * 10) / 10,
  };
}

export function estimateLifeExpectancy(m: MetricsInput): LifeExpectancyEstimate | null {
  if (!m.age || !m.heightCm || !m.weightKg) return null;

  const sex: SexKey = m.sex ?? "unknown";
  const currentBmi = bmi(m.heightCm, m.weightKg);

  const currentAdj =
    bmiYears(currentBmi) +
    activityYears(m.activityLevel) +
    sleepYears(m.sleepHours) +
    stressYears(m.stressLevel) +
    restingHrYears(m.restingHeartRate);

  const current = expectedAgeFrom(m.age, sex, currentAdj);

  // Ideal: same age/sex/height; BMI 22.5; active; sleep 8h; stress 3; RHR 62
  const idealWeightKg = IDEAL_BMI * (m.heightCm / 100) ** 2;
  const idealWeightLb = Math.round(idealWeightKg / 0.45359237);
  const idealAdj =
    bmiYears(IDEAL_BMI) +
    activityYears("active") +
    sleepYears(8) +
    stressYears(3) +
    restingHrYears(62);
  const ideal = expectedAgeFrom(m.age, sex, idealAdj);

  const yearsVsIdeal = Math.round((current.remainingYears - ideal.remainingYears) * 10) / 10;
  const absGap = Math.abs(yearsVsIdeal);

  let summary: string;
  if (absGap < 0.5) {
    summary = `About even with the ideal-measurements scenario (~${idealWeightLb} lb / BMI ${IDEAL_BMI}).`;
  } else if (yearsVsIdeal < 0) {
    summary = `About ${absGap} year${absGap === 1 ? "" : "s"} below ideal measurements (~${idealWeightLb} lb) — motivation signal, not a prediction.`;
  } else {
    summary = `About ${absGap} year${absGap === 1 ? "" : "s"} above ideal measurements on this simple model — still not a guarantee.`;
  }

  return {
    disclaimer: LIFE_EXPECTANCY_DISCLAIMER,
    method:
      "Educational model: rough US-style baseline by sex, minus age, plus small adjustments for BMI, activity, and optional sleep/stress/resting heart rate vs an ideal profile (BMI 22.5, active, ~8h sleep, low stress).",
    current: {
      bmi: currentBmi,
      expectedAge: current.expectedAge,
      remainingYears: current.remainingYears,
      adjustmentsYears: Math.round(currentAdj * 10) / 10,
    },
    ideal: {
      label: "Ideal DIY measurements (same age, sex, height)",
      bmi: IDEAL_BMI,
      idealWeightLb,
      expectedAge: ideal.expectedAge,
      remainingYears: ideal.remainingYears,
      assumptions: [
        `~${idealWeightLb} lb (BMI ${IDEAL_BMI}) · active · ~8h sleep · low stress · RHR ~62`,
      ],
    },
    comparison: {
      yearsVsIdeal,
      summary,
    },
  };
}
