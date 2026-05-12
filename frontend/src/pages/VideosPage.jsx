import { useNavigate } from 'react-router-dom';
import Videos from './agents/Videos';

export default function VideosPage() {
  const navigate = useNavigate();
  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc' }}>
      <div style={{ background: '#0d1728', padding: '14px 24px', display: 'flex', alignItems: 'center', gap: 14 }}>
        <button onClick={() => navigate('/')}
          style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8, color: 'rgba(255,255,255,0.6)', fontSize: 13, cursor: 'pointer', padding: '7px 14px' }}>
          ← Home
        </button>
        <div style={{ fontSize: 16, fontWeight: 800, color: '#fff' }}>Video Resources</div>
      </div>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 24px' }}>
        <Videos />
      </div>
    </div>
  );
}
