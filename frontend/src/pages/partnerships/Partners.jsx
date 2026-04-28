import { useEffect, useState, useRef } from 'react';
import api from '../../api';
import toast from 'react-hot-toast';

const NAVY = '#0A2342';
const GOLD = '#C9A84C';
const PURPLE = '#7c3aed';

const PARTNER_TYPES = ['Personal Trainer', 'Car Dealer', 'Interior Designer', 'Financial Advisor', 'HR Manager', 'Hotel Concierge', 'Other'];
const STATUSES = ['New', 'Contacted', 'Active Partner', 'Not Interested', 'Inactive'];

const STATUS_COLORS = {
  'New': '#6366f1', 'Contacted': '#3b82f6', 'Active Partner': '#10b981',
  'Not Interested': '#ef4444', 'Inactive': '#94a3b8',
};

function PartnerModal({ partner, onClose, onSaved }) {
  const isEdit = !!partner;
  const [form, setForm] = useState(partner ? { ...partner } : {
    full_name: '', whatsapp_number: '', email: '', company: '',
    partner_type: 'Other', status: 'New', commission_rate: 0.5, notes: '',
  });
  const [loading, setLoading] = useState(false);
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isEdit) {
        await api.put(`/api/partners/${partner.id}`, form);
        toast.success('Partner updated');
      } else {
        await api.post('/api/partners', form);
        toast.success('Partner added');
      }
      onSaved();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed');
    } finally {
      setLoading(false);
    }
  };

  const inp = { width: '100%', padding: '9px 12px', border: '1.5px solid #e0e0e0', borderRadius: 7, fontSize: 13, outline: 'none', marginBottom: 12, boxSizing: 'border-box' };
  const lbl = { fontSize: 11, fontWeight: 600, color: '#555', display: 'block', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: '#fff', borderRadius: 14, padding: '28px 32px', width: 520, maxHeight: '85vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700 }}>{isEdit ? 'Edit Partner' : 'Add Partner'}</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: '#888' }}>×</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
            <div style={{ gridColumn: 'span 2' }}><label style={lbl}>Full Name *</label><input style={inp} value={form.full_name} onChange={set('full_name')} required /></div>
            <div><label style={lbl}>WhatsApp Number</label><input style={inp} value={form.whatsapp_number} onChange={set('whatsapp_number')} placeholder="+971..." /></div>
            <div><label style={lbl}>Email</label><input style={inp} type="email" value={form.email} onChange={set('email')} /></div>
            <div><label style={lbl}>Company</label><input style={inp} value={form.company} onChange={set('company')} /></div>
            <div>
              <label style={lbl}>Partner Type</label>
              <select style={inp} value={form.partner_type} onChange={set('partner_type')}>
                {PARTNER_TYPES.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label style={lbl}>Status</label>
              <select style={inp} value={form.status} onChange={set('status')}>
                {STATUSES.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div><label style={lbl}>Commission Rate (%)</label><input style={inp} type="number" step="0.1" value={form.commission_rate} onChange={set('commission_rate')} /></div>
            <div style={{ gridColumn: 'span 2' }}><label style={lbl}>Notes</label><textarea style={{ ...inp, minHeight: 70, resize: 'vertical' }} value={form.notes} onChange={set('notes')} /></div>
          </div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 4 }}>
            <button type="button" onClick={onClose} style={{ padding: '9px 20px', border: '1.5px solid #e0e0e0', borderRadius: 7, background: '#fff', cursor: 'pointer', fontSize: 13 }}>Cancel</button>
            <button type="submit" disabled={loading} style={{ padding: '9px 20px', background: NAVY, color: '#fff', border: 'none', borderRadius: 7, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
              {loading ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Partners() {
  const [partners, setPartners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [modal, setModal] = useState(null);
  const fileRef = useRef();

  const fetchPartners = async () => {
    setLoading(true);
    try {
      const params = {};
      if (typeFilter) params.partner_type = typeFilter;
      if (statusFilter) params.status = statusFilter;
      if (search) params.search = search;
      const { data } = await api.get('/api/partners', { params });
      setPartners(data);
    } catch { toast.error('Failed to load partners'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchPartners(); }, [typeFilter, statusFilter]);

  const deletePartner = async (id) => {
    if (!confirm('Delete this partner?')) return;
    try {
      await api.delete(`/api/partners/${id}`);
      toast.success('Deleted');
      fetchPartners();
    } catch { toast.error('Failed'); }
  };

  const handleImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const form = new FormData();
    form.append('file', file);
    try {
      const { data } = await api.post('/api/partners/import', form);
      toast.success(`${data.created} partners imported`);
      fetchPartners();
    } catch (err) { toast.error(err.response?.data?.detail || 'Import failed'); }
    e.target.value = '';
  };

  const handleExport = async () => {
    try {
      const resp = await api.get('/api/partners/export', { responseType: 'blob' });
      const url = URL.createObjectURL(resp.data);
      const a = document.createElement('a'); a.href = url; a.download = 'partners.csv'; a.click();
    } catch { toast.error('Export failed'); }
  };

  const filtered = partners.filter(p =>
    !search || p.full_name.toLowerCase().includes(search.toLowerCase()) ||
    p.whatsapp_number?.includes(search) || p.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#1a1a2e' }}>Partner Contacts</h1>
          <p style={{ color: '#888', fontSize: 14, marginTop: 4 }}>{partners.length} partners total</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={handleExport} style={{ padding: '10px 18px', border: `1.5px solid ${NAVY}`, color: NAVY, background: '#fff', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>Export CSV</button>
          <button onClick={() => fileRef.current.click()} style={{ padding: '10px 18px', border: `1.5px solid ${NAVY}`, color: NAVY, background: '#fff', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>Import CSV</button>
          <button onClick={() => setModal('add')} style={{ padding: '10px 20px', background: NAVY, color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 14 }}>+ Add Partner</button>
          <input ref={fileRef} type="file" accept=".csv" style={{ display: 'none' }} onChange={handleImport} />
        </div>
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search name, phone, email..."
          style={{ flex: 1, minWidth: 200, padding: '9px 14px', border: '1.5px solid #e0e0e0', borderRadius: 8, fontSize: 13, outline: 'none' }} />
        <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}
          style={{ padding: '9px 14px', border: '1.5px solid #e0e0e0', borderRadius: 8, fontSize: 13, outline: 'none', minWidth: 170 }}>
          <option value="">All Types</option>
          {PARTNER_TYPES.map(t => <option key={t}>{t}</option>)}
        </select>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          style={{ padding: '9px 14px', border: '1.5px solid #e0e0e0', borderRadius: 8, fontSize: 13, outline: 'none', minWidth: 150 }}>
          <option value="">All Statuses</option>
          {STATUSES.map(s => <option key={s}>{s}</option>)}
        </select>
        <button onClick={fetchPartners} style={{ padding: '9px 16px', background: '#f5f5f5', border: '1.5px solid #e0e0e0', borderRadius: 8, cursor: 'pointer', fontSize: 13 }}>Search</button>
      </div>

      <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 1px 6px rgba(0,0,0,0.07)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#fafafa', borderBottom: '1px solid #f0f0f0' }}>
              {['Name', 'WhatsApp', 'Email', 'Type', 'Status', 'Referrals', 'Commission', 'Last Contact', 'Actions'].map(h => (
                <th key={h} style={{ padding: '12px 14px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: '#888', textTransform: 'uppercase', letterSpacing: 0.5 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={9} style={{ padding: 40, textAlign: 'center', color: '#aaa' }}>Loading...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={9} style={{ padding: 40, textAlign: 'center', color: '#aaa' }}>No partners found</td></tr>
            ) : filtered.map(p => (
              <tr key={p.id} style={{ borderBottom: '1px solid #f5f5f5' }}
                onMouseEnter={e => e.currentTarget.style.background = '#fafbff'}
                onMouseLeave={e => e.currentTarget.style.background = ''}>
                <td style={{ padding: '12px 14px' }}>
                  <div style={{ fontWeight: 600, fontSize: 13 }}>{p.full_name}</div>
                  {p.company && <div style={{ fontSize: 11, color: '#aaa' }}>{p.company}</div>}
                </td>
                <td style={{ padding: '12px 14px', fontSize: 13, color: '#555' }}>{p.whatsapp_number || '—'}</td>
                <td style={{ padding: '12px 14px', fontSize: 13, color: '#555' }}>{p.email || '—'}</td>
                <td style={{ padding: '12px 14px', fontSize: 12, color: '#555' }}>{p.partner_type}</td>
                <td style={{ padding: '12px 14px' }}>
                  <span style={{ background: `${STATUS_COLORS[p.status]}20`, color: STATUS_COLORS[p.status], borderRadius: 20, padding: '3px 10px', fontSize: 11, fontWeight: 600 }}>
                    {p.status}
                  </span>
                </td>
                <td style={{ padding: '12px 14px', fontSize: 13, color: '#555', textAlign: 'center' }}>{p.total_referrals}</td>
                <td style={{ padding: '12px 14px', fontSize: 13, color: GOLD, fontWeight: 600 }}>
                  {p.total_commission_earned > 0 ? `AED ${p.total_commission_earned.toLocaleString()}` : '—'}
                </td>
                <td style={{ padding: '12px 14px', fontSize: 12, color: '#aaa' }}>
                  {p.last_contacted_at ? new Date(p.last_contacted_at).toLocaleDateString() : '—'}
                </td>
                <td style={{ padding: '12px 14px' }}>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button onClick={() => setModal(p)} style={{ padding: '5px 10px', border: `1.5px solid ${NAVY}`, color: NAVY, background: '#fff', borderRadius: 6, cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>Edit</button>
                    <button onClick={() => deletePartner(p.id)} style={{ padding: '5px 10px', border: '1.5px solid #ef4444', color: '#ef4444', background: '#fff', borderRadius: 6, cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>Delete</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modal && (
        <PartnerModal
          partner={modal === 'add' ? null : modal}
          onClose={() => setModal(null)}
          onSaved={fetchPartners}
        />
      )}
    </div>
  );
}
