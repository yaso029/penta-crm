import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { useState } from 'react';

const NAVY = '#0A2342';
const GOLD = '#C9A84C';

const MODULES = [
  {
    key: 'crm',
    icon: '📋',
    title: 'CRM',
    subtitle: 'Leads, Pipeline & Team Management',
    desc: 'Manage your real estate leads, track your pipeline, assign brokers, and monitor team performance.',
    accent: NAVY,
    type: 'active',
    path: '/crm',
    adminOnly: false,
  },
  {
    key: 'partnerships',
    icon: '🤝',
    title: 'Partnerships',
    subtitle: 'Referral Partner Outreach System',
    desc: 'Manage referral partners, send WhatsApp & Email campaigns, track commissions and replies.',
    accent: '#7c3aed',
    type: 'restricted',
    path: '/partnerships',
    adminOnly: true,
  },
  {
    key: 'hr',
    icon: '👥',
    title: 'HR',
    subtitle: 'Human Resources Management',
    desc: 'Manage employee records, attendance, leave requests, and HR workflows.',
    accent: '#0891b2',
    type: 'coming_soon',
  },
  {
    key: 'accounting',
    icon: '💰',
    title: 'Accounting',
    subtitle: 'Finance & Accounting',
    desc: 'Track invoices, expenses, commissions, and financial reports.',
    accent: '#059669',
    type: 'coming_soon',
  },
  {
    key: 'agents',
    icon: '📊',
    title: 'Agents Dashboard',
    subtitle: 'Agent Performance & Analytics',
    desc: 'View individual agent KPIs, conversion rates, deal history, and performance rankings.',
    accent: '#dc2626',
    type: 'coming_soon',
  },
];

function Modal({ title, message, color, onClose }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
    }} onClick={onClose}>
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: '#fff', borderRadius: 16, padding: '40px 48px', maxWidth: 420,
          textAlign: 'center', boxShadow: '0 24px 60px rgba(0,0,0,0.3)',
          borderTop: `5px solid ${color}`,
        }}
      >
        <div style={{ fontSize: 48, marginBottom: 16 }}>
          {title === 'No Permission' ? '🔒' : '🚧'}
        </div>
        <div style={{ fontSize: 20, fontWeight: 800, color: '#1a1a2e', marginBottom: 12 }}>{title}</div>
        <div style={{ fontSize: 14, color: '#666', lineHeight: 1.7, marginBottom: 28 }}>{message}</div>
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

export default function Landing() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [modal, setModal] = useState(null);

  const handleClick = (mod) => {
    if (mod.type === 'active') {
      navigate(mod.path);
      return;
    }
    if (mod.type === 'restricted') {
      if (user?.role === 'admin') {
        navigate(mod.path);
      } else {
        setModal({
          title: 'No Permission',
          message: "You don't have permission to access this system. Please contact your administrator.",
          color: mod.accent,
        });
      }
      return;
    }
    if (mod.type === 'coming_soon') {
      setModal({
        title: 'Under Development',
        message: `The ${mod.title} module is currently being built. It will be available soon.`,
        color: mod.accent,
      });
    }
  };

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
      {modal && (
        <Modal
          title={modal.title}
          message={modal.message}
          color={modal.color}
          onClose={() => setModal(null)}
        />
      )}

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

      <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', justifyContent: 'center', maxWidth: 1100 }}>
        {MODULES.map(mod => {
          const isComingSoon = mod.type === 'coming_soon';
          const isLocked = mod.type === 'restricted' && user?.role !== 'admin';

          return (
            <div
              key={mod.key}
              onClick={() => handleClick(mod)}
              style={{
                background: isComingSoon ? 'rgba(255,255,255,0.07)' : '#fff',
                borderRadius: 20,
                padding: '36px 32px',
                width: 290,
                cursor: 'pointer',
                boxShadow: isComingSoon ? 'none' : '0 20px 60px rgba(0,0,0,0.3)',
                transition: 'transform 0.2s, box-shadow 0.2s',
                borderTop: `5px solid ${isComingSoon ? 'rgba(255,255,255,0.2)' : mod.accent}`,
                border: isComingSoon ? '1px dashed rgba(255,255,255,0.2)' : 'none',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
                position: 'relative',
                opacity: isComingSoon ? 0.75 : 1,
              }}
              onMouseEnter={e => {
                if (!isComingSoon) {
                  e.currentTarget.style.transform = 'translateY(-6px)';
                  e.currentTarget.style.boxShadow = '0 28px 70px rgba(0,0,0,0.4)';
                }
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = '';
                e.currentTarget.style.boxShadow = isComingSoon ? 'none' : '0 20px 60px rgba(0,0,0,0.3)';
              }}
            >
              {isComingSoon && (
                <div style={{
                  position: 'absolute', top: 14, right: 14,
                  background: 'rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.7)',
                  fontSize: 10, fontWeight: 700, letterSpacing: 1,
                  padding: '3px 8px', borderRadius: 20, textTransform: 'uppercase',
                }}>
                  Coming Soon
                </div>
              )}
              {(isLocked) && (
                <div style={{
                  position: 'absolute', top: 14, right: 14,
                  background: '#fef3c7', color: '#92400e',
                  fontSize: 10, fontWeight: 700, letterSpacing: 1,
                  padding: '3px 8px', borderRadius: 20, textTransform: 'uppercase',
                }}>
                  🔒 Restricted
                </div>
              )}

              <div style={{ fontSize: 40, marginBottom: 14 }}>{mod.icon}</div>
              <div style={{
                fontSize: 20, fontWeight: 800, marginBottom: 4,
                color: isComingSoon ? '#fff' : '#1a1a2e',
              }}>
                {mod.title}
              </div>
              <div style={{
                fontSize: 11, fontWeight: 600, textTransform: 'uppercase',
                letterSpacing: 0.8, marginBottom: 12,
                color: isComingSoon ? 'rgba(255,255,255,0.5)' : mod.accent,
              }}>
                {mod.subtitle}
              </div>
              <div style={{
                fontSize: 13, lineHeight: 1.6, marginBottom: 24,
                color: isComingSoon ? 'rgba(255,255,255,0.5)' : '#666',
              }}>
                {mod.desc}
              </div>
              <div style={{
                marginTop: 'auto',
                padding: '9px 20px',
                background: isComingSoon ? 'rgba(255,255,255,0.1)' : mod.accent,
                color: isComingSoon ? 'rgba(255,255,255,0.5)' : '#fff',
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 700,
                alignSelf: 'flex-start',
              }}>
                {isComingSoon ? 'Coming Soon' : `Open ${mod.title} →`}
              </div>
            </div>
          );
        })}
      </div>

      <button
        onClick={() => { localStorage.removeItem('token'); window.location.href = '/login'; }}
        style={{ marginTop: 48, background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', fontSize: 13 }}
      >
        Sign out
      </button>
    </div>
  );
}
