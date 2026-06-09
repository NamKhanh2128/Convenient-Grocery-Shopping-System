function identifier(value, fallback) {
  const next = value || fallback;
  if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(next)) {
    throw new Error(`Invalid database identifier: ${next}`);
  }
  return next;
}

const familySchema = {
  family: {
    table: identifier(process.env.FAMILY_TABLE, 'family_groups'),
    id: identifier(process.env.FAMILY_ID_COLUMN, 'id'),
    name: identifier(process.env.FAMILY_NAME_COLUMN, 'name'),
    createdBy: identifier(process.env.FAMILY_CREATED_BY_COLUMN, 'created_by'),
    code: identifier(process.env.FAMILY_CODE_COLUMN, 'code'),
    createdAt: identifier(process.env.FAMILY_CREATED_AT_COLUMN, 'created_at'),
    updatedAt: identifier(process.env.FAMILY_UPDATED_AT_COLUMN, 'updated_at'),
  },
  user: {
    table: identifier(process.env.USER_TABLE, 'users'),
    id: identifier(process.env.USER_ID_COLUMN, 'id'),
    fullName: identifier(process.env.USER_FULL_NAME_COLUMN, 'full_name'),
    email: identifier(process.env.USER_EMAIL_COLUMN, 'email'),
    password: identifier(process.env.USER_PASSWORD_COLUMN, 'password_hash'),
    role: identifier(process.env.USER_ROLE_COLUMN, 'role'),
  },
  member: {
    table: identifier(process.env.MEMBER_TABLE, 'group_members'),
    id: identifier(process.env.MEMBER_ID_COLUMN, 'id'),
    familyId: identifier(process.env.MEMBER_FAMILY_ID_COLUMN, 'group_id'),
    userId: identifier(process.env.MEMBER_USER_ID_COLUMN, 'user_id'),
    role: identifier(process.env.MEMBER_ROLE_COLUMN, 'role'),
    joinedAt: identifier(process.env.MEMBER_JOINED_AT_COLUMN, 'joined_at'),
  },
  shoppingList: {
    table: identifier(process.env.SHOPPING_LIST_TABLE, 'shopping_lists'),
    id: identifier(process.env.SHOPPING_LIST_ID_COLUMN, 'id'),
    familyId: identifier(process.env.SHOPPING_LIST_GROUP_ID_COLUMN, 'group_id'),
    userId: identifier(process.env.SHOPPING_LIST_USER_ID_COLUMN, 'user_id'),
    assignedUserId: identifier(process.env.SHOPPING_LIST_ASSIGNED_USER_ID_COLUMN, 'assigned_user_id'),
    name: identifier(process.env.SHOPPING_LIST_NAME_COLUMN, 'name'),
    status: identifier(process.env.SHOPPING_LIST_STATUS_COLUMN, 'status'),
  },
};

module.exports = { familySchema };
