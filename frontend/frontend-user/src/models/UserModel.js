class UserModel {
  constructor(data = {}) {
    this.username = data.username || '';
    this.email = data.email || '';
    this.password = data.password || ''; // Rarely stored on client, but required by instructions
    this.role = data.role || 'user';
    this.token = data.token || null;
  }

  // Future API response mapping
  static fromApiResponse(response) {
    return new UserModel({
      username: response.user?.fullName || response.user?.username || '',
      email: response.user?.email || '',
      role: response.user?.role || 'user',
      token: response.token || null
    });
  }

  // Validations
  static validateLogin(email, password) {
    const errors = {};
    if (!email) {
      errors.email = 'Email không được để trống';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      errors.email = 'Email không hợp lệ';
    }
    
    if (!password) {
      errors.password = 'Mật khẩu không được để trống';
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  }

  static validateRegister(formData) {
    const errors = {};
    if (!formData.fullName) {
      errors.fullName = 'Họ tên không được để trống';
    }

    if (!formData.email) {
      errors.email = 'Email không được để trống';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Email không hợp lệ';
    }

    if (!formData.password) {
      errors.password = 'Mật khẩu không được để trống';
    } else if (formData.password.length < 6) {
      errors.password = 'Mật khẩu phải có ít nhất 6 ký tự';
    }

    if (!formData.confirmPassword) {
      errors.confirmPassword = 'Xác nhận mật khẩu không được để trống';
    } else if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Mật khẩu không khớp';
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  }
}

export { UserModel };
