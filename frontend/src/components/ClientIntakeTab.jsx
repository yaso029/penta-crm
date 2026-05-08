import { useState, useEffect, useCallback } from 'react';
const API = import.meta.env.VITE_API_URL || 'https://penta-crm-production.up.railway.app';
import { NAVY, GOLD } from './intake/ui';
import { T } from './intake/translations';
import WelcomeStep from './intake/WelcomeStep';
import ContactStep from './intake/ContactStep';
import PurposeStep from './intake/PurposeStep';
import PropertyTypeStep from './intake/PropertyTypeStep';
import BedroomsStep from './intake/BedroomsStep';
import AreasStep from './intake/AreasStep';
import MarketStep from './intake/MarketStep';
import BudgetStep from './intake/BudgetStep';
import PaymentStep from './intake/PaymentStep';
import FeaturesStep from './intake/FeaturesStep';
import TimelineStep from './intake/TimelineStep';
import NotesStep from './intake/NotesStep';
import ReviewStep from './intake/ReviewStep';

const INITIAL_DATA = {
  language: 'en',
  fullName: '', whatsapp: '', email: '', nationality: '', inDubai: null,
  purpose: null, investmentGoal: null, residenceType: null,
  propertyTypes: [], bedrooms: null,
  areas: [],
  marketPreference: null,
  budgetMin: 1_000_000, budgetMax: 5_000_000,
  paymentMethod: null, mortgagePreapproved: null, preapprovalAmount: '', downPaymentPct: null,
  employmentStatus: null, monthlyIncome: '', monthlyLiabilities: '',
  features: [],
  timeline: null, viewedProperties: null, otherBrokers: null,
  additionalNotes: '',
};

const STEP_NAMES = [
  'welcome', 'purpose', 'propertyType', 'bedrooms', 'areas',
  'market', 'budget', 'payment', 'features', 'timeline', 'notes', 'contact', 'review',
];
const TOTAL_STEPS = 11;

export default function ClientIntakeTab() {
  const [step, setStep] = useState(0);
  const [data, setData] = useState(() => {
    try {
      const saved = localStorage.getItem('propiq-intake-v3');
      return saved ? { ...INITIAL_DATA, ...JSON.parse(saved) } : INITIAL_DATA;
    } catch { return INITIAL_DATA; }
  });
  const [generating, setGenerating] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [genError, setGenError] = useState(null);

  useEffect(() => {
    if (step > 0) localStorage.setItem('propiq-intake-v3', JSON.stringify(data));
  }, [data, step]);

  const update = useCallback(fields => setData(prev => ({ ...prev, ...fields })), []);

  function next() { setStep(s => Math.min(s + 1, STEP_NAMES.length - 1)); }
  function back() { setStep(s => Math.max(0, s - 1)); }
  function goTo(s) { setStep(s); }

  async function generateReport() {
    setGenerating(true);
    setGenError(null);
    try {
      const saveRes = await fetch(`${API}/intake/form/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ form_data: data }),
      });
      if (!saveRes.ok) throw new Error('Submission failed — please try again');
      localStorage.removeItem('propiq-intake-v3');
      setSubmitted(true);
    } catch (e) {
      setGenError(e.message);
    } finally {
      setGenerating(false);
    }
  }

  const language = data.language || 'en';
  const lang = T[language] || T.en;
  const isAr = language === 'ar';
  const arabicFont = "'Cairo', sans-serif";
  const defaultFont = '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
  const fontFamily = isAr ? arabicFont : defaultFont;

  const progressPct = step === 0 ? 0 : step >= 12 ? 100 : Math.round((step / TOTAL_STEPS) * 100);
  const stepProps = { data, update, onNext: next, onBack: back, onGoTo: goTo, language };
  const isWelcome = step === 0;

  if (isWelcome) {
    return (
      <div style={{ fontFamily }}>
        <style>{`@import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800;900&display=swap');`}</style>
        <WelcomeStep
          onStart={next}
          language={language}
          onLanguage={l => update({ language: l })}
        />
      </div>
    );
  }

  if (submitted) {
    return (
      <div style={{
        fontFamily, direction: isAr ? 'rtl' : 'ltr',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        minHeight: '100vh', textAlign: 'center', padding: '60px 24px',
        background: '#fff',
      }}>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800;900&display=swap');
          @keyframes checkPop { 0% { transform: scale(0); opacity: 0; } 60% { transform: scale(1.2); } 100% { transform: scale(1); opacity: 1; } }
          @keyframes pulse { 0%,100% { opacity: 0.4; transform: scale(1); } 50% { opacity: 1; transform: scale(1.05); } }
        `}</style>
        <div style={{ maxWidth: 480 }}>
          {/* Animated checkmark */}
          <div style={{
            width: 80, height: 80, borderRadius: '50%',
            background: 'linear-gradient(135deg, #C9A84C, #E8C15A)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 32px',
            animation: 'checkPop 0.5s ease forwards',
            boxShadow: '0 8px 32px rgba(201,168,76,0.35)',
          }}>
            <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
              <path d="M7 18 L15 26 L29 10" stroke="#fff" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>

          <h2 style={{ fontSize: 30, fontWeight: 800, color: NAVY, margin: '0 0 16px', lineHeight: 1.2 }}>
            {lang.thankYou.title(data.fullName || (isAr ? 'عزيزي العميل' : 'there'))}
          </h2>

          {/* AI scanning badge */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: '#F0FDF4', border: '1px solid #BBF7D0',
            borderRadius: 100, padding: '8px 20px', marginBottom: 20,
            animation: 'pulse 2s ease infinite',
          }}>
            <span style={{ fontSize: 16 }}>🤖</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#15803D' }}>
              {isAr ? 'الذكاء الاصطناعي يعمل الآن...' : 'AI is scanning now...'}
            </span>
          </div>

          <p style={{ fontSize: 16, color: '#6B7280', margin: '0 auto', lineHeight: 1.75, maxWidth: 440 }}>
            {lang.thankYou.body}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      fontFamily, direction: isAr ? 'rtl' : 'ltr',
      display: 'flex', minHeight: '100vh', background: '#fff',
    }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800;900&display=swap');`}</style>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {/* Progress bar */}
        <div style={{ padding: '16px 32px 0', background: '#fff', borderBottom: '1px solid #F1F5F9' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#94A3B8' }}>
              {step < 12 ? lang.step(step, TOTAL_STEPS) : lang.reviewStep}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: '#C9A84C' }}>
                {step >= 12 ? '100%' : `${progressPct}%`}
              </span>
              <button onClick={() => { setStep(0); }} style={{
                fontSize: 11, color: '#9CA3AF', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit',
              }}>
                {lang.restart}
              </button>
            </div>
          </div>
          <div style={{ height: 4, background: '#F1F5F9', borderRadius: 2, marginBottom: 16 }}>
            <div style={{
              height: '100%',
              width: `${step >= 12 ? 100 : progressPct}%`,
              background: `linear-gradient(90deg, #C9A84C, #E8C15A)`,
              borderRadius: 2, transition: 'width 0.4s ease',
            }} />
          </div>
        </div>

        {/* Step content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '32px 40px' }}>
          <div key={step} style={{ animation: 'fadeSlide 0.3s ease' }}>
            {step === 1 && <PurposeStep {...stepProps} />}
            {step === 2 && <PropertyTypeStep {...stepProps} />}
            {step === 3 && <BedroomsStep {...stepProps} />}
            {step === 4 && <AreasStep {...stepProps} />}
            {step === 5 && <MarketStep {...stepProps} />}
            {step === 6 && <BudgetStep {...stepProps} />}
            {step === 7 && <PaymentStep {...stepProps} />}
            {step === 8 && <FeaturesStep {...stepProps} />}
            {step === 9 && <TimelineStep {...stepProps} />}
            {step === 10 && <NotesStep {...stepProps} />}
            {step === 11 && <ContactStep {...stepProps} />}
            {step === 12 && (
              <>
                <ReviewStep {...stepProps} onGenerate={generateReport} generating={generating} />
                {genError && (
                  <div style={{
                    marginTop: 16, padding: '12px 20px',
                    background: '#FEF2F2', border: '1px solid #FECACA',
                    borderRadius: 10, fontSize: 13, color: '#DC2626', textAlign: 'center',
                  }}>
                    {genError} — make sure the backend is running.
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeSlide {
          from { opacity: 0; transform: translateX(${isAr ? '-' : ''}18px); }
          to   { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </div>
  );
}
