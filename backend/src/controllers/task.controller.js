const Task = require('../models/task.model.js');
const { log } = require('../services/activityLog.service.js');

const createTask = async (req, res) => {
  try {
    const { title, description, priority, dueDate } = req.body;

    const task = await Task.create({
      title,
      description,
      priority,
      dueDate,
      owner: req.user._id,
    });

    await log({
      userId: req.user._id,
      action: 'task_created',
      detail: `Created task: "${title}"`,
      resourceId: task._id,
      resourceType: 'task',
      req,
    });

    res.status(201).json({ task });
  } catch (err) {
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map((e) => e.message);
      return res.status(400).json({ message: messages.join(', ') });
    }
    console.error('[Task] createTask error:', err);
    res.status(500).json({ message: 'Failed to create task' });
  }
};

const getMyTasks = async (req, res) => {
  try {
    const { status, priority, page = 1, limit = 20 } = req.query;
    const filter = { owner: req.user._id };

    if (status) filter.status = status;
    if (priority) filter.priority = priority;

    const skip = (Number(page) - 1) * Number(limit);
    const [tasks, total] = await Promise.all([
      Task.find(filter).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
      Task.countDocuments(filter),
    ]);

    res.json({ tasks, total, page: Number(page), pages: Math.ceil(total / limit) });
  } catch (err) {
    console.error('[Task] getMyTasks error:', err);
    res.status(500).json({ message: 'Failed to fetch tasks' });
  }
};

const updateTask = async (req, res) => {
  try {
    const task = await Task.findOne({ _id: req.params.id, owner: req.user._id });
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    const allowed = ['title', 'description', 'status', 'priority', 'dueDate'];
    allowed.forEach((field) => {
      if (req.body[field] !== undefined) task[field] = req.body[field];
    });

    await task.save();

    await log({
      userId: req.user._id,
      action: 'task_updated',
      detail: `Updated task: "${task.title}"`,
      resourceId: task._id,
      resourceType: 'task',
      req,
    });

    res.json({ task });
  } catch (err) {
    console.error('[Task] updateTask error:', err);
    res.status(500).json({ message: 'Failed to update task' });
  }
};

const deleteTask = async (req, res) => {
  try {
    const task = await Task.findOneAndDelete({ _id: req.params.id, owner: req.user._id });
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    await log({
      userId: req.user._id,
      action: 'task_deleted',
      detail: `Deleted task: "${task.title}"`,
      resourceId: task._id,
      resourceType: 'task',
      req,
    });

    res.json({ message: 'Task deleted successfully' });
  } catch (err) {
    console.error('[Task] deleteTask error:', err);
    res.status(500).json({ message: 'Failed to delete task' });
  }
};

module.exports = { createTask, getMyTasks, updateTask, deleteTask };

