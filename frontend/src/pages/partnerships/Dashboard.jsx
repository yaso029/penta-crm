import { useEffect, useState } from 'react';
import api from '../../api';

const NAVY = '#0A2342';
const GOLD = '#C9A84C';
const PURPLE = '#7c3aed';

const SUGGESTION_LABELS = { interested: 'Interested', not_interested: 'Not Interested', has_client: 'Has Client' };
const SUGGESTION_COLORS = { interested: '#10b981', not_interested: '#ef4444', has_client: '#f59e0b' };

export default function PartnershipsDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/api/partnerships/dashboard')
      .then(r => setStats(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ padding: 60, textAlign: 'center', color: '#aaa' }}>Loading dashboard...</div>;
  if (!stats) return <div style={{ padding: 60, textAlign: 'center', color: '#aaa' }}>Failed to load</div>;

  const statCards = [
    { label: 'Total Partners', value: stats.total_partners, color: NAVY, icon: '👥' },
    { label: 'Active Partners', value: stats.active_partners, color: '#10b981', icon: '✅' },
    { label: 'Messages Today', value: stats.messages_sent_today, color: PURPLE, icon: '📤', sub: `${stats.whatsapp_sent_today} WA · ${stats.email_sent_today} Email` },
    { label: 'Replies Today', value: stats.replies_today, color: '#3b82f6', icon: '💬' },
    { label: 'Leads This Month', value: stats.leads_this_month, color: '#f59e0b', icon: '🎯' },
    { label: 'Commission Owed', value: `AED ${Number(stats.commission_owed).toLocaleString()}`, color: '#ef4444', icon: '💰' },
    { label: 'Commission Paid', value: `AED ${Number(stats.commission_paid).toLocaleString()}`, color: '#10b981', icon: '💵' },
    { label: 'This Month Revenue', value: `AED ${Number(stats.commission_this_month).toLocaleString()}`, color: GOLD, icon: '📈' },
  ];

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: '#1a1a2e' }}>Partnerships Dashboard</h1>
        <p style={{ color: '#888', fontSize: 14, marginTop: 4 }}>Overview of your referral partner program</p>
      </div>

      {/* Stats grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 32 }}>
        {statCards.map(s => (
          <div key={s.label} style={{
            background: '#fff', borderRadius: 14, padding: '20px 22px',
            boxShadow: '0 1px 6px rgba(0,0,0,0.07)', borderTop: `4px solid ${s.color}`,
          }}>
            <div style={{ fontSize: 24, marginBottom: 8 }}>{s.icon}</div>
            <div style={{ fontSize: 11, fontWeight: 600, color: '#888', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>{s.label}</div>
            <div style={{ fontSize: 24, fontWeight: 800, color: s.color }}>{s.value}</div>
            {s.sub && <div style={{ fontSize: 11, color: '#aaa', marginTop: 4 }}>{s.sub}</div>}
          </div>
        ))}
      </div>

      {/* Recent Activity */}
      <div style={{ background: '#fff', borderRadius: 14, boxShadow: '0 1px 6px rgba(0,0,0,0.07)', overflow: 'hidden' }}>
        <div style={{ padding: '18px 24px', borderBottom: '1px solid #f0f0f0', fontWeight: 700, fontSize: 16 }}>
          Recent Activity
        </div>
        <div style={{ maxHeight: 400, overflowY: 'auto' }}>
          {stats.recent_activity.length === 0 ? (
            <div style={{ padding: 30, textAlign: 'center', color: '#aaa' }}>No recent activity</div>
          ) : stats.recent_activity.map((a, i) => (
            <div key={i} style={{ padding: '14px 24px', borderBottom: '1px solid #f5f5f5', display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ fontSize: 22 }}>
                {a.type === 'message_sent' ? (a.channel === 'whatsapp' ? '📱' : '📧') : '💬'}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#1a1a2e' }}>
                  {a.type === 'message_sent'
                    ? `${a.channel === 'whatsapp' ? 'WhatsApp' : 'Email'} sent to ${a.partner_name}`
                    : `Reply from ${a.partner_name}`}
                </div>
                {a.message && <div style={{ fontSize: 12, color: '#888', marginTop: 2 }}>"{a.message}"</div>}
                {a.ai_suggestion && (
                  <span style={{ fontSize: 10, fontWeight: 600, background: `${SUGGESTION_COLORS[a.ai_suggestion]}20`, color: SUGGESTION_COLORS[a.ai_suggestion], borderRadius: 20, padding: '1px 8px', marginTop: 4, display: 'inline-block' }}>
                    {SUGGESTION_LABELS[a.ai_suggestion]}
                  </span>
                )}
              </div>
              <div style={{ fontSize: 11, color: '#aaa', whiteSpace: 'nowrap' }}>
                {a.time ? new Date(a.time).toLocaleString() : ''}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
