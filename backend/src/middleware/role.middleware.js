/**
 * Generates a middleware that restricts access to users with the specified role(s).
 * Must be used after `verifyToken`, which populates `req.user`.
 *
 * Usage:
 *   router.get('/admin/users', verifyToken, requireRole('admin'), handler)
 *   router.get('/report', verifyToken, requireRole('admin', 'manager'), handler)
 */
const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        message: 'You do not have permission to access this resource',
      });
    }

    next();
  };
};

// Convenience shorthand used throughout admin routes
const requireAdmin = requireRole('admin');

module.exports = { requireRole, requireAdmin };
