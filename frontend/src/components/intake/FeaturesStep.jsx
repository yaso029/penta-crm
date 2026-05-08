import { useState } from 'react';
import { NAVY, GOLD, BORDER, BackBtn, NextBtn, StepTitle } from './ui';
import { T } from './translations';

const BASE_FEATURES = [
  { value: 'pool', icon: '🏊', labelKey: 'pool' },
  { value: 'gym', icon: '💪', labelKey: 'gym' },
  { value: 'parking', icon: '🚗', labelKey: 'parking' },
  { value: 'sea_view', icon: '🌊', labelKey: 'seaView' },
  { value: 'burj_view', icon: '🗼', labelKey: 'burjView' },
  { value: 'garden', icon: '🌿', labelKey: 'garden' },
  { value: 'maids_room', icon: '🛏️', labelKey: 'maidsRoom' },
  { value: 'wardrobes', icon: '👔', labelKey: 'wardrobes' },
  { value: 'balcony', icon: '🌅', labelKey: 'balcony' },
  { value: 'pet_friendly', icon: '🐾', labelKey: 'petFriendly' },
  { value: 'kids_play', icon: '🎡', labelKey: 'kidsPlay' },
  { value: 'smart_home', icon: '📱', labelKey: 'smartHome' },
  { value: 'security', icon: '🔒', labelKey: 'security' },
];

const BASE_VALUES = BASE_FEATURES.map(f => f.value);

export default function FeaturesStep({ data, update, onNext, onBack, language = 'en' }) {
  const lang = T[language] || T.en;
  const p = lang.features;
  const isAr = language === 'ar';

  const [showOtherInput, setShowOtherInput] = useState(false);
  const [otherText, setOtherText] = useState('');

  const customFeatures = data.features.filter(f => !BASE_VALUES.includes(f));

  function toggle(val) {
    update({
      features: data.features.includes(val)
        ? data.features.filter(f => f !== val)
        : [...data.features, val],
    });
  }

  function addCustom() {
    const trimmed = otherText.trim();
    if (trimmed && !data.features.includes(trimmed)) {
      update({ features: [...data.features, trimmed] });
    }
    setOtherText('');
    setShowOtherInput(false);
  }

  return (
    <div style={{ maxWidth: 660, margin: '0 auto' }}>
      <BackBtn onClick={onBack} label={lang.back} />
      <StepTitle title={p.title} subtitle={p.subtitle} />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
        {BASE_FEATURES.map(f => {
          const sel = data.features.includes(f.value);
          return (
            <div key={f.value} onClick={() => toggle(f.value)} style={{
              border: `2px solid ${sel ? GOLD : BORDER}`,
              borderRadius: 12, padding: '14px 16px',
              background: sel ? NAVY : '#fff',
              cursor: 'pointer', transition: 'all 0.15s',
              display: 'flex', alignItems: 'center', gap: 10,
            }}>
              <span style={{ fontSize: 20 }}>{f.icon}</span>
              <span style={{ fontSize: 13, fontWeight: 600, color: sel ? '#fff' : NAVY, lineHeight: 1.3 }}>
                {p[f.labelKey]}
              </span>
            </div>
          );
        })}

        {/* Custom features already added */}
        {customFeatures.map(f => (
          <div key={f} onClick={() => toggle(f)} style={{
            border: `2px solid ${GOLD}`,
            borderRadius: 12, padding: '14px 16px',
            background: NAVY,
            cursor: 'pointer', transition: 'all 0.15s',
            display: 'flex', alignItems: 'center', gap: 10,
          }}>
            <span style={{ fontSize: 20 }}>✨</span>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#fff', lineHeight: 1.3, flex: 1 }}>
              {f}
            </span>
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>✕</span>
          </div>
        ))}

        {/* Other button */}
        <div onClick={() => setShowOtherInput(true)} style={{
          border: `2px dashed ${BORDER}`,
          borderRadius: 12, padding: '14px 16px',
          background: '#fff', cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <span style={{ fontSize: 20 }}>➕</span>
          <span style={{ fontSize: 13, fontWeight: 600, color: '#9CA3AF' }}>
            {isAr ? 'ميزة أخرى' : 'Other'}
          </span>
        </div>
      </div>

      {/* Custom feature input */}
      {showOtherInput && (
        <div style={{ marginTop: 20, display: 'flex', gap: 10, alignItems: 'center', animation: 'fadeUp 0.2s ease' }}>
          <input
            autoFocus
            value={otherText}
            onChange={e => setOtherText(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') addCustom(); if (e.key === 'Escape') setShowOtherInput(false); }}
            placeholder={isAr ? 'اكتب الميزة...' : 'Type feature name...'}
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

      {data.features.length > 0 && (
        <div style={{ marginTop: 16, fontSize: 13, color: '#6B7280' }}>
          {p.selected(data.features.length)}
        </div>
      )}

      <NextBtn onClick={onNext} label={lang.next} />
      <style>{`@keyframes fadeUp { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }`}</style>
    </div>
  );
}
