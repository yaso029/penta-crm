import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import api from '../api';

const ROLE_LABELS = { admin: 'Administrator', team_leader: 'Team Leader', broker: 'Broker', hr_admin: 'HR Admin' };
const ROLE_COLORS = { admin: '#C9A84C', team_leader: '#6366f1', broker: '#0891b2', hr_admin: '#0d7377' };

function Section({ title, children }) {
  return (
    <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: '28px 32px', marginBottom: 24 }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.4)', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 20 }}>{title}</div>
      {children}
    </div>
  );
}

function Input({ label, value, onChange, type = 'text', placeholder }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.45)', marginBottom: 6 }}>{label}</label>
      <input type={type} value={value} onChange={onChange} placeholder={placeholder}
        style={{ width: '100%', padding: '10px 14px', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 9, fontSize: 14, color: '#fff', outline: 'none', boxSizing: 'border-box' }} />
    </div>
  );
}

export default function SettingsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const isYaso = user?.email === 'yaso@pentacrm.com';

  const [ownPassword, setOwnPassword] = useState('');
  const [ownPwSaving, setOwnPwSaving] = useState(false);
  const [ownPwMsg, setOwnPwMsg] = useState('');

  const [users, setUsers] = useState([]);
  const [resetPw, setResetPw] = useState({});
  const [resetMsg, setResetMsg] = useState({});

  const [showAddUser, setShowAddUser] = useState(false);
  const [addForm, setAddForm] = useState({ full_name: '', email: '', password: '', role: 'broker', team_leader_id: '' });
  const [addSaving, setAddSaving] = useState(false);
  const [addMsg, setAddMsg] = useState('');

  const teamLeaders = users.filter(u => u.role === 'team_leader');

  useEffect(() => {
    if (isYaso) {
      api.get('/api/users').then(r => setUsers(r.data)).catch(() => {});
    }
  }, [isYaso]);

  const handleOwnPassword = async (e) => {
    e.preventDefault();
    setOwnPwSaving(true);
    setOwnPwMsg('');
    try {
      await api.patch('/api/users/me/password', { password: ownPassword });
      setOwnPwMsg('Password updated successfully');
      setOwnPassword('');
    } catch (err) {
      setOwnPwMsg(err?.response?.data?.detail || 'Failed to update password');
    }
    setOwnPwSaving(false);
  };

  const handleResetPassword = async (userId) => {
    const pw = resetPw[userId] || '';
    if (!pw) return;
    try {
      await api.patch(`/api/users/${userId}/password`, { password: pw });
      setResetMsg(m => ({ ...m, [userId]: 'Reset successfully' }));
      setResetPw(p => ({ ...p, [userId]: '' }));
    } catch {
      setResetMsg(m => ({ ...m, [userId]: 'Failed' }));
    }
  };

  const handleAddUser = async (e) => {
    e.preventDefault();
    setAddSaving(true);
    setAddMsg('');
    try {
      const payload = { ...addForm, team_leader_id: addForm.team_leader_id ? parseInt(addForm.team_leader_id) : null };
      await api.post('/api/users', payload);
      setAddMsg('User created successfully');
      setAddForm({ full_name: '', email: '', password: '', role: 'broker', team_leader_id: '' });
      api.get('/api/users').then(r => setUsers(r.data));
      setShowAddUser(false);
    } catch (err) {
      setAddMsg(err?.response?.data?.detail || 'Failed to create user');
    }
    setAddSaving(false);
  };

  const handleDeactivate = async (userId) => {
    if (!window.confirm('Deactivate this user?')) return;
    try {
      await api.delete(`/api/users/${userId}`);
      setUsers(u => u.map(x => x.id === userId ? { ...x, is_active: false } : x));
    } catch {}
  };

  return (
    <div style={{ minHeight: '100vh', background: '#0b0f1a', color: '#fff' }}>
      {/* Header */}
      <div style={{ background: 'linear-gradient(170deg, #0d1728 0%, #091322 100%)', borderBottom: '1px solid rgba(255,255,255,0.06)', padding: '20px 32px', display: 'flex', alignItems: 'center', gap: 16 }}>
        <button onClick={() => navigate('/')} style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: 'rgba(255,255,255,0.5)', fontSize: 13, cursor: 'pointer', padding: '7px 14px' }}>← Home</button>
        <div>
          <div style={{ fontSize: 20, fontWeight: 900, color: '#fff' }}>Settings</div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>Account & system management</div>
        </div>
      </div>

      <div style={{ maxWidth: 860, margin: '0 auto', padding: '40px 24px' }}>

        {/* My Account */}
        <Section title="My Account">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
            {[['Full Name', user?.full_name], ['Email', user?.email]].map(([label, val]) => (
              <div key={label}>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginBottom: 4 }}>{label}</div>
                <div style={{ fontSize: 15, fontWeight: 600, color: '#fff' }}>{val}</div>
              </div>
            ))}
          </div>
          <div style={{ marginBottom: 0 }}>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginBottom: 6 }}>Role & Permissions</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ background: `rgba(${ROLE_COLORS[user?.role] || '#888'}, 0.15)`, color: ROLE_COLORS[user?.role] || '#888', fontSize: 12, fontWeight: 700, padding: '4px 14px', borderRadius: 20, border: `1px solid ${ROLE_COLORS[user?.role] || '#888'}33` }}>
                {ROLE_LABELS[user?.role] || user?.role}
              </span>
              {user?.role === 'broker' && <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)' }}>Access: CRM, Agents Dashboard, Calendar</span>}
              {user?.role === 'team_leader' && <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)' }}>Access: CRM, Agents Dashboard, Calendar</span>}
              {user?.role === 'admin' && <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)' }}>Full system access</span>}
              {user?.role === 'hr_admin' && <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)' }}>Access: HR Module, Calendar</span>}
            </div>
          </div>
        </Section>

        {/* Change Password */}
        <Section title="Change My Password">
          <form onSubmit={handleOwnPassword}>
            <Input label="New Password" type="password" value={ownPassword} onChange={e => setOwnPassword(e.target.value)} placeholder="Enter new password" />
            {ownPwMsg && <div style={{ fontSize: 12, color: ownPwMsg.includes('success') ? '#4ade80' : '#f87171', marginBottom: 12 }}>{ownPwMsg}</div>}
            <button type="submit" disabled={ownPwSaving || !ownPassword}
              style={{ padding: '10px 24px', background: '#6366f1', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer', opacity: !ownPassword ? 0.5 : 1 }}>
              {ownPwSaving ? 'Saving...' : 'Update Password'}
            </button>
          </form>
        </Section>

        {/* Admin: User Management */}
        {isYaso && (
          <>
            <Section title="User Management">
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 20 }}>
                <button onClick={() => setShowAddUser(v => !v)}
                  style={{ padding: '9px 20px', background: '#C9A84C', color: '#0d1728', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 800, cursor: 'pointer' }}>
                  {showAddUser ? 'Cancel' : '+ Add User'}
                </button>
              </div>

              {showAddUser && (
                <form onSubmit={handleAddUser} style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 12, padding: '20px 24px', marginBottom: 24, border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.5)', marginBottom: 16 }}>New User</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <Input label="Full Name *" value={addForm.full_name} onChange={e => setAddForm(f => ({ ...f, full_name: e.target.value }))} />
                    <Input label="Email (optional)" value={addForm.email} onChange={e => setAddForm(f => ({ ...f, email: e.target.value }))} placeholder="auto-generated if blank" />
                    <Input label="Password *" type="password" value={addForm.password} onChange={e => setAddForm(f => ({ ...f, password: e.target.value }))} />
                    <div style={{ marginBottom: 16 }}>
                      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.45)', marginBottom: 6 }}>Role</label>
                      <select value={addForm.role} onChange={e => setAddForm(f => ({ ...f, role: e.target.value }))}
                        style={{ width: '100%', padding: '10px 14px', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 9, fontSize: 14, color: '#fff', outline: 'none' }}>
                        <option value="broker">Broker</option>
                        <option value="team_leader">Team Leader</option>
                        <option value="admin">Admin</option>
                        <option value="hr_admin">HR Admin</option>
                      </select>
                    </div>
                    {addForm.role === 'broker' && (
                      <div style={{ marginBottom: 16 }}>
                        <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.45)', marginBottom: 6 }}>Team Leader</label>
                        <select value={addForm.team_leader_id} onChange={e => setAddForm(f => ({ ...f, team_leader_id: e.target.value }))}
                          style={{ width: '100%', padding: '10px 14px', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 9, fontSize: 14, color: '#fff', outline: 'none' }}>
                          <option value="">— None —</option>
                          {teamLeaders.map(tl => <option key={tl.id} value={tl.id}>{tl.full_name}</option>)}
                        </select>
                      </div>
                    )}
                  </div>
                  {addMsg && <div style={{ fontSize: 12, color: addMsg.includes('success') ? '#4ade80' : '#f87171', marginBottom: 10 }}>{addMsg}</div>}
                  <button type="submit" disabled={addSaving}
                    style={{ padding: '10px 24px', background: '#C9A84C', color: '#0d1728', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 800, cursor: 'pointer' }}>
                    {addSaving ? 'Creating...' : 'Create User'}
                  </button>
                </form>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {users.map(u => (
                  <div key={u.id} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: '16px 20px', opacity: u.is_active ? 1 : 0.45 }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' }}>
                      <div style={{ flex: 1, minWidth: 160 }}>
                        <div style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>{u.full_name}</div>
                        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 2 }}>{u.email}</div>
                        <div style={{ marginTop: 6, display: 'flex', gap: 6, alignItems: 'center' }}>
                          <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 10px', borderRadius: 20, background: `${ROLE_COLORS[u.role] || '#888'}22`, color: ROLE_COLORS[u.role] || '#888', border: `1px solid ${ROLE_COLORS[u.role] || '#888'}44` }}>
                            {ROLE_LABELS[u.role] || u.role}
                          </span>
                          {!u.is_active && <span style={{ fontSize: 10, color: '#f87171', fontWeight: 600 }}>Inactive</span>}
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                        <input type="password" placeholder="New password" value={resetPw[u.id] || ''}
                          onChange={e => setResetPw(p => ({ ...p, [u.id]: e.target.value }))}
                          style={{ padding: '7px 12px', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8, fontSize: 12, color: '#fff', outline: 'none', width: 150 }} />
                        <button onClick={() => handleResetPassword(u.id)} disabled={!resetPw[u.id]}
                          style={{ padding: '7px 14px', background: '#6366f1', color: '#fff', border: 'none', borderRadius: 8, fontSize: 11, fontWeight: 700, cursor: 'pointer', opacity: !resetPw[u.id] ? 0.4 : 1 }}>
                          Reset
                        </button>
                        {u.is_active && u.id !== user?.id && (
                          <button onClick={() => handleDeactivate(u.id)}
                            style={{ padding: '7px 14px', background: 'rgba(239,68,68,0.15)', color: '#f87171', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 8, fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
                            Deactivate
                          </button>
                        )}
                        {resetMsg[u.id] && <span style={{ fontSize: 11, color: resetMsg[u.id].includes('success') ? '#4ade80' : '#f87171' }}>{resetMsg[u.id]}</span>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Section>
          </>
        )}
      </div>
    </div>
  );
}
