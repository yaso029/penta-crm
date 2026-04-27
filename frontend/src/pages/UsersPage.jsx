import { useEffect, useState } from 'react';
import api from '../api';
import toast from 'react-hot-toast';

const NAVY = '#0A2342';
const GOLD = '#C9A84C';

const ROLE_COLORS = { admin: '#8b5cf6', team_leader: '#3b82f6', broker: '#10b981' };
const ROLE_LABELS = { admin: 'Admin', team_leader: 'Team Leader', broker: 'Broker' };

function UserModal({ user, teamLeaders, onClose, onSaved }) {
  const isEdit = !!user;
  const [form, setForm] = useState(user ? {
    full_name: user.full_name, email: user.email, role: user.role,
    team_leader_id: user.team_leader_id || '', is_active: user.is_active, password: '',
  } : { full_name: '', email: '', password: '', role: 'broker', team_leader_id: '' });
  const [loading, setLoading] = useState(false);
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = { ...form, team_leader_id: form.team_leader_id ? parseInt(form.team_leader_id) : null };
      if (isEdit) {
        if (!payload.password) delete payload.password;
        await api.put(`/api/users/${user.id}`, payload);
        toast.success('User updated');
      } else {
        if (!payload.password) { toast.error('Password required'); setLoading(false); return; }
        await api.post('/api/users', payload);
        toast.success('User created');
      }
      onSaved();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed');
    } finally { setLoading(false); }
  };

  const inputStyle = { width: '100%', padding: '9px 12px', border: '1.5px solid #e0e0e0', borderRadius: 7, fontSize: 13, outline: 'none', marginBottom: 12 };
  const labelStyle = { fontSize: 11, fontWeight: 600, color: '#555', display: 'block', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: '#fff', borderRadius: 14, padding: '28px 32px', width: 420, boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700 }}>{isEdit ? 'Edit User' : 'Add User'}</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#888' }}>×</button>
        </div>
        <form onSubmit={handleSubmit}>
          <label style={labelStyle}>Full Name</label>
          <input style={inputStyle} value={form.full_name} onChange={set('full_name')} required />
          <label style={labelStyle}>Email</label>
          <input style={inputStyle} type="email" value={form.email} onChange={set('email')} required />
          <label style={labelStyle}>{isEdit ? 'New Password (leave blank to keep)' : 'Password'}</label>
          <input style={inputStyle} type="password" value={form.password} onChange={set('password')} required={!isEdit} />
          <label style={labelStyle}>Role</label>
          <select style={inputStyle} value={form.role} onChange={set('role')}>
            <option value="broker">Broker</option>
            <option value="team_leader">Team Leader</option>
            <option value="admin">Admin</option>
          </select>
          {form.role === 'broker' && teamLeaders.length > 0 && (
            <>
              <label style={labelStyle}>Team Leader</label>
              <select style={inputStyle} value={form.team_leader_id} onChange={set('team_leader_id')}>
                <option value="">None</option>
                {teamLeaders.map(tl => <option key={tl.id} value={tl.id}>{tl.full_name}</option>)}
              </select>
            </>
          )}
          {isEdit && (
            <>
              <label style={labelStyle}>Status</label>
              <select style={inputStyle} value={form.is_active ? 'true' : 'false'} onChange={e => setForm(f => ({ ...f, is_active: e.target.value === 'true' }))}>
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </select>
            </>
          )}
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 4 }}>
            <button type="button" onClick={onClose} style={{ padding: '9px 20px', border: '1.5px solid #e0e0e0', borderRadius: 7, background: '#fff', cursor: 'pointer', fontSize: 13 }}>Cancel</button>
            <button type="submit" disabled={loading} style={{ padding: '9px 20px', background: NAVY, color: '#fff', border: 'none', borderRadius: 7, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
              {loading ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/api/users');
      setUsers(data);
    } catch { toast.error('Failed to load users'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchUsers(); }, []);

  const deactivate = async (userId) => {
    if (!confirm('Deactivate this user?')) return;
    try {
      await api.delete(`/api/users/${userId}`);
      toast.success('User deactivated');
      fetchUsers();
    } catch (err) { toast.error(err.response?.data?.detail || 'Failed'); }
  };

  const teamLeaders = users.filter(u => u.role === 'team_leader' && u.is_active);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#1a1a2e' }}>User Management</h1>
          <p style={{ color: '#888', fontSize: 14, marginTop: 4 }}>{users.filter(u => u.is_active).length} active users</p>
        </div>
        <button
          onClick={() => setModal('add')}
          style={{ padding: '10px 20px', background: NAVY, color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 14 }}
        >
          + Add User
        </button>
      </div>

      <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 1px 6px rgba(0,0,0,0.07)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#fafafa', borderBottom: '1px solid #f0f0f0' }}>
              {['Name', 'Email', 'Role', 'Team Leader', 'Status', 'Actions'].map(h => (
                <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: '#888', textTransform: 'uppercase', letterSpacing: 0.5 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} style={{ padding: 40, textAlign: 'center', color: '#aaa' }}>Loading...</td></tr>
            ) : users.map(u => (
              <tr key={u.id} style={{ borderBottom: '1px solid #f5f5f5' }}>
                <td style={{ padding: '12px 16px' }}>
                  <div style={{ fontWeight: 600, fontSize: 13, color: '#1a1a2e' }}>{u.full_name}</div>
                </td>
                <td style={{ padding: '12px 16px', fontSize: 13, color: '#555' }}>{u.email}</td>
                <td style={{ padding: '12px 16px' }}>
                  <span style={{
                    background: `${ROLE_COLORS[u.role]}20`, color: ROLE_COLORS[u.role],
                    borderRadius: 20, padding: '3px 10px', fontSize: 11, fontWeight: 600,
                  }}>
                    {ROLE_LABELS[u.role]}
                  </span>
                </td>
                <td style={{ padding: '12px 16px', fontSize: 13, color: '#555' }}>{u.team_leader_name || '—'}</td>
                <td style={{ padding: '12px 16px' }}>
                  <span style={{
                    background: u.is_active ? '#d1fae520' : '#fee2e220',
                    color: u.is_active ? '#10b981' : '#ef4444',
                    borderRadius: 20, padding: '3px 10px', fontSize: 11, fontWeight: 600,
                  }}>
                    {u.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td style={{ padding: '12px 16px' }}>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      onClick={() => setModal(u)}
                      style={{ padding: '5px 12px', border: `1.5px solid ${NAVY}`, color: NAVY, background: '#fff', borderRadius: 6, cursor: 'pointer', fontSize: 12, fontWeight: 600 }}
                    >
                      Edit
                    </button>
                    {u.is_active && (
                      <button
                        onClick={() => deactivate(u.id)}
                        style={{ padding: '5px 12px', border: '1.5px solid #ef4444', color: '#ef4444', background: '#fff', borderRadius: 6, cursor: 'pointer', fontSize: 12, fontWeight: 600 }}
                      >
                        Deactivate
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modal && (
        <UserModal
          user={modal === 'add' ? null : modal}
          teamLeaders={teamLeaders}
          onClose={() => setModal(null)}
          onSaved={fetchUsers}
        />
      )}
    </div>
  );
}
