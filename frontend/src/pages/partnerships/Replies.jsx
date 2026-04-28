import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api';
import toast from 'react-hot-toast';

const NAVY = '#0A2342';
const GOLD = '#C9A84C';

const SUGGESTION_CONFIG = {
  interested: { label: 'Interested', color: '#10b981', bg: '#dcfce7', action: 'Follow Up' },
  not_interested: { label: 'Not Interested', color: '#ef4444', bg: '#fee2e2', action: 'Mark Not Interested' },
  has_client: { label: 'Has a Client Ready!', color: '#f59e0b', bg: '#fef3c7', action: 'Create Lead Now' },
};

function CreateLeadModal({ reply, onClose, onCreated }) {
  const [form, setForm] = useState({
    full_name: '',
    phone: '',
    email: '',
    source: 'Referral',
    notes: `Referred by partner: ${reply.partner_name || reply.from_number}`,
    budget: '',
    property_type: '',
    preferred_area: '',
  });
  const [loading, setLoading] = useState(false);
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/api/leads', form);
      await api.patch(`/api/whatsapp/replies/${reply.id}/action?action=lead_created`);
      toast.success('Lead created in CRM!');
      onCreated();
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
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 400, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: '#fff', borderRadius: 14, padding: '28px 32px', width: 480, maxHeight: '85vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.25)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h2 style={{ fontSize: 17, fontWeight: 700 }}>Create Lead from Referral</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: '#888' }}>×</button>
        </div>
        <div style={{ background: '#fef3c7', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#92400e', marginBottom: 16 }}>
          Referral from: <strong>{reply.partner_name || reply.from_number}</strong><br />
          "{reply.message_body}"
        </div>
        <form onSubmit={handleSubmit}>
          <label style={lbl}>Client Full Name *</label>
          <input style={inp} value={form.full_name} onChange={set('full_name')} required />
          <label style={lbl}>Client Phone *</label>
          <input style={inp} value={form.phone} onChange={set('phone')} required />
          <label style={lbl}>Client Email</label>
          <input style={inp} type="email" value={form.email} onChange={set('email')} />
          <label style={lbl}>Budget (AED)</label>
          <input style={inp} value={form.budget} onChange={set('budget')} placeholder="e.g. 2,000,000" />
          <label style={lbl}>Property Type</label>
          <input style={inp} value={form.property_type} onChange={set('property_type')} placeholder="Apartment, Villa..." />
          <label style={lbl}>Preferred Area</label>
          <input style={inp} value={form.preferred_area} onChange={set('preferred_area')} />
          <label style={lbl}>Notes</label>
          <textarea style={{ ...inp, minHeight: 60, resize: 'vertical' }} value={form.notes} onChange={set('notes')} />
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 4 }}>
            <button type="button" onClick={onClose} style={{ padding: '9px 18px', border: '1.5px solid #e0e0e0', borderRadius: 7, background: '#fff', cursor: 'pointer', fontSize: 13 }}>Cancel</button>
            <button type="submit" disabled={loading} style={{ padding: '9px 18px', background: '#10b981', color: '#fff', border: 'none', borderRadius: 7, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
              {loading ? 'Creating...' : 'Create Lead in CRM'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Replies() {
  const [replies, setReplies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [createLeadReply, setCreateLeadReply] = useState(null);

  const fetchReplies = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/api/whatsapp/replies');
      setReplies(data);
    } catch { toast.error('Failed to load replies'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchReplies(); }, []);

  const takeAction = async (id, action) => {
    try {
      await api.patch(`/api/whatsapp/replies/${id}/action?action=${action}`);
      toast.success('Action taken');
      fetchReplies();
    } catch { toast.error('Failed'); }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#1a1a2e' }}>Replies & Conversations</h1>
          <p style={{ color: '#888', fontSize: 14, marginTop: 4 }}>{replies.length} replies received</p>
        </div>
        <button onClick={fetchReplies} style={{ padding: '9px 18px', border: `1.5px solid ${NAVY}`, color: NAVY, background: '#fff', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
          Refresh
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 60, color: '#aaa' }}>Loading...</div>
      ) : replies.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60, color: '#aaa', background: '#fff', borderRadius: 12 }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>💬</div>
          <div style={{ fontSize: 16, fontWeight: 600 }}>No replies yet</div>
          <div style={{ fontSize: 13, marginTop: 6 }}>Replies from WhatsApp will appear here automatically</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {replies.map(r => {
            const suggestion = r.ai_suggestion ? SUGGESTION_CONFIG[r.ai_suggestion] : null;
            const isDone = !!r.action_taken;
            return (
              <div key={r.id} style={{
                background: '#fff', borderRadius: 12, padding: '18px 22px',
                boxShadow: '0 1px 6px rgba(0,0,0,0.07)',
                borderLeft: suggestion ? `4px solid ${suggestion.color}` : '4px solid #e0e0e0',
                opacity: isDone ? 0.7 : 1,
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                      <span style={{ fontWeight: 700, fontSize: 15 }}>{r.partner_name}</span>
                      <span style={{ fontSize: 11, color: '#aaa' }}>{r.from_number}</span>
                      <span style={{ fontSize: 11, color: '#aaa' }}>{new Date(r.received_at).toLocaleString()}</span>
                      {isDone && <span style={{ fontSize: 10, background: '#f0f0f0', color: '#888', borderRadius: 20, padding: '2px 8px' }}>Done: {r.action_taken}</span>}
                    </div>

                    {/* Message bubble */}
                    <div style={{ background: '#f0f0f0', borderRadius: '0 12px 12px 12px', padding: '10px 14px', fontSize: 14, color: '#1a1a2e', maxWidth: 480, lineHeight: 1.5 }}>
                      {r.message_body}
                    </div>

                    {/* AI suggestion */}
                    {suggestion && (
                      <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{ fontSize: 12, fontWeight: 600, background: suggestion.bg, color: suggestion.color, borderRadius: 20, padding: '4px 12px' }}>
                          🤖 AI: {suggestion.label}
                        </span>
                        {!isDone && (
                          <>
                            {r.ai_suggestion === 'has_client' && (
                              <button
                                onClick={() => setCreateLeadReply(r)}
                                style={{ padding: '6px 16px', background: '#10b981', color: '#fff', border: 'none', borderRadius: 7, cursor: 'pointer', fontSize: 12, fontWeight: 700 }}>
                                Create Lead Now
                              </button>
                            )}
                            {r.ai_suggestion === 'interested' && (
                              <button
                                onClick={() => takeAction(r.id, 'follow_up')}
                                style={{ padding: '6px 16px', background: NAVY, color: '#fff', border: 'none', borderRadius: 7, cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>
                                Create Referral Lead
                              </button>
                            )}
                            {r.ai_suggestion === 'not_interested' && (
                              <button
                                onClick={() => takeAction(r.id, 'not_interested')}
                                style={{ padding: '6px 16px', background: '#ef4444', color: '#fff', border: 'none', borderRadius: 7, cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>
                                Mark Not Interested
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {createLeadReply && (
        <CreateLeadModal
          reply={createLeadReply}
          onClose={() => setCreateLeadReply(null)}
          onCreated={fetchReplies}
        />
      )}
    </div>
  );
}
