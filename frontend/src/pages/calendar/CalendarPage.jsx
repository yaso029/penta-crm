import { useState, useEffect, useRef } from 'react';
import api from '../../api';
import { useAuth } from '../../AuthContext';
import toast from 'react-hot-toast';
import useIsMobile from '../../hooks/useIsMobile';

const NAVY = '#0A2342';
const GOLD = '#C9A84C';
const INDIGO = '#6366f1';

const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];

function getMondayOfWeek(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function getWeekDays(monday) {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(d.getDate() + i);
    return d;
  });
}

function toLocalDateStr(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function fmt12(time) {
  if (!time) return '';
  const [h, m] = time.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  return `${h12}:${String(m).padStart(2, '0')} ${ampm}`;
}

function isToday(date) {
  const t = new Date();
  return date.getFullYear() === t.getFullYear() && date.getMonth() === t.getMonth() && date.getDate() === t.getDate();
}

// ── Add/Edit Event Modal ────────────────────────────────────────────────────
function EventModal({ user, onClose, onSaved, defaultDate }) {
  const [form, setForm] = useState({
    title: '', date: defaultDate || toLocalDateStr(new Date()),
    time_start: '', time_end: '', location: '',
    hosted_by: user?.full_name || '', description: '',
    visibility: 'everyone',
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [saving, setSaving] = useState(false);
  const isAdmin = user?.role === 'admin';

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const pickImage = e => {
    const f = e.target.files[0];
    if (!f) return;
    setImageFile(f);
    setImagePreview(URL.createObjectURL(f));
  };

  const handleSubmit = async e => {
    e.preventDefault();
    if (!form.title.trim() || !form.date) { toast.error('Title and date are required'); return; }
    setSaving(true);
    try {
      const payload = {
        title: form.title,
        date: form.date,
        time_start: form.time_start || null,
        time_end: form.time_end || null,
        location: form.location || null,
        hosted_by: form.hosted_by || null,
        description: form.description || null,
        visibility: isAdmin ? form.visibility : 'everyone',
      };
      const { data: created } = await api.post('/api/calendar/events', payload);
      if (imageFile) {
        const fd = new FormData();
        fd.append('file', imageFile);
        await api.post(`/api/calendar/events/${created.id}/image`, fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      }
      toast.success(isAdmin ? 'Event added!' : 'Event submitted for approval');
      onSaved();
      onClose();
    } catch { toast.error('Failed to save event'); }
    finally { setSaving(false); }
  };

  const inputStyle = { width: '100%', padding: '9px 12px', border: '1.5px solid #e0e0e0', borderRadius: 8, fontSize: 13, outline: 'none', boxSizing: 'border-box' };
  const labelStyle = { fontSize: 11, fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', marginBottom: 4 };

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: 16, width: '100%', maxWidth: 540, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.25)' }}>
        <div style={{ padding: '22px 24px', borderBottom: '1px solid #f0f0f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: 17, fontWeight: 800, color: '#1a1a2e' }}>
            📅 {isAdmin ? 'Add Event' : 'Submit Event for Approval'}
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#aaa' }}>×</button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={labelStyle}>Title *</label>
            <input required value={form.title} onChange={set('title')} placeholder="Event title" style={inputStyle} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={labelStyle}>Date *</label>
              <input required type="date" value={form.date} onChange={set('date')} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Start Time</label>
              <input type="time" value={form.time_start} onChange={set('time_start')} style={inputStyle} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={labelStyle}>End Time</label>
              <input type="time" value={form.time_end} onChange={set('time_end')} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Hosted By</label>
              <input value={form.hosted_by} onChange={set('hosted_by')} placeholder={user?.full_name} style={inputStyle} />
            </div>
          </div>

          <div>
            <label style={labelStyle}>Location</label>
            <input value={form.location} onChange={set('location')} placeholder="Office, Dubai Marina, Online…" style={inputStyle} />
          </div>

          <div>
            <label style={labelStyle}>Description</label>
            <textarea value={form.description} onChange={set('description')} rows={3} placeholder="What's this event about?" style={{ ...inputStyle, resize: 'vertical' }} />
          </div>

          {/* Image upload */}
          <div>
            <label style={labelStyle}>Event Photo (optional)</label>
            {imagePreview ? (
              <div style={{ position: 'relative', display: 'inline-block' }}>
                <img src={imagePreview} alt="preview" style={{ width: '100%', maxHeight: 160, objectFit: 'cover', borderRadius: 8, border: '1.5px solid #e0e0e0' }} />
                <button type="button" onClick={() => { setImageFile(null); setImagePreview(null); }} style={{ position: 'absolute', top: 6, right: 6, background: 'rgba(0,0,0,0.6)', border: 'none', borderRadius: '50%', color: '#fff', width: 24, height: 24, cursor: 'pointer', fontSize: 14 }}>×</button>
              </div>
            ) : (
              <label style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', border: '1.5px dashed #ccc', borderRadius: 8, cursor: 'pointer', color: '#888', fontSize: 13 }}>
                📷 Click to upload photo
                <input type="file" accept="image/*" onChange={pickImage} style={{ display: 'none' }} />
              </label>
            )}
          </div>

          {/* Visibility — admin only */}
          {isAdmin && (
            <div>
              <label style={labelStyle}>Visibility</label>
              <div style={{ display: 'flex', gap: 10 }}>
                {[['everyone', '🌐 Everyone'], ['private', '🔒 Only Me']].map(([val, lbl]) => (
                  <button key={val} type="button" onClick={() => setForm(f => ({ ...f, visibility: val }))}
                    style={{ flex: 1, padding: '9px', borderRadius: 8, border: `2px solid ${form.visibility === val ? INDIGO : '#e0e0e0'}`, background: form.visibility === val ? `${INDIGO}15` : '#fff', color: form.visibility === val ? INDIGO : '#555', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                    {lbl}
                  </button>
                ))}
              </div>
            </div>
          )}

          {!isAdmin && (
            <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 8, padding: '10px 14px', fontSize: 12, color: '#92400e' }}>
              ⚠️ Your event will be reviewed by admin before it appears on the calendar.
            </div>
          )}

          <div style={{ display: 'flex', gap: 10, paddingTop: 4 }}>
            <button type="button" onClick={onClose} style={{ flex: 1, padding: '10px', background: '#f5f5f5', border: 'none', borderRadius: 8, fontSize: 13, cursor: 'pointer', fontWeight: 600, color: '#555' }}>Cancel</button>
            <button type="submit" disabled={saving} style={{ flex: 2, padding: '10px', background: INDIGO, border: 'none', borderRadius: 8, fontSize: 13, cursor: 'pointer', fontWeight: 700, color: '#fff' }}>
              {saving ? 'Saving…' : isAdmin ? 'Add Event' : 'Submit for Approval'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Event Detail Modal ──────────────────────────────────────────────────────
function EventDetailModal({ event, user, onClose, onApprove, onReject, onDelete }) {
  const isAdmin = user?.role === 'admin';
  const isPending = event.status === 'pending';

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: 16, width: '100%', maxWidth: 500, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
        {event.image_url && (
          <div style={{ width: '100%', height: 220, overflow: 'hidden', borderRadius: '16px 16px 0 0' }}>
            <img src={event.image_url} alt={event.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
        )}

        <div style={{ padding: '20px 24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: '#1a1a2e', flex: 1, marginRight: 12 }}>{event.title}</h2>
            <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#aaa', flexShrink: 0 }}>×</button>
          </div>

          {isPending && (
            <div style={{ display: 'inline-block', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 20, padding: '3px 12px', fontSize: 11, fontWeight: 700, color: '#d97706', marginBottom: 12 }}>
              ⏳ Pending Approval
            </div>
          )}
          {event.visibility === 'private' && (
            <div style={{ display: 'inline-block', background: '#f0f4ff', border: '1px solid #c7d2fe', borderRadius: 20, padding: '3px 12px', fontSize: 11, fontWeight: 700, color: INDIGO, marginBottom: 12, marginLeft: 6 }}>
              🔒 Private
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 12 }}>
            <Row icon="📅" label="Date" value={event.date} />
            {event.time_start && <Row icon="🕐" label="Time" value={`${fmt12(event.time_start)}${event.time_end ? ` – ${fmt12(event.time_end)}` : ''}`} />}
            {event.location && <Row icon="📍" label="Location" value={event.location} />}
            {event.hosted_by && <Row icon="👤" label="Hosted By" value={event.hosted_by} />}
            {event.creator_name && <Row icon="✍️" label="Submitted By" value={event.creator_name} />}
            {event.description && (
              <div>
                <div style={{ fontSize: 11, color: '#aaa', textTransform: 'uppercase', fontWeight: 700, letterSpacing: 0.5, marginBottom: 4 }}>Description</div>
                <div style={{ fontSize: 14, color: '#333', lineHeight: 1.6, background: '#f9f9f9', borderRadius: 8, padding: '10px 12px' }}>{event.description}</div>
              </div>
            )}
          </div>

          {isAdmin && isPending && (
            <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
              <button onClick={() => onReject(event.id)} style={{ flex: 1, padding: '10px', background: '#fff', border: '1.5px solid #ef4444', borderRadius: 8, color: '#ef4444', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                ✗ Reject
              </button>
              <button onClick={() => onApprove(event.id)} style={{ flex: 2, padding: '10px', background: '#10b981', border: 'none', borderRadius: 8, color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                ✓ Approve & Publish
              </button>
            </div>
          )}

          {isAdmin && !isPending && (
            <button onClick={() => onDelete(event.id)} style={{ marginTop: 16, width: '100%', padding: '9px', background: '#fff', border: '1.5px solid #ef4444', borderRadius: 8, color: '#ef4444', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
              🗑 Delete Event
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function Row({ icon, label, value }) {
  return (
    <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
      <span style={{ fontSize: 16, flexShrink: 0 }}>{icon}</span>
      <div>
        <div style={{ fontSize: 11, color: '#aaa', textTransform: 'uppercase', fontWeight: 700, letterSpacing: 0.5 }}>{label}</div>
        <div style={{ fontSize: 14, color: '#1a1a2e', marginTop: 1 }}>{value}</div>
      </div>
    </div>
  );
}

// ── Pending Approvals Panel ─────────────────────────────────────────────────
function PendingPanel({ events, onApprove, onReject, onClose }) {
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 200, display: 'flex', justifyContent: 'flex-end' }}>
      <div onClick={e => e.stopPropagation()} style={{ width: 380, background: '#fff', height: '100%', overflowY: 'auto', boxShadow: '-8px 0 30px rgba(0,0,0,0.15)' }}>
        <div style={{ padding: '20px 20px', borderBottom: '1px solid #f0f0f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: 16, fontWeight: 800, color: '#1a1a2e' }}>⏳ Pending Approvals</div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#aaa' }}>×</button>
        </div>
        {events.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#aaa', fontSize: 14 }}>No pending events</div>
        ) : events.map(ev => (
          <div key={ev.id} style={{ padding: '16px 20px', borderBottom: '1px solid #f5f5f5' }}>
            {ev.image_url && <img src={ev.image_url} alt="" style={{ width: '100%', height: 120, objectFit: 'cover', borderRadius: 8, marginBottom: 10 }} />}
            <div style={{ fontWeight: 700, fontSize: 14, color: '#1a1a2e' }}>{ev.title}</div>
            <div style={{ fontSize: 12, color: '#888', marginTop: 2 }}>
              {ev.date}{ev.time_start ? ` · ${fmt12(ev.time_start)}` : ''}{ev.location ? ` · ${ev.location}` : ''}
            </div>
            {ev.hosted_by && <div style={{ fontSize: 12, color: '#888' }}>Hosted by: {ev.hosted_by}</div>}
            {ev.creator_name && <div style={{ fontSize: 11, color: '#bbb', marginTop: 2 }}>Submitted by: {ev.creator_name}</div>}
            {ev.description && <div style={{ fontSize: 12, color: '#555', marginTop: 6, lineHeight: 1.5 }}>{ev.description}</div>}
            <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
              <button onClick={() => onReject(ev.id)} style={{ flex: 1, padding: '8px', background: '#fff', border: '1.5px solid #ef4444', borderRadius: 7, color: '#ef4444', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>Reject</button>
              <button onClick={() => onApprove(ev.id)} style={{ flex: 2, padding: '8px', background: '#10b981', border: 'none', borderRadius: 7, color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>✓ Approve</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Event Card (in calendar cell) ──────────────────────────────────────────
function EventCard({ event, onClick }) {
  const isPending = event.status === 'pending';
  return (
    <div
      onClick={() => onClick(event)}
      style={{
        background: isPending ? '#fffbeb' : '#fff',
        border: `1.5px ${isPending ? 'dashed #fbbf24' : 'solid #e8e8e8'}`,
        borderLeft: `3px solid ${isPending ? '#f59e0b' : INDIGO}`,
        borderRadius: 8, padding: '6px 8px', marginBottom: 6,
        cursor: 'pointer', transition: 'box-shadow 0.12s',
        display: 'flex', gap: 8, alignItems: 'center',
      }}
      onMouseEnter={e => e.currentTarget.style.boxShadow = '0 2px 12px rgba(99,102,241,0.2)'}
      onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}
    >
      {event.image_url ? (
        <img src={event.image_url} alt="" style={{ width: 36, height: 36, borderRadius: 6, objectFit: 'cover', flexShrink: 0 }} />
      ) : (
        <div style={{ width: 36, height: 36, borderRadius: 6, background: isPending ? '#fef3c7' : `${INDIGO}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>
          {isPending ? '⏳' : '📅'}
        </div>
      )}
      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: '#1a1a2e', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{event.title}</div>
        {event.time_start && <div style={{ fontSize: 11, color: '#888', marginTop: 1 }}>{fmt12(event.time_start)}</div>}
        {isPending && <div style={{ fontSize: 10, color: '#d97706', fontWeight: 600 }}>Pending</div>}
      </div>
    </div>
  );
}

// ── Main Page ───────────────────────────────────────────────────────────────
export default function CalendarPage() {
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const isAdmin = user?.role === 'admin';

  const [weekStart, setWeekStart] = useState(() => getMondayOfWeek(new Date()));
  const [events, setEvents] = useState([]);
  const [pendingEvents, setPendingEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showPending, setShowPending] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [selectedDay, setSelectedDay] = useState(() => toLocalDateStr(new Date())); // mobile
  const [clickedDate, setClickedDate] = useState(null);

  const weekDays = getWeekDays(weekStart);
  const fromDate = toLocalDateStr(weekDays[0]);
  const toDate = toLocalDateStr(weekDays[6]);

  const eventsByDate = events.reduce((acc, ev) => {
    if (!acc[ev.date]) acc[ev.date] = [];
    acc[ev.date].push(ev);
    return acc;
  }, {});

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/api/calendar/events', { params: { date_from: fromDate, date_to: toDate } });
      setEvents(data);
    } catch { toast.error('Failed to load events'); }
    finally { setLoading(false); }
  };

  const fetchPending = async () => {
    if (!isAdmin) return;
    try {
      const { data } = await api.get('/api/calendar/events/pending');
      setPendingEvents(data);
    } catch {}
  };

  useEffect(() => { fetchEvents(); }, [weekStart]);
  useEffect(() => { fetchPending(); }, []);

  const prevWeek = () => setWeekStart(d => { const n = new Date(d); n.setDate(n.getDate() - 7); return n; });
  const nextWeek = () => setWeekStart(d => { const n = new Date(d); n.setDate(n.getDate() + 7); return n; });
  const goToday = () => setWeekStart(getMondayOfWeek(new Date()));

  const handleApprove = async (id) => {
    try {
      await api.patch(`/api/calendar/events/${id}/approve`);
      toast.success('Event approved!');
      setPendingEvents(p => p.filter(e => e.id !== id));
      fetchEvents();
      if (selectedEvent?.id === id) setSelectedEvent(prev => ({ ...prev, status: 'approved' }));
    } catch { toast.error('Failed to approve'); }
  };

  const handleReject = async (id) => {
    try {
      await api.patch(`/api/calendar/events/${id}/reject`);
      toast.success('Event rejected');
      setPendingEvents(p => p.filter(e => e.id !== id));
      setEvents(prev => prev.filter(e => e.id !== id));
      if (selectedEvent?.id === id) setSelectedEvent(null);
    } catch { toast.error('Failed to reject'); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this event permanently?')) return;
    try {
      await api.delete(`/api/calendar/events/${id}`);
      toast.success('Event deleted');
      setEvents(prev => prev.filter(e => e.id !== id));
      setSelectedEvent(null);
    } catch { toast.error('Failed to delete'); }
  };

  const handleSaved = () => { fetchEvents(); fetchPending(); };

  // Week label
  const startMonth = MONTH_NAMES[weekDays[0].getMonth()];
  const endMonth = MONTH_NAMES[weekDays[6].getMonth()];
  const weekLabel = startMonth === endMonth
    ? `${startMonth} ${weekDays[0].getDate()} – ${weekDays[6].getDate()}, ${weekDays[6].getFullYear()}`
    : `${startMonth} ${weekDays[0].getDate()} – ${endMonth} ${weekDays[6].getDate()}, ${weekDays[6].getFullYear()}`;

  return (
    <div style={{ maxWidth: '100%' }}>
      {/* Modals */}
      {showAddModal && (
        <EventModal user={user} onClose={() => setShowAddModal(false)} onSaved={handleSaved} defaultDate={clickedDate} />
      )}
      {selectedEvent && (
        <EventDetailModal event={selectedEvent} user={user} onClose={() => setSelectedEvent(null)}
          onApprove={id => { handleApprove(id); setSelectedEvent(null); }}
          onReject={id => { handleReject(id); setSelectedEvent(null); }}
          onDelete={id => { handleDelete(id); }} />
      )}
      {showPending && isAdmin && (
        <PendingPanel events={pendingEvents} onApprove={handleApprove} onReject={handleReject} onClose={() => setShowPending(false)} />
      )}

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 10 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: '#1a1a2e', marginBottom: 2 }}>📅 Events Calendar</h1>
          <p style={{ color: '#888', fontSize: 13 }}>
            {isAdmin ? 'Click a day to add an event, or click an event for details.' : 'View team events. Submit your own for admin approval.'}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {isAdmin && pendingEvents.length > 0 && (
            <button onClick={() => setShowPending(true)} style={{ padding: '9px 16px', background: '#fffbeb', border: '1.5px solid #fbbf24', borderRadius: 8, color: '#d97706', fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
              ⏳ Pending
              <span style={{ background: '#f59e0b', color: '#fff', borderRadius: '50%', width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800 }}>{pendingEvents.length}</span>
            </button>
          )}
          <button onClick={() => { setClickedDate(null); setShowAddModal(true); }} style={{ padding: '9px 18px', background: INDIGO, border: 'none', borderRadius: 8, color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
            + Add Event
          </button>
        </div>
      </div>

      {/* Week navigation */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
        <button onClick={prevWeek} style={{ padding: '7px 14px', background: '#fff', border: '1.5px solid #e0e0e0', borderRadius: 8, fontSize: 13, cursor: 'pointer', fontWeight: 600 }}>‹ Prev</button>
        <div style={{ flex: 1, textAlign: 'center', fontWeight: 700, fontSize: 15, color: '#1a1a2e' }}>{weekLabel}</div>
        <button onClick={goToday} style={{ padding: '7px 14px', background: '#f0f4ff', border: '1.5px solid #c7d2fe', borderRadius: 8, fontSize: 13, cursor: 'pointer', fontWeight: 600, color: INDIGO }}>Today</button>
        <button onClick={nextWeek} style={{ padding: '7px 14px', background: '#fff', border: '1.5px solid #e0e0e0', borderRadius: 8, fontSize: 13, cursor: 'pointer', fontWeight: 600 }}>Next ›</button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 60, color: '#aaa' }}>Loading events…</div>
      ) : isMobile ? (
        /* ── Mobile: day selector + events list ── */
        <div>
          <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 8, marginBottom: 16 }}>
            {weekDays.map(d => {
              const str = toLocalDateStr(d);
              const active = str === selectedDay;
              const today = isToday(d);
              return (
                <button key={str} onClick={() => setSelectedDay(str)} style={{
                  flexShrink: 0, width: 52, padding: '8px 4px', background: active ? INDIGO : today ? '#f0f4ff' : '#fff',
                  border: `1.5px solid ${active ? INDIGO : today ? '#a5b4fc' : '#e0e0e0'}`,
                  borderRadius: 10, cursor: 'pointer', textAlign: 'center',
                }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: active ? '#fff' : '#888', textTransform: 'uppercase' }}>{DAY_NAMES[weekDays.indexOf(d)]}</div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: active ? '#fff' : today ? INDIGO : '#1a1a2e', marginTop: 2 }}>{d.getDate()}</div>
                  {(eventsByDate[str] || []).length > 0 && (
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: active ? '#fff' : INDIGO, margin: '4px auto 0' }} />
                  )}
                </button>
              );
            })}
          </div>

          {isAdmin && (
            <button onClick={() => { setClickedDate(selectedDay); setShowAddModal(true); }} style={{ width: '100%', padding: '10px', background: '#f0f4ff', border: '1.5px dashed #a5b4fc', borderRadius: 8, color: INDIGO, fontSize: 13, fontWeight: 600, cursor: 'pointer', marginBottom: 14 }}>
              + Add event on this day
            </button>
          )}

          <div>
            {(eventsByDate[selectedDay] || []).length === 0 ? (
              <div style={{ textAlign: 'center', padding: '30px 0', color: '#bbb', fontSize: 14 }}>No events on this day</div>
            ) : (eventsByDate[selectedDay] || []).map(ev => (
              <EventCard key={ev.id} event={ev} onClick={setSelectedEvent} />
            ))}
          </div>
        </div>
      ) : (
        /* ── Desktop: 7-column week grid ── */
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 8 }}>
          {weekDays.map((d, i) => {
            const str = toLocalDateStr(d);
            const today = isToday(d);
            const dayEvents = eventsByDate[str] || [];
            return (
              <div key={str} style={{ background: today ? '#f5f3ff' : '#fff', borderRadius: 12, border: `1.5px solid ${today ? '#c4b5fd' : '#e8e8e8'}`, overflow: 'hidden', minHeight: 320 }}>
                {/* Day header */}
                <div
                  onClick={() => { if (isAdmin) { setClickedDate(str); setShowAddModal(true); } }}
                  style={{ padding: '12px 10px 10px', borderBottom: '1px solid #f0f0f0', background: today ? `${INDIGO}10` : 'transparent', cursor: isAdmin ? 'pointer' : 'default' }}
                >
                  <div style={{ fontSize: 10, fontWeight: 700, color: today ? INDIGO : '#aaa', textTransform: 'uppercase', letterSpacing: 0.8 }}>{DAY_NAMES[i]}</div>
                  <div style={{ fontSize: 22, fontWeight: 900, color: today ? INDIGO : '#1a1a2e', lineHeight: 1 }}>{d.getDate()}</div>
                  {isAdmin && <div style={{ fontSize: 9, color: today ? INDIGO : '#bbb', marginTop: 2 }}>+ add event</div>}
                </div>

                {/* Events */}
                <div style={{ padding: '8px 8px', overflowY: 'auto', maxHeight: 400 }}>
                  {dayEvents.map(ev => (
                    <EventCard key={ev.id} event={ev} onClick={setSelectedEvent} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
