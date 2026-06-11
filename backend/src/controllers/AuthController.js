const { authService } = require('../services/authService');

function send(res, result) {
  return res.status(result.status).json(result.body);
}

const authController = {
  async register(req, res) {
    try {
      return send(res, await authService.register(req.body || {}));
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  },

  async login(req, res) {
    try {
      return send(res, await authService.login(req.body || {}));
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  },

  async loginWithGoogle(req, res) {
    try {
      const { supabaseAccessToken } = req.body || {};
      return send(res, await authService.loginWithGoogle({ supabaseAccessToken }));
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  },

  async refresh(req, res) {
    try {
      return send(res, await authService.refresh(req.body?.refreshToken));
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  },

  async me(req, res) {
    try {
      return send(res, await authService.me(req.user.user_id));
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  },

  async logout(req, res) {
    try {
      return send(res, await authService.logout(req.body?.refreshToken));
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  },

  async forgotPassword(req, res) {
    try {
      return send(res, await authService.forgotPassword(req.body || {}));
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  },

  async resetPassword(req, res) {
    try {
      return send(res, await authService.resetPassword(req.body || {}));
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  },

  async changePassword(req, res) {
    try {
      const { oldPassword, newPassword } = req.body || {};
      return send(res, await authService.changePassword({ userId: req.user.user_id, oldPassword, newPassword }));
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  },

  async updateProfile(req, res) {
    try {
      return send(res, await authService.updateProfile(req.user.user_id, req.body || {}));
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  },
};

module.exports = { authController };
