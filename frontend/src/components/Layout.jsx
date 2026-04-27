import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { useEffect, useState } from 'react';
import api from '../api';

const NAVY = '#0A2342';
const GOLD = '#C9A84C';

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [unread, setUnread] = useState(0);
  const [notifs, setNotifs] = useState([]);
  const [showNotifs, setShowNotifs] = useState(false);

  useEffect(() => {
    fetchUnread();
    const iv = setInterval(fetchUnread, 30000);
    return () => clearInterval(iv);
  }, []);

  const fetchUnread = async () => {
    try {
      const { data } = await api.get('/api/notifications/unread-count');
      setUnread(data.count);
    } catch {}
  };

  const openNotifs = async () => {
    setShowNotifs(v => !v);
    if (!showNotifs) {
      const { data } = await api.get('/api/notifications');
      setNotifs(data);
    }
  };

  const markAllRead = async () => {
    await api.patch('/api/notifications/read-all');
    setUnread(0);
    setNotifs(prev => prev.map(n => ({ ...n, is_read: true })));
  };

  const handleLogout = async () => {
    await api.post('/api/auth/logout');
    logout();
    navigate('/login');
  };

  const navItems = [
    { to: '/', label: 'Dashboard', icon: '▦', exact: true },
    { to: '/kanban', label: 'Pipeline', icon: '◫' },
    { to: '/leads', label: 'All Leads', icon: '☰' },
    ...(user?.role === 'admin' ? [{ to: '/users', label: 'Users', icon: '◎' }] : []),
  ];

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#F0F2F5' }}>
      {/* Sidebar */}
      <aside style={{
        width: 240, background: NAVY, color: '#fff', display: 'flex',
        flexDirection: 'column', position: 'fixed', top: 0, left: 0, height: '100vh', zIndex: 100,
      }}>
        <div style={{ padding: '28px 24px 20px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
          <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.5px' }}>Penta CRM</div>
          <div style={{ fontSize: 10, letterSpacing: 3, color: GOLD, textTransform: 'uppercase', marginTop: 2 }}>Real Estate</div>
        </div>

        <nav style={{ flex: 1, padding: '16px 12px' }}>
          {navItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.exact}
              style={({ isActive }) => ({
                display: 'flex', alignItems: 'center', gap: 10, padding: '11px 14px',
                borderRadius: 8, marginBottom: 4, fontSize: 14, fontWeight: 500,
                color: isActive ? '#fff' : 'rgba(255,255,255,0.65)',
                background: isActive ? `rgba(${GOLD.replace('#','').match(/.{2}/g).map(h=>parseInt(h,16)).join(',')},0.15)` : 'transparent',
                borderLeft: isActive ? `3px solid ${GOLD}` : '3px solid transparent',
                transition: 'all 0.15s',
              })}
            >
              <span style={{ fontSize: 16 }}>{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div style={{ padding: '16px 12px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginBottom: 4, paddingLeft: 14 }}>
            {user?.role?.replace('_', ' ').toUpperCase()}
          </div>
          <div style={{ fontSize: 14, fontWeight: 500, color: '#fff', paddingLeft: 14, marginBottom: 12 }}>
            {user?.full_name}
          </div>
          <button
            onClick={handleLogout}
            style={{
              width: '100%', padding: '9px', background: 'rgba(255,255,255,0.08)',
              border: 'none', borderRadius: 7, color: 'rgba(255,255,255,0.7)',
              fontSize: 13, cursor: 'pointer',
            }}
          >
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main */}
      <div style={{ marginLeft: 240, flex: 1, display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        {/* Topbar */}
        <header style={{
          height: 60, background: '#fff', borderBottom: '1px solid #e8e8e8',
          display: 'flex', alignItems: 'center', justifyContent: 'flex-end',
          padding: '0 28px', position: 'sticky', top: 0, zIndex: 50,
          boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
        }}>
          <div style={{ position: 'relative' }}>
            <button
              onClick={openNotifs}
              style={{
                background: 'none', border: 'none', fontSize: 20, cursor: 'pointer',
                position: 'relative', padding: '6px 8px', borderRadius: 8,
                color: '#555',
              }}
            >
              🔔
              {unread > 0 && (
                <span style={{
                  position: 'absolute', top: 2, right: 2, background: '#ef4444',
                  color: '#fff', borderRadius: '50%', width: 18, height: 18,
                  fontSize: 10, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 700,
                }}>
                  {unread > 9 ? '9+' : unread}
                </span>
              )}
            </button>

            {showNotifs && (
              <div style={{
                position: 'absolute', right: 0, top: 44, width: 340, background: '#fff',
                borderRadius: 12, boxShadow: '0 8px 30px rgba(0,0,0,0.15)', zIndex: 200,
                border: '1px solid #e8e8e8', overflow: 'hidden',
              }}>
                <div style={{ padding: '14px 16px', borderBottom: '1px solid #f0f0f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 600, fontSize: 14 }}>Notifications</span>
                  {unread > 0 && (
                    <button onClick={markAllRead} style={{ background: 'none', border: 'none', fontSize: 12, color: NAVY, cursor: 'pointer', fontWeight: 600 }}>
                      Mark all read
                    </button>
                  )}
                </div>
                <div style={{ maxHeight: 320, overflowY: 'auto' }}>
                  {notifs.length === 0 ? (
                    <div style={{ padding: 20, textAlign: 'center', color: '#888', fontSize: 13 }}>No notifications</div>
                  ) : notifs.map(n => (
                    <div key={n.id} style={{
                      padding: '12px 16px', borderBottom: '1px solid #f5f5f5',
                      background: n.is_read ? '#fff' : '#f0f4ff', fontSize: 13,
                    }}>
                      <div style={{ color: '#1a1a2e' }}>{n.message}</div>
                      <div style={{ color: '#aaa', fontSize: 11, marginTop: 3 }}>
                        {new Date(n.created_at).toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </header>

        <main style={{ flex: 1, padding: 28 }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
