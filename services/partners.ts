import { Shop, Language } from "../types";

let _shops: Shop[] = [];
let _shopsLoadingPromise: Promise<void> | null = null;

async function loadShopsData(): Promise<void> {
  if (_shopsLoadingPromise) return _shopsLoadingPromise;

  _shopsLoadingPromise = (async () => {
    try {
      const response = await fetch('/shops.json');
      if (!response.ok) throw new Error(`Failed to load shops.json: ${response.status}`);
      const rawData: any[] = await response.json();

      _shops = rawData.map(rawShop => ({
        id: rawShop.shop_id,
        name: rawShop.name,
        specialization: rawShop.specialties,
        contact: {
          whatsapp_number: rawShop.contact.whatsapp_number,
          wa_link: rawShop.contact.wa_link,
          custom_message: rawShop.contact.custom_message,
        },
        location: rawShop.location,
        isVerified: rawShop.is_verified,
        rating: rawShop.rating,
        images: rawShop.images,
        subscriptionStatus: rawShop.subscription_status,
        monthlyFee: rawShop.monthly_fee,
        availability: rawShop.availability,
        reviews: rawShop.reviews || []
      }));
    } catch (error) {
      console.error("Error loading shops data:", error);
      _shops = [];
    }
  })();
  return _shopsLoadingPromise;
}

loadShopsData();

export async function getShopsData(): Promise<Shop[]> {
  if (_shops.length === 0 && _shopsLoadingPromise) await _shopsLoadingPromise;
  return _shops;
}

const ALLOWED_AUTOMOTIVE_SECTORS = [
  'General Auto Repair & Maintenance',
  'Auto AC & Heating Systems',
  'Engine Performance & Rebuilds',
  'Transmission & Drivetrain',
  'Brakes, Suspension & Steering',
  'Auto Electrical & Diagnostics',
  'European & Import Specialists',
  'Auto Body, Paint & Collision',
  'Tires & 3D Alignment'
] as const;

/**
 * Tokenized Neural Linking map for automotive semantic matching.
 * Each canonical token can be triggered by English, Arabic, and Kurdish forms.
 */
const TOKEN_SYNONYMS: Record<string, string[]> = {
  compressor: ['compressor', 'كمبريسر', 'کەمپرێسەر'],
  r134a: ['r134a', 'refrigerant', 'غاز', 'فريون'],
  brakes: ['brake', 'brakes', 'فرامل', 'برێک', 'ترمز'],
  battery: ['battery', 'باتري', 'بەتری'],
  wiring: ['wiring', 'wire', 'كابلات', 'کابڵ'],
  engine: ['engine', 'motor', 'محرك', 'محرک'],
  transmission: ['transmission', 'gearbox', 'قير', 'گەیربۆکس'],
  suspension: ['suspension', 'shock', 'مساعدات', 'سسپەنشن'],
  steering: ['steering', 'rack', 'دركسون', 'ستێرینگ'],
  diagnostics: ['diagnostic', 'diagnostics', 'scan', 'تشخيص', 'دیاگنۆستیک'],
  ac: ['ac', 'a/c', 'cooling', 'تكييف', 'تەبرید'],
  electrical: ['electrical', 'electric', 'كهرباء', 'کاره‌بایێ']
};

/**
 * Technical Intent Detection Keywords
 */
const CATEGORY_KEYWORDS = {
  ELECTRIC: ['electric', 'karebayî', 'battery', 'wiring', 'fuse', 'light', 'ecu', 'program', 'عطبة', 'كهرباء', 'باتري', 'کاره بایێ'],
  AC: ['ac', 'a/c', 'cooling', 'tebrîd', 'تبريد', 'تكييف', 'غاز', 'gas', 'compressor', 'تەبرید'],
  CAR: ['car', 'auto', 'engine', 'motor', 'vehicle', 'ترومبێل', 'سيارة', 'محرک', 'مەکینە', 'ترومبێلا']
};

/**
 * Badini-Region Priority Cities (Kurdistan Region of Iraq)
 */
const BADINI_CITIES = ['duhok', 'zakho', 'akre', 'amedi'];

/**
 * Other major Iraqi cities for secondary fallback
 */
const IRAQ_CITIES = ['erbil', 'sulaymaniyah', 'baghdad', 'basra', 'kirkuk', 'najaf', 'karbala', 'mosul'];

function hasIntent(query: string, keywords: string[]): boolean {
  return keywords.some(k => query.includes(k.toLowerCase()));
}

function tokenizeAutomotiveQuery(rawQuery: string): string[] {
  const query = rawQuery.toLowerCase();
  const rawTokens = query.split(/[^\p{L}\p{N}+./-]+/u).filter(Boolean);
  const canonicalTokens = new Set<string>();

  for (const rawToken of rawTokens) {
    for (const [canonicalToken, synonyms] of Object.entries(TOKEN_SYNONYMS)) {
      if (synonyms.some(synonym => rawToken.includes(synonym) || synonym.includes(rawToken))) {
        canonicalTokens.add(canonicalToken);
      }
    }
  }

  return [...canonicalTokens];
}

function computeTokenizedNeuralScore(queryTokens: string[], shop: Shop): number {
  if (queryTokens.length === 0) return 0;

  const semanticPayload = [
    shop.name,
    ...shop.specialization,
    ...(shop.reviews?.map(review => review.comment) ?? []),
    ...ALLOWED_AUTOMOTIVE_SECTORS
  ].join(' ').toLowerCase();

  return queryTokens.reduce((score, token) => {
    const aliases = TOKEN_SYNONYMS[token] ?? [token];
    if (aliases.some(alias => semanticPayload.includes(alias.toLowerCase()))) {
      return score + 60;
    }
    return score;
  }, 0);
}

/**
 * Tiered Recommendation Engine
 * Implementation:
 * Tier 1: User's Exact City (Verified & Intent Match)
 * Tier 2: Badini Region Cluster (Duhok, Zakho, Akre, Amedi)
 * Tier 3: Rest of Iraq (Erbil, Baghdad, etc.)
 * Tier 4: Global / Others
 */
export async function getRecommendedShops(
  title: string,
  summary: string,
  lang: Language,
  userCity: string = ''
): Promise<Shop[]> {
  const allShops = await getShopsData();
  if (allShops.length === 0) return [];

  const query = (title + ' ' + summary).toLowerCase();
  const queryTokens = tokenizeAutomotiveQuery(query);
  const activeShops = allShops.filter(shop => shop.subscriptionStatus === 'active');

  const isElectricIntent = hasIntent(query, CATEGORY_KEYWORDS.ELECTRIC);
  const isAcIntent = hasIntent(query, CATEGORY_KEYWORDS.AC);

  const normalizedUserCity = userCity.trim().toLowerCase();
  const isUserInBadiniZone = BADINI_CITIES.includes(normalizedUserCity);

  // Scoring weights for ranking within tiers
  const getRelevanceScore = (shop: Shop) => {
    let score = 0;
    const shopSpecs = shop.specialization.join(' ').toLowerCase();

    // Tokenized Neural Linking (cross-language automotive semantics)
    score += computeTokenizedNeuralScore(queryTokens, shop);

    // Core Technical Intent Match
    if (isElectricIntent && (shopSpecs.includes('electric') || shopSpecs.includes('ecu') || shopSpecs.includes('karebayî') || shopSpecs.includes('كهرباء'))) {
      score += 150;
    }
    if (isAcIntent && (shopSpecs.includes('a/c') || shopSpecs.includes('ac') || shopSpecs.includes('tebrîd') || shopSpecs.includes('تبريد'))) {
      score += 150;
    }

    // Trust Factors
    if (shop.isVerified) score += 100;
    score += (shop.rating * 10);

    return score;
  };

  const tier1 = activeShops
    .filter(s => s.location.city.toLowerCase() === normalizedUserCity)
    .sort((a, b) => getRelevanceScore(b) - getRelevanceScore(a));

  const tier2 = activeShops
    .filter(s =>
      BADINI_CITIES.includes(s.location.city.toLowerCase()) &&
      s.location.city.toLowerCase() !== normalizedUserCity
    )
    .sort((a, b) => getRelevanceScore(b) - getRelevanceScore(a));

  const tier3 = activeShops
    .filter(s => {
      const city = s.location.city.toLowerCase();
      const alreadyInTiers = tier1.some(x => x.id === s.id) || tier2.some(x => x.id === s.id);
      return !alreadyInTiers && (IRAQ_CITIES.includes(city) || s.contact.whatsapp_number.startsWith('964'));
    })
    .sort((a, b) => getRelevanceScore(b) - getRelevanceScore(a));

  const tier4 = activeShops
    .filter(s => {
      const alreadyInTiers = tier1.some(x => x.id === s.id) || tier2.some(x => x.id === s.id) || tier3.some(x => x.id === s.id);
      return !alreadyInTiers;
    })
    .sort((a, b) => getRelevanceScore(b) - getRelevanceScore(a));

  let recommendations: Shop[] = [];

  if (isUserInBadiniZone) {
    recommendations = [...tier1, ...tier2, ...tier3, ...tier4];
  } else {
    recommendations = [...tier1, ...tier3, ...tier2, ...tier4];
  }

  const flagshipId = 'shop_duhok_yousif_001';
  const flagship = activeShops.find(s => s.id === flagshipId);

  if (flagship && (isElectricIntent || isAcIntent) && isUserInBadiniZone) {
    recommendations = recommendations.filter(s => s.id !== flagshipId);
    recommendations.unshift(flagship);
  }

  return recommendations.slice(0, 3);
}

export function generateWhatsAppLink(shop: Shop, diagnosisTitle: string): string {
  if (shop.contact.wa_link) return shop.contact.wa_link;
  const cleanPhone = shop.contact.whatsapp_number.replace(/\D/g, '');
  let message = shop.contact.custom_message || `Hello ${shop.name}, I found you on Repair Wizard. I need help with: ${diagnosisTitle}.`;
  return `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(message)}`;
}

export async function logLeadHit(shopId: string): Promise<void> {
  console.log(`[LEAD TRACKER] Lead generated for shop: ${shopId}`);
  return new Promise(resolve => setTimeout(resolve, 800));
}

export async function registerPartner(data: any): Promise<boolean> {
  console.log('[PARTNER REGISTRATION] Processing application:', data);
  return new Promise(resolve => setTimeout(() => resolve(true), 2000));
}
