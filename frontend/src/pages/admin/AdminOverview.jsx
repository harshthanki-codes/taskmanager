import { useEffect, useState } from 'react';
import Layout from '../../components/Layout';
import StatCard from '../../components/StatCard';
import api from '../../lib/api';

export default function AdminOverview() {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/admin/analytics')
      .then(({ data }) => setAnalytics(data))
      .catch(() => setError('Failed to load analytics'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <Layout>
      <div className="page-header">
        <h1 className="page-title">Admin Overview</h1>
        <p className="page-sub">Platform-wide metrics and system health</p>
      </div>

      {error && <p className="error-msg">{error}</p>}

      {loading ? (
        <p className="loading-text">Loading analytics…</p>
      ) : analytics ? (
        <>
          <section className="section">
            <h2 className="section-title">Users</h2>
            <div className="stats-grid">
              <StatCard label="Total Users" value={analytics.users.total} accent="#7c6af7" />
              <StatCard label="Active" value={analytics.users.active} accent="#10b981" sub="Currently enabled" />
              <StatCard label="Inactive" value={analytics.users.inactive} accent="#f43f5e" sub="Suspended accounts" />
            </div>
          </section>

          <section className="section">
            <h2 className="section-title">Tasks</h2>
            <div className="stats-grid">
              <StatCard label="Total Tasks" value={analytics.tasks.total} accent="#7c6af7" />
              <StatCard label="Completed" value={analytics.tasks.completed} accent="#10b981" />
              <StatCard label="In Progress" value={analytics.tasks.inProgress} accent="#f59e0b" />
              <StatCard label="Pending" value={analytics.tasks.pending} accent="#64748b" />
            </div>
          </section>

          {analytics.tasks.total > 0 && (
            <section className="section">
              <h2 className="section-title">Completion Rate</h2>
              <div className="progress-card">
                <div className="progress-header">
                  <span className="progress-label">Tasks completed</span>
                  <span className="progress-pct">
                    {Math.round((analytics.tasks.completed / analytics.tasks.total) * 100)}%
                  </span>
                </div>
                <div className="progress-track">
                  <div
                    className="progress-bar"
                    style={{
                      width: `${(analytics.tasks.completed / analytics.tasks.total) * 100}%`,
                    }}
                  />
                </div>
              </div>
            </section>
          )}
        </>
      ) : null}

      <style>{`
        .page-header { margin-bottom: 2rem; }
        .page-title { font-size: 1.5rem; font-weight: 700; color: #1a1a2e; margin: 0 0 0.25rem; }
        .page-sub { font-size: 14px; color: #888; margin: 0; }

        .section { margin-bottom: 2rem; }
        .section-title { font-size: 13px; font-weight: 600; text-transform: uppercase;
          letter-spacing: 0.06em; color: #888; margin: 0 0 1rem; }

        .stats-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 1rem; }

        .progress-card {
          background: #fff;
          border-radius: 12px;
          padding: 1.25rem 1.5rem;
          border: 1px solid #f0edf8;
          box-shadow: 0 1px 3px rgba(0,0,0,0.04);
          max-width: 500px;
        }

        .progress-header {
          display: flex; justify-content: space-between; align-items: center;
          margin-bottom: 0.75rem;
          font-size: 14px; color: #1a1a2e;
        }

        .progress-pct { font-weight: 700; color: #7c6af7; }

        .progress-track {
          height: 8px; background: #f0edf8; border-radius: 4px; overflow: hidden;
        }

        .progress-bar {
          height: 100%; background: #7c6af7; border-radius: 4px;
          transition: width 0.6s ease;
        }

        .loading-text { color: #888; font-size: 14px; }
        .error-msg { color: #f43f5e; font-size: 14px; padding: 0.75rem; background: #fff1f2;
          border-radius: 8px; margin-bottom: 1rem; }
      `}</style>
    </Layout>
  );
}
