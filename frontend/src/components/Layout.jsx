import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { useEffect, useState } from 'react';
import api from '../api';
import useIsMobile from '../hooks/useIsMobile';

const NAVY = '#0A2342';
const GOLD = '#C9A84C';

const playNotifSound = () => {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    osc.frequency.setValueAtTime(1100, ctx.currentTime + 0.12);
    gain.gain.setValueAtTime(0.25, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.5);
  } catch {}
};

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [unread, setUnread] = useState(0);
  const [notifs, setNotifs] = useState([]);
  const [showNotifs, setShowNotifs] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    fetchUnread();
    const iv = setInterval(fetchUnread, 15000);
    return () => clearInterval(iv);
  }, []);

  const fetchUnread = async () => {
    try {
      const { data } = await api.get('/api/notifications/unread-count');
      setUnread(prev => {
        if (data.count > prev) playNotifSound();
        return data.count;
      });
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
    { to: '/crm', label: 'Dashboard', icon: '▦', exact: true },
    { to: '/crm/kanban', label: 'Pipeline', icon: '◫' },
    { to: '/crm/leads', label: 'Leads', icon: '☰' },
    { to: '/crm/client-reports', label: 'Client Reports', icon: '📋' },
    ...(user?.role === 'admin' ? [
      { to: '/crm/customers', label: 'Customers', icon: '👥' },
      { to: '/crm/users', label: 'Users', icon: '◎' },
    ] : []),
  ];

  if (isMobile) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: '#F0F2F5' }}>
        {/* Mobile top bar */}
        <header style={{
          height: 56, background: NAVY, color: '#fff',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 16px', position: 'sticky', top: 0, zIndex: 100,
          boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
        }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 800 }}>Penta CRM</div>
            <div style={{ fontSize: 9, letterSpacing: 2, color: GOLD, textTransform: 'uppercase' }}>Real Estate</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {/* Notifications */}
            <div style={{ position: 'relative' }}>
              <button onClick={openNotifs} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#fff', padding: '6px' }}>
                🔔
                {unread > 0 && (
                  <span style={{
                    position: 'absolute', top: 2, right: 2, background: '#ef4444',
                    color: '#fff', borderRadius: '50%', width: 16, height: 16,
                    fontSize: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700,
                  }}>
                    {unread > 9 ? '9+' : unread}
                  </span>
                )}
              </button>
              {showNotifs && (
                <div style={{
                  position: 'fixed', right: 8, top: 64, width: 'calc(100vw - 16px)', maxWidth: 360,
                  background: '#fff', borderRadius: 12, boxShadow: '0 8px 30px rgba(0,0,0,0.2)',
                  zIndex: 200, border: '1px solid #e8e8e8', overflow: 'hidden',
                }}>
                  <div style={{ padding: '12px 16px', borderBottom: '1px solid #f0f0f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 600, fontSize: 14 }}>Notifications</span>
                    {unread > 0 && (
                      <button onClick={markAllRead} style={{ background: 'none', border: 'none', fontSize: 12, color: NAVY, cursor: 'pointer', fontWeight: 600 }}>
                        Mark all read
                      </button>
                    )}
                  </div>
                  <div style={{ maxHeight: 300, overflowY: 'auto' }}>
                    {notifs.length === 0 ? (
                      <div style={{ padding: 20, textAlign: 'center', color: '#888', fontSize: 13 }}>No notifications</div>
                    ) : notifs.map(n => (
                      <div key={n.id} style={{ padding: '12px 16px', borderBottom: '1px solid #f5f5f5', background: n.is_read ? '#fff' : '#f0f4ff', fontSize: 13 }}>
                        <div style={{ color: '#1a1a2e' }}>{n.message}</div>
                        <div style={{ color: '#aaa', fontSize: 11, marginTop: 3 }}>{new Date(n.created_at).toLocaleString()}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            {/* User menu */}
            <button onClick={() => setMenuOpen(v => !v)} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: 8, color: '#fff', fontSize: 13, cursor: 'pointer', padding: '6px 10px', fontWeight: 600 }}>
              {user?.full_name?.split(' ')[0]} ▾
            </button>
          </div>
        </header>

        {/* User dropdown menu */}
        {menuOpen && (
          <div style={{
            position: 'fixed', top: 56, right: 8, background: '#fff', borderRadius: 10,
            boxShadow: '0 8px 24px rgba(0,0,0,0.15)', zIndex: 200, minWidth: 180,
            border: '1px solid #e8e8e8', overflow: 'hidden',
          }}>
            <div style={{ padding: '12px 16px', borderBottom: '1px solid #f0f0f0' }}>
              <div style={{ fontSize: 13, fontWeight: 600 }}>{user?.full_name}</div>
              <div style={{ fontSize: 11, color: '#888', textTransform: 'uppercase' }}>{user?.role?.replace('_', ' ')}</div>
            </div>
            <button onClick={() => { navigate('/'); setMenuOpen(false); }} style={{ width: '100%', padding: '12px 16px', background: 'none', border: 'none', textAlign: 'left', fontSize: 13, cursor: 'pointer', borderBottom: '1px solid #f0f0f0' }}>
              ← Home
            </button>
            <button onClick={handleLogout} style={{ width: '100%', padding: '12px 16px', background: 'none', border: 'none', textAlign: 'left', fontSize: 13, cursor: 'pointer', color: '#ef4444' }}>
              Logout
            </button>
          </div>
        )}

        {/* Page content */}
        <main style={{ flex: 1, padding: '16px', paddingBottom: 80 }} onClick={() => { setMenuOpen(false); setShowNotifs(false); }}>
          <Outlet />
        </main>

        {/* Bottom navigation */}
        <nav style={{
          position: 'fixed', bottom: 0, left: 0, right: 0, height: 64,
          background: NAVY, display: 'flex', zIndex: 100,
          boxShadow: '0 -2px 12px rgba(0,0,0,0.2)',
        }}>
          {navItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.exact}
              style={({ isActive }) => ({
                flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
                justifyContent: 'center', gap: 2, fontSize: 9, fontWeight: 600,
                color: isActive ? GOLD : 'rgba(255,255,255,0.55)',
                textDecoration: 'none', transition: 'color 0.15s',
                borderTop: isActive ? `2px solid ${GOLD}` : '2px solid transparent',
              })}
            >
              <span style={{ fontSize: 20 }}>{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>
      </div>
    );
  }

  // Desktop layout
  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#F0F2F5' }}>
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
                background: isActive ? `rgba(201,168,76,0.15)` : 'transparent',
                borderLeft: isActive ? `3px solid ${GOLD}` : '3px solid transparent',
                transition: 'all 0.15s', textDecoration: 'none',
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
          <button onClick={() => navigate('/')} style={{ width: '100%', padding: '9px', background: 'rgba(255,255,255,0.08)', border: 'none', borderRadius: 7, color: 'rgba(255,255,255,0.7)', fontSize: 13, cursor: 'pointer' }}>
            ← Home
          </button>
        </div>
      </aside>

      <div style={{ marginLeft: 240, flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', minHeight: '100vh', overflow: 'hidden' }}>
        <header style={{
          height: 60, background: '#fff', borderBottom: '1px solid #e8e8e8',
          display: 'flex', alignItems: 'center', justifyContent: 'flex-end',
          padding: '0 28px', position: 'sticky', top: 0, zIndex: 50,
          boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
        }}>
          <div style={{ position: 'relative' }}>
            <button onClick={openNotifs} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', position: 'relative', padding: '6px 8px', borderRadius: 8, color: '#555' }}>
              🔔
              {unread > 0 && (
                <span style={{
                  position: 'absolute', top: 2, right: 2, background: '#ef4444',
                  color: '#fff', borderRadius: '50%', width: 18, height: 18,
                  fontSize: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700,
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
                    <button onClick={markAllRead} style={{ background: 'none', border: 'none', fontSize: 12, color: NAVY, cursor: 'pointer', fontWeight: 600 }}>Mark all read</button>
                  )}
                </div>
                <div style={{ maxHeight: 320, overflowY: 'auto' }}>
                  {notifs.length === 0 ? (
                    <div style={{ padding: 20, textAlign: 'center', color: '#888', fontSize: 13 }}>No notifications</div>
                  ) : notifs.map(n => (
                    <div key={n.id} style={{ padding: '12px 16px', borderBottom: '1px solid #f5f5f5', background: n.is_read ? '#fff' : '#f0f4ff', fontSize: 13 }}>
                      <div style={{ color: '#1a1a2e' }}>{n.message}</div>
                      <div style={{ color: '#aaa', fontSize: 11, marginTop: 3 }}>{new Date(n.created_at).toLocaleString()}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </header>

        <main style={{ flex: 1, padding: 28, overflow: 'hidden' }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
