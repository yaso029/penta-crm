import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api';

const NAVY = '#0A2342';
const GOLD = '#C9A84C';

const STATUS_COLORS = {
  not_contacted: { bg: '#f1f5f9', color: '#64748b' },
  contacted:     { bg: '#dbeafe', color: '#1d4ed8' },
  responded:     { bg: '#fef3c7', color: '#92400e' },
  qualified:     { bg: '#d1fae5', color: '#065f46' },
  converted:     { bg: '#bbf7d0', color: '#14532d' },
  rejected:      { bg: '#fee2e2', color: '#991b1b' },
};

function StatCard({ label, value, sub, accent }) {
  return (
    <div style={{
      background: '#fff', borderRadius: 12, padding: '20px 24px',
      boxShadow: '0 1px 6px rgba(0,0,0,0.07)',
      borderLeft: `4px solid ${accent || GOLD}`,
    }}>
      <div style={{ fontSize: 28, fontWeight: 800, color: NAVY }}>{value}</div>
      <div style={{ fontSize: 13, fontWeight: 600, color: '#555', marginTop: 2 }}>{label}</div>
      {sub && <div style={{ fontSize: 11, color: '#aaa', marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

export default function InstagramOverview() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/api/instagram/stats')
      .then(r => setStats(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300 }}>
        <div style={{ color: '#888', fontSize: 14 }}>Loading...</div>
      </div>
    );
  }

  const s = stats || {};

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontSize: 22, fontWeight: 800, color: '#0d1f3c', letterSpacing: '-0.5px' }}>
          Instagram Lead Collection
        </div>
        <div style={{ fontSize: 13, color: '#888', marginTop: 4 }}>
          Accounts collected from Instagram keyword searches
        </div>
      </div>

      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 16, marginBottom: 32 }}>
        <StatCard label="Total Collected" value={s.total ?? 0} />
        <StatCard label="Collected Today" value={s.today ?? 0} accent="#0891b2" />
        <StatCard label="Have Email" value={s.with_email ?? 0} accent="#16a34a" />
        <StatCard label="Have Phone" value={s.with_phone ?? 0} accent="#7c3aed" />
        <StatCard label="Contacted" value={s.contacted ?? 0} accent="#1d4ed8" />
        <StatCard label="Converted" value={s.converted ?? 0} accent="#14532d" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {/* Top keywords */}
        <div style={{ background: '#fff', borderRadius: 12, padding: 24, boxShadow: '0 1px 6px rgba(0,0,0,0.07)' }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: NAVY, marginBottom: 16 }}>Top Search Keywords</div>
          {(s.top_keywords || []).length === 0 ? (
            <div style={{ color: '#aaa', fontSize: 13 }}>No data yet — start scraping to see keywords.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {s.top_keywords.map((k, i) => {
                const max = s.top_keywords[0]?.count || 1;
                const pct = Math.round((k.count / max) * 100);
                return (
                  <div key={i}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontSize: 13, color: '#333', fontWeight: 500 }}>{k.keyword}</span>
                      <span style={{ fontSize: 12, color: '#888' }}>{k.count} accounts</span>
                    </div>
                    <div style={{ height: 6, background: '#f0f2f5', borderRadius: 4 }}>
                      <div style={{ height: 6, width: `${pct}%`, background: GOLD, borderRadius: 4 }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Recent activity */}
        <div style={{ background: '#fff', borderRadius: 12, padding: 24, boxShadow: '0 1px 6px rgba(0,0,0,0.07)' }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: NAVY, marginBottom: 16 }}>Recently Collected</div>
          {(s.recent || []).length === 0 ? (
            <div style={{ color: '#aaa', fontSize: 13 }}>No leads yet.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {s.recent.map(lead => {
                const sc = STATUS_COLORS[lead.contacted_status] || STATUS_COLORS.not_contacted;
                return (
                  <div key={lead.id} style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '8px 0', borderBottom: '1px solid #f5f5f5',
                  }}>
                    {lead.profile_picture_url ? (
                      <img src={lead.profile_picture_url} alt=""
                        style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
                    ) : (
                      <div style={{
                        width: 36, height: 36, borderRadius: '50%', background: NAVY,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: GOLD, fontWeight: 700, fontSize: 14, flexShrink: 0,
                      }}>
                        {(lead.display_name || lead.username || '?')[0].toUpperCase()}
                      </div>
                    )}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#222', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {lead.display_name || lead.username}
                      </div>
                      <div style={{ fontSize: 11, color: '#888' }}>@{lead.username}</div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 3 }}>
                      <span style={{
                        fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 10,
                        background: sc.bg, color: sc.color, textTransform: 'uppercase', letterSpacing: 0.5,
                      }}>
                        {lead.contacted_status?.replace('_', ' ')}
                      </span>
                      <span style={{ fontSize: 11, color: '#aaa' }}>Score: {lead.lead_score}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div style={{ marginTop: 28, display: 'flex', gap: 12 }}>
        <button
          onClick={() => navigate('/ai/ig-leads')}
          style={{
            padding: '11px 24px', background: NAVY, color: '#fff',
            border: 'none', borderRadius: 8, fontWeight: 600, fontSize: 14, cursor: 'pointer',
          }}
        >
          View Lead Database →
        </button>
        <div style={{
          padding: '11px 20px', background: 'rgba(201,168,76,0.1)',
          border: '1px solid rgba(201,168,76,0.4)', borderRadius: 8,
          fontSize: 13, color: '#7a5c1e', display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <span>💻</span>
          Run <code style={{ background: 'rgba(0,0,0,0.06)', padding: '1px 5px', borderRadius: 4 }}>python main.py</code> in <code style={{ background: 'rgba(0,0,0,0.06)', padding: '1px 5px', borderRadius: 4 }}>instagram_scraper/</code> to start collecting
        </div>
      </div>
    </div>
  );
}
