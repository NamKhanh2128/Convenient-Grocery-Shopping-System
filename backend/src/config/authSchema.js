function identifier(value, fallback) {
  const next = value || fallback;
  if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(next)) {
    throw new Error(`Invalid database identifier: ${next}`);
  }
  return next;
}

export const authSchema = {
  user: {
    table: identifier(process.env.AUTH_USER_TABLE, 'users'),
    id: identifier(process.env.AUTH_USER_ID_COLUMN, 'id'),
    fullName: identifier(process.env.AUTH_USER_FULL_NAME_COLUMN, 'full_name'),
    email: identifier(process.env.AUTH_USER_EMAIL_COLUMN, 'email'),
    password: identifier(process.env.AUTH_USER_PASSWORD_COLUMN, 'password_hash'),
    role: identifier(process.env.AUTH_USER_ROLE_COLUMN, 'role'),
  },
};
