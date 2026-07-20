import { bmi, MEDICAL_DISCLAIMER, type MetricsInput, type PlanId } from "./plans";
import {
  LENS_DISCLAIMER,
  PERSPECTIVES,
  pickHabits,
  resolvePerspective,
  type PerspectiveId,
} from "./perspectives";

export type AdviceResult = {
  disclaimer: string;
  lensDisclaimer: string;
  perspective: { id: PerspectiveId; label: string; themes: string[] };
  summary: string;
  actions: string[];
  watchouts: string[];
  whenToSeekCare: string[];
  plan: PlanId;
  source: "ai" | "template";
};

function phNotes(m: MetricsInput, actions: string[], watchouts: string[]) {
  const saliva = m.salivaPh;
  const urine = m.urinePh;
  if (saliva == null && urine == null) return;

  actions.push(
    "DIY saliva/urine pH strips are educational self-tracking only — readings swing with food, hydration, and time of day.",
  );

  if (typeof saliva === "number") {
    if (saliva < 6.4) {
      actions.push(
        "Morning saliva reading on the lower side: many naturopathic stress-pattern kits suggest reviewing sleep, mineral-rich foods, and meal timing — then re-check the same time of day for a week.",
      );
    } else if (saliva > 7.2) {
      actions.push(
        "Saliva reading on the higher side: note recent meals, hydration, and oral hygiene; track patterns rather than reacting to a single strip.",
      );
    } else {
      actions.push(
        "Saliva pH in a commonly discussed mid-range for DIY kits — keep logging at a consistent time before changing many habits at once.",
      );
    }
  }

  if (typeof urine === "number") {
    if (urine < 6.0) {
      actions.push(
        "Urine pH on the acidic side of DIY strip ranges often reflects recent diet/hydration; focus on vegetables, hydration, and stress recovery rather than extreme “alkalizing” products.",
      );
    } else if (urine > 7.5) {
      watchouts.push(
        "Persistently high urine pH can have many causes (including infection). If you have pain, fever, or urinary symptoms, contact a clinician — do not self-treat from a strip.",
      );
    }
  }

  watchouts.push(
    "Home pH strips are not lab diagnostics and are not validated to diagnose disease or “acid body type.”",
  );
}

function templateAdvice(plan: PlanId, m: MetricsInput): AdviceResult {
  const bodyMass = m.heightCm && m.weightKg ? bmi(m.heightCm, m.weightKg) : null;
  const goal = m.primaryGoal ?? "general";
  const perspectiveId = resolvePerspective(m.perspective);
  const perspective = PERSPECTIVES[perspectiveId];
  const habitCount = plan === "plus" ? 4 : 2;

  const summaryParts = [
    `Using a ${perspective.shortName} DIY lens`,
    `metrics: age ${m.age ?? "n/a"}, activity ${m.activityLevel ?? "n/a"}, goal ${goal}`,
    bodyMass ? `BMI ≈ ${bodyMass}` : null,
    m.salivaPh != null || m.urinePh != null
      ? `DIY pH logged (saliva ${m.salivaPh ?? "—"}, urine ${m.urinePh ?? "—"})`
      : null,
    "educational wellness guidance only — not a diagnosis or endorsement of any clinician.",
  ].filter(Boolean);

  const actions: string[] = [...pickHabits(perspectiveId, habitCount)];
  const watchouts: string[] = [
    "Sudden chest pain, severe shortness of breath, fainting, confusion, or uncontrolled bleeding need emergency care.",
    "Do not start/stop prescription medication, herbs, or cleanses based on this tool alone.",
    LENS_DISCLAIMER,
  ];

  switch (goal) {
    case "energy":
      actions.push(
        "Keep a consistent wake time and get morning outdoor light for 10–20 minutes.",
        "Pair protein with your first meal; avoid relying only on sugar for mid-day energy.",
      );
      break;
    case "sleep":
      actions.push(
        "Dim screens 60 minutes before bed and keep the bedroom cool and dark.",
        "Limit caffeine after early afternoon; protect a fixed wind-down routine.",
      );
      break;
    case "weight":
      actions.push(
        "Track meals for 7 days without extreme restriction first — awareness before aggressive fasting.",
        "Emphasize protein-forward plates and walking; avoid crash cleanses marketed as fat loss.",
      );
      break;
    case "strength":
      actions.push(
        "Train 4–6 compound movements 2–3×/week and progress load when form is solid.",
        "Eat enough protein across meals; recovery and sleep are part of strength.",
      );
      break;
    case "stress":
      actions.push(
        "Practice 5 minutes of slow breathing daily and protect one recovery block weekly.",
        "If you use DIY pH strips for “stress patterns,” log them at the same time of day for trend-watching only.",
      );
      break;
    default:
      actions.push(
        "Walk most days and add two short strength sessions weekly.",
        "Change one habit at a time and review metrics weekly.",
      );
  }

  if (m.activityLevel === "sedentary" || m.activityLevel === "light") {
    actions.push("Break up long sitting with a 2–3 minute stand/walk every hour.");
  }

  if (plan === "plus") {
    phNotes(m, actions, watchouts);
    if (typeof m.sleepHours === "number" && m.sleepHours < 6) {
      actions.unshift("Prioritize sleep duration before aggressive fasting or hard training.");
      watchouts.push("Chronic short sleep can worsen mood, appetite regulation, and recovery.");
    }
    if (typeof m.stressLevel === "number" && m.stressLevel >= 8) {
      actions.unshift("Treat stress load as the primary lever this week — reduce optional intensity.");
    }
    if (typeof m.restingHeartRate === "number" && m.restingHeartRate > 100) {
      watchouts.push(
        "Elevated resting heart rate can have many causes; discuss persistent elevation with a clinician.",
      );
    }
    if (typeof m.waterLiters === "number" && m.waterLiters < 1.5) {
      actions.push("Nudge daily fluids upward gradually; pair water with each meal.");
    }
    if (m.notes) {
      actions.push(
        "Your notes are for self-tracking context — bring them to a licensed clinician, don’t self-diagnose.",
      );
    }
  }

  return {
    disclaimer: MEDICAL_DISCLAIMER,
    lensDisclaimer: LENS_DISCLAIMER,
    perspective: {
      id: perspective.id,
      label: perspective.label,
      themes: perspective.themes,
    },
    summary: summaryParts.join(" — ") + ".",
    actions: [...new Set(actions)].slice(0, plan === "plus" ? 10 : 5),
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

function buildPrompt(plan: PlanId, m: MetricsInput): string {
  const perspectiveId = resolvePerspective(m.perspective);
  const p = PERSPECTIVES[perspectiveId];
  return `You are a cautious DIY wellness coach for VitalGauge.
You MUST NOT diagnose, prescribe, cure, or claim to replace a licensed clinician.
Frame suggestions as educational habits inspired by themes often discussed in alternative/functional wellness education (${p.label}): ${p.themes.join("; ")}.
Never claim affiliation with Dr. Berg, Dr. Ekberg, Dr. Axe, Dr. Jockers, Dr. Clark, or Jane Oelke / Natural Choices.
If DIY saliva/urine pH is present, treat it as optional self-tracking for stress-pattern curiosity only — not disease diagnosis.
Return concise JSON only with keys: summary (string), actions (string[]), watchouts (string[]), whenToSeekCare (string[]).
Plan tier: ${plan}
Metrics JSON: ${JSON.stringify(m)}
Always include caution consistent with: ${MEDICAL_DISCLAIMER}
Also respect: ${LENS_DISCLAIMER}`;
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
              "You produce general wellness education only. Prefer food, sleep, stress, movement, and clean-living habits. Never invent clinical diagnoses from pH strips or alternative theories.",
          },
          { role: "user", content: buildPrompt(plan, m) },
        ],
      }),
    });

    if (!res.ok) return fallback;
    const data = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const content = data.choices?.[0]?.message?.content;
    if (!content) return fallback;

    const parsed = JSON.parse(content) as Partial<AdviceResult>;
    return {
      disclaimer: MEDICAL_DISCLAIMER,
      lensDisclaimer: LENS_DISCLAIMER,
      perspective: fallback.perspective,
      summary: typeof parsed.summary === "string" ? parsed.summary : fallback.summary,
      actions: Array.isArray(parsed.actions) ? parsed.actions.map(String).slice(0, 10) : fallback.actions,
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
