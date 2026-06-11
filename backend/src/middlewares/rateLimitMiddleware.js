/**
 * Phase 4 – Security Hardening
 * Rate limiters for sensitive auth and invitation endpoints.
 *
 * Limits are deliberately more relaxed in non-production environments so that
 * development workflows are not disrupted.
 */

const rateLimit = require('express-rate-limit');

const IS_PROD = process.env.NODE_ENV === 'production';

function createLimiter({ windowMs, max, message, skipNonProd = false }) {
  if (skipNonProd && !IS_PROD) {
    // Return a passthrough middleware in dev/test
    return (_req, _res, next) => next();
  }

  return rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, data: null, message },
  });
}

/**
 * Login / register: 10 attempts per 15 minutes per IP.
 */
const authLimiter = createLimiter({
  windowMs: 15 * 60 * 1000,
  max: IS_PROD ? 10 : 100,
  message: 'Quá nhiều yêu cầu đăng nhập. Vui lòng thử lại sau 15 phút.',
});

/**
 * Forgot password: 5 attempts per hour per IP to prevent enumeration.
 */
const forgotPasswordLimiter = createLimiter({
  windowMs: 60 * 60 * 1000,
  max: IS_PROD ? 5 : 50,
  message: 'Quá nhiều yêu cầu đặt lại mật khẩu. Vui lòng thử lại sau 1 giờ.',
});

/**
 * Invitation sending: 20 invitations per hour per IP.
 */
const invitationLimiter = createLimiter({
  windowMs: 60 * 60 * 1000,
  max: IS_PROD ? 20 : 200,
  message: 'Quá nhiều lời mời được gửi. Vui lòng thử lại sau 1 giờ.',
  skipNonProd: false,
});

module.exports = { authLimiter, forgotPasswordLimiter, invitationLimiter };
