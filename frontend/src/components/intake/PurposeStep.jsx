import { NAVY, BackBtn, NextBtn, StepTitle, ToggleCard } from './ui';
import { T } from './translations';

export default function PurposeStep({ data, update, onNext, onBack, language = 'en' }) {
  const lang = T[language] || T.en;
  const p = lang.purpose;

  const canProceed = data.purpose &&
    (data.purpose === 'investment' ? !!data.investmentGoal : !!data.residenceType);

  const purposeOpts = [
    { value: 'investment', icon: '📈', label: p.investment, description: p.investmentDesc },
    { value: 'end_user', icon: '🏠', label: p.endUser, description: p.endUserDesc },
  ];

  const investmentOpts = [
    { value: 'rental_yield', icon: '🔑', label: p.rentalYield, description: p.rentalYieldDesc },
    { value: 'capital', icon: '📊', label: p.capital, description: p.capitalDesc },
    { value: 'both', icon: '⭐', label: p.both, description: p.bothDesc },
  ];

  const residenceOpts = [
    { value: 'primary', icon: '🏡', label: p.primary, description: p.primaryDesc },
    { value: 'holiday', icon: '☀️', label: p.holiday, description: p.holidayDesc },
  ];

  return (
    <div style={{ maxWidth: 620, margin: '0 auto' }}>
      <BackBtn onClick={onBack} label={lang.back} />
      <StepTitle title={p.title} subtitle={p.subtitle} />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 32 }}>
        {purposeOpts.map(opt => (
          <ToggleCard
            key={opt.value}
            icon={opt.icon}
            label={opt.label}
            description={opt.description}
            selected={data.purpose === opt.value}
            onClick={() => update({ purpose: opt.value, investmentGoal: null, residenceType: null })}
          />
        ))}
      </div>

      {data.purpose === 'investment' && (
        <div style={{ animation: 'fadeUp 0.25s ease' }}>
          <p style={{ fontSize: 14, fontWeight: 600, color: NAVY, marginBottom: 16 }}>{p.goalLabel}</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
            {investmentOpts.map(opt => (
              <ToggleCard
                key={opt.value}
                icon={opt.icon}
                label={opt.label}
                description={opt.description}
                selected={data.investmentGoal === opt.value}
                onClick={() => update({ investmentGoal: opt.value })}
                small
              />
            ))}
          </div>
        </div>
      )}

      {data.purpose === 'end_user' && (
        <div style={{ animation: 'fadeUp 0.25s ease' }}>
          <p style={{ fontSize: 14, fontWeight: 600, color: NAVY, marginBottom: 16 }}>{p.residenceLabel}</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            {residenceOpts.map(opt => (
              <ToggleCard
                key={opt.value}
                icon={opt.icon}
                label={opt.label}
                description={opt.description}
                selected={data.residenceType === opt.value}
                onClick={() => update({ residenceType: opt.value })}
              />
            ))}
          </div>
        </div>
      )}

      <NextBtn onClick={onNext} disabled={!canProceed} label={lang.next} />
      <style>{`@keyframes fadeUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }`}</style>
    </div>
  );
}
