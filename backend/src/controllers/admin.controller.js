const User = require('../models/user.model.js');
const Task = require('../models/task.model.js');
const ActivityLog = require('../models/activityLog.model.js');
const { log } = require('../services/activityLog.service.js');

// ── Users ──────────────────────────────────────────────────────────────────

const getAllUsers = async (req, res) => {
  try {
    const { status, role, page = 1, limit = 20, search } = req.query;
    const filter = {};

    if (status) filter.status = status;
    if (role) filter.role = role;
    if (search) filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
    ];

    const skip = (Number(page) - 1) * Number(limit);
    const [users, total] = await Promise.all([
      User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
      User.countDocuments(filter),
    ]);

    res.json({ users, total, page: Number(page), pages: Math.ceil(total / limit) });
  } catch (err) {
    console.error('[Admin] getAllUsers error:', err);
    res.status(500).json({ message: 'Failed to fetch users' });
  }
};

const updateUserStatus = async (req, res) => {
  try {
    const { status } = req.body;

    if (!['active', 'inactive'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status value' });
    }

    // Prevent admins from deactivating themselves
    if (req.params.id === String(req.user._id)) {
      return res.status(400).json({ message: 'You cannot change your own status' });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    );

    if (!user) return res.status(404).json({ message: 'User not found' });

    await log({
      userId: req.user._id,
      action: 'user_status_changed',
      detail: `Set user "${user.email}" to ${status}`,
      resourceId: user._id,
      resourceType: 'user',
      req,
    });

    res.json({ user });
  } catch (err) {
    console.error('[Admin] updateUserStatus error:', err);
    res.status(500).json({ message: 'Failed to update user status' });
  }
};

const deleteUser = async (req, res) => {
  try {
    if (req.params.id === String(req.user._id)) {
      return res.status(400).json({ message: 'You cannot delete your own account' });
    }

    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Cascade-delete the user's tasks to keep the DB consistent
    await Task.deleteMany({ owner: req.params.id });

    await log({
      userId: req.user._id,
      action: 'user_deleted',
      detail: `Deleted user "${user.email}" and their tasks`,
      resourceId: user._id,
      resourceType: 'user',
      req,
    });

    res.json({ message: 'User and their tasks deleted successfully' });
  } catch (err) {
    console.error('[Admin] deleteUser error:', err);
    res.status(500).json({ message: 'Failed to delete user' });
  }
};

// ── Tasks ──────────────────────────────────────────────────────────────────

const getAllTasks = async (req, res) => {
  try {
    const { status, priority, userId, page = 1, limit = 20 } = req.query;
    const filter = {};

    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (userId) filter.owner = userId;

    const skip = (Number(page) - 1) * Number(limit);
    const [tasks, total] = await Promise.all([
      Task.find(filter)
        .populate('owner', 'name email role')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Task.countDocuments(filter),
    ]);

    res.json({ tasks, total, page: Number(page), pages: Math.ceil(total / limit) });
  } catch (err) {
    console.error('[Admin] getAllTasks error:', err);
    res.status(500).json({ message: 'Failed to fetch tasks' });
  }
};

const adminDeleteTask = async (req, res) => {
  try {
    const task = await Task.findByIdAndDelete(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found' });

    await log({
      userId: req.user._id,
      action: 'task_deleted',
      detail: `Admin deleted task: "${task.title}"`,
      resourceId: task._id,
      resourceType: 'task',
      req,
    });

    res.json({ message: 'Task deleted successfully' });
  } catch (err) {
    console.error('[Admin] adminDeleteTask error:', err);
    res.status(500).json({ message: 'Failed to delete task' });
  }
};

// ── Analytics ──────────────────────────────────────────────────────────────

const getAnalytics = async (req, res) => {
  try {
    const [
      totalUsers,
      activeUsers,
      totalTasks,
      completedTasks,
      pendingTasks,
      inProgressTasks,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ status: 'active' }),
      Task.countDocuments(),
      Task.countDocuments({ status: 'completed' }),
      Task.countDocuments({ status: 'pending' }),
      Task.countDocuments({ status: 'in-progress' }),
    ]);

    res.json({
      users: { total: totalUsers, active: activeUsers, inactive: totalUsers - activeUsers },
      tasks: {
        total: totalTasks,
        completed: completedTasks,
        pending: pendingTasks,
        inProgress: inProgressTasks,
      },
    });
  } catch (err) {
    console.error('[Admin] getAnalytics error:', err);
    res.status(500).json({ message: 'Failed to fetch analytics' });
  }
};

// ── Activity Logs ──────────────────────────────────────────────────────────

const getActivityLogs = async (req, res) => {
  try {
    const { userId, action, page = 1, limit = 30 } = req.query;
    const filter = {};

    if (userId) filter.user = userId;
    if (action) filter.action = action;

    const skip = (Number(page) - 1) * Number(limit);
    const [logs, total] = await Promise.all([
      ActivityLog.find(filter)
        .populate('user', 'name email role')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      ActivityLog.countDocuments(filter),
    ]);

    res.json({ logs, total, page: Number(page), pages: Math.ceil(total / limit) });
  } catch (err) {
    console.error('[Admin] getActivityLogs error:', err);
    res.status(500).json({ message: 'Failed to fetch activity logs' });
  }
};

module.exports = {
  getAllUsers,
  updateUserStatus,
  deleteUser,
  getAllTasks,
  adminDeleteTask,
  getAnalytics,
  getActivityLogs,
};

