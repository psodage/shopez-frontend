const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * JWT verification middleware.
 * Validates token and attaches authenticated user to req.user.
 * Returns 401 for: missing token, invalid token, expired token, or deleted user.
 */
exports.protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        message: 'Not authorized. Token missing.',
        code: 'TOKEN_MISSING',
      });
    }

    const token = authHeader.split(' ')[1];

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.sub).select('-password');
      if (!req.user) {
        return res.status(401).json({
          message: 'User no longer exists.',
          code: 'USER_NOT_FOUND',
        });
      }
      return next();
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({
          message: 'Session expired. Please log in again.',
          code: 'TOKEN_EXPIRED',
        });
      }
      if (err.name === 'JsonWebTokenError') {
        return res.status(401).json({
          message: 'Not authorized. Invalid token.',
          code: 'TOKEN_INVALID',
        });
      }
      return res.status(401).json({
        message: 'Not authorized.',
        code: 'UNAUTHORIZED',
      });
    }
  } catch (err) {
    return next(err);
  }
};

/**
 * Require the authenticated user to have role 'admin'.
 * Must be used after protect. Returns 403 if user is not admin.
 */
exports.requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({
      message: 'Admin access required.',
      code: 'FORBIDDEN_ADMIN',
    });
  }
  return next();
};

/**
 * Require the authenticated user to have role 'user' (non-admin).
 * Must be used after protect. Returns 403 if user is admin.
 */
exports.requireUser = (req, res, next) => {
  if (!req.user || req.user.role !== 'user') {
    return res.status(403).json({
      message: 'User access required. Admin accounts cannot access this resource.',
      code: 'FORBIDDEN_USER',
    });
  }
  return next();
};

