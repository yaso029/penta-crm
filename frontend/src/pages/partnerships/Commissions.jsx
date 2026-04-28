import { useEffect, useState } from 'react';
import api from '../../api';
import toast from 'react-hot-toast';

const NAVY = '#0A2342';
const GOLD = '#C9A84C';

const STATUS_COLORS = { pending: '#f59e0b', closed: '#3b82f6', paid: '#10b981' };

function CommissionModal({ commission, partners, onClose, onSaved }) {
  const isEdit = !!commission;
  const [form, setForm] = useState(commission ? {
    partner_id: commission.partner_id,
    referred_client_name: commission.referred_client_name || '',
    property_value: commission.property_value || 0,
    commission_rate: commission.commission_rate || 0.5,
    notes: commission.notes || '',
    status: commission.status || 'pending',
  } : {
    partner_id: '', referred_client_name: '', property_value: 0, commission_rate: 0.5, notes: '', status: 'pending',
  });
  const [loading, setLoading] = useState(false);
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));
  const estimated = ((parseFloat(form.property_value) || 0) * (parseFloat(form.commission_rate) || 0) / 100).toLocaleString();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isEdit) {
        await api.put(`/api/commissions/${commission.id}`, form);
      } else {
        await api.post('/api/commissions', { ...form, partner_id: parseInt(form.partner_id) });
      }
      toast.success(isEdit ? 'Updated' : 'Commission created');
      onSaved();
      onClose();
    } catch (err) { toast.error(err.response?.data?.detail || 'Failed'); }
    finally { setLoading(false); }
  };

  const inp = { width: '100%', padding: '9px 12px', border: '1.5px solid #e0e0e0', borderRadius: 7, fontSize: 13, outline: 'none', marginBottom: 12, boxSizing: 'border-box' };
  const lbl = { fontSize: 11, fontWeight: 600, color: '#555', display: 'block', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: '#fff', borderRadius: 14, padding: '28px 32px', width: 480, boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700 }}>{isEdit ? 'Edit Commission' : 'Add Commission'}</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: '#888' }}>×</button>
        </div>
        <form onSubmit={handleSubmit}>
          <label style={lbl}>Partner *</label>
          <select style={inp} value={form.partner_id} onChange={set('partner_id')} required>
            <option value="">Select partner...</option>
            {partners.map(p => <option key={p.id} value={p.id}>{p.full_name}</option>)}
          </select>
          <label style={lbl}>Referred Client Name</label>
          <input style={inp} value={form.referred_client_name} onChange={set('referred_client_name')} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={lbl}>Property Value (AED)</label>
              <input style={inp} type="number" value={form.property_value} onChange={set('property_value')} />
            </div>
            <div>
              <label style={lbl}>Commission Rate (%)</label>
              <input style={inp} type="number" step="0.01" value={form.commission_rate} onChange={set('commission_rate')} />
            </div>
          </div>
          <div style={{ background: '#fef3c7', borderRadius: 8, padding: '10px 14px', fontSize: 13, fontWeight: 700, color: '#92400e', marginBottom: 12 }}>
            Estimated Commission: AED {estimated}
          </div>
          <label style={lbl}>Status</label>
          <select style={inp} value={form.status} onChange={set('status')}>
            <option value="pending">Pending</option>
            <option value="closed">Closed</option>
            <option value="paid">Paid</option>
          </select>
          <label style={lbl}>Notes</label>
          <textarea style={{ ...inp, minHeight: 60, resize: 'vertical' }} value={form.notes} onChange={set('notes')} />
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 4 }}>
            <button type="button" onClick={onClose} style={{ padding: '9px 18px', border: '1.5px solid #e0e0e0', borderRadius: 7, background: '#fff', cursor: 'pointer', fontSize: 13 }}>Cancel</button>
            <button type="submit" disabled={loading} style={{ padding: '9px 18px', background: NAVY, color: '#fff', border: 'none', borderRadius: 7, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
              {loading ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Commissions() {
  const [commissions, setCommissions] = useState([]);
  const [partners, setPartners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [c, p] = await Promise.all([
        api.get('/api/commissions').then(r => r.data),
        api.get('/api/partners').then(r => r.data),
      ]);
      setCommissions(c);
      setPartners(p);
    } catch { toast.error('Failed to load'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchAll(); }, []);

  const markPaid = async (id) => {
    try {
      await api.put(`/api/commissions/${id}/paid`);
      toast.success('Marked as paid');
      fetchAll();
    } catch { toast.error('Failed'); }
  };

  const totalOwed = commissions.filter(c => c.status !== 'paid').reduce((s, c) => s + (c.commission_amount || 0), 0);
  const totalPaid = commissions.filter(c => c.status === 'paid').reduce((s, c) => s + (c.commission_amount || 0), 0);
  const now = new Date();
  const thisMonth = commissions.filter(c => {
    const d = new Date(c.created_at);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).reduce((s, c) => s + (c.commission_amount || 0), 0);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#1a1a2e' }}>Commission Tracker</h1>
        <button onClick={() => setModal('add')} style={{ padding: '10px 20px', background: NAVY, color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 14 }}>
          + Add Commission
        </button>
      </div>

      {/* Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 28 }}>
        {[
          { label: 'Total Owed', value: `AED ${totalOwed.toLocaleString()}`, color: '#f59e0b', bg: '#fef3c7' },
          { label: 'Total Paid', value: `AED ${totalPaid.toLocaleString()}`, color: '#10b981', bg: '#dcfce7' },
          { label: 'This Month', value: `AED ${thisMonth.toLocaleString()}`, color: NAVY, bg: '#eff6ff' },
        ].map(s => (
          <div key={s.label} style={{ background: '#fff', borderRadius: 12, padding: '20px 24px', boxShadow: '0 1px 6px rgba(0,0,0,0.07)', borderTop: `4px solid ${s.color}` }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: '#888', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>{s.label}</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 1px 6px rgba(0,0,0,0.07)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#fafafa', borderBottom: '1px solid #f0f0f0' }}>
              {['Partner', 'Client', 'Property Value', 'Rate', 'Commission', 'Status', 'Paid On', 'Actions'].map(h => (
                <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: '#888', textTransform: 'uppercase', letterSpacing: 0.5 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} style={{ padding: 40, textAlign: 'center', color: '#aaa' }}>Loading...</td></tr>
            ) : commissions.length === 0 ? (
              <tr><td colSpan={8} style={{ padding: 40, textAlign: 'center', color: '#aaa' }}>No commissions yet</td></tr>
            ) : commissions.map(c => (
              <tr key={c.id} style={{ borderBottom: '1px solid #f5f5f5' }}>
                <td style={{ padding: '12px 16px', fontWeight: 600, fontSize: 13 }}>{c.partner_name}</td>
                <td style={{ padding: '12px 16px', fontSize: 13, color: '#555' }}>{c.referred_client_name || '—'}</td>
                <td style={{ padding: '12px 16px', fontSize: 13, color: '#555' }}>
                  {c.property_value ? `AED ${Number(c.property_value).toLocaleString()}` : '—'}
                </td>
                <td style={{ padding: '12px 16px', fontSize: 13, color: '#555' }}>{c.commission_rate}%</td>
                <td style={{ padding: '12px 16px', fontSize: 13, fontWeight: 700, color: GOLD }}>
                  AED {Number(c.commission_amount).toLocaleString()}
                </td>
                <td style={{ padding: '12px 16px' }}>
                  <span style={{ background: `${STATUS_COLORS[c.status]}20`, color: STATUS_COLORS[c.status], borderRadius: 20, padding: '3px 10px', fontSize: 11, fontWeight: 600, textTransform: 'capitalize' }}>
                    {c.status}
                  </span>
                </td>
                <td style={{ padding: '12px 16px', fontSize: 12, color: '#aaa' }}>
                  {c.paid_at ? new Date(c.paid_at).toLocaleDateString() : '—'}
                </td>
                <td style={{ padding: '12px 16px' }}>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button onClick={() => setModal(c)} style={{ padding: '5px 10px', border: `1.5px solid ${NAVY}`, color: NAVY, background: '#fff', borderRadius: 6, cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>Edit</button>
                    {c.status !== 'paid' && (
                      <button onClick={() => markPaid(c.id)} style={{ padding: '5px 10px', border: '1.5px solid #10b981', color: '#10b981', background: '#fff', borderRadius: 6, cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>Mark Paid</button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modal && (
        <CommissionModal
          commission={modal === 'add' ? null : modal}
          partners={partners}
          onClose={() => setModal(null)}
          onSaved={fetchAll}
        />
      )}
    </div>
  );
}
