import { useEffect, useState } from 'react';
import { useAuth } from '../../AuthContext';
import api from '../../api';

const CATEGORIES = ['training', 'project', 'marketing', 'other'];
const CATEGORY_LABELS = { training: 'Training', project: 'Project', marketing: 'Marketing', other: 'Other' };
const CATEGORY_COLORS = { training: '#16a34a', project: '#0891b2', marketing: '#f59e0b', other: '#888' };

function getYouTubeId(url) {
  if (!url) return null;
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([a-zA-Z0-9_-]{11})/);
  return match ? match[1] : null;
}

export default function Videos() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ title: '', description: '', youtube_url: '', category: 'training' });
  const [saving, setSaving] = useState(false);
  const [playing, setPlaying] = useState(null);

  const fetchVideos = () => {
    const params = category ? { category } : {};
    api.get('/api/agents/videos', { params }).then(r => setVideos(r.data)).finally(() => setLoading(false));
  };

  useEffect(() => { fetchVideos(); }, [category]);

  const openNew = () => {
    setEditing(null);
    setForm({ title: '', description: '', youtube_url: '', category: 'training' });
    setShowForm(true);
  };

  const openEdit = (v) => {
    setEditing(v.id);
    setForm({ title: v.title || '', description: v.description || '', youtube_url: v.youtube_url || '', category: v.category || 'training' });
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editing) {
        await api.put(`/api/agents/videos/${editing}`, form);
      } else {
        await api.post('/api/agents/videos', form);
      }
      setShowForm(false);
      fetchVideos();
    } catch {}
    setSaving(false);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this video?')) return;
    await api.delete(`/api/agents/videos/${id}`);
    fetchVideos();
  };

  const filterBtn = (val, label) => (
    <button
      key={val}
      onClick={() => setCategory(val)}
      style={{
        padding: '7px 16px', borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: 'pointer', border: 'none',
        background: category === val ? '#0A2342' : '#f1f5f9',
        color: category === val ? '#fff' : '#555',
        transition: 'all 0.15s',
      }}
    >
      {label}
    </button>
  );

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 800, color: '#1a1a2e' }}>Video Resources</div>
          <div style={{ fontSize: 13, color: '#888', marginTop: 2 }}>Training, project & marketing videos</div>
        </div>
        {isAdmin && (
          <button onClick={openNew}
            style={{ padding: '10px 20px', background: '#f59e0b', color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
            + Add Video
          </button>
        )}
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        {filterBtn('', 'All')}
        {CATEGORIES.map(c => filterBtn(c, CATEGORY_LABELS[c]))}
      </div>

      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', borderRadius: 16, padding: '32px', width: '100%', maxWidth: 480 }}>
            <div style={{ fontSize: 18, fontWeight: 800, color: '#1a1a2e', marginBottom: 24 }}>{editing ? 'Edit Video' : 'Add Video'}</div>
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Title <span style={{ color: '#dc2626' }}>*</span></label>
                <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 14, outline: 'none', boxSizing: 'border-box' }} />
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>YouTube URL <span style={{ color: '#dc2626' }}>*</span></label>
                <input value={form.youtube_url} onChange={e => setForm(f => ({ ...f, youtube_url: e.target.value }))} required
                  placeholder="https://www.youtube.com/watch?v=..."
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 14, outline: 'none', boxSizing: 'border-box' }} />
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Category</label>
                <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 14, outline: 'none', background: '#fff' }}>
                  {CATEGORIES.map(c => <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>)}
                </select>
              </div>
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Description</label>
                <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2}
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 14, outline: 'none', boxSizing: 'border-box', resize: 'vertical', fontFamily: 'inherit' }} />
              </div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setShowForm(false)}
                  style={{ padding: '10px 20px', background: '#f1f5f9', color: '#555', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
                <button type="submit" disabled={saving}
                  style={{ padding: '10px 24px', background: '#f59e0b', color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
                  {saving ? 'Saving...' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {playing && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }}
          onClick={() => setPlaying(null)}>
          <div onClick={e => e.stopPropagation()} style={{ width: '90%', maxWidth: 800, aspectRatio: '16/9', borderRadius: 12, overflow: 'hidden', position: 'relative' }}>
            <button onClick={() => setPlaying(null)}
              style={{ position: 'absolute', top: -40, right: 0, background: 'none', border: 'none', color: '#fff', fontSize: 28, cursor: 'pointer' }}>×</button>
            <iframe
              src={`https://www.youtube.com/embed/${playing}?autoplay=1`}
              style={{ width: '100%', height: '100%', border: 'none' }}
              allow="autoplay; fullscreen"
              title="Video"
            />
          </div>
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: 60, color: '#888' }}>Loading...</div>
      ) : videos.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60 }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>▶️</div>
          <div style={{ fontSize: 16, fontWeight: 600, color: '#1a1a2e', marginBottom: 6 }}>No videos yet</div>
          {isAdmin && <div style={{ fontSize: 13, color: '#888' }}>Add training, project and marketing videos for the team.</div>}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 }}>
          {videos.map(v => {
            const ytId = getYouTubeId(v.youtube_url);
            const thumb = ytId ? `https://img.youtube.com/vi/${ytId}/mqdefault.jpg` : null;
            return (
              <div key={v.id} style={{ background: '#fff', borderRadius: 14, overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.07)' }}>
                <div
                  onClick={() => ytId && setPlaying(ytId)}
                  style={{ height: 160, background: '#f1f5f9', position: 'relative', cursor: ytId ? 'pointer' : 'default', overflow: 'hidden' }}
                >
                  {thumb
                    ? <img src={thumb} alt={v.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', fontSize: 48, color: '#cbd5e1' }}>▶️</div>
                  }
                  {ytId && (
                    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.3)' }}>
                      <div style={{ width: 52, height: 52, background: 'rgba(255,255,255,0.9)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>▶</div>
                    </div>
                  )}
                </div>
                <div style={{ padding: '14px 16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ flex: 1 }}>
                      <span style={{ fontSize: 10, fontWeight: 700, color: CATEGORY_COLORS[v.category] || '#888', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                        {CATEGORY_LABELS[v.category] || v.category}
                      </span>
                      <div style={{ fontSize: 14, fontWeight: 700, color: '#1a1a2e', marginTop: 4, marginBottom: v.description ? 6 : 0 }}>{v.title}</div>
                      {v.description && <div style={{ fontSize: 12, color: '#888', lineHeight: 1.5 }}>{v.description}</div>}
                    </div>
                    {isAdmin && (
                      <div style={{ display: 'flex', gap: 4, marginLeft: 8 }}>
                        <button onClick={() => openEdit(v)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: '#888' }}>✏️</button>
                        <button onClick={() => handleDelete(v.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: '#888' }}>🗑️</button>
                      </div>
                    )}
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
