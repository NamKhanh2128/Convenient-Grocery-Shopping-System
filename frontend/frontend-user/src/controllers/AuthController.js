import { authService } from '../services/authService';
import { UserModel } from '../models/UserModel';

class AuthControllerClass {
  async handleLogin(credentials, onSuccess, onError) {
    try {
      const response = await authService.login(credentials);
      const user = UserModel.fromApiResponse(response);
      
      // Additional state management could go here
      // e.g., dispatching to Redux or React Context
      
      if (onSuccess) onSuccess(user);
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Đã xảy ra lỗi khi đăng nhập. Vui lòng thử lại sau.';
      if (onError) onError({ _form: errorMessage });
    }
  }

  async handleRegister(userData, onSuccess, onError) {
    try {
      const response = await authService.register(userData);
      const user = UserModel.fromApiResponse(response);
      
      // Additional state management could go here
      
      if (onSuccess) onSuccess(user);
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Đã xảy ra lỗi khi đăng ký. Vui lòng thử lại sau.';
      if (onError) onError({ _form: errorMessage });
    }
  }

  async handleLogout(onSuccess) {
    await authService.logout();
    if (onSuccess) onSuccess();
  }
}

export const AuthController = new AuthControllerClass();
