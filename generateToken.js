const jwt = require('jsonwebtoken');

/**
 * Generate a cryptographically signed JWT token containing user id and role
 * @param {string} userId - User's MongoDB ObjectId
 * @param {string} role - 'student' or 'admin'
 * @returns {string} Signed JWT token string
 */
const generateToken = (userId, role) => {
  return jwt.sign(
    { id: userId, role },
    process.env.JWT_SECRET || 'super_secret_campus_connect_jwt_key_2025_secure_string_987654321',
    {
      expiresIn: process.env.JWT_EXPIRE || '7d',
    }
  );
};

module.exports = generateToken;
