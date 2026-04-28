import { useEffect, useState } from 'react';
import api from '../../api';
import toast from 'react-hot-toast';

const NAVY = '#0A2342';
const GOLD = '#C9A84C';

export default function Outreach() {
  const [tab, setTab] = useState('whatsapp');
  const [partners, setPartners] = useState([]);
  const [waTemplates, setWaTemplates] = useState([]);
  const [emailTemplates, setEmailTemplates] = useState([]);
  const [waDailyCount, setWaDailyCount] = useState({ count: 0, limit: 50 });
  const [emailDailyCount, setEmailDailyCount] = useState({ count: 0, limit: 50 });
  const [waSentHistory, setWaSentHistory] = useState([]);
  const [emailSentHistory, setEmailSentHistory] = useState([]);

  // WhatsApp form
  const [waForm, setWaForm] = useState({ template_id: '', custom_message: '', selected_partners: [] });
  const [waSending, setWaSending] = useState(false);

  // Email form
  const [emailForm, setEmailForm] = useState({ template_id: '', custom_subject: '', custom_body: '', selected_partners: [] });
  const [emailSending, setEmailSending] = useState(false);

  const [partnerFilter, setPartnerFilter] = useState('');

  useEffect(() => {
    Promise.all([
      api.get('/api/partners').then(r => setPartners(r.data)).catch(() => {}),
      api.get('/api/whatsapp/templates').then(r => setWaTemplates(r.data)).catch(() => {}),
      api.get('/api/email/templates').then(r => setEmailTemplates(r.data)).catch(() => {}),
      api.get('/api/whatsapp/daily-count').then(r => setWaDailyCount(r.data)).catch(() => {}),
      api.get('/api/email/daily-count').then(r => setEmailDailyCount(r.data)).catch(() => {}),
      api.get('/api/whatsapp/sent').then(r => setWaSentHistory(r.data)).catch(() => {}),
      api.get('/api/email/sent').then(r => setEmailSentHistory(r.data)).catch(() => {}),
    ]);
  }, []);

  const selectedWaTemplate = waTemplates.find(t => t.id === parseInt(waForm.template_id));
  const selectedEmailTemplate = emailTemplates.find(t => t.id === parseInt(emailForm.template_id));

  const filteredPartners = partners.filter(p =>
    !partnerFilter || p.partner_type === partnerFilter || p.status === partnerFilter
  );

  const togglePartner = (id, form, setForm) => {
    setForm(f => ({
      ...f,
      selected_partners: f.selected_partners.includes(id)
        ? f.selected_partners.filter(x => x !== id)
        : [...f.selected_partners, id]
    }));
  };

  const selectAll = (form, setForm) => {
    const ids = filteredPartners.map(p => p.id);
    setForm(f => ({ ...f, selected_partners: ids }));
  };

  const sendWhatsApp = async () => {
    if (!waForm.selected_partners.length) { toast.error('Select at least one partner'); return; }
    setWaSending(true);
    try {
      const { data } = await api.post('/api/whatsapp/send', {
        partner_ids: waForm.selected_partners,
        template_id: waForm.template_id ? parseInt(waForm.template_id) : null,
        custom_message: waForm.custom_message || null,
      });
      toast.success(`${data.sent} messages sent`);
      setWaForm(f => ({ ...f, selected_partners: [] }));
      const [dc, hist] = await Promise.all([
        api.get('/api/whatsapp/daily-count').then(r => r.data),
        api.get('/api/whatsapp/sent').then(r => r.data),
      ]);
      setWaDailyCount(dc);
      setWaSentHistory(hist);
    } catch (err) { toast.error(err.response?.data?.detail || 'Send failed'); }
    finally { setWaSending(false); }
  };

  const sendEmail = async () => {
    if (!emailForm.selected_partners.length) { toast.error('Select at least one partner'); return; }
    setEmailSending(true);
    try {
      const { data } = await api.post('/api/email/send', {
        partner_ids: emailForm.selected_partners,
        template_id: emailForm.template_id ? parseInt(emailForm.template_id) : null,
        custom_subject: emailForm.custom_subject || null,
        custom_body: emailForm.custom_body || null,
      });
      toast.success(`${data.sent} emails sent`);
      setEmailForm(f => ({ ...f, selected_partners: [] }));
      const [dc, hist] = await Promise.all([
        api.get('/api/email/daily-count').then(r => r.data),
        api.get('/api/email/sent').then(r => r.data),
      ]);
      setEmailDailyCount(dc);
      setEmailSentHistory(hist);
    } catch (err) { toast.error(err.response?.data?.detail || 'Send failed'); }
    finally { setEmailSending(false); }
  };

  const DailyBar = ({ count, limit }) => (
    <div style={{ marginBottom: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 6 }}>
        <span style={{ fontWeight: 600, color: '#1a1a2e' }}>Daily limit</span>
        <span style={{ color: count >= limit ? '#ef4444' : '#10b981', fontWeight: 700 }}>{count} / {limit}</span>
      </div>
      <div style={{ height: 8, background: '#f0f0f0', borderRadius: 4 }}>
        <div style={{ height: '100%', width: `${Math.min(100, (count / limit) * 100)}%`, background: count >= limit ? '#ef4444' : '#10b981', borderRadius: 4, transition: 'width 0.3s' }} />
      </div>
    </div>
  );

  const inp = { width: '100%', padding: '9px 12px', border: '1.5px solid #e0e0e0', borderRadius: 7, fontSize: 13, outline: 'none', marginBottom: 12, boxSizing: 'border-box' };
  const lbl = { fontSize: 11, fontWeight: 600, color: '#555', display: 'block', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 };

  const renderSendPanel = (isWa) => {
    const form = isWa ? waForm : emailForm;
    const setForm = isWa ? setWaForm : setEmailForm;
    const templates = isWa ? waTemplates : emailTemplates;
    const selectedTemplate = isWa ? selectedWaTemplate : selectedEmailTemplate;
    const dailyCount = isWa ? waDailyCount : emailDailyCount;
    const sending = isWa ? waSending : emailSending;
    const doSend = isWa ? sendWhatsApp : sendEmail;

    return (
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        {/* Left: Form */}
        <div style={{ background: '#fff', borderRadius: 12, padding: 24, boxShadow: '0 1px 6px rgba(0,0,0,0.07)' }}>
          <DailyBar count={dailyCount.count} limit={dailyCount.limit} />

          <label style={lbl}>Select Template</label>
          <select style={inp} value={form.template_id} onChange={e => setForm(f => ({ ...f, template_id: e.target.value }))}>
            <option value="">— Custom message —</option>
            {templates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>

          {!form.template_id && (
            <>
              {!isWa && (
                <>
                  <label style={lbl}>Subject</label>
                  <input style={inp} placeholder="Subject line..." value={emailForm.custom_subject} onChange={e => setEmailForm(f => ({ ...f, custom_subject: e.target.value }))} />
                </>
              )}
              <label style={lbl}>{isWa ? 'Message' : 'Body (HTML)'}</label>
              <textarea
                style={{ ...inp, minHeight: isWa ? 100 : 150, resize: 'vertical' }}
                placeholder={isWa ? 'Type your message...' : '<p>Your email body...</p>'}
                value={isWa ? waForm.custom_message : emailForm.custom_body}
                onChange={e => setForm(f => ({ ...f, [isWa ? 'custom_message' : 'custom_body']: e.target.value }))}
              />
            </>
          )}

          {selectedTemplate && (
            <div style={{ background: '#f5f5f5', borderRadius: 8, padding: 12, fontSize: 13, color: '#555', marginBottom: 12, lineHeight: 1.5, whiteSpace: 'pre-wrap', maxHeight: 150, overflow: 'auto' }}>
              {isWa ? selectedTemplate.body : selectedTemplate.subject}
            </div>
          )}

          <button
            onClick={doSend}
            disabled={sending || !form.selected_partners.length || dailyCount.count >= dailyCount.limit}
            style={{
              width: '100%', padding: '12px', background: NAVY, color: '#fff', border: 'none',
              borderRadius: 8, cursor: 'pointer', fontSize: 14, fontWeight: 700,
              opacity: sending || !form.selected_partners.length ? 0.6 : 1,
            }}>
            {sending ? 'Sending...' : `Send to ${form.selected_partners.length} Partner${form.selected_partners.length !== 1 ? 's' : ''}`}
          </button>
        </div>

        {/* Right: Recipients */}
        <div style={{ background: '#fff', borderRadius: 12, padding: 24, boxShadow: '0 1px 6px rgba(0,0,0,0.07)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <label style={{ ...lbl, marginBottom: 0 }}>Select Recipients ({form.selected_partners.length} selected)</label>
            <button onClick={() => selectAll(form, setForm)} style={{ fontSize: 12, color: NAVY, background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>Select All</button>
          </div>
          <select style={{ ...inp, marginBottom: 12 }} value={partnerFilter} onChange={e => setPartnerFilter(e.target.value)}>
            <option value="">All Partners</option>
            <option value="Active Partner">Active Partners</option>
            <option value="New">New</option>
            <option value="Contacted">Contacted</option>
          </select>
          <div style={{ maxHeight: 320, overflowY: 'auto', border: '1px solid #f0f0f0', borderRadius: 8 }}>
            {filteredPartners.map(p => {
              const isSelected = form.selected_partners.includes(p.id);
              const isBlocked = ['Not Interested', 'Inactive'].includes(p.status);
              return (
                <div key={p.id}
                  onClick={() => !isBlocked && togglePartner(p.id, form, setForm)}
                  style={{
                    padding: '10px 14px', borderBottom: '1px solid #f5f5f5', cursor: isBlocked ? 'not-allowed' : 'pointer',
                    background: isSelected ? '#f0f4ff' : isBlocked ? '#fafafa' : '#fff',
                    display: 'flex', alignItems: 'center', gap: 10, opacity: isBlocked ? 0.5 : 1,
                  }}>
                  <input type="checkbox" checked={isSelected} readOnly style={{ cursor: 'pointer' }} />
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{p.full_name}</div>
                    <div style={{ fontSize: 11, color: '#aaa' }}>{p.partner_type} · {p.status}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  const renderHistory = (history, isWa) => (
    <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 1px 6px rgba(0,0,0,0.07)', overflow: 'hidden', marginTop: 24 }}>
      <div style={{ padding: '14px 20px', borderBottom: '1px solid #f0f0f0', fontWeight: 600, fontSize: 14 }}>Sent History</div>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ background: '#fafafa' }}>
            {['Partner', isWa ? 'Message' : 'Subject', 'Sent At', 'Status'].map(h => (
              <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: '#888', textTransform: 'uppercase' }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {history.length === 0 && <tr><td colSpan={4} style={{ padding: 30, textAlign: 'center', color: '#aaa' }}>No history yet</td></tr>}
          {history.slice(0, 50).map(m => (
            <tr key={m.id} style={{ borderBottom: '1px solid #f5f5f5' }}>
              <td style={{ padding: '10px 16px', fontSize: 13, fontWeight: 600 }}>{m.partner_name}</td>
              <td style={{ padding: '10px 16px', fontSize: 12, color: '#555', maxWidth: 200 }}>
                <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {isWa ? m.message_body : m.subject}
                </div>
              </td>
              <td style={{ padding: '10px 16px', fontSize: 12, color: '#aaa' }}>{new Date(m.sent_at).toLocaleString()}</td>
              <td style={{ padding: '10px 16px' }}>
                <span style={{ fontSize: 11, fontWeight: 600, background: '#dcfce7', color: '#15803d', borderRadius: 20, padding: '2px 8px' }}>{m.status}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  return (
    <div>
      <h1 style={{ fontSize: 22, fontWeight: 700, color: '#1a1a2e', marginBottom: 24 }}>Outreach Center</h1>

      <div style={{ display: 'flex', gap: 0, marginBottom: 24, borderBottom: '2px solid #f0f0f0' }}>
        {[['whatsapp', '📱 WhatsApp'], ['email', '📧 Email']].map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)} style={{
            padding: '10px 24px', background: 'none', border: 'none', cursor: 'pointer',
            fontSize: 14, fontWeight: tab === key ? 700 : 500,
            color: tab === key ? NAVY : '#888',
            borderBottom: tab === key ? `3px solid ${NAVY}` : '3px solid transparent',
            marginBottom: -2,
          }}>{label}</button>
        ))}
      </div>

      {tab === 'whatsapp' && (
        <>
          {renderSendPanel(true)}
          {renderHistory(waSentHistory, true)}
        </>
      )}
      {tab === 'email' && (
        <>
          {renderSendPanel(false)}
          {renderHistory(emailSentHistory, false)}
        </>
      )}
    </div>
  );
}
