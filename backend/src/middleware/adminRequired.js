/**
 * adminRequired middleware
 * Requires the request to be authenticated AND the user to have ADMIN role.
 * Must be applied AFTER authRequired (which populates req.user).
 */
function adminRequired(req, res, next) {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Chưa đăng nhập hoặc phiên đã hết hạn.',
    });
  }

  const role = (req.user.role || '').toUpperCase();

  if (role !== 'ADMIN') {
    return res.status(403).json({
      success: false,
      message: 'Quyền truy cập bị từ chối. Yêu cầu quyền quản trị viên.',
    });
  }

  next();
}

module.exports = { adminRequired };
