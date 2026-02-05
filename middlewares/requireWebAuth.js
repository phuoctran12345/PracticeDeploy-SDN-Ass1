/**
 * Middleware cho view (EJS): bắt buộc đăng nhập (session).
 * Nếu chưa đăng nhập → redirect /login?redirect=URL_hiện_tại
 */
function requireWebAuth(req, res, next) {
  if (req.session && req.session.user) return next();
  const redirect = encodeURIComponent(req.originalUrl || '/');
  res.redirect('/login?redirect=' + redirect);
}

module.exports = requireWebAuth;
