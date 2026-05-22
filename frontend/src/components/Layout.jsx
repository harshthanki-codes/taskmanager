import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const navItems = [
  { to: '/dashboard', label: 'My Tasks', icon: '✓', adminOnly: false },
];

const adminNavItems = [
  { to: '/admin', label: 'Overview', icon: '⬡', adminOnly: true },
  { to: '/admin/users', label: 'Users', icon: '◎', adminOnly: true },
  { to: '/admin/tasks', label: 'All Tasks', icon: '▤', adminOnly: true },
  { to: '/admin/logs', label: 'Activity Log', icon: '◈', adminOnly: true },
];

export default function Layout({ children }) {
  const { user, isAdmin, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (to) =>
    to === '/admin'
      ? location.pathname === '/admin'
      : location.pathname.startsWith(to);

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <span className="brand-mark">TM</span>
          <span className="brand-name">TaskManager</span>
        </div>

        <div className="sidebar-user">
          <div className="user-avatar">{user?.name?.[0]?.toUpperCase()}</div>
          <div className="user-info">
            <p className="user-name">{user?.name}</p>
            <span className={`role-badge role-${user?.role}`}>{user?.role}</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          <p className="nav-section-label">Workspace</p>
          {navItems.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={`nav-item ${isActive(item.to) ? 'nav-item--active' : ''}`}
            >
              <span className="nav-icon">{item.icon}</span>
              {item.label}
            </Link>
          ))}

          {isAdmin && (
            <>
              <p className="nav-section-label" style={{ marginTop: '1.5rem' }}>Administration</p>
              {adminNavItems.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`nav-item ${isActive(item.to) ? 'nav-item--active' : ''}`}
                >
                  <span className="nav-icon">{item.icon}</span>
                  {item.label}
                </Link>
              ))}
            </>
          )}
        </nav>

        <button className="logout-btn" onClick={handleLogout}>
          Sign out
        </button>
      </aside>

      <main className="main-content">{children}</main>

      <style>{`
        .layout {
          display: flex;
          min-height: 100vh;
          background: #f8f7f4;
          font-family: 'DM Sans', system-ui, sans-serif;
        }

        .sidebar {
          width: 240px;
          min-height: 100vh;
          background: #1a1a2e;
          display: flex;
          flex-direction: column;
          padding: 1.5rem 1rem;
          position: fixed;
          top: 0; left: 0; bottom: 0;
          z-index: 50;
        }

        .sidebar-brand {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          margin-bottom: 2rem;
          padding: 0 0.5rem;
        }

        .brand-mark {
          width: 34px; height: 34px;
          background: #7c6af7;
          border-radius: 8px;
          display: flex; align-items: center; justify-content: center;
          font-size: 13px; font-weight: 700; color: #fff;
          flex-shrink: 0;
        }

        .brand-name {
          font-size: 15px; font-weight: 600; color: #fff;
        }

        .sidebar-user {
          display: flex; align-items: center; gap: 0.75rem;
          padding: 0.75rem;
          background: rgba(255,255,255,0.06);
          border-radius: 10px;
          margin-bottom: 1.5rem;
        }

        .user-avatar {
          width: 34px; height: 34px;
          background: #7c6af7;
          border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          font-size: 14px; font-weight: 600; color: #fff;
          flex-shrink: 0;
        }

        .user-name {
          font-size: 13px; color: #e2e0ff; font-weight: 500; margin: 0;
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }

        .role-badge {
          font-size: 10px; font-weight: 600; text-transform: uppercase;
          letter-spacing: 0.05em; padding: 2px 6px;
          border-radius: 4px;
        }

        .role-badge.role-admin { background: #7c6af720; color: #a89ff8; }
        .role-badge.role-user  { background: #2dd4bf20; color: #5eead4; }

        .nav-section-label {
          font-size: 10px; text-transform: uppercase; letter-spacing: 0.08em;
          color: #ffffff40; margin: 0 0 0.5rem 0.5rem; padding: 0;
        }

        .nav-item {
          display: flex; align-items: center; gap: 0.6rem;
          padding: 0.6rem 0.75rem;
          border-radius: 8px;
          color: #9491b4;
          text-decoration: none;
          font-size: 14px;
          transition: all 0.15s;
          margin-bottom: 2px;
        }

        .nav-item:hover { background: rgba(255,255,255,0.06); color: #e2e0ff; }
        .nav-item--active { background: #7c6af720; color: #c4bcff; }

        .nav-icon { font-size: 14px; opacity: 0.7; }

        .logout-btn {
          margin-top: auto;
          padding: 0.6rem 0.75rem;
          background: transparent;
          border: 1px solid rgba(255,255,255,0.12);
          border-radius: 8px;
          color: #9491b4;
          font-size: 13px;
          cursor: pointer;
          transition: all 0.15s;
          text-align: left;
        }

        .logout-btn:hover {
          background: rgba(255,255,255,0.06);
          color: #e2e0ff;
          border-color: rgba(255,255,255,0.2);
        }

        .main-content {
          flex: 1;
          margin-left: 240px;
          padding: 2rem;
          max-width: 100%;
          overflow-x: hidden;
        }

        @media (max-width: 768px) {
          .sidebar { transform: translateX(-100%); }
          .main-content { margin-left: 0; padding: 1rem; }
        }
      `}</style>
    </div>
  );
}
