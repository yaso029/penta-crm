import { useState, useEffect, useRef } from 'react';
import api from '../../api';
import toast from 'react-hot-toast';

const NAVY = '#0A2342';
const GOLD = '#C9A84C';
const BORDER = '#E2E8F0';

const STATUS_COLORS = {
  active: { bg: '#DCFCE7', color: '#15803D', label: 'Active' },
  on_leave: { bg: '#FEF9C3', color: '#92400E', label: 'On Leave' },
  terminated: { bg: '#FEE2E2', color: '#DC2626', label: 'Terminated' },
};

const EMP_TYPES = [
  { value: 'full_time', label: 'Full Time' },
  { value: 'part_time', label: 'Part Time' },
  { value: 'contract', label: 'Contract' },
];

const NATIONALITIES = [
  { value: '', label: 'Select nationality' },
  { value: 'AE', label: '🇦🇪 UAE' }, { value: 'SA', label: '🇸🇦 Saudi Arabia' },
  { value: 'EG', label: '🇪🇬 Egypt' }, { value: 'JO', label: '🇯🇴 Jordan' },
  { value: 'LB', label: '🇱🇧 Lebanon' }, { value: 'SY', label: '🇸🇾 Syria' },
  { value: 'IQ', label: '🇮🇶 Iraq' }, { value: 'IN', label: '🇮🇳 India' },
  { value: 'PK', label: '🇵🇰 Pakistan' }, { value: 'BD', label: '🇧🇩 Bangladesh' },
  { value: 'LK', label: '🇱🇰 Sri Lanka' }, { value: 'NP', label: '🇳🇵 Nepal' },
  { value: 'PH', label: '🇵🇭 Philippines' }, { value: 'CN', label: '🇨🇳 China' },
  { value: 'TR', label: '🇹🇷 Turkey' }, { value: 'IR', label: '🇮🇷 Iran' },
  { value: 'GB', label: '🇬🇧 United Kingdom' }, { value: 'FR', label: '🇫🇷 France' },
  { value: 'DE', label: '🇩🇪 Germany' }, { value: 'RU', label: '🇷🇺 Russia' },
  { value: 'US', label: '🇺🇸 United States' }, { value: 'CA', label: '🇨🇦 Canada' },
  { value: 'NG', label: '🇳🇬 Nigeria' }, { value: 'KE', label: '🇰🇪 Kenya' },
  { value: 'ET', label: '🇪🇹 Ethiopia' }, { value: 'OTHER', label: '🌍 Other' },
];

const DEPARTMENTS = ['Sales', 'Marketing', 'Operations', 'Finance', 'HR', 'Legal', 'Technology', 'Management', 'Other'];

const EMPTY_FORM = {
  full_name: '', job_title: '', department: '', phone: '', email: '',
  nationality: '', date_of_birth: '', date_joined: '', employment_type: 'full_time',
  status: 'active', emirates_id: '', emirates_id_expiry: '', passport_number: '',
  passport_expiry: '', visa_expiry: '', notes: '',
};

const inp = {
  width: '100%', padding: '10px 12px', border: `1.5px solid ${BORDER}`,
  borderRadius: 8, fontSize: 13, outline: 'none', background: '#fff',
  boxSizing: 'border-box', fontFamily: 'inherit',
};
const lbl = {
  fontSize: 11, fontWeight: 700, color: '#374151', display: 'block',
  marginBottom: 5, textTransform: 'uppercase', letterSpacing: 0.5,
};
const fieldGroup = { marginBottom: 14 };

function Avatar({ src, name, size = 48 }) {
  const initials = (name || '?').split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
  if (src) return <img src={src} alt={name} style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', border: `2px solid ${BORDER}` }} />;
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', background: `linear-gradient(135deg, ${NAVY}, #1a3a5c)`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: '#fff', fontWeight: 800, fontSize: size * 0.33, flexShrink: 0,
      border: `2px solid ${BORDER}`,
    }}>
      {initials}
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{ fontSize: 11, fontWeight: 800, color: GOLD, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 12, paddingBottom: 6, borderBottom: `1px solid ${BORDER}` }}>
        {title}
      </div>
      {children}
    </div>
  );
}

function Grid2({ children }) {
  return <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>{children}</div>;
}

export default function Employees() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [docLabel, setDocLabel] = useState('');
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const photoRef = useRef();
  const docRef = useRef();

  useEffect(() => { fetchEmployees(); }, []);

  async function fetchEmployees() {
    try {
      const { data } = await api.get('/api/hr/employees');
      setEmployees(data);
    } catch { toast.error('Failed to load employees'); }
    finally { setLoading(false); }
  }

  async function fetchEmployee(id) {
    const { data } = await api.get(`/api/hr/employees/${id}`);
    setSelected(data);
  }

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  function openAdd() {
    setForm(EMPTY_FORM);
    setEditMode(false);
    setShowForm(true);
  }

  function openEdit(emp) {
    setForm({
      full_name: emp.full_name || '', job_title: emp.job_title || '',
      department: emp.department || '', phone: emp.phone || '',
      email: emp.email || '', nationality: emp.nationality || '',
      date_of_birth: emp.date_of_birth || '', date_joined: emp.date_joined || '',
      employment_type: emp.employment_type || 'full_time', status: emp.status || 'active',
      emirates_id: emp.emirates_id || '', emirates_id_expiry: emp.emirates_id_expiry || '',
      passport_number: emp.passport_number || '', passport_expiry: emp.passport_expiry || '',
      visa_expiry: emp.visa_expiry || '', notes: emp.notes || '',
    });
    setEditMode(true);
    setShowForm(true);
  }

  async function saveEmployee(e) {
    e.preventDefault();
    setSaving(true);
    try {
      if (editMode && selected) {
        const { data } = await api.put(`/api/hr/employees/${selected.id}`, form);
        setEmployees(prev => prev.map(emp => emp.id === data.id ? data : emp));
        setSelected(data);
        toast.success('Employee updated');
      } else {
        const { data } = await api.post('/api/hr/employees', form);
        setEmployees(prev => [data, ...prev]);
        setSelected(data);
        toast.success('Employee added');
      }
      setShowForm(false);
    } catch { toast.error('Failed to save'); }
    finally { setSaving(false); }
  }

  async function deleteEmployee(emp) {
    if (!window.confirm(`Delete ${emp.full_name}? This cannot be undone.`)) return;
    await api.delete(`/api/hr/employees/${emp.id}`);
    setEmployees(prev => prev.filter(e => e.id !== emp.id));
    if (selected?.id === emp.id) setSelected(null);
    toast.success('Employee deleted');
  }

  async function uploadPhoto(file) {
    if (!selected) return;
    setUploadingPhoto(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const { data } = await api.post(`/api/hr/employees/${selected.id}/photo`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setSelected(prev => ({ ...prev, photo_url: data.photo_url }));
      setEmployees(prev => prev.map(e => e.id === selected.id ? { ...e, photo_url: data.photo_url } : e));
      toast.success('Photo updated');
    } catch { toast.error('Photo upload failed'); }
    finally { setUploadingPhoto(false); }
  }

  async function uploadDocument(file) {
    if (!selected || !docLabel.trim()) { toast.error('Please enter a document label first'); return; }
    setUploadingDoc(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('label', docLabel.trim());
      const { data } = await api.post(`/api/hr/employees/${selected.id}/documents`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setSelected(prev => ({ ...prev, documents: [...(prev.documents || []), data] }));
      setDocLabel('');
      toast.success('Document uploaded');
    } catch { toast.error('Document upload failed'); }
    finally { setUploadingDoc(false); }
  }

  async function deleteDocument(docId) {
    if (!window.confirm('Remove this document?')) return;
    await api.delete(`/api/hr/employees/${selected.id}/documents/${docId}`);
    setSelected(prev => ({ ...prev, documents: prev.documents.filter(d => d.id !== docId) }));
    toast.success('Document removed');
  }

  const filtered = employees.filter(e =>
    e.full_name.toLowerCase().includes(search.toLowerCase()) ||
    (e.job_title || '').toLowerCase().includes(search.toLowerCase()) ||
    (e.department || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ display: 'flex', gap: 24, height: 'calc(100vh - 116px)' }}>

      {/* ── LEFT: Employee List ── */}
      <div style={{ width: 320, flexShrink: 0, display: 'flex', flexDirection: 'column', background: '#fff', borderRadius: 14, border: `1px solid ${BORDER}`, overflow: 'hidden' }}>
        <div style={{ padding: '16px 16px 12px', borderBottom: `1px solid ${BORDER}` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <div>
              <div style={{ fontSize: 16, fontWeight: 800, color: NAVY }}>Employees</div>
              <div style={{ fontSize: 12, color: '#94A3B8' }}>{employees.length} total</div>
            </div>
            <button onClick={openAdd} style={{
              background: NAVY, color: '#fff', border: 'none', borderRadius: 8,
              padding: '8px 14px', fontSize: 13, fontWeight: 700, cursor: 'pointer',
            }}>+ Add</button>
          </div>
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search employees..."
            style={{ ...inp, fontSize: 13, padding: '9px 12px' }}
          />
        </div>

        <div style={{ flex: 1, overflowY: 'auto' }}>
          {loading ? (
            <div style={{ padding: 24, textAlign: 'center', color: '#94A3B8', fontSize: 13 }}>Loading...</div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: 32, textAlign: 'center', color: '#94A3B8', fontSize: 13 }}>
              {employees.length === 0 ? 'No employees yet. Add your first one.' : 'No results.'}
            </div>
          ) : filtered.map(emp => {
            const st = STATUS_COLORS[emp.status] || STATUS_COLORS.active;
            const isActive = selected?.id === emp.id;
            return (
              <div
                key={emp.id}
                onClick={() => fetchEmployee(emp.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px',
                  borderBottom: `1px solid ${BORDER}`, cursor: 'pointer',
                  background: isActive ? '#F0F4FF' : '#fff',
                  borderLeft: isActive ? `3px solid ${NAVY}` : '3px solid transparent',
                  transition: 'background 0.15s',
                }}
              >
                <Avatar src={emp.photo_url} name={emp.full_name} size={42} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: NAVY, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{emp.full_name}</div>
                  <div style={{ fontSize: 12, color: '#6B7280', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{emp.job_title || '—'}</div>
                </div>
                <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 20, background: st.bg, color: st.color, whiteSpace: 'nowrap' }}>
                  {st.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── RIGHT: Employee Detail ── */}
      {!selected ? (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fff', borderRadius: 14, border: `1px solid ${BORDER}` }}>
          <div style={{ textAlign: 'center', color: '#94A3B8' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>👤</div>
            <div style={{ fontSize: 15, fontWeight: 600 }}>Select an employee to view their profile</div>
          </div>
        </div>
      ) : (
        <div style={{ flex: 1, background: '#fff', borderRadius: 14, border: `1px solid ${BORDER}`, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>

          {/* Profile Header */}
          <div style={{ background: `linear-gradient(135deg, ${NAVY} 0%, #1a3a5c 100%)`, padding: '28px 32px', display: 'flex', alignItems: 'flex-end', gap: 20 }}>
            <div style={{ position: 'relative' }}>
              <Avatar src={selected.photo_url} name={selected.full_name} size={80} />
              <button
                onClick={() => photoRef.current.click()}
                disabled={uploadingPhoto}
                style={{
                  position: 'absolute', bottom: 0, right: 0,
                  width: 26, height: 26, borderRadius: '50%',
                  background: GOLD, border: 'none', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13,
                }}
                title="Upload photo"
              >
                {uploadingPhoto ? '⏳' : '📷'}
              </button>
              <input ref={photoRef} type="file" accept="image/*" style={{ display: 'none' }}
                onChange={e => e.target.files[0] && uploadPhoto(e.target.files[0])} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 22, fontWeight: 900, color: '#fff' }}>{selected.full_name}</div>
              <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)', marginTop: 2 }}>{selected.job_title || '—'} {selected.department ? `· ${selected.department}` : ''}</div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => openEdit(selected)} style={{
                background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.25)',
                color: '#fff', borderRadius: 8, padding: '8px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer',
              }}>✏️ Edit</button>
              <button onClick={() => deleteEmployee(selected)} style={{
                background: 'rgba(220,38,38,0.2)', border: '1px solid rgba(220,38,38,0.4)',
                color: '#fca5a5', borderRadius: 8, padding: '8px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer',
              }}>🗑 Delete</button>
            </div>
          </div>

          {/* Content */}
          <div style={{ padding: '28px 32px', flex: 1 }}>

            {/* Status + Type badges */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
              {(() => { const st = STATUS_COLORS[selected.status] || STATUS_COLORS.active; return (
                <span style={{ fontSize: 12, fontWeight: 700, padding: '4px 12px', borderRadius: 20, background: st.bg, color: st.color }}>{st.label}</span>
              ); })()}
              <span style={{ fontSize: 12, fontWeight: 700, padding: '4px 12px', borderRadius: 20, background: '#EFF6FF', color: '#1D4ED8' }}>
                {EMP_TYPES.find(t => t.value === selected.employment_type)?.label || 'Full Time'}
              </span>
            </div>

            {/* Personal Info */}
            <Section title="Personal Information">
              <Grid2>
                <InfoRow label="Phone" value={selected.phone} />
                <InfoRow label="Email" value={selected.email} />
                <InfoRow label="Nationality" value={selected.nationality_label} />
                <InfoRow label="Date of Birth" value={selected.date_of_birth} />
                <InfoRow label="Date Joined" value={selected.date_joined} />
              </Grid2>
            </Section>

            {/* Documents */}
            <Section title="Identity & Visa">
              <Grid2>
                <InfoRow label="Emirates ID" value={selected.emirates_id} />
                <InfoRow label="Emirates ID Expiry" value={selected.emirates_id_expiry} />
                <InfoRow label="Passport Number" value={selected.passport_number} />
                <InfoRow label="Passport Expiry" value={selected.passport_expiry} />
                <InfoRow label="Visa Expiry" value={selected.visa_expiry} />
              </Grid2>
            </Section>

            {selected.notes && (
              <Section title="Notes">
                <p style={{ fontSize: 13, color: '#374151', lineHeight: 1.7, margin: 0, background: '#F8FAFC', padding: '12px 16px', borderRadius: 8, border: `1px solid ${BORDER}` }}>
                  {selected.notes}
                </p>
              </Section>
            )}

            {/* File Documents */}
            <Section title="Documents & Files">
              {/* Upload new doc */}
              <div style={{ background: '#F8FAFC', border: `1.5px dashed ${BORDER}`, borderRadius: 10, padding: '16px', marginBottom: 16 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 8 }}>UPLOAD NEW DOCUMENT</div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input
                    value={docLabel} onChange={e => setDocLabel(e.target.value)}
                    placeholder="Label (e.g. Passport Copy, Contract...)"
                    style={{ ...inp, flex: 1, fontSize: 12 }}
                  />
                  <button
                    onClick={() => docRef.current.click()}
                    disabled={uploadingDoc || !docLabel.trim()}
                    style={{
                      padding: '8px 16px', background: docLabel.trim() ? NAVY : '#E2E8F0',
                      color: docLabel.trim() ? '#fff' : '#9CA3AF',
                      border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 700,
                      cursor: docLabel.trim() ? 'pointer' : 'not-allowed', whiteSpace: 'nowrap',
                    }}
                  >
                    {uploadingDoc ? 'Uploading...' : '📎 Upload File'}
                  </button>
                </div>
                <input ref={docRef} type="file" style={{ display: 'none' }}
                  onChange={e => e.target.files[0] && uploadDocument(e.target.files[0])} />
              </div>

              {/* Doc list */}
              {(selected.documents || []).length === 0 ? (
                <div style={{ fontSize: 13, color: '#94A3B8', textAlign: 'center', padding: '12px 0' }}>No documents uploaded yet.</div>
              ) : (selected.documents || []).map(doc => (
                <div key={doc.id} style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '10px 14px', background: '#fff', border: `1px solid ${BORDER}`,
                  borderRadius: 8, marginBottom: 8,
                }}>
                  <span style={{ fontSize: 20 }}>📄</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: NAVY }}>{doc.label}</div>
                    <div style={{ fontSize: 11, color: '#94A3B8' }}>{doc.file_name}</div>
                  </div>
                  <a href={doc.file_url} target="_blank" rel="noopener noreferrer" style={{
                    fontSize: 12, fontWeight: 600, color: NAVY, background: '#EFF6FF',
                    padding: '5px 12px', borderRadius: 6, textDecoration: 'none',
                  }}>View</a>
                  <button onClick={() => deleteDocument(doc.id)} style={{
                    background: '#FEF2F2', border: 'none', borderRadius: 6,
                    color: '#DC2626', fontSize: 12, cursor: 'pointer', padding: '5px 10px',
                  }}>✕</button>
                </div>
              ))}
            </Section>

          </div>
        </div>
      )}

      {/* ── ADD / EDIT MODAL ── */}
      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#fff', borderRadius: 16, width: 640, maxHeight: '88vh', overflowY: 'auto', boxShadow: '0 24px 64px rgba(0,0,0,0.25)', padding: '28px 32px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: NAVY }}>{editMode ? 'Edit Employee' : 'Add New Employee'}</h2>
              <button onClick={() => setShowForm(false)} style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: '#888' }}>×</button>
            </div>
            <form onSubmit={saveEmployee}>

              <Section title="Basic Info">
                <Grid2>
                  <div style={fieldGroup}>
                    <label style={lbl}>Full Name *</label>
                    <input style={inp} value={form.full_name} onChange={set('full_name')} required />
                  </div>
                  <div style={fieldGroup}>
                    <label style={lbl}>Job Title</label>
                    <input style={inp} value={form.job_title} onChange={set('job_title')} />
                  </div>
                  <div style={fieldGroup}>
                    <label style={lbl}>Department</label>
                    <select style={inp} value={form.department} onChange={set('department')}>
                      <option value="">Select...</option>
                      {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>
                  <div style={fieldGroup}>
                    <label style={lbl}>Status</label>
                    <select style={inp} value={form.status} onChange={set('status')}>
                      <option value="active">Active</option>
                      <option value="on_leave">On Leave</option>
                      <option value="terminated">Terminated</option>
                    </select>
                  </div>
                  <div style={fieldGroup}>
                    <label style={lbl}>Employment Type</label>
                    <select style={inp} value={form.employment_type} onChange={set('employment_type')}>
                      {EMP_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                    </select>
                  </div>
                  <div style={fieldGroup}>
                    <label style={lbl}>Nationality</label>
                    <select style={inp} value={form.nationality} onChange={set('nationality')}>
                      {NATIONALITIES.map(n => <option key={n.value} value={n.value}>{n.label}</option>)}
                    </select>
                  </div>
                </Grid2>
              </Section>

              <Section title="Contact">
                <Grid2>
                  <div style={fieldGroup}>
                    <label style={lbl}>Phone</label>
                    <input style={inp} value={form.phone} onChange={set('phone')} type="tel" />
                  </div>
                  <div style={fieldGroup}>
                    <label style={lbl}>Email</label>
                    <input style={inp} value={form.email} onChange={set('email')} type="email" />
                  </div>
                </Grid2>
              </Section>

              <Section title="Dates">
                <Grid2>
                  <div style={fieldGroup}>
                    <label style={lbl}>Date of Birth</label>
                    <input style={inp} value={form.date_of_birth} onChange={set('date_of_birth')} type="date" />
                  </div>
                  <div style={fieldGroup}>
                    <label style={lbl}>Date Joined</label>
                    <input style={inp} value={form.date_joined} onChange={set('date_joined')} type="date" />
                  </div>
                </Grid2>
              </Section>

              <Section title="Identity & Visa">
                <Grid2>
                  <div style={fieldGroup}>
                    <label style={lbl}>Emirates ID</label>
                    <input style={inp} value={form.emirates_id} onChange={set('emirates_id')} placeholder="784-XXXX-XXXXXXX-X" />
                  </div>
                  <div style={fieldGroup}>
                    <label style={lbl}>Emirates ID Expiry</label>
                    <input style={inp} value={form.emirates_id_expiry} onChange={set('emirates_id_expiry')} type="date" />
                  </div>
                  <div style={fieldGroup}>
                    <label style={lbl}>Passport Number</label>
                    <input style={inp} value={form.passport_number} onChange={set('passport_number')} />
                  </div>
                  <div style={fieldGroup}>
                    <label style={lbl}>Passport Expiry</label>
                    <input style={inp} value={form.passport_expiry} onChange={set('passport_expiry')} type="date" />
                  </div>
                  <div style={fieldGroup}>
                    <label style={lbl}>Visa Expiry</label>
                    <input style={inp} value={form.visa_expiry} onChange={set('visa_expiry')} type="date" />
                  </div>
                </Grid2>
              </Section>

              <Section title="Notes">
                <textarea style={{ ...inp, minHeight: 80, resize: 'vertical' }} value={form.notes} onChange={set('notes')} placeholder="Any additional notes..." />
              </Section>

              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
                <button type="button" onClick={() => setShowForm(false)} style={{ padding: '10px 20px', border: `1.5px solid ${BORDER}`, borderRadius: 8, background: '#fff', cursor: 'pointer', fontSize: 13 }}>Cancel</button>
                <button type="submit" disabled={saving} style={{ padding: '10px 24px', background: NAVY, color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 700 }}>
                  {saving ? 'Saving...' : editMode ? 'Save Changes' : 'Add Employee'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ fontSize: 10, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 3 }}>{label}</div>
      <div style={{ fontSize: 13, fontWeight: 600, color: value ? '#111827' : '#D1D5DB' }}>{value || '—'}</div>
    </div>
  );
}
