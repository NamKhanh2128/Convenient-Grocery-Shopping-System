import pool from '../config/database.js';

class UserModel {
  validateLogin(email, password) {
    const errors = {};
    if (!email) errors.email = 'Email không được để trống';
    else if (!/\S+@\S+\.\S+/.test(email)) errors.email = 'Email không hợp lệ';
    if (!password) errors.password = 'Mật khẩu không được để trống';
    else if (password.length < 6) errors.password = 'Mật khẩu tối thiểu 6 ký tự';
    return { isValid: Object.keys(errors).length === 0, errors };
  }

  validateRegister(userData) {
    const errors = {};
    if (!userData.fullName) errors.fullName = 'Họ tên không được để trống';
    if (!userData.email) errors.email = 'Email không được để trống';
    else if (!/\S+@\S+\.\S+/.test(userData.email)) errors.email = 'Email không hợp lệ';
    if (!userData.password) errors.password = 'Mật khẩu không được để trống';
    else if (userData.password.length < 6) errors.password = 'Mật khẩu tối thiểu 6 ký tự';
    if (userData.password !== userData.confirmPassword) {
      errors.confirmPassword = 'Mật khẩu xác nhận không khớp';
    }
    return { isValid: Object.keys(errors).length === 0, errors };
  }

  async findByEmail(email) {
    const { rows } = await pool.query(
      `SELECT id, email, password_hash, full_name, phone, role, is_locked
       FROM users WHERE email = $1 LIMIT 1`,
      [email]
    );
    return rows[0] || null;
  }

  async create({ fullName, email, passwordHash, phone, role = 'user' }) {
    const { rows } = await pool.query(
      `INSERT INTO users (full_name, email, password_hash, phone, role)
       VALUES ($1, $2, $3, $4, $5) RETURNING id`,
      [fullName, email, passwordHash, phone || null, role]
    );
    return rows[0].id;
  }
}

export default new UserModel();
