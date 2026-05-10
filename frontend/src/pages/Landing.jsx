import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { useState, useEffect } from 'react';
import api from '../api';

const MODULES = [
  {
    key: 'crm',
    icon: '📋',
    title: 'CRM',
    subtitle: 'Clients & Pipeline',
    desc: 'Manage client leads, track proposal stages, assign team members and monitor your sales performance.',
    bg: 'linear-gradient(135deg, #1e3a5f 0%, #0d2340 100%)',
    type: 'active',
    path: '/crm',
  },
  {
    key: 'hr',
    icon: '👥',
    title: 'HR',
    subtitle: 'Human Resources',
    desc: 'Employee records, documents, photo profiles and full identity management.',
    bg: 'linear-gradient(135deg, #1c3a3a 0%, #112e2e 100%)',
    type: 'restricted',
    path: '/hr',
  },
  {
    key: 'accounting',
    icon: '💰',
    title: 'Accounting',
    subtitle: 'Finance & Reports',
    desc: 'Invoices, expenses, and detailed financial reporting.',
    bg: 'linear-gradient(135deg, #1a3a1a 0%, #112811 100%)',
    type: 'coming_soon',
  },
];

function Modal({ title, message, color, onClose }) {
  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: '#111827', border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 16, padding: '40px 48px', maxWidth: 400,
          textAlign: 'center', boxShadow: '0 32px 80px rgba(0,0,0,0.6)',
          borderTop: `4px solid ${color}`,
        }}
      >
        <div style={{ fontSize: 44, marginBottom: 16 }}>
          {title === 'No Permission' ? '🔒' : '🚧'}
        </div>
        <div style={{ fontSize: 20, fontWeight: 800, color: '#fff', marginBottom: 10 }}>{title}</div>
        <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', lineHeight: 1.7, marginBottom: 28 }}>{message}</div>
        <button
          onClick={onClose}
          style={{
            padding: '10px 32px', background: color, color: '#fff',
            border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 700, cursor: 'pointer',
          }}
        >
          Got it
        </button>
      </div>
    </div>
  );
}

const ROLE_LABELS = { admin: 'Administrator', team_leader: 'Team Leader', broker: 'Broker' };

export default function Landing() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [modal, setModal] = useState(null);
  const [stats, setStats] = useState({ leads: '—', partners: '—', properties: '—' });

  useEffect(() => {
    Promise.allSettled([
      api.get('/api/dashboard/stats'),
      api.get('/api/agents/stats'),
      api.get('/api/partners'),
    ]).then(([dash, agents, partners]) => {
      setStats({
        leads: dash.status === 'fulfilled' ? (dash.value.data?.total_leads ?? '—') : '—',
        properties: agents.status === 'fulfilled' ? (agents.value.data?.properties ?? '—') : '—',
        partners: partners.status === 'fulfilled' ? (partners.value.data?.length ?? '—') : '—',
      });
    });
  }, []);

  const handleClick = (mod) => {
    if (mod.type === 'active') { navigate(mod.path); return; }
    if (mod.type === 'restricted') {
      if (user?.role === 'admin') { navigate(mod.path); return; }
      setModal({ title: 'No Permission', message: "You don't have permission to access this module. Contact your administrator.", color: '#7c3aed' });
      return;
    }
    if (mod.type === 'coming_soon') {
      setModal({ title: 'Under Development', message: `The ${mod.title} module is currently being built and will be available soon.`, color: '#555' });
    }
  };

  const statItems = [
    { label: 'Active Leads', value: stats.leads, fill: '#4f8ef7', pct: '70%' },
    { label: 'Referral Partners', value: stats.partners, fill: '#a78bfa', pct: '55%' },
    { label: 'Properties Listed', value: stats.properties, fill: '#f87171', pct: '40%' },
  ];

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#0b0f1a' }}>
      {modal && <Modal title={modal.title} message={modal.message} color={modal.color} onClose={() => setModal(null)} />}

      {/* ── LEFT PANEL ── */}
      <aside style={{
        width: 300, flexShrink: 0,
        background: 'linear-gradient(170deg, #0d1728 0%, #091322 100%)',
        borderRight: '1px solid rgba(255,255,255,0.06)',
        display: 'flex', flexDirection: 'column',
        padding: '44px 32px',
        position: 'sticky', top: 0, height: '100vh',
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
          <div style={{
            width: 42, height: 42,
            background: 'linear-gradient(135deg, #C9A84C, #f0d98a)',
            borderRadius: 11, display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 19, fontWeight: 900, color: '#0d1728',
            boxShadow: '0 4px 18px rgba(201,168,76,0.35)',
          }}>P</div>
          <div style={{ fontSize: 21, fontWeight: 900, color: '#fff', letterSpacing: '-0.5px' }}>EcoFinTec</div>
        </div>
        <div style={{ fontSize: 9, letterSpacing: 3, color: '#C9A84C', textTransform: 'uppercase', marginBottom: 36, paddingLeft: 54 }}>
          FinTec Solutions
        </div>

        {/* Divider */}
        <div style={{ width: 32, height: 2, background: 'rgba(201,168,76,0.4)', borderRadius: 2, marginBottom: 28 }} />

        {/* User */}
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 6 }}>
          Logged in as
        </div>
        <div style={{ fontSize: 24, fontWeight: 800, color: '#fff', letterSpacing: '-0.5px', marginBottom: 10 }}>
          {user?.full_name}
        </div>
        <div style={{
          display: 'inline-block',
          background: 'rgba(201,168,76,0.12)', border: '1px solid rgba(201,168,76,0.28)',
          color: '#C9A84C', fontSize: 10, fontWeight: 700, letterSpacing: 1.5,
          textTransform: 'uppercase', padding: '3px 10px', borderRadius: 20, marginBottom: 36,
        }}>
          {ROLE_LABELS[user?.role] || user?.role}
        </div>

        {/* Stats */}
        <div style={{ marginBottom: 'auto' }}>
          {statItems.map(s => (
            <div key={s.label} style={{ marginBottom: 22 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', letterSpacing: 0.5 }}>{s.label}</span>
                <span style={{ fontSize: 15, fontWeight: 800, color: '#fff' }}>{s.value}</span>
              </div>
              <div style={{ height: 3, background: 'rgba(255,255,255,0.07)', borderRadius: 2, overflow: 'hidden' }}>
                <div style={{ width: s.pct, height: '100%', background: s.fill, borderRadius: 2, transition: 'width 0.8s ease' }} />
              </div>
            </div>
          ))}
        </div>

        {/* Sign out */}
        <button
          onClick={() => { localStorage.removeItem('token'); localStorage.removeItem('user'); window.location.href = '/login'; }}
          style={{
            width: '100%', padding: 11,
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.09)',
            borderRadius: 10, color: 'rgba(255,255,255,0.4)',
            fontSize: 13, cursor: 'pointer', transition: 'all 0.2s',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = 'rgba(255,255,255,0.7)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.color = 'rgba(255,255,255,0.4)'; }}
        >
          ← Sign out
        </button>
      </aside>

      {/* ── RIGHT PANEL ── */}
      <main style={{ flex: 1, padding: '44px 40px', overflowY: 'auto' }}>
        <div style={{ marginBottom: 32 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.3)', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 6 }}>
            Operations Hub
          </div>
          <div style={{ fontSize: 28, fontWeight: 900, color: '#fff', letterSpacing: '-0.5px' }}>
            Select a module
          </div>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: 16,
        }}>
          {MODULES.map(mod => {
            const isComingSoon = mod.type === 'coming_soon';
            const isLocked = mod.type === 'restricted' && user?.role !== 'admin';

            return (
              <div
                key={mod.key}
                onClick={() => handleClick(mod)}
                style={{
                  background: mod.bg,
                  borderRadius: 18,
                  padding: '28px 26px',
                  cursor: isComingSoon ? 'default' : 'pointer',
                  position: 'relative',
                  overflow: 'hidden',
                  minHeight: 210,
                  display: 'flex', flexDirection: 'column',
                  opacity: isComingSoon ? 0.45 : 1,
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  border: '1px solid rgba(255,255,255,0.06)',
                }}
                onMouseEnter={e => {
                  if (!isComingSoon) {
                    e.currentTarget.style.transform = 'translateY(-5px)';
                    e.currentTarget.style.boxShadow = '0 20px 50px rgba(0,0,0,0.5)';
                  }
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform = '';
                  e.currentTarget.style.boxShadow = '';
                }}
              >
                {/* Decorative circle */}
                <div style={{
                  position: 'absolute', bottom: -20, right: -20,
                  width: 130, height: 130,
                  background: 'rgba(0,0,0,0.15)', borderRadius: '50%',
                  pointerEvents: 'none',
                }} />

                {/* Badge */}
                {isComingSoon && (
                  <div style={{
                    position: 'absolute', top: 16, right: 16,
                    background: 'rgba(0,0,0,0.25)', color: 'rgba(255,255,255,0.6)',
                    fontSize: 9, fontWeight: 800, letterSpacing: 1.5, textTransform: 'uppercase',
                    padding: '4px 10px', borderRadius: 20,
                  }}>
                    Coming Soon
                  </div>
                )}
                {isLocked && !isComingSoon && (
                  <div style={{
                    position: 'absolute', top: 16, right: 16,
                    background: 'rgba(0,0,0,0.25)', color: 'rgba(255,255,255,0.6)',
                    fontSize: 9, fontWeight: 800, letterSpacing: 1.5, textTransform: 'uppercase',
                    padding: '4px 10px', borderRadius: 20,
                  }}>
                    🔒 Admin Only
                  </div>
                )}

                <div style={{ fontSize: 36, marginBottom: 14 }}>{mod.icon}</div>
                <div style={{ fontSize: 19, fontWeight: 900, color: '#fff', marginBottom: 3, letterSpacing: '-0.3px' }}>
                  {mod.title}
                </div>
                <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>
                  {mod.subtitle}
                </div>
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', lineHeight: 1.65, marginBottom: 20, flex: 1 }}>
                  {mod.desc}
                </div>
                <div style={{
                  alignSelf: 'flex-start',
                  background: 'rgba(255,255,255,0.13)',
                  color: isComingSoon ? 'rgba(255,255,255,0.35)' : '#fff',
                  fontSize: 12, fontWeight: 800,
                  padding: '8px 16px', borderRadius: 8,
                  letterSpacing: 0.3,
                  backdropFilter: 'blur(4px)',
                }}>
                  {isComingSoon ? 'Coming Soon' : `Open ${mod.title} →`}
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
