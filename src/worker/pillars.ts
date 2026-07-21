import { bmi, type MetricsInput, type PlanId } from "./plans";
import { resolvePerspective, type PerspectiveId } from "./perspectives";

export type PillarBlock = {
  focus: string;
  weeklyTarget: string;
  items: string[];
};

export type PillarsPlan = {
  horizon: "7-day";
  rest: PillarBlock;
  nutrition: PillarBlock;
  exercise: PillarBlock;
};

function recoveryLocked(m: MetricsInput): boolean {
  return (
    (typeof m.sleepHours === "number" && m.sleepHours < 6) ||
    (typeof m.stressLevel === "number" && m.stressLevel >= 8)
  );
}

function intensityPaused(m: MetricsInput): boolean {
  return recoveryLocked(m) || (typeof m.restingHeartRate === "number" && m.restingHeartRate > 100);
}

function buildRest(
  m: MetricsInput,
  perspective: PerspectiveId,
  plan: PlanId,
  locked: boolean,
): PillarBlock {
  const goal = m.primaryGoal ?? "general";
  const items: string[] = [];

  let focus = "Protect sleep opportunity and a steady daily rhythm.";
  let weeklyTarget =
    "7–9 hours in bed most nights · wake time within ±30 minutes · one 10-minute downshift daily";

  if (locked) {
    focus = "Recovery first — improve sleep/stress before new diet or hard training experiments.";
    weeklyTarget =
      "Prioritize sleep opportunity toward 7+ hours · daily calm practice · no optional intensity this week";
    items.push(
      "Treat rest as the primary lever: protect a consistent bedtime and wake time before changing food or workouts.",
      "Practice 5 minutes of slow breathing daily (about 4 seconds in, 6 seconds out).",
      "Schedule one non-negotiable recovery block on your calendar (no optional hard sessions).",
    );
    if (typeof m.sleepHours === "number" && m.sleepHours < 6) {
      items.push(
        `You logged ~${m.sleepHours}h sleep — pause aggressive fasting and hard intervals until average sleep is more stable.`,
      );
    }
    if (typeof m.stressLevel === "number" && m.stressLevel >= 8) {
      items.push(
        `Stress logged at ${m.stressLevel}/10 — cut late-night scrolling/news and keep evenings quieter.`,
      );
    }
  } else if (goal === "sleep") {
    focus = "Make sleep the main project this week.";
    items.push(
      "Dim screens 60 minutes before bed; keep the room cool and dark.",
      "Set a caffeine cutoff by early afternoon (roughly 8 hours before bedtime).",
      "Use the same wind-down order every night so your body recognizes “sleep is next.”",
    );
  } else if (goal === "stress") {
    focus = "Downshift the nervous system daily while keeping sleep protected.";
    items.push(
      "Protect 7–9 hours of sleep opportunity even when busy.",
      "Do a daily 5-minute breathing or quiet walk-without-phone practice.",
      "Block one recovery window this week with no optional intensity.",
    );
  } else if (goal === "strength") {
    focus = "Sleep is part of training — recovery enables progress.";
    weeklyTarget = "7–9 hours sleep opportunity · consistent bedtime · at least one full rest day";
    items.push(
      "Keep a fixed wake time and morning outdoor light for 10–20 minutes.",
      "Aim for 7–9 hours in bed on training and rest days alike.",
      "Take at least one full rest day; treat soreness and poor sleep as a signal to ease up.",
    );
  } else if (goal === "energy") {
    focus = "Stabilize circadian rhythm to support daytime energy.";
    items.push(
      "Keep a consistent wake time and get morning outdoor light for 10–20 minutes.",
      "Protect a wind-down hour before bed (dim lights, fewer screens).",
      "Avoid using late caffeine to “push through” — it usually steals tomorrow’s energy.",
    );
  } else {
    items.push(
      "Protect 7–9 hours in bed and a wake time within about 30 minutes each day.",
      "Get morning outdoor light for 10–20 minutes when possible.",
      "Dim screens in the hour before bed.",
    );
  }

  // Lens accents (no named clinicians in user-facing copy)
  switch (perspective) {
    case "cdc":
      items.push(
        "CDC-style note: most adults do better with at least 7 hours of sleep most nights.",
      );
      break;
    case "metabolic":
      items.push(
        locked
          ? "Alternative metabolic note: skip hard fasting while sleep/stress are strained — recovery first."
          : "Alternative metabolic note: only consider a gentle eating window after sleep feels steadier.",
      );
      break;
    case "fitness":
      items.push("Alternative fitness note: pair a fixed wake time with morning light for daily rhythm.");
      break;
    case "food_first":
      items.push("Alternative food-first note: keep a simple evening wind-down ritual you can repeat.");
      break;
    case "functional":
      items.push(
        "Alternative functional note: schedule a daily nervous-system downshift (breath, prayer, stretch, or quiet walk).",
      );
      break;
    case "clean_living":
      items.push(
        "Alternative clean-living note: quiet the sleep space — cooler, darker, fewer harsh chemical smells if practical.",
      );
      break;
    case "alternative":
      items.push("Alternative doctors note: protect recovery before stacking new diet experiments.");
      break;
    default:
      break;
  }

  if (typeof m.restingHeartRate === "number" && m.restingHeartRate > 100) {
    items.push(
      `Resting heart rate logged at ${m.restingHeartRate} — ease intensity and discuss persistent elevation with a clinician.`,
    );
  }

  if (typeof m.bpSystolic === "number" && typeof m.bpDiastolic === "number") {
    items.push(
      `Seated BP logged ${m.bpSystolic}/${m.bpDiastolic} — home readings are for tracking trends; confirm concerning patterns with a clinician.`,
    );
  }

  return {
    focus,
    weeklyTarget,
    items: unique(items).slice(0, plan === "plus" ? 6 : 4),
  };
}

function buildNutrition(
  m: MetricsInput,
  perspective: PerspectiveId,
  plan: PlanId,
  locked: boolean,
): PillarBlock {
  const goal = m.primaryGoal ?? "general";
  const bodyMass = m.heightCm && m.weightKg ? bmi(m.heightCm, m.weightKg) : null;
  const items: string[] = [];

  let focus = "Build simple, repeatable plates and steady hydration.";
  let weeklyTarget =
    "Protein at each meal · vegetables most days · water with meals · one fewer ultra-processed snack/day";

  items.push(
    "Build plates around protein + non-starchy vegetables, then add a whole-food carb or fat you tolerate.",
  );

  if (locked) {
    focus = "Keep nutrition steady and nourishing — no aggressive fasting or cleanses this week.";
    items.push(
      "Do not start intermittent fasting, crash diets, or cleanses while sleep/stress recovery is the priority.",
      "Keep meals regular enough that energy doesn’t crash; favor protein-forward plates.",
    );
  } else if (goal === "energy") {
    focus = "Steady blood sugar and protein-forward meals for daytime energy.";
    items.push(
      "Make your first meal protein-forward instead of relying on sugar alone.",
      "Cut sugary drinks; use water, herbal tea, or mineral water.",
    );
  } else if (goal === "weight") {
    focus = "Awareness first, then modest food-pattern changes — not a cleanse.";
    items.push(
      "Log meals for 7 days without extreme restriction first.",
      "Reduce ultra-processed snacks and sugary drinks; keep protein high enough to protect muscle.",
    );
  } else if (goal === "strength") {
    focus = "Fuel training with protein spread across the day.";
    weeklyTarget =
      "Protein at each meal · enough total food to train · water/electrolytes around harder sessions";
    items.push(
      "Spread protein across meals rather than one huge serving.",
      "Eat a protein-containing meal within a few hours after strength sessions.",
    );
  } else if (goal === "sleep" || goal === "stress") {
    focus = "Steady meals that support calm energy — avoid late heavy chaos.";
    items.push(
      "Keep dinner earlier when practical; avoid a huge late meal if sleep is a goal.",
      "Favor steady plates over grazing on sweets when stress is high.",
    );
  } else {
    items.push("Cook or assemble at least a few home meals this week with ingredients you recognize.");
  }

  if (bodyMass != null && bodyMass < 18.5) {
    items.push(
      "BMI is on the lower side in this DIY model — prioritize adequate food and protein; avoid further restriction.",
    );
  }
  if (bodyMass != null && bodyMass >= 30 && goal === "weight") {
    items.push(
      "Favor sustainable plate changes and walking over extreme short-term diets.",
    );
  }

  switch (perspective) {
    case "cdc":
      items.push(
        "CDC-style note: emphasize fruits, vegetables, and cutting back on added sugars and excess sodium.",
      );
      if (!locked) {
        items.push("Keep portions steady; focus on a sustainable eating pattern rather than a short cleanse.");
      }
      break;
    case "metabolic":
      if (!locked) {
        items.push(
          "Alternative metabolic note: if reducing refined carbs, add leafy greens and electrolytes — don’t crash calories overnight.",
        );
      }
      break;
    case "fitness":
      items.push("Alternative fitness note: swap one ultra-processed snack for a whole-food option most days.");
      break;
    case "food_first":
      items.push(
        "Alternative food-first note: cook ≥3 home meals this week; add a fermented food you tolerate if you like.",
      );
      break;
    case "functional":
      items.push(
        "Alternative functional note: build an anti-inflammatory plate — colorful plants, quality protein, olive oil or avocado.",
      );
      if (!locked) {
        items.push(
          "Optional gentle timing only if recovered (e.g. a mild 12:12 window) — stop if you feel unwell.",
        );
      }
      break;
    case "clean_living":
      items.push(
        "Alternative clean-living note: use filtered water if practical and simplify one pantry or personal-care product this week.",
      );
      break;
    case "alternative":
      items.push("Alternative doctors note: reduce sugary drinks and keep hydration steady through the day.");
      break;
    default:
      break;
  }

  if (m.salivaPh != null || m.urinePh != null || m.urineGlucose != null || m.urineNitrite != null) {
    items.push(
      "DIY saliva pH / Multistix urine pads are for self-tracking context only — use food/hydration notes, not self-diagnosis.",
    );
  }

  if (plan === "plus") {
    if (typeof m.waterLiters === "number" && m.waterLiters < 1.5) {
      items.push(`Water logged ~${m.waterLiters} L/day — nudge fluids up gradually with each meal.`);
    }
  }

  return {
    focus,
    weeklyTarget,
    items: unique(items).slice(0, plan === "plus" ? 6 : 4),
  };
}

function buildExercise(
  m: MetricsInput,
  perspective: PerspectiveId,
  plan: PlanId,
  paused: boolean,
): PillarBlock {
  const goal = m.primaryGoal ?? "general";
  const activity = m.activityLevel ?? "moderate";
  const items: string[] = [];

  let focus = "Move most days with a mix of walking and simple strength.";
  let weeklyTarget = "Walk most days · strength 2× · one rest day";

  if (paused) {
    focus = "Keep movement gentle while recovery metrics settle.";
    weeklyTarget = "Easy walks only · mobility/stretch · no hard intervals or max efforts";
    items.push(
      "Prefer easy walking and light mobility; skip HIIT, heavy PRs, and long grinding sessions.",
      "If you feel chest pain, dizziness, or unusual breathlessness — stop and seek care.",
    );
    if (typeof m.restingHeartRate === "number" && m.restingHeartRate > 100) {
      items.push("Elevated resting heart rate logged — pause intensity until discussed with a clinician if it persists.");
    }
  } else {
    switch (activity) {
      case "sedentary":
        focus = "Break up sitting and build a tiny daily walk habit.";
        weeklyTarget = "Hourly stand/walk breaks · 10–15 min walks daily · 1 light strength intro";
        items.push(
          "Stand or walk 2–3 minutes every hour you sit.",
          "Take a 10–15 minute easy walk most days (outdoors if possible).",
          "Try one light full-body session: sit-to-stand, wall push-ups, and a hip hinge — easy effort.",
        );
        break;
      case "light":
        focus = "Make walking daily and add two short strength sessions.";
        weeklyTarget = "Daily walk · strength 2× (20–30 min) · one easier day";
        items.push(
          "Walk most days for 20–30 minutes at an easy conversational pace.",
          "Do two full-body strength sessions (squat/hinge, push, pull, carry if available).",
        );
        break;
      case "moderate":
        focus = "Keep walking consistent and train strength 2–3 times.";
        weeklyTarget = "Walk most days · strength 2–3× · optional 1 easy cardio · 1 rest day";
        items.push(
          "Walk most days 20–40 minutes, or use short post-meal walks.",
          "Strength train 2–3× this week with 4–6 compound movements.",
          "Optional: one easy cardio session if you feel recovered.",
        );
        break;
      case "active":
        focus = "Maintain quality — add one strong session and protect a rest day.";
        weeklyTarget = "Keep weekly volume · 1 quality strength emphasis · 1 full rest day";
        items.push(
          "Keep your current walking/cardio base; don’t pile on random extra volume.",
          "Make one strength session the “quality” focus (good form, progressive load).",
          "Protect one full rest day for recovery.",
        );
        break;
      case "very_active":
        focus = "Deload noise — emphasize technique and recovery.";
        weeklyTarget = "Slightly easier week or technique focus · sleep protected · 1–2 true rest days";
        items.push(
          "Favor technique and moderate effort over adding more hard sessions.",
          "Keep at least one true rest day; use an easy walk if you need to move.",
        );
        break;
    }

    if (goal === "strength" && activity !== "sedentary") {
      items.push("Strength goal: progress load only when form is solid; sleep supports the plan.");
    }
    if (goal === "weight") {
      items.push("Weight goal: pair daily steps with strength work to help protect muscle.");
    }
    if (goal === "energy") {
      items.push("Energy goal: a morning or post-meal walk often helps more than an exhausting workout.");
    }
  }

  switch (perspective) {
    case "cdc":
      if (!paused) {
        weeklyTarget = "≥150 min moderate activity / week · strength 2+ days · break up long sitting";
        items.push(
          "CDC-style note: work toward 150 minutes of moderate activity this week (brisk walking counts).",
          "Include muscle-strengthening on at least 2 days.",
        );
      } else {
        items.push("CDC-style note: keep light walking if able; return to the 150-minute goal when recovered.");
      }
      break;
    case "metabolic":
      items.push("Alternative metabolic note: walking is a primary tool — keep it consistent.");
      break;
    case "fitness":
      items.push("Alternative fitness note: mix strength with easy aerobic work when recovered.");
      break;
    case "food_first":
      items.push("Alternative food-first note: prefer outdoor walks when weather allows.");
      break;
    case "functional":
      items.push("Alternative functional note: lift + walk beats random high-intensity add-ons when stressed.");
      break;
    case "clean_living":
      items.push("Alternative clean-living note: outdoor walking counts — avoid overtraining as a “fix.”");
      break;
    case "alternative":
      items.push("Alternative doctors note: walk most days and keep two simple strength sessions.");
      break;
    default:
      break;
  }

  if (plan === "plus" && typeof m.stepsPerDay === "number") {
    if (m.stepsPerDay < 4000) {
      items.push(`Steps logged ~${m.stepsPerDay}/day — nudge upward with short walks after meals.`);
    } else if (m.stepsPerDay >= 8000) {
      items.push(`Steps logged ~${m.stepsPerDay}/day — solid walking base; keep it and add strength if missing.`);
    }
  }

  return {
    focus,
    weeklyTarget,
    items: unique(items).slice(0, plan === "plus" ? 6 : 4),
  };
}

function unique(items: string[]): string[] {
  return [...new Set(items.filter(Boolean))];
}

/** Build Rest / Nutrition / Exercise plan after demographics (and optional Plus metrics). */
export function buildPillars(plan: PlanId, m: MetricsInput): PillarsPlan {
  const perspective = resolvePerspective(m.perspective);
  const locked = recoveryLocked(m);
  const paused = intensityPaused(m);

  return {
    horizon: "7-day",
    rest: buildRest(m, perspective, plan, locked),
    nutrition: buildNutrition(m, perspective, plan, locked),
    exercise: buildExercise(m, perspective, plan, paused),
  };
}

/** Flatten pillars into short “try this” bullets for compatibility. */
export function pillarsToActions(pillars: PillarsPlan, limit: number): string[] {
  const out = [
    `Rest — ${pillars.rest.focus}`,
    ...pillars.rest.items.slice(0, 1),
    `Nutrition — ${pillars.nutrition.focus}`,
    ...pillars.nutrition.items.slice(0, 1),
    `Exercise — ${pillars.exercise.focus}`,
    ...pillars.exercise.items.slice(0, 1),
  ];
  return unique(out).slice(0, limit);
}
