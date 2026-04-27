import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import toast from 'react-hot-toast';
import { useAuth } from '../AuthContext';

const NAVY = '#0A2342';
const GOLD = '#C9A84C';

const STAGE_COLORS = {
  new_lead: '#6366f1', contacted: '#3b82f6', follow_up: '#f59e0b',
  no_answer: '#64748b', not_interested: '#f97316', wrong_number: '#ec4899', junk: '#ef4444',
};

const STAGE_LABELS = {
  new_lead: 'New Lead', contacted: 'Contacted', follow_up: 'Follow Up',
  no_answer: 'No Answer', not_interested: 'Not Interested', wrong_number: 'Wrong Number', junk: 'Junk',
};

const SOURCES = ['Meta Ads', 'Website', 'WhatsApp', 'Referral', 'Property Finder', 'Bayut', 'Walk-in', 'Other'];
const STAGES = Object.keys(STAGE_LABELS);

function AddLeadModal({ onClose, onAdded, teamMembers }) {
  const { user } = useAuth();
  const [form, setForm] = useState({ full_name: '', phone: '', email: '', source: 'Other', budget: '', property_type: '', preferred_area: '', notes: '', assigned_to: '' });
  const [loading, setLoading] = useState(false);

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = { ...form, assigned_to: form.assigned_to ? parseInt(form.assigned_to) : undefined };
      const { data } = await api.post('/api/leads', payload);
      onAdded(data);
      toast.success('Lead added!');
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to add lead');
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = { width: '100%', padding: '9px 12px', border: '1.5px solid #e0e0e0', borderRadius: 7, fontSize: 13, outline: 'none', marginBottom: 12 };
  const labelStyle = { fontSize: 11, fontWeight: 600, color: '#555', display: 'block', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: '#fff', borderRadius: 14, padding: '28px 32px', width: 480, maxHeight: '85vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700 }}>Add New Lead</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#888' }}>×</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
            <div><label style={labelStyle}>Full Name *</label><input style={inputStyle} value={form.full_name} onChange={set('full_name')} required /></div>
            <div><label style={labelStyle}>Phone *</label><input style={inputStyle} value={form.phone} onChange={set('phone')} required /></div>
            <div><label style={labelStyle}>Email</label><input style={inputStyle} type="email" value={form.email} onChange={set('email')} /></div>
            <div>
              <label style={labelStyle}>Source</label>
              <select style={inputStyle} value={form.source} onChange={set('source')}>
                {SOURCES.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div><label style={labelStyle}>Budget (AED)</label><input style={inputStyle} value={form.budget} onChange={set('budget')} placeholder="e.g. 2,000,000" /></div>
            <div><label style={labelStyle}>Property Type</label><input style={inputStyle} value={form.property_type} onChange={set('property_type')} placeholder="Apartment, Villa..." /></div>
            <div style={{ gridColumn: 'span 2' }}><label style={labelStyle}>Preferred Area</label><input style={inputStyle} value={form.preferred_area} onChange={set('preferred_area')} placeholder="Downtown, Marina..." /></div>
            {(user?.role === 'admin' || user?.role === 'team_leader') && teamMembers.length > 0 && (
              <div style={{ gridColumn: 'span 2' }}>
                <label style={labelStyle}>Assign To</label>
                <select style={inputStyle} value={form.assigned_to} onChange={set('assigned_to')}>
                  <option value="">Self</option>
                  {teamMembers.map(m => <option key={m.id} value={m.id}>{m.full_name}</option>)}
                </select>
              </div>
            )}
            <div style={{ gridColumn: 'span 2' }}><label style={labelStyle}>Notes</label><textarea style={{ ...inputStyle, minHeight: 70, resize: 'vertical' }} value={form.notes} onChange={set('notes')} /></div>
          </div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 4 }}>
            <button type="button" onClick={onClose} style={{ padding: '9px 20px', border: '1.5px solid #e0e0e0', borderRadius: 7, background: '#fff', cursor: 'pointer', fontSize: 13 }}>Cancel</button>
            <button type="submit" disabled={loading} style={{ padding: '9px 20px', background: NAVY, color: '#fff', border: 'none', borderRadius: 7, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
              {loading ? 'Adding...' : 'Add Lead'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function LeadsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [stageFilter, setStageFilter] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [teamMembers, setTeamMembers] = useState([]);

  useEffect(() => {
    fetchLeads();
    if (user?.role !== 'broker') {
      api.get('/api/users/team').then(r => setTeamMembers(r.data)).catch(() => {});
    }
  }, [stageFilter]);

  const fetchLeads = async () => {
    setLoading(true);
    try {
      const params = {};
      if (stageFilter) params.stage = stageFilter;
      const { data } = await api.get('/api/leads', { params });
      setLeads(data);
    } catch {
      toast.error('Failed to load leads');
    } finally {
      setLoading(false);
    }
  };

  const filtered = leads.filter(l =>
    !search || l.full_name.toLowerCase().includes(search.toLowerCase()) ||
    l.phone?.includes(search) || l.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#1a1a2e' }}>All Leads</h1>
          <p style={{ color: '#888', fontSize: 14, marginTop: 4 }}>{leads.length} leads total</p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          style={{ padding: '10px 20px', background: NAVY, color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 14 }}
        >
          + Add Lead
        </button>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by name, phone, email..."
          style={{ flex: 1, minWidth: 200, padding: '9px 14px', border: '1.5px solid #e0e0e0', borderRadius: 8, fontSize: 13, outline: 'none' }}
        />
        <select
          value={stageFilter}
          onChange={e => setStageFilter(e.target.value)}
          style={{ padding: '9px 14px', border: '1.5px solid #e0e0e0', borderRadius: 8, fontSize: 13, outline: 'none', minWidth: 150 }}
        >
          <option value="">All Stages</option>
          {STAGES.map(s => <option key={s} value={s}>{STAGE_LABELS[s]}</option>)}
        </select>
      </div>

      {/* Table */}
      <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 1px 6px rgba(0,0,0,0.07)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#fafafa', borderBottom: '1px solid #f0f0f0' }}>
              {['Name', 'Phone', 'Source', 'Budget', 'Stage', 'Assigned To', 'Date'].map(h => (
                <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: '#888', textTransform: 'uppercase', letterSpacing: 0.5 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} style={{ padding: 40, textAlign: 'center', color: '#aaa' }}>Loading...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={7} style={{ padding: 40, textAlign: 'center', color: '#aaa' }}>No leads found</td></tr>
            ) : filtered.map(lead => (
              <tr
                key={lead.id}
                onClick={() => navigate(`/leads/${lead.id}`)}
                style={{ borderBottom: '1px solid #f5f5f5', cursor: 'pointer', transition: 'background 0.1s' }}
                onMouseEnter={e => e.currentTarget.style.background = '#fafbff'}
                onMouseLeave={e => e.currentTarget.style.background = ''}
              >
                <td style={{ padding: '12px 16px' }}>
                  <div style={{ fontWeight: 600, fontSize: 13, color: '#1a1a2e' }}>{lead.full_name}</div>
                  {lead.email && <div style={{ fontSize: 11, color: '#aaa', marginTop: 2 }}>{lead.email}</div>}
                </td>
                <td style={{ padding: '12px 16px', fontSize: 13, color: '#555' }}>{lead.phone}</td>
                <td style={{ padding: '12px 16px', fontSize: 13, color: '#555' }}>{lead.source}</td>
                <td style={{ padding: '12px 16px', fontSize: 13, color: GOLD, fontWeight: 600 }}>
                  {lead.budget ? `AED ${Number(lead.budget).toLocaleString()}` : '—'}
                </td>
                <td style={{ padding: '12px 16px' }}>
                  <span style={{
                    background: `${STAGE_COLORS[lead.stage]}20`, color: STAGE_COLORS[lead.stage],
                    borderRadius: 20, padding: '3px 10px', fontSize: 11, fontWeight: 600,
                  }}>
                    {STAGE_LABELS[lead.stage] || lead.stage}
                  </span>
                </td>
                <td style={{ padding: '12px 16px', fontSize: 13, color: '#555' }}>{lead.assigned_to_name || '—'}</td>
                <td style={{ padding: '12px 16px', fontSize: 12, color: '#aaa' }}>
                  {new Date(lead.created_at).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showAdd && (
        <AddLeadModal
          onClose={() => setShowAdd(false)}
          onAdded={lead => setLeads(prev => [lead, ...prev])}
          teamMembers={teamMembers}
        />
      )}
    </div>
  );
}
