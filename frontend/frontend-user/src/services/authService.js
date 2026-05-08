// Future configuration:
// import axios from 'axios';
// const API_BASE_URL = 'https://api.example.com/v1';
//
// Axios interceptors placeholder:
// axios.interceptors.request.use(config => {
//   const token = localStorage.getItem('token');
//   if (token) config.headers.Authorization = `Bearer ${token}`;
//   return config;
// });
//
// Refresh token placeholder:
// axios.interceptors.response.use(response => response, async error => {
//   // handle 401 and refresh token logic here
// });

class AuthService {
  async login(credentials) {
    try {
      // Future real API call:
      // const response = await axios.post(`${API_BASE_URL}/auth/login`, credentials);
      // return response.data;

      // Temporary mock implementation
      return new Promise((resolve, reject) => {
        setTimeout(() => {
          const { email, password } = credentials;
          // Simple mock check
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
      // Future real API call:
      // const response = await axios.post(`${API_BASE_URL}/auth/register`, userData);
      // return response.data;

      // Temporary mock implementation
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
      // Future API call if token revocation is needed on backend:
      // await axios.post(`${API_BASE_URL}/auth/logout`);
      
      localStorage.removeItem('token');
      // Additional cleanup like sessionStorage or clear Redux store
    } catch (error) {
      console.error('Logout failed', error);
    }
  }
}

export const authService = new AuthService();
