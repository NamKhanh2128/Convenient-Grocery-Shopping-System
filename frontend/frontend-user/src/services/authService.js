class AuthService {
  async login(credentials) {
    try {
      // Mock implementation — no real backend call yet.
      return new Promise((resolve, reject) => {
        setTimeout(() => {
          const { email, password } = credentials;
          if (email && password === '123456') {
            const mockResponse = {
              user: { email, fullName: 'Mock User', role: 'user' },
              token: 'mock-jwt-token-123'
            };
            localStorage.setItem('token', mockResponse.token);
            resolve(mockResponse);
          } else {
            reject({ response: { data: { message: 'Email hoặc mật khẩu không chính xác. (Gợi ý: Mật khẩu là 123456)' } } });
          }
        }, 500);
      });
    } catch (error) {
      throw error;
    }
  }

  async register(userData) {
    try {
      // Mock implementation — no real backend call yet.
      return new Promise((resolve) => {
        setTimeout(() => {
          const mockResponse = {
            user: { email: userData.email, fullName: userData.fullName, role: 'user' },
            token: 'mock-jwt-token-new'
          };
          localStorage.setItem('token', mockResponse.token);
          resolve(mockResponse);
        }, 500);
      });
    } catch (error) {
      throw error;
    }
  }

  async logout() {
    try {
      localStorage.removeItem('token');
    } catch (error) {
      console.error('Logout failed', error);
    }
  }
}

export const authService = new AuthService();
