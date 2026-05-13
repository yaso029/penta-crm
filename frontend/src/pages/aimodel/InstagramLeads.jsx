import { useState, useEffect, useCallback } from 'react';
import api from '../../api';

const NAVY = '#0A2342';
const GOLD = '#C9A84C';
const BASE = import.meta.env.VITE_API_URL || 'https://penta-crm-production.up.railway.app';

const STATUSES = ['not_contacted', 'contacted', 'responded', 'qualified', 'converted', 'rejected'];
const STATUS_LABELS = {
  not_contacted: 'Not Contacted', contacted: 'Contacted', responded: 'Responded',
  qualified: 'Qualified', converted: 'Converted', rejected: 'Rejected',
};
const STATUS_COLORS = {
  not_contacted: { bg: '#f1f5f9', color: '#64748b' },
  contacted:     { bg: '#dbeafe', color: '#1d4ed8' },
  responded:     { bg: '#fef3c7', color: '#92400e' },
  qualified:     { bg: '#d1fae5', color: '#065f46' },
  converted:     { bg: '#bbf7d0', color: '#14532d' },
  rejected:      { bg: '#fee2e2', color: '#991b1b' },
};

function StatusChip({ status }) {
  const s = STATUS_COLORS[status] || STATUS_COLORS.not_contacted;
  return (
    <span style={{
      padding: '3px 9px', borderRadius: 12, fontSize: 11, fontWeight: 700,
      textTransform: 'uppercase', letterSpacing: 0.5,
      background: s.bg, color: s.color, whiteSpace: 'nowrap',
    }}>
      {STATUS_LABELS[status] || status}
    </span>
  );
}

function ScoreBadge({ score }) {
  const color = score >= 7 ? '#16a34a' : score >= 4 ? '#d97706' : '#888';
  return (
    <span style={{
      fontWeight: 700, fontSize: 13, color,
      background: `${color}18`, padding: '2px 8px', borderRadius: 8,
    }}>
      {score}/10
    </span>
  );
}

export default function InstagramLeads() {
  const [leads, setLeads] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [offset, setOffset] = useState(0);
  const LIMIT = 50;

  // Filters
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterKeyword, setFilterKeyword] = useState('');
  const [hasEmail, setHasEmail] = useState(false);
  const [hasPhone, setHasPhone] = useState(false);
  const [hasWhatsapp, setHasWhatsapp] = useState(false);
  const [minScore, setMinScore] = useState(0);

  // Detail panel
  const [selected, setSelected] = useState(null);
  const [editNotes, setEditNotes] = useState('');
  const [editStatus, setEditStatus] = useState('');
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchLeads = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({
      search, status: filterStatus, keyword: filterKeyword,
      has_email: hasEmail, has_phone: hasPhone, has_whatsapp: hasWhatsapp,
      min_score: minScore, limit: LIMIT, offset,
    });
    api.get(`/api/instagram/leads?${params}`)
      .then(r => { setLeads(r.data.leads); setTotal(r.data.total); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [search, filterStatus, filterKeyword, hasEmail, hasPhone, hasWhatsapp, minScore, offset]);

  useEffect(() => { fetchLeads(); }, [fetchLeads]);

  const saveChanges = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      const updated = await api.patch(`/api/instagram/leads/${selected.id}`, {
        contacted_status: editStatus,
        notes: editNotes,
      });
      setLeads(prev => prev.map(l => l.id === selected.id ? updated.data : l));
      setSelected(updated.data);
      showToast('Saved');
    } catch { showToast('Failed to save', 'error'); }
    finally { setSaving(false); }
  };

  const sendToCRM = async (lead) => {
    try {
      const r = await api.post(`/api/instagram/leads/${lead.id}/send-to-crm`);
      if (r.data.already_exists) {
        showToast('Already in CRM');
      } else {
        showToast('Added to CRM leads ✓');
        fetchLeads();
      }
    } catch { showToast('Failed to send to CRM', 'error'); }
  };

  const deleteLead = async (lead) => {
    if (!confirm(`Delete @${lead.username}?`)) return;
    try {
      await api.delete(`/api/instagram/leads/${lead.id}`);
      setLeads(prev => prev.filter(l => l.id !== lead.id));
      if (selected?.id === lead.id) setSelected(null);
      showToast('Deleted');
    } catch { showToast('Failed to delete', 'error'); }
  };

  const exportCSV = () => {
    const params = new URLSearchParams({
      search, status: filterStatus, keyword: filterKeyword,
      has_email: hasEmail, has_phone: hasPhone,
    });
    const token = localStorage.getItem('token');
    window.open(`${BASE}/api/instagram/leads/export?${params}&token=${token}`, '_blank');
  };

  const openProfile = (username) => {
    window.open(`https://www.instagram.com/${username}/`, '_blank');
  };

  const openSelected = (lead) => {
    setSelected(lead);
    setEditNotes(lead.notes || '');
    setEditStatus(lead.contacted_status || 'not_contacted');
  };

  return (
    <div style={{ display: 'flex', gap: 0, height: 'calc(100vh - 88px)', overflow: 'hidden' }}>
      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', top: 20, right: 20, zIndex: 9999,
          background: toast.type === 'error' ? '#fee2e2' : '#d1fae5',
          color: toast.type === 'error' ? '#991b1b' : '#065f46',
          padding: '12px 20px', borderRadius: 8, fontWeight: 600, fontSize: 13,
          boxShadow: '0 4px 12px rgba(0,0,0,0.12)',
        }}>
          {toast.msg}
        </div>
      )}

      {/* Left — table */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Toolbar */}
        <div style={{
          background: '#fff', padding: '14px 20px', borderBottom: '1px solid #e8e8e8',
          display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap',
        }}>
          <div style={{ fontSize: 16, fontWeight: 800, color: NAVY, marginRight: 8 }}>
            Instagram Lead Database
            <span style={{ fontSize: 12, fontWeight: 500, color: '#888', marginLeft: 8 }}>
              {total} accounts
            </span>
          </div>

          <input
            value={search} onChange={e => { setSearch(e.target.value); setOffset(0); }}
            placeholder="Search username, name, bio..."
            style={{
              padding: '7px 12px', borderRadius: 7, border: '1px solid #ddd',
              fontSize: 13, width: 220,
            }}
          />

          <select
            value={filterStatus} onChange={e => { setFilterStatus(e.target.value); setOffset(0); }}
            style={{ padding: '7px 10px', borderRadius: 7, border: '1px solid #ddd', fontSize: 13 }}
          >
            <option value="">All statuses</option>
            {STATUSES.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
          </select>

          <input
            value={filterKeyword} onChange={e => { setFilterKeyword(e.target.value); setOffset(0); }}
            placeholder="Filter by keyword..."
            style={{ padding: '7px 12px', borderRadius: 7, border: '1px solid #ddd', fontSize: 13, width: 160 }}
          />

          <label style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 13, cursor: 'pointer' }}>
            <input type="checkbox" checked={hasEmail} onChange={e => setHasEmail(e.target.checked)} />
            Has Email
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 13, cursor: 'pointer' }}>
            <input type="checkbox" checked={hasPhone} onChange={e => setHasPhone(e.target.checked)} />
            Has Phone
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 13, cursor: 'pointer' }}>
            <input type="checkbox" checked={hasWhatsapp} onChange={e => setHasWhatsapp(e.target.checked)} />
            Has WhatsApp
          </label>

          <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
            <button onClick={exportCSV} style={{
              padding: '7px 14px', background: '#fff', border: '1px solid #ddd',
              borderRadius: 7, fontSize: 13, cursor: 'pointer', color: '#555', fontWeight: 500,
            }}>
              Export CSV
            </button>
          </div>
        </div>

        {/* Table */}
        <div style={{ flex: 1, overflow: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e8e8e8', position: 'sticky', top: 0, zIndex: 1 }}>
                <th style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 700, color: '#555', whiteSpace: 'nowrap' }}>Account</th>
                <th style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 700, color: '#555' }}>Contact Info</th>
                <th style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 700, color: '#555' }}>Followers</th>
                <th style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 700, color: '#555' }}>Score</th>
                <th style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 700, color: '#555' }}>Status</th>
                <th style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 700, color: '#555' }}>Keyword</th>
                <th style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 700, color: '#555' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} style={{ textAlign: 'center', padding: 40, color: '#aaa' }}>Loading...</td></tr>
              ) : leads.length === 0 ? (
                <tr><td colSpan={7} style={{ textAlign: 'center', padding: 40, color: '#aaa' }}>No leads found</td></tr>
              ) : leads.map(lead => (
                <tr
                  key={lead.id}
                  onClick={() => openSelected(lead)}
                  style={{
                    borderBottom: '1px solid #f0f0f0', cursor: 'pointer',
                    background: selected?.id === lead.id ? 'rgba(201,168,76,0.08)' : '#fff',
                    transition: 'background 0.1s',
                  }}
                  onMouseEnter={e => { if (selected?.id !== lead.id) e.currentTarget.style.background = '#fafafa'; }}
                  onMouseLeave={e => { if (selected?.id !== lead.id) e.currentTarget.style.background = '#fff'; }}
                >
                  <td style={{ padding: '10px 14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      {lead.profile_picture_url ? (
                        <img src={lead.profile_picture_url} alt="" style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover' }} />
                      ) : (
                        <div style={{
                          width: 32, height: 32, borderRadius: '50%', background: NAVY,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          color: GOLD, fontWeight: 700, fontSize: 13, flexShrink: 0,
                        }}>
                          {(lead.display_name || lead.username || '?')[0].toUpperCase()}
                        </div>
                      )}
                      <div>
                        <div style={{ fontWeight: 600, color: '#222' }}>{lead.display_name || lead.username}</div>
                        <div style={{ fontSize: 11, color: '#888' }}>@{lead.username}</div>
                      </div>
                      {lead.is_verified && <span title="Verified" style={{ fontSize: 14 }}>✓</span>}
                      {lead.crm_lead_id && (
                        <span title="In CRM" style={{
                          fontSize: 10, background: '#dbeafe', color: '#1d4ed8',
                          padding: '1px 6px', borderRadius: 8, fontWeight: 700,
                        }}>CRM</span>
                      )}
                    </div>
                  </td>
                  <td style={{ padding: '10px 14px' }}>
                    <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                      {lead.email && <span style={{ fontSize: 11, background: '#d1fae5', color: '#065f46', padding: '2px 6px', borderRadius: 6 }}>✉</span>}
                      {lead.phone && <span style={{ fontSize: 11, background: '#dbeafe', color: '#1d4ed8', padding: '2px 6px', borderRadius: 6 }}>📞</span>}
                      {lead.whatsapp && <span style={{ fontSize: 11, background: '#d1fae5', color: '#15803d', padding: '2px 6px', borderRadius: 6 }}>WA</span>}
                      {lead.website && <span style={{ fontSize: 11, background: '#f3f4f6', color: '#555', padding: '2px 6px', borderRadius: 6 }}>🌐</span>}
                    </div>
                    {lead.email && <div style={{ fontSize: 11, color: '#555', marginTop: 2 }}>{lead.email}</div>}
                  </td>
                  <td style={{ padding: '10px 14px', color: '#555' }}>
                    {lead.follower_count != null ? lead.follower_count.toLocaleString() : '—'}
                  </td>
                  <td style={{ padding: '10px 14px' }}>
                    <ScoreBadge score={lead.lead_score || 0} />
                  </td>
                  <td style={{ padding: '10px 14px' }}>
                    <StatusChip status={lead.contacted_status} />
                  </td>
                  <td style={{ padding: '10px 14px', color: '#888', fontSize: 12 }}>
                    {lead.search_keyword || '—'}
                  </td>
                  <td style={{ padding: '10px 14px' }}>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button
                        onClick={e => { e.stopPropagation(); openProfile(lead.username); }}
                        title="Open Instagram"
                        style={{ padding: '4px 8px', background: '#f3f4f6', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 13 }}
                      >↗</button>
                      <button
                        onClick={e => { e.stopPropagation(); sendToCRM(lead); }}
                        title="Send to CRM"
                        style={{
                          padding: '4px 8px', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 11,
                          background: lead.crm_lead_id ? '#f0f0f0' : NAVY, color: lead.crm_lead_id ? '#aaa' : '#fff',
                        }}
                      >CRM</button>
                      <button
                        onClick={e => { e.stopPropagation(); deleteLead(lead); }}
                        title="Delete"
                        style={{ padding: '4px 8px', background: '#fee2e2', border: 'none', borderRadius: 6, cursor: 'pointer', color: '#991b1b', fontSize: 13 }}
                      >✕</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div style={{
          background: '#fff', borderTop: '1px solid #e8e8e8', padding: '10px 20px',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <span style={{ fontSize: 13, color: '#888' }}>
            Showing {offset + 1}–{Math.min(offset + LIMIT, total)} of {total}
          </span>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={() => setOffset(Math.max(0, offset - LIMIT))}
              disabled={offset === 0}
              style={{ padding: '6px 14px', borderRadius: 6, border: '1px solid #ddd', background: '#fff', cursor: offset === 0 ? 'not-allowed' : 'pointer', opacity: offset === 0 ? 0.4 : 1 }}
            >← Prev</button>
            <button
              onClick={() => setOffset(offset + LIMIT)}
              disabled={offset + LIMIT >= total}
              style={{ padding: '6px 14px', borderRadius: 6, border: '1px solid #ddd', background: '#fff', cursor: offset + LIMIT >= total ? 'not-allowed' : 'pointer', opacity: offset + LIMIT >= total ? 0.4 : 1 }}
            >Next →</button>
          </div>
        </div>
      </div>

      {/* Right — detail panel */}
      {selected && (
        <div style={{
          width: 340, background: '#fff', borderLeft: '1px solid #e8e8e8',
          display: 'flex', flexDirection: 'column', overflow: 'hidden', flexShrink: 0,
        }}>
          {/* Profile header */}
          <div style={{ padding: 20, borderBottom: '1px solid #f0f0f0', background: NAVY }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
              <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>Profile</span>
              <button onClick={() => setSelected(null)} style={{
                background: 'none', border: 'none', color: 'rgba(255,255,255,0.6)', cursor: 'pointer', fontSize: 16,
              }}>✕</button>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              {selected.profile_picture_url ? (
                <img src={selected.profile_picture_url} alt=""
                  style={{ width: 52, height: 52, borderRadius: '50%', objectFit: 'cover', border: `2px solid ${GOLD}` }} />
              ) : (
                <div style={{
                  width: 52, height: 52, borderRadius: '50%', background: 'rgba(255,255,255,0.1)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: GOLD, fontWeight: 800, fontSize: 20, border: `2px solid ${GOLD}`,
                }}>
                  {(selected.display_name || selected.username || '?')[0].toUpperCase()}
                </div>
              )}
              <div>
                <div style={{ color: '#fff', fontWeight: 700, fontSize: 15 }}>
                  {selected.display_name || selected.username}
                  {selected.is_verified && <span style={{ color: GOLD, marginLeft: 4 }}>✓</span>}
                </div>
                <button
                  onClick={() => openProfile(selected.username)}
                  style={{ background: 'none', border: 'none', color: GOLD, fontSize: 12, cursor: 'pointer', padding: 0 }}
                >
                  @{selected.username} ↗
                </button>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 16, marginTop: 14 }}>
              {[
                { label: 'Followers', val: selected.follower_count?.toLocaleString() ?? '—' },
                { label: 'Following', val: selected.following_count?.toLocaleString() ?? '—' },
                { label: 'Posts', val: selected.post_count?.toLocaleString() ?? '—' },
              ].map(s => (
                <div key={s.label} style={{ textAlign: 'center' }}>
                  <div style={{ color: '#fff', fontWeight: 700, fontSize: 14 }}>{s.val}</div>
                  <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 10 }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ flex: 1, overflow: 'auto', padding: 16 }}>
            {/* Bio */}
            {selected.bio && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#aaa', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 4 }}>Bio</div>
                <div style={{ fontSize: 13, color: '#444', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{selected.bio}</div>
              </div>
            )}

            {/* Contact info */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#aaa', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8 }}>Contact</div>
              {[
                { icon: '✉', label: 'Email', val: selected.email },
                { icon: '📞', label: 'Phone', val: selected.phone },
                { icon: '💬', label: 'WhatsApp', val: selected.whatsapp },
                { icon: '🌐', label: 'Website', val: selected.website },
              ].map(row => row.val ? (
                <div key={row.label} style={{ display: 'flex', gap: 8, marginBottom: 6, alignItems: 'flex-start' }}>
                  <span style={{ fontSize: 14, flexShrink: 0, marginTop: 1 }}>{row.icon}</span>
                  <div style={{ fontSize: 12, color: '#444', wordBreak: 'break-all' }}>{row.val}</div>
                </div>
              ) : null)}
              {!selected.email && !selected.phone && !selected.whatsapp && !selected.website && (
                <div style={{ fontSize: 12, color: '#aaa' }}>No contact info found in bio</div>
              )}
            </div>

            {/* Lead score */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#aaa', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 4 }}>Lead Score</div>
              <ScoreBadge score={selected.lead_score || 0} />
              <div style={{ fontSize: 11, color: '#888', marginTop: 4 }}>Keyword: {selected.search_keyword || '—'}</div>
            </div>

            {/* Status */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#aaa', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 6 }}>Status</div>
              <select
                value={editStatus} onChange={e => setEditStatus(e.target.value)}
                style={{ width: '100%', padding: '8px 10px', borderRadius: 7, border: '1px solid #ddd', fontSize: 13 }}
              >
                {STATUSES.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
              </select>
            </div>

            {/* Notes */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#aaa', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 6 }}>Notes</div>
              <textarea
                value={editNotes} onChange={e => setEditNotes(e.target.value)}
                rows={4}
                placeholder="Add notes..."
                style={{ width: '100%', padding: '8px 10px', borderRadius: 7, border: '1px solid #ddd', fontSize: 13, resize: 'vertical', boxSizing: 'border-box' }}
              />
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <button onClick={saveChanges} disabled={saving} style={{
                padding: '10px', background: NAVY, color: '#fff',
                border: 'none', borderRadius: 8, fontWeight: 600, fontSize: 13, cursor: 'pointer',
              }}>
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
              <button
                onClick={() => sendToCRM(selected)}
                style={{
                  padding: '10px', border: `1px solid ${NAVY}`, background: '#fff',
                  color: NAVY, borderRadius: 8, fontWeight: 600, fontSize: 13, cursor: 'pointer',
                }}
              >
                {selected.crm_lead_id ? '✓ Already in CRM' : 'Send to CRM'}
              </button>
              <button onClick={() => openProfile(selected.username)} style={{
                padding: '10px', background: 'linear-gradient(135deg, #833ab4, #fd1d1d, #fcb045)',
                color: '#fff', border: 'none', borderRadius: 8, fontWeight: 600, fontSize: 13, cursor: 'pointer',
              }}>
                Open Instagram Profile ↗
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
