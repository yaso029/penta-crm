import { useState } from 'react';
import { NAVY, GOLD, BORDER, BackBtn, NextBtn, StepTitle } from './ui';
import { T } from './translations';

const AREAS = [
  'Downtown Dubai', 'Dubai Marina', 'Palm Jumeirah', 'Business Bay',
  'JVC', 'JVT', 'Dubai Hills', 'Arabian Ranches', 'Meydan',
  'Dubai Creek Harbour', 'Emaar Beachfront', 'MBR City',
  'DIFC', 'Jumeirah', 'Al Barsha', 'Sports City', 'Motor City',
  'Dubai South', 'Damac Hills', 'Tilal Al Ghaf',
];

export default function AreasStep({ data, update, onNext, onBack, language = 'en' }) {
  const lang = T[language] || T.en;
  const p = lang.areas;
  const isAr = language === 'ar';

  const [showOtherInput, setShowOtherInput] = useState(false);
  const [otherText, setOtherText] = useState('');

  const customAreas = data.areas.filter(a => !AREAS.includes(a));

  function toggle(area) {
    update({
      areas: data.areas.includes(area) ? data.areas.filter(a => a !== area) : [...data.areas, area],
    });
  }

  function addCustom() {
    const trimmed = otherText.trim();
    if (trimmed && !data.areas.includes(trimmed)) {
      update({ areas: [...data.areas, trimmed] });
    }
    setOtherText('');
    setShowOtherInput(false);
  }

  return (
    <div style={{ maxWidth: 660, margin: '0 auto' }}>
      <BackBtn onClick={onBack} label={lang.back} />
      <StepTitle title={p.title} subtitle={p.subtitle} />

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
        {AREAS.map(area => {
          const sel = data.areas.includes(area);
          return (
            <button key={area} onClick={() => toggle(area)} style={{
              padding: '9px 18px',
              border: `2px solid ${sel ? GOLD : BORDER}`,
              borderRadius: 100,
              background: sel ? NAVY : '#fff',
              color: sel ? '#fff' : NAVY,
              fontSize: 13, fontWeight: 600, cursor: 'pointer',
              transition: 'all 0.15s', fontFamily: 'inherit',
            }}>
              {sel && '✓ '}{area}
            </button>
          );
        })}

        {/* Custom areas already added */}
        {customAreas.map(area => (
          <button key={area} onClick={() => toggle(area)} style={{
            padding: '9px 18px',
            border: `2px solid ${GOLD}`,
            borderRadius: 100,
            background: NAVY,
            color: '#fff',
            fontSize: 13, fontWeight: 600, cursor: 'pointer',
            transition: 'all 0.15s', fontFamily: 'inherit',
            display: 'flex', alignItems: 'center', gap: 6,
          }}>
            ✓ {area} <span style={{ opacity: 0.6, fontSize: 11 }}>✕</span>
          </button>
        ))}

        {/* Other button */}
        <button onClick={() => setShowOtherInput(true)} style={{
          padding: '9px 18px',
          border: `2px dashed ${BORDER}`,
          borderRadius: 100,
          background: '#fff',
          color: '#6B7280',
          fontSize: 13, fontWeight: 600, cursor: 'pointer',
          fontFamily: 'inherit',
        }}>
          + {isAr ? 'منطقة أخرى' : 'Other'}
        </button>
      </div>

      {/* Custom area input */}
      {showOtherInput && (
        <div style={{ marginTop: 20, display: 'flex', gap: 10, alignItems: 'center', animation: 'fadeUp 0.2s ease' }}>
          <input
            autoFocus
            value={otherText}
            onChange={e => setOtherText(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') addCustom(); if (e.key === 'Escape') setShowOtherInput(false); }}
            placeholder={isAr ? 'اكتب اسم المنطقة...' : 'Type area name...'}
            style={{
              flex: 1, padding: '10px 16px',
              border: `2px solid ${GOLD}`,
              borderRadius: 10, fontSize: 14, color: NAVY,
              outline: 'none', fontFamily: 'inherit',
              direction: isAr ? 'rtl' : 'ltr',
            }}
          />
          <button onClick={addCustom} style={{
            padding: '10px 20px', background: NAVY, color: '#fff',
            border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 700,
            cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap',
          }}>
            {isAr ? 'إضافة' : 'Add +'}
          </button>
          <button onClick={() => { setShowOtherInput(false); setOtherText(''); }} style={{
            padding: '10px 14px', background: 'none', color: '#9CA3AF',
            border: `1px solid ${BORDER}`, borderRadius: 10, fontSize: 13,
            cursor: 'pointer', fontFamily: 'inherit',
          }}>
            {isAr ? 'إلغاء' : 'Cancel'}
          </button>
        </div>
      )}

      {data.areas.length > 0 && (
        <div style={{ marginTop: 20, fontSize: 13, color: '#6B7280' }}>
          {p.selected(data.areas.length)}
        </div>
      )}

      <NextBtn onClick={onNext} disabled={data.areas.length === 0} label={lang.next} />
      <style>{`@keyframes fadeUp { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }`}</style>
    </div>
  );
}
