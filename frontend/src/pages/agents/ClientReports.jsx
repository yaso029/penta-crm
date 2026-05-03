import { useState, useEffect, useRef } from 'react';
import api from '../../api';

const GOLD = '#C9A84C';
const NAVY = '#0A2342';

function formatPrice(v) {
  if (!v) return null;
  if (v >= 1_000_000) return `AED ${(v / 1_000_000).toFixed(2)}M`;
  return `AED ${Math.round(v).toLocaleString()}`;
}

function Chip({ label, color = '#64748b', bg = '#f1f5f9' }) {
  return (
    <span style={{ padding: '2px 9px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: bg, color, letterSpacing: 0.3 }}>
      {label}
    </span>
  );
}

// ─── Session list item ─────────────────────────────────────────────────────

function SessionRow({ s, selected, onSelect }) {
  return (
    <div
      onClick={() => onSelect(s)}
      style={{
        padding: '14px 16px', borderRadius: 10, cursor: 'pointer', marginBottom: 6,
        background: selected ? NAVY : '#fff',
        border: `1px solid ${selected ? NAVY : '#eee'}`,
        borderLeft: `3px solid ${selected ? GOLD : s.completed ? '#059669' : '#d97706'}`,
        transition: 'all 0.15s',
      }}
      onMouseEnter={e => { if (!selected) e.currentTarget.style.background = '#f8fafc'; }}
      onMouseLeave={e => { if (!selected) e.currentTarget.style.background = '#fff'; }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ fontWeight: 700, color: selected ? '#fff' : '#0d1f3c', fontSize: 14 }}>
          {s.client_name || 'Unnamed Client'}
        </div>
        <div style={{ display: 'flex', gap: 4 }}>
          {s.completed
            ? <Chip label="Done" bg={selected ? 'rgba(5,150,105,0.3)' : '#d1fae5'} color={selected ? '#6ee7b7' : '#065f46'} />
            : <Chip label="Active" bg={selected ? 'rgba(217,119,6,0.3)' : '#fef3c7'} color={selected ? '#fcd34d' : '#92400e'} />}
          {s.picks_count > 0 && (
            <Chip label={`${s.picks_count} props`} bg={selected ? 'rgba(201,168,76,0.25)' : '#fffbeb'} color={selected ? GOLD : '#92400e'} />
          )}
        </div>
      </div>
      <div style={{ fontSize: 12, color: selected ? 'rgba(255,255,255,0.6)' : '#888', marginTop: 3 }}>
        {[s.budget_aed, s.property_type, s.bedrooms ? `${s.bedrooms} BR` : null].filter(Boolean).join(' · ')}
      </div>
    </div>
  );
}

// ─── Client brief card ─────────────────────────────────────────────────────

function ClientBrief({ session }) {
  const rows = [
    ['Phone', session.client_phone],
    ['Email', session.client_email],
    ['Budget', session.budget_aed],
    ['Property Type', session.property_type],
    ['Bedrooms', session.bedrooms],
    ['Areas', session.preferred_areas],
    ['Market', session.market_preference],
    ['Purpose', session.purchase_purpose],
  ].filter(([, v]) => v);

  return (
    <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #eee', overflow: 'hidden', marginBottom: 16 }}>
      <div style={{ background: NAVY, padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ color: '#fff', fontWeight: 800, fontSize: 16 }}>{session.client_name || 'Client'}</div>
          <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, marginTop: 1 }}>
            Intake — {session.created_at ? new Date(session.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : ''}
          </div>
        </div>
        <div style={{ width: 3, height: 32, background: GOLD, borderRadius: 2 }} />
      </div>
      <div style={{ padding: '10px 16px' }}>
        {rows.map(([label, val]) => (
          <div key={label} style={{ display: 'flex', gap: 8, padding: '5px 0', borderBottom: '1px solid #f8fafc' }}>
            <span style={{ fontSize: 11, color: '#aaa', width: 100, flexShrink: 0, textTransform: 'uppercase', letterSpacing: 0.5, paddingTop: 1 }}>{label}</span>
            <span style={{ fontSize: 13, color: '#0d1f3c', fontWeight: 600 }}>{val}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── URL fetch bar ─────────────────────────────────────────────────────────

function FetchBar({ onFetched, onAddManually }) {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const inputRef = useRef(null);

  const handleFetch = async () => {
    const trimmed = url.trim();
    if (!trimmed) return;
    setLoading(true); setError(null);
    try {
      const r = await api.post('/api/client-reports/fetch-link', { url: trimmed });
      onFetched({ listing_url: trimmed, ...r.data });
      setUrl('');
      inputRef.current?.focus();
    } catch {
      setError('Could not fetch — fill in details manually');
      onFetched({ listing_url: trimmed });
      setUrl('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #eee', padding: '14px 16px', marginBottom: 14 }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8 }}>
        Add a property
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <input
          ref={inputRef}
          value={url}
          onChange={e => setUrl(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleFetch()}
          placeholder="Paste Bayut, PropertyFinder or Reelly URL…"
          style={{
            flex: 1, padding: '10px 14px', borderRadius: 8, border: '1px solid #e2e8f0',
            fontSize: 13, outline: 'none', background: '#f8fafc',
          }}
        />
        <button
          onClick={handleFetch}
          disabled={loading || !url.trim()}
          style={{
            padding: '10px 18px', borderRadius: 8, border: 'none',
            background: !url.trim() || loading ? '#e2e8f0' : GOLD,
            color: !url.trim() || loading ? '#94a3b8' : NAVY,
            fontWeight: 800, fontSize: 13, cursor: !url.trim() || loading ? 'not-allowed' : 'pointer',
            whiteSpace: 'nowrap',
          }}
        >
          {loading ? '⏳ Fetching…' : '+ From URL'}
        </button>
        <button
          onClick={onAddManually}
          style={{
            padding: '10px 16px', borderRadius: 8, border: `1px solid ${NAVY}`,
            background: '#fff', color: NAVY,
            fontWeight: 700, fontSize: 13, cursor: 'pointer', whiteSpace: 'nowrap',
          }}
        >
          ✏️ Add Manually
        </button>
      </div>
      {error && <div style={{ fontSize: 12, color: '#d97706', marginTop: 6 }}>{error}</div>}
    </div>
  );
}

// ─── Editable pick card ────────────────────────────────────────────────────

const EMPTY_FORM = {
  title: '', price_aed: '', bedrooms: '', bathrooms: '', area: '',
  size_sqft: '', property_type: '', image_url: '', images_extra: [],
  notes: '', developer: '', completion_date: '', payment_plan: '',
  highlights: '', listing_url: '',
};

function PickCard({ pick, index, onSave, onDelete, onRefetch }) {
  const [editing, setEditing] = useState(!pick.title);
  const [refetching, setRefetching] = useState(false);
  const [refetchStatus, setRefetchStatus] = useState(null);
  const [uploadingIdx, setUploadingIdx] = useState(null);
  const fileInputRefs = useRef([]);

  const [form, setForm] = useState({
    title: pick.title || '',
    price_aed: pick.price_aed || '',
    bedrooms: pick.bedrooms || '',
    bathrooms: pick.bathrooms || '',
    area: pick.area || '',
    size_sqft: pick.size_sqft || '',
    property_type: pick.property_type || '',
    image_url: pick.image_url || '',
    images_extra: Array.isArray(pick.images_extra) ? pick.images_extra : [],
    notes: pick.notes || '',
    developer: pick.developer || '',
    completion_date: pick.completion_date || '',
    payment_plan: pick.payment_plan || '',
    highlights: pick.highlights || '',
    listing_url: pick.listing_url || '',
  });

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const setImageUrl = (idx, url) => {
    if (idx === 0) {
      set('image_url', url);
    } else {
      setForm(p => {
        const arr = [...(p.images_extra || [])];
        arr[idx - 1] = url;
        return { ...p, images_extra: arr };
      });
    }
  };

  const getImageUrl = (idx) => {
    if (idx === 0) return form.image_url;
    return form.images_extra?.[idx - 1] || '';
  };

  const handleImageUpload = async (e, slotIdx) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingIdx(slotIdx);
    // Reset input so same file can be re-selected
    e.target.value = '';
    try {
      const fd = new FormData();
      fd.append('file', file);
      const r = await api.post('/api/client-reports/upload-image', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      if (r.data.url) setImageUrl(slotIdx, r.data.url);
      else alert(r.data.error || 'Upload failed');
    } catch (err) {
      const msg = err.response?.data?.detail || 'Upload failed — paste an image URL instead';
      alert(msg);
    } finally {
      setUploadingIdx(null);
    }
  };

  const handleRefetch = async () => {
    if (!pick.listing_url) return;
    setRefetching(true);
    setRefetchStatus(null);
    try {
      const r = await api.post('/api/client-reports/fetch-link', { url: pick.listing_url });
      const fresh = r.data;
      const gotSomething = fresh.title || fresh.price_aed || fresh.image_url;
      if (!gotSomething) {
        setRefetchStatus('empty');
        setTimeout(() => setRefetchStatus(null), 4000);
        return;
      }
      const merged = {
        listing_url: pick.listing_url,
        title: fresh.title || form.title,
        price_aed: fresh.price_aed ?? form.price_aed,
        bedrooms: fresh.bedrooms || form.bedrooms,
        bathrooms: fresh.bathrooms || form.bathrooms,
        area: fresh.area || form.area,
        size_sqft: fresh.size_sqft ?? form.size_sqft,
        property_type: fresh.property_type || form.property_type,
        image_url: fresh.image_url || form.image_url,
        images_extra: form.images_extra,
        notes: form.notes,
        developer: form.developer,
        completion_date: form.completion_date,
        payment_plan: form.payment_plan,
        highlights: form.highlights,
      };
      setForm(merged);
      await onRefetch(pick.id, merged);
      setRefetchStatus('ok');
      setTimeout(() => setRefetchStatus(null), 3000);
    } catch {
      setRefetchStatus('error');
      setTimeout(() => setRefetchStatus(null), 4000);
    } finally {
      setRefetching(false);
    }
  };

  const handleSave = () => {
    onSave(pick.id, {
      ...form,
      price_aed: form.price_aed ? parseFloat(String(form.price_aed).replace(/,/g, '')) : null,
      size_sqft: form.size_sqft ? parseFloat(form.size_sqft) : null,
      images_extra: (form.images_extra || []).filter(Boolean),
    });
    setEditing(false);
  };

  const inputS = { padding: '7px 10px', borderRadius: 6, border: '1px solid #e2e8f0', fontSize: 12, outline: 'none', width: '100%', background: '#f8fafc', boxSizing: 'border-box' };
  const labelS = { fontSize: 10, color: '#888', display: 'block', marginBottom: 3, textTransform: 'uppercase', letterSpacing: 0.5 };

  return (
    <div style={{
      background: '#fff', borderRadius: 12, border: '1px solid #eee',
      marginBottom: 10, overflow: 'hidden',
    }}>
      {/* Navy badge */}
      <div style={{ background: NAVY, padding: '5px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 12, fontWeight: 800, color: GOLD }}>#{index + 1}</span>
        <div style={{ display: 'flex', gap: 4 }}>
          {pick.listing_url && (
            <button onClick={handleRefetch} disabled={refetching} title="Re-scrape from URL"
              style={{ padding: '3px 8px', borderRadius: 5, border: 'none', background: 'rgba(255,255,255,0.1)', color: '#fff', fontSize: 11, cursor: refetching ? 'not-allowed' : 'pointer' }}>
              {refetching ? '⏳' : '🔄 Re-fetch'}
            </button>
          )}
          <button onClick={() => setEditing(p => !p)}
            style={{ padding: '3px 8px', borderRadius: 5, border: 'none', background: editing ? 'rgba(201,168,76,0.3)' : 'rgba(255,255,255,0.1)', color: editing ? GOLD : '#fff', fontSize: 11, cursor: 'pointer' }}>
            {editing ? '✓ Done editing' : '✏️ Edit'}
          </button>
          <button onClick={() => onDelete(pick.id)}
            style={{ padding: '3px 8px', borderRadius: 5, border: 'none', background: 'rgba(220,38,38,0.2)', color: '#fca5a5', fontSize: 11, cursor: 'pointer' }}>
            ✕
          </button>
        </div>
      </div>

      {/* Re-fetch status */}
      {refetchStatus && (
        <div style={{
          padding: '6px 14px', fontSize: 12, fontWeight: 600,
          background: refetchStatus === 'ok' ? '#d1fae5' : refetchStatus === 'empty' ? '#fef3c7' : '#fee2e2',
          color: refetchStatus === 'ok' ? '#065f46' : refetchStatus === 'empty' ? '#92400e' : '#991b1b',
        }}>
          {refetchStatus === 'ok' && '✓ Data refreshed successfully'}
          {refetchStatus === 'empty' && '⚠️ Nothing scraped — use a direct single-listing URL, then edit manually'}
          {refetchStatus === 'error' && '✕ Request failed — check connection or try again'}
        </div>
      )}

      {/* Card preview */}
      <div style={{ display: 'flex', gap: 12, padding: '12px 14px', alignItems: 'flex-start' }}>
        {/* Thumbnail + extra images */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3, flexShrink: 0 }}>
          <div style={{ width: 100, height: 72, borderRadius: 8, overflow: 'hidden', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {form.image_url
              ? <img src={form.image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { e.target.style.display = 'none'; }} />
              : <span style={{ fontSize: 28 }}>🏠</span>}
          </div>
          {(form.images_extra || []).filter(Boolean).length > 0 && (
            <div style={{ display: 'flex', gap: 3 }}>
              {(form.images_extra || []).filter(Boolean).slice(0, 4).map((url, ei) => (
                <div key={ei} style={{ width: 22, height: 16, borderRadius: 3, overflow: 'hidden', background: '#f1f5f9' }}>
                  <img src={url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { e.target.style.display = 'none'; }} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, color: '#0d1f3c', fontSize: 14, marginBottom: 2 }}>
            {form.title || <span style={{ color: '#bbb' }}>No title — click Edit to add details</span>}
          </div>
          {form.developer && <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 2 }}>{form.developer}</div>}
          {form.price_aed && <div style={{ fontSize: 15, fontWeight: 900, color: GOLD, marginBottom: 4 }}>{formatPrice(Number(form.price_aed))}</div>}
          <div style={{ fontSize: 12, color: '#888', display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {form.bedrooms && <span>🛏 {form.bedrooms} BR</span>}
            {form.bathrooms && <span>🚿 {form.bathrooms} BA</span>}
            {form.size_sqft && <span>📐 {Number(form.size_sqft).toLocaleString()} sqft</span>}
            {form.area && <span>📍 {form.area}</span>}
            {form.completion_date && <span>🗓 {form.completion_date}</span>}
          </div>
          {form.highlights && <div style={{ fontSize: 11, color: '#0a2342', marginTop: 3 }}>⭐ {form.highlights}</div>}
          {form.notes && <div style={{ fontSize: 11, color: '#64748b', fontStyle: 'italic', marginTop: 3 }}>📝 {form.notes}</div>}
          {pick.listing_url && (
            <a href={pick.listing_url} target="_blank" rel="noopener noreferrer"
              style={{ fontSize: 11, color: '#2563eb', display: 'inline-block', marginTop: 4 }}
              onClick={e => e.stopPropagation()}>View listing →</a>
          )}
        </div>
      </div>

      {/* Inline edit form */}
      {editing && (
        <div style={{ borderTop: '1px solid #f1f5f9', padding: '14px 14px', background: '#fafbfc' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
            <div style={{ gridColumn: '1/-1' }}>
              <label style={labelS}>Property Title *</label>
              <input value={form.title} onChange={e => set('title', e.target.value)} placeholder="e.g. Ocean Crest by Samana" style={inputS} />
            </div>
            <div>
              <label style={labelS}>Developer</label>
              <input value={form.developer} onChange={e => set('developer', e.target.value)} placeholder="e.g. Samana Developers" style={inputS} />
            </div>
            <div>
              <label style={labelS}>Price (AED)</label>
              <input value={form.price_aed} onChange={e => set('price_aed', e.target.value)} placeholder="e.g. 1500000" style={inputS} />
            </div>
            <div>
              <label style={labelS}>Bedrooms</label>
              <input value={form.bedrooms} onChange={e => set('bedrooms', e.target.value)} placeholder="e.g. 2 or Studio" style={inputS} />
            </div>
            <div>
              <label style={labelS}>Bathrooms</label>
              <input value={form.bathrooms} onChange={e => set('bathrooms', e.target.value)} placeholder="e.g. 2" style={inputS} />
            </div>
            <div>
              <label style={labelS}>Area / Community</label>
              <input value={form.area} onChange={e => set('area', e.target.value)} placeholder="e.g. Downtown Dubai" style={inputS} />
            </div>
            <div>
              <label style={labelS}>Size (sqft)</label>
              <input value={form.size_sqft} onChange={e => set('size_sqft', e.target.value)} placeholder="e.g. 1200" style={inputS} />
            </div>
            <div>
              <label style={labelS}>Property Type</label>
              <input value={form.property_type} onChange={e => set('property_type', e.target.value)} placeholder="e.g. Apartment" style={inputS} />
            </div>
            <div>
              <label style={labelS}>Handover / Completion</label>
              <input value={form.completion_date} onChange={e => set('completion_date', e.target.value)} placeholder="e.g. Q4 2026 or Ready" style={inputS} />
            </div>
            <div>
              <label style={labelS}>Payment Plan</label>
              <input value={form.payment_plan} onChange={e => set('payment_plan', e.target.value)} placeholder="e.g. 50/50, 1% monthly" style={inputS} />
            </div>
            <div style={{ gridColumn: '1/-1' }}>
              <label style={labelS}>Highlights (key selling points)</label>
              <input value={form.highlights} onChange={e => set('highlights', e.target.value)} placeholder="e.g. Sea view, Private pool, Smart home system" style={inputS} />
            </div>
            <div style={{ gridColumn: '1/-1' }}>
              <label style={labelS}>Agent Notes (internal — shows in report)</label>
              <input value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Any notes for the client…" style={inputS} />
            </div>
            <div style={{ gridColumn: '1/-1' }}>
              <label style={labelS}>Listing URL (optional)</label>
              <input value={form.listing_url} onChange={e => set('listing_url', e.target.value)} placeholder="https://…" style={inputS} />
            </div>

            {/* Image gallery — up to 5 slots */}
            <div style={{ gridColumn: '1/-1' }}>
              <label style={labelS}>Property Images — up to 5 (first = main photo in report)</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                {[0, 1, 2, 3, 4].map(idx => {
                  const imgUrl = getImageUrl(idx);
                  const isUploading = uploadingIdx === idx;
                  return (
                    <div key={idx} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      {/* Thumbnail preview */}
                      <div style={{ width: 52, height: 40, flexShrink: 0, borderRadius: 6, overflow: 'hidden', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #e2e8f0' }}>
                        {imgUrl
                          ? <img src={imgUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { e.target.style.display = 'none'; }} />
                          : <span style={{ fontSize: 16, opacity: 0.4 }}>🏠</span>
                        }
                      </div>
                      {/* URL input */}
                      <input
                        value={imgUrl}
                        onChange={e => setImageUrl(idx, e.target.value)}
                        placeholder={idx === 0 ? 'Main image URL…' : `Image ${idx + 1} URL (optional)…`}
                        style={{ ...inputS, flex: 1 }}
                      />
                      {/* Upload button */}
                      <button
                        onClick={() => fileInputRefs.current[idx]?.click()}
                        disabled={isUploading}
                        title="Upload photo"
                        style={{ padding: '7px 10px', borderRadius: 6, border: `1px solid ${GOLD}`, background: '#fffbeb', color: NAVY, fontSize: 13, fontWeight: 700, cursor: isUploading ? 'not-allowed' : 'pointer', flexShrink: 0 }}
                      >
                        {isUploading ? '⏳' : '📷'}
                      </button>
                      {/* Clear button */}
                      {imgUrl && (
                        <button
                          onClick={() => setImageUrl(idx, '')}
                          title="Remove"
                          style={{ padding: '7px 8px', borderRadius: 6, border: '1px solid #fee2e2', background: '#fff5f5', color: '#dc2626', fontSize: 12, cursor: 'pointer', flexShrink: 0 }}
                        >✕</button>
                      )}
                      {/* Hidden file input */}
                      <input
                        ref={el => fileInputRefs.current[idx] = el}
                        type="file"
                        accept="image/*"
                        style={{ display: 'none' }}
                        onChange={e => handleImageUpload(e, idx)}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <button onClick={handleSave}
            style={{ padding: '9px 24px', borderRadius: 7, border: 'none', background: NAVY, color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
            Save
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Main component ────────────────────────────────────────────────────────

export default function ClientReports() {
  const [sessions, setSessions] = useState([]);
  const [selected, setSelected] = useState(null);
  const [picks, setPicks] = useState([]);
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [search, setSearch] = useState('');

  const fetchSessions = () => {
    setLoadingSessions(true);
    api.get('/api/client-reports/sessions').then(r => setSessions(r.data)).finally(() => setLoadingSessions(false));
  };

  const fetchPicks = (sessionId) => {
    api.get(`/api/client-reports/sessions/${sessionId}/picks`).then(r => setPicks(r.data));
  };

  useEffect(() => { fetchSessions(); }, []);

  const selectSession = (s) => {
    setSelected(s);
    setPicks([]);
    fetchPicks(s.session_id);
  };

  const handleFetched = async (data) => {
    if (!selected) return;
    try {
      await api.post(`/api/client-reports/sessions/${selected.session_id}/picks`, data);
      fetchPicks(selected.session_id);
      fetchSessions();
    } catch {
      alert('Failed to save pick');
    }
  };

  const handleAddManually = async () => {
    if (!selected) return;
    try {
      await api.post(`/api/client-reports/sessions/${selected.session_id}/picks`, { listing_url: '' });
      fetchPicks(selected.session_id);
      fetchSessions();
    } catch {
      alert('Failed to add');
    }
  };

  const handleSave = async (pickId, updates) => {
    try {
      await api.put(`/api/client-reports/sessions/${selected.session_id}/picks/${pickId}`, updates);
      fetchPicks(selected.session_id);
    } catch {
      alert('Failed to save');
    }
  };

  const handleRefetch = async (pickId, updates) => {
    await api.put(`/api/client-reports/sessions/${selected.session_id}/picks/${pickId}`, {
      ...updates,
      price_aed: updates.price_aed ? parseFloat(String(updates.price_aed).replace(/,/g, '')) : null,
      size_sqft: updates.size_sqft ? parseFloat(updates.size_sqft) : null,
    });
    fetchPicks(selected.session_id);
  };

  const handleDelete = async (pickId) => {
    if (!confirm('Remove this property?')) return;
    await api.delete(`/api/client-reports/sessions/${selected.session_id}/picks/${pickId}`);
    fetchPicks(selected.session_id);
    fetchSessions();
  };

  const handleGeneratePDF = async () => {
    if (!selected) return;
    setGenerating(true);
    try {
      const r = await api.post(`/api/client-reports/sessions/${selected.session_id}/report`, {}, { responseType: 'blob' });
      const url = URL.createObjectURL(new Blob([r.data], { type: 'application/pdf' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = `penta_report_${(selected.client_name || 'client').replace(/\s+/g, '_')}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      const msg = e.response?.data ? await e.response.data.text() : 'Failed to generate report';
      try { alert(JSON.parse(msg).detail); } catch { alert(msg); }
    } finally {
      setGenerating(false);
    }
  };

  const filteredSessions = sessions.filter(s => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (s.client_name || '').toLowerCase().includes(q)
      || (s.preferred_areas || '').toLowerCase().includes(q)
      || (s.property_type || '').toLowerCase().includes(q);
  });

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 16, height: 'calc(100vh - 116px)' }}>

      {/* ── Session list ── */}
      <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ marginBottom: 10 }}>
          <div style={{ fontSize: 18, fontWeight: 800, color: '#0d1f3c', marginBottom: 10 }}>Client Reports</div>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search clients…"
            style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 13, outline: 'none', background: '#fff', boxSizing: 'border-box' }}
          />
        </div>
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {loadingSessions ? (
            <div style={{ color: '#bbb', fontSize: 13, padding: '20px 0', textAlign: 'center' }}>Loading…</div>
          ) : filteredSessions.length === 0 ? (
            <div style={{ color: '#bbb', fontSize: 13, padding: '20px 0', textAlign: 'center' }}>
              {search ? 'No matches' : 'No intake sessions yet'}
            </div>
          ) : filteredSessions.map(s => (
            <SessionRow key={s.session_id} s={s} selected={selected?.session_id === s.session_id} onSelect={selectSession} />
          ))}
        </div>
      </div>

      {/* ── Detail panel ── */}
      {!selected ? (
        <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #eee', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#bbb', flexDirection: 'column', gap: 8 }}>
          <div style={{ fontSize: 36 }}>📋</div>
          <div style={{ fontSize: 14 }}>Select a client to build their report</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {/* Toolbar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div style={{ fontSize: 13, color: '#888' }}>
              {picks.length} {picks.length === 1 ? 'property' : 'properties'} added
            </div>
            <button
              onClick={handleGeneratePDF}
              disabled={generating || picks.length === 0}
              style={{
                padding: '9px 22px', borderRadius: 8, border: 'none',
                background: picks.length === 0 || generating ? '#e2e8f0' : GOLD,
                color: picks.length === 0 || generating ? '#94a3b8' : NAVY,
                fontWeight: 800, fontSize: 13, cursor: picks.length === 0 || generating ? 'not-allowed' : 'pointer',
              }}
            >
              {generating ? '⏳ Generating…' : '📄 Generate PDF Report'}
            </button>
          </div>

          <div style={{ flex: 1, overflowY: 'auto' }}>
            <ClientBrief session={selected} />
            <FetchBar onFetched={handleFetched} onAddManually={handleAddManually} />

            {picks.length === 0 ? (
              <div style={{ background: '#fff', borderRadius: 12, border: '1px dashed #e2e8f0', padding: '32px', textAlign: 'center', color: '#bbb' }}>
                <div style={{ fontSize: 28, marginBottom: 8 }}>🔗</div>
                <div style={{ fontSize: 14 }}>Paste a listing URL or click "Add Manually" above</div>
                <div style={{ fontSize: 12, marginTop: 4 }}>Works with Bayut, PropertyFinder, Reelly and more</div>
              </div>
            ) : picks.map((p, i) => (
              <PickCard key={p.id} pick={p} index={i} onSave={handleSave} onDelete={handleDelete} onRefetch={handleRefetch} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
