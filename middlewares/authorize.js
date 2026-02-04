/**
 * Middleware: phân quyền theo role
 * authorize('admin') hoặc authorize('owner', 'admin')
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: { message: 'Unauthorized', code: 'AUTH_REQUIRED' },
      });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        error: { message: 'Bạn không có quyền thực hiện thao tác này', code: 'FORBIDDEN', role: req.user.role },
      });
    }
    next();
  };
};

module.exports = authorize;
