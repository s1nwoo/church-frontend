export function isAdminUser(user) {
  const role = typeof user?.role === 'string' ? user.role : user?.role?.name || user?.role?.value;
  return role === 'ADMIN' || role === 'ROLE_ADMIN';
}
