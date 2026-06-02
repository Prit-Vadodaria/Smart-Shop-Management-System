export const isManagerOrAdmin = (user) => {
  if (!user) return false;
  const role = String(user.role || '').toLowerCase();
  return role === 'admin' || (role === 'employee' && String(user.employeeType || '').toLowerCase() === 'manager');
};

