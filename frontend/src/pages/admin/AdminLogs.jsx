import { useEffect, useState, useCallback } from 'react';
import Layout from '../../components/Layout';
import api from '../../lib/api';

const ACTION_LABELS = {
  login: { label: 'Login', color: '#3b82f6', bg: '#eff6ff' },
  task_created: { label: 'Task Created', color: '#10b981', bg: '#ecfdf5' },
  task_updated: { label: 'Task Updated', color: '#f59e0b', bg: '#fffbeb' },
  task_deleted: { label: 'Task Deleted', color: '#f43f5e', bg: '#fff1f2' },
  user_status_changed: { label: 'Status Changed', color: '#8b5cf6', bg: '#f5f3ff' },
  user_deleted: { label: 'User Deleted', color: '#ef4444', bg: '#fef2f2' },
};

const ALL_ACTIONS = Object.keys(ACTION_LABELS);

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function AdminLogs() {
  const [logs, setLogs] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [actionFilter, setActionFilter] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 30 };
      if (actionFilter) params.action = actionFilter;
      const { data } = await api.get('/admin/logs', { params });
      setLogs(data.logs);
      setTotal(data.total);
    } catch {
    } finally {
      setLoading(false);
    }
  }, [page, actionFilter]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  return (
    <Layout>
      <div className="page-header">
        <h1 className="page-title">Activity Log</h1>
        <p className="page-sub">{total} events recorded</p>
      </div>

      <div className="filters-bar">
        <select
          className="filter-select"
          value={actionFilter}
          onChange={(e) => { setActionFilter(e.target.value); setPage(1); }}
        >
          <option value="">All actions</option>
          {ALL_ACTIONS.map((a) => (
            <option key={a} value={a}>{ACTION_LABELS[a].label}</option>
          ))}
        </select>
        <button className="refresh-btn" onClick={fetchLogs}>↻ Refresh</button>
      </div>

      {loading ? (
        <p className="loading-text">Loading logs…</p>
      ) : logs.length === 0 ? (
        <p className="empty-text">No activity recorded yet.</p>
      ) : (
        <div className="log-list">
          {logs.map((entry) => {
            const meta = ACTION_LABELS[entry.action] ?? { label: entry.action, color: '#888', bg: '#f8f8f8' };
            return (
              <div key={entry._id} className="log-row">
                <div className="log-timeline">
                  <div className="log-dot" style={{ background: meta.color }} />
                  <div className="log-line" />
                </div>
                <div className="log-body">
                  <div className="log-top">
                    <span className="action-badge" style={{ color: meta.color, background: meta.bg }}>
                      {meta.label}
                    </span>
                    <span className="log-time">{timeAgo(entry.createdAt)}</span>
                    <span className="log-full-date">
                      {new Date(entry.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <p className="log-detail">{entry.detail || '—'}</p>
                  <div className="log-meta">
                    {entry.user && (
                      <span className="log-user">
                        {entry.user.name}
                        <span className="log-email"> · {entry.user.email}</span>
                      </span>
                    )}
                    {entry.ip && <span className="log-ip">IP: {entry.ip}</span>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {total > 30 && (
        <div className="pagination">
          <button disabled={page === 1} onClick={() => setPage((p) => p - 1)} className="pg-btn">
            ← Prev
          </button>
          <span className="pg-info">Page {page} of {Math.ceil(total / 30)}</span>
          <button
            disabled={page >= Math.ceil(total / 30)}
            onClick={() => setPage((p) => p + 1)}
            className="pg-btn"
          >
            Next →
          </button>
        </div>
      )}

      <style>{`
        .page-header { margin-bottom: 1.5rem; }
        .page-title { font-size: 1.5rem; font-weight: 700; color: #1a1a2e; margin: 0 0 0.25rem; }
        .page-sub { font-size: 14px; color: #888; margin: 0; }

        .filters-bar { display: flex; gap: 0.75rem; margin-bottom: 1.5rem; align-items: center; }
        .filter-select {
          padding: 0.5rem 0.75rem; border: 1px solid #e5e7eb;
          border-radius: 8px; font-size: 13px; background: #fff; color: #1a1a2e; outline: none;
        }
        .filter-select:focus { border-color: #7c6af7; }
        .refresh-btn {
          padding: 0.5rem 1rem; border-radius: 8px; border: 1px solid #e5e7eb;
          background: #fff; cursor: pointer; font-size: 13px; color: #555;
          transition: all 0.15s;
        }
        .refresh-btn:hover { background: #f8f7ff; border-color: #7c6af7; color: #7c6af7; }

        .loading-text, .empty-text { font-size: 14px; color: #aaa; text-align: center; padding: 3rem; }

        .log-list { display: flex; flex-direction: column; }

        .log-row {
          display: flex; gap: 1rem; align-items: flex-start;
        }

        .log-timeline {
          display: flex; flex-direction: column; align-items: center;
          flex-shrink: 0; padding-top: 4px;
        }

        .log-dot {
          width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0;
        }

        .log-line {
          width: 1px; flex: 1; min-height: 32px;
          background: #e5e7eb; margin-top: 4px;
        }

        .log-row:last-child .log-line { display: none; }

        .log-body {
          flex: 1; padding-bottom: 1.25rem;
          background: #fff; border-radius: 10px; padding: 0.9rem 1rem 0.85rem;
          border: 1px solid #f0edf8;
          box-shadow: 0 1px 2px rgba(0,0,0,0.03);
          margin-bottom: 0.75rem;
        }

        .log-top {
          display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.4rem;
          flex-wrap: wrap;
        }

        .action-badge {
          font-size: 11px; font-weight: 600; padding: 2px 8px;
          border-radius: 20px; white-space: nowrap;
        }

        .log-time { font-size: 12px; color: #aaa; }
        .log-full-date { font-size: 11px; color: #ccc; margin-left: auto; }

        .log-detail { font-size: 13px; color: #333; margin: 0 0 0.5rem; }

        .log-meta { display: flex; gap: 1rem; flex-wrap: wrap; }
        .log-user { font-size: 12px; color: #666; font-weight: 500; }
        .log-email { color: #aaa; font-weight: 400; }
        .log-ip { font-size: 11px; color: #bbb; font-family: monospace; }

        .pagination {
          display: flex; align-items: center; gap: 1rem;
          margin-top: 1.5rem; justify-content: center;
        }
        .pg-btn {
          padding: 0.4rem 0.9rem; border-radius: 8px; border: 1px solid #e5e7eb;
          background: #fff; cursor: pointer; font-size: 13px; color: #1a1a2e;
        }
        .pg-btn:disabled { opacity: 0.4; cursor: not-allowed; }
        .pg-info { font-size: 13px; color: #888; }
      `}</style>
    </Layout>
  );
}
