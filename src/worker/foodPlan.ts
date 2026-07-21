import type { MetricsInput } from "./plans";
import { resolvePerspective } from "./perspectives";
import type { DetailedTargets } from "./targets";
import { KIT_PRODUCTS } from "./nutritionKit";

export const FOOD_PLAN_DISCLAIMER = `This detailed food plan is an educational template to illustrate how whey, a NOW multivitamin, and ordinary foods can approach VitalGauge macro and micronutrient targets. Portions are approximate. Brand labels override app summaries. It is not a medical diet, allergy-safe menu, or prescription. Skip or swap foods for allergies, religion, budget, or clinician advice. High-dose vitamin D3 from the kit stays clinician-gated.`;

export type FoodItem = {
  name: string;
  portion: string;
  kcal: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  notes?: string;
  kit?: boolean;
};

export type MealBlock = {
  name: string;
  timeHint: string;
  items: FoodItem[];
  totals: { kcal: number; proteinG: number; carbsG: number; fatG: number };
};

export type NutrientCoverage = {
  name: string;
  target: number;
  unit: string;
  fromPlan: number;
  fromMulti: string;
  status: "on_track" | "food_focus" | "multi_helps" | "gap";
  note?: string;
};

export type ItemizedFoodLine = {
  line: number;
  meal: string;
  timeHint: string;
  food: string;
  portion: string;
  kcal: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  source: "kit" | "food";
};

export type KitMacroGap = {
  nutrient: string;
  target: number;
  unit: string;
  fromKit: number;
  stillNeededFromFood: number;
  kitCoversPct: number;
  verdict: string;
};

export type DetailedFoodPlan = {
  disclaimer: string;
  title: string;
  summary: string;
  style: "cdc" | "alternative";
  kitBase: {
    wheyScoops: number;
    wheyProteinG: number;
    wheyKcal: number;
    wheyCarbsG: number;
    wheyFatG: number;
    multi: string;
    multiUrl: string;
    d3Note: string;
    shakerNote: string;
  };
  /** What whey + NOW multi/D3 do NOT cover for macros (and related). */
  kitMacroGaps: KitMacroGap[];
  kitGapSummary: string[];
  /** Flat itemized day plan (every food line). */
  itemized: ItemizedFoodLine[];
  meals: MealBlock[];
  dayTotals: {
    kcal: number;
    proteinG: number;
    carbsG: number;
    fatG: number;
    fiberG: number;
  };
  targets: {
    kcal: number;
    proteinG: number;
    carbsG: number;
    fatG: number;
    fiberG: number;
  };
  macroHit: {
    proteinPctOfTarget: number;
    carbsPctOfTarget: number;
    fatPctOfTarget: number;
    kcalPctOfTarget: number;
  };
  vitamins: NutrientCoverage[];
  minerals: NutrientCoverage[];
  aminoAcids: NutrientCoverage[];
  shoppingList: string[];
  prepTips: string[];
  /** Alternative: primary goals only */
  priorityGoals?: {
    mode: "alt_protein_micros" | "cdc_balanced";
    note: string;
    proteinHitPct: number;
    aminoAcidHitPct: number;
    vitaminNote: string;
    mineralNote: string;
    carbsFatNote: string;
  };
};

const WHEY_SCOOP_PROTEIN = 25;
const WHEY_SCOOP_KCAL = 120;

function sumItems(items: FoodItem[]) {
  return items.reduce(
    (a, i) => ({
      kcal: a.kcal + i.kcal,
      proteinG: a.proteinG + i.proteinG,
      carbsG: a.carbsG + i.carbsG,
      fatG: a.fatG + i.fatG,
    }),
    { kcal: 0, proteinG: 0, carbsG: 0, fatG: 0 },
  );
}

function scaleItem(item: FoodItem, factor: number): FoodItem {
  const f = Math.max(0.5, Math.min(1.6, factor));
  return {
    ...item,
    kcal: Math.round(item.kcal * f),
    proteinG: Math.round(item.proteinG * f * 10) / 10,
    carbsG: Math.round(item.carbsG * f * 10) / 10,
    fatG: Math.round(item.fatG * f * 10) / 10,
    portion: f === 1 ? item.portion : `${item.portion} (×${f.toFixed(1)} sized)`,
  };
}

function wheyShake(scoops: number): FoodItem {
  return {
    name: "Grass-fed whey (kit) in Strada",
    portion: `${scoops} scoop(s) + water or unsweetened almond milk`,
    kcal: WHEY_SCOOP_KCAL * scoops,
    proteinG: WHEY_SCOOP_PROTEIN * scoops,
    carbsG: 2 * scoops,
    fatG: 1 * scoops,
    kit: true,
    notes: KIT_PRODUCTS.whey.url,
  };
}

function multiItem(sex: MetricsInput["sex"]): FoodItem {
  if (sex === "female") {
    return {
      name: "NOW EVE women’s multi (kit)",
      portion: "As labeled with food",
      kcal: 0,
      proteinG: 0,
      carbsG: 0,
      fatG: 0,
      kit: true,
      notes: KIT_PRODUCTS.eve.url,
    };
  }
  return {
    name: "NOW ADAM men’s multi (kit)",
    portion: sex === "male" ? "1 tablet with food" : "1 tablet with food (confirm ADAM vs EVE by sex)",
    kcal: 0,
    proteinG: 0,
    carbsG: 0,
    fatG: 0,
    kit: true,
    notes: KIT_PRODUCTS.adam.url,
  };
}

/** Alternative: protein + micronutrient dense day (carbs/fat are fuel, not goals). */
function altProteinMicrosTemplate(scoops: number, sex: MetricsInput["sex"]): MealBlock[] {
  const breakfast: FoodItem[] = [
    { name: "Eggs", portion: "4 large", kcal: 280, proteinG: 24, carbsG: 2, fatG: 20 },
    { name: "Spinach (sautéed)", portion: "2 cups cooked", kcal: 60, proteinG: 5, carbsG: 6, fatG: 1 },
    { name: "Sardines or smoked salmon (optional add)", portion: "2 oz", kcal: 120, proteinG: 14, carbsG: 0, fatG: 7 },
    multiItem(sex),
  ];
  const breakfastScoopsEarly = Math.min(scoops, 2);
  if (breakfastScoopsEarly >= 1) breakfast.push(wheyShake(breakfastScoopsEarly));

  const lunch: FoodItem[] = [
    { name: "Chicken breast or turkey", portion: "8 oz cooked", kcal: 370, proteinG: 70, carbsG: 0, fatG: 8 },
    { name: "Mixed leafy greens + herbs", portion: "Large bowl (3+ cups)", kcal: 40, proteinG: 3, carbsG: 6, fatG: 0 },
    { name: "Olive oil dressing", portion: "1 tbsp", kcal: 120, proteinG: 0, carbsG: 0, fatG: 14 },
    { name: "Broccoli or asparagus", portion: "2 cups", kcal: 60, proteinG: 5, carbsG: 11, fatG: 0.5 },
  ];

  const dinner: FoodItem[] = [
    { name: "Salmon, beef, or liver rotation", portion: "6 oz cooked", kcal: 340, proteinG: 36, carbsG: 0, fatG: 20 },
    { name: "Brussels sprouts or kale", portion: "2 cups", kcal: 70, proteinG: 5, carbsG: 12, fatG: 1 },
    { name: "Bone broth or mineral water", portion: "1 cup broth", kcal: 40, proteinG: 6, carbsG: 0, fatG: 1 },
  ];

  const snacks: FoodItem[] = [
    { name: "Greek yogurt (plain, full-fat or 2%)", portion: "1 cup", kcal: 180, proteinG: 20, carbsG: 8, fatG: 8 },
    { name: "Pumpkin seeds", portion: "1 oz", kcal: 150, proteinG: 8, carbsG: 4, fatG: 13 },
  ];
  const snackScoops = Math.max(0, scoops - Math.min(scoops, 2));
  if (snackScoops > 0) snacks.unshift(wheyShake(snackScoops));

  return [
    { name: "Breakfast", timeHint: "Protein + multi + greens", items: breakfast, totals: sumItems(breakfast) },
    { name: "Lunch", timeHint: "Largest protein block", items: lunch, totals: sumItems(lunch) },
    { name: "Dinner", timeHint: "Protein + minerals (greens)", items: dinner, totals: sumItems(dinner) },
    { name: "Snacks / shake", timeHint: "Close protein / AA gap", items: snacks, totals: sumItems(snacks) },
  ];
}

/** Scale alternative meals primarily to hit protein; keep near calorie cap for fat-loss forecast. */
function scaleAltForProtein(
  meals: MealBlock[],
  proteinTarget: number,
  calorieCap: number,
): MealBlock[] {
  const currentP = meals.reduce((s, m) => s + m.totals.proteinG, 0) || 1;
  let factor = proteinTarget / currentP;
  factor = Math.max(0.7, Math.min(1.5, factor));

  let scaled = meals.map((meal) => {
    const items = meal.items.map((i) => {
      if (i.kit && i.kcal === 0) return i; // multi
      if (i.kit) return i; // keep whey scoops as planned
      return scaleItem(i, factor);
    });
    return { ...meal, items, totals: sumItems(items) };
  });

  let kcal = scaled.reduce((s, m) => s + m.totals.kcal, 0);
  if (kcal > calorieCap * 1.08) {
    const trim = calorieCap / kcal;
    scaled = scaled.map((meal) => {
      const items = meal.items.map((i) => {
        if (i.kit) return i;
        // Trim fat-forward foods slightly more via uniform scale
        return scaleItem(i, Math.max(0.65, trim));
      });
      return { ...meal, items, totals: sumItems(items) };
    });
  }
  return scaled;
}

/** CDC-style higher-carb day template (pre-scale). */
function cdcTemplate(scoops: number, sex: MetricsInput["sex"]): MealBlock[] {
  const breakfast: FoodItem[] = [
    { name: "Oats cooked in water or milk", portion: "¾ cup dry oats", kcal: 230, proteinG: 8, carbsG: 40, fatG: 4 },
    { name: "Berries", portion: "1 cup", kcal: 70, proteinG: 1, carbsG: 17, fatG: 0.5 },
    { name: "Eggs", portion: "2 large", kcal: 140, proteinG: 12, carbsG: 1, fatG: 10 },
    multiItem(sex),
  ];
  if (scoops >= 1) breakfast.push(wheyShake(Math.min(1, scoops)));

  const lunch: FoodItem[] = [
    { name: "Turkey or chicken breast", portion: "5 oz cooked", kcal: 220, proteinG: 40, carbsG: 0, fatG: 5 },
    { name: "Brown rice or quinoa", portion: "1 cup cooked", kcal: 215, proteinG: 5, carbsG: 45, fatG: 2 },
    { name: "Mixed vegetables", portion: "2 cups", kcal: 80, proteinG: 4, carbsG: 16, fatG: 0.5 },
    { name: "Olive oil", portion: "1 tbsp", kcal: 120, proteinG: 0, carbsG: 0, fatG: 14 },
  ];

  const dinner: FoodItem[] = [
    { name: "Baked white fish or chicken", portion: "6 oz", kcal: 250, proteinG: 40, carbsG: 0, fatG: 8 },
    { name: "Sweet potato", portion: "1 medium", kcal: 100, proteinG: 2, carbsG: 23, fatG: 0 },
    { name: "Green salad + olive oil", portion: "Large + 1 tbsp oil", kcal: 150, proteinG: 2, carbsG: 6, fatG: 14 },
    { name: "Fruit (apple or orange)", portion: "1 medium", kcal: 80, proteinG: 0.5, carbsG: 20, fatG: 0 },
  ];

  const snacks: FoodItem[] = [
    { name: "Low-fat Greek yogurt", portion: "1 cup", kcal: 130, proteinG: 20, carbsG: 8, fatG: 0.5 },
    { name: "Whole-grain crackers + hummus", portion: "1 oz + 2 tbsp", kcal: 180, proteinG: 5, carbsG: 22, fatG: 8 },
  ];
  if (scoops >= 2) snacks.unshift(wheyShake(scoops - 1));

  return [
    { name: "Breakfast", timeHint: "Morning", items: breakfast, totals: sumItems(breakfast) },
    { name: "Lunch", timeHint: "Midday", items: lunch, totals: sumItems(lunch) },
    { name: "Dinner", timeHint: "Evening", items: dinner, totals: sumItems(dinner) },
    { name: "Snacks / shake", timeHint: "Between meals", items: snacks, totals: sumItems(snacks) },
  ];
}

function scaleMeals(meals: MealBlock[], targetKcal: number): MealBlock[] {
  const current = meals.reduce((s, m) => s + m.totals.kcal, 0) || 1;
  const factor = targetKcal / current;
  return meals.map((meal) => {
    const items = meal.items.map((i) => (i.kit && i.kcal === 0 ? i : scaleItem(i, factor)));
    return { ...meal, items, totals: sumItems(items) };
  });
}

function coverage(
  name: string,
  target: number,
  unit: string,
  fromPlan: number,
  fromMulti: string,
  note?: string,
): NutrientCoverage {
  const ratio = target > 0 ? fromPlan / target : 1;
  let status: NutrientCoverage["status"] = "gap";
  if (ratio >= 0.9) status = "on_track";
  else if (fromMulti !== "—" && fromMulti !== "none") status = "multi_helps";
  else if (ratio >= 0.6) status = "food_focus";
  return { name, target, unit, fromPlan: Math.round(fromPlan * 10) / 10, fromMulti, status, note };
}

export function buildDetailedFoodPlan(
  m: MetricsInput,
  targets: DetailedTargets | null,
): DetailedFoodPlan | null {
  if (!targets || !m.weightKg) return null;

  const perspective = resolvePerspective(m.perspective);
  const alt = perspective !== "cdc";
  const proteinTarget = targets.macros.proteinG;
  // Alternative: more whey to secure protein/AA; CDC keeps ~60% food protein assumption
  const foodProteinShare = alt ? 0.5 : 0.6;
  const foodProtein = Math.round(proteinTarget * foodProteinShare);
  const gap = Math.max(0, proteinTarget - foodProtein);
  const wheyScoops = Math.min(3, Math.max(alt ? 1 : 0, Math.ceil(gap / WHEY_SCOOP_PROTEIN)));
  const wheyProteinG = wheyScoops * WHEY_SCOOP_PROTEIN;

  const sex = m.sex ?? "prefer_not";
  const multiName = sex === "female" ? KIT_PRODUCTS.eve.name : KIT_PRODUCTS.adam.name;
  const multiUrl = sex === "female" ? KIT_PRODUCTS.eve.url : KIT_PRODUCTS.adam.url;

  let meals = alt
    ? altProteinMicrosTemplate(wheyScoops, sex)
    : cdcTemplate(wheyScoops, sex);
  meals = alt
    ? scaleAltForProtein(meals, proteinTarget, targets.calories.dailyTarget)
    : scaleMeals(meals, targets.calories.dailyTarget);

  const dayTotals = meals.reduce(
    (a, meal) => ({
      kcal: a.kcal + meal.totals.kcal,
      proteinG: a.proteinG + meal.totals.proteinG,
      carbsG: a.carbsG + meal.totals.carbsG,
      fatG: a.fatG + meal.totals.fatG,
      fiberG: 0,
    }),
    { kcal: 0, proteinG: 0, carbsG: 0, fatG: 0, fiberG: 0 },
  );
  dayTotals.fiberG = targets.macros.fiberG;
  dayTotals.kcal = Math.round(dayTotals.kcal);
  dayTotals.proteinG = Math.round(dayTotals.proteinG);
  dayTotals.carbsG = Math.round(dayTotals.carbsG);
  dayTotals.fatG = Math.round(dayTotals.fatG);

  const pct = (got: number, want: number) =>
    want > 0 ? Math.round((got / want) * 100) : 100;

  // Educational micronutrient coverage: food estimates + multi contribution notes
  const vitamins: NutrientCoverage[] = targets.vitamins.slice(0, 10).map((v) => {
    const isD = v.name.startsWith("Vitamin D");
    const isC = v.name.startsWith("Vitamin C");
    const isB12 = v.name.includes("B12");
    const fromPlan = isD ? v.amount * 0.15 : isC ? v.amount * 0.7 : isB12 ? v.amount * 0.5 : v.amount * 0.55;
    return coverage(
      v.name,
      v.amount,
      v.unit,
      fromPlan,
      isD ? "kit D3 clinician-only — do not self-dose 10k IU" : "NOW ADAM/EVE typically covers much of daily need",
      v.note,
    );
  });

  const minerals: NutrientCoverage[] = targets.minerals.slice(0, 10).map((min) => {
    const isNa = min.name === "Sodium";
    const isMg = min.name === "Magnesium";
    const isK = min.name === "Potassium";
    const fromPlan = isNa ? min.amount * 0.8 : isMg ? min.amount * 0.55 : isK ? min.amount * 0.65 : min.amount * 0.5;
    return coverage(
      min.name,
      min.amount,
      min.unit,
      fromPlan,
      isNa ? "—" : "Multi helps; food still primary for K/Mg",
      min.note,
    );
  });

  const aminoAcids: NutrientCoverage[] = targets.aminoAcids.slice(0, 9).map((aa) => {
    // Hitting protein target with whey + animal/dairy foods usually covers EAAs
    const fromPlan = aa.amount * Math.min(1.1, dayTotals.proteinG / Math.max(1, proteinTarget));
    return coverage(
      aa.name,
      aa.amount,
      aa.unit,
      fromPlan,
      "Whey + meat/fish/eggs/yogurt",
      aa.note,
    );
  });

  const wheyKcal = wheyScoops * WHEY_SCOOP_KCAL;
  const wheyCarbsG = wheyScoops * 2;
  const wheyFatG = wheyScoops * 1;

  // NOW ADAM/EVE and D3 contribute ~0 macronutrients
  const gapRow = (
    nutrient: string,
    target: number,
    unit: string,
    fromKit: number,
    verdict: string,
  ): KitMacroGap => {
    const still = Math.max(0, Math.round((target - fromKit) * 10) / 10);
    const kitCoversPct = target > 0 ? Math.round((fromKit / target) * 100) : 0;
    return { nutrient, target, unit, fromKit, stillNeededFromFood: still, kitCoversPct, verdict };
  };

  const kitMacroGaps: KitMacroGap[] = [
    gapRow(
      "Calories",
      targets.calories.dailyTarget,
      "kcal",
      wheyKcal,
      "NOW multi/D3 ≈ 0 kcal. Almost all calories must come from food (plus whey scoops only).",
    ),
    gapRow(
      "Protein",
      targets.macros.proteinG,
      "g",
      wheyProteinG,
      wheyScoops > 0
        ? `Whey covers ~${wheyProteinG}g; remaining protein must come from eggs/meat/fish/dairy/plants. Multi adds ~0g protein.`
        : "No whey scoops planned — all protein from food. Multi adds ~0g protein.",
    ),
    gapRow(
      "Carbohydrates",
      targets.macros.carbsG,
      "g",
      wheyCarbsG,
      "Whey has only trace carbs; NOW multi/D3 ≈ 0g carbs. Carbs are almost entirely from food.",
    ),
    gapRow(
      "Fat",
      targets.macros.fatG,
      "g",
      wheyFatG,
      "Whey has only trace fat; NOW multi/D3 ≈ 0g fat. Fat is almost entirely from food (oils, avocado, meat, eggs, nuts).",
    ),
    gapRow(
      "Fiber",
      targets.macros.fiberG,
      "g",
      0,
      "Not covered by whey or NOW supplements. Fiber must come from vegetables, fruit, legumes, and/or whole grains.",
    ),
    gapRow(
      "Water / fluids",
      targets.macros.waterLiters,
      "L",
      0,
      "Shaker helps habit, but fluid volume is not a supplement nutrient — drink water/other fluids separately.",
    ),
  ];

  const kitGapSummary = alt
    ? [
        "Alternative priority: hit protein, amino acids, vitamins, and minerals — not carb/fat quotas.",
        "NOW ADAM/EVE cover many vitamins/minerals; whey covers a large share of protein/EAAs.",
        `Still need food for remaining protein (~${Math.max(0, proteinTarget - wheyProteinG)}g), potassium-rich plants, and any gaps the multi doesn’t fully fill.`,
        "Carbs and fat on this plan are flexible fuel only — use them to stay near the calorie target for fat-loss pace.",
        "NOW D3 10,000 IU stays clinician-gated — not part of the default daily menu.",
      ]
    : [
        "NOW ADAM/EVE and NOW D3 do not provide meaningful calories, protein, carbs, fat, or fiber.",
        `Whey (~${wheyScoops} scoop(s)) mainly covers protein (~${wheyProteinG}g) and a little energy (~${wheyKcal} kcal) — not a full macro plan.`,
        `Still needed from food ≈ ${Math.max(0, targets.macros.proteinG - wheyProteinG)}g protein · ${Math.max(0, targets.macros.carbsG - wheyCarbsG)}g carbs · ${Math.max(0, targets.macros.fatG - wheyFatG)}g fat · ${targets.macros.fiberG}g fiber · ~${Math.max(0, targets.calories.dailyTarget - wheyKcal)} kcal.`,
        "Potassium, sodium, and most food-matrix nutrients still come from meals even when a multi is used.",
        "High-dose D3 10,000 IU is not a daily macro or default vitamin D protocol from this app.",
      ];

  if (alt) {
    // Reframe carb/fat gap rows as non-primary
    for (const row of kitMacroGaps) {
      if (row.nutrient === "Carbohydrates" || row.nutrient === "Fat" || row.nutrient === "Fiber") {
        row.verdict = `${row.nutrient} is NOT a primary Alternative target — flexible. Focus on protein + micros instead.`;
      }
    }
  }

  const itemized: ItemizedFoodLine[] = [];
  let lineNo = 1;
  for (const meal of meals) {
    for (const item of meal.items) {
      itemized.push({
        line: lineNo++,
        meal: meal.name,
        timeHint: meal.timeHint,
        food: item.name,
        portion: item.portion,
        kcal: item.kcal,
        proteinG: item.proteinG,
        carbsG: item.carbsG,
        fatG: item.fatG,
        source: item.kit ? "kit" : "food",
      });
    }
  }

  const shoppingList = alt
    ? [
        KIT_PRODUCTS.whey.name,
        sex === "female" ? KIT_PRODUCTS.eve.name : KIT_PRODUCTS.adam.name,
        KIT_PRODUCTS.shaker.name,
        "Eggs (dozen)",
        "Chicken breast or turkey (2–3 lb)",
        "Salmon or sardines",
        "Leafy greens + broccoli/kale/Brussels",
        "Greek yogurt (plain)",
        "Pumpkin seeds",
        "Olive oil + optional bone broth",
      ]
    : [
        KIT_PRODUCTS.whey.name,
        sex === "female" ? KIT_PRODUCTS.eve.name : KIT_PRODUCTS.adam.name,
        KIT_PRODUCTS.shaker.name,
        "Eggs",
        "Chicken or turkey breast",
        "White fish or chicken",
        "Leafy greens / broccoli",
        "Oats, brown rice or quinoa, fruit",
        "Plain Greek yogurt",
        "Berries or other fruit",
      ];

  const prepTips = alt
    ? [
        "Primary checklist: (1) hit protein grams (2) take ADAM/EVE with food (3) eat leafy greens twice (4) whey closes AA/protein gaps.",
        "Do not chase carb or fat grams — use them only to land near your calorie target for fat-loss forecast.",
        `Mix whey in the Strada — about ${wheyScoops} scoop(s)/day toward ~${proteinTarget}g protein.`,
        "Rotate salmon / beef / liver weekly for micronutrient density (if you eat them).",
        "NOW D3 10,000 IU: skip unless clinician-cleared.",
      ]
    : [
        "Batch-cook protein (chicken/fish) twice a week; portion into lunch boxes.",
        `Mix whey in the Strada (${KIT_PRODUCTS.shaker.name}) — confirm scoop size on your bag.`,
        "Take ADAM or EVE with breakfast — do not combine both.",
        "NOW D3 10,000 IU: leave out of the daily menu unless a clinician cleared it.",
        "Keep added sugars low; lean on fruit, whole grains, and vegetables for carbs.",
      ];

  const proteinHitPct = pct(dayTotals.proteinG, proteinTarget);
  const aaHitPct = Math.min(120, proteinHitPct); // EAAs track protein quality on this template

  return {
    disclaimer: FOOD_PLAN_DISCLAIMER,
    title: alt
      ? "Alternative itemized plan (protein · vitamins · minerals · amino acids)"
      : "Detailed itemized food plan (CDC-style · kit-based)",
    summary: alt
      ? `Protein-first Alternative day (~${targets.calories.dailyTarget} kcal deficit band) built to hit ~${proteinTarget}g protein + multi-supported vitamins/minerals/EAAs. Carbs/fat are flexible — not success metrics.`
      : `Itemized full-day menu scaled to ~${targets.calories.dailyTarget} kcal with ~${wheyScoops} whey scoop(s) and ${sex === "female" ? "EVE" : "ADAM"}.`,
    style: alt ? "alternative" : "cdc",
    kitBase: {
      wheyScoops,
      wheyProteinG,
      wheyKcal,
      wheyCarbsG,
      wheyFatG,
      multi: multiName,
      multiUrl,
      d3Note: "NOW D3 10,000 IU is listed in the kit but not placed on the daily menu without clinician clearance.",
      shakerNote: `Use ${KIT_PRODUCTS.shaker.name} for whey and fluid blocks.`,
    },
    kitMacroGaps,
    kitGapSummary,
    itemized,
    meals,
    dayTotals,
    targets: {
      kcal: targets.calories.dailyTarget,
      proteinG: targets.macros.proteinG,
      carbsG: targets.macros.carbsG,
      fatG: targets.macros.fatG,
      fiberG: targets.macros.fiberG,
    },
    macroHit: {
      proteinPctOfTarget: proteinHitPct,
      carbsPctOfTarget: pct(dayTotals.carbsG, targets.macros.carbsG),
      fatPctOfTarget: pct(dayTotals.fatG, targets.macros.fatG),
      kcalPctOfTarget: pct(dayTotals.kcal, targets.calories.dailyTarget),
    },
    priorityGoals: alt
      ? {
          mode: "alt_protein_micros",
          note: "Success = protein + amino acids + vitamins + minerals. Ignore carb/fat % as goals.",
          proteinHitPct,
          aminoAcidHitPct: aaHitPct,
          vitaminNote: "NOW multi + greens/eggs/fish cover most vitamin placeholders (D3 high-dose still clinician-only).",
          mineralNote: "Multi helps; emphasize greens, seeds, yogurt, and broth for Mg/K/Ca food matrix.",
          carbsFatNote: "Carbs/fat shown only as fuel to stay near calorie target for weight-loss forecast.",
        }
      : {
          mode: "cdc_balanced",
          note: "CDC-style: carbs and fat remain intentional plate targets.",
          proteinHitPct,
          aminoAcidHitPct: aaHitPct,
          vitaminNote: "Multi + produce-forward meals.",
          mineralNote: "Multi + food.",
          carbsFatNote: "Carbs and fat are planned targets on CDC-style.",
        },
    vitamins,
    minerals,
    aminoAcids,
    shoppingList,
    prepTips,
  };
}
