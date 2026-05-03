import { useState, useEffect } from 'react';
import api from '../../api';

const SOURCES = [
  { key: 'reelly', label: 'Reelly (Off-Plan)', icon: '🏗️', color: '#C9A84C', desc: 'New developments from api.reelly.io' },
  { key: 'bayut', label: 'Bayut (Secondary)', icon: '🏠', color: '#0A2342', desc: 'Secondary market listings from Bayut' },
];

function statusChip(status) {
  const map = {
    success: { bg: '#d1fae5', color: '#065f46' },
    error: { bg: '#fee2e2', color: '#991b1b' },
    running: { bg: '#fef3c7', color: '#92400e' },
  };
  const s = map[status] || { bg: '#f1f5f9', color: '#64748b' };
  return (
    <span style={{
      padding: '2px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700,
      textTransform: 'uppercase', letterSpacing: 0.8,
      background: s.bg, color: s.color,
    }}>{status}</span>
  );
}

export default function ScrapeControl() {
  const [logs, setLogs] = useState([]);
  const [running, setRunning] = useState({});
  const [toast, setToast] = useState(null);

  const fetchLogs = () => api.get('/api/ai/scrape/logs').then(r => setLogs(r.data)).catch(() => {});

  useEffect(() => {
    fetchLogs();
    const id = setInterval(fetchLogs, 8000);
    return () => clearInterval(id);
  }, []);

  const trigger = async (source) => {
    setRunning(p => ({ ...p, [source]: true }));
    try {
      await api.post(`/api/ai/scrape/${source}`);
      setToast(`${source} scrape started — check logs below`);
      setTimeout(() => setToast(null), 4000);
      setTimeout(fetchLogs, 2000);
    } catch {
      setToast('Failed to start scrape');
      setTimeout(() => setToast(null), 4000);
    } finally {
      setRunning(p => ({ ...p, [source]: false }));
    }
  };

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 22, fontWeight: 800, color: '#0d1f3c', letterSpacing: '-0.5px' }}>Scrape Control</div>
        <div style={{ fontSize: 13, color: '#888', marginTop: 4 }}>Trigger data collection from external sources</div>
      </div>

      {toast && (
        <div style={{
          background: '#0d1f3c', color: '#f0d98a', padding: '12px 20px', borderRadius: 10,
          fontSize: 13, fontWeight: 600, marginBottom: 20,
        }}>{toast}</div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16, marginBottom: 32 }}>
        {SOURCES.map(s => (
          <div key={s.key} style={{
            background: '#fff', borderRadius: 14, padding: 24,
            border: '1px solid #eee', borderTop: `4px solid ${s.color}`,
          }}>
            <div style={{ fontSize: 28, marginBottom: 10 }}>{s.icon}</div>
            <div style={{ fontSize: 17, fontWeight: 800, color: '#0d1f3c', marginBottom: 4 }}>{s.label}</div>
            <div style={{ fontSize: 13, color: '#888', marginBottom: 20 }}>{s.desc}</div>
            <button
              onClick={() => trigger(s.key)}
              disabled={running[s.key]}
              style={{
                padding: '10px 20px', borderRadius: 8, border: 'none',
                background: running[s.key] ? '#e2e8f0' : s.color,
                color: running[s.key] ? '#94a3b8' : s.key === 'reelly' ? '#0d1728' : '#fff',
                fontWeight: 700, fontSize: 13, cursor: running[s.key] ? 'not-allowed' : 'pointer',
              }}
            >
              {running[s.key] ? '⏳ Starting…' : `▶ Run ${s.label}`}
            </button>
          </div>
        ))}
      </div>

      <div>
        <div style={{ fontSize: 14, fontWeight: 700, color: '#0d1f3c', marginBottom: 12 }}>Scrape Logs</div>
        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #eee', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #eee' }}>
                {['Source', 'Status', 'Started', 'Duration', 'Found', 'New', 'Updated', 'Error'].map(h => (
                  <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 700, color: '#64748b', fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {logs.length === 0 ? (
                <tr><td colSpan={8} style={{ padding: '24px 14px', color: '#bbb', textAlign: 'center' }}>No scrape logs yet</td></tr>
              ) : logs.map(l => {
                const dur = l.started_at && l.finished_at
                  ? Math.round((new Date(l.finished_at) - new Date(l.started_at)) / 1000) + 's'
                  : '—';
                return (
                  <tr key={l.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '10px 14px', fontWeight: 600, textTransform: 'uppercase', fontSize: 12 }}>{l.source}</td>
                    <td style={{ padding: '10px 14px' }}>{statusChip(l.status)}</td>
                    <td style={{ padding: '10px 14px', color: '#555' }}>{l.started_at ? new Date(l.started_at).toLocaleString() : '—'}</td>
                    <td style={{ padding: '10px 14px', color: '#555' }}>{dur}</td>
                    <td style={{ padding: '10px 14px', color: '#555' }}>{l.listings_found ?? '—'}</td>
                    <td style={{ padding: '10px 14px', color: '#059669', fontWeight: 600 }}>{l.listings_new ?? '—'}</td>
                    <td style={{ padding: '10px 14px', color: '#2563eb', fontWeight: 600 }}>{l.listings_updated ?? '—'}</td>
                    <td style={{ padding: '10px 14px', color: '#dc2626', fontSize: 12 }}>{l.error_message ? l.error_message.slice(0, 60) + '…' : '—'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
