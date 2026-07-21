/** FTC-style disclosure for Amazon Associates product links. */
export const AMAZON_ASSOCIATE_DISCLOSURE =
  "As an Amazon Associate, VitalGauge earns from qualifying purchases. Product links may include our affiliate tracking tag.";

const AMAZON_URL_IN_TEXT =
  /https?:\/\/(?:www\.)?amazon\.[a-z.]+(?:\/[^\s"'<>]*)?/gi;

function isAmazonHostname(hostname: string): boolean {
  const host = hostname.toLowerCase().replace(/^www\./, "");
  return host === "amazon.com" || host.endsWith(".amazon.com") || /^amazon\./.test(host);
}

/** Append or replace the Associates `tag` query param on an Amazon URL. */
export function withAssociateTag(url: string, tag?: string | null): string {
  const t = tag?.trim();
  if (!t || !url) return url;
  try {
    const u = new URL(url);
    if (!isAmazonHostname(u.hostname)) return url;
    u.searchParams.set("tag", t);
    return u.toString();
  } catch {
    return url;
  }
}

/**
 * Prefer local product photos when available.
 * Amazon image widgets are unreliable as <img> sources, so we do not fall back to them.
 */
export function productImageUrl(
  asin: string,
  _tag?: string | null,
  _size?: 160 | 200 | 250,
): string | null {
  const a = asin?.trim();
  if (!a) return null;
  return LOCAL_PRODUCT_IMAGES[a.toUpperCase()] ?? null;
}

/** Local catalog photos served from /products (ASIN → path). */
export const LOCAL_PRODUCT_IMAGES: Record<string, string> = {
  B06XX65GS1: "/products/B06XX65GS1.jpg", // Raw grass-fed whey
  B084PVQGH1: "/products/B084PVQGH1.jpg", // BlenderBottle Strada
  B00F45EQ4W: "/products/B00F45EQ4W.jpg", // NOW Vitamin D3
  B0013OVWWM: "/products/B0013OVWWM.jpg", // NOW ADAM
  B01GFSEB00: "/products/B01GFSEB00.jpg", // pH test strips
  B06WCZVMLC: "/products/B06WCZVMLC.jpg", // Siemens Multistix 10 SG
  B08J7XWM75: "/products/B08J7XWM75.jpg", // RENPHO BP monitor
  B01N1UX8RW: "/products/B01N1UX8RW.jpg", // RENPHO smart scale
  B0FJFL8KP4: "/products/B0FJFL8KP4.jpg", // MorphoScan Nova
  B097Q4SLDP: "/products/B097Q4SLDP.jpg", // KardiaMobile
  B09R9Q47LJ: "/products/B09R9Q47LJ.jpg", // New Barn regenerative eggs
  B01NBBVPLI: "/products/B01NBBVPLI.jpg", // Stonyfield Greek yogurt
  B07B8W4LFX: "/products/B07B8W4LFX.jpg", // Earthborn K bicarbonate
  B000AMUWLK: "/products/B000AMUWLK.jpg", // Trace ConcenTrace drops
  B07NWMVMT1: "/products/B07NWMVMT1.jpg", // NOW Magnesium Glycinate
  B0013OSM5W: "/products/B0013OSM5W.jpg", // NOW Coral Calcium Plus
};

/**
 * Amazon Associates product image URL for an ASIN (thumbnail).
 * Returns null for non-catalog placeholders (e.g. food search links).
 */
export function amazonAsinImageUrl(
  asin: string,
  tag?: string | null,
  size: 160 | 200 | 250 = 200,
): string | null {
  const a = asin?.trim();
  if (!a || !/^B0[A-Z0-9]{8}$/i.test(a)) return null;
  const params = new URLSearchParams({
    _encoding: "UTF8",
    MarketPlace: "US",
    ASIN: a,
    ServiceVersion: "20070822",
    ID: "AsinImage",
    WS: "1",
    Format: `_SL${size}_`,
  });
  const t = tag?.trim();
  if (t) params.set("tag", t);
  return `https://ws-na.amazon-adsystem.com/widgets/q?${params.toString()}`;
}

/**
 * Amazon multi-ASIN “Add to Cart” URL (Associates cart-add).
 * Opens Amazon with all listed items ready to add.
 */
export function amazonCartAddUrl(asins: string[], tag?: string | null): string {
  const params = new URLSearchParams();
  const t = tag?.trim();
  if (t) {
    params.set("AssociateTag", t);
    params.set("tag", t);
  }
  asins.forEach((asin, i) => {
    const n = i + 1;
    params.set(`ASIN.${n}`, asin);
    params.set(`Quantity.${n}`, "1");
  });
  return `https://www.amazon.com/gp/aws/cart/add.html?${params.toString()}`;
}

/** Rewrite any Amazon URLs embedded in plain text. */
export function tagAmazonUrlsInText(text: string, tag?: string | null): string {
  const t = tag?.trim();
  if (!t || !text.includes("amazon.")) return text;
  return text.replace(AMAZON_URL_IN_TEXT, (match) => {
    // Trim trailing punctuation that is not part of the URL
    const cleaned = match.replace(/[.,;:)]+$/, "");
    const suffix = match.slice(cleaned.length);
    return withAssociateTag(cleaned, t) + suffix;
  });
}

/** Deep-walk JSON and tag Amazon URLs in strings (kit links, food-plan notes, etc.). */
export function tagAmazonUrlsDeep<T>(value: T, tag?: string | null): T {
  const t = tag?.trim();
  if (!t) return value;
  return walk(value, t) as T;
}

function walk(value: unknown, tag: string): unknown {
  if (typeof value === "string") return tagAmazonUrlsInText(value, tag);
  if (Array.isArray(value)) return value.map((item) => walk(item, tag));
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      out[k] = walk(v, tag);
    }
    return out;
  }
  return value;
}
