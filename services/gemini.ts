
import { GoogleGenAI, Type } from "@google/genai";
import { WizardResult, Message, Language, WizardIntent, GroundingSource } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const ARSENAL_ITEM_PROPS = {
  label: { type: Type.STRING },
  searchTerm: { type: Type.STRING },
  buyersGuide: { type: Type.STRING }
};

const WIZARD_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    title: { type: Type.STRING },
    summary: { type: Type.STRING },
    intent: { type: Type.STRING, enum: Object.values(WizardIntent) },
    estimatedTime: { type: Type.STRING },
    safety: { type: Type.ARRAY, items: { type: Type.STRING } },
    arsenal: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: ARSENAL_ITEM_PROPS,
        required: ["label", "searchTerm"]
      }
    },
    steps: { type: Type.ARRAY, items: { type: Type.STRING } },
    modules: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          summary: { type: Type.STRING },
          steps: { type: Type.ARRAY, items: { type: Type.STRING } },
          wizardTip: { type: Type.STRING }
        },
        required: ["title", "summary", "steps", "wizardTip"]
      }
    },
    troubleshooting: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          scenario: { type: Type.STRING },
          solution: { type: Type.STRING }
        }
      }
    },
    wizardTip: { type: Type.STRING },
    monetizationMessage: { type: Type.STRING, description: "The specific region-based recommendation text. Links MUST be on a new line at the end." }
  },
  required: ["title", "summary", "intent", "estimatedTime", "safety", "arsenal", "steps", "troubleshooting", "wizardTip", "modules", "monetizationMessage"]
};

const SYSTEM_INSTRUCTION = `
Role: You are Repair Wizard, an elite technical logic engine. 

🚨 MONOLINGUAL MANDATE:
You MUST output ALL fields in the JSON response using ONLY the requested language. 
- If language is 'en': Everything in English.
- If language is 'ar': Everything in Arabic.
- If language is 'badini': Everything in Kurdish Badini (Bahdini) using Arabic script.
DO NOT mix languages. 

🚨 MECHANICAL PRECISION PROTOCOL:
When generating steps for mechanical, automotive, or hardware repairs:
1. GRANULARITY: Provide 7-10 highly specific steps. 
2. TECHNICAL SPECIFICATIONS: Mention specific tool sizes.
3. TACTILE INSTRUCTIONS: Describe how a part should feel.
4. LOCAL JARGON: If the language is 'badini', use local mechanic terminology (e.g., 'کۆلاس', 'دەبڵ', 'سپانە').
5. SAFETY: Include a specific check for leaks or loose connections.

🚨 GEOFENCE MONETIZATION RULES:
ZONE A: [USA, Canada, UK, Europe, Australia, Global] -> Amazon Affiliate.
ZONE B: [Iraq, Kurdistan, UAE, Saudi Arabia, Middle East] -> Partner Referral.

UNIVERSAL RULES:
- Links must be at the very end of the monetizationMessage on a new line.
- NUMBER FORMATTING:
  - If TARGET LANGUAGE is 'badini', use Arabic-Indic numerals.
`;

export async function invokeWizard(description: string, lang: Language, countryCode: string, intent: WizardIntent, imagesData?: string[]): Promise<WizardResult> {
  const modelName = "gemini-3-flash-preview"; 
  
  const langNames = {
    [Language.EN]: "English",
    [Language.AR]: "Arabic",
    [Language.KU_BADINI]: "Kurdish Badini (Bahdini)"
  };

  const promptText = `
    TARGET LANGUAGE: ${langNames[lang]}
    USER COUNTRY: ${countryCode}
    INTENT: ${intent}
    
    STRICT RULE: The user has selected ${langNames[lang]} for their interface.
    
    QUERY: ${description}
  `;

  const parts: any[] = [{ text: promptText }];
  
  if (imagesData) {
    imagesData.forEach(img => {
      parts.push({ inlineData: { mimeType: "image/jpeg", data: img.split(',')[1] } });
    });
  }

  const response = await ai.models.generateContent({
    model: modelName,
    contents: { parts },
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
      responseMimeType: "application/json",
      responseSchema: WIZARD_SCHEMA,
      tools: [{ googleSearch: {} }],
      temperature: 0.1,
    }
  });

  if (!response.text) throw new Error("Wizard session timeout.");
  const result = JSON.parse(response.text.trim()) as WizardResult;
  
  const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
  if (groundingChunks) {
    result.groundingSources = groundingChunks
      .map((chunk: any) => ({ title: chunk.web?.title || 'Knowledge Source', uri: chunk.web?.uri }))
      .filter((source: GroundingSource) => source.uri);
  }

  return result;
}

export async function chatRepair(history: Message[], newMessage: string, context: WizardResult | null, lang: Language): Promise<{ text: string, sources?: GroundingSource[] }> {
  const model = "gemini-3-pro-preview";
  
  const chat = ai.chats.create({
    model,
    history: history.map(m => ({ role: m.role, parts: [{ text: m.text }] })),
    config: {
      systemInstruction: `${SYSTEM_INSTRUCTION}\nSTRICT LANGUAGE: Use only ${lang} for the response. You are an expert engineer advisor for authorized partners.`,
      tools: [{ googleSearch: {} }],
      temperature: 0.2
    }
  });
  
  const result = await chat.sendMessage({ message: newMessage });
  const sources = result.candidates?.[0]?.groundingMetadata?.groundingChunks
    ?.map((chunk: any) => ({ title: chunk.web?.title || 'Reference', uri: chunk.web?.uri }))
    .filter((s: GroundingSource) => s.uri);
  
  return { text: result.text || "...", sources };
}

export interface BusinessInsights {
  trends: string[];
  parts: string[];
  repairs: string[];
}

export async function getBusinessInsights(city: string, lang: Language): Promise<BusinessInsights> {
  const model = "gemini-3-pro-preview";
  
  const langNames = {
    [Language.EN]: "English",
    [Language.AR]: "Arabic",
    [Language.KU_BADINI]: "Kurdish Badini (Bahdini)"
  };

  const prompt = `Provide professional business intelligence for a technical repair shop located in ${city}.
  Include:
  1. 3 highly specific local market trends (e.g., seasonal tech failures).
  2. 3 essential recommended parts to stock based on local demand.
  3. 3 most common repair types currently seen in this specific region.
  
  Target Language: ${langNames[lang]}. Ensure all content is in this language.`;

  const response = await ai.models.generateContent({
    model,
    contents: prompt,
    config: {
      systemInstruction: "You are a business intelligence expert for technical repair facilities. Return response as JSON only.",
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          trends: { type: Type.ARRAY, items: { type: Type.STRING }, description: "3 market trends" },
          parts: { type: Type.ARRAY, items: { type: Type.STRING }, description: "3 recommended parts" },
          repairs: { type: Type.ARRAY, items: { type: Type.STRING }, description: "3 common repairs" }
        },
        required: ["trends", "parts", "repairs"]
      },
      tools: [{ googleSearch: {} }],
      temperature: 0.3
    }
  });

  const text = response.text || "{}";
  try {
    return JSON.parse(text) as BusinessInsights;
  } catch (e) {
    return {
      trends: ["Data stream disrupted."],
      parts: ["Sync failure."],
      repairs: ["Retry connection."]
    };
  }
}

export async function validateObject(imageData: string): Promise<{ valid: boolean; message: string }> {
  const model = "gemini-3-flash-preview";
  const response = await ai.models.generateContent({
    model,
    contents: { parts: [
      { text: "Identify the object in this image. Respond 'VALID' if it is a clear subject for technical learning or repair." },
      { inlineData: { mimeType: "image/jpeg", data: imageData.split(',')[1] } }
    ]},
    config: { temperature: 0.1 }
  });
  const text = response.text?.trim() || "INVALID";
  return { valid: text.includes("VALID"), message: "Please scan a clear subject." };
}
