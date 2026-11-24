const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Mandatory Authentication Guard:
 * Intercepts request, extracts Bearer token, verifies signature,
 * and attaches full user object (excluding password) to req.user.
 */
const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || 'super_secret_campus_connect_jwt_key_2025_secure_string_987654321'
      );

      const user = await User.findById(decoded.id).select('-password');
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'User belonging to this token no longer exists.',
        });
      }

      req.user = user;
      return next();
    } catch (error) {
      console.error('[AuthMiddleware Error]', error.message);
      return res.status(401).json({
        success: false,
        message: 'Not authorized: Invalid or expired authentication token.',
      });
    }
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized: Authentication token required in Authorization header.',
    });
  }
};

/**
 * Optional Authentication Guard:
 * If Bearer token is provided, decodes and attaches req.user.
 * If not provided or invalid, proceeds without failing.
 */
const optionalAuth = async (req, res, next) => {
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      const token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || 'super_secret_campus_connect_jwt_key_2025_secure_string_987654321'
      );
      req.user = await User.findById(decoded.id).select('-password');
    } catch (error) {
      // Ignore token failure for public endpoints
      req.user = null;
    }
  }
  next();
};

module.exports = { protect, optionalAuth };
