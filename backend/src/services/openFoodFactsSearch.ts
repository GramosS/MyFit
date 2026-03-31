// Klient mot Open Food Facts sök-API.
// Hämtar data, hanterar timeout och mappar till vårt format.
import { HttpError } from "../utils/httpError.js";

// .org svarar ofta 503 (HTML) medan .net (samma API) fungerar — se OFF drift/mirrors.
const OFF_SEARCH = "https://world.openfoodfacts.net/cgi/search.pl";
const SEARCH_MAX_LEN = 200;
const OFF_TIMEOUT_MS = 12_000;
const RESULT_LIMIT = 25;

type OffProduct = {
  product_name?: string;
  product_name_sv?: string;
  brands?: string;
  code?: string;
  countries_tags?: string[];
  nutriments?: Record<string, unknown>;
};

type OffSearchJson = {
  products?: OffProduct[];
};

export type FoodSearchHit = {
  name: string;
  code: string | null;
  brand: string | null;
  kcalPer100g: number | null;
  kcalPerServing: number | null;
  proteinPer100g: number | null;
  fatPer100g: number | null;
  carbsPer100g: number | null;
  proteinPerServing: number | null;
  fatPerServing: number | null;
  carbsPerServing: number | null;
};

// OFF kan skicka komma som decimalseparator.
function num(n: unknown): number | null {
  if (typeof n === "number" && Number.isFinite(n)) return n;
  if (typeof n === "string" && n.trim() !== "") {
    const x = Number(String(n).replace(",", "."));
    return Number.isFinite(x) ? x : null;
  }
  return null;
}

type MacroPair = {
  protein: number | null;
  fat: number | null;
  carbs: number | null;
};

function macrosFromNutriments(nut: Record<string, unknown> | undefined): {
  per100g: MacroPair;
  perServing: MacroPair;
} {
  const empty: MacroPair = { protein: null, fat: null, carbs: null };
  if (!nut) return { per100g: empty, perServing: empty };
  const per100g: MacroPair = {
    protein: num(nut["proteins_100g"]) ?? num(nut["protein_100g"]),
    fat: num(nut["fat_100g"]),
    carbs: num(nut["carbohydrates_100g"]) ?? num(nut["carbs_100g"]),
  };
  const perServing: MacroPair = {
    protein: num(nut["proteins_serving"]) ?? num(nut["protein_serving"]),
    fat: num(nut["fat_serving"]),
    carbs: num(nut["carbohydrates_serving"]) ?? num(nut["carbs_serving"]),
  };
  return { per100g, perServing };
}

function kcalFromNutriments(nut: Record<string, unknown> | undefined): {
  per100g: number | null;
  perServing: number | null;
} {
  if (!nut) return { per100g: null, perServing: null };
  let per100 =
    num(nut["energy-kcal_100g"]) ??
    num(nut["energy_kcal_100g"]) ??
    num(nut["energy-kcal"]) ??
    null;
  if (per100 == null) {
    const kj = num(nut["energy-kj_100g"]) ?? num(nut["energy_kj_100g"]);
    if (kj != null) per100 = Math.round((kj / 4.184) * 10) / 10;
  }
  let perServing =
    num(nut["energy-kcal_serving"]) ??
    num(nut["energy_kcal_serving"]) ??
    null;
  if (perServing == null) {
    const kjS = num(nut["energy-kj_serving"]);
    if (kjS != null) perServing = Math.round((kjS / 4.184) * 10) / 10;
  }
  return { per100g: per100, perServing };
}

function isSwedenProduct(p: OffProduct): boolean {
  const tags = p.countries_tags;
  if (!Array.isArray(tags)) return false;
  return tags.some((t) => {
    const s = String(t).toLowerCase();
    return s.includes("sweden") || s.includes("sverige") || s === "en:sweden";
  });
}

function displayName(p: OffProduct): string {
  const sv = p.product_name_sv?.trim();
  const en = p.product_name?.trim();
  return (sv || en || "Okänd produkt").slice(0, 200);
}

function mapProductsToHits(products: OffProduct[], swedishOnly: boolean): FoodSearchHit[] {
  let list = products;
  if (swedishOnly) {
    const filtered = list.filter(isSwedenProduct);
    if (filtered.length > 0) list = filtered;
  }

  return list
    .map((p) => {
      const nut = p.nutriments ?? {};
      const { per100g, perServing } = kcalFromNutriments(nut);
      const { per100g: m100, perServing: mSrv } = macrosFromNutriments(nut);
      // Utan energi per 100 g eller per portion är raden oanvändbar för kaloriberäkning
      if (per100g == null && perServing == null) return null;
      return {
        name: displayName(p),
        code: p.code ? String(p.code) : null,
        brand: p.brands?.trim() || null,
        kcalPer100g: per100g,
        kcalPerServing: perServing,
        proteinPer100g: m100.protein,
        fatPer100g: m100.fat,
        carbsPer100g: m100.carbs,
        proteinPerServing: mSrv.protein,
        fatPerServing: mSrv.fat,
        carbsPerServing: mSrv.carbs,
      };
    })
    .filter((x): x is FoodSearchHit => x != null)
    .slice(0, RESULT_LIMIT);
}

// Anropas från controller.
// Kastar HttpError vid timeout eller fel från upstream.
export async function searchOpenFoodFacts(rawQuery: string, swedishOnly: boolean): Promise<FoodSearchHit[]> {
  const q = rawQuery.trim().slice(0, SEARCH_MAX_LEN);
  if (q.length < 2) return [];

  const params = new URLSearchParams({
    search_terms: q,
    search_simple: "1",
    action: "process",
    json: "true",
    page_size: "30",
  });

  const url = `${OFF_SEARCH}?${params.toString()}`;

  let r: Response;
  try {
    r = await fetch(url, {
      signal: AbortSignal.timeout(OFF_TIMEOUT_MS),
      headers: {
        "User-Agent": "MyFitTracker/1.0 (school project; contact: local)",
        Accept: "application/json",
      },
    });
  } catch (err) {
    const name = err && typeof err === "object" && "name" in err ? String((err as Error).name) : "";
    if (name === "TimeoutError" || name === "AbortError") {
      throw new HttpError(504, "Livsmedelssökningen tog för lång tid – försök igen");
    }
    throw err;
  }

  const contentType = (r.headers.get("content-type") || "").toLowerCase();
  const text = await r.text();
  const looksLikeHtml =
    contentType.includes("text/html") || /^\s*</.test(text) || text.trimStart().toLowerCase().startsWith("<!doctype");

  if (!r.ok) {
    if (r.status === 503 || r.status === 502 || r.status === 504 || looksLikeHtml) {
      throw new HttpError(503, "Open Food Facts svarar inte just nu – försök igen om en stund");
    }
    throw new HttpError(502, "Kunde inte nå livsmedelsdatabasen just nu");
  }

  let data: OffSearchJson;
  try {
    if (looksLikeHtml) {
      throw new HttpError(503, "Open Food Facts svarar inte just nu – försök igen om en stund");
    }
    data = JSON.parse(text) as OffSearchJson;
  } catch (e) {
    if (e instanceof HttpError) throw e;
    throw new HttpError(502, "Ogiltigt svar från livsmedelsdatabasen");
  }

  const products = Array.isArray(data.products) ? data.products : [];
  return mapProductsToHits(products, swedishOnly);
}
