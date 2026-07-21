import { bmi, MEDICAL_DISCLAIMER, type MetricsInput, type PlanId } from "./plans";
import {
  estimateLifeExpectancy,
  LIFE_EXPECTANCY_DISCLAIMER,
  type LifeExpectancyEstimate,
} from "./lifeExpectancy";
import {
  LENS_DISCLAIMER,
  PERSPECTIVES,
  resolvePerspective,
  type PerspectiveId,
} from "./perspectives";
import {
  buildPillars,
  pillarsToActions,
  type PillarsPlan,
} from "./pillars";

export type AdviceResult = {
  disclaimer: string;
  lensDisclaimer: string;
  lifeExpectancyDisclaimer: string;
  perspective: { id: PerspectiveId; label: string; themes: string[] };
  lifeExpectancy: LifeExpectancyEstimate | null;
  /** Detailed 7-day DIY plan shown after demographics are submitted */
  pillars: PillarsPlan;
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

function templateAdvice(plan: PlanId, m: MetricsInput): AdviceResult {
  const bodyMass = m.heightCm && m.weightKg ? bmi(m.heightCm, m.weightKg) : null;
  const goal = m.primaryGoal ?? "general";
  const perspectiveId = resolvePerspective(m.perspective);
  const perspective = PERSPECTIVES[perspectiveId];
  const pillars = buildPillars(plan, m);
  const lifeExpectancy = estimateLifeExpectancy(m);

  const summaryParts = [
    `7-day DIY plan ready (Rest · Nutrition · Exercise)`,
    `${perspective.shortName} lens`,
    `age ${m.age ?? "n/a"}, activity ${m.activityLevel ?? "n/a"}, goal ${goal}`,
    bodyMass ? `BMI ≈ ${bodyMass}` : null,
    "educational only — not a diagnosis.",
  ].filter(Boolean);

  const watchouts: string[] = [
    "Sudden chest pain, severe shortness of breath, fainting, confusion, or uncontrolled bleeding need emergency care.",
    "Do not start/stop prescription medication, herbs, or cleanses based on this tool alone.",
    LENS_DISCLAIMER,
  ];

  if (plan === "plus") {
    phWatchouts(m, watchouts);
    if (typeof m.sleepHours === "number" && m.sleepHours < 6) {
      watchouts.push("Chronic short sleep can worsen mood, appetite regulation, and recovery.");
    }
    if (typeof m.restingHeartRate === "number" && m.restingHeartRate > 100) {
      watchouts.push(
        "Elevated resting heart rate can have many causes; discuss persistent elevation with a clinician.",
      );
    }
    if (m.notes) {
      watchouts.push(
        "Your notes are for self-tracking context — bring them to a licensed clinician, don’t self-diagnose.",
      );
    }
  }

  if (lifeExpectancy && lifeExpectancy.comparison.yearsVsIdeal < -1) {
    pillars.nutrition.items = uniquePush(
      pillars.nutrition.items,
      `Illustrative longevity gap vs ideal measurements: about ${Math.abs(lifeExpectancy.comparison.yearsVsIdeal)} years on this simple model — close it with sustainable habits, not crash diets.`,
    );
  }

  return {
    disclaimer: MEDICAL_DISCLAIMER,
    lensDisclaimer: LENS_DISCLAIMER,
    lifeExpectancyDisclaimer: LIFE_EXPECTANCY_DISCLAIMER,
    perspective: {
      id: perspective.id,
      label: perspective.label,
      themes: perspective.themes,
    },
    lifeExpectancy,
    pillars,
    summary: summaryParts.join(" — ") + ".",
    actions: pillarsToActions(pillars, plan === "plus" ? 8 : 6),
    watchouts: [...new Set(watchouts)].slice(0, 8),
    whenToSeekCare: [
      "New or worsening symptoms, unexplained weight change, chest pain, or mood crisis.",
      "Before pregnancy-related changes, surgery recovery, chronic disease management, or any cleanse/fast beyond gentle meal timing.",
      "Urinary pain, fever, or blood in urine — seek clinical care (DIY pH strips are not enough).",
    ],
    plan,
    source: "template",
  };
}

function uniquePush(items: string[], extra: string): string[] {
  return [...new Set([...items, extra])].slice(0, 6);
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
  return `You are a cautious DIY wellness coach for VitalGauge.
You MUST NOT diagnose, prescribe, cure, or claim to replace a licensed clinician.
The user just completed demographics/metrics. Return a 7-day educational plan under Rest, Nutrition, and Exercise.
Frame suggestions using themes often discussed in alternative/functional wellness education (${p.label}): ${p.themes.join("; ")}.
Never claim affiliation with Dr. Berg, Dr. Ekberg, Dr. Axe, Dr. Jockers, Dr. Clark, or Jane Oelke / Natural Choices.
If sleep < 6 or stress >= 8, prioritize Rest and keep Exercise easy; block aggressive fasting.
Do not invent life-expectancy numbers.
Return concise JSON with keys:
- summary (string)
- pillars: { rest: {focus, weeklyTarget, items[]}, nutrition: {focus, weeklyTarget, items[]}, exercise: {focus, weeklyTarget, items[]} }
- watchouts (string[])
- whenToSeekCare (string[])
You may refine this draft pillars JSON: ${JSON.stringify(pillars)}
Plan tier: ${plan}
Metrics JSON: ${JSON.stringify(m)}
Disclaimer context: ${MEDICAL_DISCLAIMER}
Lens: ${LENS_DISCLAIMER}`;
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
      lensDisclaimer: LENS_DISCLAIMER,
      lifeExpectancyDisclaimer: LIFE_EXPECTANCY_DISCLAIMER,
      perspective: fallback.perspective,
      lifeExpectancy: fallback.lifeExpectancy,
      pillars,
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
