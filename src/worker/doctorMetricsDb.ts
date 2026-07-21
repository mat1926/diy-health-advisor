/**
 * Educational doctor × metric recommendation DB.
 * Themes are inspired by publicly discussed alternative-wellness patterns.
 * VitalGauge is NOT affiliated with any named clinician. Not medical advice.
 */

import { bmi, type MetricsInput } from "./plans";
import type { PerspectiveId } from "./perspectives";

export const DOCTOR_DB_DISCLAIMER = `These alternative-blend notes are educational summaries of common wellness themes (metabolic, fitness, food-first, functional, clean-living). They are not quotes, protocols, or endorsements from any clinician or private practice. Home BP and pH readings are not diagnoses. Seek licensed care for high blood pressure, dizziness on standing, or unexplained symptoms.`;

export type DoctorId = "berg" | "ekberg" | "axe" | "jockers" | "clark";

export type MetricKey =
  | "high_bp_seated"
  | "orthostatic_bp_drop"
  | "low_saliva_ph"
  | "high_urine_ph"
  | "elevated_rhr"
  | "overweight_bmi"
  | "short_sleep"
  | "high_stress";

export type DoctorProfile = {
  /** Internal processing id — never show this name in user UI. */
  id: DoctorId;
  /** User-facing theme label (no clinician names). */
  displayName: string;
  lensId: PerspectiveId;
  shortFocus: string;
};

export const DOCTORS: Record<DoctorId, DoctorProfile> = {
  berg: {
    id: "berg",
    displayName: "Metabolic / lower-carb themes",
    lensId: "metabolic",
    shortFocus: "Electrolytes, insulin, lower refined carbs",
  },
  ekberg: {
    id: "ekberg",
    displayName: "Metabolic fitness themes",
    lensId: "fitness",
    shortFocus: "Insulin sensitivity, walking, meal composition",
  },
  axe: {
    id: "axe",
    displayName: "Food-first / gut themes",
    lensId: "food_first",
    shortFocus: "Nutrient-dense foods, gut support, kitchen staples",
  },
  jockers: {
    id: "jockers",
    displayName: "Functional nutrition themes",
    lensId: "functional",
    shortFocus: "Inflammation load, stress, anti-inflammatory plates",
  },
  clark: {
    id: "clark",
    displayName: "Clean living / DIY hygiene themes",
    lensId: "clean_living",
    shortFocus: "Environment, water quality, simple DIY tracking",
  },
};

export type DoctorMetricRec = {
  doctorId: DoctorId;
  metricKey: MetricKey;
  title: string;
  recommendation: string;
  lifestyle: string[];
  caution: string;
};

/** Core DB: one row per doctor × metric (educational). */
export const DOCTOR_METRIC_DB: DoctorMetricRec[] = [
  // —— High seated BP ——
  {
    doctorId: "berg",
    metricKey: "high_bp_seated",
    title: "High home BP — metabolic / electrolyte lens",
    recommendation:
      "Emphasize lowering refined carbs and supporting electrolytes (especially potassium-rich foods and adequate magnesium from food) while a clinician evaluates the BP pattern. Avoid aggressive fasting until readings and symptoms are reviewed.",
    lifestyle: [
      "Cut sugary drinks and ultra-processed snacks this week.",
      "Add leafy greens and avocado for potassium-friendly meals (unless clinician restricts).",
      "Keep sodium thoughtful — many metabolic approaches pair lower carbs with steady electrolytes, not zero salt.",
      "Walk daily; skip max-effort intervals until BP is clinically reviewed.",
    ],
    caution: "Home BP ≥140/90 needs clinician confirmation — this app does not treat hypertension.",
  },
  {
    doctorId: "ekberg",
    metricKey: "high_bp_seated",
    title: "High home BP — metabolic fitness lens",
    recommendation:
      "Focus on insulin-sensitivity habits: protein-forward meals, post-meal walks, and consistent sleep timing. Strength + easy aerobic work when recovered; do not chase hard HIIT while BP is elevated on home checks.",
    lifestyle: [
      "10–15 minute walk after your largest meal most days.",
      "Reduce ultra-processed foods; keep meals whole-food based.",
      "Protect a fixed wake time and morning light.",
      "Log seated BP at the same time of day for clinician review.",
    ],
    caution: "Elevated seated BP is a clinical issue — lifestyle themes are adjuncts only.",
  },
  {
    doctorId: "axe",
    metricKey: "high_bp_seated",
    title: "High home BP — food-first lens",
    recommendation:
      "Build an anti-inflammatory, food-first plate: colorful plants, quality protein, olive oil or avocado, and fewer packaged foods. Cook more meals at home this week so sodium and sugar are under your control.",
    lifestyle: [
      "Cook ≥4 home meals; read labels on anything packaged.",
      "Add potassium-rich produce (greens, beans if tolerated, berries).",
      "Limit alcohol if you drink; skip energy drinks.",
      "Consider fermented foods you tolerate for overall diet quality — not as a BP drug.",
    ],
    caution: "Food patterns do not replace BP medication decisions from a licensed clinician.",
  },
  {
    doctorId: "jockers",
    metricKey: "high_bp_seated",
    title: "High home BP — functional / stress lens",
    recommendation:
      "Treat stress load and sleep as primary levers alongside plate quality. Schedule a daily nervous-system downshift; favor anti-inflammatory fats and plants; avoid stacking stimulants (extra caffeine, hard intervals) while BP is high.",
    lifestyle: [
      "10 minutes of breathwork, prayer, stretch, or quiet walk daily.",
      "Dim screens 1 hour before bed; aim for 7.5–9 hours in bed.",
      "Olive oil / avocado / fatty fish over fried packaged fats.",
      "Optional gentle 12:12 meal window only if already recovered — stop if unwell.",
    ],
    caution: "Stress tools are educational; urgent BP symptoms need emergency care.",
  },
  {
    doctorId: "clark",
    metricKey: "high_bp_seated",
    title: "High home BP — clean living / DIY tracking lens",
    recommendation:
      "Simplify the environment: consistent home BP logging (seated + standing), quieter evenings, and fewer harsh chemical exposures if practical. Use filtered water if available. Bring your log to a clinician — DIY strips and cuffs track; they don’t diagnose.",
    lifestyle: [
      "Same cuff, same arm, seated 5 minutes before each reading.",
      "Log date/time/caffeine/stress next to each BP.",
      "Reduce late nicotine/alcohol if used.",
      "Keep the sleep space cooler and darker.",
    ],
    caution: "Clean-living habits are not a substitute for clinical hypertension care.",
  },

  // —— Orthostatic BP drop ——
  {
    doctorId: "berg",
    metricKey: "orthostatic_bp_drop",
    title: "BP drop on standing — electrolytes / recovery lens",
    recommendation:
      "A sizable seated→standing drop can track with dehydration or electrolyte shifts (especially if carbs were cut hard). Prioritize fluids, salty broth or mineral-rich meals if clinician allows, and pause aggressive fasting or hard training until reviewed.",
    lifestyle: [
      "Sip fluids through the day; don’t rely on one huge chug.",
      "Include sodium thoughtfully with meals if not sodium-restricted.",
      "Rise slowly: sit → stand, pause, then walk.",
      "Skip intense intervals and long fasts this week.",
    ],
    caution: "Dizziness, fainting, or chest symptoms on standing need prompt clinical care.",
  },
  {
    doctorId: "ekberg",
    metricKey: "orthostatic_bp_drop",
    title: "BP drop on standing — fitness / pacing lens",
    recommendation:
      "Treat orthostatic change as a recovery signal: easy walking only, no hard cardio, and meal regularity so blood sugar and hydration aren’t chaotic. Recheck seated/standing BP after 5 minutes seated rest.",
    lifestyle: [
      "Easy walks only until symptoms settle.",
      "Protein + some whole-food carbs at meals if you feel lightheaded when fasted.",
      "Morning light and consistent wake time.",
      "Repeat orthostatic check same time next day for your clinician log.",
    ],
    caution: "Orthostatic symptoms can be serious — this is tracking guidance, not diagnosis.",
  },
  {
    doctorId: "axe",
    metricKey: "orthostatic_bp_drop",
    title: "BP drop on standing — food & fluid lens",
    recommendation:
      "Support with steady meals, mineral-rich foods (leafy greens, bone broth if you use it), and adequate salt/water unless restricted. Avoid jumping into cleanses or juice-only days while standing BP falls.",
    lifestyle: [
      "Eat regular meals; don’t skip breakfast if mornings are dizzy.",
      "Broth or mineral water between meals if tolerated.",
      "Stand up in stages from bed or chair.",
      "Note any new meds/supplements for your clinician.",
    ],
    caution: "Do not self-prescribe high-dose supplements for orthostatic symptoms.",
  },
  {
    doctorId: "jockers",
    metricKey: "orthostatic_bp_drop",
    title: "BP drop on standing — nervous system / recovery lens",
    recommendation:
      "Prioritize autonomic recovery: slow nasal breathing when rising, shorter showers if hot water worsens dizziness, and no stacked stressors (hard training + fasting + poor sleep).",
    lifestyle: [
      "Practice slow exhalations before standing.",
      "Keep caffeine modest until orthostatic pattern is reviewed.",
      "Sleep opportunity 7.5–9 hours.",
      "Strength work only if you can stand without symptoms — otherwise pause.",
    ],
    caution: "Persistent orthostatic intolerance needs a clinician, not DIY stacking.",
  },
  {
    doctorId: "clark",
    metricKey: "orthostatic_bp_drop",
    title: "BP drop on standing — DIY protocol lens",
    recommendation:
      "Use a simple home orthostatic protocol: seated BP after 5 quiet minutes, then standing at 1 and 3 minutes. Bring the numbers (and any dizziness notes) to a clinician. Keep the measurement environment consistent.",
    lifestyle: [
      "Same cuff, same arm, no talking during measurement.",
      "Avoid checking right after caffeine or a hot shower.",
      "Sit/lie down if dizzy — do not push through faintness.",
      "Filter water habit is fine; it does not fix orthostatic drops alone.",
    ],
    caution: "DIY protocol is for logging — emergency symptoms need emergency care.",
  },

  // —— Low saliva pH ——
  {
    doctorId: "berg",
    metricKey: "low_saliva_ph",
    title: "Lower saliva pH — metabolic / meal-timing lens",
    recommendation:
      "Treat low DIY saliva pH as a curiosity signal, not a disease label. Favor protein + non-starchy vegetables, reduce grazing on sugary snacks, and keep hydration steady. Do not start harsh “alkaline cleanses.”",
    lifestyle: [
      "Protein-forward first meal; skip sugary breakfast drinks.",
      "Wait ~30 minutes after meals before rechecking saliva pH if you retest.",
      "Leafy greens and water between meals.",
      "No baking-soda protocols from social media.",
    ],
    caution: "Saliva pH strips are not validated to diagnose systemic “acidosis.”",
  },
  {
    doctorId: "ekberg",
    metricKey: "low_saliva_ph",
    title: "Lower saliva pH — blood-sugar steadiness lens",
    recommendation:
      "Link the reading to meal composition and ultra-processed carbs. Steady plates and a short post-meal walk often matter more than chasing a strip number.",
    lifestyle: [
      "Swap one ultra-processed snack for whole food daily.",
      "Post-meal walk 10 minutes when possible.",
      "Retest saliva at a consistent time (e.g. morning before coffee).",
      "Focus on how you feel (energy, cravings), not strip obsession.",
    ],
    caution: "Do not use saliva pH to diagnose metabolic disease.",
  },
  {
    doctorId: "axe",
    metricKey: "low_saliva_ph",
    title: "Lower saliva pH — food-first / oral-gut lens",
    recommendation:
      "Improve diet quality and oral habits: less sugar, more whole plants and quality protein, stay hydrated. Consider fermented foods you tolerate. Oral hygiene still matters more for mouth pH than systemic myths.",
    lifestyle: [
      "Cut sugary drinks; use water or herbal tea.",
      "Crunchy produce (if tolerated) and adequate chewing.",
      "Don’t brush immediately after acidic foods — wait a bit.",
      "Fermented food optional — not mandatory.",
    ],
    caution: "Mouth chemistry ≠ full-body acid–base status on DIY strips.",
  },
  {
    doctorId: "jockers",
    metricKey: "low_saliva_ph",
    title: "Lower saliva pH — stress & inflammation lens",
    recommendation:
      "Stress, poor sleep, and inflammatory packaged foods can coexist with “interesting” DIY pH logs. Downshift daily stress and clean up seed-oil-heavy fried snacks; don’t megadose minerals from a strip reading.",
    lifestyle: [
      "Daily downshift ritual (breath, walk, quiet time).",
      "Anti-inflammatory plate: plants, fish/eggs/meat, olive oil.",
      "Sleep band 7.5–9 hours when possible.",
      "Skip aggressive detox kits sold for “acid bodies.”",
    ],
    caution: "Strip-driven supplement stacks can be harmful — ask a clinician.",
  },
  {
    doctorId: "clark",
    metricKey: "low_saliva_ph",
    title: "Lower saliva pH — clean living / logging lens",
    recommendation:
      "Standardize the test: same strip brand, morning before food/coffee when possible, log next to diet notes. Use filtered water if practical. Bring patterns — not single readings — to a clinician if you have oral or systemic symptoms.",
    lifestyle: [
      "Log saliva pH + last meal + stress (1–10).",
      "Rinse with water after acidic drinks; don’t over-interpret one pad.",
      "Simplify one personal-care product with harsh flavors/acids if irritating.",
      "Pair with urine Multistix only as separate DIY context — not diagnosis.",
    ],
    caution: "DIY pH logging is educational curiosity, not a cure protocol.",
  },

  // —— Extra metrics so the DB is usable beyond the demo ——
  {
    doctorId: "berg",
    metricKey: "elevated_rhr",
    title: "Elevated resting HR — recovery first",
    recommendation: "Ease training intensity; prioritize sleep, electrolytes, and lower stress before adding hard sessions.",
    lifestyle: ["Easy walks only", "Hydration + minerals with meals", "Earlier bedtime"],
    caution: "Persistent RHR >100 needs clinical review.",
  },
  {
    doctorId: "ekberg",
    metricKey: "elevated_rhr",
    title: "Elevated resting HR — fitness pacing",
    recommendation: "Deload: technique and easy aerobic only until RHR settles and a clinician has context.",
    lifestyle: ["No HIIT this week", "Morning light + consistent wake", "Reduce late caffeine"],
    caution: "Chest pain or fainting with high RHR → emergency care.",
  },
  {
    doctorId: "axe",
    metricKey: "elevated_rhr",
    title: "Elevated resting HR — food & stimulants",
    recommendation: "Audit caffeine, energy drinks, and under-eating; keep meals regular.",
    lifestyle: ["Cap caffeine earlier in the day", "Steady protein meals", "Hydrate"],
    caution: "Don’t self-treat tachycardia with herbs alone.",
  },
  {
    doctorId: "jockers",
    metricKey: "elevated_rhr",
    title: "Elevated resting HR — stress load",
    recommendation: "Nervous-system downshift daily; reduce stacked stressors.",
    lifestyle: ["Breathwork 10 min", "Protect sleep", "Skip hard fasting"],
    caution: "Clinical evaluation if sustained elevation.",
  },
  {
    doctorId: "clark",
    metricKey: "elevated_rhr",
    title: "Elevated resting HR — DIY log",
    recommendation: "Log morning RHR for 7 days with sleep/caffeine notes for your clinician.",
    lifestyle: ["Same time each morning", "Note illness/stress", "Quiet measurement"],
    caution: "Logging ≠ diagnosis.",
  },
  {
    doctorId: "berg",
    metricKey: "overweight_bmi",
    title: "Overweight BMI — lower refined carbs",
    recommendation: "Protein-forward plates, fewer refined carbs, walking; modest deficit without crash dieting.",
    lifestyle: ["Cut sugary drinks", "Leafy greens + protein each meal", "Daily walk"],
    caution: "Educational only — not a medical weight program.",
  },
  {
    doctorId: "ekberg",
    metricKey: "overweight_bmi",
    title: "Overweight BMI — metabolic fitness",
    recommendation: "Strength 2× + daily easy cardio; improve meal composition for insulin sensitivity.",
    lifestyle: ["Post-meal walks", "Whole-food swaps", "Sleep consistency"],
    caution: "Progress forecasts are illustrative.",
  },
  {
    doctorId: "axe",
    metricKey: "overweight_bmi",
    title: "Overweight BMI — food-first",
    recommendation: "Cook more, reduce packaged foods, emphasize nutrient density over fad cleanses.",
    lifestyle: ["Home meals", "Protein + plants", "Fewer desserts-as-default"],
    caution: "No extreme detoxes.",
  },
  {
    doctorId: "jockers",
    metricKey: "overweight_bmi",
    title: "Overweight BMI — inflammation / stress",
    recommendation: "Anti-inflammatory plate + stress/sleep work; optional gentle meal window if recovered.",
    lifestyle: ["Olive oil/avocado fats", "Downshift ritual", "7.5–9h sleep opportunity"],
    caution: "Stop fasting experiments if unwell.",
  },
  {
    doctorId: "clark",
    metricKey: "overweight_bmi",
    title: "Overweight BMI — clean living tracking",
    recommendation: "Track weight weekly, simplify pantry, keep water and sleep boringly consistent.",
    lifestyle: ["Weekly weigh-in same day", "Filter water habit", "Kitchen label audit"],
    caution: "Environment tweaks don’t replace clinical obesity care when needed.",
  },
  {
    doctorId: "berg",
    metricKey: "high_urine_ph",
    title: "Higher urine pH — context only",
    recommendation: "Hydration notes and symptom check; do not self-treat infection from a strip.",
    lifestyle: ["Fluids steady", "Retest with Multistix if logging", "Seek care for pain/fever"],
    caution: "UTI symptoms need clinical care.",
  },
  {
    doctorId: "ekberg",
    metricKey: "high_urine_ph",
    title: "Higher urine pH — metabolic context",
    recommendation: "Use as a log point next to diet/hydration — not a keto badge of honor.",
    lifestyle: ["Consistent retest timing", "Whole-food meals", "Clinician if symptoms"],
    caution: "Strip ≠ diagnosis.",
  },
  {
    doctorId: "axe",
    metricKey: "high_urine_ph",
    title: "Higher urine pH — food/hydration",
    recommendation: "Steady fluids and whole foods; skip alkaline miracle products.",
    lifestyle: ["Water with meals", "Produce variety", "No harsh cleanses"],
    caution: "Painful urination → clinician.",
  },
  {
    doctorId: "jockers",
    metricKey: "high_urine_ph",
    title: "Higher urine pH — functional caution",
    recommendation: "Correlate with stress/illness; don’t stack antimicrobials from a pad alone.",
    lifestyle: ["Symptom diary", "Sleep support", "Clinical care if fever"],
    caution: "No self-prescribed antibiotics.",
  },
  {
    doctorId: "clark",
    metricKey: "high_urine_ph",
    title: "Higher urine pH — DIY strip log",
    recommendation: "Standardize Multistix timing; bring the full pad panel to a clinician if abnormal.",
    lifestyle: ["Same strip brand", "Morning midstream if instructed on bottle", "Photo/log results"],
    caution: "DIY strips are not lab UA.",
  },
  {
    doctorId: "berg",
    metricKey: "short_sleep",
    title: "Short sleep — block hard diet experiments",
    recommendation: "Fix sleep opportunity before aggressive carb cuts or fasting.",
    lifestyle: ["Fixed wake time", "Caffeine cutoff", "Darker room"],
    caution: "Chronic short sleep deserves clinical/mental-health context.",
  },
  {
    doctorId: "ekberg",
    metricKey: "short_sleep",
    title: "Short sleep — circadian fitness",
    recommendation: "Morning light + consistent schedule; keep training easy.",
    lifestyle: ["Outdoor light 10–20 min", "No late HIIT", "Earlier wind-down"],
    caution: "Sleep debt impairs metabolic fitness goals.",
  },
  {
    doctorId: "axe",
    metricKey: "short_sleep",
    title: "Short sleep — evening food calm",
    recommendation: "Earlier lighter dinner; limit late sugar/alcohol.",
    lifestyle: ["Kitchen closed earlier", "Herbal tea if liked", "Screens down"],
    caution: "Not a sedative prescription.",
  },
  {
    doctorId: "jockers",
    metricKey: "short_sleep",
    title: "Short sleep — nervous system",
    recommendation: "Daily downshift; don’t add fasting stress on poor sleep.",
    lifestyle: ["Breath/prayer/stretch", "Magnesium-rich foods", "Protect bedtime"],
    caution: "Insomnia with mood crisis → seek care.",
  },
  {
    doctorId: "clark",
    metricKey: "short_sleep",
    title: "Short sleep — sleep hygiene DIY",
    recommendation: "Cooler, darker room; fewer harsh scents; consistent lights-out log.",
    lifestyle: ["Bedroom audit", "Same bedtime ±30 min", "No screens in bed"],
    caution: "Hygiene helps; it isn’t sleep-apnea care.",
  },
  {
    doctorId: "berg",
    metricKey: "high_stress",
    title: "High stress — pause aggressive protocols",
    recommendation: "Stress blocks metabolic experiments; keep carbs from chaotic sugar swings without crash dieting.",
    lifestyle: ["Walks", "Protein meals", "No new cleanse"],
    caution: "Crisis/panic → professional help.",
  },
  {
    doctorId: "ekberg",
    metricKey: "high_stress",
    title: "High stress — keep movement gentle",
    recommendation: "Easy aerobic + strength technique; protect sleep and meal regularity.",
    lifestyle: ["Easy walks", "Fixed wake", "Whole foods"],
    caution: "Stress + chest pain → urgent care.",
  },
  {
    doctorId: "axe",
    metricKey: "high_stress",
    title: "High stress — comfort food quality",
    recommendation: "Nourish with real meals; don’t punish with restriction.",
    lifestyle: ["Cook simple meals", "Hydrate", "Limit alcohol"],
    caution: "Food is support, not therapy replacement.",
  },
  {
    doctorId: "jockers",
    metricKey: "high_stress",
    title: "High stress — primary lever",
    recommendation: "Make nervous-system downshift non-negotiable this week.",
    lifestyle: ["10–20 min daily ritual", "Earlier bedtime", "Fewer stimulants"],
    caution: "Suicidal thoughts → emergency resources.",
  },
  {
    doctorId: "clark",
    metricKey: "high_stress",
    title: "High stress — simplify environment",
    recommendation: "Reduce noise/chemical/screen load in the evening; log stress 1–10 with vitals.",
    lifestyle: ["Quiet hour", "Dim lights", "Short outdoor time"],
    caution: "Environment tweaks aren’t mental-health treatment.",
  },
];

export type MetricFinding = {
  metricKey: MetricKey;
  label: string;
  detail: string;
  severity: "info" | "watch" | "urgent_watch";
};

export type DoctorReviewCard = {
  doctor: DoctorProfile;
  metricKey: MetricKey;
  metricLabel: string;
  findingDetail: string;
  rec: DoctorMetricRec;
};

/** One consolidated Alternative-blend summary per detected finding (themes merged). */
export type DoctorFindingSummary = {
  metricKey: MetricKey;
  metricLabel: string;
  findingDetail: string;
  title: string;
  summary: string;
  actions: string[];
  caution: string;
};

export type DoctorMetricReview = {
  disclaimer: string;
  findings: MetricFinding[];
  /** @deprecated Prefer `summaries` — kept for any older clients. */
  cards: DoctorReviewCard[];
  /** One merged educational summary per finding (not per theme). */
  summaries: DoctorFindingSummary[];
  /** Doctors available for review tabs. */
  doctors: DoctorProfile[];
  demoNote?: string;
};

/** Single-paragraph blend copy per metric (themes woven together). */
const BLEND_SUMMARY_COPY: Record<MetricKey, string> = {
  high_bp_seated:
    "Prioritize clinician review of elevated home BP while you simplify meals (fewer refined carbs and packaged foods), keep electrolytes and potassium-rich produce thoughtful, walk daily with post-meal strolls, protect sleep, and downshift stress. Log seated BP consistently for your clinician — lifestyle themes are adjuncts only, not hypertension treatment.",
  orthostatic_bp_drop:
    "Treat a sizable seated→standing BP drop as a recovery signal: rise slowly, keep fluids and regular meals steady, pause aggressive fasting and hard intervals, and recheck with a consistent cuff protocol. Bring numbers and any dizziness notes to a clinician — DIY logging is not a diagnosis.",
  low_saliva_ph:
    "Treat lower DIY saliva pH as a curiosity signal, not a disease label. Favor protein-forward plates, fewer sugary snacks/drinks, steady hydration, oral hygiene basics, and stress/sleep support. Retest at a consistent time and skip alkaline cleanses or strip-driven mineral stacks.",
  high_urine_ph:
    "Use a higher urine pH strip as a log point next to hydration and diet — not an alkaline badge or infection rule-out. Keep fluids and whole foods steady, standardize Multistix timing if you retest, and seek care for pain, fever, or blood in urine. Do not self-treat infection from a pad alone.",
  elevated_rhr:
    "A high resting heart rate on home checks calls for quieter recovery: protect sleep, ease stacked stressors and hard training, keep caffeine modest, and log morning RHR with context for a clinician. Persistent elevation deserves clinical evaluation.",
  overweight_bmi:
    "Focus on protein-forward, whole-food plates with fewer refined carbs and packaged desserts; cook at home when you can. Build metabolic fitness with daily walking (including after meals), strength about twice weekly, and consistent sleep. Keep anti-inflammatory fats and a simple stress downshift in the mix. Track weekly weigh-ins, hydration, and pantry simplicity — aim for a modest deficit without crash diets or fad cleanses.",
  short_sleep:
    "Make sleep opportunity the priority before hard diet cuts or fasting experiments: fixed wake time, morning light, earlier wind-down, calmer evenings (less late sugar/alcohol/screens), and easier training until sleep recovers. Chronic short sleep also deserves clinical or mental-health context when needed.",
  high_stress:
    "Treat a high stress score as a cue to reduce stacked load: daily nervous-system downshift, protect sleep, simplify meals (protein + plants, fewer stimulants), and keep movement gentle. Stress tools are educational — crisis or safety concerns need real-world support, not DIY protocols alone.",
};

const BLEND_CAUTION_COPY: Record<MetricKey, string> = {
  high_bp_seated:
    "Home BP in a high range needs clinician confirmation; urgent symptoms need emergency care. Educational only — not a hypertension program.",
  orthostatic_bp_drop:
    "Dizziness, fainting, or chest symptoms on standing need prompt clinical care. DIY orthostatic checks are for logging only.",
  low_saliva_ph:
    "Saliva pH strips do not diagnose systemic acidosis or metabolic disease. Skip harsh cleanses and strip-driven supplement stacks.",
  high_urine_ph:
    "Painful urination, fever, or blood in urine need clinical care. Strip results are not a lab urinalysis or infection diagnosis.",
  elevated_rhr:
    "Sustained high resting HR deserves clinical evaluation. Educational recovery tips are not a cardiac diagnosis.",
  overweight_bmi:
    "Educational only — not a medical weight program. Environment and plate tweaks do not replace clinical obesity care when needed.",
  short_sleep:
    "Chronic short sleep may need clinical or mental-health context. These tips are not sedatives or prescriptions.",
  high_stress:
    "Educational stress habits are not therapy or crisis care. Seek real-world help if you feel unsafe or overwhelmed.",
};

function uniqueStrings(items: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const item of items) {
    const key = item.trim().toLowerCase();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(item.trim());
  }
  return out;
}

function summarizeFinding(
  finding: MetricFinding,
  recs: DoctorMetricRec[],
): DoctorFindingSummary {
  const actions = uniqueStrings(recs.flatMap((r) => r.lifestyle)).slice(0, 8);
  if (recs.length === 1) {
    const rec = recs[0]!;
    return {
      metricKey: finding.metricKey,
      metricLabel: finding.label,
      findingDetail: finding.detail,
      title: `${finding.label} — summary`,
      summary: rec.recommendation,
      actions: uniqueStrings(rec.lifestyle).slice(0, 8),
      caution: rec.caution,
    };
  }
  return {
    metricKey: finding.metricKey,
    metricLabel: finding.label,
    findingDetail: finding.detail,
    title: `${finding.label} — blend summary`,
    summary: BLEND_SUMMARY_COPY[finding.metricKey],
    actions,
    caution: BLEND_CAUTION_COPY[finding.metricKey],
  };
}

const METRIC_LABELS: Record<MetricKey, string> = {
  high_bp_seated: "High seated blood pressure",
  orthostatic_bp_drop: "Decreased BP upon standing",
  low_saliva_ph: "Lower saliva pH",
  high_urine_ph: "Higher urine pH",
  elevated_rhr: "Elevated resting heart rate",
  overweight_bmi: "Overweight BMI range",
  short_sleep: "Short sleep",
  high_stress: "High stress score",
};

export function detectMetricFindings(m: MetricsInput): MetricFinding[] {
  const findings: MetricFinding[] = [];

  if (typeof m.bpSystolic === "number" || typeof m.bpDiastolic === "number") {
    const sys = m.bpSystolic ?? 0;
    const dia = m.bpDiastolic ?? 0;
    if (sys >= 140 || dia >= 90) {
      findings.push({
        metricKey: "high_bp_seated",
        label: METRIC_LABELS.high_bp_seated,
        detail: `Seated BP logged ${m.bpSystolic ?? "—"}/${m.bpDiastolic ?? "—"} (educational high range on home check).`,
        severity: sys >= 180 ? "urgent_watch" : "watch",
      });
    }
  }

  if (
    typeof m.bpSystolic === "number" &&
    typeof m.standingBpSystolic === "number" &&
    m.bpSystolic - m.standingBpSystolic >= 20
  ) {
    findings.push({
      metricKey: "orthostatic_bp_drop",
      label: METRIC_LABELS.orthostatic_bp_drop,
      detail: `Systolic drop seated→standing ≈ ${m.bpSystolic - m.standingBpSystolic} mmHg (${m.bpSystolic} → ${m.standingBpSystolic}).`,
      severity: "watch",
    });
  } else if (
    typeof m.bpDiastolic === "number" &&
    typeof m.standingBpDiastolic === "number" &&
    m.bpDiastolic - m.standingBpDiastolic >= 10
  ) {
    findings.push({
      metricKey: "orthostatic_bp_drop",
      label: METRIC_LABELS.orthostatic_bp_drop,
      detail: `Diastolic drop seated→standing ≈ ${m.bpDiastolic - m.standingBpDiastolic} mmHg (${m.bpDiastolic} → ${m.standingBpDiastolic}).`,
      severity: "watch",
    });
  }

  if (typeof m.salivaPh === "number" && m.salivaPh < 6.5) {
    findings.push({
      metricKey: "low_saliva_ph",
      label: METRIC_LABELS.low_saliva_ph,
      detail: `Saliva pH logged ${m.salivaPh} (DIY strip; lower than a common ~6.5–7.5 home reference band).`,
      severity: "info",
    });
  }

  if (typeof m.urinePh === "number" && m.urinePh > 7.5) {
    findings.push({
      metricKey: "high_urine_ph",
      label: METRIC_LABELS.high_urine_ph,
      detail: `Urine pH logged ${m.urinePh}.`,
      severity: "info",
    });
  }

  if (typeof m.restingHeartRate === "number" && m.restingHeartRate > 100) {
    findings.push({
      metricKey: "elevated_rhr",
      label: METRIC_LABELS.elevated_rhr,
      detail: `Resting HR logged ${m.restingHeartRate} bpm.`,
      severity: "watch",
    });
  }

  if (m.heightCm && m.weightKg && bmi(m.heightCm, m.weightKg) >= 25) {
    findings.push({
      metricKey: "overweight_bmi",
      label: METRIC_LABELS.overweight_bmi,
      detail: `BMI ≈ ${bmi(m.heightCm, m.weightKg)}.`,
      severity: "info",
    });
  }

  if (typeof m.sleepHours === "number" && m.sleepHours < 6) {
    findings.push({
      metricKey: "short_sleep",
      label: METRIC_LABELS.short_sleep,
      detail: `Sleep logged ${m.sleepHours} h/night.`,
      severity: "watch",
    });
  }

  if (typeof m.stressLevel === "number" && m.stressLevel >= 8) {
    findings.push({
      metricKey: "high_stress",
      label: METRIC_LABELS.high_stress,
      detail: `Stress logged ${m.stressLevel}/10.`,
      severity: "watch",
    });
  }

  return findings;
}

function recFor(doctorId: DoctorId, metricKey: MetricKey): DoctorMetricRec | undefined {
  return DOCTOR_METRIC_DB.find((r) => r.doctorId === doctorId && r.metricKey === metricKey);
}

export function buildDoctorMetricReview(
  m: MetricsInput,
  filterDoctorId?: DoctorId | "all",
): DoctorMetricReview | null {
  const findings = detectMetricFindings(m);
  if (findings.length === 0) return null;

  const doctors = Object.values(DOCTORS);
  const cards: DoctorReviewCard[] = [];
  const summaries: DoctorFindingSummary[] = [];

  for (const finding of findings) {
    const recs: DoctorMetricRec[] = [];
    for (const doctor of doctors) {
      if (filterDoctorId && filterDoctorId !== "all" && doctor.id !== filterDoctorId) continue;
      const rec = recFor(doctor.id, finding.metricKey);
      if (!rec) continue;
      recs.push(rec);
      cards.push({
        doctor,
        metricKey: finding.metricKey,
        metricLabel: finding.label,
        findingDetail: finding.detail,
        rec,
      });
    }
    if (recs.length) summaries.push(summarizeFinding(finding, recs));
  }

  if (summaries.length === 0) return null;

  const hasDemoTrio =
    findings.some((f) => f.metricKey === "high_bp_seated") &&
    findings.some((f) => f.metricKey === "low_saliva_ph") &&
    findings.some((f) => f.metricKey === "orthostatic_bp_drop");

  return {
    disclaimer: DOCTOR_DB_DISCLAIMER,
    findings,
    cards,
    summaries,
    doctors,
    demoNote: hasDemoTrio
      ? "Demo pattern detected: high seated BP + lower saliva pH + BP drop on standing. Summaries below merge the Alternative blend into one note per finding."
      : undefined,
  };
}

export function resolveDoctorFilter(raw: unknown): DoctorId | "all" {
  const v = String(raw ?? "all");
  if (v === "all") return "all";
  if (v in DOCTORS) return v as DoctorId;
  return "all";
}

/** Catalog endpoint helper — full DB shape for inspection. */
export function listDoctorMetricCatalog() {
  return {
    disclaimer: DOCTOR_DB_DISCLAIMER,
    doctors: DOCTORS,
    metrics: METRIC_LABELS,
    rows: DOCTOR_METRIC_DB,
  };
}
