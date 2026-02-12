import React, { useState, useEffect } from 'react';
import { Language, UserRole } from '../types';
import { useTranslation } from '../services/i18n';
import { auth, db } from '../services/firebase';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  sendEmailVerification,
  deleteUser,
  signOut
} from 'firebase/auth';
import { doc, setDoc, getDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';

interface PartnerFormProps {
  lang: Language;
  onCancel: () => void;
  onSuccess: (newRole: UserRole) => void;
  currentRole: UserRole;
}

type PartnerFormStep = 
  | 'INTRO' 
  | 'SIGNIN' 
  | 'STEP_IDENTITY' 
  | 'STEP_BUSINESS' 
  | 'STEP_EXPERTISE' 
  | 'STEP_CONNECT' 
  | 'STEP_REVIEW' 
  | 'PENDING' 
  | 'MANAGEMENT' 
  | 'CONFIRM_DELETE';

const SPECIALTIES = [
  { id: 'mechanical', label: 'Mechanical', icon: 'fa-wrench', color: 'text-blue-400' },
  { id: 'electrical', label: 'Electrical', icon: 'fa-bolt', color: 'text-amber-400' },
  { id: 'ecu', label: 'ECU Programming', icon: 'fa-microchip', color: 'text-purple-400' },
  { id: 'ac', label: 'A/C & Cooling', icon: 'fa-snowflake', color: 'text-cyan-400' },
  { id: 'transmission', label: 'Transmission', icon: 'fa-gears', color: 'text-rose-400' },
  { id: 'body', label: 'Body & Paint', icon: 'fa-paint-roller', color: 'text-emerald-400' },
];

const BenefitRow: React.FC<{ icon: string; text: string; color: string }> = ({ icon, text, color }) => (
  <div className="flex items-center gap-6 group">
    <div className={`w-12 h-12 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-center text-xl transition-all group-hover:scale-110 ${color}`}>
      <i className={`fa-solid ${icon}`}></i>
    </div>
    <span className="text-slate-200 font-bold text-lg md:text-xl tracking-tight">{text}</span>
  </div>
);

const PartnerForm: React.FC<PartnerFormProps> = ({ lang, onCancel, onSuccess, currentRole }) => {
  const t = useTranslation(lang);
  const [step, setStep] = useState<PartnerFormStep>(currentRole === UserRole.PARTNER ? 'MANAGEMENT' : 'INTRO');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Profile Details
  const [ownerName, setOwnerName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Business Details
  const [businessName, setBusinessName] = useState('');
  const [location, setLocation] = useState('');
  const [neighborhood, setNeighborhood] = useState('');

  // Service Offerings
  const [selectedSpecialties, setSelectedSpecialties] = useState<string[]>([]);
  const [serviceDescription, setServiceDescription] = useState('');
  const [brands, setBrands] = useState('');

  // Connectivity
  const [phone, setPhone] = useState('');

  useEffect(() => {
    if (currentRole === UserRole.PARTNER) {
      setStep('MANAGEMENT');
    }
  }, [currentRole]);

  const toggleSpecialty = (id: string) => {
    setSelectedSpecialties(prev => 
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  };

  const handleApply = async () => {
    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      await sendEmailVerification(user);

      await setDoc(doc(db, "partners", user.uid), {
        ownerName,
        businessName,
        location,
        neighborhood,
        phone,
        email,
        specialties: selectedSpecialties,
        serviceDescription,
        brandsFocus: brands,
        status: "pending",
        role: UserRole.PARTNER,
        appliedAt: serverTimestamp(),
      });

      setStep('PENDING');
    } catch (err: any) {
      console.error("Signup Error:", err);
      if (err.code === 'auth/email-already-in-use') {
        setErrorMsg(t('auth_err_email_in_use'));
        setStep('SIGNIN');
      } else {
        setErrorMsg(err.message || t('auth_err_generic'));
        setStep('STEP_IDENTITY');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email.trim(), password);
      const user = userCredential.user;

      const partnerDoc = await getDoc(doc(db, "partners", user.uid));
      
      if (!partnerDoc.exists()) {
        setErrorMsg(t('auth_err_user_not_found'));
        return;
      }

      const partnerData = partnerDoc.data();
      if (partnerData.status === 'active' || partnerData.status === 'approved') {
        onSuccess(UserRole.PARTNER);
      } else if (partnerData.status === 'pending') {
        setBusinessName(partnerData.businessName || 'Your Business');
        setStep('PENDING');
      } else {
        setErrorMsg(t('application_denied'));
      }
    } catch (err: any) {
      setErrorMsg(t('auth_err_wrong_pass'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTerminateAccount = async () => {
    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const user = auth.currentUser;
      if (!user) throw new Error("No active node found.");

      await deleteDoc(doc(db, "partners", user.uid));
      await deleteUser(user);
      onSuccess(UserRole.CONSUMER);
      onCancel();
    } catch (err: any) {
      console.error("Termination error:", err);
      if (err.code === 'auth/requires-recent-login') {
        setErrorMsg("Critical: Security session expired. Please sign in again before termination.");
        await signOut(auth);
        setStep('SIGNIN');
      } else {
        setErrorMsg(err.message || "Termination sequence interrupted.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const ProgressHeader: React.FC<{ current: number, total?: number }> = ({ current, total = 5 }) => (
    <div className="flex flex-col gap-4 mb-10">
      <div className="flex justify-between items-center px-2">
        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-amber-500">Node Syncing</span>
        <span className="text-[10px] font-mono text-slate-500">{current} / {total}</span>
      </div>
      <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
        <div 
          className="h-full bg-gradient-to-r from-amber-600 to-amber-400 transition-all duration-700 ease-out"
          style={{ width: `${(current / total) * 100}%` }}
        />
      </div>
    </div>
  );

  if (step === 'MANAGEMENT') {
    return (
      <div className="bg-slate-900/60 rounded-[4rem] border border-slate-800 p-10 md:p-24 text-center relative overflow-hidden animate-in slide-in-from-bottom-8 duration-700 shadow-2xl">
        <div className="relative z-10 space-y-12 max-w-xl mx-auto">
          <div className="space-y-4 text-center">
            <h2 className="text-4xl md:text-6xl font-black text-white tracking-tighter leading-none">
              Partner Node
            </h2>
            <p className="text-amber-500 font-bold text-xs uppercase tracking-[0.4em]">Authorized Authority</p>
          </div>

          <div className="grid grid-cols-1 gap-4">
             <button 
              onClick={onCancel}
              className="w-full py-7 bg-slate-950 border border-slate-800 text-white rounded-[2.5rem] flex items-center justify-center gap-4 hover:border-slate-700 transition-all active:scale-95"
            >
              <i className="fa-solid fa-house text-xl text-blue-500"></i>
              <span className="text-sm font-black uppercase tracking-widest">Return to Diagnostic Terminal</span>
            </button>

            <button 
              onClick={() => setStep('CONFIRM_DELETE')}
              className="w-full py-5 text-rose-500/50 hover:text-rose-500 font-black uppercase tracking-widest text-[10px] transition-all"
            >
              Relinquish Authority (Terminate Account)
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'CONFIRM_DELETE') {
    return (
      <div className="bg-slate-950 rounded-[4rem] border border-rose-500/30 p-10 md:p-24 text-center relative overflow-hidden animate-in zoom-in-95 duration-500 shadow-2xl">
        <div className="relative z-10 space-y-12 max-w-lg mx-auto">
          <div className="w-24 h-24 bg-rose-500/10 border border-rose-500/30 rounded-full flex items-center justify-center mx-auto text-rose-500 animate-pulse">
            <i className="fa-solid fa-triangle-exclamation text-4xl"></i>
          </div>
          
          <div className="space-y-6">
            <h2 className="text-3xl md:text-5xl font-black text-white tracking-tighter leading-none">
              Void Protocol
            </h2>
            <p className="text-slate-400 font-medium text-lg leading-relaxed">
              This action will permanently delete your partner profile, leads history, and verified status. <span className="text-rose-500 font-black">This cannot be reversed.</span>
            </p>
          </div>

          <div className="flex flex-col gap-4">
            <button 
              onClick={handleTerminateAccount}
              disabled={isSubmitting}
              className="w-full py-8 bg-rose-600 text-white font-black uppercase tracking-[0.3em] text-sm rounded-[3rem] shadow-2xl shadow-rose-900/40 active:scale-95 transition-all flex items-center justify-center gap-3"
            >
              {isSubmitting ? <i className="fa-solid fa-circle-notch animate-spin"></i> : "Execute Void Protocol"}
            </button>
            <button 
              onClick={() => setStep('MANAGEMENT')}
              className="w-full py-5 text-slate-500 font-black uppercase tracking-widest text-[10px] hover:text-slate-300 transition-all"
            >
              Cancel Termination
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'PENDING') {
    return (
      <div className="bg-slate-900/60 rounded-[4rem] border border-amber-500/30 p-10 md:p-24 text-center relative overflow-hidden animate-in zoom-in-95 duration-700 shadow-2xl">
        <div className="relative z-10 space-y-12 max-w-lg mx-auto">
          <div className="w-28 h-28 bg-amber-500/10 border border-amber-500/40 rounded-full flex items-center justify-center mx-auto animate-pulse shadow-[0_0_30px_rgba(245,158,11,0.2)]">
            <i className="fa-solid fa-hourglass-half text-amber-500 text-5xl"></i>
          </div>
          <div className="space-y-6">
            <h2 className="text-4xl md:text-6xl font-black text-white tracking-tighter leading-none">
              Node Processing
            </h2>
            <p className="text-slate-400 font-medium text-lg leading-relaxed px-4">
              Your profile for <span className="text-amber-500 font-bold">{businessName}</span> is being reviewed. Authorized partners will be notified via WhatsApp.
            </p>
          </div>
          <button 
            onClick={onCancel}
            className="w-full py-5 text-slate-500 font-black uppercase tracking-widest text-[11px] hover:text-slate-300 transition-all"
          >
            Return Home
          </button>
        </div>
      </div>
    );
  }

  if (step === 'STEP_IDENTITY') {
    return (
      <div className="bg-slate-900/60 rounded-[4rem] border border-slate-800 p-10 md:p-20 text-left relative overflow-hidden animate-in slide-in-from-bottom-8 duration-700 shadow-2xl">
        <div className="relative z-10 max-w-xl mx-auto">
          <ProgressHeader current={1} />
          <div className="space-y-10">
            <div className="space-y-2">
              <h2 className="text-4xl font-black text-white tracking-tight">Profile Completion</h2>
              <p className="text-slate-500 text-sm uppercase tracking-widest font-bold">Step 1: Partner Authentication</p>
            </div>
            
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 ml-4">Owner Name</label>
                <input 
                  type="text" value={ownerName} onChange={(e) => setOwnerName(e.target.value)}
                  placeholder="Full Legal Name"
                  className="w-full p-5 bg-slate-950 border border-slate-800 rounded-2xl text-white focus:border-amber-500/50 outline-none transition-all text-sm font-medium"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 ml-4">Email Address</label>
                <input 
                  type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                  placeholder="email@example.com"
                  className="w-full p-5 bg-slate-950 border border-slate-800 rounded-2xl text-white focus:border-amber-500/50 outline-none transition-all text-sm font-medium"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 ml-4">Secure Password</label>
                <input 
                  type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full p-5 bg-slate-950 border border-slate-800 rounded-2xl text-white focus:border-amber-500/50 outline-none transition-all text-sm font-medium"
                />
              </div>
            </div>

            <button 
              onClick={() => ownerName && email && password.length >= 6 && setStep('STEP_BUSINESS')}
              disabled={!ownerName || !email || password.length < 6}
              className="w-full py-6 bg-amber-500 text-slate-950 font-black uppercase tracking-widest text-sm rounded-[2rem] shadow-xl shadow-amber-500/20 active:scale-[0.98] transition-all disabled:opacity-30"
            >
              Continue to Business Details
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'STEP_BUSINESS') {
    return (
      <div className="bg-slate-900/60 rounded-[4rem] border border-slate-800 p-10 md:p-20 text-left relative overflow-hidden animate-in slide-in-from-bottom-8 duration-700 shadow-2xl">
        <div className="relative z-10 max-w-xl mx-auto">
          <ProgressHeader current={2} />
          <div className="space-y-10">
            <div className="space-y-2">
              <h2 className="text-4xl font-black text-white tracking-tight">Business Details</h2>
              <p className="text-slate-500 text-sm uppercase tracking-widest font-bold">Step 2: Shop Identity & Location</p>
            </div>
            
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 ml-4">Shop Name</label>
                <input 
                  type="text" value={businessName} onChange={(e) => setBusinessName(e.target.value)}
                  placeholder="Master Tech Hub"
                  className="w-full p-5 bg-slate-950 border border-slate-800 rounded-2xl text-white focus:border-amber-500/50 outline-none transition-all text-sm font-medium"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 ml-4">City</label>
                  <input 
                    type="text" value={location} onChange={(e) => setLocation(e.target.value)}
                    placeholder="e.g. Duhok"
                    className="w-full p-5 bg-slate-950 border border-slate-800 rounded-2xl text-white focus:border-amber-500/50 outline-none transition-all text-sm font-medium"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 ml-4">Neighborhood</label>
                  <input 
                    type="text" value={neighborhood} onChange={(e) => setNeighborhood(e.target.value)}
                    placeholder="e.g. Sina3a"
                    className="w-full p-5 bg-slate-950 border border-slate-800 rounded-2xl text-white focus:border-amber-500/50 outline-none transition-all text-sm font-medium"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-4">
              <button onClick={() => setStep('STEP_IDENTITY')} className="flex-1 py-6 bg-slate-950 border border-slate-800 text-slate-500 font-black uppercase tracking-widest text-[10px] rounded-[2rem]">Back</button>
              <button 
                onClick={() => businessName && location && setStep('STEP_EXPERTISE')}
                disabled={!businessName || !location}
                className="flex-[2] py-6 bg-amber-500 text-slate-950 font-black uppercase tracking-widest text-sm rounded-[2rem] shadow-xl shadow-amber-500/20 active:scale-[0.98] transition-all disabled:opacity-30"
              >
                Next: Service Offerings
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'STEP_EXPERTISE') {
    return (
      <div className="bg-slate-900/60 rounded-[4rem] border border-slate-800 p-10 md:p-20 text-left relative overflow-hidden animate-in slide-in-from-bottom-8 duration-700 shadow-2xl">
        <div className="relative z-10 max-w-xl mx-auto">
          <ProgressHeader current={3} />
          <div className="space-y-10">
            <div className="space-y-2">
              <h2 className="text-4xl font-black text-white tracking-tight">Service Offerings</h2>
              <p className="text-slate-500 text-sm uppercase tracking-widest font-bold">Step 3: Expertise & Specialization</p>
            </div>
            
            <div className="space-y-8">
              <div className="space-y-4">
                <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 ml-4">Technical Specialties</label>
                <div className="grid grid-cols-2 gap-3">
                  {SPECIALTIES.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => toggleSpecialty(s.id)}
                      className={`p-5 rounded-2xl border transition-all flex flex-col items-center gap-3 group ${
                        selectedSpecialties.includes(s.id) 
                          ? 'bg-amber-500/10 border-amber-500/50 text-amber-500' 
                          : 'bg-slate-950 border-slate-800 text-slate-500 hover:border-slate-700'
                      }`}
                    >
                      <i className={`fa-solid ${s.icon} text-2xl ${selectedSpecialties.includes(s.id) ? s.color : 'text-slate-700'} group-hover:scale-110 transition-transform`}></i>
                      <span className="text-[10px] font-black uppercase tracking-widest">{s.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 ml-4">Brand Focus (Optional)</label>
                <input 
                  type="text" value={brands} onChange={(e) => setBrands(e.target.value)}
                  placeholder="e.g. BMW, Mercedes, Toyota, Apple, Samsung"
                  className="w-full p-5 bg-slate-950 border border-slate-800 rounded-2xl text-white focus:border-amber-500/50 outline-none transition-all text-sm font-medium"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 ml-4">Service Description</label>
                <textarea 
                  value={serviceDescription} onChange={(e) => setServiceDescription(e.target.value)}
                  placeholder="Tell customers about your expert service quality..."
                  className="w-full p-5 bg-slate-950 border border-slate-800 rounded-2xl text-white focus:border-amber-500/50 outline-none transition-all text-sm font-medium h-32 resize-none"
                />
              </div>
            </div>

            <div className="flex gap-4">
              <button onClick={() => setStep('STEP_BUSINESS')} className="flex-1 py-6 bg-slate-950 border border-slate-800 text-slate-500 font-black uppercase tracking-widest text-[10px] rounded-[2rem]">Back</button>
              <button 
                onClick={() => selectedSpecialties.length > 0 && setStep('STEP_CONNECT')}
                disabled={selectedSpecialties.length === 0}
                className="flex-[2] py-6 bg-amber-500 text-slate-950 font-black uppercase tracking-widest text-sm rounded-[2rem] shadow-xl shadow-amber-500/20 active:scale-[0.98] transition-all disabled:opacity-30"
              >
                Next: Connect Node
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'STEP_CONNECT') {
    return (
      <div className="bg-slate-900/60 rounded-[4rem] border border-slate-800 p-10 md:p-20 text-left relative overflow-hidden animate-in slide-in-from-bottom-8 duration-700 shadow-2xl">
        <div className="relative z-10 max-w-xl mx-auto">
          <ProgressHeader current={4} />
          <div className="space-y-10">
            <div className="space-y-2">
              <h2 className="text-4xl font-black text-white tracking-tight">Connectivity</h2>
              <p className="text-slate-500 text-sm uppercase tracking-widest font-bold">Step 4: WhatsApp Leads Integration</p>
            </div>
            
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 ml-4">WhatsApp Leads Number</label>
                <div className="relative">
                  <i className="fa-brands fa-whatsapp absolute left-5 top-1/2 -translate-y-1/2 text-emerald-500 text-xl"></i>
                  <input 
                    type="tel" value={phone} onChange={(e) => setPhone(e.target.value)}
                    placeholder="+964..."
                    className="w-full p-5 pl-14 bg-slate-950 border border-slate-800 rounded-2xl text-white focus:border-amber-500/50 outline-none transition-all text-sm font-medium"
                  />
                </div>
                <p className="text-[10px] text-slate-500 mt-2 px-4">This number will receive direct leads from customers using the Repair Wizard app.</p>
              </div>
            </div>

            <div className="flex gap-4">
              <button onClick={() => setStep('STEP_EXPERTISE')} className="flex-1 py-6 bg-slate-950 border border-slate-800 text-slate-500 font-black uppercase tracking-widest text-[10px] rounded-[2rem]">Back</button>
              <button 
                onClick={() => phone.length >= 8 && setStep('STEP_REVIEW')}
                disabled={phone.length < 8}
                className="flex-[2] py-6 bg-amber-500 text-slate-950 font-black uppercase tracking-widest text-sm rounded-[2rem] shadow-xl shadow-amber-500/20 active:scale-[0.98] transition-all disabled:opacity-30"
              >
                Final Review
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'STEP_REVIEW') {
    return (
      <div className="bg-slate-900/60 rounded-[4rem] border border-slate-800 p-10 md:p-20 text-left relative overflow-hidden animate-in slide-in-from-bottom-8 duration-700 shadow-2xl">
        <div className="relative z-10 max-w-xl mx-auto">
          <ProgressHeader current={5} />
          <div className="space-y-10">
            <div className="space-y-2">
              <h2 className="text-4xl font-black text-white tracking-tight">Ready for Launch?</h2>
              <p className="text-slate-500 text-sm uppercase tracking-widest font-bold">Step 5: Synthesis Verification</p>
            </div>
            
            <div className="bg-slate-950/50 border border-slate-800 rounded-[2.5rem] p-8 space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Partner</h4>
                  <p className="text-sm font-bold text-white">{ownerName}</p>
                </div>
                <div>
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Shop</h4>
                  <p className="text-sm font-bold text-white">{businessName}</p>
                </div>
                <div>
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Region</h4>
                  <p className="text-sm font-bold text-white">{location}, {neighborhood}</p>
                </div>
                <div>
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Node</h4>
                  <p className="text-sm font-bold text-emerald-500">{phone}</p>
                </div>
              </div>
              <div className="border-t border-slate-800 pt-6">
                <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Expertise Spectrum</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedSpecialties.map(sid => {
                    const s = SPECIALTIES.find(x => x.id === sid);
                    return s ? (
                      <span key={sid} className="px-4 py-1.5 bg-slate-900 border border-slate-800 rounded-full text-[10px] font-black text-slate-300 uppercase">
                        {s.label}
                      </span>
                    ) : null;
                  })}
                </div>
              </div>
            </div>

            <div className="flex gap-4">
              <button onClick={() => setStep('STEP_CONNECT')} className="flex-1 py-6 bg-slate-950 border border-slate-800 text-slate-500 font-black uppercase tracking-widest text-[10px] rounded-[2rem]">Back</button>
              <button 
                onClick={handleApply}
                disabled={isSubmitting}
                className="flex-[2] py-6 bg-gradient-to-r from-amber-600 to-amber-500 text-slate-950 font-black uppercase tracking-widest text-sm rounded-[2rem] shadow-xl shadow-amber-500/20 active:scale-[0.98] transition-all disabled:opacity-30 flex items-center justify-center gap-3"
              >
                {isSubmitting ? <i className="fa-solid fa-circle-notch animate-spin"></i> : <><i className="fa-solid fa-check"></i> Initiate Portal</>}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'SIGNIN') {
    return (
      <div className="bg-slate-900/60 rounded-[4rem] border border-slate-800 p-10 md:p-20 text-left relative overflow-hidden animate-in slide-in-from-bottom-8 duration-700 shadow-2xl">
        <div className="relative z-10 max-w-xl mx-auto space-y-12">
          <div className="space-y-4 text-center">
            <h2 className="text-4xl md:text-6xl font-black text-white tracking-tighter leading-none">
              Partner Sign In
            </h2>
          </div>
          {errorMsg && (
            <div className="bg-rose-500/10 border border-rose-500/20 p-4 rounded-2xl text-rose-500 text-xs font-bold text-center">
              {errorMsg}
            </div>
          )}
          <form onSubmit={handleSignIn} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 ml-4">Email</label>
              <input 
                type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="email@example.com"
                className="w-full p-4 bg-slate-950 border border-slate-800 rounded-2xl text-white focus:border-amber-500/50 outline-none transition-all text-sm font-medium"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 ml-4">Password</label>
              <input 
                type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full p-4 bg-slate-950 border border-slate-800 rounded-2xl text-white focus:border-amber-500/50 outline-none transition-all text-sm font-medium"
              />
            </div>
            <button 
              type="submit" 
              disabled={isSubmitting}
              className="w-full py-8 bg-amber-500 text-slate-950 font-black uppercase tracking-[0.4em] text-sm rounded-[3rem] shadow-2xl shadow-amber-500/30 active:scale-[0.97] transition-all disabled:opacity-50 relative overflow-hidden group mt-6"
            >
              <div className="relative z-10">
                {isSubmitting ? <i className="fa-solid fa-circle-notch animate-spin"></i> : "Enter Portal"}
              </div>
              <div className="absolute top-0 -left-full w-2/3 h-full bg-gradient-to-r from-transparent via-white/40 to-transparent skew-x-[35deg] group-hover:animate-[shine_2s_infinite]"></div>
            </button>
            <button 
              type="button"
              onClick={() => setStep('INTRO')}
              className="w-full text-center text-slate-500 text-[10px] font-bold uppercase tracking-widest hover:text-slate-300"
            >
              Back to Intro
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-900/40 rounded-[4rem] border border-slate-800 p-10 md:p-20 text-center relative overflow-hidden animate-in zoom-in-95 duration-700 shadow-2xl">
      <div className="relative z-10 space-y-16 max-w-2xl mx-auto">
        <div className="flex justify-center">
           <div className="relative w-36 h-36 bg-gradient-to-br from-amber-200 via-amber-400 to-amber-700 rounded-[3rem] flex items-center justify-center shadow-2xl border-4 border-amber-100/30">
             <i className="fa-solid fa-crown text-white text-6xl"></i>
           </div>
        </div>
        <div className="space-y-6">
           <h2 className="text-5xl md:text-7xl font-black text-white tracking-tighter leading-none">
             Partner Portal
           </h2>
           <p className="text-amber-500 font-black text-sm md:text-xl uppercase tracking-[0.4em]">
             Onboarding & Mastery
           </p>
        </div>
        <div className="bg-slate-950/40 border border-slate-800 rounded-[3.5rem] p-12 text-left space-y-10 backdrop-blur-3xl shadow-inner">
           <BenefitRow icon="fa-wand-magic-sparkles" text="Gemini-3-Pro Technical Insights" color="text-amber-500" />
           <BenefitRow icon="fa-chart-line" text="Market Pulse & Part Strategy" color="text-blue-500" />
           <BenefitRow icon="fa-comments-dollar" text="Verified WhatsApp Lead Stream" color="text-emerald-500" />
        </div>
        <div className="flex flex-col gap-5 pt-8">
          <button 
            onClick={() => setStep('STEP_IDENTITY')}
            className="w-full py-9 bg-amber-500 text-slate-950 rounded-[3rem] flex items-center justify-center gap-6 shadow-[0_25px_70px_rgba(245,158,11,0.4)] transition-all active:scale-[0.97] group relative overflow-hidden"
          >
            <i className="fa-solid fa-file-signature text-3xl group-hover:rotate-12 transition-transform"></i>
            <span className="text-xl font-black uppercase tracking-[0.2em]">Begin Onboarding</span>
            <div className="absolute top-0 -left-full w-2/3 h-full bg-gradient-to-r from-transparent via-white/40 to-transparent skew-x-[35deg] group-hover:animate-[shine_1.5s_infinite]"></div>
          </button>
          <button 
            onClick={() => setStep('SIGNIN')}
            className="w-full py-5 bg-slate-950 border border-slate-800 text-slate-400 font-black uppercase tracking-widest text-[11px] rounded-2xl hover:text-white transition-all active:scale-95"
          >
            Enter Existing Node
          </button>
          <button 
            onClick={onCancel}
            className="w-full py-3 text-slate-600 font-black uppercase tracking-widest text-[11px] hover:text-slate-400 transition-all"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default PartnerForm;