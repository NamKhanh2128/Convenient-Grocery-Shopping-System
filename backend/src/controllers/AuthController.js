import { UserModel } from '../models/UserModel';

export const AuthController = {
  handleLogin(credentials, onSuccess, onError) {
    const validation = UserModel.validateLogin(credentials.email, credentials.password);
    if (!validation.isValid) {
      onError(validation.errors);
      return;
    }
    setTimeout(() => {
      const mockUser = { email: credentials.email, name: 'Người dùng' };
      localStorage.setItem('token', 'mock-jwt-token');
      localStorage.setItem('user', JSON.stringify(mockUser));
      onSuccess(mockUser);
    }, 500);
  },

  handleLogout(navigate) {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    if (navigate) navigate('/');
  },

  isAuthenticated() {
    return !!localStorage.getItem('token');
  }
};
