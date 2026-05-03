import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api';

const GOLD = '#C9A84C';
const NAVY = '#0A2342';

function StatCard({ label, value, icon, color, onClick }) {
  return (
    <div
      onClick={onClick}
      style={{
        background: '#fff', borderRadius: 14, padding: '24px 28px',
        border: '1px solid #eee', cursor: onClick ? 'pointer' : 'default',
        transition: 'transform 0.15s, box-shadow 0.15s',
        borderTop: `4px solid ${color}`,
      }}
      onMouseEnter={e => { if (onClick) { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.1)'; } }}
      onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; }}
    >
      <div style={{ fontSize: 28, marginBottom: 8 }}>{icon}</div>
      <div style={{ fontSize: 32, fontWeight: 900, color: '#0d1f3c', letterSpacing: '-1px' }}>{value}</div>
      <div style={{ fontSize: 13, color: '#888', marginTop: 4 }}>{label}</div>
    </div>
  );
}

export default function AIDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/api/ai/stats').then(r => setStats(r.data)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const lastScrape = stats?.last_scrape;

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#aaa', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 4 }}>
          AI Model
        </div>
        <div style={{ fontSize: 26, fontWeight: 900, color: '#0d1f3c', letterSpacing: '-0.5px' }}>
          Real Estate Intelligence
        </div>
        <div style={{ fontSize: 14, color: '#888', marginTop: 4 }}>
          Live market data, AI-powered matching, and client intake automation
        </div>
      </div>

      {loading ? (
        <div style={{ color: '#aaa', fontSize: 14 }}>Loading…</div>
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16, marginBottom: 28 }}>
            <StatCard label="Off-Plan Listings" value={stats?.offplan_total ?? '—'} icon="🏗️" color="#C9A84C" onClick={() => navigate('/ai/offplan')} />
            <StatCard label="Secondary Listings" value={stats?.secondary_total ?? '—'} icon="🏠" color="#0A2342" onClick={() => navigate('/ai/secondary')} />
            <StatCard label="Intake Sessions" value={stats?.intake_sessions ?? '—'} icon="🤖" color="#7c3aed" onClick={() => navigate('/ai/intake')} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            {/* Last scrape card */}
            <div style={{ background: '#fff', borderRadius: 14, padding: 24, border: '1px solid #eee' }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 16 }}>
                Last Scrape
              </div>
              {lastScrape ? (
                <div>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 10 }}>
                    <span style={{
                      padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700,
                      textTransform: 'uppercase', letterSpacing: 1,
                      background: lastScrape.status === 'success' ? '#d1fae5' : lastScrape.status === 'error' ? '#fee2e2' : '#fef3c7',
                      color: lastScrape.status === 'success' ? '#065f46' : lastScrape.status === 'error' ? '#991b1b' : '#92400e',
                    }}>{lastScrape.status}</span>
                    <span style={{ fontSize: 13, color: '#555', fontWeight: 600, textTransform: 'uppercase' }}>{lastScrape.source}</span>
                  </div>
                  <div style={{ fontSize: 13, color: '#777' }}>
                    {lastScrape.started_at ? new Date(lastScrape.started_at).toLocaleString() : '—'}
                  </div>
                  <div style={{ fontSize: 13, color: '#555', marginTop: 6 }}>
                    {lastScrape.listings_found} found &nbsp;·&nbsp; {lastScrape.listings_new} new &nbsp;·&nbsp; {lastScrape.listings_updated} updated
                  </div>
                  {lastScrape.error_message && (
                    <div style={{ fontSize: 12, color: '#dc2626', marginTop: 8, background: '#fef2f2', borderRadius: 6, padding: '6px 10px' }}>
                      {lastScrape.error_message}
                    </div>
                  )}
                </div>
              ) : (
                <div style={{ fontSize: 14, color: '#bbb' }}>No scrapes run yet</div>
              )}
            </div>

            {/* Quick actions */}
            <div style={{ background: '#fff', borderRadius: 14, padding: 24, border: '1px solid #eee' }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 16 }}>
                Quick Actions
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[
                  { label: '🎯 Find matches for a client', path: '/ai/match', color: GOLD },
                  { label: '🤖 Start AI intake session', path: '/ai/intake', color: '#7c3aed' },
                  { label: '⚙️ Run data scrape', path: '/ai/scrape', color: NAVY },
                  { label: '📋 View all sessions', path: '/ai/intake', color: '#059669' },
                ].map(a => (
                  <button
                    key={a.path + a.label}
                    onClick={() => navigate(a.path)}
                    style={{
                      textAlign: 'left', padding: '10px 14px', borderRadius: 8,
                      border: `1px solid ${a.color}22`, background: `${a.color}0a`,
                      color: a.color, fontSize: 13, fontWeight: 600, cursor: 'pointer',
                    }}
                  >
                    {a.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
