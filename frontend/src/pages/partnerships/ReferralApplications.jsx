import { useState, useEffect } from 'react';
import api from '../../api';
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

function ApplicationCard({ app, agents, onUpdate }) {
  const [open, setOpen] = useState(false);
  const langLabel = app.language === 'ar' ? '🇦🇪 Arabic' : '🇬🇧 English';

  async function changeStatus(status) {
    try {
      const { data } = await api.patch(`/api/referral-applications/${app.id}`, { status });
      onUpdate(data);
      toast.success('Status updated');
    } catch { toast.error('Failed'); }
  }

  async function assignTo(agentId) {
    try {
      const { data } = await api.patch(`/api/referral-applications/${app.id}`, { assigned_to: agentId ? parseInt(agentId) : null });
      onUpdate(data);
      toast.success('Assigned');
    } catch { toast.error('Failed to assign'); }
  }

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
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {app.assigned_to_name && (
            <span style={{ fontSize: 11, color: '#6B7280', background: '#F1F5F9', padding: '3px 10px', borderRadius: 6 }}>
              👤 {app.assigned_to_name}
            </span>
          )}
          <StatusBadge status={app.status} />
        </div>
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

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>Status</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {STATUSES.map(s => (
                  <button key={s.value} onClick={() => changeStatus(s.value)} style={{ padding: '8px 14px', borderRadius: 8, border: `1.5px solid ${app.status === s.value ? s.color : '#E2E8F0'}`, background: app.status === s.value ? s.bg : '#fff', color: app.status === s.value ? s.color : '#6B7280', fontSize: 12, fontWeight: 700, cursor: 'pointer', textAlign: 'left' }}>
                    {app.status === s.value ? '● ' : '○ '}{s.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>Assign to Agent</div>
              <select
                value={app.assigned_to || ''}
                onChange={e => assignTo(e.target.value)}
                style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #E2E8F0', borderRadius: 8, fontSize: 13, outline: 'none', background: '#fff' }}
              >
                <option value="">Unassigned</option>
                {agents.map(a => <option key={a.id} value={a.id}>{a.full_name}</option>)}
              </select>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ReferralApplications() {
  const [apps, setApps] = useState([]);
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    Promise.all([
      api.get('/api/referral-applications'),
      api.get('/api/users'),
    ]).then(([appsRes, usersRes]) => {
      setApps(appsRes.data);
      setAgents((usersRes.data || []).filter(u => u.is_active));
    }).catch(() => toast.error('Failed to load applications'))
      .finally(() => setLoading(false));
  }, []);

  function handleUpdate(updated) {
    setApps(prev => prev.map(a => a.id === updated.id ? updated : a));
  }

  const filtered = filter ? apps.filter(a => a.status === filter) : apps;
  const counts = STATUSES.reduce((acc, s) => ({ ...acc, [s.value]: apps.filter(a => a.status === s.value).length }), {});

  if (loading) return <div style={{ padding: 40, textAlign: 'center', color: '#94A3B8' }}>Loading...</div>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: NAVY, margin: 0 }}>Referral Applications</h1>
          <p style={{ fontSize: 13, color: '#6B7280', margin: '4px 0 0' }}>People who applied through the referral partner form</p>
        </div>
        <div style={{ background: NAVY, borderRadius: 10, padding: '6px 14px', textAlign: 'center' }}>
          <div style={{ fontSize: 22, fontWeight: 900, color: '#fff' }}>{apps.length}</div>
          <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: 1 }}>Total</div>
        </div>
      </div>

      {/* Summary cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24 }}>
        {STATUSES.map(s => (
          <div key={s.value} onClick={() => setFilter(filter === s.value ? '' : s.value)} style={{ background: filter === s.value ? s.bg : '#fff', border: `1.5px solid ${filter === s.value ? s.color : '#E8ECF0'}`, borderRadius: 12, padding: '14px 16px', cursor: 'pointer', transition: 'all 0.15s' }}>
            <div style={{ fontSize: 22, fontWeight: 900, color: s.color }}>{counts[s.value] || 0}</div>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#6B7280', marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: '#9CA3AF' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🤝</div>
          <div style={{ fontSize: 15, fontWeight: 600 }}>No applications yet</div>
          <div style={{ fontSize: 13, marginTop: 4 }}>Share your referral form link to start receiving applications</div>
        </div>
      ) : (
        filtered.map(app => (
          <ApplicationCard key={app.id} app={app} agents={agents} onUpdate={handleUpdate} />
        ))
      )}
    </div>
  );
}
