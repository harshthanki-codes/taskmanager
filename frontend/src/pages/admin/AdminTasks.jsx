import { useEffect, useState, useCallback } from 'react';
import Layout from '../../components/Layout';
import api from '../../lib/api';

const STATUSES = ['pending', 'in-progress', 'completed'];
const PRIORITIES = ['low', 'medium', 'high'];

const priorityColor = { low: '#64748b', medium: '#f59e0b', high: '#f43f5e' };

export default function AdminTasks() {
  const [tasks, setTasks] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({ status: '', priority: '' });
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState('');

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/admin/tasks', {
        params: { page, limit: 15, ...filters },
      });
      setTasks(data.tasks);
      setTotal(data.total);
    } catch {
    } finally {
      setLoading(false);
    }
  }, [page, filters]);

  useEffect(() => { fetchTasks(); }, [fetchTasks]);

  const handleDelete = async (taskId, title) => {
    if (!window.confirm(`Delete task "${title}"?`)) return;
    setDeleting(taskId);
    try {
      await api.delete(`/admin/tasks/${taskId}`);
      setTasks((prev) => prev.filter((t) => t._id !== taskId));
      setTotal((n) => n - 1);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete task');
    } finally {
      setDeleting('');
    }
  };

  return (
    <Layout>
      <div className="page-header">
        <h1 className="page-title">Task Monitoring</h1>
        <p className="page-sub">{total} tasks across all users</p>
      </div>

      <div className="filters-bar">
        <select
          className="filter-select"
          value={filters.status}
          onChange={(e) => { setFilters((f) => ({ ...f, status: e.target.value })); setPage(1); }}
        >
          <option value="">All statuses</option>
          {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <select
          className="filter-select"
          value={filters.priority}
          onChange={(e) => { setFilters((f) => ({ ...f, priority: e.target.value })); setPage(1); }}
        >
          <option value="">All priorities</option>
          {PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
        </select>
      </div>

      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Owner</th>
              <th>Priority</th>
              <th>Status</th>
              <th>Due</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="table-empty">Loading…</td></tr>
            ) : tasks.length === 0 ? (
              <tr><td colSpan={7} className="table-empty">No tasks found</td></tr>
            ) : tasks.map((t) => (
              <tr key={t._id}>
                <td className="td-title">{t.title}</td>
                <td className="td-owner">
                  <span className="owner-name">{t.owner?.name ?? 'Unknown'}</span>
                  <span className="owner-email">{t.owner?.email}</span>
                </td>
                <td>
                  <span className="priority-dot" style={{ background: priorityColor[t.priority] }} />
                  {t.priority}
                </td>
                <td><span className={`status-badge status-${t.status}`}>{t.status}</span></td>
                <td className="td-date">
                  {t.dueDate ? new Date(t.dueDate).toLocaleDateString() : '—'}
                </td>
                <td className="td-date">{new Date(t.createdAt).toLocaleDateString()}</td>
                <td>
                  <button
                    className="btn-delete"
                    onClick={() => handleDelete(t._id, t.title)}
                    disabled={deleting === t._id}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {total > 15 && (
        <div className="pagination">
          <button disabled={page === 1} onClick={() => setPage((p) => p - 1)} className="pg-btn">← Prev</button>
          <span className="pg-info">Page {page} of {Math.ceil(total / 15)}</span>
          <button disabled={page >= Math.ceil(total / 15)} onClick={() => setPage((p) => p + 1)} className="pg-btn">Next →</button>
        </div>
      )}

      <style>{`
        .page-header { margin-bottom: 1.5rem; }
        .page-title { font-size: 1.5rem; font-weight: 700; color: #1a1a2e; margin: 0 0 0.25rem; }
        .page-sub { font-size: 14px; color: #888; margin: 0; }

        .filters-bar { display: flex; gap: 0.75rem; margin-bottom: 1.25rem; }
        .filter-select {
          padding: 0.5rem 0.75rem; border: 1px solid #e5e7eb; border-radius: 8px;
          font-size: 13px; background: #fff; color: #1a1a2e; outline: none;
        }
        .filter-select:focus { border-color: #7c6af7; }

        .table-wrap {
          background: #fff; border-radius: 12px; border: 1px solid #f0edf8;
          overflow-x: auto; box-shadow: 0 1px 3px rgba(0,0,0,0.04);
        }

        .data-table { width: 100%; border-collapse: collapse; font-size: 13px; }
        .data-table th {
          text-align: left; padding: 0.75rem 1rem;
          font-size: 11px; text-transform: uppercase; letter-spacing: 0.06em;
          color: #888; border-bottom: 1px solid #f0edf8;
        }
        .data-table td { padding: 0.85rem 1rem; border-bottom: 1px solid #faf9ff; vertical-align: middle; }
        .data-table tr:last-child td { border-bottom: none; }
        .data-table tr:hover td { background: #faf9ff; }

        .td-title { font-weight: 500; color: #1a1a2e; max-width: 220px; }
        .td-date { color: #888; white-space: nowrap; }
        .td-owner { display: flex; flex-direction: column; gap: 2px; }
        .owner-name { font-weight: 500; color: #1a1a2e; }
        .owner-email { font-size: 11px; color: #aaa; }
        .table-empty { text-align: center; padding: 2rem; color: #aaa; }

        .priority-dot {
          display: inline-block; width: 8px; height: 8px; border-radius: 50%;
          margin-right: 6px; vertical-align: middle;
        }

        .status-badge {
          display: inline-block; padding: 2px 8px; border-radius: 20px;
          font-size: 11px; font-weight: 600; white-space: nowrap;
        }
        .status-pending    { background: #f1f5f9; color: #475569; }
        .status-in-progress { background: #fef3c7; color: #92400e; }
        .status-completed  { background: #d1fae5; color: #065f46; }

        .btn-delete {
          padding: 4px 10px; border-radius: 6px; font-size: 12px; font-weight: 500;
          cursor: pointer; border: none; background: #fee2e2; color: #991b1b;
          transition: opacity 0.15s;
        }
        .btn-delete:disabled { opacity: 0.5; cursor: not-allowed; }
        .btn-delete:hover:not(:disabled) { opacity: 0.8; }

        .pagination {
          display: flex; align-items: center; gap: 1rem; margin-top: 1rem; justify-content: center;
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
