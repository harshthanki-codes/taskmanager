const { Router } = require('express');
const { register, login, me } = require('../controllers/auth.controller.js');
const { verifyToken } = require('../middleware/auth.middleware.js');

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.get('/me', verifyToken, me);

module.exports = router;

