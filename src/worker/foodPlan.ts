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

export type DetailedFoodPlan = {
  disclaimer: string;
  title: string;
  summary: string;
  style: "cdc" | "alternative";
  kitBase: {
    wheyScoops: number;
    wheyProteinG: number;
    multi: string;
    multiUrl: string;
    d3Note: string;
    shakerNote: string;
  };
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

/** Alternative / lower-refined-carb day template (pre-scale). */
function altTemplate(scoops: number, sex: MetricsInput["sex"]): MealBlock[] {
  const breakfast: FoodItem[] = [
    { name: "Eggs (scrambled or boiled)", portion: "3 large", kcal: 210, proteinG: 18, carbsG: 2, fatG: 15 },
    { name: "Spinach sautéed in olive oil", portion: "2 cups cooked", kcal: 90, proteinG: 4, carbsG: 4, fatG: 7 },
    { name: "Avocado", portion: "½ medium", kcal: 120, proteinG: 1.5, carbsG: 6, fatG: 11 },
    multiItem(sex),
  ];
  if (scoops >= 1) breakfast.push(wheyShake(Math.min(1, scoops)));

  const lunch: FoodItem[] = [
    { name: "Grilled chicken thigh or breast", portion: "6 oz cooked", kcal: 280, proteinG: 42, carbsG: 0, fatG: 12 },
    { name: "Mixed leafy salad", portion: "Large bowl", kcal: 40, proteinG: 3, carbsG: 6, fatG: 0 },
    { name: "Olive oil + vinegar", portion: "1.5 tbsp oil", kcal: 180, proteinG: 0, carbsG: 1, fatG: 20 },
    { name: "Cucumber + cherry tomatoes", portion: "1 cup", kcal: 30, proteinG: 1, carbsG: 6, fatG: 0 },
  ];

  const dinner: FoodItem[] = [
    { name: "Salmon (baked)", portion: "6 oz", kcal: 350, proteinG: 34, carbsG: 0, fatG: 22 },
    { name: "Broccoli", portion: "2 cups", kcal: 60, proteinG: 5, carbsG: 12, fatG: 0.5 },
    { name: "Butter or olive oil on veg", portion: "1 tbsp", kcal: 100, proteinG: 0, carbsG: 0, fatG: 11 },
    { name: "Berries", portion: "¾ cup", kcal: 50, proteinG: 0.5, carbsG: 12, fatG: 0.5 },
  ];

  const snacks: FoodItem[] = [
    { name: "Greek yogurt (plain, full-fat)", portion: "¾ cup", kcal: 150, proteinG: 15, carbsG: 6, fatG: 8 },
    { name: "Almonds", portion: "1 oz (about 23)", kcal: 160, proteinG: 6, carbsG: 6, fatG: 14 },
  ];
  if (scoops >= 2) snacks.unshift(wheyShake(scoops - 1));

  return [
    { name: "Breakfast", timeHint: "Within 1–2 h of waking", items: breakfast, totals: sumItems(breakfast) },
    { name: "Lunch", timeHint: "Midday", items: lunch, totals: sumItems(lunch) },
    { name: "Dinner", timeHint: "Earlier evening when possible", items: dinner, totals: sumItems(dinner) },
    { name: "Snacks / shake", timeHint: "Afternoon or post-walk", items: snacks, totals: sumItems(snacks) },
  ];
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
  const foodProtein = Math.round(proteinTarget * 0.6);
  const gap = Math.max(0, proteinTarget - foodProtein);
  const wheyScoops = Math.min(3, Math.max(0, Math.ceil(gap / WHEY_SCOOP_PROTEIN)));
  const wheyProteinG = wheyScoops * WHEY_SCOOP_PROTEIN;

  const sex = m.sex ?? "prefer_not";
  const multiName = sex === "female" ? KIT_PRODUCTS.eve.name : KIT_PRODUCTS.adam.name;
  const multiUrl = sex === "female" ? KIT_PRODUCTS.eve.url : KIT_PRODUCTS.adam.url;

  let meals = alt ? altTemplate(wheyScoops, sex) : cdcTemplate(wheyScoops, sex);
  meals = scaleMeals(meals, targets.calories.dailyTarget);

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

  const shoppingList = [
    KIT_PRODUCTS.whey.name,
    sex === "female" ? KIT_PRODUCTS.eve.name : KIT_PRODUCTS.adam.name,
    KIT_PRODUCTS.shaker.name,
    "Eggs",
    alt ? "Chicken thighs or breast" : "Chicken or turkey breast",
    alt ? "Salmon" : "White fish or chicken",
    "Leafy greens / broccoli",
    alt ? "Avocado, olive oil, almonds" : "Oats, brown rice or quinoa, fruit",
    "Plain Greek yogurt",
    "Berries or other fruit",
  ];

  const prepTips = [
    "Batch-cook protein (chicken/fish) twice a week; portion into lunch boxes.",
    `Mix whey in the Strada (${KIT_PRODUCTS.shaker.name}) — confirm scoop size on your bag.`,
    "Take ADAM or EVE with breakfast — do not combine both.",
    "NOW D3 10,000 IU: leave out of the daily menu unless a clinician cleared it.",
    alt
      ? "Keep refined carbs low; use berries and non-starchy vegetables as your main carbs."
      : "Keep added sugars low; lean on fruit, whole grains, and vegetables for carbs.",
  ];

  return {
    disclaimer: FOOD_PLAN_DISCLAIMER,
    title: alt
      ? "Detailed food plan (alternative · kit-based)"
      : "Detailed food plan (CDC-style · kit-based)",
    summary: `A full-day menu scaled to ~${targets.calories.dailyTarget} kcal with ~${wheyScoops} whey scoop(s) and ${sex === "female" ? "EVE" : "ADAM"} as the vitamin/mineral base. Educational portions — adjust for hunger, training, and clinician advice.`,
    style: alt ? "alternative" : "cdc",
    kitBase: {
      wheyScoops,
      wheyProteinG,
      multi: multiName,
      multiUrl,
      d3Note: "NOW D3 10,000 IU is listed in the kit but not placed on the daily menu without clinician clearance.",
      shakerNote: `Use ${KIT_PRODUCTS.shaker.name} for whey and fluid blocks.`,
    },
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
      proteinPctOfTarget: pct(dayTotals.proteinG, targets.macros.proteinG),
      carbsPctOfTarget: pct(dayTotals.carbsG, targets.macros.carbsG),
      fatPctOfTarget: pct(dayTotals.fatG, targets.macros.fatG),
      kcalPctOfTarget: pct(dayTotals.kcal, targets.calories.dailyTarget),
    },
    vitamins,
    minerals,
    aminoAcids,
    shoppingList,
    prepTips,
  };
}
