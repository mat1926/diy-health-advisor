import { resolvePerspective, type PerspectiveId } from "./perspectives";

export type PlanId = "free" | "plus";

export const MEDICAL_DISCLAIMER = `VitalGauge provides general wellness information for educational and DIY self-tracking purposes only. It is not medical advice, diagnosis, or treatment, and it is not a substitute for professional care from a licensed clinician. Do not use this tool for emergencies. If you think you may be having a medical emergency, call your local emergency number. Always talk with a qualified healthcare professional before changing diet, exercise, medication, or treatment.`;

export const FREE_FIELDS = [
  "age",
  "sex",
  "heightCm",
  "weightKg",
  "activityLevel",
  "primaryGoal",
  "perspective",
  "restingHeartRate",
  "bpSystolic",
  "bpDiastolic",
  "standingBpSystolic",
  "standingBpDiastolic",
  "salivaPh",
  "urinePh",
  "urineGlucose",
  "urineBilirubin",
  "urineKetone",
  "urineSpecificGravity",
  "urineBlood",
  "urineProtein",
  "urineUrobilinogen",
  "urineNitrite",
  "urineLeukocytes",
] as const;

/** Siemens Multistix 10 SG–style pad readouts (educational DIY logging). */
export const URINE_PAD_LEVEL = ["negative", "trace", "small", "moderate", "large"] as const;
export const URINE_GLUCOSE = ["negative", "trace", "100", "250", "500", "1000"] as const;
export const URINE_PROTEIN = ["negative", "trace", "30", "100", "300", "2000"] as const;
export const URINE_UROBILINOGEN = ["0.2", "1", "2", "4", "8"] as const;
export const URINE_NITRITE = ["negative", "positive"] as const;

export type UrinePadLevel = (typeof URINE_PAD_LEVEL)[number];
export type UrineGlucose = (typeof URINE_GLUCOSE)[number];
export type UrineProtein = (typeof URINE_PROTEIN)[number];
export type UrineUrobilinogen = (typeof URINE_UROBILINOGEN)[number];
export type UrineNitrite = (typeof URINE_NITRITE)[number];

export const PLUS_FIELDS = [
  ...FREE_FIELDS,
  "sleepHours",
  "stressLevel",
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
      "Basic metrics (age, height ft/in, weight lbs, activity, goal)",
      "Vitals: resting HR, blood pressure, BP upon standing",
      "DIY saliva pH + Multistix 10 SG urine pads",
      "CDC-style or alternative-doctors plan styles",
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
      "Sleep, stress, steps, hydration, notes",
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
  perspective?: PerspectiveId;
  sleepHours?: number;
  stressLevel?: number;
  restingHeartRate?: number;
  bpSystolic?: number;
  bpDiastolic?: number;
  standingBpSystolic?: number;
  standingBpDiastolic?: number;
  stepsPerDay?: number;
  waterLiters?: number;
  salivaPh?: number;
  urinePh?: number;
  /** Multistix 10 SG pads (optional DIY strip log). */
  urineGlucose?: UrineGlucose;
  urineBilirubin?: UrinePadLevel;
  urineKetone?: UrinePadLevel;
  urineSpecificGravity?: number;
  urineBlood?: UrinePadLevel;
  urineProtein?: UrineProtein;
  urineUrobilinogen?: UrineUrobilinogen;
  urineNitrite?: UrineNitrite;
  urineLeukocytes?: UrinePadLevel;
  notes?: string;
};

export function fieldsForPlan(plan: PlanId): readonly string[] {
  return PLAN_LIMITS[plan].fields;
}

const LB_TO_KG = 0.45359237;
const IN_TO_CM = 2.54;

function parseNum(raw: unknown): number | undefined {
  const v = Number(raw);
  return Number.isFinite(v) ? v : undefined;
}

/** Prefer ft/in + lbs (US defaults); still accept cm/kg from older clients. */
export function resolveHeightWeight(raw: Record<string, unknown>): {
  heightCm?: number;
  weightKg?: number;
} {
  let heightCm: number | undefined;
  let weightKg: number | undefined;

  const ft = parseNum(raw.heightFt);
  const inches = parseNum(raw.heightIn);
  if (ft != null && inches != null && ft >= 3 && ft <= 8 && inches >= 0 && inches < 12) {
    const totalIn = ft * 12 + inches;
    if (totalIn >= 36 && totalIn <= 96) {
      heightCm = Math.round(totalIn * IN_TO_CM * 10) / 10;
    }
  }
  if (heightCm == null) {
    const cm = parseNum(raw.heightCm);
    if (cm != null && cm >= 100 && cm <= 250) heightCm = cm;
  }

  const lb = parseNum(raw.weightLb);
  if (lb != null && lb >= 66 && lb <= 660) {
    weightKg = Math.round(lb * LB_TO_KG * 10) / 10;
  }
  if (weightKg == null) {
    const kg = parseNum(raw.weightKg);
    if (kg != null && kg >= 30 && kg <= 300) weightKg = kg;
  }

  return { heightCm, weightKg };
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
  num("sleepHours", 0, 24);
  num("stressLevel", 1, 10);
  num("restingHeartRate", 30, 220);
  num("bpSystolic", 70, 250);
  num("bpDiastolic", 40, 150);
  num("standingBpSystolic", 70, 250);
  num("standingBpDiastolic", 40, 150);
  num("stepsPerDay", 0, 100_000);
  num("waterLiters", 0, 20);
  num("salivaPh", 4.5, 8.5);
  num("urinePh", 4.5, 9.0);
  num("urineSpecificGravity", 1.0, 1.04);

  str("urineGlucose", URINE_GLUCOSE);
  str("urineBilirubin", URINE_PAD_LEVEL);
  str("urineKetone", URINE_PAD_LEVEL);
  str("urineBlood", URINE_PAD_LEVEL);
  str("urineProtein", URINE_PROTEIN);
  str("urineUrobilinogen", URINE_UROBILINOGEN);
  str("urineNitrite", URINE_NITRITE);
  str("urineLeukocytes", URINE_PAD_LEVEL);

  if (allowed.has("heightCm") || allowed.has("weightKg")) {
    const { heightCm, weightKg } = resolveHeightWeight(raw);
    if (heightCm != null) out.heightCm = heightCm;
    if (weightKg != null) out.weightKg = weightKg;
  }

  str("sex", ["female", "male", "other", "prefer_not"] as const);
  str("activityLevel", ["sedentary", "light", "moderate", "active", "very_active"] as const);
  str("primaryGoal", ["energy", "sleep", "weight", "strength", "stress", "general"] as const);

  if (allowed.has("perspective")) {
    out.perspective = resolvePerspective(raw.perspective);
  }

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
