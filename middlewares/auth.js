const jwt = require('jsonwebtoken');
const User = require('../models/user');

const JWT_SECRET = process.env.JWT_SECRET || 'autorent-pro-secret-change-in-production';

/**
 * Middleware: xác thực JWT, gắn req.user = { id, role }
 * Header: Authorization: Bearer <token>
 */
const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
    if (!token) {
      return res.status(401).json({
        error: { message: 'Unauthorized: Thiếu token', code: 'AUTH_REQUIRED' },
      });
    }
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.userId).select('_id name email role status');
    if (!user || user.status !== 'active') {
      return res.status(401).json({
        error: { message: 'Token không hợp lệ hoặc tài khoản bị vô hiệu hóa', code: 'AUTH_INVALID' },
      });
    }
    req.user = { id: user._id.toString(), role: user.role, doc: user };
    next();
  } catch (err) {
    if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: { message: 'Token không hợp lệ hoặc hết hạn', code: 'AUTH_INVALID' },
      });
    }
    return res.status(500).json({ message: err.message });
  }
};

module.exports = authMiddleware;
