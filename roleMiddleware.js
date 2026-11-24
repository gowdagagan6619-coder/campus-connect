/**
 * Role-Based Access Control (RBAC) Guard:
 * Ensures the authenticated user possesses one of the allowed roles.
 * Must be executed after protect middleware.
 * @param  {...string} roles - e.g., 'admin', 'student'
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required prior to role verification.',
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: Access restricted. Requires role '${roles.join(' or ')}', but your role is '${req.user.role}'.`,
      });
    }

    next();
  };
};

module.exports = { authorize };
