import { useState, useEffect, useCallback } from 'react';
import api from '../../api';

function formatPrice(v) {
  if (!v) return '—';
  if (v >= 1_000_000) return `AED ${(v / 1_000_000).toFixed(2)}M`;
  return `AED ${v.toLocaleString()}`;
}

const BED_OPTIONS = ['Studio', '1', '2', '3', '4', '5', '6+'];
const TYPE_OPTIONS = ['Apartment', 'Villa', 'Townhouse', 'Penthouse', 'Office', 'Retail'];

export default function SecondaryListings() {
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const LIMIT = 30;

  const [filters, setFilters] = useState({
    search: '', bedrooms: '', area: '', property_type: '', min_price: '', max_price: '',
  });

  const fetchData = useCallback(() => {
    setLoading(true);
    const params = { limit: LIMIT, offset: page * LIMIT };
    if (filters.search) params.search = filters.search;
    if (filters.bedrooms) params.bedrooms = filters.bedrooms;
    if (filters.area) params.area = filters.area;
    if (filters.property_type) params.property_type = filters.property_type;
    if (filters.min_price) params.min_price = filters.min_price;
    if (filters.max_price) params.max_price = filters.max_price;
    api.get('/api/ai/listings/secondary', { params })
      .then(r => { setRows(r.data.results); setTotal(r.data.total); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [filters, page]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const set = (k, v) => { setFilters(p => ({ ...p, [k]: v })); setPage(0); };

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 22, fontWeight: 800, color: '#0d1f3c' }}>Secondary Market</div>
        <div style={{ fontSize: 13, color: '#888', marginTop: 2 }}>{total.toLocaleString()} listings from Bayut</div>
      </div>

      {/* Filters */}
      <div style={{ background: '#fff', borderRadius: 12, padding: '16px 20px', marginBottom: 20, border: '1px solid #eee', display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <input
          placeholder="Search title, area, community…"
          value={filters.search}
          onChange={e => set('search', e.target.value)}
          style={{ flex: 1, minWidth: 200, padding: '8px 12px', borderRadius: 7, border: '1px solid #e2e8f0', fontSize: 13, outline: 'none' }}
        />
        <select value={filters.property_type} onChange={e => set('property_type', e.target.value)}
          style={{ padding: '8px 12px', borderRadius: 7, border: '1px solid #e2e8f0', fontSize: 13, outline: 'none', background: '#fff' }}>
          <option value="">All Types</option>
          {TYPE_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <select value={filters.bedrooms} onChange={e => set('bedrooms', e.target.value)}
          style={{ padding: '8px 12px', borderRadius: 7, border: '1px solid #e2e8f0', fontSize: 13, outline: 'none', background: '#fff' }}>
          <option value="">Any Beds</option>
          {BED_OPTIONS.map(b => <option key={b} value={b}>{b === 'Studio' ? 'Studio' : `${b} BR`}</option>)}
        </select>
        <input placeholder="Area / community" value={filters.area} onChange={e => set('area', e.target.value)}
          style={{ width: 160, padding: '8px 12px', borderRadius: 7, border: '1px solid #e2e8f0', fontSize: 13, outline: 'none' }} />
        <input placeholder="Min price (AED)" value={filters.min_price} onChange={e => set('min_price', e.target.value)}
          style={{ width: 140, padding: '8px 12px', borderRadius: 7, border: '1px solid #e2e8f0', fontSize: 13, outline: 'none' }} />
        <input placeholder="Max price (AED)" value={filters.max_price} onChange={e => set('max_price', e.target.value)}
          style={{ width: 140, padding: '8px 12px', borderRadius: 7, border: '1px solid #e2e8f0', fontSize: 13, outline: 'none' }} />
      </div>

      <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #eee', overflow: 'hidden' }}>
        {loading && <div style={{ padding: '16px 20px', color: '#aaa', fontSize: 13 }}>Loading…</div>}
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ background: '#f8fafc', borderBottom: '1px solid #eee' }}>
              {['Title', 'Type', 'Beds', 'Area', 'Price', 'Size', 'Furnishing', 'Agent', 'Link'].map(h => (
                <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 700, color: '#64748b', fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && !loading ? (
              <tr><td colSpan={9} style={{ padding: '32px 14px', color: '#bbb', textAlign: 'center' }}>
                {total === 0 ? 'No listings scraped yet — run a Bayut scrape first' : 'No results match your filters'}
              </td></tr>
            ) : rows.map(r => (
              <tr key={r.id} style={{ borderBottom: '1px solid #f1f5f9' }}
                onMouseEnter={e => e.currentTarget.style.background = '#fafafa'}
                onMouseLeave={e => e.currentTarget.style.background = ''}>
                <td style={{ padding: '10px 14px', maxWidth: 220 }}>
                  <div style={{ fontWeight: 600, color: '#0d1f3c', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.title || '—'}</div>
                  {r.building_name && <div style={{ fontSize: 11, color: '#888' }}>{r.building_name}</div>}
                </td>
                <td style={{ padding: '10px 14px', color: '#555' }}>{r.property_type || '—'}</td>
                <td style={{ padding: '10px 14px', color: '#555' }}>{r.bedrooms || '—'}</td>
                <td style={{ padding: '10px 14px', color: '#555' }}>{r.area || r.community || '—'}</td>
                <td style={{ padding: '10px 14px', fontWeight: 700, color: '#0d1f3c', whiteSpace: 'nowrap' }}>{formatPrice(r.price_aed)}</td>
                <td style={{ padding: '10px 14px', color: '#555' }}>{r.size_sqft ? `${r.size_sqft.toLocaleString()} sqft` : '—'}</td>
                <td style={{ padding: '10px 14px' }}>
                  {r.furnishing_status && (
                    <span style={{ padding: '2px 8px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: '#eff6ff', color: '#1d4ed8' }}>{r.furnishing_status}</span>
                  )}
                </td>
                <td style={{ padding: '10px 14px', color: '#555', fontSize: 12 }}>{r.agent_name || r.agency_name || '—'}</td>
                <td style={{ padding: '10px 14px' }}>
                  {r.listing_url && <a href={r.listing_url} target="_blank" rel="noopener noreferrer" style={{ color: '#0A2342', fontWeight: 600, fontSize: 12 }}>View →</a>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {total > LIMIT && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 20 }}>
          <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}
            style={{ padding: '8px 16px', borderRadius: 7, border: '1px solid #e2e8f0', background: '#fff', cursor: page === 0 ? 'not-allowed' : 'pointer', color: '#555' }}>
            ← Prev
          </button>
          <span style={{ padding: '8px 16px', fontSize: 13, color: '#555' }}>Page {page + 1} of {Math.ceil(total / LIMIT)}</span>
          <button onClick={() => setPage(p => p + 1)} disabled={(page + 1) * LIMIT >= total}
            style={{ padding: '8px 16px', borderRadius: 7, border: '1px solid #e2e8f0', background: '#fff', cursor: (page + 1) * LIMIT >= total ? 'not-allowed' : 'pointer', color: '#555' }}>
            Next →
          </button>
        </div>
      )}
    </div>
  );
}
