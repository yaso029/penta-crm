import { useState, useEffect, useRef } from 'react';
import api from '../../api';

const GOLD = '#C9A84C';
const NAVY = '#0A2342';

function SessionCard({ s, onSelect, onReport }) {
  return (
    <div
      onClick={() => onSelect(s)}
      style={{
        background: '#fff', borderRadius: 10, padding: '14px 16px',
        border: '1px solid #eee', cursor: 'pointer', marginBottom: 8,
        borderLeft: `3px solid ${s.completed ? '#059669' : GOLD}`,
        transition: 'box-shadow 0.15s',
      }}
      onMouseEnter={e => e.currentTarget.style.boxShadow = '0 2px 10px rgba(0,0,0,0.08)'}
      onMouseLeave={e => e.currentTarget.style.boxShadow = ''}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontWeight: 700, color: '#0d1f3c', fontSize: 14 }}>
            {s.client_name || 'Unnamed Client'}
          </div>
          <div style={{ fontSize: 12, color: '#888', marginTop: 2 }}>
            {s.client_phone && `📞 ${s.client_phone} · `}
            {s.budget_aed && `💰 ${s.budget_aed} · `}
            {s.property_type && s.property_type}
          </div>
          <div style={{ fontSize: 11, color: '#aaa', marginTop: 4 }}>
            {s.created_at ? new Date(s.created_at).toLocaleString() : ''}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <span style={{
            padding: '2px 8px', borderRadius: 20, fontSize: 10, fontWeight: 800,
            textTransform: 'uppercase', letterSpacing: 0.8,
            background: s.completed ? '#d1fae5' : '#fef3c7',
            color: s.completed ? '#065f46' : '#92400e',
          }}>{s.completed ? 'Done' : 'Active'}</span>
          {s.completed && (
            <button
              onClick={e => { e.stopPropagation(); onReport(s.session_id); }}
              style={{ padding: '4px 10px', borderRadius: 6, border: `1px solid ${NAVY}`, background: NAVY, color: '#fff', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}
            >
              PDF
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function IntakeAI() {
  const [sessions, setSessions] = useState([]);
  const [activeSession, setActiveSession] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [starting, setStarting] = useState(false);
  const [view, setView] = useState('list'); // 'list' | 'chat'
  const bottomRef = useRef(null);

  const fetchSessions = () => api.get('/api/ai/intake/sessions').then(r => setSessions(r.data)).catch(() => {});

  useEffect(() => { fetchSessions(); }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const startSession = async () => {
    setStarting(true);
    try {
      const r = await api.post('/api/ai/intake/start');
      const sess = { session_id: r.data.session_id, client_name: null, completed: false };
      setActiveSession(sess);
      setMessages([{ role: 'assistant', content: r.data.message }]);
      setView('chat');
      fetchSessions();
    } catch {
      alert('Failed to start session');
    } finally {
      setStarting(false);
    }
  };

  const selectSession = (s) => {
    setActiveSession(s);
    setMessages([]);
    setView('chat');
  };

  const sendMessage = async () => {
    if (!input.trim() || sending || !activeSession) return;
    const userMsg = input.trim();
    setInput('');
    setMessages(p => [...p, { role: 'user', content: userMsg }]);
    setSending(true);
    try {
      const r = await api.post('/api/ai/intake/message', { session_id: activeSession.session_id, message: userMsg });
      setMessages(p => [...p, { role: 'assistant', content: r.data.message }]);
      if (r.data.completed) {
        setActiveSession(s => ({ ...s, completed: true }));
        fetchSessions();
      }
    } catch {
      setMessages(p => [...p, { role: 'assistant', content: '⚠️ Error — please try again.' }]);
    } finally {
      setSending(false);
    }
  };

  const downloadReport = async (sessionId) => {
    try {
      const r = await api.post(`/api/ai/intake/${sessionId}/report`, {}, { responseType: 'blob' });
      const url = URL.createObjectURL(new Blob([r.data], { type: 'application/pdf' }));
      const a = document.createElement('a'); a.href = url; a.download = `intake_${sessionId.slice(0, 8)}.pdf`;
      a.click(); URL.revokeObjectURL(url);
    } catch { alert('Failed to generate report'); }
  };

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 22, fontWeight: 800, color: '#0d1f3c' }}>Intake AI</div>
        <div style={{ fontSize: 13, color: '#888', marginTop: 2 }}>Claude-powered client intake conversations</div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 16, height: 'calc(100vh - 200px)' }}>
        {/* Session list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          <button
            onClick={startSession}
            disabled={starting}
            style={{
              padding: '11px', borderRadius: 10, border: 'none',
              background: starting ? '#e2e8f0' : GOLD, color: starting ? '#94a3b8' : NAVY,
              fontWeight: 800, fontSize: 13, cursor: starting ? 'not-allowed' : 'pointer',
              marginBottom: 12,
            }}
          >
            {starting ? '⏳ Starting…' : '+ New Intake Session'}
          </button>
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {sessions.length === 0 ? (
              <div style={{ fontSize: 13, color: '#bbb', padding: '20px 0', textAlign: 'center' }}>No sessions yet</div>
            ) : sessions.map(s => (
              <SessionCard key={s.session_id} s={s} onSelect={selectSession} onReport={downloadReport} />
            ))}
          </div>
        </div>

        {/* Chat */}
        {view === 'list' ? (
          <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #eee', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#bbb', fontSize: 14 }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>🤖</div>
              <div>Select a session or start a new one</div>
            </div>
          </div>
        ) : (
          <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #eee', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div style={{ padding: '14px 20px', borderBottom: '1px solid #eee', display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#0d1f3c' }}>
                {activeSession?.client_name || 'New Session'}
              </div>
              {activeSession?.completed && (
                <span style={{ padding: '2px 8px', borderRadius: 20, fontSize: 10, fontWeight: 800, background: '#d1fae5', color: '#065f46' }}>COMPLETED</span>
              )}
              <button
                onClick={() => setView('list')}
                style={{ marginLeft: 'auto', padding: '4px 12px', borderRadius: 6, border: '1px solid #e2e8f0', background: '#f8fafc', color: '#555', fontSize: 12, cursor: 'pointer' }}
              >
                ← Sessions
              </button>
              {activeSession?.completed && (
                <button
                  onClick={() => downloadReport(activeSession.session_id)}
                  style={{ padding: '4px 12px', borderRadius: 6, border: `1px solid ${NAVY}`, background: NAVY, color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
                >
                  📄 PDF
                </button>
              )}
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
              {messages.map((m, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
                  <div style={{
                    maxWidth: '72%', padding: '10px 14px', borderRadius: 12,
                    background: m.role === 'user' ? NAVY : '#f1f5f9',
                    color: m.role === 'user' ? '#fff' : '#0d1f3c',
                    fontSize: 14, lineHeight: 1.55,
                    borderBottomRightRadius: m.role === 'user' ? 2 : 12,
                    borderBottomLeftRadius: m.role === 'assistant' ? 2 : 12,
                  }}>
                    {m.content.split('\n').map((line, li) => <div key={li}>{line || <br />}</div>)}
                  </div>
                </div>
              ))}
              {sending && (
                <div style={{ display: 'flex' }}>
                  <div style={{ padding: '10px 14px', borderRadius: 12, background: '#f1f5f9', color: '#888', fontSize: 13 }}>
                    <span style={{ animation: 'pulse 1s infinite' }}>✦ Thinking…</span>
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            {!activeSession?.completed && (
              <div style={{ padding: '12px 16px', borderTop: '1px solid #eee', display: 'flex', gap: 8 }}>
                <input
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                  placeholder="Type a message…"
                  disabled={sending}
                  style={{
                    flex: 1, padding: '10px 14px', borderRadius: 8, border: '1px solid #e2e8f0',
                    fontSize: 14, outline: 'none', background: '#f8fafc',
                  }}
                />
                <button
                  onClick={sendMessage}
                  disabled={sending || !input.trim()}
                  style={{
                    padding: '10px 18px', borderRadius: 8, border: 'none',
                    background: (!input.trim() || sending) ? '#e2e8f0' : NAVY,
                    color: (!input.trim() || sending) ? '#94a3b8' : '#fff',
                    fontWeight: 700, cursor: (!input.trim() || sending) ? 'not-allowed' : 'pointer',
                  }}
                >
                  Send →
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
