import { NAVY, GOLD, BORDER, BackBtn, NextBtn, StepTitle } from './ui';
import { T } from './translations';

export default function MarketStep({ data, update, onNext, onBack, language = 'en' }) {
  const lang = T[language] || T.en;
  const p = lang.market;

  const OPTIONS = [
    { value: 'offplan', icon: '🏗️', label: p.offplan, description: p.offplanDesc },
    { value: 'ready', icon: '🏠', label: p.ready, description: p.readyDesc },
    { value: 'both', icon: '🔍', label: p.both, description: p.bothDesc },
  ];

  return (
    <div style={{ maxWidth: 580, margin: '0 auto' }}>
      <BackBtn onClick={onBack} label={lang.back} />
      <StepTitle title={p.title} subtitle={p.subtitle} />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {OPTIONS.map(opt => {
          const sel = data.marketPreference === opt.value;
          return (
            <div key={opt.value} onClick={() => update({ marketPreference: opt.value })} style={{
              border: `2px solid ${sel ? GOLD : BORDER}`,
              borderRadius: 14, padding: '18px 22px',
              background: sel ? NAVY : '#fff',
              cursor: 'pointer', transition: 'all 0.15s',
              display: 'flex', alignItems: 'center', gap: 16,
              position: 'relative',
            }}>
              <div style={{ fontSize: 28, flexShrink: 0 }}>{opt.icon}</div>
              <div>
                <div style={{ fontSize: 16, fontWeight: 700, color: sel ? '#fff' : NAVY, marginBottom: 4 }}>
                  {opt.label}
                </div>
                <div style={{ fontSize: 13, color: sel ? '#CBD5E1' : '#6B7280', lineHeight: 1.5 }}>
                  {opt.description}
                </div>
              </div>
              {sel && (
                <div style={{ position: 'absolute', right: 18, color: GOLD, fontSize: 18, fontWeight: 900 }}>✓</div>
              )}
            </div>
          );
        })}
      </div>

      <NextBtn onClick={onNext} disabled={!data.marketPreference} label={lang.next} />
    </div>
  );
}
