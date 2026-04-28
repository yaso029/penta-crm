import { useState, useRef } from 'react';
import api from '../api';
import toast from 'react-hot-toast';

const NAVY = '#0A2342';

const FIELD_LABELS = {
  full_name: 'Full Name', phone: 'Phone', email: 'Email', source: 'Source',
  budget: 'Budget', property_type: 'Property Type', preferred_area: 'Preferred Area', notes: 'Notes',
};

export default function ImportModal({ onClose, onImported }) {
  const fileRef = useRef();
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState(null);
  const [dragOver, setDragOver] = useState(false);

  const handleFile = async (f) => {
    if (!f) return;
    const ext = f.name.split('.').pop().toLowerCase();
    if (!['csv', 'xlsx', 'xls'].includes(ext)) {
      toast.error('Only CSV and Excel (.xlsx) files allowed');
      return;
    }
    setFile(f);
    setResult(null);
    setLoading(true);
    try {
      const form = new FormData();
      form.append('file', f);
      const { data } = await api.post('/api/leads/import/preview', form);
      setPreview(data);
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to read file');
      setFile(null);
    } finally {
      setLoading(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  };

  const handleImport = async () => {
    if (!file) return;
    setImporting(true);
    try {
      const form = new FormData();
      form.append('file', file);
      const { data } = await api.post('/api/leads/import', form);
      setResult(data);
      if (data.created > 0) {
        onImported();
        toast.success(`${data.created} leads imported!`);
      }
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Import failed');
    } finally {
      setImporting(false);
    }
  };

  const reset = () => {
    setFile(null);
    setPreview(null);
    setResult(null);
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: '#fff', borderRadius: 16, padding: '32px 36px', width: 600, maxHeight: '85vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: '#1a1a2e' }}>Import Leads</h2>
            <p style={{ fontSize: 13, color: '#888', marginTop: 4 }}>Upload a CSV or Excel file to bulk-add leads</p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: '#aaa' }}>×</button>
        </div>

        {/* Result screen */}
        {result ? (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>{result.created > 0 ? '✅' : '⚠️'}</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: '#1a1a2e', marginBottom: 8 }}>
              {result.created} leads imported
            </div>
            {result.skipped > 0 && (
              <div style={{ fontSize: 14, color: '#888', marginBottom: 8 }}>{result.skipped} rows skipped</div>
            )}
            {result.errors?.length > 0 && (
              <div style={{ background: '#fef2f2', borderRadius: 8, padding: '12px 16px', textAlign: 'left', marginBottom: 16 }}>
                {result.errors.map((e, i) => <div key={i} style={{ fontSize: 12, color: '#ef4444' }}>{e}</div>)}
              </div>
            )}
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 20 }}>
              <button onClick={reset} style={{ padding: '9px 20px', border: `1.5px solid ${NAVY}`, color: NAVY, background: '#fff', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
                Import Another
              </button>
              <button onClick={onClose} style={{ padding: '9px 20px', background: NAVY, color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
                Done
              </button>
            </div>
          </div>
        ) : !file ? (
          /* Drop zone */
          <div
            onDragOver={e => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileRef.current.click()}
            style={{
              border: `2px dashed ${dragOver ? NAVY : '#d0d0d0'}`,
              borderRadius: 12, padding: '48px 24px', textAlign: 'center', cursor: 'pointer',
              background: dragOver ? '#f0f4ff' : '#fafafa', transition: 'all 0.15s',
            }}
          >
            <div style={{ fontSize: 40, marginBottom: 12 }}>📂</div>
            <div style={{ fontSize: 15, fontWeight: 600, color: '#1a1a2e', marginBottom: 6 }}>
              Drop your file here or click to browse
            </div>
            <div style={{ fontSize: 13, color: '#aaa' }}>Supports CSV and Excel (.xlsx)</div>
            <input ref={fileRef} type="file" accept=".csv,.xlsx,.xls" style={{ display: 'none' }}
              onChange={e => handleFile(e.target.files[0])} />
          </div>
        ) : loading ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: '#888' }}>Reading file...</div>
        ) : preview && (
          /* Preview */
          <div>
            <div style={{ background: '#f0f9ff', borderRadius: 10, padding: '14px 16px', marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: 14, color: '#1a1a2e' }}>📄 {file.name}</div>
                <div style={{ fontSize: 12, color: '#666', marginTop: 2 }}>
                  {preview.total_rows} rows found · <strong style={{ color: '#10b981' }}>{preview.importable_rows} ready to import</strong>
                </div>
              </div>
              <button onClick={reset} style={{ background: 'none', border: 'none', color: '#aaa', cursor: 'pointer', fontSize: 13 }}>Change file</button>
            </div>

            {/* Column mapping */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#555', marginBottom: 10 }}>Column Detection</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {preview.headers.map(h => {
                  const mapped = preview.column_mapping[h];
                  return (
                    <div key={h} style={{
                      padding: '5px 12px', borderRadius: 20, fontSize: 12, fontWeight: 500,
                      background: mapped ? '#dcfce7' : '#f3f4f6',
                      color: mapped ? '#15803d' : '#888',
                      border: `1px solid ${mapped ? '#bbf7d0' : '#e5e7eb'}`,
                    }}>
                      {h} {mapped ? `→ ${FIELD_LABELS[mapped]}` : '(ignored)'}
                    </div>
                  );
                })}
              </div>
              {preview.unrecognized_columns.length > 0 && (
                <div style={{ fontSize: 12, color: '#f59e0b', marginTop: 8 }}>
                  ⚠️ {preview.unrecognized_columns.length} column(s) not recognized and will be skipped
                </div>
              )}
            </div>

            {/* Preview table */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#555', marginBottom: 10 }}>
                Preview (first {preview.preview.length} rows)
              </div>
              <div style={{ overflowX: 'auto', borderRadius: 8, border: '1px solid #f0f0f0' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                  <thead>
                    <tr style={{ background: '#fafafa' }}>
                      {['Name', 'Phone', 'Email', 'Source', 'Budget'].map(h => (
                        <th key={h} style={{ padding: '8px 12px', textAlign: 'left', color: '#888', fontWeight: 600, whiteSpace: 'nowrap' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {preview.preview.map((row, i) => (
                      <tr key={i} style={{ borderTop: '1px solid #f5f5f5' }}>
                        <td style={{ padding: '8px 12px', color: '#1a1a2e', fontWeight: 500 }}>{row.full_name || '—'}</td>
                        <td style={{ padding: '8px 12px', color: '#555' }}>{row.phone || '—'}</td>
                        <td style={{ padding: '8px 12px', color: '#555' }}>{row.email || '—'}</td>
                        <td style={{ padding: '8px 12px', color: '#555' }}>{row.source || '—'}</td>
                        <td style={{ padding: '8px 12px', color: '#555' }}>{row.budget || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={onClose} style={{ padding: '10px 22px', border: '1.5px solid #e0e0e0', borderRadius: 8, background: '#fff', cursor: 'pointer', fontSize: 13 }}>
                Cancel
              </button>
              <button
                onClick={handleImport}
                disabled={importing || preview.importable_rows === 0}
                style={{
                  padding: '10px 22px', background: NAVY, color: '#fff', border: 'none',
                  borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600,
                  opacity: importing || preview.importable_rows === 0 ? 0.6 : 1,
                }}
              >
                {importing ? 'Importing...' : `Import ${preview.importable_rows} Leads`}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
