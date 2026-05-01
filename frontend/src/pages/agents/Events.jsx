import { useEffect, useState } from 'react';
import { useAuth } from '../../AuthContext';
import api from '../../api';

const EVENT_TYPES = ['developer_briefing', 'company_meeting', 'training', 'other'];
const EVENT_TYPE_LABELS = {
  developer_briefing: 'Developer Briefing',
  company_meeting: 'Company Meeting',
  training: 'Training',
  other: 'Other',
};
const EVENT_TYPE_COLORS = {
  developer_briefing: '#7c3aed',
  company_meeting: '#0891b2',
  training: '#16a34a',
  other: '#888',
};

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:8001';

function formatDate(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('en-AE', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function Events() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', event_type: 'other', event_date: '', location: '', image_url: '' });
  const [saving, setSaving] = useState(false);

  const fetchEvents = () => {
    api.get('/api/agents/events').then(r => setEvents(r.data)).finally(() => setLoading(false));
  };

  useEffect(() => { fetchEvents(); }, []);

  const openNew = () => {
    setEditing(null);
    setForm({ title: '', description: '', event_type: 'other', event_date: '', location: '', image_url: '' });
    setShowForm(true);
  };

  const openEdit = (ev) => {
    setEditing(ev.id);
    setForm({
      title: ev.title || '', description: ev.description || '',
      event_type: ev.event_type || 'other',
      event_date: ev.event_date ? ev.event_date.slice(0, 16) : '',
      location: ev.location || '', image_url: ev.image_url || '',
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
    const payload = { ...form, event_date: form.event_date || null };
    try {
      if (editing) {
        await api.put(`/api/agents/events/${editing}`, payload);
      } else {
        await api.post('/api/agents/events', payload);
      }
      setShowForm(false);
      fetchEvents();
    } catch {}
    setSaving(false);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this event?')) return;
    await api.delete(`/api/agents/events/${id}`);
    fetchEvents();
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 800, color: '#1a1a2e' }}>Events</div>
          <div style={{ fontSize: 13, color: '#888', marginTop: 2 }}>Developer briefings, meetings & training sessions</div>
        </div>
        {isAdmin && (
          <button
            onClick={openNew}
            style={{ padding: '10px 20px', background: '#7c3aed', color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}
          >
            + Add Event
          </button>
        )}
      </div>

      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', borderRadius: 16, padding: '32px', width: '100%', maxWidth: 540, maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ fontSize: 18, fontWeight: 800, color: '#1a1a2e', marginBottom: 24 }}>{editing ? 'Edit Event' : 'New Event'}</div>
            <form onSubmit={handleSubmit}>
              {[
                { label: 'Title', key: 'title', required: true },
                { label: 'Location', key: 'location' },
              ].map(({ label, key, required }) => (
                <div key={key} style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>{label}{required && <span style={{ color: '#dc2626' }}>*</span>}</label>
                  <input value={form[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} required={required}
                    style={{ width: '100%', padding: '10px 12px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 14, outline: 'none', boxSizing: 'border-box' }} />
                </div>
              ))}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Type</label>
                  <select value={form.event_type} onChange={e => setForm(f => ({ ...f, event_type: e.target.value }))}
                    style={{ width: '100%', padding: '10px 12px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 14, outline: 'none', background: '#fff' }}>
                    {EVENT_TYPES.map(t => <option key={t} value={t}>{EVENT_TYPE_LABELS[t]}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Date & Time</label>
                  <input type="datetime-local" value={form.event_date} onChange={e => setForm(f => ({ ...f, event_date: e.target.value }))}
                    style={{ width: '100%', padding: '10px 12px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 14, outline: 'none', boxSizing: 'border-box' }} />
                </div>
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Description</label>
                <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={3}
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 14, outline: 'none', boxSizing: 'border-box', resize: 'vertical', fontFamily: 'inherit' }} />
              </div>
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Event Image</label>
                <input type="file" accept="image/*" onChange={e => handleImageUpload(e.target.files[0])} style={{ fontSize: 13 }} />
                {uploading && <div style={{ fontSize: 12, color: '#888', marginTop: 4 }}>Uploading...</div>}
                {form.image_url && <img src={form.image_url} alt="" style={{ marginTop: 8, width: '100%', height: 140, objectFit: 'cover', borderRadius: 8 }} />}
              </div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setShowForm(false)}
                  style={{ padding: '10px 20px', background: '#f1f5f9', color: '#555', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
                  Cancel
                </button>
                <button type="submit" disabled={saving}
                  style={{ padding: '10px 24px', background: '#7c3aed', color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
                  {saving ? 'Saving...' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: 60, color: '#888' }}>Loading...</div>
      ) : events.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60 }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>📅</div>
          <div style={{ fontSize: 16, fontWeight: 600, color: '#1a1a2e', marginBottom: 6 }}>No events yet</div>
          {isAdmin && <div style={{ fontSize: 13, color: '#888' }}>Add events for developer briefings, meetings and training sessions.</div>}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20 }}>
          {events.map(ev => (
            <div key={ev.id} style={{ background: '#fff', borderRadius: 14, overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.07)', borderTop: `4px solid ${EVENT_TYPE_COLORS[ev.event_type] || '#888'}` }}>
              {ev.image_url && <img src={ev.image_url} alt={ev.title} style={{ width: '100%', height: 160, objectFit: 'cover' }} />}
              <div style={{ padding: '18px 20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: EVENT_TYPE_COLORS[ev.event_type] || '#888', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    {EVENT_TYPE_LABELS[ev.event_type] || ev.event_type}
                  </span>
                  {isAdmin && (
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button onClick={() => openEdit(ev)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, color: '#888' }}>✏️</button>
                      <button onClick={() => handleDelete(ev.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, color: '#888' }}>🗑️</button>
                    </div>
                  )}
                </div>
                <div style={{ fontSize: 16, fontWeight: 700, color: '#1a1a2e', marginBottom: 6 }}>{ev.title}</div>
                {ev.event_date && <div style={{ fontSize: 12, color: '#888', marginBottom: 4 }}>📅 {formatDate(ev.event_date)}</div>}
                {ev.location && <div style={{ fontSize: 12, color: '#888', marginBottom: 8 }}>📍 {ev.location}</div>}
                {ev.description && <div style={{ fontSize: 13, color: '#555', lineHeight: 1.5 }}>{ev.description}</div>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
