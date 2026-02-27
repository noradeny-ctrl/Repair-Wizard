import React, { useMemo, useState } from 'react';
import { collection, getDocs, limit, query, where } from 'firebase/firestore';
import { db } from '../services/firebase';
import { Shop } from '../types';

type ChatRole = 'user' | 'assistant';

interface ChatMessage {
  role: ChatRole;
  text: string;
}

/**
 * Implementation Steps:
 * 1) Capture a raw automotive symptom from the chat input (example: "engine ticking noise").
 * 2) Parse and tokenize the symptom text, then map tokens to a valid automotive category.
 * 3) Convert the detected category into Firestore specialty keywords for precision matching.
 * 4) Trigger a Firebase query against the shops collection using array-contains-any on specialtyKeywords.
 * 5) Render matched shops in a mobile-first, glassmorphism chatbot panel with glowing message bubbles.
 */

interface ParsedSymptom {
  normalizedTokens: string[];
  category: string;
  specialtyTokens: string[];
}

const CATEGORY_TOKEN_MAP: Array<{ category: string; specialties: string[]; tokens: string[] }> = [
  {
    category: 'Engine Performance & Rebuilds',
    specialties: ['engine diagnostics', 'engine rebuild', 'timing system'],
    tokens: ['engine', 'ticking', 'knock', 'misfire', 'rpm', 'power loss', 'oil burn']
  },
  {
    category: 'Auto AC & Heating Systems',
    specialties: ['ac compressor', 'r134a', 'climate control'],
    tokens: ['ac', 'a/c', 'compressor', 'r134a', 'cooling', 'heater', 'vent']
  },
  {
    category: 'Brakes, Suspension & Steering',
    specialties: ['brake service', 'suspension', 'steering rack'],
    tokens: ['brake', 'pads', 'rotor', 'suspension', 'steering', 'vibration', 'alignment']
  },
  {
    category: 'Transmission & Drivetrain',
    specialties: ['transmission diagnostics', 'gearbox', 'drivetrain'],
    tokens: ['transmission', 'gear', 'slipping', 'clutch', 'drivetrain', 'axle']
  },
  {
    category: 'Auto Electrical & Diagnostics',
    specialties: ['battery', 'alternator', 'ecu diagnostics'],
    tokens: ['battery', 'alternator', 'starter', 'electrical', 'ecu', 'scan', 'wiring']
  }
];

function parseSymptom(symptom: string): ParsedSymptom {
  const normalized = symptom.toLowerCase();
  const normalizedTokens = normalized.split(/[^\p{L}\p{N}+/.-]+/u).filter(Boolean);

  let bestMatch = CATEGORY_TOKEN_MAP[0];
  let bestScore = -1;

  for (const candidate of CATEGORY_TOKEN_MAP) {
    const score = candidate.tokens.reduce((acc, token) => {
      if (normalized.includes(token) || normalizedTokens.includes(token)) return acc + 1;
      return acc;
    }, 0);

    if (score > bestScore) {
      bestScore = score;
      bestMatch = candidate;
    }
  }

  return {
    normalizedTokens,
    category: bestMatch.category,
    specialtyTokens: bestMatch.specialties
  };
}

async function searchShopsBySpecialty(specialtyTokens: string[]): Promise<Shop[]> {
  const shopsRef = collection(db, 'shops');
  const q = query(shopsRef, where('specialtyKeywords', 'array-contains-any', specialtyTokens), limit(6));
  const snapshot = await getDocs(q);

  return snapshot.docs.map(doc => {
    const data = doc.data() as Partial<Shop>;
    return {
      id: doc.id,
      name: data.name || 'Unnamed Auto Shop',
      specialization: data.specialization || [],
      contact: data.contact || { whatsapp_number: '', wa_link: '' },
      location: data.location || { city: 'Unknown', neighborhood: 'Unknown' },
      isVerified: Boolean(data.isVerified),
      rating: Number(data.rating || 0),
      reviews: data.reviews || [],
      subscriptionStatus: data.subscriptionStatus || 'active'
    };
  });
}

const DiagnosticWizardChatbot: React.FC = () => {
  const [symptom, setSymptom] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      text: 'Diagnostic Wizard online. Describe your automotive symptom to auto-route the correct repair specialty.'
    }
  ]);
  const [recommendedShops, setRecommendedShops] = useState<Shop[]>([]);

  const placeholder = useMemo(() => 'Example: engine ticking noise at idle', []);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!symptom.trim() || loading) return;

    const trimmedSymptom = symptom.trim();
    setMessages(prev => [...prev, { role: 'user', text: trimmedSymptom }]);
    setSymptom('');
    setLoading(true);

    try {
      const parsed = parseSymptom(trimmedSymptom);
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          text: `Detected category: ${parsed.category}. Initiating Firebase specialty lookup for: ${parsed.specialtyTokens.join(', ')}.`
        }
      ]);

      const results = await searchShopsBySpecialty(parsed.specialtyTokens);
      setRecommendedShops(results);

      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          text: results.length
            ? `Found ${results.length} automotive shops with matching specialties.`
            : 'No exact specialty match was found. Try adding more technical symptom detail.'
        }
      ]);
    } catch (error) {
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          text: 'Firebase lookup failed. Verify Firestore indexes for specialtyKeywords and retry.'
        }
      ]);
      setRecommendedShops([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="w-full max-w-3xl mx-auto rounded-[2rem] border border-cyan-400/20 bg-[#0d1117]/75 backdrop-blur-2xl shadow-[0_0_40px_rgba(0,243,255,0.08)] p-4 md:p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-[#010409] border border-cyan-400/30 grid place-items-center">
          <i className="fa-solid fa-robot text-cyan-300"></i>
        </div>
        <div>
          <h3 className="text-sm md:text-base font-black tracking-wide text-cyan-200">Diagnostic Wizard Chatbot</h3>
          <p className="text-[11px] uppercase tracking-[0.2em] text-emerald-400">Cyber-Core Auto Triage</p>
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-[#010409]/70 p-3 md:p-4 max-h-[320px] overflow-y-auto space-y-3">
        {messages.map((message, index) => (
          <div
            key={`${message.role}-${index}`}
            className={`max-w-[90%] rounded-2xl px-3 py-2 text-xs md:text-sm leading-relaxed ${
              message.role === 'assistant'
                ? 'bg-cyan-500/10 border border-cyan-400/30 text-cyan-100 shadow-[0_0_20px_rgba(0,243,255,0.15)]'
                : 'ml-auto bg-emerald-500/15 border border-emerald-400/30 text-emerald-100 shadow-[0_0_20px_rgba(16,185,129,0.15)]'
            }`}
          >
            {message.text}
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="mt-4 flex flex-col sm:flex-row gap-2">
        <input
          value={symptom}
          onChange={(event) => setSymptom(event.target.value)}
          placeholder={placeholder}
          className="flex-1 rounded-xl bg-[#010409] border border-cyan-500/30 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-cyan-300"
        />
        <button
          type="submit"
          disabled={loading}
          className="rounded-xl px-4 py-2 text-sm font-bold uppercase tracking-wider text-[#010409] bg-cyan-300 hover:bg-cyan-200 disabled:opacity-60"
        >
          {loading ? 'Analyzing...' : 'Run Diagnostic'}
        </button>
      </form>

      <div className="mt-5 rounded-2xl border border-emerald-400/20 bg-emerald-500/5 p-3">
        <h4 className="text-xs uppercase tracking-[0.24em] text-emerald-300 font-black mb-2">Shop Matches</h4>
        {recommendedShops.length === 0 ? (
          <p className="text-xs text-slate-400">No active matches yet. Submit a symptom to trigger Firebase specialty search.</p>
        ) : (
          <ul className="space-y-2">
            {recommendedShops.map(shop => (
              <li key={shop.id} className="rounded-xl border border-white/10 bg-black/20 p-3">
                <p className="text-sm font-bold text-cyan-100">{shop.name}</p>
                <p className="text-xs text-slate-300">{shop.location.city} • {shop.specialization.join(', ') || 'General Auto Repair & Maintenance'}</p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
};

export default DiagnosticWizardChatbot;
