import { NAVY, GOLD, BORDER, BackBtn, NextBtn, StepTitle, YesNoToggle, FieldLabel, TextInput, Pill } from './ui';
import { T } from './translations';

const DOWN_PAYMENTS = ['10%', '20%', '30%', '40%', '50%+'];

export default function PaymentStep({ data, update, onNext, onBack, language = 'en' }) {
  const lang = T[language] || T.en;
  const p = lang.payment;

  const METHODS = [
    { value: 'cash', label: p.cash, description: p.cashDesc },
    { value: 'mortgage', label: p.mortgage, description: p.mortgageDesc },
    { value: 'payment_plan', label: p.paymentPlan, description: p.paymentPlanDesc },
    { value: 'unsure', label: p.unsure, description: p.unsureDesc },
  ];

  const EMPLOYMENT_TYPES = [p.employed, p.selfEmployed, p.businessOwner, p.investor];

  const mortgageReady =
    data.paymentMethod === 'mortgage'
      ? data.employmentStatus && data.monthlyIncome
      : true;

  return (
    <div style={{ maxWidth: 580, margin: '0 auto' }}>
      <BackBtn onClick={onBack} label={lang.back} />
      <StepTitle title={p.title} subtitle={p.subtitle} />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 28 }}>
        {METHODS.map(m => {
          const sel = data.paymentMethod === m.value;
          return (
            <div key={m.value} onClick={() => update({ paymentMethod: m.value })} style={{
              border: `2px solid ${sel ? GOLD : BORDER}`,
              borderRadius: 12, padding: '16px 20px',
              background: sel ? NAVY : '#fff',
              cursor: 'pointer', transition: 'all 0.15s',
              display: 'flex', alignItems: 'center', gap: 14, position: 'relative',
            }}>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, color: sel ? '#fff' : NAVY }}>{m.label}</div>
                <div style={{ fontSize: 12, color: sel ? '#CBD5E1' : '#6B7280' }}>{m.description}</div>
              </div>
              {sel && <div style={{ position: 'absolute', right: 16, color: GOLD, fontSize: 18, fontWeight: 900 }}>✓</div>}
            </div>
          );
        })}
      </div>

      {data.paymentMethod === 'mortgage' && (
        <div style={{ background: '#F8FAFC', borderRadius: 12, padding: 24, marginBottom: 20, animation: 'fadeUp 0.25s ease', display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div>
            <FieldLabel>{p.employmentLabel}</FieldLabel>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 8 }}>
              {EMPLOYMENT_TYPES.map(e => (
                <Pill key={e} label={e} selected={data.employmentStatus === e} onClick={() => update({ employmentStatus: e })} />
              ))}
            </div>
          </div>

          <div>
            <FieldLabel>{p.incomeLabel}</FieldLabel>
            <TextInput value={data.monthlyIncome} onChange={v => update({ monthlyIncome: v })} placeholder={p.incomePlaceholder} />
          </div>

          <div>
            <FieldLabel>{p.liabilitiesLabel}</FieldLabel>
            <TextInput value={data.monthlyLiabilities} onChange={v => update({ monthlyLiabilities: v })} placeholder={p.liabilitiesPlaceholder} />
          </div>

          <div>
            <FieldLabel>{p.preapprovedLabel}</FieldLabel>
            <YesNoToggle value={data.mortgagePreapproved} onChange={v => update({ mortgagePreapproved: v })} yesLabel={lang.yes} noLabel={lang.no} />
          </div>

          {data.mortgagePreapproved && (
            <div>
              <FieldLabel>{p.preapprovalAmountLabel}</FieldLabel>
              <TextInput value={data.preapprovalAmount} onChange={v => update({ preapprovalAmount: v })} placeholder={p.preapprovalAmountPlaceholder} />
            </div>
          )}
        </div>
      )}

      {data.paymentMethod === 'payment_plan' && (
        <div style={{ background: '#F8FAFC', borderRadius: 12, padding: 20, marginBottom: 20, animation: 'fadeUp 0.25s ease' }}>
          <FieldLabel>{p.downPaymentLabel}</FieldLabel>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 8 }}>
            {DOWN_PAYMENTS.map(dp => (
              <Pill key={dp} label={dp} selected={data.downPaymentPct === dp} onClick={() => update({ downPaymentPct: dp })} />
            ))}
          </div>
        </div>
      )}

      <NextBtn onClick={onNext} disabled={!data.paymentMethod || !mortgageReady} label={lang.next} />
      <style>{`@keyframes fadeUp { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }`}</style>
    </div>
  );
}
