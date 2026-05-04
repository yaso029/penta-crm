import { NAVY, GOLD } from './ui';

export default function WelcomeStep({ onStart }) {
  return (
    <div style={{
      minHeight: 'calc(100vh - 220px)',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      background: '#fff', borderRadius: 16,
      border: '1px solid #E5E7EB', padding: '60px 24px',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    }}>
      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 48 }}>
        <div style={{ width: 56, height: 56, borderRadius: 14, background: NAVY, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="28" height="32" viewBox="0 0 22 26" fill="none">
            <path d="M 2 25 L 2 2 L 11 2 Q 20 2 20 10 Q 20 18 11 18 L 6 18 L 6 25 Z M 6 6 L 6 14 L 10 14 Q 15 14 15 10 Q 15 6 10 6 Z" fill={GOLD} fillRule="evenodd" />
          </svg>
        </div>
        <div>
          <div style={{ fontSize: 22, fontWeight: 800, color: NAVY, letterSpacing: '-0.5px' }}>Penta Real Estate</div>
          <div style={{ fontSize: 11, color: '#6B7280', fontWeight: 500, letterSpacing: '1px', textTransform: 'uppercase' }}>Dubai Property Advisor</div>
        </div>
      </div>

      <h1 style={{ fontSize: 36, fontWeight: 900, color: NAVY, textAlign: 'center', margin: '0 0 16px', maxWidth: 560, lineHeight: 1.15 }}>
        Let's find your perfect property
      </h1>
      <p style={{ fontSize: 16, color: '#6B7280', textAlign: 'center', margin: '0 0 48px', maxWidth: 460, lineHeight: 1.7 }}>
        Answer a few questions and we'll match you with the best properties in Dubai. Takes about 3 minutes.
      </p>

      <button onClick={onStart} style={{
        padding: '16px 64px', background: NAVY, color: '#fff',
        border: 'none', borderRadius: 14, fontSize: 17, fontWeight: 800,
        cursor: 'pointer', letterSpacing: '-0.2px',
        boxShadow: '0 4px 20px rgba(10,22,40,0.25)',
        transition: 'transform 0.1s', marginBottom: 36, fontFamily: 'inherit',
      }}
        onMouseDown={e => { e.currentTarget.style.transform = 'scale(0.97)'; }}
        onMouseUp={e => { e.currentTarget.style.transform = 'scale(1)'; }}
      >
        Start →
      </button>

      <div style={{ display: 'flex', gap: 32, opacity: 0.5 }}>
        {['Secure & Private', '3 Minutes', 'Free Consultation'].map(b => (
          <div key={b} style={{ fontSize: 12, color: NAVY, fontWeight: 600 }}>{b}</div>
        ))}
      </div>
    </div>
  );
}
