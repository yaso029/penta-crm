import { useState } from 'react';
import { useAuth } from '../AuthContext';
import api from '../api';
import toast from 'react-hot-toast';

const S = {
  page: {
    minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: 'linear-gradient(135deg, #0A2342 0%, #1a3a5c 100%)',
  },
  card: {
    background: '#0d1728', borderRadius: 16, padding: '48px 40px', width: 400,
    boxShadow: '0 20px 60px rgba(0,0,0,0.6)', border: '1px solid rgba(255,255,255,0.08)',
  },
  logo: {
    textAlign: 'center', marginBottom: 32,
  },
  logoText: {
    fontSize: 24, fontWeight: 800, color: '#fff', letterSpacing: '-0.5px', marginTop: 4,
  },
  logoSub: {
    fontSize: 11, color: '#C9A84C', letterSpacing: 2, textTransform: 'uppercase', marginTop: 4,
  },
  divider: {
    height: 2, background: 'linear-gradient(90deg, #C9A84C, #e8c878, #C9A84C)',
    borderRadius: 1, margin: '12px auto 32px', width: 60,
  },
  title: { fontSize: 18, fontWeight: 600, color: 'rgba(255,255,255,0.85)', marginBottom: 24 },
  label: { display: 'block', fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.45)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 },
  input: {
    width: '100%', padding: '12px 14px',
    border: '1.5px solid rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.06)',
    color: '#fff',
    borderRadius: 8, fontSize: 14, outline: 'none', transition: 'border-color 0.2s',
    marginBottom: 16, boxSizing: 'border-box',
  },
  btn: {
    width: '100%', padding: '13px', background: '#C9A84C', color: '#0d1728',
    border: 'none', borderRadius: 8, fontSize: 15, fontWeight: 700,
    cursor: 'pointer', transition: 'background 0.2s',
  },
};

export default function LoginPage() {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.post('/api/auth/login', { username, password });
      login(data.user, data.access_token);
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={S.page}>
      <div style={S.card}>
        <div style={S.logo}>
          <img src="/penta-logo.png" alt="Penta System" style={{ width: 120, height: 120, objectFit: 'contain', marginBottom: 8 }} />
          <div style={S.logoText}>Penta System</div>
          <div style={S.logoSub}>Real Estate Platform</div>
          <div style={S.divider} />
        </div>
        <h2 style={S.title}>Sign in to your account</h2>
        <form onSubmit={handleSubmit}>
          <label style={S.label}>Username</label>
          <input
            style={S.input}
            type="text"
            value={username}
            onChange={e => setUsername(e.target.value)}
            placeholder="Your name"
            required
          />
          <label style={S.label}>Password</label>
          <input
            style={S.input}
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="••••••••"
            required
          />
          <button
            style={{ ...S.btn, opacity: loading ? 0.7 : 1 }}
            type="submit"
            disabled={loading}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}
