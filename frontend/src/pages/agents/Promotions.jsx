import { useEffect, useState } from 'react';
import { useAuth } from '../../AuthContext';
import api from '../../api';

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:8001';

function formatExpiry(iso) {
  if (!iso) return null;
  const d = new Date(iso);
  const now = new Date();
  const expired = d < now;
  const formatted = d.toLocaleDateString('en-AE', { day: 'numeric', month: 'short', year: 'numeric' });
  return { formatted, expired };
}

export default function Promotions() {
  const { user } = useAuth();
  const isAdmin = true; // all users can add promotions
  const [promos, setPromos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: '', description: '', developer: '', discount_percent: '',
    promo_details: '', expires_at: '', image_url: '',
  });

  const fetchPromos = () => {
    api.get('/api/agents/promotions').then(r => setPromos(r.data)).finally(() => setLoading(false));
  };

  useEffect(() => { fetchPromos(); }, []);

  const openNew = () => {
    setEditing(null);
    setForm({ title: '', description: '', developer: '', discount_percent: '', promo_details: '', expires_at: '', image_url: '' });
    setShowForm(true);
  };

  const openEdit = (p) => {
    setEditing(p.id);
    setForm({
      title: p.title || '', description: p.description || '',
      developer: p.developer || '', discount_percent: p.discount_percent ?? '',
      promo_details: p.promo_details || '',
      expires_at: p.expires_at ? p.expires_at.slice(0, 10) : '',
      image_url: p.image_url || '',
    });
    setShowForm(true);
  };

  const handleImageUpload = async (file) => {
    if (!file) return;
    setUploading(true);
    const token = localStorage.getItem('token');
    const fd = new FormData();
    fd.append('file', file);
    try {
      const res = await fetch(`${BASE}/api/agents/upload-image`, {
        method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: fd,
      });
      const data = await res.json();
      if (data.url) setForm(f => ({ ...f, image_url: data.url }));
    } catch {}
    setUploading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    const payload = {
      ...form,
      discount_percent: form.discount_percent !== '' ? parseFloat(form.discount_percent) : null,
      expires_at: form.expires_at || null,
    };
    try {
      if (editing) {
        await api.put(`/api/agents/promotions/${editing}`, payload);
      } else {
        await api.post('/api/agents/promotions', payload);
      }
      setShowForm(false);
      fetchPromos();
    } catch {}
    setSaving(false);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this promotion?')) return;
    await api.delete(`/api/agents/promotions/${id}`);
    fetchPromos();
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 800, color: '#1a1a2e' }}>Promotions</div>
          <div style={{ fontSize: 13, color: '#888', marginTop: 2 }}>Developer discount campaigns & limited-time offers</div>
        </div>
        {isAdmin && (
          <button onClick={openNew}
            style={{ padding: '10px 20px', background: '#e11d48', color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
            + Add Promotion
          </button>
        )}
      </div>

      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', borderRadius: 16, padding: '32px', width: '100%', maxWidth: 540, maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ fontSize: 18, fontWeight: 800, color: '#1a1a2e', marginBottom: 24 }}>{editing ? 'Edit Promotion' : 'New Promotion'}</div>
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Title <span style={{ color: '#dc2626' }}>*</span></label>
                <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 14, outline: 'none', boxSizing: 'border-box' }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Developer</label>
                  <input value={form.developer} onChange={e => setForm(f => ({ ...f, developer: e.target.value }))} placeholder="e.g. Emaar"
                    style={{ width: '100%', padding: '10px 12px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 14, outline: 'none', boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Discount %</label>
                  <input type="number" step="0.1" value={form.discount_percent} onChange={e => setForm(f => ({ ...f, discount_percent: e.target.value }))} placeholder="e.g. 15"
                    style={{ width: '100%', padding: '10px 12px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 14, outline: 'none', boxSizing: 'border-box' }} />
                </div>
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Expires</label>
                <input type="date" value={form.expires_at} onChange={e => setForm(f => ({ ...f, expires_at: e.target.value }))}
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 14, outline: 'none', boxSizing: 'border-box' }} />
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Description</label>
                <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2}
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 14, outline: 'none', boxSizing: 'border-box', resize: 'vertical', fontFamily: 'inherit' }} />
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Promo Details</label>
                <textarea value={form.promo_details} onChange={e => setForm(f => ({ ...f, promo_details: e.target.value }))} rows={3}
                  placeholder="Terms, conditions, applicable units, how to claim..."
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 14, outline: 'none', boxSizing: 'border-box', resize: 'vertical', fontFamily: 'inherit' }} />
              </div>
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Promo Image</label>
                <input type="file" accept="image/*" onChange={e => handleImageUpload(e.target.files[0])} style={{ fontSize: 13 }} />
                {uploading && <div style={{ fontSize: 12, color: '#888', marginTop: 4 }}>Uploading...</div>}
                {form.image_url && <img src={form.image_url} alt="" style={{ marginTop: 8, width: '100%', height: 120, objectFit: 'cover', borderRadius: 8 }} />}
              </div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setShowForm(false)}
                  style={{ padding: '10px 20px', background: '#f1f5f9', color: '#555', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
                <button type="submit" disabled={saving}
                  style={{ padding: '10px 24px', background: '#e11d48', color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
                  {saving ? 'Saving...' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: 60, color: '#888' }}>Loading...</div>
      ) : promos.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60 }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🎯</div>
          <div style={{ fontSize: 16, fontWeight: 600, color: '#1a1a2e', marginBottom: 6 }}>No promotions yet</div>
          {isAdmin && <div style={{ fontSize: 13, color: '#888' }}>Add developer discount campaigns and special offers.</div>}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20 }}>
          {promos.map(p => {
            const expiry = p.expires_at ? formatExpiry(p.expires_at) : null;
            return (
              <div key={p.id} style={{ background: '#fff', borderRadius: 14, overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.07)', opacity: expiry?.expired ? 0.6 : 1 }}>
                {p.image_url && <img src={p.image_url} alt={p.title} style={{ width: '100%', height: 160, objectFit: 'cover' }} />}
                <div style={{ padding: '18px 20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                    <div style={{ flex: 1 }}>
                      {p.discount_percent && (
                        <div style={{ display: 'inline-block', background: '#fef2f2', color: '#e11d48', fontSize: 13, fontWeight: 800, padding: '2px 10px', borderRadius: 20, marginBottom: 6 }}>
                          {p.discount_percent}% OFF
                        </div>
                      )}
                      <div style={{ fontSize: 16, fontWeight: 700, color: '#1a1a2e' }}>{p.title}</div>
                    </div>
                    {isAdmin && (
                      <div style={{ display: 'flex', gap: 4, marginLeft: 8 }}>
                        <button onClick={() => openEdit(p)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, color: '#888' }}>✏️</button>
                        <button onClick={() => handleDelete(p.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, color: '#888' }}>🗑️</button>
                      </div>
                    )}
                  </div>
                  {p.developer && <div style={{ fontSize: 12, color: '#888', marginBottom: 6 }}>🏗 {p.developer}</div>}
                  {expiry && (
                    <div style={{ fontSize: 12, color: expiry.expired ? '#dc2626' : '#f59e0b', fontWeight: 600, marginBottom: 8 }}>
                      {expiry.expired ? '⚠️ Expired' : `⏰ Expires ${expiry.formatted}`}
                    </div>
                  )}
                  {p.description && <div style={{ fontSize: 13, color: '#555', lineHeight: 1.5, marginBottom: p.promo_details ? 10 : 0 }}>{p.description}</div>}
                  {p.promo_details && (
                    <div style={{ fontSize: 12, color: '#888', lineHeight: 1.5, background: '#f8fafc', borderRadius: 6, padding: '8px 10px', marginTop: 8, whiteSpace: 'pre-wrap' }}>
                      {p.promo_details}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
