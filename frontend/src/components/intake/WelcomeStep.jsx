import { NAVY, BORDER } from './ui';
import { T } from './translations';

export default function WelcomeStep({ onStart, language = 'en', onLanguage }) {
  const lang = T[language] || T.en;
  const isAr = language === 'ar';

  return (
    <div style={{
      minHeight: 'calc(100vh - 220px)',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      background: '#fff', borderRadius: 16,
      border: '1px solid #E5E7EB', padding: '60px 24px',
      fontFamily: isAr ? "'Cairo', sans-serif" : '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      direction: isAr ? 'rtl' : 'ltr',
    }}>

      {/* Actual company logo */}
      <img
        src="/penta-logo.png"
        alt="Penta Real Estate"
        style={{ height: 140, width: 'auto', marginBottom: 24, objectFit: 'contain' }}
      />

      {/* Subtitle */}
      <div style={{ fontSize: 12, color: '#6B7280', fontWeight: 500, letterSpacing: isAr ? '0' : '1.5px', textTransform: isAr ? 'none' : 'uppercase', marginBottom: 32 }}>
        {lang.welcome.subtitle}
      </div>

      <h1 style={{ fontSize: 34, fontWeight: 900, color: NAVY, textAlign: 'center', margin: '0 0 16px', maxWidth: 560, lineHeight: 1.2 }}>
        {lang.welcome.heading}
      </h1>
      <p style={{ fontSize: 16, color: '#6B7280', textAlign: 'center', margin: '0 0 40px', maxWidth: 460, lineHeight: 1.7 }}>
        {lang.welcome.body}
      </p>

      {/* Start button */}
      <button onClick={onStart} style={{
        padding: '16px 64px', background: NAVY, color: '#fff',
        border: 'none', borderRadius: 14, fontSize: 17, fontWeight: 800,
        cursor: 'pointer', letterSpacing: '-0.2px',
        boxShadow: '0 4px 20px rgba(10,22,40,0.25)',
        transition: 'transform 0.1s', marginBottom: 24, fontFamily: 'inherit',
      }}
        onMouseDown={e => { e.currentTarget.style.transform = 'scale(0.97)'; }}
        onMouseUp={e => { e.currentTarget.style.transform = 'scale(1)'; }}
      >
        {lang.welcome.start}
      </button>

      {/* Language toggle — right under the start button */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 36 }}>
        {['en', 'ar'].map(l => (
          <button key={l} onClick={() => onLanguage(l)} style={{
            padding: '8px 22px', borderRadius: 10,
            border: `1.5px solid ${language === l ? NAVY : BORDER}`,
            background: language === l ? NAVY : '#fff',
            color: language === l ? '#fff' : '#6B7280',
            fontSize: 14, fontWeight: 700, cursor: 'pointer',
            fontFamily: 'inherit', transition: 'all 0.15s',
          }}>
            {l === 'en' ? 'English' : 'عربي'}
          </button>
        ))}
      </div>

      {/* Trust badges */}
      <div style={{ display: 'flex', gap: 32, opacity: 0.4 }}>
        {[lang.welcome.secure, lang.welcome.time, lang.welcome.free].map(b => (
          <div key={b} style={{ fontSize: 12, color: NAVY, fontWeight: 600 }}>{b}</div>
        ))}
      </div>
    </div>
  );
}
