const jwt = require('jsonwebtoken');
const User = require('../models/user.model.js');

/**
 * Validates the Bearer JWT in the Authorization header.
 * Attaches the full user document (minus password) to `req.user`.
 * Rejects inactive users before they reach any route handler.
 */
const verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id).select('+role +status');
    if (!user) {
      return res.status(401).json({ message: 'User no longer exists' });
    }

    if (user.status === 'inactive') {
      return res.status(403).json({ message: 'Account is inactive. Contact an administrator.' });
    }

    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Session expired. Please log in again.' });
    }
    return res.status(401).json({ message: 'Invalid token' });
  }
};

module.exports = { verifyToken };

