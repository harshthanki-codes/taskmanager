import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (form.password !== form.confirm) {
      return setError('Passwords do not match');
    }
    if (form.password.length < 6) {
      return setError('Password must be at least 6 characters');
    }

    setLoading(true);
    try {
      const user = await register(form.name, form.email, form.password);
      navigate(user.role === 'admin' ? '/admin' : '/dashboard', { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-brand">
          <span className="brand-mark">TM</span>
          <span className="brand-name">TaskManager</span>
        </div>

        <h1 className="auth-title">Create account</h1>
        <p className="auth-sub">Get started — it only takes a moment</p>

        {error && <div className="auth-error">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="field">
            <label className="field-label">Full name</label>
            <input
              type="text"
              name="name"
              className="field-input"
              placeholder="Jane Smith"
              value={form.name}
              onChange={handleChange}
              required
              autoComplete="name"
            />
          </div>

          <div className="field">
            <label className="field-label">Email</label>
            <input
              type="email"
              name="email"
              className="field-input"
              placeholder="you@example.com"
              value={form.email}
              onChange={handleChange}
              required
              autoComplete="email"
            />
          </div>

          <div className="field">
            <label className="field-label">Password</label>
            <input
              type="password"
              name="password"
              className="field-input"
              placeholder="Min. 6 characters"
              value={form.password}
              onChange={handleChange}
              required
              autoComplete="new-password"
            />
          </div>

          <div className="field">
            <label className="field-label">Confirm password</label>
            <input
              type="password"
              name="confirm"
              className="field-input"
              placeholder="Repeat password"
              value={form.confirm}
              onChange={handleChange}
              required
              autoComplete="new-password"
            />
          </div>

          <button type="submit" className="submit-btn" disabled={loading}>
            {loading ? 'Creating account…' : 'Create account'}
          </button>
        </form>

        <p className="auth-footer">
          Already have an account?{' '}
          <Link to="/login" className="auth-link">Sign in</Link>
        </p>
      </div>

      <style>{`
        .auth-page {
          min-height: 100vh;
          background: linear-gradient(135deg, #1a1a2e 0%, #16213e 60%, #0f3460 100%);
          display: flex; align-items: center; justify-content: center;
          padding: 1rem;
          font-family: 'DM Sans', system-ui, sans-serif;
        }

        .auth-card {
          background: #fff; border-radius: 20px; padding: 2.5rem;
          width: 100%; max-width: 420px;
          box-shadow: 0 25px 60px rgba(0,0,0,0.3);
        }

        .auth-brand { display: flex; align-items: center; gap: 0.6rem; margin-bottom: 2rem; }
        .brand-mark {
          width: 32px; height: 32px; background: #7c6af7; border-radius: 8px;
          display: flex; align-items: center; justify-content: center;
          font-size: 12px; font-weight: 700; color: #fff;
        }
        .brand-name { font-size: 15px; font-weight: 600; color: #1a1a2e; }

        .auth-title { font-size: 1.5rem; font-weight: 700; color: #1a1a2e; margin: 0 0 0.3rem; }
        .auth-sub { font-size: 14px; color: #888; margin: 0 0 1.5rem; }

        .auth-error {
          background: #fff1f2; border: 1px solid #fecdd3; color: #be123c;
          border-radius: 8px; padding: 0.7rem 1rem; font-size: 13px; margin-bottom: 1.25rem;
        }

        .auth-form { display: flex; flex-direction: column; gap: 1rem; }

        .field { display: flex; flex-direction: column; gap: 0.4rem; }
        .field-label { font-size: 13px; font-weight: 500; color: #374151; }
        .field-input {
          padding: 0.7rem 0.9rem; border: 1.5px solid #e5e7eb; border-radius: 10px;
          font-size: 14px; color: #1a1a2e; outline: none;
          transition: border-color 0.15s; background: #fafafa;
        }
        .field-input:focus { border-color: #7c6af7; background: #fff; }

        .submit-btn {
          margin-top: 0.5rem; padding: 0.8rem;
          background: #7c6af7; color: #fff; border: none; border-radius: 10px;
          font-size: 14px; font-weight: 600; cursor: pointer;
          transition: background 0.15s, transform 0.1s;
        }
        .submit-btn:hover:not(:disabled) { background: #6c58f0; }
        .submit-btn:active:not(:disabled) { transform: scale(0.99); }
        .submit-btn:disabled { opacity: 0.6; cursor: not-allowed; }

        .auth-footer { text-align: center; font-size: 13px; color: #888; margin: 1.25rem 0 0; }
        .auth-link { color: #7c6af7; font-weight: 500; text-decoration: none; }
        .auth-link:hover { text-decoration: underline; }
      `}</style>
    </div>
  );
}
