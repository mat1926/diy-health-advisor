import type { MetricsInput } from "./plans";
import { resolvePerspective } from "./perspectives";
import type { DetailedTargets } from "./targets";
import { KIT_PRODUCTS, VITAMIN_D_OVERLOAD_NOTICE, VITAMIN_D_OVERLOAD_SYMPTOMS } from "./nutritionKit";

export const FOOD_PLAN_DISCLAIMER = `This detailed food plan is an educational template to illustrate how whey, a NOW multivitamin, Vitamin D3, and ordinary foods can approach VitalGauge macro and micronutrient targets. Portions are approximate. Brand labels override app summaries. It is not a medical diet, allergy-safe menu, or prescription. Skip or swap foods for allergies, religion, budget, or clinician advice. Stop Vitamin D3 if overload symptoms appear.`;

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

/** Nutrients still short after kit-only (Alternative) — with food options to close the gap. */
export type NutrientShortfall = {
  category: "macro" | "amino_acid" | "vitamin" | "mineral";
  name: string;
  target: number;
  fromKit: number;
  shortfall: number;
  unit: string;
  suggestions: string[];
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
  /** Alternative: nutrients below target after kit-only, with closing options. */
  shortfalls: NutrientShortfall[];
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
  vitaminDOverloadNotice?: string;
  vitaminDOverloadSymptoms?: string[];
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

function d3Softgel(): FoodItem {
  return {
    name: "NOW Vitamin D3 10,000 IU (kit)",
    portion: "1 softgel with a meal that has some fat (confirm frequency with clinician/labs)",
    kcal: 0,
    proteinG: 0,
    carbsG: 0,
    fatG: 0,
    kit: true,
    notes: `${KIT_PRODUCTS.d3.url} · ${VITAMIN_D_OVERLOAD_NOTICE}`,
  };
}

/** Alternative: kit-only day (whey + multi + D3). Food is suggested only to close shortfalls. */
function altKitOnlyTemplate(scoops: number, sex: MetricsInput["sex"]): MealBlock[] {
  const morning: FoodItem[] = [multiItem(sex), d3Softgel()];
  const shakeScoops = Math.min(scoops, 2);
  if (shakeScoops >= 1) morning.push(wheyShake(shakeScoops));

  const later: FoodItem[] = [];
  const rest = Math.max(0, scoops - shakeScoops);
  if (rest > 0) later.push(wheyShake(rest));
  if (later.length === 0) {
    later.push({
      name: "Strada shaker (kit)",
      portion: "Water / fluids as needed",
      kcal: 0,
      proteinG: 0,
      carbsG: 0,
      fatG: 0,
      kit: true,
      notes: KIT_PRODUCTS.shaker.url,
    });
  }

  return [
    {
      name: "Kit — morning",
      timeHint: "Multi + Vitamin D3 + whey",
      items: morning,
      totals: sumItems(morning),
    },
    {
      name: "Kit — later",
      timeHint: "Remaining whey / fluids",
      items: later,
      totals: sumItems(later),
    },
  ];
}

const SHORTFALL_SUGGESTIONS: Record<string, string[]> = {
  Protein: [
    "Eggs (2–4)",
    "Chicken or turkey breast (4–8 oz)",
    "Greek yogurt (1 cup)",
    "Salmon / white fish (4–6 oz)",
    "Extra whey scoop if your label and tolerance allow",
  ],
  Histidine: ["Whey", "Chicken", "Eggs", "Fish"],
  Isoleucine: ["Whey", "Eggs", "Turkey", "Greek yogurt"],
  Leucine: ["Whey", "Chicken", "Eggs", "Cottage cheese"],
  Lysine: ["Whey", "Fish", "Chicken", "Greek yogurt"],
  "Methionine + Cysteine": ["Eggs", "Fish", "Poultry", "Whey"],
  "Phenylalanine + Tyrosine": ["Eggs", "Dairy", "Meat", "Whey"],
  Threonine: ["Whey", "Poultry", "Eggs"],
  Tryptophan: ["Turkey", "Eggs", "Dairy", "Whey"],
  Valine: ["Whey", "Meat", "Dairy", "Eggs"],
  "Total essential amino acids (sum of above)": [
    "Hit the protein target with whey + eggs/meat/fish/dairy",
  ],
  "Vitamin A (food-first)": ["Eggs", "Liver (occasional)", "Leafy greens", "Salmon"],
  "Vitamin C": ["Bell peppers", "Broccoli", "Berries", "Citrus if tolerated"],
  "Vitamin D": [
    "Kit NOW D3 already covers educational D target when used as directed",
    "Fatty fish (salmon/sardines) as food support",
    "Stop D3 and seek care if overload symptoms appear",
  ],
  "Vitamin E": ["Almonds", "Sunflower seeds", "Avocado", "Olive oil"],
  "Vitamin K": ["Kale", "Spinach", "Broccoli", "Brussels sprouts"],
  "Thiamin (B1)": ["Pork", "Eggs", "Seeds", "Nutritional yeast if used"],
  "Riboflavin (B2)": ["Eggs", "Dairy", "Liver (occasional)", "Almonds"],
  "Niacin (B3)": ["Chicken", "Turkey", "Fish", "Mushrooms"],
  "Vitamin B6": ["Chicken", "Fish", "Eggs", "Spinach"],
  "Folate (DFE)": ["Leafy greens", "Broccoli", "Asparagus", "Liver (occasional)"],
  "Vitamin B12": ["Eggs", "Fish", "Meat", "Dairy"],
  "Pantothenic acid (B5)": ["Eggs", "Avocado", "Chicken", "Mushrooms"],
  Biotin: ["Eggs", "Nuts", "Seeds"],
  Choline: ["Eggs (best DIY source)", "Liver (occasional)", "Soy if tolerated"],
  Calcium: ["Greek yogurt", "Cheese", "Canned sardines with bones", "Leafy greens"],
  Iron: ["Red meat", "Liver (occasional)", "Pumpkin seeds", "Pair with vitamin C foods"],
  Magnesium: ["Pumpkin seeds", "Leafy greens", "Almonds", "Dark chocolate (small)"],
  Zinc: ["Beef", "Pumpkin seeds", "Eggs", "Shellfish if eaten"],
  Potassium: ["Avocado", "Leafy greens", "Salmon", "Bone broth", "Zucchini"],
  Phosphorus: ["Eggs", "Dairy", "Meat", "Fish"],
  Selenium: ["Brazil nuts (1–2)", "Fish", "Eggs", "Poultry"],
  Iodine: ["Seafood", "Dairy", "Eggs", "Iodized salt sparingly"],
  Copper: ["Liver (occasional)", "Nuts", "Seeds", "Dark chocolate (small)"],
  Manganese: ["Nuts", "Seeds", "Leafy greens", "Tea"],
  Chromium: ["Broccoli", "Eggs", "Meat"],
};

function suggestionsFor(name: string): string[] {
  return (
    SHORTFALL_SUGGESTIONS[name] ?? [
      "Add protein-forward whole foods (eggs, meat/fish, dairy, leafy greens)",
      "Confirm NOW ADAM/EVE label dose is taken with food",
    ]
  );
}

/** Vitamins typically well covered by NOW ADAM/EVE when taken as labeled (educational). */
const MULTI_COVERED_VITAMINS = new Set([
  "Vitamin A (food-first)",
  "Vitamin A (RAE)",
  "Vitamin C",
  "Vitamin E",
  "Vitamin K",
  "Thiamin (B1)",
  "Riboflavin (B2)",
  "Niacin (B3)",
  "Vitamin B6",
  "Folate (DFE)",
  "Vitamin B12",
  "Pantothenic acid (B5)",
  "Biotin",
]);

/** Minerals with meaningful multi contribution (educational — labels vary). */
const MULTI_HELP_MINERALS = new Set([
  "Calcium",
  "Iron",
  "Magnesium",
  "Zinc",
  "Phosphorus",
  "Selenium",
  "Iodine",
  "Copper",
  "Manganese",
  "Chromium",
]);

/** CDC-style higher-carb day template (pre-scale). */
function cdcTemplate(scoops: number, sex: MetricsInput["sex"]): MealBlock[] {
  const breakfast: FoodItem[] = [
    { name: "Oats cooked in water or milk", portion: "¾ cup dry oats", kcal: 230, proteinG: 8, carbsG: 40, fatG: 4 },
    { name: "Berries", portion: "1 cup", kcal: 70, proteinG: 1, carbsG: 17, fatG: 0.5 },
    { name: "Eggs", portion: "2 large", kcal: 140, proteinG: 12, carbsG: 1, fatG: 10 },
    multiItem(sex),
    d3Softgel(),
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

  // Alt = kit-only protein (whey); CDC still assumes ~60% food protein + whey gap
  const wheyScoops = alt
    ? Math.min(3, Math.max(1, Math.ceil(proteinTarget / WHEY_SCOOP_PROTEIN)))
    : Math.min(
        3,
        Math.max(0, Math.ceil((proteinTarget - Math.round(proteinTarget * 0.6)) / WHEY_SCOOP_PROTEIN)),
      );
  const wheyProteinG = wheyScoops * WHEY_SCOOP_PROTEIN;

  const sex = m.sex ?? "prefer_not";
  const multiName = sex === "female" ? KIT_PRODUCTS.eve.name : KIT_PRODUCTS.adam.name;
  const multiUrl = sex === "female" ? KIT_PRODUCTS.eve.url : KIT_PRODUCTS.adam.url;

  let meals = alt ? altKitOnlyTemplate(wheyScoops, sex) : cdcTemplate(wheyScoops, sex);
  if (!alt) {
    meals = scaleMeals(meals, targets.calories.dailyTarget);
  }

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
  dayTotals.fiberG = alt ? 0 : targets.macros.fiberG;
  dayTotals.kcal = Math.round(dayTotals.kcal);
  dayTotals.proteinG = Math.round(dayTotals.proteinG);
  dayTotals.carbsG = Math.round(dayTotals.carbsG);
  dayTotals.fatG = Math.round(dayTotals.fatG);

  const pct = (got: number, want: number) =>
    want > 0 ? Math.round((got / want) * 100) : 100;

  const proteinRatio = Math.min(1.15, dayTotals.proteinG / Math.max(1, proteinTarget));
  const shortfalls: NutrientShortfall[] = [];

  const pushShortfall = (
    category: NutrientShortfall["category"],
    name: string,
    target: number,
    fromKit: number,
    unit: string,
  ) => {
    const shortfall = Math.max(0, Math.round((target - fromKit) * 10) / 10);
    if (shortfall <= 0 || (target > 0 && fromKit / target >= 0.9)) return;
    shortfalls.push({
      category,
      name,
      target,
      fromKit: Math.round(fromKit * 10) / 10,
      shortfall,
      unit,
      suggestions: suggestionsFor(name),
    });
  };

  // Educational micronutrient coverage
  const vitamins: NutrientCoverage[] = targets.vitamins.map((v) => {
    const isD = v.name.startsWith("Vitamin D");
    const isCholine = v.name === "Choline";
    let fromPlan: number;
    let fromMulti: string;
    if (alt) {
      if (isD) {
        fromPlan = v.amount;
        fromMulti = "Kit NOW D3 10,000 IU included in plan — stop if overload symptoms";
      } else if (isCholine) {
        fromPlan = v.amount * 0.15;
        fromMulti = "Multi usually low in choline — food needed";
      } else if (MULTI_COVERED_VITAMINS.has(v.name)) {
        fromPlan = v.amount;
        fromMulti = "NOW ADAM/EVE (kit) — as labeled";
      } else {
        fromPlan = v.amount * 0.4;
        fromMulti = "Partial from multi — confirm label";
      }
    } else {
      const isC = v.name.startsWith("Vitamin C");
      const isB12 = v.name.includes("B12");
      fromPlan = isD ? v.amount : isC ? v.amount * 0.7 : isB12 ? v.amount * 0.5 : v.amount * 0.55;
      fromMulti = isD
        ? "Kit NOW D3 included — stop if overload symptoms; confirm frequency with clinician"
        : "NOW ADAM/EVE typically covers much of daily need";
    }
    const row = coverage(v.name, v.amount, v.unit, fromPlan, fromMulti, v.note);
    if (alt && row.status !== "on_track") {
      pushShortfall("vitamin", v.name, v.amount, fromPlan, v.unit);
    }
    return row;
  });

  const minerals: NutrientCoverage[] = targets.minerals.map((min) => {
    const isNa = min.name === "Sodium";
    const isK = min.name === "Potassium";
    const isMg = min.name === "Magnesium";
    let fromPlan: number;
    let fromMulti: string;
    if (alt) {
      if (isNa) {
        // Not a “hit this” target on Alternative — skip shortfall
        fromPlan = min.amount;
        fromMulti = "Upper-limit style figure — not a kit hit-target";
      } else if (isK) {
        fromPlan = min.amount * 0.05;
        fromMulti = "Multi does not meaningfully cover potassium — food needed";
      } else if (isMg) {
        fromPlan = min.amount * 0.45;
        fromMulti = "Multi helps partially — greens/seeds usually still needed";
      } else if (MULTI_HELP_MINERALS.has(min.name)) {
        fromPlan = min.amount * 0.85;
        fromMulti = "NOW ADAM/EVE (kit) — as labeled";
      } else {
        fromPlan = min.amount * 0.3;
        fromMulti = "Limited from multi — food focus";
      }
    } else {
      fromPlan = isNa ? min.amount * 0.8 : isMg ? min.amount * 0.55 : isK ? min.amount * 0.65 : min.amount * 0.5;
      fromMulti = isNa ? "—" : "Multi helps; food still primary for K/Mg";
    }
    const row = coverage(min.name, min.amount, min.unit, fromPlan, fromMulti, min.note);
    if (alt && !isNa && row.status !== "on_track") {
      pushShortfall("mineral", min.name, min.amount, fromPlan, min.unit);
    }
    return row;
  });

  const aminoAcids: NutrientCoverage[] = targets.aminoAcids.map((aa) => {
    const fromPlan = aa.amount * proteinRatio;
    const row = coverage(
      aa.name,
      aa.amount,
      aa.unit,
      fromPlan,
      alt ? "From kit whey protein (complete protein)" : "Whey + meat/fish/eggs/yogurt",
      aa.note,
    );
    if (alt && row.status !== "on_track") {
      pushShortfall("amino_acid", aa.name, aa.amount, fromPlan, aa.unit);
    }
    return row;
  });

  if (alt) {
    pushShortfall("macro", "Protein", proteinTarget, wheyProteinG, "g");
  }

  const wheyKcal = wheyScoops * WHEY_SCOOP_KCAL;
  const wheyCarbsG = wheyScoops * 2;
  const wheyFatG = wheyScoops * 1;

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

  const kitMacroGaps: KitMacroGap[] = alt
    ? [
        gapRow(
          "Protein",
          targets.macros.proteinG,
          "g",
          wheyProteinG,
          `Kit whey (~${wheyScoops} scoop(s)) covers ~${wheyProteinG}g. Add food options below if short of ~${proteinTarget}g.`,
        ),
      ]
    : [
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
        "Alternative plan shows kit products only (whey + NOW multi + Strada). No calorie target.",
        `Protein from kit whey ≈ ${wheyProteinG}g of ~${proteinTarget}g goal.`,
        shortfalls.length > 0
          ? `${shortfalls.length} nutrient(s) still below target after kit — see shortfalls with food options.`
          : "Kit appears to cover listed primary targets on this educational model (verify labels).",
        "NOW D3 10,000 IU is included for vitamin D — discontinue immediately if overload symptoms appear.",
        targets.fatStores && targets.fatStores.excessLb > 0
          ? targets.fatStores.reservesLine
          : "Little excess above ideal BMI modeled as fat stores.",
      ]
    : [
        "NOW ADAM/EVE and NOW D3 do not provide meaningful calories, protein, carbs, fat, or fiber.",
        `Whey (~${wheyScoops} scoop(s)) mainly covers protein (~${wheyProteinG}g) and a little energy (~${wheyKcal} kcal) — not a full macro plan.`,
        `Still needed from food ≈ ${Math.max(0, targets.macros.proteinG - wheyProteinG)}g protein · ${Math.max(0, targets.macros.carbsG - wheyCarbsG)}g carbs · ${Math.max(0, targets.macros.fatG - wheyFatG)}g fat · ${targets.macros.fiberG}g fiber · ~${Math.max(0, targets.calories.dailyTarget - wheyKcal)} kcal.`,
        "Potassium, sodium, and most food-matrix nutrients still come from meals even when a multi is used.",
        "Vitamin D3 (kit) is included — stop and seek care if overload symptoms appear.",
      ];

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

  const foodOptions = [
    ...new Set(shortfalls.flatMap((s) => s.suggestions).slice(0, 24)),
  ];

  const shoppingList = alt
    ? [
        KIT_PRODUCTS.whey.name,
        sex === "female" ? KIT_PRODUCTS.eve.name : KIT_PRODUCTS.adam.name,
        KIT_PRODUCTS.d3.name,
        KIT_PRODUCTS.shaker.name,
        KIT_PRODUCTS.phStrips.name,
        KIT_PRODUCTS.renphoBp.name,
        KIT_PRODUCTS.renphoScale.name,
        ...(foodOptions.length
          ? ["— Foods to close shortfalls —", ...foodOptions]
          : ["Kit covers modeled primary targets — add whole foods as desired"]),
      ]
    : [
        KIT_PRODUCTS.whey.name,
        sex === "female" ? KIT_PRODUCTS.eve.name : KIT_PRODUCTS.adam.name,
        KIT_PRODUCTS.d3.name,
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
        "Use kit only as the base: whey scoops + ADAM/EVE + Vitamin D3 with a meal that has some fat.",
        `Mix ~${wheyScoops} whey scoop(s)/day in the Strada toward ~${proteinTarget}g protein.`,
        shortfalls.length
          ? `Close the ${shortfalls.length} shortfall(s) with the suggested foods — do not chase carbs/fat grams.`
          : "No major shortfalls on this educational kit model — still eat real food for satiety and fiber.",
        "Carbs and fat are flexible on Alternative — there is no calorie target in this plan view.",
        "Vitamin D3: stop immediately if overload symptoms appear (nausea, thirst, frequent urination, confusion, weakness, etc.) and contact a clinician.",
      ]
    : [
        "Batch-cook protein (chicken/fish) twice a week; portion into lunch boxes.",
        `Mix whey in the Strada (${KIT_PRODUCTS.shaker.name}) — confirm scoop size on your bag.`,
        "Take ADAM or EVE with breakfast — do not combine both.",
        "Take kit Vitamin D3 with a meal that has some fat; confirm frequency with a clinician for 10,000 IU softgels.",
        "Stop Vitamin D3 if overload symptoms appear and seek care.",
        "Keep added sugars low; lean on fruit, whole grains, and vegetables for carbs.",
      ];

  const proteinHitPct = pct(dayTotals.proteinG, proteinTarget);
  const aaHitPct = Math.min(120, proteinHitPct);

  return {
    disclaimer: alt
      ? `Alternative kit-only plan: educational coverage from whey + NOW multi + Vitamin D3. Shortfalls list foods that can close gaps. Not a medical diet. Labels override app estimates. ${VITAMIN_D_OVERLOAD_NOTICE}`
      : `${FOOD_PLAN_DISCLAIMER} ${VITAMIN_D_OVERLOAD_NOTICE}`,
    title: alt
      ? "Alternative kit plan (whey · multi · D3) + shortfalls to close"
      : "Detailed itemized food plan (CDC-style · kit-based)",
    summary: alt
      ? `Kit-only base: ~${wheyScoops} whey scoop(s) (~${wheyProteinG}g protein) + ${sex === "female" ? "EVE" : "ADAM"} + Vitamin D3. ${
          shortfalls.length
            ? `${shortfalls.length} nutrient(s) still below target — see options below.`
            : "Modeled primary targets covered by kit (verify labels)."
        }${
          targets.fatStores?.excessLb
            ? ` ${targets.fatStores.reservesLine}`
            : ""
        } No calorie target on Alternative. Stop D3 if overload symptoms appear.`
      : `Itemized full-day menu scaled to ~${targets.calories.dailyTarget} kcal with ~${wheyScoops} whey scoop(s), ${sex === "female" ? "EVE" : "ADAM"}, and Vitamin D3.`,
    style: alt ? "alternative" : "cdc",
    kitBase: {
      wheyScoops,
      wheyProteinG,
      wheyKcal,
      wheyCarbsG,
      wheyFatG,
      multi: multiName,
      multiUrl,
      d3Note: `NOW D3 10,000 IU is included in the plan with a meal that has fat. ${VITAMIN_D_OVERLOAD_NOTICE}`,
      shakerNote: `Use ${KIT_PRODUCTS.shaker.name} for whey and fluid blocks.`,
    },
    kitMacroGaps,
    kitGapSummary,
    shortfalls,
    itemized,
    meals,
    dayTotals,
    targets: {
      kcal: alt ? 0 : targets.calories.dailyTarget,
      proteinG: targets.macros.proteinG,
      carbsG: alt ? 0 : targets.macros.carbsG,
      fatG: alt ? 0 : targets.macros.fatG,
      fiberG: alt ? 0 : targets.macros.fiberG,
    },
    macroHit: {
      proteinPctOfTarget: proteinHitPct,
      carbsPctOfTarget: alt ? 0 : pct(dayTotals.carbsG, targets.macros.carbsG),
      fatPctOfTarget: alt ? 0 : pct(dayTotals.fatG, targets.macros.fatG),
      kcalPctOfTarget: alt ? 0 : pct(dayTotals.kcal, targets.calories.dailyTarget),
    },
    priorityGoals: alt
      ? {
          mode: "alt_protein_micros",
          note: "Success = protein + amino acids + vitamins + minerals from kit (incl. D3), then foods that close shortfalls. No calorie target.",
          proteinHitPct,
          aminoAcidHitPct: aaHitPct,
          vitaminNote:
            shortfalls.filter((s) => s.category === "vitamin").length > 0
              ? `${shortfalls.filter((s) => s.category === "vitamin").length} vitamin shortfall(s) — see options.`
              : "Vitamins largely covered by NOW multi + D3 on this model.",
          mineralNote:
            shortfalls.filter((s) => s.category === "mineral").length > 0
              ? `${shortfalls.filter((s) => s.category === "mineral").length} mineral shortfall(s) — see options.`
              : "Minerals largely covered by NOW multi on this model (K/Mg often still need food).",
          carbsFatNote: "Carbs/fat are not Alternative targets. No calorie target.",
        }
      : {
          mode: "cdc_balanced",
          note: "CDC-style: carbs and fat remain intentional plate targets. Vitamin D3 from kit is included.",
          proteinHitPct,
          aminoAcidHitPct: aaHitPct,
          vitaminNote: "Multi + Vitamin D3 + produce-forward meals.",
          mineralNote: "Multi + food.",
          carbsFatNote: "Carbs and fat are planned targets on CDC-style.",
        },
    vitamins,
    minerals,
    aminoAcids,
    shoppingList,
    prepTips,
    vitaminDOverloadNotice: VITAMIN_D_OVERLOAD_NOTICE,
    vitaminDOverloadSymptoms: [...VITAMIN_D_OVERLOAD_SYMPTOMS],
  };
}
