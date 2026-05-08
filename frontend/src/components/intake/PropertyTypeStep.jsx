import { BackBtn, NextBtn, StepTitle, ToggleCard } from './ui';
import { T } from './translations';

export default function PropertyTypeStep({ data, update, onNext, onBack, language = 'en' }) {
  const lang = T[language] || T.en;
  const p = lang.propertyType;

  const TYPES = [
    { value: 'apartment', icon: '🏢', label: p.apartment, description: p.apartmentDesc },
    { value: 'villa', icon: '🏡', label: p.villa, description: p.villaDesc },
    { value: 'townhouse', icon: '🏘️', label: p.townhouse, description: p.townhouseDesc },
    { value: 'penthouse', icon: '👑', label: p.penthouse, description: p.penthouseDesc },
  ];

  function toggle(val) {
    const current = data.propertyTypes;
    update({
      propertyTypes: current.includes(val) ? current.filter(t => t !== val) : [...current, val],
    });
  }

  return (
    <div style={{ maxWidth: 580, margin: '0 auto' }}>
      <BackBtn onClick={onBack} label={lang.back} />
      <StepTitle title={p.title} subtitle={p.subtitle} />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {TYPES.map(t => (
          <ToggleCard
            key={t.value}
            icon={t.icon}
            label={t.label}
            description={t.description}
            selected={data.propertyTypes.includes(t.value)}
            onClick={() => toggle(t.value)}
          />
        ))}
      </div>

      <NextBtn onClick={onNext} disabled={data.propertyTypes.length === 0} label={lang.next} />
    </div>
  );
}
