
export interface ArsenalItem {
  label: string;
  searchTerm: string;
  buyersGuide?: string;
}

export enum WizardIntent {
  REPAIR = 'REPAIR',
  LEARN = 'LEARN',
  PROGRAMMING = 'PROGRAMMING'
}

export interface GroundingSource {
  title: string;
  uri: string;
}

export interface WizardModule {
  title: string;
  summary: string;
  steps: string[];
  wizardTip: string;
}

export interface Review {
  user: string;
  comment: string;
  rating: number;
  date: string;
}

export interface Shop {
  id: string; 
  name: string;
  specialization: string[]; 
  contact: {
    whatsapp_number: string;
    wa_link: string;
    custom_message?: string;
  };
  location: {
    city: string;
    neighborhood: string;
    lat?: number;
    lng?: number;
  };
  isVerified: boolean; 
  rating: number;
  images?: string[];
  subscriptionStatus: 'active' | 'inactive'; 
  monthlyFee?: number; 
  distance?: string; 
  bio?: string;
  availability?: string;
  reviews?: Review[];
}

export interface WizardResult {
  title: string;
  summary: string;
  intent: WizardIntent;
  estimatedTime: string;
  safety: string[];
  arsenal: ArsenalItem[];
  steps: string[];
  modules: WizardModule[];
  troubleshooting: {
    scenario: string;
    solution: string;
  }[];
  wizardTip: string;
  monetizationMessage: string;
  groundingSources?: GroundingSource[];
  recommendedShops?: Shop[];
}

export enum AppState {
  IDLE = 'IDLE',
  DIAGNOSING = 'DIAGNOSING',
  RESULT = 'RESULT',
  ERROR = 'ERROR',
  PARTNER_SIGNUP = 'PARTNER_SIGNUP'
}

export enum Language {
  EN = 'en',
  AR = 'ar',
  KU_BADINI = 'badini'
}

// Added UserRole enum to satisfy requirements for Partner onboarding
export enum UserRole {
  CONSUMER = 'CONSUMER',
  PARTNER = 'PARTNER'
}

export interface Message {
  role: 'user' | 'model';
  text: string;
  feedback?: 'positive' | 'negative';
  groundingSources?: GroundingSource[];
}
