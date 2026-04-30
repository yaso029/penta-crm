import { useEffect, useState, useRef } from 'react';
import api from '../api';
import toast from 'react-hot-toast';
import useIsMobile from '../hooks/useIsMobile';

const NAVY = '#0A2342';
const GOLD = '#C9A84C';

const EMPTY_VALUES = new Set(['null', 'n/a', 'na', 'none', '-', '--', '', 'undefined', '#n/a', 'nil']);

function cleanValue(v) {
  const s = (v || '').toString().trim().replace(/^"|"$/g, '').trim();
  return EMPTY_VALUES.has(s.toLowerCase()) ? '' : s;
}

function formatPhone(raw) {
  if (!raw) return '';
  // Remove everything except digits and leading +
  let digits = raw.replace(/[^\d+]/g, '');
  // Remove leading +
  digits = digits.replace(/^\+/, '');
  // Remove leading 00
  if (digits.startsWith('00')) digits = digits.slice(2);
  // UAE: starts with 0 followed by 5 (e.g. 0501234567) → 971501234567
  if (digits.startsWith('05')) digits = '971' + digits.slice(1);
  // Starts with 5 and length ~9 → UAE mobile
  if (digits.startsWith('5') && digits.length === 9) digits = '971' + digits;
  // Starts with 971 already → keep
  // Add + prefix
  return '+' + digits;
}

function splitCSVLine(line) {
  const result = [];
  let cur = '', inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') { inQuotes = !inQuotes; continue; }
    if (ch === ',' && !inQuotes) { result.push(cur); cur = ''; continue; }
    cur += ch;
  }
  result.push(cur);
  return result;
}

function parseCSV(text) {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) return { rows: [], skipped: 0 };
  const headers = splitCSVLine(lines[0]).map(h => h.trim().toLowerCase().replace(/[^a-z0-9_]/g, ''));

  let skipped = 0;
  const rows = [];

  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue;
    const vals = splitCSVLine(lines[i]);
    const row = {};
    headers.forEach((h, idx) => { row[h] = cleanValue(vals[idx]); });

    const name = row['full_name'] || row['name'] || row['fullname'] || row['client_name'] || row['customer_name'] || '';
    const rawPhone = row['phone'] || row['phone_number'] || row['mobile'] || row['tel'] || row['telephone'] || '';
    const email = row['email'] || row['email_address'] || '';

    if (!name) { skipped++; continue; }

    const phone = rawPhone ? formatPhone(rawPhone) : '';
    const validPhone = phone.length >= 10;
    const validEmail = email.includes('@');

    // Must have name + (valid phone OR valid email)
    if (!validPhone && !validEmail) { skipped++; continue; }

    rows.push({ full_name: name, phone: validPhone ? phone : '', email: validEmail ? email : '' });
  }

  return { rows, skipped };
}

export default function CustomersPage() {
  const isMobile = useIsMobile();
  const [data, setData] = useState({ customers: [], total: 0, synced: 0, not_synced: 0 });
  const [loading, setLoading] = useState(true);
  const [syncingAll, setSyncingAll] = useState(false);
  const [syncingId, setSyncingId] = useState(null);
  const [search, setSearch] = useState('');
  const fileRef = useRef();

  const fetchData = async () => {
    try {
      const { data: res } = await api.get('/api/customers');
      setData(res);
    } catch { toast.error('Failed to load customers'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const text = await file.text();
    const { rows, skipped } = parseCSV(text);
    if (!rows.length) {
      toast.error('No valid rows found. Each row needs a name + phone or email.');
      e.target.value = '';
      return;
    }
    try {
      const { data: res } = await api.post('/api/customers/import', { customers: rows });
      toast.success(`${res.added} imported, ${skipped} skipped (missing contact info)`);
      fetchData();
    } catch { toast.error('Import failed'); }
    e.target.value = '';
  };

  const syncAll = async () => {
    const unsynced = data.not_synced;
    if (!unsynced) { toast('All customers already synced to Meta'); return; }
    setSyncingAll(true);
    try {
      const { data: res } = await api.post('/api/customers/sync-all');
      toast.success(`${res.synced} customers synced to Meta!`);
      fetchData();
    } catch { toast.error('Sync failed'); }
    finally { setSyncingAll(false); }
  };

  const syncOne = async (id) => {
    setSyncingId(id);
    try {
      await api.post(`/api/customers/${id}/sync`);
      toast.success('Synced to Meta');
      fetchData();
    } catch { toast.error('Sync failed'); }
    finally { setSyncingId(null); }
  };

  const deleteCustomer = async (id) => {
    if (!confirm('Delete this customer?')) return;
    try {
      await api.delete(`/api/customers/${id}`);
      setData(prev => ({
        ...prev,
        customers: prev.customers.filter(c => c.id !== id),
        total: prev.total - 1,
      }));
    } catch { toast.error('Delete failed'); }
  };

  const filtered = data.customers.filter(c =>
    !search || c.full_name.toLowerCase().includes(search.toLowerCase()) ||
    c.phone?.includes(search) || c.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: isMobile ? 18 : 22, fontWeight: 700, color: '#1a1a2e' }}>Old Customers</h1>
          <p style={{ color: '#888', fontSize: 13, marginTop: 2 }}>Upload past clients to train Meta's algorithm</p>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button
            onClick={() => fileRef.current.click()}
            style={{ padding: '9px 16px', background: '#fff', color: NAVY, border: `1.5px solid ${NAVY}`, borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 13 }}
          >
            Import CSV
          </button>
          <button
            onClick={syncAll}
            disabled={syncingAll || !data.not_synced}
            style={{
              padding: '9px 16px', background: syncingAll ? '#888' : GOLD, color: '#fff',
              border: 'none', borderRadius: 8, cursor: syncingAll ? 'not-allowed' : 'pointer', fontWeight: 700, fontSize: 13,
            }}
          >
            {syncingAll ? 'Syncing...' : `Sync All to Meta (${data.not_synced})`}
          </button>
          <input ref={fileRef} type="file" accept=".csv" style={{ display: 'none' }} onChange={handleFileUpload} />
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        {[
          { label: 'Total Customers', value: data.total, color: NAVY, icon: '👥' },
          { label: 'Synced to Meta', value: data.synced, color: '#10b981', icon: '✅' },
          { label: 'Not Yet Synced', value: data.not_synced, color: '#f59e0b', icon: '⏳' },
        ].map(s => (
          <div key={s.label} style={{
            background: '#fff', borderRadius: 12, padding: '16px 20px',
            boxShadow: '0 1px 6px rgba(0,0,0,0.07)', borderTop: `3px solid ${s.color}`,
            flex: 1, minWidth: 120,
          }}>
            <div style={{ fontSize: 22 }}>{s.icon}</div>
            <div style={{ fontSize: 26, fontWeight: 700, color: '#1a1a2e', lineHeight: 1.2 }}>{s.value}</div>
            <div style={{ fontSize: 12, color: '#888', marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* CSV format hint */}
      <div style={{ background: '#f0f4ff', borderRadius: 10, padding: '12px 16px', marginBottom: 16, fontSize: 12, color: '#555', border: '1px solid #dde8ff' }}>
        <strong>CSV format:</strong> Columns: <code>name</code>, <code>phone</code>, <code>email</code> (other columns ignored). Rows kept only if they have name + phone or name + email. Phone numbers auto-formatted to international format. Null/empty/N/A values handled automatically.
      </div>

      {/* Search */}
      <input
        value={search}
        onChange={e => setSearch(e.target.value)}
        placeholder="Search customers..."
        style={{ width: '100%', padding: '9px 14px', border: '1.5px solid #e0e0e0', borderRadius: 8, fontSize: 13, outline: 'none', marginBottom: 14 }}
      />

      {/* List */}
      {loading ? (
        <div style={{ padding: 40, textAlign: 'center', color: '#aaa' }}>Loading...</div>
      ) : filtered.length === 0 ? (
        <div style={{ padding: 40, textAlign: 'center', color: '#aaa' }}>
          {data.total === 0 ? 'No customers yet. Import a CSV to get started.' : 'No results found.'}
        </div>
      ) : isMobile ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filtered.map(c => (
            <div key={c.id} style={{ background: '#fff', borderRadius: 12, padding: '14px 16px', boxShadow: '0 1px 4px rgba(0,0,0,0.07)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14, color: '#1a1a2e' }}>{c.full_name}</div>
                  <div style={{ fontSize: 12, color: '#666', marginTop: 2 }}>{c.phone || '—'}</div>
                  <div style={{ fontSize: 12, color: '#888' }}>{c.email || '—'}</div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-end' }}>
                  <span style={{
                    background: c.synced_to_meta ? '#d1fae5' : '#fef3c7',
                    color: c.synced_to_meta ? '#065f46' : '#92400e',
                    borderRadius: 20, padding: '2px 10px', fontSize: 11, fontWeight: 600,
                  }}>
                    {c.synced_to_meta ? 'Synced' : 'Not Synced'}
                  </span>
                  {!c.synced_to_meta && (
                    <button
                      onClick={() => syncOne(c.id)}
                      disabled={syncingId === c.id}
                      style={{ padding: '5px 12px', background: NAVY, color: '#fff', border: 'none', borderRadius: 6, fontSize: 11, cursor: 'pointer', fontWeight: 600 }}
                    >
                      {syncingId === c.id ? '...' : 'Sync'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 1px 6px rgba(0,0,0,0.07)', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#fafafa', borderBottom: '1px solid #f0f0f0' }}>
                {['Name', 'Phone', 'Email', 'Status', 'Synced At', 'Actions'].map(h => (
                  <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: '#888', textTransform: 'uppercase', letterSpacing: 0.5 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(c => (
                <tr key={c.id} style={{ borderBottom: '1px solid #f5f5f5' }}>
                  <td style={{ padding: '12px 16px', fontWeight: 600, fontSize: 13, color: '#1a1a2e' }}>{c.full_name}</td>
                  <td style={{ padding: '12px 16px', fontSize: 13, color: '#555' }}>{c.phone || '—'}</td>
                  <td style={{ padding: '12px 16px', fontSize: 13, color: '#555' }}>{c.email || '—'}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{
                      background: c.synced_to_meta ? '#d1fae5' : '#fef3c7',
                      color: c.synced_to_meta ? '#065f46' : '#92400e',
                      borderRadius: 20, padding: '3px 10px', fontSize: 11, fontWeight: 600,
                    }}>
                      {c.synced_to_meta ? '✓ Synced' : '⏳ Pending'}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: 12, color: '#aaa' }}>
                    {c.synced_at ? new Date(c.synced_at).toLocaleDateString() : '—'}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', gap: 8 }}>
                      {!c.synced_to_meta && (
                        <button
                          onClick={() => syncOne(c.id)}
                          disabled={syncingId === c.id}
                          style={{ padding: '5px 12px', background: NAVY, color: '#fff', border: 'none', borderRadius: 6, fontSize: 12, cursor: 'pointer', fontWeight: 600 }}
                        >
                          {syncingId === c.id ? 'Syncing...' : 'Sync'}
                        </button>
                      )}
                      <button
                        onClick={() => deleteCustomer(c.id)}
                        style={{ padding: '5px 12px', background: '#fff', color: '#ef4444', border: '1px solid #ef4444', borderRadius: 6, fontSize: 12, cursor: 'pointer' }}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
