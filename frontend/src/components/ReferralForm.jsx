import { useState } from 'react';

const API = import.meta.env.VITE_API_URL || 'https://penta-crm-production.up.railway.app';
const NAVY = '#0A2342';
const GOLD = '#C9A84C';
const BORDER = '#E2E8F0';

const T = {
  en: {
    welcome: {
      title: 'Join Our Referral Network',
      subtitle: 'Partner with Penta Real Estate and earn commissions on every successful deal you refer.',
      start: 'Apply Now',
    },
    form: {
      title: 'Your Information',
      subtitle: 'Fill in your details so we can get in touch.',
      nameLabel: 'Full Name',
      namePlaceholder: 'Your full name',
      phoneLabel: 'WhatsApp Number',
      emailLabel: 'Email Address',
      jobLabel: 'Job / Profession',
      jobPlaceholder: 'e.g. Real Estate Broker, Consultant...',
      nationalityLabel: 'Nationality',
      nationalityPlaceholder: 'Select nationality',
    },
    agreement: {
      title: 'Partnership Agreement',
      subtitle: 'Please read and agree to the following terms.',
      terms: [
        'I agree to refer clients exclusively to Penta Real Estate for the duration of our partnership.',
        'I understand that commission is paid only upon a successfully closed deal.',
        'I confirm that all referred client information is shared with consent.',
        'I agree to maintain professionalism and confidentiality at all times.',
      ],
      checkLabel: 'I have read and agree to the above terms and conditions.',
    },
    thankYou: {
      title: 'Application Received!',
      body: 'Thank you for applying to join our referral network. Our team will review your application and contact you within 24–48 hours.',
    },
    next: 'Continue',
    back: 'Back',
    submit: 'Submit Application',
    required: 'Required field',
    step: (s, t) => `Step ${s} of ${t}`,
  },
  ar: {
    welcome: {
      title: 'انضم إلى شبكة الإحالة لدينا',
      subtitle: 'تعاون مع بنتا العقارية واكسب عمولات على كل صفقة ناجحة تحيلها إلينا.',
      start: 'تقدم الآن',
    },
    form: {
      title: 'معلوماتك الشخصية',
      subtitle: 'أدخل بياناتك حتى نتمكن من التواصل معك.',
      nameLabel: 'الاسم الكامل',
      namePlaceholder: 'اسمك الكامل',
      phoneLabel: 'رقم واتساب',
      emailLabel: 'البريد الإلكتروني',
      jobLabel: 'المهنة / الوظيفة',
      jobPlaceholder: 'مثال: وسيط عقاري، مستشار...',
      nationalityLabel: 'الجنسية',
      nationalityPlaceholder: 'اختر الجنسية',
    },
    agreement: {
      title: 'اتفاقية الشراكة',
      subtitle: 'يرجى قراءة الشروط التالية والموافقة عليها.',
      terms: [
        'أوافق على إحالة العملاء حصريًا إلى بنتا العقارية طوال فترة شراكتنا.',
        'أفهم أن العمولة تُدفع فقط عند إتمام الصفقة بنجاح.',
        'أؤكد أن جميع معلومات العملاء المُحالين مشاركة بموافقتهم.',
        'أوافق على الحفاظ على الاحترافية والسرية في جميع الأوقات.',
      ],
      checkLabel: 'لقد قرأت الشروط والأحكام أعلاه وأوافق عليها.',
    },
    thankYou: {
      title: 'تم استلام طلبك!',
      body: 'شكرًا لتقدمك للانضمام إلى شبكة الإحالة لدينا. سيراجع فريقنا طلبك ويتواصل معك خلال 24 إلى 48 ساعة.',
    },
    next: 'متابعة',
    back: 'رجوع',
    submit: 'إرسال الطلب',
    required: 'حقل مطلوب',
    step: (s, t) => `الخطوة ${s} من ${t}`,
  },
};

const NATIONALITIES = [
  { value: 'AE', label: '🇦🇪 United Arab Emirates' },
  { value: 'SA', label: '🇸🇦 Saudi Arabia' },
  { value: 'KW', label: '🇰🇼 Kuwait' },
  { value: 'QA', label: '🇶🇦 Qatar' },
  { value: 'BH', label: '🇧🇭 Bahrain' },
  { value: 'OM', label: '🇴🇲 Oman' },
  { value: 'EG', label: '🇪🇬 Egypt' },
  { value: 'LB', label: '🇱🇧 Lebanon' },
  { value: 'JO', label: '🇯🇴 Jordan' },
  { value: 'SY', label: '🇸🇾 Syria' },
  { value: 'IQ', label: '🇮🇶 Iraq' },
  { value: 'PS', label: '🇵🇸 Palestine' },
  { value: 'IN', label: '🇮🇳 India' },
  { value: 'PK', label: '🇵🇰 Pakistan' },
  { value: 'BD', label: '🇧🇩 Bangladesh' },
  { value: 'PH', label: '🇵🇭 Philippines' },
  { value: 'ID', label: '🇮🇩 Indonesia' },
  { value: 'CN', label: '🇨🇳 China' },
  { value: 'TR', label: '🇹🇷 Turkey' },
  { value: 'IR', label: '🇮🇷 Iran' },
  { value: 'KZ', label: '🇰🇿 Kazakhstan' },
  { value: 'UZ', label: '🇺🇿 Uzbekistan' },
  { value: 'RU', label: '🇷🇺 Russia' },
  { value: 'UA', label: '🇺🇦 Ukraine' },
  { value: 'GB', label: '🇬🇧 United Kingdom' },
  { value: 'FR', label: '🇫🇷 France' },
  { value: 'DE', label: '🇩🇪 Germany' },
  { value: 'IT', label: '🇮🇹 Italy' },
  { value: 'US', label: '🇺🇸 United States' },
  { value: 'CA', label: '🇨🇦 Canada' },
  { value: 'AU', label: '🇦🇺 Australia' },
  { value: 'NG', label: '🇳🇬 Nigeria' },
  { value: 'GH', label: '🇬🇭 Ghana' },
  { value: 'ZA', label: '🇿🇦 South Africa' },
  { value: 'OTHER', label: '🌍 Other' },
];

const inputStyle = {
  width: '100%', padding: '12px 16px', border: `1.5px solid ${BORDER}`,
  borderRadius: 10, fontSize: 15, outline: 'none', background: '#fff',
  boxSizing: 'border-box', fontFamily: 'inherit',
};

export default function ReferralForm() {
  const [language, setLanguage] = useState('en');
  const [step, setStep] = useState(0); // 0=welcome, 1=form, 2=agreement
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [agreed, setAgreed] = useState(false);

  const [form, setForm] = useState({
    full_name: '', phone: '', email: '', job: '', nationality: '',
  });

  const lang = T[language];
  const isAr = language === 'ar';
  const fontFamily = isAr ? "'Cairo', sans-serif" : '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';

  const update = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const canProceedForm = form.full_name.trim() && form.phone.trim();

  async function submit() {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`${API}/referral/form/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, language, agreed_to_terms: agreed }),
      });
      if (!res.ok) throw new Error('Submission failed — please try again');
      setSubmitted(true);
    } catch (e) {
      setError(e.message);
    } finally {
      setSubmitting(false);
    }
  }

  const progressPct = step === 0 ? 0 : step === 1 ? 50 : 100;

  if (submitted) {
    return (
      <div style={{ fontFamily, direction: isAr ? 'rtl' : 'ltr', minHeight: '100vh', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 24px' }}>
        <style>{`@import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800;900&display=swap'); @keyframes checkPop { 0%{transform:scale(0);opacity:0} 60%{transform:scale(1.2)} 100%{transform:scale(1);opacity:1} } @keyframes pulse { 0%,100%{opacity:0.5;transform:scale(1)} 50%{opacity:1;transform:scale(1.04)} }`}</style>
        <div style={{ maxWidth: 480, textAlign: 'center' }}>
          <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'linear-gradient(135deg, #C9A84C, #E8C15A)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 32px', animation: 'checkPop 0.5s ease forwards', boxShadow: '0 8px 32px rgba(201,168,76,0.35)' }}>
            <svg width="36" height="36" viewBox="0 0 36 36" fill="none"><path d="M7 18 L15 26 L29 10" stroke="#fff" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </div>
          <h2 style={{ fontSize: 28, fontWeight: 800, color: NAVY, margin: '0 0 16px' }}>{lang.thankYou.title}</h2>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 100, padding: '8px 20px', marginBottom: 20, animation: 'pulse 2s ease infinite' }}>
            <span>🤝</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#15803D' }}>{isAr ? 'سيتواصل معك فريقنا قريبًا' : 'Our team will contact you soon'}</span>
          </div>
          <p style={{ fontSize: 15, color: '#6B7280', lineHeight: 1.75 }}>{lang.thankYou.body}</p>
        </div>
      </div>
    );
  }

  if (step === 0) {
    return (
      <div style={{ fontFamily, minHeight: '100vh', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 24px' }}>
        <style>{`@import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800;900&display=swap');`}</style>
        <div style={{ maxWidth: 480, width: '100%', textAlign: 'center' }}>
          <img src="/penta-logo.png" alt="Penta Real Estate" style={{ height: 120, width: 'auto', marginBottom: 32 }} />
          <h1 style={{ fontSize: 30, fontWeight: 800, color: NAVY, margin: '0 0 16px', lineHeight: 1.2 }}>{lang.welcome.title}</h1>
          <p style={{ fontSize: 16, color: '#6B7280', margin: '0 0 36px', lineHeight: 1.7 }}>{lang.welcome.subtitle}</p>
          <button onClick={() => setStep(1)} style={{ display: 'block', width: '100%', padding: '16px', background: `linear-gradient(135deg, ${NAVY}, #1a3a5c)`, color: '#fff', border: 'none', borderRadius: 12, fontSize: 16, fontWeight: 700, cursor: 'pointer', marginBottom: 20, fontFamily: 'inherit' }}>
            {lang.welcome.start}
          </button>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
            {['en', 'ar'].map(l => (
              <button key={l} onClick={() => setLanguage(l)} style={{ padding: '8px 22px', borderRadius: 10, border: `1.5px solid ${language === l ? NAVY : BORDER}`, background: language === l ? NAVY : '#fff', color: language === l ? '#fff' : '#6B7280', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                {l === 'en' ? 'English' : 'عربي'}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ fontFamily, direction: isAr ? 'rtl' : 'ltr', minHeight: '100vh', background: '#fff', display: 'flex', flexDirection: 'column' }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800;900&display=swap'); @keyframes fadeSlide { from{opacity:0;transform:translateX(${isAr ? '-' : ''}18px)} to{opacity:1;transform:translateX(0)} }`}</style>

      {/* Progress */}
      <div style={{ padding: '16px 32px 0', borderBottom: '1px solid #F1F5F9' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: '#94A3B8' }}>{lang.step(step, 2)}</span>
          <span style={{ fontSize: 12, fontWeight: 700, color: GOLD }}>{progressPct}%</span>
        </div>
        <div style={{ height: 4, background: '#F1F5F9', borderRadius: 2, marginBottom: 16 }}>
          <div style={{ height: '100%', width: `${progressPct}%`, background: `linear-gradient(90deg, ${GOLD}, #E8C15A)`, borderRadius: 2, transition: 'width 0.4s ease' }} />
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '32px 40px' }}>
        <div key={step} style={{ maxWidth: 560, margin: '0 auto', animation: 'fadeSlide 0.3s ease' }}>

          {step === 1 && (
            <>
              <h2 style={{ fontSize: 24, fontWeight: 800, color: NAVY, margin: '0 0 8px' }}>{lang.form.title}</h2>
              <p style={{ fontSize: 14, color: '#6B7280', margin: '0 0 28px' }}>{lang.form.subtitle}</p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>{lang.form.nameLabel} *</label>
                  <input style={inputStyle} value={form.full_name} onChange={e => update('full_name', e.target.value)} placeholder={lang.form.namePlaceholder} />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>{lang.form.phoneLabel} *</label>
                  <input style={inputStyle} value={form.phone} onChange={e => update('phone', e.target.value)} placeholder="+971 50 123 4567" type="tel" />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>{lang.form.emailLabel}</label>
                  <input style={inputStyle} value={form.email} onChange={e => update('email', e.target.value)} placeholder="your@email.com" type="email" />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>{lang.form.jobLabel}</label>
                  <input style={inputStyle} value={form.job} onChange={e => update('job', e.target.value)} placeholder={lang.form.jobPlaceholder} />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>{lang.form.nationalityLabel}</label>
                  <select style={{ ...inputStyle, color: form.nationality ? '#111' : '#9CA3AF' }} value={form.nationality} onChange={e => update('nationality', e.target.value)}>
                    <option value="">{lang.form.nationalityPlaceholder}</option>
                    {NATIONALITIES.map(n => <option key={n.value} value={n.value}>{n.label}</option>)}
                  </select>
                </div>
              </div>

              <button onClick={() => setStep(2)} disabled={!canProceedForm} style={{ display: 'block', width: '100%', marginTop: 32, padding: '16px', background: canProceedForm ? `linear-gradient(135deg, ${NAVY}, #1a3a5c)` : '#E2E8F0', color: canProceedForm ? '#fff' : '#9CA3AF', border: 'none', borderRadius: 12, fontSize: 15, fontWeight: 700, cursor: canProceedForm ? 'pointer' : 'not-allowed', fontFamily: 'inherit' }}>
                {lang.next} →
              </button>
              <button onClick={() => setStep(0)} style={{ display: 'block', width: '100%', marginTop: 10, padding: '12px', background: 'none', border: 'none', color: '#6B7280', fontSize: 14, cursor: 'pointer', fontFamily: 'inherit' }}>
                ← {lang.back}
              </button>
            </>
          )}

          {step === 2 && (
            <>
              <h2 style={{ fontSize: 24, fontWeight: 800, color: NAVY, margin: '0 0 8px' }}>{lang.agreement.title}</h2>
              <p style={{ fontSize: 14, color: '#6B7280', margin: '0 0 24px' }}>{lang.agreement.subtitle}</p>

              <div style={{ background: '#F8FAFC', border: `1px solid ${BORDER}`, borderRadius: 12, padding: '20px 24px', marginBottom: 24 }}>
                {lang.agreement.terms.map((term, i) => (
                  <div key={i} style={{ display: 'flex', gap: 12, marginBottom: i < lang.agreement.terms.length - 1 ? 16 : 0, alignItems: 'flex-start' }}>
                    <span style={{ width: 22, height: 22, background: `${GOLD}20`, border: `1.5px solid ${GOLD}`, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
                      <span style={{ fontSize: 11, color: GOLD, fontWeight: 800 }}>{i + 1}</span>
                    </span>
                    <p style={{ fontSize: 14, color: '#374151', margin: 0, lineHeight: 1.6 }}>{term}</p>
                  </div>
                ))}
              </div>

              <label style={{ display: 'flex', alignItems: 'flex-start', gap: 12, cursor: 'pointer', marginBottom: 28 }}>
                <input type="checkbox" checked={agreed} onChange={e => setAgreed(e.target.checked)} style={{ width: 18, height: 18, marginTop: 2, accentColor: NAVY, cursor: 'pointer', flexShrink: 0 }} />
                <span style={{ fontSize: 14, color: '#374151', lineHeight: 1.5, fontWeight: 600 }}>{lang.agreement.checkLabel}</span>
              </label>

              {error && (
                <div style={{ padding: '12px 16px', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 10, fontSize: 13, color: '#DC2626', marginBottom: 16 }}>{error}</div>
              )}

              <button onClick={submit} disabled={!agreed || submitting} style={{ display: 'block', width: '100%', padding: '16px', background: agreed ? `linear-gradient(135deg, ${NAVY}, #1a3a5c)` : '#E2E8F0', color: agreed ? '#fff' : '#9CA3AF', border: 'none', borderRadius: 12, fontSize: 15, fontWeight: 700, cursor: agreed ? 'pointer' : 'not-allowed', fontFamily: 'inherit' }}>
                {submitting ? (isAr ? 'جارٍ الإرسال...' : 'Submitting...') : lang.submit}
              </button>
              <button onClick={() => setStep(1)} style={{ display: 'block', width: '100%', marginTop: 10, padding: '12px', background: 'none', border: 'none', color: '#6B7280', fontSize: 14, cursor: 'pointer', fontFamily: 'inherit' }}>
                ← {lang.back}
              </button>
            </>
          )}

        </div>
      </div>
    </div>
  );
}
