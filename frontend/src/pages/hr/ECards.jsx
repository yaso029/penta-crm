import { useEffect, useState } from 'react';
import api from '../../api';

const BASE = import.meta.env.VITE_API_URL || 'https://penta-crm-production.up.railway.app';
const NAVY = '#0A2342';
const GOLD = '#C9A84C';

const EMPTY_FORM = {
  user_id: '', full_name: '', job_title: '', phone: '',
  whatsapp: '', email: '', website: '', linkedin: '', is_active: true,
};

export default function ECards() {
  const [cards, setCards] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);

  const fetchCards = () => api.get('/api/ecards').then(r => setCards(r.data)).finally(() => setLoading(false));
  const fetchUsers = () => api.get('/api/users').then(r => setUsers(r.data)).catch(() => {});

  useEffect(() => { fetchCards(); fetchUsers(); }, []);

  const openNew = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setPhotoFile(null);
    setPhotoPreview(null);
    setShowForm(true);
  };

  const openEdit = (card) => {
    setEditing(card);
    setForm({
      user_id: card.user_id || '',
      full_name: card.full_name,
      job_title: card.job_title || '',
      phone: card.phone || '',
      whatsapp: card.whatsapp || '',
      email: card.email || '',
      website: card.website || '',
      linkedin: card.linkedin || '',
      is_active: card.is_active,
    });
    setPhotoFile(null);
    setPhotoPreview(card.photo_url || null);
    setShowForm(true);
  };

  const handlePhoto = (file) => {
    if (!file) return;
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...form,
        user_id: form.user_id ? parseInt(form.user_id) : null,
      };
      let saved;
      if (editing) {
        const r = await api.put(`/api/ecards/${editing.id}`, payload);
        saved = r.data;
      } else {
        const r = await api.post('/api/ecards', payload);
        saved = r.data;
      }
      if (photoFile) {
        setUploading(true);
        const fd = new FormData();
        fd.append('file', photoFile);
        await api.post(`/api/ecards/${saved.id}/photo`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
        setUploading(false);
      }
      setShowForm(false);
      fetchCards();
    } catch { }
    setSaving(false);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this E-card?')) return;
    await api.delete(`/api/ecards/${id}`);
    fetchCards();
  };

  const cardUrl = (slug) => `${window.location.origin}/card/${slug}`;

  const inp = { width: '100%', padding: '9px 12px', border: '1.5px solid #e0e0e0', borderRadius: 8, fontSize: 13, outline: 'none', boxSizing: 'border-box' };
  const lbl = { display: 'block', fontSize: 11, fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 };

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 800, color: '#1a1a2e' }}>E-Business Cards</div>
          <div style={{ fontSize: 13, color: '#888', marginTop: 2 }}>Create and manage digital business cards for the team</div>
        </div>
        <button onClick={openNew} style={{ padding: '10px 20px', background: NAVY, color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
          + New Card
        </button>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div onClick={() => setShowForm(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: 16, width: '100%', maxWidth: 540, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.25)' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #f0f0f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: 16, fontWeight: 800, color: '#1a1a2e' }}>{editing ? 'Edit Card' : 'New E-Card'}</div>
              <button onClick={() => setShowForm(false)} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#aaa' }}>×</button>
            </div>
            <form onSubmit={handleSubmit} style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>

              {/* Link to system user */}
              <div>
                <label style={lbl}>Link to System User (optional)</label>
                <select value={form.user_id} onChange={e => {
                  const uid = e.target.value;
                  const u = users.find(u => u.id === parseInt(uid));
                  if (u) setForm(f => ({ ...f, user_id: uid, full_name: f.full_name || u.full_name, email: f.email || u.email }));
                  else setForm(f => ({ ...f, user_id: uid }));
                }} style={{ ...inp }}>
                  <option value="">— No link —</option>
                  {users.map(u => <option key={u.id} value={u.id}>{u.full_name} ({u.role})</option>)}
                </select>
              </div>

              {/* Photo */}
              <div>
                <label style={lbl}>Profile Photo</label>
                {photoPreview ? (
                  <div style={{ position: 'relative', display: 'inline-block' }}>
                    <img src={photoPreview} alt="" style={{ width: 80, height: 80, borderRadius: '50%', objectFit: 'cover', border: '2px solid #e0e0e0' }} />
                    <button type="button" onClick={() => { setPhotoFile(null); setPhotoPreview(null); }} style={{ position: 'absolute', top: -4, right: -4, width: 20, height: 20, borderRadius: '50%', background: '#ef4444', border: 'none', color: '#fff', fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
                  </div>
                ) : (
                  <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 14px', border: '1.5px dashed #ccc', borderRadius: 8, cursor: 'pointer', color: '#888', fontSize: 13 }}>
                    📷 Upload Photo
                    <input type="file" accept="image/*" onChange={e => handlePhoto(e.target.files[0])} style={{ display: 'none' }} />
                  </label>
                )}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={lbl}>Full Name *</label>
                  <input required value={form.full_name} onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))} style={inp} />
                </div>
                <div>
                  <label style={lbl}>Job Title</label>
                  <input value={form.job_title} onChange={e => setForm(f => ({ ...f, job_title: e.target.value }))} placeholder="e.g. Senior Broker" style={inp} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={lbl}>Phone</label>
                  <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="+971 50 000 0000" style={inp} />
                </div>
                <div>
                  <label style={lbl}>WhatsApp</label>
                  <input value={form.whatsapp} onChange={e => setForm(f => ({ ...f, whatsapp: e.target.value }))} placeholder="+971 50 000 0000" style={inp} />
                </div>
              </div>

              <div>
                <label style={lbl}>Email</label>
                <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} style={inp} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={lbl}>Website</label>
                  <input value={form.website} onChange={e => setForm(f => ({ ...f, website: e.target.value }))} placeholder="pentadxb.ae" style={inp} />
                </div>
                <div>
                  <label style={lbl}>LinkedIn URL</label>
                  <input value={form.linkedin} onChange={e => setForm(f => ({ ...f, linkedin: e.target.value }))} placeholder="linkedin.com/in/..." style={inp} />
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <input type="checkbox" id="is_active" checked={form.is_active} onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))} />
                <label htmlFor="is_active" style={{ fontSize: 13, color: '#555', cursor: 'pointer' }}>Active (visible to everyone)</label>
              </div>

              <div style={{ display: 'flex', gap: 10, paddingTop: 4 }}>
                <button type="button" onClick={() => setShowForm(false)} style={{ flex: 1, padding: 10, background: '#f5f5f5', border: 'none', borderRadius: 8, fontSize: 13, cursor: 'pointer', fontWeight: 600 }}>Cancel</button>
                <button type="submit" disabled={saving || uploading} style={{ flex: 2, padding: 10, background: NAVY, border: 'none', borderRadius: 8, fontSize: 13, cursor: 'pointer', fontWeight: 700, color: '#fff' }}>
                  {uploading ? 'Uploading photo…' : saving ? 'Saving…' : editing ? 'Save Changes' : 'Create Card'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Cards grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 60, color: '#888' }}>Loading…</div>
      ) : cards.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60 }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>💳</div>
          <div style={{ fontSize: 16, fontWeight: 600, color: '#1a1a2e' }}>No E-cards yet</div>
          <div style={{ fontSize: 13, color: '#888', marginTop: 4 }}>Create the first digital business card for your team.</div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
          {cards.map(card => {
            const initials = card.full_name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
            const url = cardUrl(card.slug);
            return (
              <div key={card.id} style={{ background: '#fff', borderRadius: 14, overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.07)', opacity: card.is_active ? 1 : 0.55 }}>
                {/* Mini banner */}
                <div style={{ height: 6, background: `linear-gradient(90deg, ${NAVY}, ${GOLD})` }} />
                <div style={{ padding: '16px 18px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                    {card.photo_url ? (
                      <img src={card.photo_url} alt="" style={{ width: 52, height: 52, borderRadius: '50%', objectFit: 'cover', border: `2px solid ${GOLD}33`, flexShrink: 0 }} />
                    ) : (
                      <div style={{ width: 52, height: 52, borderRadius: '50%', background: `linear-gradient(135deg, ${NAVY}, #1e3a5f)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 900, color: GOLD, flexShrink: 0 }}>
                        {initials}
                      </div>
                    )}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 15, fontWeight: 800, color: '#1a1a2e', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{card.full_name}</div>
                      {card.job_title && <div style={{ fontSize: 11, color: GOLD, fontWeight: 700, letterSpacing: 0.5, marginTop: 2 }}>{card.job_title}</div>}
                    </div>
                    {!card.is_active && <div style={{ fontSize: 10, fontWeight: 700, color: '#888', background: '#f0f0f0', padding: '2px 8px', borderRadius: 10 }}>Inactive</div>}
                  </div>

                  {card.phone && <div style={{ fontSize: 12, color: '#555', marginBottom: 4 }}>📱 {card.phone}</div>}
                  {card.email && <div style={{ fontSize: 12, color: '#555', marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>✉️ {card.email}</div>}

                  <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <a href={url} target="_blank" rel="noreferrer" style={{ flex: 1, padding: '7px 0', background: '#f4f6fb', border: 'none', borderRadius: 8, fontSize: 11, fontWeight: 700, color: NAVY, textAlign: 'center', textDecoration: 'none', cursor: 'pointer' }}>
                      🔗 View Card
                    </a>
                    <button onClick={() => { navigator.clipboard.writeText(url); }} style={{ flex: 1, padding: '7px 0', background: '#f4f6fb', border: 'none', borderRadius: 8, fontSize: 11, fontWeight: 700, color: '#555', cursor: 'pointer' }}>
                      📋 Copy Link
                    </button>
                    <button onClick={() => openEdit(card)} style={{ width: 32, height: 32, background: '#f4f6fb', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 14 }}>✏️</button>
                    <button onClick={() => handleDelete(card.id)} style={{ width: 32, height: 32, background: '#fff0f0', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 14 }}>🗑️</button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
