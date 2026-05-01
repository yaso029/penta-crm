import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api';

const NAVY = '#0A2342';
const GOLD = '#C9A84C';
const RED = '#dc2626';

function StatCard({ label, value, icon, color, onClick }) {
  return (
    <div
      onClick={onClick}
      style={{
        background: '#fff', borderRadius: 14, padding: '24px 28px',
        boxShadow: '0 2px 12px rgba(0,0,0,0.07)', borderTop: `4px solid ${color}`,
        cursor: onClick ? 'pointer' : 'default', flex: 1, minWidth: 160,
        transition: 'transform 0.15s',
      }}
      onMouseEnter={e => onClick && (e.currentTarget.style.transform = 'translateY(-3px)')}
      onMouseLeave={e => (e.currentTarget.style.transform = '')}
    >
      <div style={{ fontSize: 32, marginBottom: 10 }}>{icon}</div>
      <div style={{ fontSize: 32, fontWeight: 800, color: '#1a1a2e', lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 13, color: '#888', marginTop: 6, fontWeight: 500 }}>{label}</div>
    </div>
  );
}

export default function AgentsDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);

  useEffect(() => {
    api.get('/api/agents/stats').then(r => setStats(r.data)).catch(() => {});
  }, []);

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontSize: 24, fontWeight: 800, color: '#1a1a2e' }}>Agents Dashboard</div>
        <div style={{ fontSize: 14, color: '#888', marginTop: 4 }}>Property listings, promotions, events & resources</div>
      </div>

      {stats && (
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 32 }}>
          <StatCard label="Total Properties" value={stats.properties} icon="🏢" color={RED} onClick={() => navigate('/agents/properties')} />
          <StatCard label="Available" value={stats.available} icon="✅" color="#16a34a" onClick={() => navigate('/agents/properties?status=available')} />
          <StatCard label="For Sale" value={stats.for_sale} icon="🏷️" color={NAVY} onClick={() => navigate('/agents/properties?transaction=For Sale')} />
          <StatCard label="For Rent" value={stats.for_rent} icon="🔑" color="#0891b2" onClick={() => navigate('/agents/properties?transaction=For Rent')} />
          <StatCard label="Events" value={stats.events} icon="📅" color="#7c3aed" onClick={() => navigate('/agents/events')} />
          <StatCard label="Videos" value={stats.videos} icon="▶️" color="#f59e0b" onClick={() => navigate('/agents/videos')} />
          <StatCard label="Promotions" value={stats.promotions} icon="🎯" color="#e11d48" onClick={() => navigate('/agents/promotions')} />
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
        {[
          { title: 'Property Vault', desc: 'Browse and filter all listed properties with detailed information and image galleries.', icon: '🏢', path: '/agents/properties', color: RED },
          { title: 'List New Property', desc: 'Add a new property to the vault with full details, specs, and photos via Cloudinary.', icon: '➕', path: '/agents/list-property', color: '#16a34a' },
          { title: 'Promotions', desc: 'View active developer discount campaigns and limited-time offers.', icon: '🎯', path: '/agents/promotions', color: '#e11d48' },
          { title: 'Events', desc: 'Developer briefings, company meetings, and team events.', icon: '📅', path: '/agents/events', color: '#7c3aed' },
          { title: 'Video Resources', desc: 'Training videos, project presentations and marketing materials.', icon: '▶️', path: '/agents/videos', color: '#f59e0b' },
        ].map(card => (
          <div
            key={card.path}
            onClick={() => navigate(card.path)}
            style={{
              background: '#fff', borderRadius: 14, padding: '28px 24px',
              boxShadow: '0 2px 12px rgba(0,0,0,0.07)', cursor: 'pointer',
              borderLeft: `4px solid ${card.color}`,
              transition: 'transform 0.15s, box-shadow 0.15s',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.12)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = '';
              e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,0.07)';
            }}
          >
            <div style={{ fontSize: 32, marginBottom: 12 }}>{card.icon}</div>
            <div style={{ fontSize: 17, fontWeight: 700, color: '#1a1a2e', marginBottom: 8 }}>{card.title}</div>
            <div style={{ fontSize: 13, color: '#888', lineHeight: 1.6 }}>{card.desc}</div>
            <div style={{ marginTop: 16, fontSize: 13, fontWeight: 700, color: card.color }}>Open →</div>
          </div>
        ))}
      </div>
    </div>
  );
}
