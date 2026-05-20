import jwt from 'jsonwebtoken';
import User from '../modules/auth/models/User.js';

// Protect routes
export const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Get user from the token
      req.user = await User.findById(decoded.id).select('-password');

      if (!req.user) {
        return res.status(401).json({ success: false, message: 'Not authorized, user not found' });
      }

      // Check if user is active
      if (req.user.isActive === false) {
        return res.status(401).json({ success: false, message: 'Not authorized, account is deactivated' });
      }

      return next();
    } catch (error) {
      console.error(error);
      return res.status(401).json({ success: false, message: 'Not authorized, token failed' });
    }
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'Not authorized, no token' });
  }
};

// Grant access to specific roles
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return res.status(401).json({ success: false, message: 'Not authorized, no user role' });
    }

    const lowercaseRoles = roles.map(r => r.toLowerCase());
    const userRole = req.user.role.toLowerCase();

    if (!lowercaseRoles.includes(userRole)) {
      return res.status(403).json({ 
        success: false, 
        message: `User role ${req.user.role} is not authorized to access this route` 
      });
    }
    next();
  };
};

/** Admin or employee with manager position */
export const authorizeManager = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Not authorized' });
  }
  if (req.user.role === 'admin') {
    return next();
  }
  if (req.user.role === 'employee' && req.user.employeeType === 'manager') {
    return next();
  }
  return res.status(403).json({
    success: false,
    message: 'Manager or admin access required',
  });
};
