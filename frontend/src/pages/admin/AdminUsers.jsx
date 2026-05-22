import { useEffect, useState, useCallback } from 'react';
import Layout from '../../components/Layout';
import api from '../../lib/api';

const STATUSES = ['', 'active', 'inactive'];
const ROLES = ['', 'admin', 'user'];

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({ status: '', role: '', search: '' });
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState('');

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 15, ...filters };
      const { data } = await api.get('/admin/users', { params });
      setUsers(data.users);
      setTotal(data.total);
    } catch {
      // errors surfaced inline
    } finally {
      setLoading(false);
    }
  }, [page, filters]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const toggleStatus = async (userId, currentStatus) => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    setActionLoading(userId);
    try {
      await api.patch(`/admin/users/${userId}/status`, { status: newStatus });
      setUsers((prev) =>
        prev.map((u) => (u._id === userId ? { ...u, status: newStatus } : u))
      );
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update status');
    } finally {
      setActionLoading('');
    }
  };

  const deleteUser = async (userId, email) => {
    if (!window.confirm(`Delete user "${email}"? This also removes all their tasks.`)) return;
    setActionLoading(userId);
    try {
      await api.delete(`/admin/users/${userId}`);
      setUsers((prev) => prev.filter((u) => u._id !== userId));
      setTotal((t) => t - 1);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete user');
    } finally {
      setActionLoading('');
    }
  };

  return (
    <Layout>
      <div className="page-header">
        <h1 className="page-title">User Management</h1>
        <p className="page-sub">{total} total users</p>
      </div>

      <div className="filters-bar">
        <input
          className="filter-input"
          placeholder="Search name or email…"
          value={filters.search}
          onChange={(e) => { setFilters((f) => ({ ...f, search: e.target.value })); setPage(1); }}
        />
        <select
          className="filter-select"
          value={filters.status}
          onChange={(e) => { setFilters((f) => ({ ...f, status: e.target.value })); setPage(1); }}
        >
          <option value="">All statuses</option>
          {STATUSES.filter(Boolean).map((s) => <option key={s}>{s}</option>)}
        </select>
        <select
          className="filter-select"
          value={filters.role}
          onChange={(e) => { setFilters((f) => ({ ...f, role: e.target.value })); setPage(1); }}
        >
          <option value="">All roles</option>
          {ROLES.filter(Boolean).map((r) => <option key={r}>{r}</option>)}
        </select>
      </div>

      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Status</th>
              <th>Joined</th>
              <th>Last Login</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="table-empty">Loading…</td></tr>
            ) : users.length === 0 ? (
              <tr><td colSpan={7} className="table-empty">No users found</td></tr>
            ) : users.map((u) => (
              <tr key={u._id}>
                <td className="td-name">{u.name}</td>
                <td className="td-email">{u.email}</td>
                <td><span className={`badge badge-role badge-${u.role}`}>{u.role}</span></td>
                <td><span className={`badge badge-status badge-${u.status}`}>{u.status}</span></td>
                <td className="td-date">{new Date(u.createdAt).toLocaleDateString()}</td>
                <td className="td-date">
                  {u.lastLogin ? new Date(u.lastLogin).toLocaleDateString() : '—'}
                </td>
                <td>
                  <div className="action-btns">
                    <button
                      className={`btn-action btn-toggle ${u.status === 'active' ? 'btn-deactivate' : 'btn-activate'}`}
                      onClick={() => toggleStatus(u._id, u.status)}
                      disabled={actionLoading === u._id}
                    >
                      {u.status === 'active' ? 'Deactivate' : 'Activate'}
                    </button>
                    <button
                      className="btn-action btn-delete"
                      onClick={() => deleteUser(u._id, u.email)}
                      disabled={actionLoading === u._id}
                    >
                      Delete
                    </button>
                  </div>
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

        .filters-bar {
          display: flex; gap: 0.75rem; margin-bottom: 1.25rem; flex-wrap: wrap;
        }

        .filter-input, .filter-select {
          padding: 0.5rem 0.75rem; border: 1px solid #e5e7eb;
          border-radius: 8px; font-size: 13px; background: #fff;
          color: #1a1a2e; outline: none;
        }

        .filter-input { flex: 1; min-width: 200px; }
        .filter-input:focus, .filter-select:focus { border-color: #7c6af7; }

        .table-wrap {
          background: #fff; border-radius: 12px;
          border: 1px solid #f0edf8; overflow-x: auto;
          box-shadow: 0 1px 3px rgba(0,0,0,0.04);
        }

        .data-table { width: 100%; border-collapse: collapse; font-size: 13px; }
        .data-table th {
          text-align: left; padding: 0.75rem 1rem;
          font-size: 11px; text-transform: uppercase; letter-spacing: 0.06em;
          color: #888; border-bottom: 1px solid #f0edf8; white-space: nowrap;
        }
        .data-table td { padding: 0.85rem 1rem; border-bottom: 1px solid #faf9ff; vertical-align: middle; }
        .data-table tr:last-child td { border-bottom: none; }
        .data-table tr:hover td { background: #faf9ff; }

        .td-name { font-weight: 500; color: #1a1a2e; }
        .td-email { color: #555; }
        .td-date { color: #888; white-space: nowrap; }
        .table-empty { text-align: center; padding: 2rem; color: #aaa; }

        .badge {
          display: inline-block; padding: 2px 8px; border-radius: 20px;
          font-size: 11px; font-weight: 600; text-transform: capitalize;
        }

        .badge-admin { background: #ede9fe; color: #5b21b6; }
        .badge-user  { background: #d1fae5; color: #065f46; }
        .badge-active   { background: #d1fae5; color: #065f46; }
        .badge-inactive { background: #fee2e2; color: #991b1b; }

        .action-btns { display: flex; gap: 0.5rem; }

        .btn-action {
          padding: 4px 10px; border-radius: 6px; font-size: 12px;
          font-weight: 500; cursor: pointer; border: none; transition: opacity 0.15s;
        }
        .btn-action:disabled { opacity: 0.5; cursor: not-allowed; }
        .btn-activate   { background: #d1fae5; color: #065f46; }
        .btn-deactivate { background: #fef3c7; color: #92400e; }
        .btn-delete     { background: #fee2e2; color: #991b1b; }
        .btn-action:hover:not(:disabled) { opacity: 0.8; }

        .pagination {
          display: flex; align-items: center; gap: 1rem; margin-top: 1rem;
          justify-content: center;
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
