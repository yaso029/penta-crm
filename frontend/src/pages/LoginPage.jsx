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
    background: '#fff', borderRadius: 16, padding: '48px 40px', width: 400,
    boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
  },
  logo: {
    textAlign: 'center', marginBottom: 32,
  },
  logoText: {
    fontSize: 28, fontWeight: 700, color: '#0A2342', letterSpacing: '-0.5px',
  },
  logoSub: {
    fontSize: 12, color: '#888', letterSpacing: 2, textTransform: 'uppercase', marginTop: 4,
  },
  divider: {
    height: 2, background: 'linear-gradient(90deg, #C9A84C, #e8c878, #C9A84C)',
    borderRadius: 1, margin: '0 auto 32px', width: 60,
  },
  title: { fontSize: 20, fontWeight: 600, color: '#1a1a2e', marginBottom: 24 },
  label: { display: 'block', fontSize: 12, fontWeight: 600, color: '#555', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 },
  input: {
    width: '100%', padding: '12px 14px', border: '1.5px solid #e0e0e0',
    borderRadius: 8, fontSize: 14, outline: 'none', transition: 'border-color 0.2s',
    marginBottom: 16,
  },
  btn: {
    width: '100%', padding: '13px', background: '#0A2342', color: '#fff',
    border: 'none', borderRadius: 8, fontSize: 15, fontWeight: 600,
    cursor: 'pointer', transition: 'background 0.2s',
  },
};

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.post('/api/auth/login', { email, password });
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
          <div style={S.logoText}>Penta CRM</div>
          <div style={S.logoSub}>Real Estate</div>
          <div style={S.divider} />
        </div>
        <h2 style={S.title}>Sign in to your account</h2>
        <form onSubmit={handleSubmit}>
          <label style={S.label}>Email</label>
          <input
            style={S.input}
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="you@pentadcrm.com"
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
