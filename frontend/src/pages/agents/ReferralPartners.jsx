import { useState, useEffect } from 'react';
import api from '../../api';
import { useAuth } from '../../AuthContext';
import toast from 'react-hot-toast';

const NAVY = '#0A2342';
const GOLD = '#C9A84C';

const STATUSES = [
  { value: 'interested', label: 'Interested', color: '#F59E0B', bg: '#FEF3C7' },
  { value: 'registered', label: 'Registered', color: '#3B82F6', bg: '#EFF6FF' },
  { value: 'signed_agreement', label: 'Signed Agreement', color: '#8B5CF6', bg: '#F5F3FF' },
  { value: 'start_referring', label: 'Start Referring', color: '#10B981', bg: '#ECFDF5' },
];

const NATIONALITY_LABELS = {
  AE: '🇦🇪 UAE', SA: '🇸🇦 Saudi Arabia', KW: '🇰🇼 Kuwait', QA: '🇶🇦 Qatar',
  BH: '🇧🇭 Bahrain', OM: '🇴🇲 Oman', EG: '🇪🇬 Egypt', LB: '🇱🇧 Lebanon',
  JO: '🇯🇴 Jordan', IN: '🇮🇳 India', PK: '🇵🇰 Pakistan', PH: '🇵🇭 Philippines',
  CN: '🇨🇳 China', TR: '🇹🇷 Turkey', RU: '🇷🇺 Russia', GB: '🇬🇧 UK',
  FR: '🇫🇷 France', DE: '🇩🇪 Germany', US: '🇺🇸 USA', AU: '🇦🇺 Australia',
  NG: '🇳🇬 Nigeria', OTHER: '🌍 Other',
};

function StatusBadge({ status }) {
  const s = STATUSES.find(x => x.value === status) || STATUSES[0];
  return (
    <span style={{ padding: '4px 12px', borderRadius: 100, fontSize: 11, fontWeight: 700, background: s.bg, color: s.color }}>
      {s.label}
    </span>
  );
}

function ApplicationCard({ app, onStatusChange }) {
  const [open, setOpen] = useState(false);
  const langLabel = app.language === 'ar' ? '🇦🇪 Arabic' : '🇬🇧 English';

  return (
    <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #E8ECF0', marginBottom: 12, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
      <div onClick={() => setOpen(o => !o)} style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 16, cursor: 'pointer' }}>
        <div style={{ width: 44, height: 44, borderRadius: '50%', background: `linear-gradient(135deg, ${NAVY}, #1a3a5c)`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 18, fontWeight: 700, flexShrink: 0 }}>
          {app.full_name?.[0]?.toUpperCase() || '?'}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, color: NAVY, fontSize: 15 }}>{app.full_name}</div>
          <div style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>{app.phone} {app.job ? `· ${app.job}` : ''}</div>
        </div>
        <StatusBadge status={app.status} />
        <span style={{ color: '#9CA3AF', fontSize: 14 }}>{open ? '▲' : '▼'}</span>
      </div>

      {open && (
        <div style={{ padding: '0 20px 20px', borderTop: '1px solid #F1F5F9' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 24px', marginTop: 16, marginBottom: 20 }}>
            {[
              ['Phone', app.phone],
              ['Email', app.email || '—'],
              ['Job', app.job || '—'],
              ['Nationality', NATIONALITY_LABELS[app.nationality] || app.nationality || '—'],
              ['Language', langLabel],
              ['Agreed to Terms', app.agreed_to_terms ? '✅ Yes' : '❌ No'],
              ['Submitted', app.created_at ? new Date(app.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'],
            ].map(([k, v]) => (
              <div key={k}>
                <div style={{ fontSize: 10, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 0.5 }}>{k}</div>
                <div style={{ fontSize: 13, color: '#374151', marginTop: 2, fontWeight: 500 }}>{v}</div>
              </div>
            ))}
          </div>

          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>Update Status</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {STATUSES.map(s => (
                <button key={s.value} onClick={() => onStatusChange(app.id, s.value)} style={{ padding: '7px 16px', borderRadius: 8, border: `1.5px solid ${app.status === s.value ? s.color : '#E2E8F0'}`, background: app.status === s.value ? s.bg : '#fff', color: app.status === s.value ? s.color : '#6B7280', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ReferralPartners() {
  const { user } = useAuth();
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    api.get('/api/referral-applications')
      .then(r => setApps(r.data))
      .catch(() => toast.error('Failed to load referral partners'))
      .finally(() => setLoading(false));
  }, []);

  async function handleStatusChange(id, status) {
    try {
      const { data } = await api.patch(`/api/referral-applications/${id}`, { status });
      setApps(prev => prev.map(a => a.id === id ? data : a));
      toast.success('Status updated');
    } catch {
      toast.error('Failed to update status');
    }
  }

  const filtered = apps.filter(a =>
    !filter || a.status === filter
  );

  if (loading) return <div style={{ padding: 40, textAlign: 'center', color: '#94A3B8' }}>Loading...</div>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: NAVY, margin: 0 }}>Referral Partners</h1>
          <p style={{ fontSize: 13, color: '#6B7280', margin: '4px 0 0' }}>Partners assigned to you from the referral form</p>
        </div>
        <div style={{ background: NAVY, borderRadius: 10, padding: '6px 14px', textAlign: 'center' }}>
          <div style={{ fontSize: 22, fontWeight: 900, color: '#fff' }}>{apps.length}</div>
          <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: 1 }}>Assigned</div>
        </div>
      </div>

      {/* Status filter */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        {[{ value: '', label: 'All' }, ...STATUSES].map(s => (
          <button key={s.value} onClick={() => setFilter(s.value)} style={{ padding: '7px 16px', borderRadius: 8, border: `1.5px solid ${filter === s.value ? NAVY : '#E2E8F0'}`, background: filter === s.value ? NAVY : '#fff', color: filter === s.value ? '#fff' : '#6B7280', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
            {s.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: '#9CA3AF' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🤝</div>
          <div style={{ fontSize: 15, fontWeight: 600 }}>No referral partners yet</div>
          <div style={{ fontSize: 13, marginTop: 4 }}>Partners assigned to you will appear here</div>
        </div>
      ) : (
        filtered.map(app => (
          <ApplicationCard key={app.id} app={app} onStatusChange={handleStatusChange} />
        ))
      )}
    </div>
  );
}
