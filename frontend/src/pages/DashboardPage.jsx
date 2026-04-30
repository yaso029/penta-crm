import { useEffect, useState } from 'react';
import { useAuth } from '../AuthContext';
import api from '../api';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import useIsMobile from '../hooks/useIsMobile';

const NAVY = '#0A2342';
const GOLD = '#C9A84C';

const STAGE_COLORS = {
  new_lead: '#6366f1', contacted: '#3b82f6', follow_up: '#f59e0b',
  no_answer: '#64748b', not_interested: '#f97316', wrong_number: '#ec4899', junk: '#ef4444',
};

const STAGE_LABELS = {
  new_lead: 'New Lead', contacted: 'Contacted', follow_up: 'Follow Up',
  no_answer: 'No Answer', not_interested: 'Not Interested', wrong_number: 'Wrong Number', junk: 'Junk',
};

function StatCard({ label, value, color, icon }) {
  return (
    <div style={{
      background: '#fff', borderRadius: 12, padding: '20px 24px',
      boxShadow: '0 1px 6px rgba(0,0,0,0.07)', borderTop: `3px solid ${color}`,
      flex: 1, minWidth: 140,
    }}>
      <div style={{ fontSize: 28, marginBottom: 4 }}>{icon}</div>
      <div style={{ fontSize: 28, fontWeight: 700, color: '#1a1a2e', lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 13, color: '#888', marginTop: 4 }}>{label}</div>
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const [stats, setStats] = useState(null);
  const [adminData, setAdminData] = useState(null);

  useEffect(() => {
    api.get('/api/dashboard/stats').then(r => setStats(r.data)).catch(() => {});
    if (user?.role === 'admin') {
      api.get('/api/dashboard/admin').then(r => setAdminData(r.data)).catch(() => {});
    }
  }, [user]);

  if (!stats) return <div style={{ padding: 40, color: '#888' }}>Loading...</div>;

  const stageData = (stats.stage_breakdown || []).map(s => ({
    name: STAGE_LABELS[s.stage] || s.stage,
    value: s.count,
    color: STAGE_COLORS[s.stage] || '#ccc',
  }));

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#1a1a2e' }}>
          Welcome back, {user?.full_name?.split(' ')[0]} 👋
        </h1>
        <p style={{ color: '#888', fontSize: 14, marginTop: 4 }}>Here's what's happening with your leads today.</p>
      </div>

      {/* Stat cards */}
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 28 }}>
        <StatCard label="Total Leads" value={stats.total_leads} color={NAVY} icon="📋" />
        <StatCard label="New Lead" value={stats.new_leads} color="#6366f1" icon="✨" />
        <StatCard label="Active" value={stats.active_leads} color="#3b82f6" icon="🔥" />
        <StatCard label="Follow Up" value={stats.follow_up || 0} color="#f59e0b" icon="🔁" />
        <StatCard label="Junk / Lost" value={(stats.closed_lost || 0) + (stats.junk || 0)} color="#ef4444" icon="❌" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 20, marginBottom: 28 }}>
        {/* Stage bar chart */}
        <div style={{ background: '#fff', borderRadius: 12, padding: '20px 24px', boxShadow: '0 1px 6px rgba(0,0,0,0.07)' }}>
          <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 16 }}>Leads by Stage</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={stageData}>
              <XAxis dataKey="name" tick={{ fontSize: isMobile ? 9 : 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                {stageData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Pie chart */}
        <div style={{ background: '#fff', borderRadius: 12, padding: '20px 24px', boxShadow: '0 1px 6px rgba(0,0,0,0.07)' }}>
          <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 16 }}>Stage Distribution</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={stageData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                {stageData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Admin section */}
      {adminData && (
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 20 }}>
          <div style={{ background: '#fff', borderRadius: 12, padding: '20px 24px', boxShadow: '0 1px 6px rgba(0,0,0,0.07)' }}>
            <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 16 }}>Broker Performance</h3>
            {adminData.broker_performance?.map(b => (
              <div key={b.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #f5f5f5' }}>
                <span style={{ fontSize: 14 }}>{b.name}</span>
                <span style={{
                  background: NAVY, color: '#fff', borderRadius: 20, padding: '2px 10px', fontSize: 12, fontWeight: 600,
                }}>
                  {b.lead_count} leads
                </span>
              </div>
            ))}
          </div>
          <div style={{ background: '#fff', borderRadius: 12, padding: '20px 24px', boxShadow: '0 1px 6px rgba(0,0,0,0.07)' }}>
            <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 16 }}>Lead Sources</h3>
            {adminData.source_breakdown?.map(s => (
              <div key={s.source} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #f5f5f5' }}>
                <span style={{ fontSize: 14 }}>{s.source}</span>
                <span style={{ background: '#f0f4ff', color: NAVY, borderRadius: 20, padding: '2px 10px', fontSize: 12, fontWeight: 600 }}>
                  {s.count}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
