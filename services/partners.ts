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
  const activeShops = allShops.filter(shop => shop.subscriptionStatus === 'active');
  
  const isElectricIntent = hasIntent(query, CATEGORY_KEYWORDS.ELECTRIC);
  const isAcIntent = hasIntent(query, CATEGORY_KEYWORDS.AC);
  
  const normalizedUserCity = userCity.trim().toLowerCase();
  const isUserInBadiniZone = BADINI_CITIES.includes(normalizedUserCity);

  // Scoring weights for ranking within tiers
  const getRelevanceScore = (shop: Shop) => {
    let score = 0;
    const shopSpecs = shop.specialization.join(' ').toLowerCase();
    
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

  /**
   * TIER 1: Exact City Match
   */
  const tier1 = activeShops
    .filter(s => s.location.city.toLowerCase() === normalizedUserCity)
    .sort((a, b) => getRelevanceScore(b) - getRelevanceScore(a));

  /**
   * TIER 2: Badini Region Cluster (Exclusive fallback for Badini cities)
   */
  const tier2 = activeShops
    .filter(s => 
      BADINI_CITIES.includes(s.location.city.toLowerCase()) && 
      s.location.city.toLowerCase() !== normalizedUserCity
    )
    .sort((a, b) => getRelevanceScore(b) - getRelevanceScore(a));

  /**
   * TIER 3: National Fallback (Rest of Iraq)
   */
  const tier3 = activeShops
    .filter(s => {
      const city = s.location.city.toLowerCase();
      const alreadyInTiers = tier1.some(x => x.id === s.id) || tier2.some(x => x.id === s.id);
      return !alreadyInTiers && (IRAQ_CITIES.includes(city) || s.contact.whatsapp_number.startsWith('964'));
    })
    .sort((a, b) => getRelevanceScore(b) - getRelevanceScore(a));

  /**
   * TIER 4: Global Fallback
   */
  const tier4 = activeShops
    .filter(s => {
      const alreadyInTiers = tier1.some(x => x.id === s.id) || tier2.some(x => x.id === s.id) || tier3.some(x => x.id === s.id);
      return !alreadyInTiers;
    })
    .sort((a, b) => getRelevanceScore(b) - getRelevanceScore(a));

  // Construct Final Results based on Regional Priority
  let recommendations: Shop[] = [];
  
  if (isUserInBadiniZone) {
    // If user is in a Badini city, prioritize neighbors first
    recommendations = [...tier1, ...tier2, ...tier3, ...tier4];
  } else {
    // If user is elsewhere (e.g. Baghdad), prioritize their city then national
    recommendations = [...tier1, ...tier3, ...tier2, ...tier4];
  }

  // Flagship Logic for Master Technicians in Duhok
  // Specific override: If it's a Duhok query for specialized tech, ensure top-tier experts are visible
  const flagshipId = 'shop_duhok_yousif_001';
  const flagship = activeShops.find(s => s.id === flagshipId);
  
  if (flagship && (isElectricIntent || isAcIntent) && isUserInBadiniZone) {
    // Move flagship to the very top of Tier 1/2 results for Badini users
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
