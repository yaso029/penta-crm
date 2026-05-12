import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api';
import toast from 'react-hot-toast';
import { useAuth } from '../AuthContext';
import useIsMobile from '../hooks/useIsMobile';

const NAVY = '#0A2342';
const GOLD = '#C9A84C';

const STAGES = [
  { key: 'new_lead', label: 'New Lead', color: '#6366f1' },
  { key: 'follow_up', label: 'Follow Up', color: '#f59e0b' },
  { key: 'no_answer', label: 'No Answer', color: '#64748b' },
  { key: 'pre_meeting', label: 'Pre Meeting', color: '#8b5cf6' },
  { key: 'meeting_done', label: 'Meeting Done', color: '#06b6d4' },
  { key: 'deal_closed', label: 'Deal Closed', color: '#10b981' },
  { key: 'not_interested', label: 'Not Interested', color: '#f97316' },
  { key: 'wrong_number', label: 'Wrong Number', color: '#ec4899' },
  { key: 'junk', label: 'Junk', color: '#ef4444' },
];

const ACTIVITY_ICONS = {
  call: '📞', email: '✉️', meeting: '🤝', viewing: '🏠',
  note: '📝', whatsapp: '💬', stage_change: '🔄', assignment: '👤',
};

const ACTIVITY_TYPES = ['call', 'email', 'meeting', 'viewing', 'whatsapp', 'note'];

export default function LeadDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const [lead, setLead] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actText, setActText] = useState('');
  const [actType, setActType] = useState('note');
  const [addingAct, setAddingAct] = useState(false);
  const [teamMembers, setTeamMembers] = useState([]);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({});

  useEffect(() => {
    fetchLead();
    api.get('/api/users/team').then(r => setTeamMembers(r.data)).catch(() => {});
  }, [id]);

  const fetchLead = async () => {
    try {
      const { data } = await api.get(`/api/leads/${id}`);
      setLead(data);
      setEditForm({ notes: data.notes || '', budget: data.budget || '', preferred_area: data.preferred_area || '', property_type: data.property_type || '' });
    } catch {
      toast.error('Lead not found');
      navigate('/crm/leads');
    } finally {
      setLoading(false);
    }
  };

  const updateStage = async (stage) => {
    try {
      const { data } = await api.patch(`/api/leads/${id}/stage`, { stage });
      setLead(prev => ({ ...prev, stage: data.stage, activities: data.activities || prev.activities }));
      await fetchLead();
      toast.success('Stage updated');
    } catch { toast.error('Failed to update stage'); }
  };

  const addActivity = async (e) => {
    e.preventDefault();
    if (!actText.trim()) return;
    setAddingAct(true);
    try {
      const { data } = await api.post(`/api/leads/${id}/activities`, { type: actType, content: actText });
      setLead(prev => ({ ...prev, activities: [data, ...(prev.activities || [])] }));
      setActText('');
      toast.success('Activity logged');
    } catch { toast.error('Failed to log activity'); }
    finally { setAddingAct(false); }
  };

  const assignTo = async (brokerId) => {
    try {
      await api.patch(`/api/leads/${id}/assign`, { broker_id: parseInt(brokerId) });
      await fetchLead();
      toast.success('Lead reassigned');
    } catch { toast.error('Failed to assign'); }
  };

  const saveEdit = async () => {
    try {
      await api.put(`/api/leads/${id}`, editForm);
      await fetchLead();
      setEditing(false);
      toast.success('Lead updated');
    } catch { toast.error('Failed to update'); }
  };

  const deleteLead = async () => {
    if (!window.confirm(`Delete "${lead.full_name}" permanently? This cannot be undone.`)) return;
    try {
      await api.delete(`/api/leads/${id}`);
      toast.success('Lead deleted');
      navigate('/crm/leads');
    } catch { toast.error('Failed to delete lead'); }
  };

  if (loading) return <div style={{ padding: 40, color: '#888' }}>Loading...</div>;
  if (!lead) return null;

  const currentStage = STAGES.find(s => s.key === lead.stage) || STAGES[0];

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
        <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', color: '#888', flexShrink: 0 }}>←</button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h1 style={{ fontSize: isMobile ? 17 : 22, fontWeight: 700, color: '#1a1a2e', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{lead.full_name}</h1>
          <div style={{ display: 'flex', gap: 8, marginTop: 4, alignItems: 'center', flexWrap: 'wrap' }}>
            <span style={{
              background: `${currentStage.color}20`, color: currentStage.color,
              borderRadius: 20, padding: '3px 12px', fontSize: 12, fontWeight: 600,
            }}>
              {currentStage.label}
            </span>
            <span style={{ fontSize: 12, color: '#aaa' }}>Added {new Date(lead.created_at).toLocaleDateString()}</span>
          </div>
        </div>
        {user?.email === 'yaso@pentacrm.com' && (
          <button
            onClick={deleteLead}
            style={{
              flexShrink: 0, padding: '7px 14px', background: '#fff',
              border: '1.5px solid #ef4444', borderRadius: 8,
              color: '#ef4444', fontSize: 12, fontWeight: 700, cursor: 'pointer',
            }}
          >
            🗑 Delete
          </button>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 380px', gap: 16 }}>
        {/* Left column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Stage pipeline */}
          <div style={{ background: '#fff', borderRadius: 12, padding: '20px 24px', boxShadow: '0 1px 6px rgba(0,0,0,0.07)' }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 14, color: '#555' }}>Move Stage</h3>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {STAGES.map(s => (
                <button
                  key={s.key}
                  onClick={() => s.key !== lead.stage && updateStage(s.key)}
                  style={{
                    padding: '7px 14px', borderRadius: 20, border: `2px solid ${s.color}`,
                    background: lead.stage === s.key ? s.color : 'transparent',
                    color: lead.stage === s.key ? '#fff' : s.color,
                    fontSize: 12, fontWeight: 600, cursor: lead.stage === s.key ? 'default' : 'pointer',
                    transition: 'all 0.15s',
                  }}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Contact & details */}
          <div style={{ background: '#fff', borderRadius: 12, padding: '20px 24px', boxShadow: '0 1px 6px rgba(0,0,0,0.07)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <h3 style={{ fontSize: 14, fontWeight: 600, color: '#555' }}>Lead Details</h3>
              <button onClick={() => setEditing(!editing)} style={{ background: 'none', border: 'none', color: NAVY, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
                {editing ? 'Cancel' : 'Edit'}
              </button>
            </div>

            {editing ? (
              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '0 16px' }}>
                {[['Budget', 'budget', 'AED amount'], ['Property Type', 'property_type', 'Apartment, Villa...'], ['Preferred Area', 'preferred_area', 'Downtown, Marina...']].map(([label, key, ph]) => (
                  <div key={key}>
                    <div style={{ fontSize: 11, fontWeight: 600, color: '#888', marginBottom: 4, textTransform: 'uppercase' }}>{label}</div>
                    <input
                      value={editForm[key]}
                      onChange={e => setEditForm(f => ({ ...f, [key]: e.target.value }))}
                      placeholder={ph}
                      style={{ width: '100%', padding: '8px 12px', border: '1.5px solid #e0e0e0', borderRadius: 7, fontSize: 13, outline: 'none', marginBottom: 12 }}
                    />
                  </div>
                ))}
                <div style={{ gridColumn: 'span 2' }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: '#888', marginBottom: 4, textTransform: 'uppercase' }}>Notes</div>
                  <textarea
                    value={editForm.notes}
                    onChange={e => setEditForm(f => ({ ...f, notes: e.target.value }))}
                    style={{ width: '100%', padding: '8px 12px', border: '1.5px solid #e0e0e0', borderRadius: 7, fontSize: 13, outline: 'none', minHeight: 80, resize: 'vertical', marginBottom: 12 }}
                  />
                </div>
                <div style={{ gridColumn: 'span 2', display: 'flex', gap: 8 }}>
                  <button onClick={saveEdit} style={{ padding: '8px 20px', background: NAVY, color: '#fff', border: 'none', borderRadius: 7, cursor: 'pointer', fontWeight: 600, fontSize: 13 }}>Save</button>
                </div>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '14px 24px' }}>
                {[
                  ['Phone', lead.phone], ['Email', lead.email || '—'],
                  ['Source', lead.source], ['Budget', lead.budget ? `AED ${Number(lead.budget).toLocaleString()}` : '—'],
                  ['Property Type', lead.property_type || '—'], ['Preferred Area', lead.preferred_area || '—'],
                  ['Assigned To', lead.assigned_to_name || '—'], ['Created By', lead.created_by_name || '—'],
                ].map(([k, v]) => (
                  <div key={k}>
                    <div style={{ fontSize: 11, color: '#aaa', textTransform: 'uppercase', fontWeight: 600, letterSpacing: 0.5 }}>{k}</div>
                    <div style={{ fontSize: 14, color: '#1a1a2e', marginTop: 2 }}>{v}</div>
                  </div>
                ))}
                {lead.notes && (
                  <div style={{ gridColumn: 'span 2' }}>
                    <div style={{ fontSize: 11, color: '#aaa', textTransform: 'uppercase', fontWeight: 600, letterSpacing: 0.5 }}>Notes</div>
                    <div style={{ fontSize: 14, color: '#1a1a2e', marginTop: 2, lineHeight: 1.5 }}>{lead.notes}</div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Activity log form */}
          <div style={{ background: '#fff', borderRadius: 12, padding: '20px 24px', boxShadow: '0 1px 6px rgba(0,0,0,0.07)' }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, color: '#555', marginBottom: 14 }}>Log Activity</h3>
            <form onSubmit={addActivity} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {ACTIVITY_TYPES.map(t => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setActType(t)}
                    style={{
                      padding: '6px 12px', borderRadius: 20, border: '1.5px solid',
                      borderColor: actType === t ? NAVY : '#e0e0e0',
                      background: actType === t ? NAVY : '#fff',
                      color: actType === t ? '#fff' : '#555',
                      fontSize: 12, cursor: 'pointer', fontWeight: 500,
                    }}
                  >
                    {ACTIVITY_ICONS[t]} {t}
                  </button>
                ))}
              </div>
              <textarea
                value={actText}
                onChange={e => setActText(e.target.value)}
                placeholder={`Add ${actType} note...`}
                required
                style={{ padding: '10px 12px', border: '1.5px solid #e0e0e0', borderRadius: 8, fontSize: 13, resize: 'vertical', minHeight: 70, outline: 'none' }}
              />
              <button
                type="submit"
                disabled={addingAct}
                style={{ alignSelf: 'flex-end', padding: '8px 20px', background: NAVY, color: '#fff', border: 'none', borderRadius: 7, cursor: 'pointer', fontWeight: 600, fontSize: 13 }}
              >
                {addingAct ? 'Logging...' : 'Log Activity'}
              </button>
            </form>
          </div>
        </div>

        {/* Right column - Activity timeline */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Assign — available to all users */}
          {teamMembers.length > 0 && (
            <div style={{ background: '#fff', borderRadius: 12, padding: '16px 20px', boxShadow: '0 1px 6px rgba(0,0,0,0.07)' }}>
              <h3 style={{ fontSize: 13, fontWeight: 600, color: '#555', marginBottom: 10 }}>Assign To</h3>
              <select
                value={lead.assigned_to || ''}
                onChange={e => assignTo(e.target.value)}
                style={{ width: '100%', padding: '9px 12px', border: '1.5px solid #e0e0e0', borderRadius: 7, fontSize: 13, outline: 'none' }}
              >
                <option value="">Select agent...</option>
                {teamMembers.map(m => <option key={m.id} value={m.id}>{m.full_name}</option>)}
              </select>
            </div>
          )}

          {/* Timeline */}
          <div style={{ background: '#fff', borderRadius: 12, padding: '20px 20px', boxShadow: '0 1px 6px rgba(0,0,0,0.07)', flex: 1 }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, color: '#555', marginBottom: 16 }}>Activity Timeline</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              {(lead.activities || []).length === 0 ? (
                <div style={{ color: '#aaa', fontSize: 13, textAlign: 'center', padding: '20px 0' }}>No activity yet</div>
              ) : (lead.activities || []).map((act, i) => (
                <div key={act.id} style={{ display: 'flex', gap: 12, paddingBottom: 16, position: 'relative' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <div style={{
                      width: 32, height: 32, borderRadius: '50%', background: '#f0f4ff',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, flexShrink: 0,
                    }}>
                      {ACTIVITY_ICONS[act.type] || '📌'}
                    </div>
                    {i < (lead.activities?.length - 1) && (
                      <div style={{ width: 1, flex: 1, background: '#e8e8e8', marginTop: 4 }} />
                    )}
                  </div>
                  <div style={{ flex: 1, paddingTop: 4 }}>
                    <div style={{ fontSize: 12, color: '#aaa', marginBottom: 2 }}>
                      {act.user_name} · {new Date(act.created_at).toLocaleString()}
                    </div>
                    <div style={{ fontSize: 13, color: '#1a1a2e', lineHeight: 1.5 }}>{act.content}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
