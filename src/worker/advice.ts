import { bmi, MEDICAL_DISCLAIMER, type MetricsInput, type PlanId } from "./plans";

export type AdviceResult = {
  disclaimer: string;
  summary: string;
  actions: string[];
  watchouts: string[];
  whenToSeekCare: string[];
  plan: PlanId;
  source: "ai" | "template";
};

function templateAdvice(plan: PlanId, m: MetricsInput): AdviceResult {
  const bodyMass = m.heightCm && m.weightKg ? bmi(m.heightCm, m.weightKg) : null;
  const goal = m.primaryGoal ?? "general";

  const summaryParts = [
    `Based on the metrics you entered (age ${m.age ?? "n/a"}, activity: ${m.activityLevel ?? "n/a"}, goal: ${goal})`,
    bodyMass ? `your calculated BMI is about ${bodyMass}` : null,
    "here is general wellness guidance for DIY self-tracking — not a diagnosis.",
  ].filter(Boolean);

  const actions: string[] = [];
  const watchouts: string[] = [
    "Sudden chest pain, severe shortness of breath, fainting, confusion, or uncontrolled bleeding need emergency care.",
    "Do not start/stop prescription medication based on this tool.",
  ];

  switch (goal) {
    case "energy":
      actions.push(
        "Keep a consistent wake time and get morning outdoor light for 10–20 minutes.",
        "Pair protein with breakfast and avoid long gaps without food if energy crashes mid-day.",
        "Schedule one short walk after your largest meal.",
      );
      break;
    case "sleep":
      actions.push(
        "Dim screens 60 minutes before bed and keep the bedroom cool and dark.",
        "Limit caffeine after early afternoon.",
        "Use a fixed wind-down routine (same order every night).",
      );
      break;
    case "weight":
      actions.push(
        "Track meals for 7 days without changing anything first — awareness before restriction.",
        "Aim for a modest calorie deficit via protein-forward plates and walking, not crash diets.",
        "Lift or do resistance work 2–3×/week to protect muscle.",
      );
      break;
    case "strength":
      actions.push(
        "Pick 4–6 compound movements and progress load weekly when form is solid.",
        "Sleep 7–9 hours when possible; recovery is part of training.",
        "Eat enough protein across the day (spread over meals).",
      );
      break;
    case "stress":
      actions.push(
        "Practice 5 minutes of slow breathing (e.g. 4s in / 6s out) once daily.",
        "Protect one non-negotiable recovery block on your calendar each week.",
        "Cut late-night news/scrolling if it spikes rumination.",
      );
      break;
    default:
      actions.push(
        "Walk most days and add two short strength sessions weekly.",
        "Drink water steadily; use pale-yellow urine as a simple check.",
        "Review your metrics weekly and change one habit at a time.",
      );
  }

  if (m.activityLevel === "sedentary" || m.activityLevel === "light") {
    actions.push("Break up long sitting with a 2–3 minute stand/walk every hour.");
  }

  if (plan === "plus") {
    if (typeof m.sleepHours === "number" && m.sleepHours < 6) {
      actions.unshift("Prioritize sleep duration before adding intense training volume.");
      watchouts.push("Chronic very short sleep can worsen mood, appetite regulation, and recovery.");
    }
    if (typeof m.stressLevel === "number" && m.stressLevel >= 8) {
      actions.unshift("Treat stress load as a primary lever this week — reduce optional intensity.");
    }
    if (typeof m.restingHeartRate === "number" && m.restingHeartRate > 100) {
      watchouts.push("Elevated resting heart rate can have many causes; discuss persistent elevation with a clinician.");
    }
    if (typeof m.waterLiters === "number" && m.waterLiters < 1.5) {
      actions.push("Nudge daily fluids upward gradually; pair water with each meal.");
    }
    if (m.notes) {
      actions.push("You added personal notes — use them as context for your next clinician visit, not as a self-diagnosis checklist.");
    }
  }

  return {
    disclaimer: MEDICAL_DISCLAIMER,
    summary: summaryParts.join(" — ") + ".",
    actions: actions.slice(0, plan === "plus" ? 8 : 4),
    watchouts,
    whenToSeekCare: [
      "New or worsening symptoms, unexplained weight change, chest pain, or mood crisis.",
      "Before pregnancy-related changes, surgery recovery, or if you have chronic disease.",
    ],
    plan,
    source: "template",
  };
}

function buildPrompt(plan: PlanId, m: MetricsInput): string {
  return `You are a cautious wellness coach for a DIY self-tracking app called VitalGauge.
You MUST NOT diagnose, prescribe, or claim to replace a doctor.
Return concise JSON only with keys: summary (string), actions (string[]), watchouts (string[]), whenToSeekCare (string[]).
Tone: practical, non-alarmist, DIY-friendly.
Plan tier: ${plan}
Metrics JSON: ${JSON.stringify(m)}
Always assume the user will also read this disclaimer: ${MEDICAL_DISCLAIMER}`;
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
              "You produce general wellness education only. Never claim medical certainty. Prefer lifestyle habits over clinical claims.",
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
      summary: typeof parsed.summary === "string" ? parsed.summary : fallback.summary,
      actions: Array.isArray(parsed.actions) ? parsed.actions.map(String).slice(0, 8) : fallback.actions,
      watchouts: Array.isArray(parsed.watchouts)
        ? parsed.watchouts.map(String).slice(0, 6)
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
