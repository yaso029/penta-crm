import { useState, useEffect } from 'react';
import api from '../../api';

const GOLD = '#C9A84C';
const NAVY = '#0A2342';
const BORDER = '#E2E8F0';

// ─── Shared primitives ─────────────────────────────────────────────────────

function OptionCard({ icon, label, desc, selected, onClick, wide }) {
  return (
    <div
      onClick={onClick}
      style={{
        border: `2px solid ${selected ? NAVY : BORDER}`,
        borderRadius: 14,
        padding: wide ? '16px 20px' : '20px 16px',
        background: selected ? NAVY : '#fff',
        cursor: 'pointer',
        transition: 'all 0.15s',
        display: 'flex',
        flexDirection: wide ? 'row' : 'column',
        alignItems: wide ? 'center' : 'flex-start',
        gap: wide ? 14 : 8,
        position: 'relative',
      }}
    >
      {icon && <div style={{ fontSize: wide ? 22 : 28, flexShrink: 0 }}>{icon}</div>}
      <div>
        <div style={{ fontSize: 15, fontWeight: 700, color: selected ? '#fff' : NAVY }}>{label}</div>
        {desc && <div style={{ fontSize: 12, color: selected ? 'rgba(255,255,255,0.65)' : '#888', marginTop: 3, lineHeight: 1.4 }}>{desc}</div>}
      </div>
      {selected && (
        <div style={{ position: 'absolute', top: 10, right: 12, color: GOLD, fontSize: 18, fontWeight: 900 }}>✓</div>
      )}
    </div>
  );
}

function PillBtn({ label, selected, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '10px 20px', borderRadius: 100,
        border: `2px solid ${selected ? NAVY : BORDER}`,
        background: selected ? NAVY : '#fff',
        color: selected ? '#fff' : NAVY,
        fontSize: 14, fontWeight: 600, cursor: 'pointer',
        transition: 'all 0.15s', fontFamily: 'inherit',
      }}
    >
      {label}
    </button>
  );
}

function StepTitle({ title, subtitle }) {
  return (
    <div style={{ marginBottom: 28 }}>
      <h2 style={{ fontSize: 24, fontWeight: 800, color: NAVY, margin: '0 0 6px', lineHeight: 1.2 }}>{title}</h2>
      {subtitle && <p style={{ color: '#888', margin: 0, fontSize: 14, lineHeight: 1.6 }}>{subtitle}</p>}
    </div>
  );
}

function NavBtns({ onBack, onNext, nextLabel = 'Continue →', nextDisabled, step }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 36 }}>
      {step > 1
        ? <button onClick={onBack} style={{ background: 'none', border: 'none', color: '#888', fontSize: 14, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600 }}>← Back</button>
        : <div />
      }
      <button
        onClick={onNext}
        disabled={nextDisabled}
        style={{
          padding: '13px 36px', borderRadius: 10, border: 'none',
          background: nextDisabled ? '#E5E7EB' : GOLD,
          color: nextDisabled ? '#9CA3AF' : NAVY,
          fontSize: 15, fontWeight: 800, cursor: nextDisabled ? 'not-allowed' : 'pointer',
          fontFamily: 'inherit',
        }}
      >
        {nextLabel}
      </button>
    </div>
  );
}

// ─── Steps ─────────────────────────────────────────────────────────────────

const DUBAI_AREAS = [
  'Downtown Dubai', 'Business Bay', 'Dubai Marina', 'Palm Jumeirah',
  'Jumeirah Village Circle', 'Dubai Hills Estate', 'Arabian Ranches',
  'DAMAC Hills', 'Jumeirah Lake Towers', 'Meydan', 'Dubai Creek Harbour',
  'Emaar Beachfront', 'Sobha Hartland', 'MBR City', 'Dubai South',
  'Jumeirah', 'Al Barsha', 'Dubai Silicon Oasis', 'International City',
  'Discovery Gardens', 'Dubai Sports City', 'Town Square',
];

const FEATURES = [
  '🏊 Pool', '💪 Gym', '🌊 Sea View', '🏙️ City View', '🅿️ Parking',
  '🌿 Garden', '🧹 Maid\'s Room', '🏠 Storage', '🐾 Pet Friendly',
  '🏫 School Nearby', '🛍️ Mall Nearby', '🏥 Hospital Nearby',
];

const BUDGET_OPTIONS = [
  { label: 'Under AED 1M', value: 'Under AED 1,000,000' },
  { label: 'AED 1M – 2M', value: 'AED 1,000,000 – 2,000,000' },
  { label: 'AED 2M – 3M', value: 'AED 2,000,000 – 3,000,000' },
  { label: 'AED 3M – 5M', value: 'AED 3,000,000 – 5,000,000' },
  { label: 'AED 5M – 10M', value: 'AED 5,000,000 – 10,000,000' },
  { label: 'AED 10M+', value: 'Above AED 10,000,000' },
];

function Step1Purpose({ data, update, onNext, onBack, step }) {
  return (
    <div>
      <StepTitle title="What's the purpose?" subtitle="This helps us tailor the property options to your goals." />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 8 }}>
        <OptionCard icon="📈" label="Investment" desc="Rental income or capital growth" selected={data.purpose === 'investment'} onClick={() => update({ purpose: 'investment', investmentGoal: null, residenceType: null })} />
        <OptionCard icon="🏠" label="Personal Use" desc="To live in or as a holiday home" selected={data.purpose === 'end_user'} onClick={() => update({ purpose: 'end_user', investmentGoal: null, residenceType: null })} />
      </div>
      {data.purpose === 'investment' && (
        <div style={{ marginTop: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#555', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 }}>Investment goal</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <OptionCard wide icon="💰" label="Rental Yield" desc="Monthly rental income" selected={data.investmentGoal === 'rental_yield'} onClick={() => update({ investmentGoal: 'rental_yield' })} />
            <OptionCard wide icon="📊" label="Capital Growth" desc="Long-term appreciation" selected={data.investmentGoal === 'capital'} onClick={() => update({ investmentGoal: 'capital' })} />
          </div>
        </div>
      )}
      {data.purpose === 'end_user' && (
        <div style={{ marginTop: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#555', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 }}>Type of residence</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <OptionCard wide icon="🏡" label="Primary Home" desc="Main residence" selected={data.residenceType === 'primary'} onClick={() => update({ residenceType: 'primary' })} />
            <OptionCard wide icon="🌴" label="Holiday Home" desc="Vacation or weekend use" selected={data.residenceType === 'holiday'} onClick={() => update({ residenceType: 'holiday' })} />
          </div>
        </div>
      )}
      <NavBtns onBack={onBack} onNext={onNext} step={step} nextDisabled={!data.purpose} />
    </div>
  );
}

function Step2PropertyType({ data, update, onNext, onBack, step }) {
  const toggle = (t) => {
    const cur = data.propertyTypes || [];
    update({ propertyTypes: cur.includes(t) ? cur.filter(x => x !== t) : [...cur, t] });
  };
  const types = [
    { icon: '🏢', label: 'Apartment', key: 'apartment' },
    { icon: '🏠', label: 'Villa', key: 'villa' },
    { icon: '🏘️', label: 'Townhouse', key: 'townhouse' },
    { icon: '🌟', label: 'Penthouse', key: 'penthouse' },
    { icon: '🏗️', label: 'Off-Plan Unit', key: 'offplan' },
    { icon: '🏬', label: 'Commercial', key: 'commercial' },
  ];
  return (
    <div>
      <StepTitle title="Property type?" subtitle="Select all that apply." />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
        {types.map(t => (
          <OptionCard key={t.key} icon={t.icon} label={t.label} selected={(data.propertyTypes || []).includes(t.key)} onClick={() => toggle(t.key)} />
        ))}
      </div>
      <NavBtns onBack={onBack} onNext={onNext} step={step} nextDisabled={!(data.propertyTypes || []).length} />
    </div>
  );
}

function Step3Bedrooms({ data, update, onNext, onBack, step }) {
  const beds = ['Studio', '1', '2', '3', '4', '5+'];
  return (
    <div>
      <StepTitle title="How many bedrooms?" subtitle="Choose the size that fits." />
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
        {beds.map(b => (
          <PillBtn key={b} label={b === 'Studio' ? 'Studio' : `${b} BR`} selected={data.bedrooms === b} onClick={() => update({ bedrooms: b })} />
        ))}
      </div>
      <NavBtns onBack={onBack} onNext={onNext} step={step} nextDisabled={!data.bedrooms} />
    </div>
  );
}

function Step4Areas({ data, update, onNext, onBack, step }) {
  const toggle = (a) => {
    const cur = data.areas || [];
    update({ areas: cur.includes(a) ? cur.filter(x => x !== a) : [...cur, a] });
  };
  return (
    <div>
      <StepTitle title="Preferred areas?" subtitle="Pick all the communities you like. You can always say 'open to suggestions'." />
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
        {DUBAI_AREAS.map(a => (
          <PillBtn key={a} label={a} selected={(data.areas || []).includes(a)} onClick={() => toggle(a)} />
        ))}
      </div>
      <PillBtn label="Open to suggestions" selected={(data.areas || []).includes('Open to suggestions')} onClick={() => update({ areas: ['Open to suggestions'] })} />
      <NavBtns onBack={onBack} onNext={onNext} step={step} nextDisabled={!(data.areas || []).length} />
    </div>
  );
}

function Step5Market({ data, update, onNext, onBack, step }) {
  return (
    <div>
      <StepTitle title="Off-plan or ready?" subtitle="Off-plan projects often have better payment plans. Ready homes you can move into immediately." />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <OptionCard wide icon="🏗️" label="Off-Plan" desc="New developments, buy before completion — often 10–20% down" selected={data.marketPreference === 'offplan'} onClick={() => update({ marketPreference: 'offplan' })} />
        <OptionCard wide icon="🔑" label="Ready / Secondary" desc="Move-in ready or resale properties" selected={data.marketPreference === 'ready'} onClick={() => update({ marketPreference: 'ready' })} />
        <OptionCard wide icon="🔄" label="Open to Both" desc="Show me the best options across both markets" selected={data.marketPreference === 'both'} onClick={() => update({ marketPreference: 'both' })} />
      </div>
      <NavBtns onBack={onBack} onNext={onNext} step={step} nextDisabled={!data.marketPreference} />
    </div>
  );
}

function Step6Budget({ data, update, onNext, onBack, step }) {
  return (
    <div>
      <StepTitle title="What's your budget?" subtitle="Select a range — you can adjust later." />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        {BUDGET_OPTIONS.map(b => (
          <OptionCard wide key={b.value} label={b.label} selected={data.budget === b.value} onClick={() => update({ budget: b.value })} />
        ))}
      </div>
      <NavBtns onBack={onBack} onNext={onNext} step={step} nextDisabled={!data.budget} />
    </div>
  );
}

function Step7Payment({ data, update, onNext, onBack, step }) {
  const opts = [
    { icon: '💵', key: 'cash', label: 'Cash Buyer', desc: 'Full payment, fast closing' },
    { icon: '🏦', key: 'mortgage', label: 'Mortgage', desc: 'Bank-financed purchase' },
    { icon: '📅', key: 'payment_plan', label: 'Developer Plan', desc: 'Off-plan installment schedule' },
    { icon: '🤷', key: 'unsure', label: 'Not Sure Yet', desc: "I'll decide later" },
  ];
  return (
    <div>
      <StepTitle title="How will you pay?" />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        {opts.map(o => (
          <OptionCard key={o.key} icon={o.icon} label={o.label} desc={o.desc} selected={data.paymentMethod === o.key} onClick={() => update({ paymentMethod: o.key })} />
        ))}
      </div>
      <NavBtns onBack={onBack} onNext={onNext} step={step} nextDisabled={!data.paymentMethod} />
    </div>
  );
}

function Step8Features({ data, update, onNext, onBack, step }) {
  const toggle = (f) => {
    const cur = data.features || [];
    update({ features: cur.includes(f) ? cur.filter(x => x !== f) : [...cur, f] });
  };
  return (
    <div>
      <StepTitle title="Must-have features?" subtitle="Select anything that's important to you — skip if no preference." />
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {FEATURES.map(f => (
          <PillBtn key={f} label={f} selected={(data.features || []).includes(f)} onClick={() => toggle(f)} />
        ))}
      </div>
      <NavBtns onBack={onBack} onNext={onNext} step={step} />
    </div>
  );
}

function Step9Timeline({ data, update, onNext, onBack, step }) {
  const opts = [
    { key: 'immediate', label: '⚡ Immediately' },
    { key: '3months', label: '📅 Within 3 months' },
    { key: '6months', label: '🗓️ Within 6 months' },
    { key: '1year', label: '📆 Within 1 year' },
    { key: 'exploring', label: '👀 Just exploring' },
  ];
  return (
    <div>
      <StepTitle title="When are you looking to buy?" />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {opts.map(o => (
          <OptionCard wide key={o.key} label={o.label} selected={data.timeline === o.key} onClick={() => update({ timeline: o.key })} />
        ))}
      </div>
      <NavBtns onBack={onBack} onNext={onNext} step={step} nextDisabled={!data.timeline} />
    </div>
  );
}

function Step10Contact({ data, update, onNext, onBack, step }) {
  const inputStyle = {
    width: '100%', padding: '13px 14px', borderRadius: 10, fontSize: 15,
    border: `1.5px solid ${BORDER}`, outline: 'none', background: '#f8fafc',
    boxSizing: 'border-box', fontFamily: 'inherit', marginTop: 6,
  };
  return (
    <div>
      <StepTitle title="Almost done!" subtitle="Just a few contact details so your agent can follow up." />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div>
          <label style={{ fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.8 }}>Full Name *</label>
          <input value={data.clientName || ''} onChange={e => update({ clientName: e.target.value })} placeholder="e.g. Ahmed Al Mansoori" style={inputStyle} autoFocus />
        </div>
        <div>
          <label style={{ fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.8 }}>Phone / WhatsApp *</label>
          <input value={data.clientPhone || ''} onChange={e => update({ clientPhone: e.target.value })} placeholder="+971 50 123 4567" style={inputStyle} />
        </div>
        <div>
          <label style={{ fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.8 }}>Email</label>
          <input value={data.clientEmail || ''} onChange={e => update({ clientEmail: e.target.value })} placeholder="client@example.com" type="email" style={inputStyle} />
        </div>
      </div>
      <NavBtns onBack={onBack} onNext={onNext} nextLabel="Review →" step={step} nextDisabled={!data.clientName?.trim() || !data.clientPhone?.trim()} />
    </div>
  );
}

function ReviewRow({ label, value }) {
  if (!value) return null;
  return (
    <div style={{ display: 'flex', gap: 10, padding: '7px 0', borderBottom: `1px solid ${BORDER}` }}>
      <span style={{ fontSize: 12, color: '#888', width: 130, flexShrink: 0, textTransform: 'uppercase', letterSpacing: 0.4, paddingTop: 1 }}>{label}</span>
      <span style={{ fontSize: 14, fontWeight: 600, color: NAVY }}>{value}</span>
    </div>
  );
}

function Step11Review({ data, onBack, onSubmit, submitting, step }) {
  return (
    <div>
      <StepTitle title="Review & Submit" subtitle="Everything look right? Hit submit and your agent will be notified." />
      <div style={{ background: '#f8fafc', borderRadius: 12, padding: '16px 20px', marginBottom: 24, border: `1px solid ${BORDER}` }}>
        <ReviewRow label="Name" value={data.clientName} />
        <ReviewRow label="Phone" value={data.clientPhone} />
        <ReviewRow label="Email" value={data.clientEmail} />
        <ReviewRow label="Purpose" value={data.purpose === 'investment' ? `Investment${data.investmentGoal ? ` — ${data.investmentGoal === 'rental_yield' ? 'Rental Yield' : 'Capital Growth'}` : ''}` : data.purpose === 'end_user' ? `Personal — ${data.residenceType === 'primary' ? 'Primary Home' : 'Holiday Home'}` : null} />
        <ReviewRow label="Property Type" value={(data.propertyTypes || []).join(', ')} />
        <ReviewRow label="Bedrooms" value={data.bedrooms === '1' ? '1 BR' : data.bedrooms === 'Studio' ? 'Studio' : data.bedrooms ? `${data.bedrooms} BR` : null} />
        <ReviewRow label="Areas" value={(data.areas || []).join(', ')} />
        <ReviewRow label="Market" value={data.marketPreference === 'offplan' ? 'Off-Plan' : data.marketPreference === 'ready' ? 'Ready / Secondary' : data.marketPreference === 'both' ? 'Open to Both' : null} />
        <ReviewRow label="Budget" value={data.budget} />
        <ReviewRow label="Payment" value={data.paymentMethod === 'cash' ? 'Cash' : data.paymentMethod === 'mortgage' ? 'Mortgage' : data.paymentMethod === 'payment_plan' ? 'Developer Plan' : data.paymentMethod === 'unsure' ? 'Not Sure Yet' : null} />
        <ReviewRow label="Features" value={(data.features || []).join(', ') || null} />
        <ReviewRow label="Timeline" value={({ immediate: 'Immediately', '3months': 'Within 3 months', '6months': 'Within 6 months', '1year': 'Within 1 year', exploring: 'Just exploring' })[data.timeline]} />
      </div>
      <div style={{ display: 'flex', gap: 12, justifyContent: 'space-between' }}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', color: '#888', fontSize: 14, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600 }}>← Back</button>
        <button
          onClick={onSubmit}
          disabled={submitting}
          style={{
            padding: '14px 40px', borderRadius: 10, border: 'none',
            background: submitting ? '#E5E7EB' : GOLD,
            color: submitting ? '#9CA3AF' : NAVY,
            fontSize: 16, fontWeight: 800, cursor: submitting ? 'not-allowed' : 'pointer',
            fontFamily: 'inherit',
          }}
        >
          {submitting ? '⏳ Saving…' : '✓ Submit Intake'}
        </button>
      </div>
    </div>
  );
}

// ─── Intake wizard wrapper ──────────────────────────────────────────────────

const TOTAL_STEPS = 11;

const EMPTY = {
  purpose: null, investmentGoal: null, residenceType: null,
  propertyTypes: [], bedrooms: null, areas: [],
  marketPreference: null, budget: null, paymentMethod: null,
  features: [], timeline: null,
  clientName: '', clientPhone: '', clientEmail: '',
};

function IntakeWizard({ onDone, onCancel }) {
  const [step, setStep] = useState(1);
  const [data, setData] = useState(EMPTY);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const update = (fields) => setData(p => ({ ...p, ...fields }));
  const next = () => setStep(s => Math.min(s + 1, TOTAL_STEPS));
  const back = () => setStep(s => Math.max(1, s - 1));
  const pct = Math.round((step / TOTAL_STEPS) * 100);

  const handleSubmit = async () => {
    setSubmitting(true); setError(null);
    try {
      await api.post('/api/ai/intake/form-submit', {
        client_name: data.clientName,
        client_phone: data.clientPhone,
        client_email: data.clientEmail,
        purchase_purpose: data.purpose,
        property_type: (data.propertyTypes || []).join(', ') || null,
        bedrooms: data.bedrooms,
        preferred_areas: (data.areas || []).join(', ') || null,
        market_preference: data.marketPreference,
        budget_aed: data.budget,
        payment_method: data.paymentMethod,
        timeline: data.timeline,
        features: (data.features || []).join(', ') || null,
      });
      onDone();
    } catch {
      setError('Failed to save — please try again');
      setSubmitting(false);
    }
  };

  const stepProps = { data, update, onNext: next, onBack: back, step };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <div style={{ padding: '16px 28px 0', borderBottom: `1px solid ${BORDER}`, background: '#fff' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#94a3b8' }}>
            {step < TOTAL_STEPS ? `Step ${step} of ${TOTAL_STEPS - 1}` : '✓ Review'}
          </div>
          <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
            <span style={{ fontSize: 13, fontWeight: 800, color: GOLD }}>{pct}%</span>
            <button onClick={onCancel} style={{ background: 'none', border: 'none', color: '#aaa', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>✕ Cancel</button>
          </div>
        </div>
        <div style={{ height: 4, background: '#F1F5F9', borderRadius: 2, marginBottom: 16 }}>
          <div style={{ height: '100%', width: `${pct}%`, background: `linear-gradient(90deg, ${GOLD}, #E8C15A)`, borderRadius: 2, transition: 'width 0.35s ease' }} />
        </div>
      </div>

      {/* Step content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '28px 32px' }}>
        <div key={step} style={{ animation: 'fadeSlide 0.25s ease' }}>
          {step === 1 && <Step1Purpose {...stepProps} />}
          {step === 2 && <Step2PropertyType {...stepProps} />}
          {step === 3 && <Step3Bedrooms {...stepProps} />}
          {step === 4 && <Step4Areas {...stepProps} />}
          {step === 5 && <Step5Market {...stepProps} />}
          {step === 6 && <Step6Budget {...stepProps} />}
          {step === 7 && <Step7Payment {...stepProps} />}
          {step === 8 && <Step8Features {...stepProps} />}
          {step === 9 && <Step9Timeline {...stepProps} />}
          {step === 10 && <Step10Contact {...stepProps} />}
          {step === 11 && <Step11Review data={data} onBack={back} onSubmit={handleSubmit} submitting={submitting} step={step} />}
        </div>
        {error && <div style={{ marginTop: 12, color: '#dc2626', fontSize: 13, textAlign: 'center' }}>{error}</div>}
      </div>

      <style>{`
        @keyframes fadeSlide {
          from { opacity: 0; transform: translateX(16px); }
          to   { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </div>
  );
}

// ─── Session list card ──────────────────────────────────────────────────────

function SessionCard({ s, onReport }) {
  return (
    <div style={{
      background: '#fff', borderRadius: 10, padding: '14px 16px',
      border: `1px solid ${BORDER}`, marginBottom: 8,
      borderLeft: `3px solid ${s.completed ? '#059669' : GOLD}`,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontWeight: 700, color: NAVY, fontSize: 14 }}>{s.client_name || 'Unnamed'}</div>
          <div style={{ fontSize: 12, color: '#888', marginTop: 2 }}>
            {[s.client_phone, s.budget_aed, s.property_type].filter(Boolean).join(' · ')}
          </div>
          <div style={{ fontSize: 11, color: '#aaa', marginTop: 3 }}>
            {s.preferred_areas && `📍 ${s.preferred_areas}`}
          </div>
          <div style={{ fontSize: 11, color: '#bbb', marginTop: 3 }}>
            {s.created_at ? new Date(s.created_at).toLocaleString() : ''}
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 5, alignItems: 'flex-end' }}>
          <span style={{
            padding: '2px 8px', borderRadius: 20, fontSize: 10, fontWeight: 800,
            textTransform: 'uppercase', letterSpacing: 0.8,
            background: s.completed ? '#d1fae5' : '#fef3c7',
            color: s.completed ? '#065f46' : '#92400e',
          }}>{s.completed ? 'Done' : 'Active'}</span>
          {s.completed && (
            <button
              onClick={() => onReport(s.session_id)}
              style={{ padding: '3px 10px', borderRadius: 6, border: `1px solid ${NAVY}`, background: NAVY, color: '#fff', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}
            >
              PDF
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main page ──────────────────────────────────────────────────────────────

export default function IntakeAI() {
  const [sessions, setSessions] = useState([]);
  const [showWizard, setShowWizard] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchSessions = () => {
    setLoading(true);
    api.get('/api/ai/intake/sessions').then(r => setSessions(r.data)).finally(() => setLoading(false));
  };

  useEffect(() => { fetchSessions(); }, []);

  const downloadReport = async (sessionId) => {
    try {
      const r = await api.post(`/api/ai/intake/${sessionId}/report`, {}, { responseType: 'blob' });
      const url = URL.createObjectURL(new Blob([r.data], { type: 'application/pdf' }));
      const a = document.createElement('a');
      a.href = url; a.download = `intake_${sessionId.slice(0, 8)}.pdf`; a.click();
      URL.revokeObjectURL(url);
    } catch { alert('Failed to generate report'); }
  };

  const handleDone = () => {
    setShowWizard(false);
    fetchSessions();
  };

  if (showWizard) {
    return (
      <div style={{ background: '#fff', borderRadius: 14, border: `1px solid ${BORDER}`, height: 'calc(100vh - 120px)', overflow: 'hidden' }}>
        <IntakeWizard onDone={handleDone} onCancel={() => setShowWizard(false)} />
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 800, color: NAVY }}>Intake AI</div>
          <div style={{ fontSize: 13, color: '#888', marginTop: 2 }}>Capture client requirements — completed sessions go straight to Client Reports</div>
        </div>
        <button
          onClick={() => setShowWizard(true)}
          style={{
            padding: '11px 24px', borderRadius: 10, border: 'none',
            background: GOLD, color: NAVY, fontWeight: 800, fontSize: 14, cursor: 'pointer',
          }}
        >
          + New Intake
        </button>
      </div>

      {loading ? (
        <div style={{ color: '#aaa', fontSize: 13 }}>Loading…</div>
      ) : sessions.length === 0 ? (
        <div style={{ background: '#fff', borderRadius: 14, border: `1px dashed ${BORDER}`, padding: 48, textAlign: 'center', color: '#bbb' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>📋</div>
          <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>No intake sessions yet</div>
          <div style={{ fontSize: 13 }}>Click "+ New Intake" to start capturing client requirements</div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 10 }}>
          {sessions.map(s => (
            <SessionCard key={s.session_id} s={s} onReport={downloadReport} />
          ))}
        </div>
      )}
    </div>
  );
}
