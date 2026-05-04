import { NAVY, GOLD, BORDER, formatBudget } from './ui';

const TIMELINE_LABELS = {
  immediate: 'Immediately (within 1 month)',
  '3months': 'Within 3 months',
  '6months': 'Within 6 months',
  '1year': 'Within 1 year',
  exploring: 'Just exploring',
};

const PURPOSE_LABELS   = { investment: 'Investment', end_user: 'Personal Use' };
const GOAL_LABELS      = { rental_yield: 'Rental Yield', capital: 'Capital Appreciation', both: 'Rental Yield + Capital Appreciation' };
const RESIDENCE_LABELS = { primary: 'Primary Residence', holiday: 'Holiday Home' };
const MARKET_LABELS    = { offplan: 'Off-Plan (New Launch)', ready: 'Ready / Secondary', both: 'Open to Both' };
const PAYMENT_LABELS   = { cash: 'Cash Buyer', mortgage: 'Mortgage (Bank Financed)', payment_plan: 'Developer Payment Plan', unsure: 'Not Sure Yet' };

function Section({ title, step, onEdit, children }) {
  return (
    <div style={{ border: `1px solid ${BORDER}`, borderRadius: 14, overflow: 'hidden', marginBottom: 16 }}>
      <div style={{
        background: '#F8FAFC', padding: '12px 20px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        borderBottom: `1px solid ${BORDER}`,
      }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: NAVY, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          {title}
        </div>
        <button onClick={() => onEdit(step)} style={{
          background: 'none', border: `1px solid ${BORDER}`, borderRadius: 6,
          padding: '4px 12px', fontSize: 12, fontWeight: 600, color: '#6B7280',
          cursor: 'pointer', fontFamily: 'inherit',
        }}>Edit</button>
      </div>
      <div style={{ padding: '16px 20px' }}>{children}</div>
    </div>
  );
}

function Row({ label, value }) {
  if (!value && value !== false) return null;
  return (
    <div style={{ display: 'flex', gap: 12, marginBottom: 8 }}>
      <div style={{ fontSize: 13, color: '#6B7280', minWidth: 140, flexShrink: 0 }}>{label}</div>
      <div style={{ fontSize: 13, fontWeight: 600, color: NAVY }}>{String(value)}</div>
    </div>
  );
}

export default function ReviewStep({ data, onGoTo, onGenerate, generating }) {
  return (
    <div style={{ maxWidth: 620, margin: '0 auto' }}>
      <div style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 26, fontWeight: 800, color: NAVY, margin: '0 0 8px' }}>
          Review Your Answers
        </h2>
        <p style={{ fontSize: 15, color: '#6B7280', margin: 0 }}>
          Everything looks good? Submit and we'll be in touch shortly.
        </p>
      </div>

      <Section title="Purchase Purpose" step={1} onEdit={onGoTo}>
        <Row label="Purpose" value={PURPOSE_LABELS[data.purpose]} />
        {data.purpose === 'investment' && <Row label="Investment Goal" value={GOAL_LABELS[data.investmentGoal]} />}
        {data.purpose === 'end_user' && <Row label="Residence Type" value={RESIDENCE_LABELS[data.residenceType]} />}
      </Section>

      <Section title="Property Requirements" step={2} onEdit={onGoTo}>
        <Row label="Property Types" value={data.propertyTypes.map(t => t.charAt(0).toUpperCase() + t.slice(1)).join(', ')} />
        <Row label="Bedrooms" value={data.bedrooms} />
        <Row label="Preferred Areas" value={data.areas.join(', ')} />
        <Row label="Market" value={MARKET_LABELS[data.marketPreference]} />
      </Section>

      <Section title="Budget" step={6} onEdit={onGoTo}>
        <Row label="Budget Range" value={`${formatBudget(data.budgetMin)} — ${formatBudget(data.budgetMax)}`} />
      </Section>

      <Section title="Payment Method" step={7} onEdit={onGoTo}>
        <Row label="Payment" value={PAYMENT_LABELS[data.paymentMethod]} />
        {data.paymentMethod === 'mortgage' && (
          <>
            <Row label="Employment Status"    value={data.employmentStatus} />
            <Row label="Monthly Income"       value={data.monthlyIncome ? `AED ${data.monthlyIncome}` : null} />
            <Row label="Monthly Liabilities"  value={data.monthlyLiabilities ? `AED ${data.monthlyLiabilities}` : null} />
            <Row label="Pre-approved"         value={data.mortgagePreapproved === true ? 'Yes' : data.mortgagePreapproved === false ? 'No' : null} />
            <Row label="Pre-approval Amount"  value={data.preapprovalAmount} />
          </>
        )}
        {data.paymentMethod === 'payment_plan' && <Row label="Down Payment" value={data.downPaymentPct} />}
      </Section>

      {data.features.length > 0 && (
        <Section title="Must-Have Features" step={8} onEdit={onGoTo}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {data.features.map(f => (
              <span key={f} style={{
                padding: '4px 12px', borderRadius: 100,
                background: '#F1F5F9', color: NAVY,
                fontSize: 12, fontWeight: 600,
              }}>
                {f.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </span>
            ))}
          </div>
        </Section>
      )}

      <Section title="Timeline" step={9} onEdit={onGoTo}>
        <Row label="Timeline" value={TIMELINE_LABELS[data.timeline]} />
        <Row label="Viewed Properties" value={data.viewedProperties === true ? 'Yes' : data.viewedProperties === false ? 'No' : null} />
        <Row label="Other Brokers" value={data.otherBrokers === true ? 'Yes' : data.otherBrokers === false ? 'No' : null} />
      </Section>

      {data.additionalNotes && (
        <Section title="Additional Notes" step={10} onEdit={onGoTo}>
          <p style={{ fontSize: 14, color: NAVY, lineHeight: 1.6, margin: 0 }}>{data.additionalNotes}</p>
        </Section>
      )}

      <Section title="Contact Details" step={11} onEdit={onGoTo}>
        <Row label="Full Name" value={data.fullName} />
        <Row label="WhatsApp" value={data.whatsapp ? `+971 ${data.whatsapp}` : null} />
        <Row label="Email" value={data.email} />
        <Row label="Nationality" value={data.nationality} />
        <Row label="Based in Dubai" value={data.inDubai === true ? 'Yes' : data.inDubai === false ? 'No' : null} />
      </Section>

      <div style={{ marginTop: 40, textAlign: 'center' }}>
        <button
          onClick={onGenerate}
          disabled={generating}
          style={{
            padding: '16px 64px',
            background: generating ? '#D4B96A' : `linear-gradient(135deg, ${GOLD}, #E8C15A)`,
            color: NAVY, border: 'none', borderRadius: 14,
            fontSize: 18, fontWeight: 800, cursor: generating ? 'not-allowed' : 'pointer',
            boxShadow: generating ? 'none' : '0 4px 24px rgba(201,168,76,0.45)',
            transition: 'all 0.15s', fontFamily: 'inherit',
          }}
        >
          {generating ? 'Submitting…' : 'Submit'}
        </button>
      </div>
    </div>
  );
}
