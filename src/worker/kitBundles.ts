import { productImageUrl, amazonCartAddUrl } from "./amazonAssociates";
import { KIT_PRODUCTS } from "./nutritionKit";

export type KitBundleId = "men" | "women" | "men_advanced" | "women_advanced";

export type KitBundleProduct = {
  asin: string;
  name: string;
  url: string;
  imageUrl: string | null;
};

export type KitBundle = {
  id: KitBundleId;
  name: string;
  summary: string;
  asins: string[];
  products: KitBundleProduct[];
  /** Local editorial illustration (served from /illustrations). */
  illustrationUrl: string;
  /** Amazon multi-item add-to-cart URL (tag applied when associateTag is set). */
  cartUrl: string;
};

const BUNDLE_ILLUSTRATIONS: Record<KitBundleId, string> = {
  men: "/illustrations/kit-men.png",
  women: "/illustrations/kit-women.png",
  men_advanced: "/illustrations/kit-advanced.png",
  women_advanced: "/illustrations/kit-advanced.png",
};

const SHARED_CORE = [
  KIT_PRODUCTS.whey,
  KIT_PRODUCTS.shaker,
  KIT_PRODUCTS.d3,
  KIT_PRODUCTS.phStrips,
  KIT_PRODUCTS.multistix,
  KIT_PRODUCTS.renphoBp,
] as const;

function productList(
  items: Array<{ asin: string; name: string; url: string }>,
  associateTag?: string | null,
): KitBundleProduct[] {
  return items.map(({ asin, name, url }) => ({
    asin,
    name,
    url,
    imageUrl: productImageUrl(asin, associateTag, 160),
  }));
}

function defineBundle(
  id: KitBundleId,
  name: string,
  summary: string,
  items: Array<{ asin: string; name: string; url: string }>,
  associateTag?: string | null,
): KitBundle {
  const asins = items.map((p) => p.asin);
  return {
    id,
    name,
    summary,
    asins,
    products: productList(items, associateTag),
    illustrationUrl: BUNDLE_ILLUSTRATIONS[id],
    cartUrl: amazonCartAddUrl(asins, associateTag),
  };
}

/** Four VitalGauge Nutrition Kit Amazon bundles (Associates cart-add). */
export function listKitBundles(associateTag?: string | null): KitBundle[] {
  const menRegular = [
    ...SHARED_CORE,
    KIT_PRODUCTS.adam,
    KIT_PRODUCTS.renphoScale,
  ];
  const womenRegular = [
    ...SHARED_CORE,
    KIT_PRODUCTS.eve,
    KIT_PRODUCTS.renphoScale,
  ];
  const menAdvanced = [
    ...SHARED_CORE,
    KIT_PRODUCTS.adam,
    KIT_PRODUCTS.morphoScanScale,
    KIT_PRODUCTS.kardiaMobile,
  ];
  const womenAdvanced = [
    ...SHARED_CORE,
    KIT_PRODUCTS.eve,
    KIT_PRODUCTS.morphoScanScale,
    KIT_PRODUCTS.kardiaMobile,
  ];

  return [
    defineBundle(
      "men",
      "Men kit",
      "Whey · shaker · ADAM multi · D3 · pH strips · Multistix 10 SG · RENPHO BP · RENPHO smart scale",
      menRegular,
      associateTag,
    ),
    defineBundle(
      "women",
      "Women kit",
      "Whey · shaker · EVE multi · D3 · pH strips · Multistix 10 SG · RENPHO BP · RENPHO smart scale",
      womenRegular,
      associateTag,
    ),
    defineBundle(
      "men_advanced",
      "Men Advanced kit",
      "Regular Men kit with MorphoScan Nova body composition scale (replaces basic scale) + KardiaMobile ECG",
      menAdvanced,
      associateTag,
    ),
    defineBundle(
      "women_advanced",
      "Women Advanced kit",
      "Regular Women kit with MorphoScan Nova body composition scale (replaces basic scale) + KardiaMobile ECG",
      womenAdvanced,
      associateTag,
    ),
  ];
}
