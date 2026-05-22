import { useEffect, useState, useCallback } from 'react';
import Layout from '../components/Layout';
import { useAuth } from '../contexts/AuthContext';
import api from '../lib/api';

const STATUSES = ['pending', 'in-progress', 'completed'];
const PRIORITIES = ['low', 'medium', 'high'];

const priorityColor = { low: '#64748b', medium: '#f59e0b', high: '#f43f5e' };
const statusColor = {
  pending: { bg: '#f1f5f9', color: '#475569' },
  'in-progress': { bg: '#fef3c7', color: '#92400e' },
  completed: { bg: '#d1fae5', color: '#065f46' },
};

const emptyForm = { title: '', description: '', priority: 'medium', dueDate: '', status: 'pending' };

export default function Dashboard() {
  const { user } = useAuth();

  const [tasks, setTasks] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(false);

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null); // null = create mode
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState('');

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 10 };
      if (statusFilter) params.status = statusFilter;
      const { data } = await api.get('/tasks', { params });
      setTasks(data.tasks);
      setTotal(data.total);
    } catch {
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter]);

  useEffect(() => { fetchTasks(); }, [fetchTasks]);

  const openCreate = () => {
    setEditingTask(null);
    setForm(emptyForm);
    setFormError('');
    setShowModal(true);
  };

  const openEdit = (task) => {
    setEditingTask(task);
    setForm({
      title: task.title,
      description: task.description || '',
      priority: task.priority,
      status: task.status,
      dueDate: task.dueDate ? task.dueDate.slice(0, 10) : '',
    });
    setFormError('');
    setShowModal(true);
  };

  const handleFormChange = (e) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    if (!form.title.trim()) return setFormError('Title is required');

    setSubmitting(true);
    try {
      if (editingTask) {
        const { data } = await api.patch(`/tasks/${editingTask._id}`, form);
        setTasks((prev) =>
          prev.map((t) => (t._id === editingTask._id ? data.task : t))
        );
      } else {
        const { data } = await api.post('/tasks', form);
        setTasks((prev) => [data.task, ...prev]);
        setTotal((n) => n + 1);
      }
      setShowModal(false);
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to save task');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (taskId) => {
    if (!window.confirm('Delete this task?')) return;
    setDeletingId(taskId);
    try {
      await api.delete(`/tasks/${taskId}`);
      setTasks((prev) => prev.filter((t) => t._id !== taskId));
      setTotal((n) => n - 1);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete task');
    } finally {
      setDeletingId('');
    }
  };

  const completedCount = tasks.filter((t) => t.status === 'completed').length;

  return (
    <Layout>
      <div className="page-header">
        <div>
          <h1 className="page-title">My Tasks</h1>
          <p className="page-sub">Hello, {user?.name} · {total} task{total !== 1 ? 's' : ''} total</p>
        </div>
        <button className="create-btn" onClick={openCreate}>+ New Task</button>
      </div>

      {tasks.length > 0 && (
        <div className="quick-stats">
          <span className="qs-item">
            <span className="qs-num">{tasks.filter((t) => t.status === 'pending').length}</span> pending
          </span>
          <span className="qs-item">
            <span className="qs-num" style={{ color: '#f59e0b' }}>
              {tasks.filter((t) => t.status === 'in-progress').length}
            </span> in progress
          </span>
          <span className="qs-item">
            <span className="qs-num" style={{ color: '#10b981' }}>{completedCount}</span> completed
          </span>
        </div>
      )}

      <div className="toolbar">
        <div className="status-tabs">
          {['', ...STATUSES].map((s) => (
            <button
              key={s}
              className={`status-tab ${statusFilter === s ? 'status-tab--active' : ''}`}
              onClick={() => { setStatusFilter(s); setPage(1); }}
            >
              {s || 'All'}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <p className="loading-text">Loading tasks…</p>
      ) : tasks.length === 0 ? (
        <div className="empty-state">
          <p className="empty-icon">✓</p>
          <p className="empty-title">No tasks here</p>
          <p className="empty-sub">Create your first task to get started</p>
          <button className="create-btn" onClick={openCreate}>+ New Task</button>
        </div>
      ) : (
        <div className="task-list">
          {tasks.map((task) => (
            <div key={task._id} className="task-card">
              <div className="task-card-left">
                <div className="task-top">
                  <span
                    className="task-priority-dot"
                    style={{ background: priorityColor[task.priority] }}
                    title={`Priority: ${task.priority}`}
                  />
                  <h3 className="task-title">{task.title}</h3>
                  <span
                    className="task-status"
                    style={{
                      background: statusColor[task.status]?.bg,
                      color: statusColor[task.status]?.color,
                    }}
                  >
                    {task.status}
                  </span>
                </div>
                {task.description && (
                  <p className="task-desc">{task.description}</p>
                )}
                <div className="task-meta">
                  <span className="task-meta-item">
                    Priority: <strong>{task.priority}</strong>
                  </span>
                  {task.dueDate && (
                    <span className="task-meta-item">
                      Due: <strong>{new Date(task.dueDate).toLocaleDateString()}</strong>
                    </span>
                  )}
                  <span className="task-meta-item">
                    Created: {new Date(task.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
              <div className="task-actions">
                <button className="btn-edit" onClick={() => openEdit(task)}>Edit</button>
                <button
                  className="btn-del"
                  onClick={() => handleDelete(task._id)}
                  disabled={deletingId === task._id}
                >
                  {deletingId === task._id ? '…' : 'Delete'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {total > 10 && (
        <div className="pagination">
          <button disabled={page === 1} onClick={() => setPage((p) => p - 1)} className="pg-btn">← Prev</button>
          <span className="pg-info">Page {page} of {Math.ceil(total / 10)}</span>
          <button disabled={page >= Math.ceil(total / 10)} onClick={() => setPage((p) => p + 1)} className="pg-btn">Next →</button>
        </div>
      )}

      {/* Create / Edit Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal">
            <div className="modal-header">
              <h2 className="modal-title">{editingTask ? 'Edit Task' : 'New Task'}</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>

            {formError && <div className="form-error">{formError}</div>}

            <form onSubmit={handleSubmit} className="task-form">
              <div className="field">
                <label className="field-label">Title *</label>
                <input
                  name="title"
                  className="field-input"
                  placeholder="What needs to be done?"
                  value={form.title}
                  onChange={handleFormChange}
                  required
                  autoFocus
                />
              </div>

              <div className="field">
                <label className="field-label">Description</label>
                <textarea
                  name="description"
                  className="field-input field-textarea"
                  placeholder="Optional details…"
                  value={form.description}
                  onChange={handleFormChange}
                  rows={3}
                />
              </div>

              <div className="field-row">
                <div className="field">
                  <label className="field-label">Priority</label>
                  <select name="priority" className="field-input" value={form.priority} onChange={handleFormChange}>
                    {PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>

                <div className="field">
                  <label className="field-label">Status</label>
                  <select name="status" className="field-input" value={form.status} onChange={handleFormChange}>
                    {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>

                <div className="field">
                  <label className="field-label">Due date</label>
                  <input
                    type="date"
                    name="dueDate"
                    className="field-input"
                    value={form.dueDate}
                    onChange={handleFormChange}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn-cancel" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-save" disabled={submitting}>
                  {submitting ? 'Saving…' : editingTask ? 'Save changes' : 'Create task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        .page-header {
          display: flex; align-items: flex-start; justify-content: space-between;
          margin-bottom: 1.5rem; flex-wrap: wrap; gap: 1rem;
        }
        .page-title { font-size: 1.5rem; font-weight: 700; color: #1a1a2e; margin: 0 0 0.25rem; }
        .page-sub { font-size: 14px; color: #888; margin: 0; }

        .create-btn {
          padding: 0.6rem 1.25rem; background: #7c6af7; color: #fff;
          border: none; border-radius: 10px; font-size: 14px; font-weight: 600;
          cursor: pointer; transition: background 0.15s; white-space: nowrap;
        }
        .create-btn:hover { background: #6c58f0; }

        .quick-stats {
          display: flex; gap: 1.5rem; margin-bottom: 1.25rem;
          padding: 0.75rem 1rem;
          background: #fff; border-radius: 10px; border: 1px solid #f0edf8;
          font-size: 13px; color: #888;
        }
        .qs-item { display: flex; align-items: center; gap: 0.35rem; }
        .qs-num { font-size: 16px; font-weight: 700; color: #1a1a2e; }

        .toolbar { margin-bottom: 1.25rem; }
        .status-tabs { display: flex; gap: 0.4rem; flex-wrap: wrap; }
        .status-tab {
          padding: 0.4rem 0.9rem; border-radius: 20px;
          font-size: 13px; border: 1px solid #e5e7eb;
          background: #fff; color: #555; cursor: pointer;
          transition: all 0.15s;
        }
        .status-tab:hover { border-color: #7c6af7; color: #7c6af7; }
        .status-tab--active { background: #7c6af7; color: #fff; border-color: #7c6af7; }

        .loading-text { font-size: 14px; color: #aaa; }

        .empty-state {
          text-align: center; padding: 4rem 2rem;
          background: #fff; border-radius: 12px; border: 1px dashed #e5e7eb;
        }
        .empty-icon { font-size: 2.5rem; margin-bottom: 0.5rem; opacity: 0.2; }
        .empty-title { font-size: 16px; font-weight: 600; color: #1a1a2e; margin: 0 0 0.4rem; }
        .empty-sub { font-size: 13px; color: #aaa; margin: 0 0 1.5rem; }

        .task-list { display: flex; flex-direction: column; gap: 0.75rem; }

        .task-card {
          background: #fff; border-radius: 12px;
          border: 1px solid #f0edf8;
          padding: 1rem 1.25rem;
          display: flex; align-items: flex-start; justify-content: space-between; gap: 1rem;
          box-shadow: 0 1px 3px rgba(0,0,0,0.03);
          transition: box-shadow 0.15s;
        }
        .task-card:hover { box-shadow: 0 4px 12px rgba(124,106,247,0.08); }

        .task-card-left { flex: 1; min-width: 0; }

        .task-top { display: flex; align-items: center; gap: 0.6rem; flex-wrap: wrap; margin-bottom: 0.4rem; }
        .task-priority-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
        .task-title { font-size: 15px; font-weight: 600; color: #1a1a2e; margin: 0; flex: 1; }

        .task-status {
          font-size: 11px; font-weight: 600; padding: 2px 8px;
          border-radius: 20px; white-space: nowrap; text-transform: capitalize;
        }

        .task-desc { font-size: 13px; color: #666; margin: 0 0 0.6rem; line-height: 1.5; }

        .task-meta { display: flex; gap: 1rem; flex-wrap: wrap; }
        .task-meta-item { font-size: 12px; color: #aaa; }
        .task-meta-item strong { color: #555; }

        .task-actions { display: flex; flex-direction: column; gap: 0.4rem; flex-shrink: 0; }

        .btn-edit, .btn-del {
          padding: 4px 12px; border-radius: 6px; font-size: 12px; font-weight: 500;
          cursor: pointer; border: none; transition: opacity 0.15s;
        }
        .btn-edit { background: #ede9fe; color: #5b21b6; }
        .btn-del  { background: #fee2e2; color: #991b1b; }
        .btn-edit:hover, .btn-del:hover { opacity: 0.8; }
        .btn-del:disabled { opacity: 0.5; cursor: not-allowed; }

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

        /* Modal */
        .modal-overlay {
          position: fixed; inset: 0;
          background: rgba(0,0,0,0.45);
          display: flex; align-items: center; justify-content: center;
          padding: 1rem; z-index: 100;
        }
        .modal {
          background: #fff; border-radius: 16px;
          width: 100%; max-width: 560px;
          padding: 1.75rem;
          box-shadow: 0 25px 60px rgba(0,0,0,0.2);
          max-height: 90vh; overflow-y: auto;
        }
        .modal-header {
          display: flex; align-items: center; justify-content: space-between;
          margin-bottom: 1.25rem;
        }
        .modal-title { font-size: 1.1rem; font-weight: 700; color: #1a1a2e; margin: 0; }
        .modal-close {
          background: none; border: none; font-size: 16px; cursor: pointer;
          color: #aaa; padding: 0.25rem; line-height: 1;
        }
        .modal-close:hover { color: #333; }

        .form-error {
          background: #fff1f2; border: 1px solid #fecdd3; color: #be123c;
          border-radius: 8px; padding: 0.6rem 0.9rem; font-size: 13px; margin-bottom: 1rem;
        }

        .task-form { display: flex; flex-direction: column; gap: 1rem; }

        .field { display: flex; flex-direction: column; gap: 0.4rem; }
        .field-label { font-size: 13px; font-weight: 500; color: #374151; }
        .field-input {
          padding: 0.65rem 0.85rem; border: 1.5px solid #e5e7eb;
          border-radius: 8px; font-size: 14px; color: #1a1a2e; outline: none;
          background: #fafafa; transition: border-color 0.15s;
          font-family: inherit;
        }
        .field-input:focus { border-color: #7c6af7; background: #fff; }
        .field-textarea { resize: vertical; min-height: 80px; }

        .field-row { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 0.75rem; }

        .modal-footer { display: flex; justify-content: flex-end; gap: 0.75rem; margin-top: 0.5rem; }

        .btn-cancel {
          padding: 0.6rem 1.25rem; border-radius: 8px; border: 1px solid #e5e7eb;
          background: #fff; color: #555; font-size: 14px; cursor: pointer;
        }
        .btn-save {
          padding: 0.6rem 1.5rem; border-radius: 8px; border: none;
          background: #7c6af7; color: #fff; font-size: 14px; font-weight: 600;
          cursor: pointer; transition: background 0.15s;
        }
        .btn-save:hover:not(:disabled) { background: #6c58f0; }
        .btn-save:disabled { opacity: 0.6; cursor: not-allowed; }
      `}</style>
    </Layout>
  );
}
