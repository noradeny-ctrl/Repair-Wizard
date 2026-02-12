
import React, { useState } from 'react';
import { Language, UserRole } from '../types';
import { useTranslation } from '../services/i18n';
import { auth, db } from '../services/firebase';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  sendEmailVerification 
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';

interface PartnerFormProps {
  lang: Language;
  onCancel: () => void;
  onSuccess: (newRole: UserRole) => void;
}

type PartnerFormStep = 'INTRO' | 'APPLY' | 'SIGNIN' | 'PENDING';

const BenefitRow: React.FC<{ icon: string; text: string; color: string }> = ({ icon, text, color }) => (
  <div className="flex items-center gap-6 group">
    <div className={`w-12 h-12 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-center text-xl transition-all group-hover:scale-110 ${color}`}>
      <i className={`fa-solid ${icon}`}></i>
    </div>
    <span className="text-slate-200 font-bold text-lg md:text-xl tracking-tight">{text}</span>
  </div>
);

const PartnerForm: React.FC<PartnerFormProps> = ({ lang, onCancel, onSuccess }) => {
  const t = useTranslation(lang);
  const [step, setStep] = useState<PartnerFormStep>('INTRO');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form State
  const [ownerName, setOwnerName] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [location, setLocation] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg(null);

    if (password.length < 6) {
      setErrorMsg(t('auth_err_weak_password'));
      setIsSubmitting(false);
      return;
    }
    
    try {
      // 1. Create User in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // 2. Send verification email
      await sendEmailVerification(user);

      // 3. Save partner metadata to Firestore
      await setDoc(doc(db, "partners", user.uid), {
        ownerName,
        businessName,
        location,
        phone,
        email,
        status: "pending",
        role: UserRole.PARTNER,
        appliedAt: serverTimestamp(),
      });

      setStep('PENDING');
    } catch (err: any) {
      console.error("Signup Error:", err);
      
      // Handle Firebase specific Auth Errors
      if (err.code === 'auth/email-already-in-use') {
        setErrorMsg(t('auth_err_email_in_use'));
      } else if (err.code === 'auth/invalid-email') {
        setErrorMsg(t('auth_err_invalid_email'));
      } else if (err.code === 'auth/weak-password') {
        setErrorMsg(t('auth_err_weak_password'));
      } else {
        setErrorMsg(err.message || t('auth_err_generic'));
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
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Check partner status in Firestore
      const partnerDoc = await getDoc(doc(db, "partners", user.uid));
      
      if (!partnerDoc.exists()) {
        setErrorMsg(t('auth_err_user_not_found'));
        return;
      }

      const partnerData = partnerDoc.data();
      if (partnerData.status === 'active' || partnerData.status === 'approved') {
        // Success! Upgrade role and return
        onSuccess(UserRole.PARTNER);
      } else if (partnerData.status === 'pending') {
        setBusinessName(partnerData.businessName || 'Your Business');
        setStep('PENDING');
      } else {
        setErrorMsg(t('application_denied'));
      }
    } catch (err: any) {
      console.error("SignIn Error:", err);
      if (err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') {
        setErrorMsg(t('auth_err_wrong_pass'));
      } else {
        setErrorMsg(t('auth_err_generic'));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCheckStatus = () => {
    alert("Application Status: [PENDING REVIEW]. Our team is verifying your profile. You will receive an email once approved.");
  };

  if (step === 'PENDING') {
    return (
      <div className="bg-slate-900/60 rounded-[4rem] border border-amber-500/30 p-10 md:p-24 text-center relative overflow-hidden animate-in zoom-in-95 duration-700 shadow-2xl">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(245,158,11,0.05),transparent_70%)]"></div>
        
        <div className="relative z-10 space-y-12 max-w-lg mx-auto">
          <div className="w-28 h-28 bg-amber-500/10 border border-amber-500/40 rounded-full flex items-center justify-center mx-auto animate-pulse shadow-[0_0_30px_rgba(245,158,11,0.2)]">
            <i className="fa-solid fa-hourglass-half text-amber-500 text-5xl"></i>
          </div>
          
          <div className="space-y-6">
            <h2 className="text-4xl md:text-6xl font-black text-white tracking-tighter leading-none">
              Application Received
            </h2>
            <p className="text-slate-400 font-medium text-lg leading-relaxed px-4">
              Your profile for <span className="text-amber-500 font-bold">{businessName}</span> is being processed. Once approved, you can sign in to access your dashboard.
            </p>
            <p className="text-amber-500/60 font-black text-[10px] uppercase tracking-[0.2em]">
              {t('support_email_note')}
            </p>
          </div>

          <div className="flex flex-col gap-5 pt-4">
            <button 
              onClick={handleCheckStatus}
              className="w-full py-7 bg-amber-500 text-slate-950 font-black uppercase tracking-[0.3em] text-sm rounded-[2.5rem] hover:bg-amber-400 transition-all shadow-2xl shadow-amber-500/30 active:scale-95 group overflow-hidden relative"
            >
              <span className="relative z-10">{t('check_status')}</span>
              <div className="absolute top-0 -left-full w-2/3 h-full bg-gradient-to-r from-transparent via-white/40 to-transparent skew-x-[35deg] group-hover:animate-[shine_2s_infinite]"></div>
            </button>
            <button 
              onClick={onCancel}
              className="w-full py-5 text-slate-500 font-black uppercase tracking-widest text-[11px] hover:text-slate-300 transition-all"
            >
              Return Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'APPLY') {
    return (
      <div className="bg-slate-900/60 rounded-[4rem] border border-slate-800 p-10 md:p-20 text-left relative overflow-hidden animate-in slide-in-from-bottom-8 duration-700 shadow-2xl">
        <div className="relative z-10 max-w-xl mx-auto space-y-12">
          <div className="space-y-4 text-center">
            <h2 className="text-4xl md:text-6xl font-black text-white tracking-tighter leading-none">
              Apply for Access
            </h2>
            <p className="text-amber-500/80 font-bold text-sm uppercase tracking-[0.2em] leading-relaxed">
              Create your official Partner ID
            </p>
          </div>

          {errorMsg && (
            <div className="bg-rose-500/10 border border-rose-500/20 p-4 rounded-2xl text-rose-500 text-xs font-bold text-center animate-shake flex flex-col items-center gap-3">
              <span>{errorMsg}</span>
              {errorMsg === t('auth_err_email_in_use') && (
                <button 
                  onClick={() => setStep('SIGNIN')}
                  className="px-4 py-2 bg-rose-500 text-white rounded-xl text-[10px] uppercase tracking-widest font-black"
                >
                  {t('signin_btn')}
                </button>
              )}
            </div>
          )}

          <form onSubmit={handleApply} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 ml-4">Owner Name</label>
                <input 
                  type="text" required value={ownerName} onChange={(e) => setOwnerName(e.target.value)}
                  placeholder="Full Name"
                  className="w-full p-4 bg-slate-950 border border-slate-800 rounded-2xl text-white focus:border-amber-500/50 outline-none transition-all text-sm font-medium"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 ml-4">Business Name</label>
                <input 
                  type="text" required value={businessName} onChange={(e) => setBusinessName(e.target.value)}
                  placeholder="e.g. Master Tech"
                  className="w-full p-4 bg-slate-950 border border-slate-800 rounded-2xl text-white focus:border-amber-500/50 outline-none transition-all text-sm font-medium"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 ml-4">Location</label>
                <input 
                  type="text" required value={location} onChange={(e) => setLocation(e.target.value)}
                  placeholder="City, Region"
                  className="w-full p-4 bg-slate-950 border border-slate-800 rounded-2xl text-white focus:border-amber-500/50 outline-none transition-all text-sm font-medium"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 ml-4">WhatsApp</label>
                <input 
                  type="tel" required value={phone} onChange={(e) => setPhone(e.target.value)}
                  placeholder="+964..."
                  className="w-full p-4 bg-slate-950 border border-slate-800 rounded-2xl text-white focus:border-amber-500/50 outline-none transition-all text-sm font-medium"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 ml-4">Login Email</label>
              <input 
                type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="email@example.com"
                className="w-full p-4 bg-slate-950 border border-slate-800 rounded-2xl text-white focus:border-amber-500/50 outline-none transition-all text-sm font-medium"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 ml-4">Create Password</label>
              <input 
                type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimum 6 characters"
                className="w-full p-4 bg-slate-950 border border-slate-800 rounded-2xl text-white focus:border-amber-500/50 outline-none transition-all text-sm font-medium"
              />
            </div>

            <button 
              type="submit" 
              disabled={isSubmitting}
              className="w-full py-8 bg-amber-500 text-slate-950 font-black uppercase tracking-[0.4em] text-sm rounded-[3rem] shadow-2xl shadow-amber-500/30 active:scale-[0.97] transition-all disabled:opacity-50 relative overflow-hidden group mt-6"
            >
              <div className="relative z-10">
                {isSubmitting ? <i className="fa-solid fa-circle-notch animate-spin"></i> : "Initialize Partner Account"}
              </div>
              <div className="absolute top-0 -left-full w-2/3 h-full bg-gradient-to-r from-transparent via-white/40 to-transparent skew-x-[35deg] group-hover:animate-[shine_2s_infinite]"></div>
            </button>
            <button 
              type="button"
              onClick={() => setStep('SIGNIN')}
              className="w-full text-center text-slate-500 text-[10px] font-bold uppercase tracking-widest hover:text-slate-300"
            >
              {t('switch_to_signin')}
            </button>
          </form>
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
              {t('partner_signin_title')}
            </h2>
            <p className="text-amber-500/80 font-bold text-sm uppercase tracking-[0.2em] leading-relaxed">
              {t('partner_signin_desc')}
            </p>
          </div>

          {errorMsg && (
            <div className="bg-rose-500/10 border border-rose-500/20 p-4 rounded-2xl text-rose-500 text-xs font-bold text-center animate-shake">
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
                placeholder="********"
                className="w-full p-4 bg-slate-950 border border-slate-800 rounded-2xl text-white focus:border-amber-500/50 outline-none transition-all text-sm font-medium"
              />
            </div>

            <button 
              type="submit" 
              disabled={isSubmitting}
              className="w-full py-8 bg-amber-500 text-slate-950 font-black uppercase tracking-[0.4em] text-sm rounded-[3rem] shadow-2xl shadow-amber-500/30 active:scale-[0.97] transition-all disabled:opacity-50 relative overflow-hidden group mt-6"
            >
              <div className="relative z-10">
                {isSubmitting ? <i className="fa-solid fa-circle-notch animate-spin"></i> : t('signin_btn')}
              </div>
              <div className="absolute top-0 -left-full w-2/3 h-full bg-gradient-to-r from-transparent via-white/40 to-transparent skew-x-[35deg] group-hover:animate-[shine_2s_infinite]"></div>
            </button>
            <button 
              type="button"
              onClick={() => setStep('APPLY')}
              className="w-full text-center text-slate-500 text-[10px] font-bold uppercase tracking-widest hover:text-slate-300"
            >
              {t('switch_to_apply')}
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
             Authorized Pro Membership
           </p>
        </div>

        <div className="bg-slate-950/40 border border-slate-800 rounded-[3.5rem] p-12 text-left space-y-10 backdrop-blur-3xl shadow-inner">
           <BenefitRow icon="fa-wand-magic-sparkles" text="Gemini-3-Pro Engineering Chat" color="text-amber-500" />
           <BenefitRow icon="fa-chart-line" text="Local Market Trends & Parts Advice" color="text-blue-500" />
           <BenefitRow icon="fa-comments-dollar" text="Unlimited Direct WhatsApp Leads" color="text-emerald-500" />
        </div>

        <div className="flex flex-col gap-5 pt-8">
          <button 
            onClick={() => setStep('APPLY')}
            className="w-full py-9 bg-amber-500 text-slate-950 rounded-[3rem] flex items-center justify-center gap-6 shadow-[0_25px_70px_rgba(245,158,11,0.4)] transition-all active:scale-[0.97] group relative overflow-hidden"
          >
            <i className="fa-solid fa-file-signature text-3xl group-hover:rotate-12 transition-transform"></i>
            <span className="text-xl font-black uppercase tracking-[0.2em]">Start Application</span>
            <div className="absolute top-0 -left-full w-2/3 h-full bg-gradient-to-r from-transparent via-white/40 to-transparent skew-x-[35deg] group-hover:animate-[shine_1.5s_infinite]"></div>
          </button>

          <button 
            onClick={() => setStep('SIGNIN')}
            className="w-full py-5 bg-slate-950 border border-slate-800 text-slate-400 font-black uppercase tracking-widest text-[11px] rounded-2xl hover:text-white transition-all active:scale-95"
          >
            {t('partner_signin_title')}
          </button>
          
          <button 
            onClick={onCancel}
            className="w-full py-3 text-slate-600 font-black uppercase tracking-widest text-[11px] hover:text-slate-400 transition-all"
          >
            Cancel
          </button>
        </div>
      </div>
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
        .animate-shake {
          animation: shake 0.4s ease-in-out;
        }
      `}</style>
    </div>
  );
};

export default PartnerForm;
