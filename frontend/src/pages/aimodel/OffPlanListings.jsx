import { useState, useEffect, useCallback } from 'react';
import api from '../../api';

const GOLD = '#C9A84C';

function formatPrice(v) {
  if (!v) return '—';
  if (v >= 1_000_000) return `AED ${(v / 1_000_000).toFixed(2)}M`;
  return `AED ${v.toLocaleString()}`;
}

export default function OffPlanListings() {
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [options, setOptions] = useState({ developers: [], areas: [], statuses: [] });
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const LIMIT = 30;

  const [filters, setFilters] = useState({
    search: '', developer: '', area: '', sale_status: '', min_price: '', max_price: '',
  });

  const fetchOptions = () => api.get('/api/ai/listings/offplan/options').then(r => setOptions(r.data)).catch(() => {});

  const fetchData = useCallback(() => {
    setLoading(true);
    const params = { limit: LIMIT, offset: page * LIMIT };
    if (filters.search) params.search = filters.search;
    if (filters.developer) params.developer = filters.developer;
    if (filters.area) params.area = filters.area;
    if (filters.sale_status) params.sale_status = filters.sale_status;
    if (filters.min_price) params.min_price = filters.min_price;
    if (filters.max_price) params.max_price = filters.max_price;
    api.get('/api/ai/listings/offplan', { params })
      .then(r => { setRows(r.data.results); setTotal(r.data.total); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [filters, page]);

  useEffect(() => { fetchOptions(); }, []);
  useEffect(() => { fetchData(); }, [fetchData]);

  const set = (k, v) => { setFilters(p => ({ ...p, [k]: v })); setPage(0); };

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 22, fontWeight: 800, color: '#0d1f3c' }}>Off-Plan Listings</div>
        <div style={{ fontSize: 13, color: '#888', marginTop: 2 }}>{total.toLocaleString()} listings from Reelly</div>
      </div>

      {/* Filters */}
      <div style={{ background: '#fff', borderRadius: 12, padding: '16px 20px', marginBottom: 20, border: '1px solid #eee', display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <input
          placeholder="Search project, developer, area…"
          value={filters.search}
          onChange={e => set('search', e.target.value)}
          style={{ flex: 1, minWidth: 200, padding: '8px 12px', borderRadius: 7, border: '1px solid #e2e8f0', fontSize: 13, outline: 'none' }}
        />
        <select value={filters.developer} onChange={e => set('developer', e.target.value)}
          style={{ padding: '8px 12px', borderRadius: 7, border: '1px solid #e2e8f0', fontSize: 13, outline: 'none', background: '#fff' }}>
          <option value="">All Developers</option>
          {options.developers.map(d => <option key={d} value={d}>{d}</option>)}
        </select>
        <select value={filters.area} onChange={e => set('area', e.target.value)}
          style={{ padding: '8px 12px', borderRadius: 7, border: '1px solid #e2e8f0', fontSize: 13, outline: 'none', background: '#fff' }}>
          <option value="">All Areas</option>
          {options.areas.map(a => <option key={a} value={a}>{a}</option>)}
        </select>
        <select value={filters.sale_status} onChange={e => set('sale_status', e.target.value)}
          style={{ padding: '8px 12px', borderRadius: 7, border: '1px solid #e2e8f0', fontSize: 13, outline: 'none', background: '#fff' }}>
          <option value="">All Statuses</option>
          {options.statuses.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <input placeholder="Min price (AED)" value={filters.min_price} onChange={e => set('min_price', e.target.value)}
          style={{ width: 140, padding: '8px 12px', borderRadius: 7, border: '1px solid #e2e8f0', fontSize: 13, outline: 'none' }} />
        <input placeholder="Max price (AED)" value={filters.max_price} onChange={e => set('max_price', e.target.value)}
          style={{ width: 140, padding: '8px 12px', borderRadius: 7, border: '1px solid #e2e8f0', fontSize: 13, outline: 'none' }} />
      </div>

      {/* Table */}
      <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #eee', overflow: 'hidden' }}>
        {loading && <div style={{ padding: '16px 20px', color: '#aaa', fontSize: 13 }}>Loading…</div>}
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ background: '#f8fafc', borderBottom: '1px solid #eee' }}>
              {['Project', 'Developer', 'Area', 'Starting Price', 'Handover', 'Status', 'Commission', 'Link'].map(h => (
                <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 700, color: '#64748b', fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && !loading ? (
              <tr><td colSpan={8} style={{ padding: '32px 14px', color: '#bbb', textAlign: 'center' }}>
                {total === 0 ? 'No listings scraped yet — run a Reelly scrape first' : 'No results match your filters'}
              </td></tr>
            ) : rows.map(r => (
              <tr key={r.id} style={{ borderBottom: '1px solid #f1f5f9' }}
                onMouseEnter={e => e.currentTarget.style.background = '#fafafa'}
                onMouseLeave={e => e.currentTarget.style.background = ''}>
                <td style={{ padding: '10px 14px' }}>
                  <div style={{ fontWeight: 600, color: '#0d1f3c' }}>{r.project_name || '—'}</div>
                  {r.cover_image_url && <img src={r.cover_image_url} alt="" style={{ width: 48, height: 32, objectFit: 'cover', borderRadius: 4, marginTop: 4 }} />}
                </td>
                <td style={{ padding: '10px 14px', color: '#555' }}>{r.developer_name || '—'}</td>
                <td style={{ padding: '10px 14px', color: '#555' }}>{r.area || r.community || '—'}</td>
                <td style={{ padding: '10px 14px', fontWeight: 700, color: '#0d1f3c' }}>{formatPrice(r.starting_price_aed)}</td>
                <td style={{ padding: '10px 14px', color: '#555' }}>{r.completion_date_text || r.handover_year || '—'}</td>
                <td style={{ padding: '10px 14px' }}>
                  {r.sale_status && (
                    <span style={{ padding: '2px 8px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: '#fef3c7', color: '#92400e' }}>{r.sale_status}</span>
                  )}
                </td>
                <td style={{ padding: '10px 14px', color: r.max_commission ? '#059669' : '#bbb', fontWeight: r.max_commission ? 700 : 400 }}>
                  {r.max_commission ? `${r.max_commission}%` : '—'}
                </td>
                <td style={{ padding: '10px 14px' }}>
                  {r.listing_url && <a href={r.listing_url} target="_blank" rel="noopener noreferrer" style={{ color: GOLD, fontWeight: 600, fontSize: 12 }}>View →</a>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
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
