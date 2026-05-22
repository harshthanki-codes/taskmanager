# TaskManager — Role-Based Access Control

A production-ready full-stack task management system with role-based access control, admin dashboard, and activity audit logging.

**Stack:** React 18 · Vite · Node.js · Express · MongoDB · Mongoose · JWT

---

## Features

### Authentication & Authorization
- JWT-based session management with 7-day expiry
- Role enum: `admin` | `user` — first registered user auto-promotes to admin
- Inactive accounts blocked at middleware level
- Route guards on both frontend and backend

### User (role: user)
- Create, view, update, delete own tasks
- Filter tasks by status and priority
- Paginated task list

### Admin (role: admin)
- Full user management: search, filter, activate/deactivate, delete
- Delete cascades to owned tasks
- Monitor all tasks across users with filters
- Real-time analytics: user counts, task distribution, completion rate
- Paginated activity audit log (login, task CRUD, user management events)

---

## Project Structure

```
├── backend/
│   ├── src/
│   │   ├── controllers/       # Route handlers
│   │   ├── middleware/        # auth.middleware.js, role.middleware.js
│   │   ├── models/            # User, Task, ActivityLog schemas
│   │   ├── routes/            # auth, task, admin route groups
│   │   ├── services/          # activityLog.service.js
│   │   └── app.js
│   ├── Dockerfile
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── guards/        # ProtectedRoute, AdminRoute
│   │   │   ├── Layout.jsx     # Role-aware sidebar nav
│   │   │   └── StatCard.jsx
│   │   ├── contexts/          # AuthContext (session + role)
│   │   ├── lib/               # Axios client with JWT interceptor
│   │   └── pages/
│   │       ├── admin/         # Overview, Users, Tasks, Logs
│   │       ├── Dashboard.jsx  # User task CRUD
│   │       ├── Login.jsx
│   │       └── Register.jsx
│   ├── Dockerfile
│   └── vite.config.js
│
├── docker-compose.yml
└── .github/workflows/ci.yml
```

---

## API Reference

### Auth
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/register` | — | Register new user |
| POST | `/api/auth/login` | — | Login, returns JWT |
| GET | `/api/auth/me` | JWT | Current user profile |

### Tasks (user-scoped)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/tasks` | JWT | Own tasks (paginated, filterable) |
| POST | `/api/tasks` | JWT | Create task |
| PATCH | `/api/tasks/:id` | JWT | Update own task |
| DELETE | `/api/tasks/:id` | JWT | Delete own task |

### Admin
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/admin/analytics` | Admin | Platform metrics |
| GET | `/api/admin/users` | Admin | All users (search, filter) |
| PATCH | `/api/admin/users/:id/status` | Admin | Toggle active/inactive |
| DELETE | `/api/admin/users/:id` | Admin | Delete user + tasks |
| GET | `/api/admin/tasks` | Admin | All tasks (filter by user/status) |
| DELETE | `/api/admin/tasks/:id` | Admin | Delete any task |
| GET | `/api/admin/logs` | Admin | Activity audit log |

---

## Local Development

### Prerequisites
- Node.js 20+
- MongoDB 7+ (local or Atlas)

### Backend
```bash
cd backend
cp .env.example .env        # fill in MONGO_URI and JWT_SECRET
npm install
npm run dev                 # http://localhost:5000
```

### Frontend
```bash
cd frontend
npm install
npm run dev                 # http://localhost:5173
```

### Run tests
```bash
cd backend && npm test
```

---

## Docker (Full Stack)

```bash
# From repo root
docker compose up --build

# Frontend: http://localhost
# Backend:  http://localhost:5000
```

Set `JWT_SECRET` in your environment or a `.env` file at repo root before deploying.

---

## Git Workflow

This feature was developed on `feature/rbac-admin-dashboard`:

```bash
git checkout -b feature/rbac-admin-dashboard
# ... commits ...
git push -u origin feature/rbac-admin-dashboard
# Open PR → review → merge to main
```

CI runs automatically on push and PR via `.github/workflows/ci.yml`.

---

## Design Decisions

**First-user-becomes-admin** avoids needing a separate seed script for initial setup. Change this to a fixed email check or environment-variable flag for production.

**Capped ActivityLog collection** (10k entries) means no manual cleanup. Adjust the cap in `activityLog.model.js` based on retention requirements.

**Cascade delete on user removal** keeps the database consistent without orphaned task documents. In a production system with soft-deletes, you'd archive instead.

**`requireRole` factory** (not a hardcoded `requireAdmin` check) means adding `manager` or `moderator` roles in the future requires zero middleware changes — just pass the role name.
