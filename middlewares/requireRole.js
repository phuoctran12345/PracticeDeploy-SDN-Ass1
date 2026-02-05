/**
 * Phân quyền theo role (session).
 * Ví dụ: requireRole('owner', 'admin') → chỉ owner hoặc admin mới vào được.
 * Nếu không đủ quyền → redirect về / và hiện thông báo.
 */
function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.session || !req.session.user) {
      return res.redirect('/login?redirect=' + encodeURIComponent(req.originalUrl || '/'));
    }
    const role = req.session.user.role;
    if (allowedRoles.includes(role)) return next();
    res.redirect('/?err=forbidden');
  };
}

module.exports = requireRole;
