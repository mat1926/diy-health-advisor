import { bmi, MEDICAL_DISCLAIMER, type MetricsInput, type PlanId } from "./plans";
import {
  estimateLifeExpectancy,
  LIFE_EXPECTANCY_DISCLAIMER,
  type LifeExpectancyEstimate,
} from "./lifeExpectancy";
import {
  lensDisclaimerFor,
  PERSPECTIVES,
  CDC_NOTE,
  resolvePerspective,
  type PerspectiveId,
} from "./perspectives";
import {
  buildPillars,
  pillarsToActions,
  type PillarsPlan,
} from "./pillars";
import {
  buildDetailedTargets,
  targetsDisclaimerFor,
  type DetailedTargets,
} from "./targets";
import {
  buildNutritionKitPlan,
  NUTRITION_KIT_DISCLAIMER,
  type NutritionKitPlan,
} from "./nutritionKit";
import {
  buildWeightProgressForecast,
  PROGRESS_DISCLAIMER,
  type WeightProgressForecast,
} from "./progressForecast";
import {
  buildDetailedFoodPlan,
  FOOD_PLAN_DISCLAIMER,
  type DetailedFoodPlan,
} from "./foodPlan";
import {
  buildDoctorMetricReview,
  DOCTOR_DB_DISCLAIMER,
  resolveDoctorFilter,
  type DoctorMetricReview,
} from "./doctorMetricsDb";

export type AdviceResult = {
  disclaimer: string;
  lensDisclaimer: string;
  lifeExpectancyDisclaimer: string;
  targetsDisclaimer: string;
  nutritionKitDisclaimer: string;
  foodPlanDisclaimer: string;
  progressDisclaimer: string;
  doctorDbDisclaimer: string;
  perspective: { id: PerspectiveId; label: string; themes: string[] };
  lifeExpectancy: LifeExpectancyEstimate | null;
  /** Detailed 7-day DIY plan shown after demographics are submitted */
  pillars: PillarsPlan;
  /** Numeric sleep / calorie / exercise / nutrition targets */
  targets: DetailedTargets | null;
  /** Concrete plan using the Amazon whey/shaker/multi/D3 kit */
  nutritionKit: NutritionKitPlan | null;
  /** Full-day food menu meeting macros with kit as base */
  foodPlan: DetailedFoodPlan | null;
  /** Shown when BMI ≥ 25 — projected loss + modifier hints */
  weightProgress: WeightProgressForecast | null;
  /** Per-doctor recommendations matched to detected metric findings */
  doctorReview: DoctorMetricReview | null;
  summary: string;
  actions: string[];
  watchouts: string[];
  whenToSeekCare: string[];
  plan: PlanId;
  source: "ai" | "template";
};

function phWatchouts(m: MetricsInput, watchouts: string[]) {
  if (m.salivaPh == null && m.urinePh == null) return;
  watchouts.push(
    "Home pH strips are not lab diagnostics and are not validated to diagnose disease or “acid body type.”",
  );
  if (typeof m.urinePh === "number" && m.urinePh > 7.5) {
    watchouts.push(
      "Persistently high urine pH can have many causes (including infection). If you have pain, fever, or urinary symptoms, contact a clinician.",
    );
  }
}

function multistixWatchouts(m: MetricsInput, watchouts: string[]) {
  const hasAny =
    m.urineGlucose != null ||
    m.urineBilirubin != null ||
    m.urineKetone != null ||
    m.urineSpecificGravity != null ||
    m.urineBlood != null ||
    m.urineProtein != null ||
    m.urineUrobilinogen != null ||
    m.urineNitrite != null ||
    m.urineLeukocytes != null ||
    m.urinePh != null;
  if (!hasAny) return;

  watchouts.push(
    "Multistix-style urine pads are DIY self-tracking only — not a lab urinalysis or diagnosis. Follow the bottle timing/color chart; abnormal pads warrant clinician follow-up.",
  );

  if (m.urineNitrite === "positive" || (m.urineLeukocytes && m.urineLeukocytes !== "negative")) {
    watchouts.push(
      "Leukocyte and/or nitrite pads that are not negative can accompany urinary infection symptoms — seek clinical care for pain, fever, or blood in urine.",
    );
  }
  if (m.urineBlood && m.urineBlood !== "negative") {
    watchouts.push(
      "Blood on a home urine strip needs clinical evaluation (especially with pain, fever, or visible blood) — this app does not diagnose hematuria.",
    );
  }
  if (m.urineGlucose && m.urineGlucose !== "negative") {
    watchouts.push(
      "Glucose on a urine strip is educational context only; discuss with a clinician, especially if you have diabetes risk, thirst, or unexplained weight change.",
    );
  }
  if (m.urineProtein && m.urineProtein !== "negative" && m.urineProtein !== "trace") {
    watchouts.push(
      "Protein beyond trace on DIY strips should be confirmed clinically — many benign and serious causes exist.",
    );
  }
  if (m.urineBilirubin && m.urineBilirubin !== "negative") {
    watchouts.push(
      "Bilirubin on a urine strip is not normal on many charts — ask a clinician, especially with dark urine or jaundice concerns.",
    );
  }
  if (m.urineUrobilinogen && m.urineUrobilinogen !== "0.2" && m.urineUrobilinogen !== "1") {
    watchouts.push(
      "Higher urobilinogen pad readings are worth mentioning to a clinician with your full strip log.",
    );
  }
  if (m.urineKetone && m.urineKetone !== "negative" && m.urineKetone !== "trace") {
    watchouts.push(
      "Moderate/large ketones on DIY strips can have many contexts (low-carb diet, illness, fasting). Seek urgent care if you feel very ill, vomiting, or confused.",
    );
  }
  if (typeof m.urineSpecificGravity === "number" && m.urineSpecificGravity >= 1.03) {
    watchouts.push(
      "Very concentrated urine SG on a strip often tracks low fluid intake — nudge hydration unless a clinician has other guidance.",
    );
  }
}

function vitalsWatchouts(m: MetricsInput, watchouts: string[]) {
  if (typeof m.restingHeartRate === "number" && m.restingHeartRate > 100) {
    watchouts.push(
      "Elevated resting heart rate can have many causes; discuss persistent elevation with a clinician.",
    );
  }
  if (typeof m.bpSystolic === "number" && m.bpSystolic >= 180) {
    watchouts.push(
      "Very high home systolic readings need prompt clinical attention — especially with chest pain, weakness, or vision changes.",
    );
  } else if (typeof m.bpSystolic === "number" && m.bpSystolic >= 140) {
    watchouts.push(
      "Home systolic readings in a higher range should be confirmed and discussed with a clinician; this app does not diagnose hypertension.",
    );
  }
  if (
    typeof m.bpSystolic === "number" &&
    typeof m.standingBpSystolic === "number" &&
    m.bpSystolic - m.standingBpSystolic >= 20
  ) {
    watchouts.push(
      "A sizable drop in systolic BP from seated to standing on home checks can matter if you feel dizzy or faint — sit/lie down and seek care if symptoms are severe; ask a clinician about orthostatic evaluation.",
    );
  }
  if (
    typeof m.bpDiastolic === "number" &&
    typeof m.standingBpDiastolic === "number" &&
    m.bpDiastolic - m.standingBpDiastolic >= 10
  ) {
    watchouts.push(
      "A drop in diastolic BP upon standing on home checks is worth mentioning to a clinician if you have lightheadedness.",
    );
  }
}

function templateAdvice(plan: PlanId, m: MetricsInput): AdviceResult {
  const bodyMass = m.heightCm && m.weightKg ? bmi(m.heightCm, m.weightKg) : null;
  const perspectiveId = resolvePerspective(m.perspective);
  const perspective = PERSPECTIVES[perspectiveId];
  const pillars = buildPillars(plan, m);
  const targets = buildDetailedTargets(m);
  const nutritionKit = buildNutritionKitPlan(m, targets);
  const foodPlan = buildDetailedFoodPlan(m, targets);
  const weightProgress = buildWeightProgressForecast(m, targets);
  const doctorReview =
    perspectiveId === "cdc"
      ? null
      : buildDoctorMetricReview(m, resolveDoctorFilter(m.reviewDoctor ?? "all"));
  const lifeExpectancy = estimateLifeExpectancy(m);

  const summaryParts = [
    "7-day DIY plan ready",
    nutritionKit
      ? `~${nutritionKit.daily.wheyScoops} whey scoop(s) · multi · D3 · vitals kit`
      : null,
    weightProgress
      ? `~${weightProgress.pace.weeklyLossLb} lb/week pace`
      : null,
    targets?.fatStores?.excessLb ? targets.fatStores.reservesShort : null,
    doctorReview
      ? `metric review: ${pluralCount(doctorReview.findings.length, "finding")} · ${pluralCount(doctorReview.summaries.length, "summary", "summaries")}`
      : null,
    targets
      ? targets.priorityFocus === "alt_protein_micros"
        ? `protein ${targets.macros.proteinG}g · micros`
        : `${targets.calories.dailyTarget} kcal · protein ${targets.macros.proteinG}g`
      : null,
    `${perspective.shortName} · age ${m.age ?? "n/a"} · ${m.activityLevel ?? "n/a"} activity`,
    bodyMass ? `BMI ≈ ${bodyMass}` : null,
    "educational only",
  ].filter(Boolean);

  const watchouts: string[] = [
    "Emergency: sudden chest pain, severe shortness of breath, fainting, confusion, or uncontrolled bleeding — call your local emergency number.",
    "Do not start/stop prescription medication, herbs, or cleanses based on this tool alone.",
  ];
  if (perspectiveId === "cdc") {
    watchouts.push(CDC_NOTE);
  }

  phWatchouts(m, watchouts);
  multistixWatchouts(m, watchouts);
  vitalsWatchouts(m, watchouts);

  if (plan === "plus") {
    if (typeof m.sleepHours === "number" && m.sleepHours < 6) {
      watchouts.push("Chronic short sleep can worsen mood, appetite regulation, and recovery.");
    }
    if (m.notes) {
      watchouts.push(
        "Your notes are for self-tracking context — bring them to a licensed clinician, don’t self-diagnose.",
      );
    }
  }

  if (lifeExpectancy && lifeExpectancy.comparison.yearsVsIdeal < -1) {
    pillars.exercise.items = uniquePush(
      pillars.exercise.items,
      `Illustrative longevity gap vs ideal: about ${Math.abs(lifeExpectancy.comparison.yearsVsIdeal)} years on this model — close it with sustainable habits.`,
    );
  }

  if (targets) {
    pillars.rest.weeklyTarget = `Sleep ${targets.sleep.hoursTarget}h (band ${targets.sleep.hoursMin}–${targets.sleep.hoursMax}) · wake ±30 min · daily downshift`;
    pillars.nutrition.weeklyTarget =
      targets.priorityFocus === "alt_protein_micros"
        ? `PROTEIN ${targets.macros.proteinG}g · vitamins/minerals/AA · carbs/fat flexible (see weight forecast for store-draw)`
        : `${targets.calories.dailyTarget} kcal · protein ${targets.macros.proteinG}g · carbs ${targets.macros.carbsG}g · fat ${targets.macros.fatG}g · water ~${targets.macros.waterLiters}L`;
    pillars.exercise.weeklyTarget = `~${targets.exercise.dailyBurnTargetKcal} kcal/day movement burn · ~${targets.exercise.weeklyBurnTargetKcal} kcal/week`;
  }

  if (nutritionKit && nutritionKit.daily.wheyScoops > 0) {
    pillars.nutrition.items = uniquePush(
      pillars.nutrition.items,
      `Nutrition Kit: about ${nutritionKit.daily.wheyScoops} whey scoop(s)/day in the Strada to help reach ~${nutritionKit.daily.proteinTargetG}g protein.`,
    );
  }
  if (nutritionKit) {
    pillars.nutrition.items = uniquePush(
      pillars.nutrition.items,
      "Vitamin D3 (kit) included — stop if overload signs appear (see safety list).",
    );
  }

  return {
    disclaimer: MEDICAL_DISCLAIMER,
    lensDisclaimer: lensDisclaimerFor(perspectiveId),
    lifeExpectancyDisclaimer: LIFE_EXPECTANCY_DISCLAIMER,
    targetsDisclaimer: targetsDisclaimerFor(perspectiveId),
    nutritionKitDisclaimer: NUTRITION_KIT_DISCLAIMER,
    foodPlanDisclaimer: FOOD_PLAN_DISCLAIMER,
    progressDisclaimer: PROGRESS_DISCLAIMER,
    doctorDbDisclaimer: DOCTOR_DB_DISCLAIMER,
    perspective: {
      id: perspective.id,
      label: perspective.label,
      themes: perspective.themes,
    },
    lifeExpectancy,
    pillars,
    targets,
    nutritionKit,
    foodPlan,
    weightProgress,
    doctorReview,
    summary: summaryParts.join(" · ") + ".",
    actions: pillarsToActions(pillars, plan === "plus" ? 8 : 6),
    watchouts: [...new Set(watchouts)].slice(0, 6),
    whenToSeekCare: [
      "Seek care for new/worsening symptoms, unexplained weight change, chest pain, mood crisis, or urinary pain/fever/blood in urine.",
      "Ask a clinician before high-dose vitamin D or iron multis if you have kidney disease, hypercalcemia, or hemochromatosis risk — and before pregnancy-related changes, surgery recovery, or aggressive cleanses/fasts.",
    ],
    plan,
    source: "template",
  };
}

function uniquePush(items: string[], extra: string): string[] {
  return [...new Set([...items, extra])].slice(0, 6);
}

function pluralCount(n: number, singular: string, plural?: string): string {
  const p = plural ?? `${singular}s`;
  return `${n} ${n === 1 ? singular : p}`;
}

function parsePillar(
  raw: unknown,
  fallback: PillarsPlan["rest"],
): PillarsPlan["rest"] {
  if (!raw || typeof raw !== "object") return fallback;
  const o = raw as Record<string, unknown>;
  return {
    focus: typeof o.focus === "string" ? o.focus : fallback.focus,
    weeklyTarget: typeof o.weeklyTarget === "string" ? o.weeklyTarget : fallback.weeklyTarget,
    items: Array.isArray(o.items) ? o.items.map(String).slice(0, 6) : fallback.items,
  };
}

function buildPrompt(plan: PlanId, m: MetricsInput, pillars: PillarsPlan): string {
  const perspectiveId = resolvePerspective(m.perspective);
  const p = PERSPECTIVES[perspectiveId];
  const cdcOnly =
    perspectiveId === "cdc"
      ? `This is a CDC-style plan — you may use CDC-style habit themes (150 min activity, produce-forward plates, 7+ sleep, limit added sugar/sodium).`
      : `This is an ALTERNATIVE plan — do NOT use CDC guidelines, CDC activity minutes (150), Dietary Guidelines plate patterns, or CDC sleep slogans. Use only the alternative themes listed. Prefer lower refined carbs, protein-forward plates, walking, and recovery.`;
  return `You are a cautious DIY wellness coach for VitalGauge.
You MUST NOT diagnose, prescribe, cure, or claim to replace a licensed clinician.
The user just completed demographics/metrics. Return a 7-day educational plan under Rest, Nutrition, and Exercise.
Frame suggestions using educational themes (${p.label}): ${p.themes.join("; ")}.
${cdcOnly}
Do not name private clinicians. Never claim affiliation with the CDC or any private clinician.
If sleep < 6 or stress >= 8, prioritize Rest and keep Exercise easy; block aggressive fasting.
Do not invent life-expectancy numbers or numeric nutrient targets; the app computes those separately.
Return concise JSON with keys:
- summary (string)
- pillars: { rest: {focus, weeklyTarget, items[]}, nutrition: {focus, weeklyTarget, items[]}, exercise: {focus, weeklyTarget, items[]} }
- watchouts (string[])
- whenToSeekCare (string[])
You may refine this draft pillars JSON: ${JSON.stringify(pillars)}
Plan tier: ${plan}
Metrics JSON: ${JSON.stringify(m)}
Disclaimer context: ${MEDICAL_DISCLAIMER}
Lens: ${lensDisclaimerFor(perspectiveId)}`;
}

export async function generateAdvice(
  plan: PlanId,
  m: MetricsInput,
  openaiKey?: string,
): Promise<AdviceResult> {
  const fallback = templateAdvice(plan, m);
  if (!openaiKey) return fallback;

  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${openaiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4.1-mini",
        temperature: 0.4,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content:
              "You produce general wellness education only as Rest, Nutrition, and Exercise plans. Never invent clinical diagnoses from pH strips or alternative theories.",
          },
          { role: "user", content: buildPrompt(plan, m, fallback.pillars) },
        ],
      }),
    });

    if (!res.ok) return fallback;
    const data = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const content = data.choices?.[0]?.message?.content;
    if (!content) return fallback;

    const parsed = JSON.parse(content) as Partial<AdviceResult> & {
      pillars?: Partial<PillarsPlan>;
    };

    const pillars: PillarsPlan = {
      horizon: "7-day",
      rest: parsePillar(parsed.pillars?.rest, fallback.pillars.rest),
      nutrition: parsePillar(parsed.pillars?.nutrition, fallback.pillars.nutrition),
      exercise: parsePillar(parsed.pillars?.exercise, fallback.pillars.exercise),
    };

    return {
      disclaimer: MEDICAL_DISCLAIMER,
      lensDisclaimer: fallback.lensDisclaimer,
      lifeExpectancyDisclaimer: LIFE_EXPECTANCY_DISCLAIMER,
      targetsDisclaimer: fallback.targetsDisclaimer,
      nutritionKitDisclaimer: NUTRITION_KIT_DISCLAIMER,
      foodPlanDisclaimer: FOOD_PLAN_DISCLAIMER,
      progressDisclaimer: PROGRESS_DISCLAIMER,
      doctorDbDisclaimer: DOCTOR_DB_DISCLAIMER,
      perspective: fallback.perspective,
      lifeExpectancy: fallback.lifeExpectancy,
      pillars,
      targets: fallback.targets,
      nutritionKit: fallback.nutritionKit,
      foodPlan: fallback.foodPlan,
      weightProgress: fallback.weightProgress,
      doctorReview: fallback.doctorReview,
      summary: typeof parsed.summary === "string" ? parsed.summary : fallback.summary,
      actions: pillarsToActions(pillars, plan === "plus" ? 8 : 6),
      watchouts: Array.isArray(parsed.watchouts)
        ? parsed.watchouts.map(String).slice(0, 8)
        : fallback.watchouts,
      whenToSeekCare: Array.isArray(parsed.whenToSeekCare)
        ? parsed.whenToSeekCare.map(String).slice(0, 4)
        : fallback.whenToSeekCare,
      plan,
      source: "ai",
    };
  } catch {
    return fallback;
  }
}
