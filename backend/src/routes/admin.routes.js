const { Router } = require('express');
const {
  getAllUsers,
  updateUserStatus,
  deleteUser,
  getAllTasks,
  adminDeleteTask,
  getAnalytics,
  getActivityLogs,
} = require('../controllers/admin.controller.js');
const { verifyToken } = require('../middleware/auth.middleware.js');
const { requireAdmin } = require('../middleware/role.middleware.js');

const router = Router();

// Every admin route requires a valid JWT AND admin role
router.use(verifyToken, requireAdmin);

// Analytics
router.get('/analytics', getAnalytics);

// User management
router.get('/users', getAllUsers);
router.patch('/users/:id/status', updateUserStatus);
router.delete('/users/:id', deleteUser);

// Task monitoring
router.get('/tasks', getAllTasks);
router.delete('/tasks/:id', adminDeleteTask);

// Activity logs
router.get('/logs', getActivityLogs);

module.exports = router;

