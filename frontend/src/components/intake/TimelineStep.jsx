import { NAVY, GOLD, BORDER, BackBtn, NextBtn, StepTitle, FieldLabel, YesNoToggle } from './ui';
import { T } from './translations';

export default function TimelineStep({ data, update, onNext, onBack, language = 'en' }) {
  const lang = T[language] || T.en;
  const p = lang.timeline;

  const TIMELINES = [
    { value: 'immediate', label: p.immediate, sub: p.immediateSub },
    { value: '3months', label: p.threeMonths, sub: p.threeMonthsSub },
    { value: '6months', label: p.sixMonths, sub: p.sixMonthsSub },
    { value: '1year', label: p.oneYear, sub: p.oneYearSub },
    { value: 'exploring', label: p.exploring, sub: p.exploringSub },
  ];

  return (
    <div style={{ maxWidth: 560, margin: '0 auto' }}>
      <BackBtn onClick={onBack} label={lang.back} />
      <StepTitle title={p.title} subtitle={p.subtitle} />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 32 }}>
        {TIMELINES.map(t => {
          const sel = data.timeline === t.value;
          return (
            <div key={t.value} onClick={() => update({ timeline: t.value })} style={{
              border: `2px solid ${sel ? GOLD : BORDER}`,
              borderRadius: 12, padding: '14px 20px',
              background: sel ? NAVY : '#fff',
              cursor: 'pointer', transition: 'all 0.15s',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, color: sel ? '#fff' : NAVY }}>{t.label}</div>
                <div style={{ fontSize: 12, color: sel ? '#CBD5E1' : '#9CA3AF', marginTop: 2 }}>{t.sub}</div>
              </div>
              {sel && <div style={{ color: GOLD, fontSize: 18, fontWeight: 900 }}>✓</div>}
            </div>
          );
        })}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div>
          <FieldLabel>{p.viewedLabel}</FieldLabel>
          <YesNoToggle value={data.viewedProperties} onChange={v => update({ viewedProperties: v })} yesLabel={lang.yes} noLabel={lang.no} />
        </div>
        <div>
          <FieldLabel>{p.brokersLabel}</FieldLabel>
          <YesNoToggle value={data.otherBrokers} onChange={v => update({ otherBrokers: v })} yesLabel={lang.yes} noLabel={lang.no} />
        </div>
      </div>

      <NextBtn onClick={onNext} disabled={!data.timeline} label={lang.next} />
    </div>
  );
}
