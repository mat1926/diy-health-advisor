export type PlanId = "free" | "plus";

export const MEDICAL_DISCLAIMER = `VitalGauge provides general wellness information for educational and DIY self-tracking purposes only. It is not medical advice, diagnosis, or treatment, and it is not a substitute for professional care from a licensed clinician. Do not use this tool for emergencies. If you think you may be having a medical emergency, call your local emergency number. Always talk with a qualified healthcare professional before changing diet, exercise, medication, or treatment.`;

export const FREE_FIELDS = [
  "age",
  "sex",
  "heightCm",
  "weightKg",
  "activityLevel",
  "primaryGoal",
] as const;

export const PLUS_FIELDS = [
  ...FREE_FIELDS,
  "sleepHours",
  "stressLevel",
  "restingHeartRate",
  "stepsPerDay",
  "waterLiters",
  "notes",
] as const;

export type FreeField = (typeof FREE_FIELDS)[number];
export type PlusField = (typeof PLUS_FIELDS)[number];

export const PLAN_LIMITS = {
  free: {
    id: "free" as const,
    name: "Free",
    priceLabel: "$0",
    advicePerDay: 3,
    fields: FREE_FIELDS,
    features: [
      "Basic metrics (age, height, weight, activity, goal)",
      "Short AI wellness summary",
      "3 advice runs per day",
      "Always-visible medical disclaimer",
    ],
  },
  plus: {
    id: "plus" as const,
    name: "Plus",
    priceLabel: "$9/mo",
    advicePerDay: 50,
    fields: PLUS_FIELDS,
    features: [
      "Everything in Free",
      "Sleep, stress, heart rate, steps, hydration, notes",
      "Deeper, structured action plan",
      "50 advice runs per day",
      "Stripe Customer Portal (cancel anytime)",
    ],
  },
} as const;

export type MetricsInput = {
  age?: number;
  sex?: "female" | "male" | "other" | "prefer_not";
  heightCm?: number;
  weightKg?: number;
  activityLevel?: "sedentary" | "light" | "moderate" | "active" | "very_active";
  primaryGoal?: "energy" | "sleep" | "weight" | "strength" | "stress" | "general";
  sleepHours?: number;
  stressLevel?: number;
  restingHeartRate?: number;
  stepsPerDay?: number;
  waterLiters?: number;
  notes?: string;
};

export function fieldsForPlan(plan: PlanId): readonly string[] {
  return PLAN_LIMITS[plan].fields;
}

export function sanitizeMetrics(plan: PlanId, raw: Record<string, unknown>): MetricsInput {
  const allowed = new Set(fieldsForPlan(plan));
  const out: MetricsInput = {};

  const num = (key: string, min: number, max: number) => {
    if (!allowed.has(key)) return;
    const v = Number(raw[key]);
    if (Number.isFinite(v) && v >= min && v <= max) {
      (out as Record<string, number>)[key] = v;
    }
  };

  const str = <T extends string>(key: string, opts: readonly T[]) => {
    if (!allowed.has(key)) return;
    const v = String(raw[key] ?? "");
    if ((opts as readonly string[]).includes(v)) {
      (out as Record<string, string>)[key] = v;
    }
  };

  num("age", 13, 120);
  num("heightCm", 100, 250);
  num("weightKg", 30, 300);
  num("sleepHours", 0, 24);
  num("stressLevel", 1, 10);
  num("restingHeartRate", 30, 220);
  num("stepsPerDay", 0, 100_000);
  num("waterLiters", 0, 20);

  str("sex", ["female", "male", "other", "prefer_not"] as const);
  str("activityLevel", ["sedentary", "light", "moderate", "active", "very_active"] as const);
  str("primaryGoal", ["energy", "sleep", "weight", "strength", "stress", "general"] as const);

  if (allowed.has("notes") && typeof raw.notes === "string") {
    out.notes = raw.notes.trim().slice(0, 500);
  }

  return out;
}

export function requireBasicMetrics(m: MetricsInput): string | null {
  if (!m.age) return "Age is required.";
  if (!m.heightCm) return "Height is required.";
  if (!m.weightKg) return "Weight is required.";
  if (!m.activityLevel) return "Activity level is required.";
  if (!m.primaryGoal) return "Primary goal is required.";
  return null;
}

export function bmi(heightCm: number, weightKg: number): number {
  const m = heightCm / 100;
  return Math.round((weightKg / (m * m)) * 10) / 10;
}
