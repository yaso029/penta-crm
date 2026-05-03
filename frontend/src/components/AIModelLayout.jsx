import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';

const NAVY = '#0A2342';
const GOLD = '#C9A84C';

const navItems = [
  { to: '/ai', label: 'Overview', icon: '▦', exact: true },
  { to: '/ai/offplan', label: 'Off-Plan Listings', icon: '🏗️' },
  { to: '/ai/secondary', label: 'Secondary Market', icon: '🏠' },
  { to: '/ai/match', label: 'Client Matcher', icon: '🎯' },
  { to: '/ai/intake', label: 'Intake AI', icon: '🤖' },
  { to: '/ai/scrape', label: 'Scrape Control', icon: '⚙️' },
];

export default function AIModelLayout() {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#F0F2F5' }}>
      <aside style={{
        width: 240, background: NAVY, color: '#fff', display: 'flex',
        flexDirection: 'column', position: 'fixed', top: 0, left: 0, height: '100vh', zIndex: 100,
      }}>
        <div style={{ padding: '28px 24px 20px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
          <div style={{ fontSize: 20, fontWeight: 800, color: '#fff', letterSpacing: '-0.5px' }}>Penta System</div>
          <div style={{
            display: 'inline-block', marginTop: 6,
            background: 'rgba(201,168,76,0.2)', border: '1px solid rgba(201,168,76,0.4)',
            borderRadius: 6, padding: '2px 10px', fontSize: 10, fontWeight: 700,
            color: '#f0d98a', letterSpacing: 1.5, textTransform: 'uppercase',
          }}>
            AI Model
          </div>
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
                background: isActive ? 'rgba(201,168,76,0.2)' : 'transparent',
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
          <button
            onClick={() => navigate('/')}
            style={{
              width: '100%', padding: '9px', background: 'rgba(201,168,76,0.15)',
              border: '1px solid rgba(201,168,76,0.3)', borderRadius: 7,
              color: GOLD, fontSize: 13, cursor: 'pointer', marginBottom: 8, fontWeight: 600,
            }}
          >
            ← Back to Home
          </button>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', paddingLeft: 4, marginTop: 6 }}>
            {user?.full_name}
          </div>
        </div>
      </aside>

      <div style={{ marginLeft: 240, flex: 1, display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <header style={{
          height: 60, background: '#fff', borderBottom: '1px solid #e8e8e8',
          display: 'flex', alignItems: 'center', padding: '0 28px',
          boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
        }}>
          <span style={{ fontSize: 13, color: '#888' }}>AI Model — Real Estate Intelligence</span>
          <span style={{ marginLeft: 'auto', fontSize: 13, color: '#555', fontWeight: 600 }}>
            {user?.full_name}
          </span>
        </header>
        <main style={{ flex: 1, padding: 28 }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
