import { NAVY, BORDER, BackBtn, NextBtn, StepTitle } from './ui';
import { T } from './translations';

export default function NotesStep({ data, update, onNext, onBack, language = 'en' }) {
  const lang = T[language] || T.en;
  const p = lang.notes;

  return (
    <div style={{ maxWidth: 560, margin: '0 auto' }}>
      <BackBtn onClick={onBack} label={lang.back} />
      <StepTitle title={p.title} subtitle={p.subtitle} />

      <textarea
        value={data.additionalNotes}
        onChange={e => update({ additionalNotes: e.target.value })}
        placeholder={p.placeholder}
        rows={6}
        style={{
          width: '100%', padding: '14px 16px',
          border: `1.5px solid ${BORDER}`,
          borderRadius: 12, resize: 'vertical',
          fontSize: 14, color: NAVY, lineHeight: 1.65,
          outline: 'none', boxSizing: 'border-box',
          fontFamily: 'inherit', background: '#fff',
        }}
        onFocus={e => { e.target.style.borderColor = '#C9A84C'; }}
        onBlur={e => { e.target.style.borderColor = BORDER; }}
      />

      <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 8 }}>
        {p.optional}
      </div>

      <NextBtn onClick={onNext} label={p.nextLabel} />
    </div>
  );
}
