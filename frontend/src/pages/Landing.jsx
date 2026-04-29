import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { useEffect } from 'react';

const NAVY = '#0A2342';
const GOLD = '#C9A84C';

export default function Landing() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const cards = [
    {
      key: 'crm',
      icon: '📋',
      title: 'CRM',
      subtitle: 'Leads, Pipeline & Team Management',
      desc: 'Manage your real estate leads, track your pipeline, assign brokers, and monitor team performance.',
      path: '/crm',
      roles: ['admin', 'team_leader', 'broker'],
      accent: NAVY,
    },
    {
      key: 'partnerships',
      icon: '🤝',
      title: 'Partnerships',
      subtitle: 'Referral Partner Outreach System',
      desc: 'Manage referral partners, send WhatsApp & Email campaigns, track commissions and replies.',
      path: '/partnerships',
      roles: ['admin'],
      accent: '#7c3aed',
    },
  ];

  const visible = cards.filter(c => c.roles.includes(user?.role));

  useEffect(() => {
    if (visible.length === 1) {
      navigate(visible[0].path, { replace: true });
    }
  }, []);

  if (visible.length === 1) return null;

  return (
    <div style={{
      minHeight: '100vh',
      background: `linear-gradient(135deg, ${NAVY} 0%, #1a3a6e 100%)`,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24,
    }}>
      {/* Logo */}
      <div style={{ textAlign: 'center', marginBottom: 48 }}>
        <div style={{ fontSize: 36, fontWeight: 900, color: '#fff', letterSpacing: '-1px' }}>
          Penta CRM
        </div>
        <div style={{ fontSize: 11, letterSpacing: 4, color: GOLD, textTransform: 'uppercase', marginTop: 4 }}>
          Real Estate
        </div>
        <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)', marginTop: 12 }}>
          Welcome back, {user?.full_name} — choose your module
        </div>
      </div>

      {/* Cards */}
      <div style={{ display: 'flex', gap: 28, flexWrap: 'wrap', justifyContent: 'center', maxWidth: 900 }}>
        {visible.map(card => (
          <div
            key={card.key}
            onClick={() => navigate(card.path)}
            style={{
              background: '#fff',
              borderRadius: 20,
              padding: '40px 36px',
              width: 320,
              cursor: 'pointer',
              boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
              transition: 'transform 0.2s, box-shadow 0.2s',
              borderTop: `5px solid ${card.accent}`,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-start',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.transform = 'translateY(-6px)';
              e.currentTarget.style.boxShadow = '0 28px 70px rgba(0,0,0,0.4)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = '';
              e.currentTarget.style.boxShadow = '0 20px 60px rgba(0,0,0,0.3)';
            }}
          >
            <div style={{ fontSize: 44, marginBottom: 16 }}>{card.icon}</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#1a1a2e', marginBottom: 4 }}>{card.title}</div>
            <div style={{ fontSize: 12, fontWeight: 600, color: card.accent, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 14 }}>
              {card.subtitle}
            </div>
            <div style={{ fontSize: 13, color: '#666', lineHeight: 1.6, marginBottom: 24 }}>{card.desc}</div>
            <div style={{
              marginTop: 'auto',
              padding: '10px 22px',
              background: card.accent,
              color: '#fff',
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 700,
              alignSelf: 'flex-start',
            }}>
              Open {card.title} →
            </div>
          </div>
        ))}
      </div>

      {/* Logout */}
      <button
        onClick={() => { localStorage.removeItem('token'); window.location.href = '/login'; }}
        style={{ marginTop: 40, background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', fontSize: 13 }}
      >
        Sign out
      </button>
    </div>
  );
}
