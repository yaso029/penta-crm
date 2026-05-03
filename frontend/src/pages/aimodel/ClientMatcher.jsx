import { useState } from 'react';
import api from '../../api';

const GOLD = '#C9A84C';
const NAVY = '#0A2342';

const BED_OPTIONS = ['Studio', '1', '2', '3', '4', '5'];
const MARKET_OPTIONS = ['', 'offplan', 'secondary', 'both'];
const TYPE_OPTIONS = ['', 'Apartment', 'Villa', 'Townhouse', 'Penthouse', 'Office'];

function formatPrice(v) {
  if (!v) return '—';
  if (v >= 1_000_000) return `AED ${(v / 1_000_000).toFixed(2)}M`;
  return `AED ${v.toLocaleString()}`;
}

function ScoreBar({ pct }) {
  const color = pct >= 80 ? '#059669' : pct >= 60 ? '#d97706' : '#dc2626';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{ flex: 1, height: 6, background: '#e2e8f0', borderRadius: 3, overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 3 }} />
      </div>
      <span style={{ fontSize: 13, fontWeight: 700, color, minWidth: 36 }}>{pct}%</span>
    </div>
  );
}

export default function ClientMatcher() {
  const [form, setForm] = useState({
    client_name: '', budget_min: '', budget_max: '', bedrooms: '',
    property_type: '', market_type: '', preferred_areas: '', max_handover_year: '',
    furnishing: '', top_n: 15, min_score_pct: 30,
  });
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState(null);

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const buildPayload = () => ({
    client_name: form.client_name,
    budget_min: form.budget_min ? parseFloat(form.budget_min) : null,
    budget_max: form.budget_max ? parseFloat(form.budget_max) : null,
    bedrooms: form.bedrooms || null,
    property_type: form.property_type || null,
    market_type: form.market_type || null,
    preferred_areas: form.preferred_areas ? form.preferred_areas.split(',').map(s => s.trim()).filter(Boolean) : [],
    max_handover_year: form.max_handover_year ? parseInt(form.max_handover_year) : null,
    furnishing: form.furnishing || null,
    top_n: parseInt(form.top_n) || 15,
    min_score_pct: parseFloat(form.min_score_pct) || 0,
  });

  const handleMatch = async () => {
    setLoading(true); setError(null); setResults(null);
    try {
      const r = await api.post('/api/ai/match', buildPayload());
      setResults(r.data);
    } catch (e) {
      setError(e.response?.data?.detail || 'Match failed');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const r = await api.post('/api/ai/match/report', buildPayload(), { responseType: 'blob' });
      const url = URL.createObjectURL(new Blob([r.data], { type: 'application/pdf' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = `penta_match_${form.client_name || 'report'}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      alert('Failed to generate PDF');
    } finally {
      setDownloading(false);
    }
  };

  const inputStyle = { padding: '9px 12px', borderRadius: 7, border: '1px solid #e2e8f0', fontSize: 13, outline: 'none', width: '100%', background: '#fff' };
  const labelStyle = { fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 5, display: 'block' };

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 22, fontWeight: 800, color: '#0d1f3c' }}>Client Matcher</div>
        <div style={{ fontSize: 13, color: '#888', marginTop: 2 }}>Enter client requirements to find ranked property matches</div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '380px 1fr', gap: 20, alignItems: 'start' }}>
        {/* Form */}
        <div style={{ background: '#fff', borderRadius: 14, padding: 24, border: '1px solid #eee' }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#0d1f3c', marginBottom: 20 }}>Client Requirements</div>

          <div style={{ marginBottom: 14 }}>
            <label style={labelStyle}>Client Name</label>
            <input value={form.client_name} onChange={e => set('client_name', e.target.value)} placeholder="e.g. Ahmed Al Mansoori" style={inputStyle} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
            <div>
              <label style={labelStyle}>Min Budget (AED)</label>
              <input value={form.budget_min} onChange={e => set('budget_min', e.target.value)} placeholder="1,000,000" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Max Budget (AED)</label>
              <input value={form.budget_max} onChange={e => set('budget_max', e.target.value)} placeholder="3,000,000" style={inputStyle} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
            <div>
              <label style={labelStyle}>Bedrooms</label>
              <select value={form.bedrooms} onChange={e => set('bedrooms', e.target.value)} style={inputStyle}>
                <option value="">Any</option>
                {BED_OPTIONS.map(b => <option key={b} value={b}>{b === 'Studio' ? 'Studio' : `${b} BR`}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Property Type</label>
              <select value={form.property_type} onChange={e => set('property_type', e.target.value)} style={inputStyle}>
                {TYPE_OPTIONS.map(t => <option key={t} value={t}>{t || 'Any'}</option>)}
              </select>
            </div>
          </div>

          <div style={{ marginBottom: 14 }}>
            <label style={labelStyle}>Market Type</label>
            <select value={form.market_type} onChange={e => set('market_type', e.target.value)} style={inputStyle}>
              {MARKET_OPTIONS.map(m => <option key={m} value={m}>{m || 'Both'}</option>)}
            </select>
          </div>

          <div style={{ marginBottom: 14 }}>
            <label style={labelStyle}>Preferred Areas (comma-separated)</label>
            <input value={form.preferred_areas} onChange={e => set('preferred_areas', e.target.value)} placeholder="Downtown Dubai, Business Bay" style={inputStyle} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
            <div>
              <label style={labelStyle}>Max Handover Year</label>
              <input value={form.max_handover_year} onChange={e => set('max_handover_year', e.target.value)} placeholder="2027" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Furnishing</label>
              <select value={form.furnishing} onChange={e => set('furnishing', e.target.value)} style={inputStyle}>
                <option value="">Any</option>
                <option value="Furnished">Furnished</option>
                <option value="Unfurnished">Unfurnished</option>
                <option value="Semi-Furnished">Semi-Furnished</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
            <div>
              <label style={labelStyle}>Top N Results</label>
              <input value={form.top_n} onChange={e => set('top_n', e.target.value)} placeholder="15" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Min Score %</label>
              <input value={form.min_score_pct} onChange={e => set('min_score_pct', e.target.value)} placeholder="30" style={inputStyle} />
            </div>
          </div>

          <button onClick={handleMatch} disabled={loading}
            style={{
              width: '100%', padding: '11px', borderRadius: 8, border: 'none',
              background: loading ? '#e2e8f0' : GOLD, color: loading ? '#94a3b8' : NAVY,
              fontWeight: 800, fontSize: 14, cursor: loading ? 'not-allowed' : 'pointer',
            }}>
            {loading ? '⏳ Finding matches…' : '🎯 Find Matches'}
          </button>

          {error && <div style={{ marginTop: 12, color: '#dc2626', fontSize: 13 }}>{error}</div>}
        </div>

        {/* Results */}
        <div>
          {!results ? (
            <div style={{ background: '#fff', borderRadius: 14, padding: 40, border: '1px solid #eee', textAlign: 'center', color: '#bbb' }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>🎯</div>
              <div style={{ fontSize: 14 }}>Fill in the form and click Find Matches</div>
            </div>
          ) : (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#0d1f3c' }}>
                  {results.count} matches found {form.client_name && `for ${form.client_name}`}
                </div>
                <button onClick={handleDownload} disabled={downloading}
                  style={{
                    padding: '8px 18px', borderRadius: 7, border: `1px solid ${NAVY}`,
                    background: downloading ? '#f8fafc' : NAVY, color: downloading ? '#aaa' : '#fff',
                    fontSize: 13, fontWeight: 700, cursor: downloading ? 'not-allowed' : 'pointer',
                  }}>
                  {downloading ? '⏳ Generating…' : '📄 Download PDF'}
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {results.results.map((m, i) => (
                  <div key={m.listing_id} style={{
                    background: '#fff', borderRadius: 12, padding: '16px 20px',
                    border: '1px solid #eee', borderLeft: `4px solid ${i === 0 ? GOLD : i === 1 ? '#94a3b8' : '#cbd5e1'}`,
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 4 }}>
                          <span style={{ fontSize: 18, fontWeight: 900, color: '#0d1f3c' }}>#{i + 1}</span>
                          <span style={{
                            padding: '2px 8px', borderRadius: 20, fontSize: 10, fontWeight: 800,
                            textTransform: 'uppercase', letterSpacing: 0.8,
                            background: m.listing_type === 'offplan' ? '#fef3c7' : '#eff6ff',
                            color: m.listing_type === 'offplan' ? '#92400e' : '#1d4ed8',
                          }}>{m.listing_type}</span>
                        </div>
                        <div style={{ fontWeight: 700, color: '#0d1f3c', fontSize: 15, marginBottom: 2 }}>
                          {m.title || m.community || '—'}
                        </div>
                        <div style={{ fontSize: 13, color: '#555' }}>
                          {m.area}{m.bedrooms ? ` · ${m.bedrooms} BR` : ''}{m.size_sqft ? ` · ${m.size_sqft.toLocaleString()} sqft` : ''}
                        </div>
                        <div style={{ fontSize: 14, fontWeight: 800, color: '#0d1f3c', marginTop: 4 }}>{formatPrice(m.price_aed)}</div>
                        {m.listing_url && <a href={m.listing_url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: GOLD, fontWeight: 600, marginTop: 4, display: 'inline-block' }}>View listing →</a>}
                      </div>
                      <div style={{ minWidth: 120 }}>
                        <div style={{ fontSize: 11, color: '#888', marginBottom: 4 }}>Match Score</div>
                        <ScoreBar pct={m.score_pct} />
                        {m.breakdown && (
                          <div style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                            {Object.entries(m.breakdown).filter(([, v]) => v > 0).map(([k, v]) => (
                              <span key={k} style={{ fontSize: 10, padding: '2px 6px', borderRadius: 10, background: '#f1f5f9', color: '#64748b' }}>
                                {k}: {v}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
