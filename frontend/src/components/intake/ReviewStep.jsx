import { NAVY, GOLD, BORDER, formatBudget } from './ui';
import { T } from './translations';

function Section({ title, step, onEdit, editLabel, children }) {
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
        }}>{editLabel}</button>
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

export default function ReviewStep({ data, onGoTo, onGenerate, generating, language = 'en' }) {
  const lang = T[language] || T.en;
  const r = lang.review;
  const isAr = language === 'ar';

  return (
    <div style={{ maxWidth: 620, margin: '0 auto' }}>
      <div style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 26, fontWeight: 800, color: NAVY, margin: '0 0 8px' }}>{r.heading}</h2>
        <p style={{ fontSize: 15, color: '#6B7280', margin: 0 }}>{r.subheading}</p>
      </div>

      <Section title={r.purchasePurpose} step={1} onEdit={onGoTo} editLabel={r.edit}>
        <Row label={r.purpose} value={r.purposeLabels[data.purpose]} />
        {data.purpose === 'investment' && <Row label={r.investmentGoal} value={r.goalLabels[data.investmentGoal]} />}
        {data.purpose === 'end_user' && <Row label={r.residenceType} value={r.residenceLabels[data.residenceType]} />}
      </Section>

      <Section title={r.propertyRequirements} step={2} onEdit={onGoTo} editLabel={r.edit}>
        <Row label={r.propertyTypes} value={data.propertyTypes.map(t => t.charAt(0).toUpperCase() + t.slice(1)).join(', ')} />
        <Row label={r.bedrooms} value={data.bedrooms} />
        <Row label={r.preferredAreas} value={data.areas.join(', ')} />
        <Row label={r.market} value={r.marketLabels[data.marketPreference]} />
      </Section>

      <Section title={r.budget} step={6} onEdit={onGoTo} editLabel={r.edit}>
        <Row label={r.budgetRange} value={`${formatBudget(data.budgetMin)} — ${formatBudget(data.budgetMax)}`} />
      </Section>

      <Section title={r.paymentMethod} step={7} onEdit={onGoTo} editLabel={r.edit}>
        <Row label={r.payment} value={r.paymentLabels[data.paymentMethod]} />
        {data.paymentMethod === 'mortgage' && (
          <>
            <Row label={r.employmentStatus} value={data.employmentStatus} />
            <Row label={r.monthlyIncome} value={data.monthlyIncome ? `AED ${data.monthlyIncome}` : null} />
            <Row label={r.monthlyLiabilities} value={data.monthlyLiabilities ? `AED ${data.monthlyLiabilities}` : null} />
            <Row label={r.preapproved} value={data.mortgagePreapproved === true ? lang.yes : data.mortgagePreapproved === false ? lang.no : null} />
            <Row label={r.preapprovalAmount} value={data.preapprovalAmount} />
          </>
        )}
        {data.paymentMethod === 'payment_plan' && <Row label={r.downPayment} value={data.downPaymentPct} />}
      </Section>

      {data.features.length > 0 && (
        <Section title={r.mustHaveFeatures} step={8} onEdit={onGoTo} editLabel={r.edit}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {data.features.map(f => (
              <span key={f} style={{
                padding: '4px 12px', borderRadius: 100,
                background: '#F1F5F9', color: NAVY, fontSize: 12, fontWeight: 600,
              }}>
                {f.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </span>
            ))}
          </div>
        </Section>
      )}

      <Section title={r.timeline} step={9} onEdit={onGoTo} editLabel={r.edit}>
        <Row label={r.timeline} value={r.timelineLabels[data.timeline]} />
        <Row label={r.viewedProperties} value={data.viewedProperties === true ? lang.yes : data.viewedProperties === false ? lang.no : null} />
        <Row label={r.otherBrokers} value={data.otherBrokers === true ? lang.yes : data.otherBrokers === false ? lang.no : null} />
      </Section>

      {data.additionalNotes && (
        <Section title={r.additionalNotes} step={10} onEdit={onGoTo} editLabel={r.edit}>
          <p style={{ fontSize: 14, color: NAVY, lineHeight: 1.6, margin: 0 }}>{data.additionalNotes}</p>
        </Section>
      )}

      <Section title={r.contactDetails} step={11} onEdit={onGoTo} editLabel={r.edit}>
        <Row label={r.fullName} value={data.fullName} />
        <Row label={r.whatsapp} value={data.whatsapp ? `+971 ${data.whatsapp}` : null} />
        <Row label={r.email} value={data.email} />
        <Row label={r.nationality} value={data.nationality} />
        <Row label={r.basedInDubai} value={data.inDubai === true ? lang.yes : data.inDubai === false ? lang.no : null} />
      </Section>

      <div style={{ marginTop: 40, textAlign: 'center' }}>
        <button
          onClick={onGenerate}
          disabled={generating}
          style={{
            padding: '16px 64px',
            background: generating ? '#D4B96A' : `linear-gradient(135deg, #C9A84C, #E8C15A)`,
            color: NAVY, border: 'none', borderRadius: 14,
            fontSize: 18, fontWeight: 800, cursor: generating ? 'not-allowed' : 'pointer',
            boxShadow: generating ? 'none' : '0 4px 24px rgba(201,168,76,0.45)',
            transition: 'all 0.15s', fontFamily: 'inherit',
          }}
        >
          {generating ? r.submitting : r.submit}
        </button>
      </div>
    </div>
  );
}
