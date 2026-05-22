const { Router } = require('express');
const { createTask, getMyTasks, updateTask, deleteTask } = require('../controllers/task.controller');
const { verifyToken } = require('../middleware/auth.middleware');

const router = Router();

// All task routes require authentication
router.use(verifyToken);

router.post('/', createTask);
router.get('/', getMyTasks);
router.patch('/:id', updateTask);
router.delete('/:id', deleteTask);

module.exports = router;
