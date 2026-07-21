import type { MetricsInput } from "./plans";
import type { DetailedTargets } from "./targets";
import { productImageUrl } from "./amazonAssociates";

export const NUTRITION_KIT_DISCLAIMER = `This Nutrition Kit plan maps educational VitalGauge targets to specific retail products for DIY convenience. It is not medical advice, a prescription, or an FDA-evaluated protocol. Multivitamins and vitamin D do not replace food or lab-guided care. Home pH strips, BP cuffs, smart scales, and personal ECG devices are for self-tracking only — not diagnoses. Stop vitamin D and seek care if overload symptoms appear. Choose ADAM or EVE by sex — do not combine unless a clinician directs. Product labels override any summary here.`;

/** Educational safety notice for kit Vitamin D3 (NIH ODS–aligned symptom themes). */
export const VITAMIN_D_OVERLOAD_SYMPTOMS = [
  "Nausea or vomiting",
  "Loss of appetite",
  "Constipation or abdominal pain",
  "Muscle weakness or unusual fatigue",
  "Confusion, irritability, or trouble thinking clearly",
  "Excessive thirst",
  "Frequent or large-volume urination",
  "Dehydration",
  "Bone or body pain",
  "In severe cases: kidney problems, irregular heartbeat — seek emergency care",
] as const;

export const VITAMIN_D_OVERLOAD_NOTICE = `Stop the Vitamin D3 supplement immediately and contact a clinician (or emergency care if severe) if you notice signs of vitamin D overload / excess, which are usually linked to high blood calcium. Common warning symptoms: ${VITAMIN_D_OVERLOAD_SYMPTOMS.slice(0, -1).join("; ")}. ${VITAMIN_D_OVERLOAD_SYMPTOMS[VITAMIN_D_OVERLOAD_SYMPTOMS.length - 1]}. Do not restart high-dose D3 without clinician guidance and labs. You cannot get vitamin D overload from normal sun exposure alone.`;

/** One-line pointer — full symptom list lives in the Vitamin D3 safety section. */
export const VITAMIN_D_OVERLOAD_SHORT =
  "Stop D3 immediately if overload signs appear — see the Vitamin D3 safety list in this plan.";

export type KitProduct = {
  asin: string;
  name: string;
  url: string;
  role: string;
  imageUrl?: string | null;
};

export const KIT_PRODUCTS = {
  whey: {
    asin: "B06XX65GS1",
    name: "Raw grass-fed whey protein (unflavored, 5 lb)",
    url: "https://www.amazon.com/dp/B06XX65GS1",
    role: "Close daily protein / essential amino acid gap",
  },
  shaker: {
    asin: "B084PVQGH1",
    name: "BlenderBottle Strada shaker (24 oz)",
    url: "https://www.amazon.com/dp/B084PVQGH1",
    role: "Mix shakes and support fluid intake",
  },
  d3: {
    asin: "B00F45EQ4W",
    name: "NOW Vitamin D3 10,000 IU softgels",
    url: "https://www.amazon.com/dp/B00F45EQ4W",
    role: "Vitamin D supplement toward educational D target (watch for overload symptoms)",
  },
  adam: {
    asin: "B0013OVWWM",
    name: "NOW ADAM men’s multivitamin (120 tablets)",
    url: "https://www.amazon.com/dp/B0013OVWWM",
    role: "Daily vitamins & minerals for many adult men",
  },
  eve: {
    asin: "B000JN6MBO",
    name: "NOW EVE women’s multivitamin (180 tablets)",
    url: "https://www.amazon.com/dp/B000JN6MBO",
    role: "Daily vitamins & minerals for many adult women (includes iron)",
  },
  phStrips: {
    asin: "B01GFSEB00",
    name: "pH test strips (saliva & urine)",
    url: "https://www.amazon.com/dp/B01GFSEB00",
    role: "Log DIY saliva pH (and optional urine pH) in VitalGauge",
  },
  multistix: {
    asin: "B06WCZVMLC",
    name: "Siemens Multistix 10 SG urine test strips",
    url: "https://www.amazon.com/dp/B06WCZVMLC",
    role: "Log all 10 urine pads in VitalGauge demographics (educational DIY)",
  },
  renphoBp: {
    asin: "B08J7XWM75",
    name: "RENPHO upper-arm blood pressure monitor",
    url: "https://www.amazon.com/Pressure-RENPHO-Wireless-Unlimited-Bluetooth/dp/B08J7XWM75",
    role: "Home BP seated + standing + pulse for VitalGauge vitals",
  },
  renphoScale: {
    asin: "B01N1UX8RW",
    name: "RENPHO smart body scale",
    url: "https://www.amazon.com/dp/B01N1UX8RW",
    role: "Track weight (and optional body metrics) for demographics & progress",
  },
  morphoScanScale: {
    asin: "B0FJFL8KP4",
    name: "RENPHO MorphoScan Nova body composition scale (8-electrode)",
    url: "https://www.amazon.com/dp/B0FJFL8KP4",
    role: "Advanced weight + body composition for demographics & progress (Advanced kit)",
  },
  kardiaMobile: {
    asin: "B097Q4SLDP",
    name: "KardiaMobile personal ECG (FDA-cleared)",
    url: "https://www.amazon.com/dp/B097Q4SLDP",
    role: "Optional single-lead ECG self-check alongside BP/HR logging (Advanced kit)",
  },
  potassiumBicarb: {
    asin: "B07B8W4LFX",
    name: "Earthborn Elements potassium bicarbonate (2.5 lb)",
    url: "https://www.amazon.com/dp/B07B8W4LFX",
    role: "Close potassium shortfall (follow label; electrolyte caution)",
  },
  traceMinerals: {
    asin: "B000AMUWLK",
    name: "Trace ConcenTrace Trace Mineral Drops (8 fl oz)",
    url: "https://www.amazon.com/dp/B000AMUWLK",
    role: "Support magnesium, potassium, and trace-mineral shortfalls",
  },
  magGlycinate: {
    asin: "B07NWMVMT1",
    name: "NOW Magnesium Glycinate 100 mg (180 tablets)",
    url: "https://www.amazon.com/dp/B07NWMVMT1",
    role: "Close magnesium shortfall with a gentle glycinate form",
  },
  coralCalcium: {
    asin: "B0013OSM5W",
    name: "NOW Coral Calcium Plus (250 veg capsules)",
    url: "https://www.amazon.com/dp/B0013OSM5W",
    role: "Close calcium shortfall; educational bone/pH support",
  },
} as const satisfies Record<string, KitProduct>;

/**
 * Staple foods used with the kit to close Alternative shortfalls (not a full menu).
 * Eggs: ~147 mg choline/large egg (USDA). 4 large ≈ 588 mg covers male 550 mg and female 425 mg educational targets.
 */
export const SHORTFALL_STAPLES = {
  eggs: {
    asin: "B09R9Q47LJ",
    name: "New Barn Organics Regenerative Organic Pasture Raised Eggs (12 ct)",
    url: "https://www.amazon.com/Organic-Large-Pasture-Raised-Count/dp/B09R9Q47LJ",
    count: 4,
    portion: "4 large",
    proteinG: 24,
    cholineMg: 588,
    kcal: 280,
    fatG: 20,
    role: "Protein, choline (covers educational target), B12, selenium, and amino acids",
  },
  greekYogurt: {
    asin: "B01NBBVPLI",
    name: "Stonyfield Organic Greek Whole Milk Yogurt Plain (30 oz)",
    url: "https://www.amazon.com/Stonyfield-Whole-Greek-Yogurt-Plain/dp/B01NBBVPLI",
    portion: "1 cup (~170 g label serving)",
    proteinG: 16,
    role: "Protein, calcium, potassium support, and amino acids",
  },
} as const;

/** Label claim varies by lot — educational default scoop size. */
const WHEY_PROTEIN_G_PER_SCOOP = 25;
const SHAKE_FLUID_OZ = 24;

export type NutritionKitPlan = {
  disclaimer: string;
  title: string;
  summary: string;
  vitaminDOverloadNotice: string;
  vitaminDOverloadSymptoms: string[];
  daily: {
    caloriesTarget: number;
    proteinTargetG: number;
    proteinFromFoodG: number;
    proteinFromWheyG: number;
    wheyScoops: number;
    waterLiters: number;
    shakerFills: number;
  };
  products: Array<KitProduct & { howToUse: string; caution?: string }>;
  /** Editorial illustration for the kit panel. */
  illustrationUrl: string;
  schedule: string[];
  sampleDay: string[];
};

export function buildNutritionKitPlan(
  m: MetricsInput,
  targets: DetailedTargets | null,
): NutritionKitPlan | null {
  if (!targets) return null;

  const proteinTargetG = targets.macros.proteinG;
  const altKit = targets.priorityFocus === "alt_protein_micros";
  // Alternative: eggs + yogurt staples + increased whey; CDC: ~60% food + whey gap
  const stapleProteinG = altKit
    ? SHORTFALL_STAPLES.eggs.proteinG + SHORTFALL_STAPLES.greekYogurt.proteinG
    : Math.round(proteinTargetG * 0.6);
  const proteinFromFoodG = stapleProteinG;
  const gap = Math.max(0, proteinTargetG - proteinFromFoodG);
  const wheyScoops = altKit
    ? Math.min(5, Math.max(2, Math.ceil(gap / WHEY_PROTEIN_G_PER_SCOOP)))
    : Math.min(3, Math.max(0, Math.ceil(gap / WHEY_PROTEIN_G_PER_SCOOP)));
  const proteinFromWheyG = wheyScoops * WHEY_PROTEIN_G_PER_SCOOP;
  const waterLiters = targets.macros.waterLiters;
  const shakerFills = Math.max(1, Math.ceil((waterLiters * 33.814) / SHAKE_FLUID_OZ));

  const sex = m.sex;
  const useEve = sex === "female";
  const useAdam = sex === "male";
  const multiUnclear = sex === "other" || !sex;

  const products: NutritionKitPlan["products"] = [
    {
      ...KIT_PRODUCTS.whey,
      howToUse: altKit
        ? `Increased whey: about ${wheyScoops} scoop(s)/day (~${proteinFromWheyG}g) plus ${SHORTFALL_STAPLES.eggs.name} (${SHORTFALL_STAPLES.eggs.portion}) and ${SHORTFALL_STAPLES.greekYogurt.name} (${SHORTFALL_STAPLES.greekYogurt.portion}) toward ~${proteinTargetG}g protein.`
        : wheyScoops === 0
          ? `Food may already cover ~${proteinTargetG}g protein — keep whey optional for busy days.`
          : `Mix about ${wheyScoops} scoop(s)/day (~${proteinFromWheyG}g protein) in the Strada to help reach ~${proteinTargetG}g total. Confirm scoop grams on your bag label.`,
    },
    {
      ...KIT_PRODUCTS.shaker,
      howToUse: `Use for whey shakes and as ~${SHAKE_FLUID_OZ} oz fluid blocks. About ${shakerFills} fills/day helps toward ~${waterLiters} L educational fluid target (food moisture counts too).`,
    },
  ];

  if (useAdam) {
    products.push({
      ...KIT_PRODUCTS.adam,
      howToUse: "Take 1 tablet daily with food (per label) as a men’s multi toward vitamin/mineral coverage.",
      caution: "Does not replace vegetables, protein foods, or clinician-ordered labs.",
    });
  } else if (useEve) {
    products.push({
      ...KIT_PRODUCTS.eve,
      howToUse: "Take as directed on the label with food (often 3 tablets daily) as a women’s multi; includes iron.",
      caution: "Iron-containing — not a default multi for most men. Follow label; ask a clinician if pregnant or anemic.",
    });
  } else {
    products.push({
      ...KIT_PRODUCTS.adam,
      howToUse: "Sex marked Other — choose ADAM only if a men’s (non-iron) multi fits your needs.",
      caution: "If you need a women’s formula with iron, use EVE instead. Do not take both.",
    });
    products.push({
      ...KIT_PRODUCTS.eve,
      howToUse: "Sex marked Other — EVE is the iron-containing women’s option when appropriate.",
      caution: "Pick one multi with clinician advice — do not double up.",
    });
  }

  const dTarget =
    targets.vitamins.find((v) => v.name.startsWith("Vitamin D"))?.amount ?? 1000;

  products.push({
    ...KIT_PRODUCTS.d3,
    howToUse: `Included in this plan as the kit Vitamin D supplement (NOW D3 10,000 IU). Educational app D target is often ~${dTarget} IU/day — this softgel is much stronger, so prefer clinician/lab guidance on frequency. Take with a meal that has some fat.`,
    caution: VITAMIN_D_OVERLOAD_SHORT,
  });

  products.push({
    ...KIT_PRODUCTS.phStrips,
    howToUse:
      "Test saliva mid-morning (before brushing/eating when possible). Compare to the bottle chart and enter saliva pH in VitalGauge demographics. Optional: urine pH is separate from Multistix pads.",
    caution: "Home pH strips are educational self-tracking — not a lab diagnosis or “acid body type” test.",
  });

  products.push({
    ...KIT_PRODUCTS.multistix,
    howToUse:
      "Use Multistix 10 SG per bottle timing/color chart. Log all 10 pads in VitalGauge demographics (glucose, bilirubin, ketone, SG, blood, pH, protein, urobilinogen, nitrite, leukocytes).",
    caution: "DIY urine pads are not a lab urinalysis — seek care for pain, fever, or blood in urine.",
  });

  products.push({
    ...KIT_PRODUCTS.renphoBp,
    howToUse:
      "Sit quietly 5 minutes, then measure seated BP and pulse. For orthostatic check, stand and remeasure after ~1 minute. Enter seated/standing BP and resting HR in VitalGauge.",
    caution: "Home BP is not a medical diagnosis. Seek care for very high readings, chest pain, or severe dizziness.",
  });

  products.push({
    ...KIT_PRODUCTS.renphoScale,
    howToUse:
      "Weigh at a consistent time (e.g. morning, after bathroom, before breakfast). Enter weight in demographics; use trends for progress, not day-to-day noise.",
    caution: "Smart-scale body-fat estimates vary — treat weight as the primary input for VitalGauge.",
  });

  if (altKit) {
    products.push({
      asin: SHORTFALL_STAPLES.eggs.asin,
      name: SHORTFALL_STAPLES.eggs.name,
      url: SHORTFALL_STAPLES.eggs.url,
      role: SHORTFALL_STAPLES.eggs.role,
      howToUse: `${SHORTFALL_STAPLES.eggs.portion}/day (~${SHORTFALL_STAPLES.eggs.cholineMg} mg choline) — covers educational choline target; complete protein, B12/selenium.`,
    });
    products.push({
      asin: SHORTFALL_STAPLES.greekYogurt.asin,
      name: SHORTFALL_STAPLES.greekYogurt.name,
      url: SHORTFALL_STAPLES.greekYogurt.url,
      role: SHORTFALL_STAPLES.greekYogurt.role,
      howToUse: `${SHORTFALL_STAPLES.greekYogurt.portion}/day — protein + calcium/potassium support (~16g protein/serving).`,
    });
    products.push({
      ...KIT_PRODUCTS.potassiumBicarb,
      howToUse:
        "Use only as labeled toward remaining potassium need after food. Mix carefully; do not megadose. People with kidney disease or on potassium-sparing meds need clinician clearance.",
      caution: "Potassium supplements can raise blood potassium too high — stop if weakness, irregular heartbeat, or numbness; seek care.",
    });
    products.push({
      ...KIT_PRODUCTS.traceMinerals,
      howToUse: "Add drops to water as labeled for magnesium/potassium/trace mineral support alongside the multi.",
      caution: "Follow dropper serving size; mineral concentrates taste salty — dilute well.",
    });
    products.push({
      ...KIT_PRODUCTS.magGlycinate,
      howToUse: "Typically 1–2 tablets (100–200 mg elemental Mg as labeled) to close magnesium shortfall after multi + food.",
      caution: "Excess magnesium may loosen stools — reduce dose if that happens.",
    });
    products.push({
      ...KIT_PRODUCTS.coralCalcium,
      howToUse:
        "Take as labeled with food to close calcium shortfall alongside organic Greek yogurt. Do not stack with other high-dose calcium without clinician advice.",
      caution:
        "Too much calcium can cause constipation, kidney stones, or high blood calcium — stop and seek care if severe abdominal pain, confusion, or unusual thirst/urination.",
    });
  }

  const schedule = [
    "Morning: weigh on RENPHO scale → breakfast + multivitamin (ADAM or EVE) with food.",
    "Vitamin D3 (kit): take with a meal that includes some fat — follow clinician guidance on how often for this 10,000 IU potency.",
    ...(altKit
      ? [
          `Shortfall stack: ${SHORTFALL_STAPLES.eggs.portion} eggs · ${SHORTFALL_STAPLES.greekYogurt.portion} yogurt · Mg · coral calcium · K bicarbonate · trace minerals.`,
        ]
      : []),
    "Optional: saliva pH strip mid-morning → log in VitalGauge.",
    "Optional: Multistix 10 SG urine pads → log all 10 pads in VitalGauge demographics.",
    wheyScoops > 0
      ? `Protein: ${wheyScoops} whey shake(s) in the Strada — place mid-morning and/or post-activity.`
      : "Protein: prioritize food first; keep whey optional.",
    `Fluids: work toward ~${waterLiters} L/day using the Strada among other drinks.`,
    "1–2×/week: RENPHO BP seated (+ standing if checking orthostatic) and resting pulse → log vitals.",
    "If vitamin D overload symptoms appear: stop D3 immediately — see Vitamin D3 safety list.",
    altKit
      ? "Evening: finish protein/micros priorities (no calorie target on Alternative)."
      : "Evening: finish remaining food protein/carbs/fat toward calorie & macro targets from the app.",
  ];

  const sampleDay = altKit
    ? [
        `Protein goal ≈ ${proteinTargetG}g → eggs+yogurt ~${proteinFromFoodG}g + increased whey ~${proteinFromWheyG}g.`,
        `Mineral stack: Mg glycinate + coral calcium + potassium bicarbonate + trace mineral drops (as labeled).`,
        `Carbs / fat: flexible — no calorie target on Alternative.`,
        `Vitamin D: kit NOW D3 included — discontinue if overload symptoms appear.`,
      ]
    : [
        `Calories target ≈ ${targets.calories.dailyTarget} kcal (educational).`,
        `Protein ≈ ${proteinTargetG}g → food ~${proteinFromFoodG}g + whey ~${proteinFromWheyG}g.`,
        `Carbs ≈ ${targets.macros.carbsG}g · Fat ≈ ${targets.macros.fatG}g · Fiber ≈ ${targets.macros.fiberG}g (from meals, not the kit).`,
        `Vitamin D: kit NOW D3 included — discontinue if overload symptoms appear.`,
      ];
  sampleDay.push(
    useEve
      ? "Multi: EVE with a meal (label dose)."
      : useAdam
        ? "Multi: ADAM 1 tablet with a meal."
        : "Multi: sex is Other — pick ADAM or EVE (not both) with clinician advice.",
    "Measure: RENPHO scale (weight) · pH strips (saliva) · Multistix 10 SG · RENPHO BP (seated/standing + pulse) when logging vitals.",
  );

  if (multiUnclear) {
    sampleDay.push("Confirm which multi (ADAM vs EVE) fits you before stocking both.");
  }

  return {
    disclaimer: NUTRITION_KIT_DISCLAIMER,
    title: "Nutrition Kit plan (whey · multi · D3 · pH · Multistix · RENPHO BP · scale)",
    summary: `Use the Amazon kit for ~${proteinTargetG}g protein, multi coverage, Vitamin D3, DIY vitals (pH strips, Multistix 10 SG, RENPHO BP, scale). Stop D3 if overload symptoms appear.`,
    vitaminDOverloadNotice: VITAMIN_D_OVERLOAD_NOTICE,
    vitaminDOverloadSymptoms: [...VITAMIN_D_OVERLOAD_SYMPTOMS],
    illustrationUrl: useEve
      ? "/illustrations/kit-women.png"
      : "/illustrations/kit-men.png",
    daily: {
      caloriesTarget: targets.calories.dailyTarget,
      proteinTargetG,
      proteinFromFoodG,
      proteinFromWheyG,
      wheyScoops,
      waterLiters,
      shakerFills,
    },
    products: products.map((p) => ({
      ...p,
      imageUrl: productImageUrl(p.asin),
    })),
    schedule,
    sampleDay,
  };
}
