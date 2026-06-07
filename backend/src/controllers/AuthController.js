import { authService } from '../services/authService.js';

function send(res, result) {
  return res.status(result.status).json(result.body);
}

export const authController = {
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
};
