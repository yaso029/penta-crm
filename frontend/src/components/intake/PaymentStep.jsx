import { NAVY, GOLD, BORDER, BackBtn, NextBtn, StepTitle, YesNoToggle, FieldLabel, TextInput, Pill } from './ui';

const METHODS = [
  { value: 'cash',         label: 'Cash Buyer',                description: 'Full payment upfront' },
  { value: 'mortgage',     label: 'Mortgage',                  description: 'Bank financed purchase' },
  { value: 'payment_plan', label: 'Developer Payment Plan',    description: 'Off-plan installment plan' },
  { value: 'unsure',       label: 'Not Sure Yet',              description: "I'd like to explore my options" },
];

const DOWN_PAYMENTS    = ['10%', '20%', '30%', '40%', '50%+'];
const EMPLOYMENT_TYPES = ['Employed', 'Self-Employed', 'Business Owner', 'Investor / Retired'];

export default function PaymentStep({ data, update, onNext, onBack }) {
  const mortgageReady =
    data.paymentMethod === 'mortgage'
      ? data.employmentStatus && data.monthlyIncome
      : true;

  return (
    <div style={{ maxWidth: 580, margin: '0 auto' }}>
      <BackBtn onClick={onBack} />
      <StepTitle
        title="How will you finance the purchase?"
        subtitle="This helps us show you the most suitable payment options."
      />

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

      {/* Mortgage — 3 key questions */}
      {data.paymentMethod === 'mortgage' && (
        <div style={{ background: '#F8FAFC', borderRadius: 12, padding: 24, marginBottom: 20, animation: 'fadeUp 0.25s ease', display: 'flex', flexDirection: 'column', gap: 20 }}>

          <div>
            <FieldLabel>Employment status</FieldLabel>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 8 }}>
              {EMPLOYMENT_TYPES.map(e => (
                <Pill key={e} label={e} selected={data.employmentStatus === e} onClick={() => update({ employmentStatus: e })} />
              ))}
            </div>
          </div>

          <div>
            <FieldLabel>Monthly salary / income (AED)</FieldLabel>
            <TextInput
              value={data.monthlyIncome}
              onChange={v => update({ monthlyIncome: v })}
              placeholder="e.g. 35,000"
            />
          </div>

          <div>
            <FieldLabel>Existing monthly liabilities (AED) — car loans, credit cards, other loans</FieldLabel>
            <TextInput
              value={data.monthlyLiabilities}
              onChange={v => update({ monthlyLiabilities: v })}
              placeholder="e.g. 5,000 — enter 0 if none"
            />
          </div>

          <div>
            <FieldLabel>Are you already pre-approved for a mortgage?</FieldLabel>
            <YesNoToggle value={data.mortgagePreapproved} onChange={v => update({ mortgagePreapproved: v })} />
          </div>

          {data.mortgagePreapproved && (
            <div>
              <FieldLabel>Pre-approval amount (AED)</FieldLabel>
              <TextInput
                value={data.preapprovalAmount}
                onChange={v => update({ preapprovalAmount: v })}
                placeholder="e.g. 2,500,000"
              />
            </div>
          )}
        </div>
      )}

      {/* Payment plan */}
      {data.paymentMethod === 'payment_plan' && (
        <div style={{ background: '#F8FAFC', borderRadius: 12, padding: 20, marginBottom: 20, animation: 'fadeUp 0.25s ease' }}>
          <FieldLabel>Down payment available</FieldLabel>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 8 }}>
            {DOWN_PAYMENTS.map(dp => (
              <Pill key={dp} label={dp} selected={data.downPaymentPct === dp} onClick={() => update({ downPaymentPct: dp })} />
            ))}
          </div>
        </div>
      )}

      <NextBtn onClick={onNext} disabled={!data.paymentMethod || !mortgageReady} />
      <style>{`@keyframes fadeUp { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }`}</style>
    </div>
  );
}
