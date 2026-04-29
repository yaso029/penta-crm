import { useEffect, useState } from 'react';
import api from '../../api';
import toast from 'react-hot-toast';

const NAVY = '#0A2342';
const GOLD = '#C9A84C';

const TAGS = ['{name}', '{company}', '{partner_type}', '{commission_rate}'];

function WhatsAppTemplateModal({ template, onClose, onSaved }) {
  const isEdit = !!template;
  const [form, setForm] = useState(template ? { ...template, buttons: template.buttons || [] } : {
    name: '', category: 'MARKETING', body: '', buttons: [],
  });
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const addButton = () => {
    if (form.buttons.length >= 3) return;
    setForm(f => ({ ...f, buttons: [...f.buttons, { text: '', type: 'QUICK_REPLY', url: '' }] }));
  };

  const setBtn = (i, k, v) => setForm(f => ({
    ...f, buttons: f.buttons.map((b, idx) => idx === i ? { ...b, [k]: v } : b)
  }));

  const removeBtn = (i) => setForm(f => ({ ...f, buttons: f.buttons.filter((_, idx) => idx !== i) }));

  const insertTag = (tag) => setForm(f => ({ ...f, body: f.body + tag }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isEdit) {
        await api.put(`/api/whatsapp/templates/${template.id}`, form);
      } else {
        await api.post('/api/whatsapp/templates', form);
      }
      toast.success('Template saved');
      onSaved();
      onClose();
    } catch (err) { toast.error(err.response?.data?.detail || 'Failed'); }
    finally { setLoading(false); }
  };

  const submitToMeta = async () => {
    if (!template?.id) return;
    setSubmitting(true);
    try {
      await api.post(`/api/whatsapp/templates/${template.id}/submit`);
      toast.success('Submitted to Meta for approval');
      onSaved();
    } catch (err) { toast.error(err.response?.data?.detail || 'Failed'); }
    finally { setSubmitting(false); }
  };

  const inp = { width: '100%', padding: '9px 12px', border: '1.5px solid #e0e0e0', borderRadius: 7, fontSize: 13, outline: 'none', marginBottom: 12, boxSizing: 'border-box' };
  const lbl = { fontSize: 11, fontWeight: 600, color: '#555', display: 'block', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: '#fff', borderRadius: 14, padding: '28px 32px', width: 680, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.2)', display: 'flex', gap: 24 }}>
        {/* Form */}
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <h2 style={{ fontSize: 17, fontWeight: 700 }}>{isEdit ? 'Edit' : 'New'} WhatsApp Template</h2>
            <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: '#888' }}>×</button>
          </div>
          <form onSubmit={handleSubmit}>
            <label style={lbl}>Template Name</label>
            <input style={inp} value={form.name} onChange={set('name')} required placeholder="e.g. partner_intro_v1" />
            <label style={lbl}>Category</label>
            <select style={inp} value={form.category} onChange={set('category')}>
              <option value="MARKETING">Marketing</option>
              <option value="UTILITY">Utility</option>
            </select>
            <label style={lbl}>Message Body</label>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 6 }}>
              {TAGS.map(tag => (
                <button key={tag} type="button" onClick={() => insertTag(tag)}
                  style={{ padding: '3px 10px', background: '#f0f0ff', border: '1px solid #c7d2fe', borderRadius: 20, fontSize: 11, cursor: 'pointer', color: '#4f46e5' }}>
                  {tag}
                </button>
              ))}
            </div>
            <textarea style={{ ...inp, minHeight: 100, resize: 'vertical' }} value={form.body} onChange={set('body')} required placeholder="Hello {name}, we'd love to partner with you..." />

            <label style={lbl}>Buttons (max 3)</label>
            {form.buttons.map((b, i) => (
              <div key={i} style={{ display: 'flex', gap: 6, marginBottom: 8, alignItems: 'center' }}>
                <input style={{ ...inp, marginBottom: 0, flex: 1 }} placeholder="Button text" value={b.text} onChange={e => setBtn(i, 'text', e.target.value)} />
                <select style={{ ...inp, marginBottom: 0, width: 130 }} value={b.type} onChange={e => setBtn(i, 'type', e.target.value)}>
                  <option value="QUICK_REPLY">Quick Reply</option>
                  <option value="URL">URL</option>
                </select>
                {b.type === 'URL' && <input style={{ ...inp, marginBottom: 0, flex: 1 }} placeholder="https://..." value={b.url} onChange={e => setBtn(i, 'url', e.target.value)} />}
                <button type="button" onClick={() => removeBtn(i)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: 18, padding: '0 4px' }}>×</button>
              </div>
            ))}
            {form.buttons.length < 3 && (
              <button type="button" onClick={addButton} style={{ padding: '6px 14px', border: '1.5px dashed #c7d2fe', borderRadius: 7, background: '#f5f3ff', color: '#4f46e5', cursor: 'pointer', fontSize: 12, marginBottom: 12 }}>
                + Add Button
              </button>
            )}

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
              {isEdit && (
                <button type="button" onClick={submitToMeta} disabled={submitting}
                  style={{ padding: '9px 16px', background: '#10b981', color: '#fff', border: 'none', borderRadius: 7, cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>
                  {submitting ? 'Submitting...' : 'Submit to Meta'}
                </button>
              )}
              <button type="button" onClick={onClose} style={{ padding: '9px 18px', border: '1.5px solid #e0e0e0', borderRadius: 7, background: '#fff', cursor: 'pointer', fontSize: 13 }}>Cancel</button>
              <button type="submit" disabled={loading} style={{ padding: '9px 18px', background: NAVY, color: '#fff', border: 'none', borderRadius: 7, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
                {loading ? 'Saving...' : 'Save'}
              </button>
            </div>
          </form>
        </div>

        {/* Preview */}
        <div style={{ width: 200 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: '#888', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 }}>Preview</div>
          <div style={{ background: '#e5ddd5', borderRadius: 12, padding: 12, minHeight: 200 }}>
            <div style={{ background: '#fff', borderRadius: 8, padding: 10, fontSize: 12, lineHeight: 1.5, color: '#111', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
              {form.body || 'Your message preview...'}
            </div>
            {form.buttons.map((b, i) => b.text && (
              <div key={i} style={{ background: '#fff', borderRadius: 6, padding: '8px 10px', fontSize: 12, color: '#128c7e', textAlign: 'center', marginTop: 6, fontWeight: 600 }}>
                {b.text}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function EmailTemplateModal({ template, onClose, onSaved }) {
  const isEdit = !!template;
  const [form, setForm] = useState(template ? { ...template } : { name: '', subject: '', body_html: '' });
  const [loading, setLoading] = useState(false);
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));
  const insertTag = (tag, field) => setForm(f => ({ ...f, [field]: (f[field] || '') + tag }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isEdit) {
        await api.put(`/api/email/templates/${template.id}`, form);
      } else {
        await api.post('/api/email/templates', form);
      }
      toast.success('Template saved');
      onSaved();
      onClose();
    } catch (err) { toast.error(err.response?.data?.detail || 'Failed'); }
    finally { setLoading(false); }
  };

  const inp = { width: '100%', padding: '9px 12px', border: '1.5px solid #e0e0e0', borderRadius: 7, fontSize: 13, outline: 'none', marginBottom: 12, boxSizing: 'border-box' };
  const lbl = { fontSize: 11, fontWeight: 600, color: '#555', display: 'block', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: '#fff', borderRadius: 14, padding: '28px 32px', width: 720, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h2 style={{ fontSize: 17, fontWeight: 700 }}>{isEdit ? 'Edit' : 'New'} Email Template</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: '#888' }}>×</button>
        </div>
        <form onSubmit={handleSubmit}>
          <label style={lbl}>Template Name</label>
          <input style={inp} value={form.name} onChange={set('name')} required />
          <label style={lbl}>Subject Line</label>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 6 }}>
            {TAGS.map(tag => (
              <button key={tag} type="button" onClick={() => insertTag(tag, 'subject')}
                style={{ padding: '3px 10px', background: '#fef3c7', border: '1px solid #fcd34d', borderRadius: 20, fontSize: 11, cursor: 'pointer', color: '#92400e' }}>{tag}</button>
            ))}
          </div>
          <input style={inp} value={form.subject} onChange={set('subject')} required placeholder="Partnership Opportunity with {company}" />
          <label style={lbl}>Email Body (HTML supported)</label>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 6 }}>
            {TAGS.map(tag => (
              <button key={tag} type="button" onClick={() => insertTag(tag, 'body_html')}
                style={{ padding: '3px 10px', background: '#fef3c7', border: '1px solid #fcd34d', borderRadius: 20, fontSize: 11, cursor: 'pointer', color: '#92400e' }}>{tag}</button>
            ))}
          </div>
          <textarea style={{ ...inp, minHeight: 200, resize: 'vertical', fontFamily: 'monospace', fontSize: 12 }}
            value={form.body_html} onChange={set('body_html')} required
            placeholder="<p>Dear {name},</p><p>We'd love to partner with you...</p>" />

          {form.body_html && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: '#888', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>Preview</div>
              <div style={{ border: '1px solid #e0e0e0', borderRadius: 8, padding: 16, fontSize: 13, minHeight: 80 }}
                dangerouslySetInnerHTML={{ __html: form.body_html }} />
            </div>
          )}

          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
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

export default function Templates() {
  const [waTemplates, setWaTemplates] = useState([]);
  const [emailTemplates, setEmailTemplates] = useState([]);
  const [tab, setTab] = useState('whatsapp');
  const [waModal, setWaModal] = useState(null);
  const [emailModal, setEmailModal] = useState(null);

  const fetchAll = async () => {
    const [wa, em] = await Promise.all([
      api.get('/api/whatsapp/templates').then(r => r.data).catch(() => []),
      api.get('/api/email/templates').then(r => r.data).catch(() => []),
    ]);
    setWaTemplates(wa);
    setEmailTemplates(em);
  };

  useEffect(() => { fetchAll(); }, []);

  const deleteWa = async (id) => {
    if (!confirm('Delete template?')) return;
    await api.delete(`/api/whatsapp/templates/${id}`);
    toast.success('Deleted');
    fetchAll();
  };

  const deleteEmail = async (id) => {
    if (!confirm('Delete template?')) return;
    await api.delete(`/api/email/templates/${id}`);
    toast.success('Deleted');
    fetchAll();
  };

  const STATUS_COLORS = { pending: '#f59e0b', submitted: '#3b82f6', approved: '#10b981', rejected: '#ef4444' };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#1a1a2e' }}>Template Manager</h1>
        <button
          onClick={() => tab === 'whatsapp' ? setWaModal('add') : setEmailModal('add')}
          style={{ padding: '10px 20px', background: NAVY, color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 14 }}>
          + New {tab === 'whatsapp' ? 'WhatsApp' : 'Email'} Template
        </button>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 0, marginBottom: 24, borderBottom: '2px solid #f0f0f0' }}>
        {[['whatsapp', '📱 WhatsApp Templates'], ['email', '📧 Email Templates']].map(([key, label]) => (
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {waTemplates.length === 0 && <div style={{ textAlign: 'center', padding: 40, color: '#aaa' }}>No WhatsApp templates yet</div>}
          {waTemplates.map(t => (
            <div key={t.id} style={{ background: '#fff', borderRadius: 12, padding: '18px 22px', boxShadow: '0 1px 6px rgba(0,0,0,0.07)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                  <span style={{ fontWeight: 700, fontSize: 15 }}>{t.name}</span>
                  <span style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', background: `${STATUS_COLORS[t.meta_status]}20`, color: STATUS_COLORS[t.meta_status], borderRadius: 20, padding: '2px 8px' }}>{t.meta_status}</span>
                  <span style={{ fontSize: 10, color: '#888', background: '#f5f5f5', borderRadius: 20, padding: '2px 8px' }}>{t.category}</span>
                </div>
                <div style={{ fontSize: 13, color: '#555', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>{t.body}</div>
                {t.buttons?.length > 0 && (
                  <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                    {t.buttons.map((b, i) => <span key={i} style={{ padding: '3px 10px', background: '#e0f2fe', color: '#0284c7', borderRadius: 20, fontSize: 11 }}>{b.text}</span>)}
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', gap: 8, marginLeft: 16, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                <button onClick={async () => {
                  try {
                    const { data } = await api.post(`/api/whatsapp/templates/${t.id}/check-status`);
                    if (data.error) { toast.error(data.error); return; }
                    toast.success(`Meta status: ${data.meta_status?.toUpperCase()}`);
                    fetchAll();
                  } catch (err) { toast.error(err.response?.data?.detail || 'Could not reach Meta'); }
                }} style={{ padding: '6px 12px', border: '1.5px solid #3b82f6', color: '#3b82f6', background: '#fff', borderRadius: 6, cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>↻ Check</button>
                {t.meta_status !== 'approved' && (
                  <button onClick={async () => {
                    await api.patch(`/api/whatsapp/templates/${t.id}/status?status=approved`);
                    toast.success('Marked as approved');
                    fetchAll();
                  }} style={{ padding: '6px 12px', border: '1.5px solid #10b981', color: '#10b981', background: '#fff', borderRadius: 6, cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>✓ Mark Approved</button>
                )}
                <button onClick={() => setWaModal(t)} style={{ padding: '6px 12px', border: `1.5px solid ${NAVY}`, color: NAVY, background: '#fff', borderRadius: 6, cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>Edit</button>
                <button onClick={() => deleteWa(t.id)} style={{ padding: '6px 12px', border: '1.5px solid #ef4444', color: '#ef4444', background: '#fff', borderRadius: 6, cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'email' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {emailTemplates.length === 0 && <div style={{ textAlign: 'center', padding: 40, color: '#aaa' }}>No email templates yet</div>}
          {emailTemplates.map(t => (
            <div key={t.id} style={{ background: '#fff', borderRadius: 12, padding: '18px 22px', boxShadow: '0 1px 6px rgba(0,0,0,0.07)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>{t.name}</div>
                <div style={{ fontSize: 12, color: '#888', marginBottom: 6 }}>Subject: {t.subject}</div>
                <div style={{ fontSize: 12, color: '#aaa' }}>Updated {new Date(t.updated_at).toLocaleDateString()}</div>
              </div>
              <div style={{ display: 'flex', gap: 8, marginLeft: 16 }}>
                <button onClick={() => setEmailModal(t)} style={{ padding: '6px 12px', border: `1.5px solid ${NAVY}`, color: NAVY, background: '#fff', borderRadius: 6, cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>Edit</button>
                <button onClick={() => deleteEmail(t.id)} style={{ padding: '6px 12px', border: '1.5px solid #ef4444', color: '#ef4444', background: '#fff', borderRadius: 6, cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {waModal && <WhatsAppTemplateModal template={waModal === 'add' ? null : waModal} onClose={() => setWaModal(null)} onSaved={fetchAll} />}
      {emailModal && <EmailTemplateModal template={emailModal === 'add' ? null : emailModal} onClose={() => setEmailModal(null)} onSaved={fetchAll} />}
    </div>
  );
}
