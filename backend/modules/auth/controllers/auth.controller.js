import jwt from 'jsonwebtoken';
import User from '../models/User.js';

// Generate token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '30d',
  });
};

const formatAuthUser = (user) => {
  const payload = {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
  };
  if (user.role === 'employee') {
    payload.employeeType = user.employeeType || 'staff';
  }
  return payload;
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
export const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    // Check if user exists
    const userExists = await User.findOne({ email });

    if (userExists) {
      return res.status(400).json({ success: false, message: 'User already exists' });
    }

    // Create user - role is strictly forced to 'customer'
    const user = await User.create({
      name,
      email,
      password,
      role: 'customer',
      isActive: true
    });

    res.status(201).json({
      success: true,
      token: generateToken(user._id),
      user: formatAuthUser(user),
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Authenticate user & get token
// @route   POST /api/auth/login
// @access  Public
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Validate email & password
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide an email and password' });
    }

    // Check for user
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    // Check if user is active
    if (user.isActive === false) {
      return res.status(401).json({ success: false, message: 'Your account is deactivated. Please contact your administrator.' });
    }

    // Check if password matches
    const isMatch = await user.matchPassword(password);

    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    res.status(200).json({
      success: true,
      token: generateToken(user._id),
      user: formatAuthUser(user),
    });

  } catch (error) {
    next(error);
  }
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
export const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    
    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all staff members
// @route   GET /api/auth/staff
// @access  Private/Admin/Manager
export const getStaff = async (req, res, next) => {
  try {
    // Return all users with role 'employee'
    const staff = await User.find({ role: 'employee', employeeType: 'staff' }).select('name email role employeeType isActive');
    res.status(200).json({
      success: true,
      data: staff
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a new employee (Admin Only)
// @route   POST /api/auth/employees
// @access  Private/Admin
export const createEmployee = async (req, res, next) => {
  try {
    const { name, email, password, employeeType = 'staff' } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide name, email, and password.' });
    }

    if (!['manager', 'staff'].includes(employeeType)) {
      return res.status(400).json({ success: false, message: 'Position must be manager or staff.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters.' });
    }

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ success: false, message: 'User already exists' });
    }

    const user = await User.create({
      name,
      email,
      password,
      role: 'employee',
      employeeType,
      isActive: true,
    });

    res.status(201).json({
      success: true,
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        employeeType: user.employeeType,
        isActive: user.isActive,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all employees/internal staff (Admin Only)
// @route   GET /api/auth/employees
// @access  Private/Admin
export const getEmployees = async (req, res, next) => {
  try {
    const employees = await User.find({ role: 'employee' }).select('name email role employeeType isActive');
    res.status(200).json({
      success: true,
      data: employees
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Reset employee password (Admin Only)
// @route   PUT /api/auth/employees/:id/reset-password
// @access  Private/Admin
export const resetEmployeePassword = async (req, res, next) => {
  try {
    const { newPassword } = req.body;
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'Please provide a valid password of at least 6 characters.' });
    }

    const employee = await User.findById(req.params.id);
    if (!employee || employee.role !== 'employee') {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }

    employee.password = newPassword;
    await employee.save();

    res.status(200).json({ success: true, message: 'Employee password reset successfully!' });
  } catch (error) {
    next(error);
  }
};

// @desc    Deactivate/Activate employee (Admin Only)
// @route   PUT /api/auth/employees/:id/status
// @access  Private/Admin
export const updateEmployeeStatus = async (req, res, next) => {
  try {
    const { isActive } = req.body;
    if (typeof isActive !== 'boolean') {
      return res.status(400).json({ success: false, message: 'isActive must be a boolean.' });
    }

    const employee = await User.findById(req.params.id);
    if (!employee || employee.role !== 'employee') {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }

    // Prevent admin from deactivating themselves
    if (employee._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: 'You cannot deactivate your own account.' });
    }

    employee.isActive = isActive;
    await employee.save();

    res.status(200).json({ 
      success: true, 
      message: `Employee account status updated successfully to: ${isActive ? 'Active' : 'Inactive'}`,
      data: {
        id: employee._id,
        isActive: employee.isActive
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update employee position (manager / staff)
// @route   PUT /api/auth/employees/:id/position
// @access  Private/Admin
export const updateEmployeePosition = async (req, res, next) => {
  try {
    const { employeeType } = req.body;
    if (!['manager', 'staff'].includes(employeeType)) {
      return res.status(400).json({ success: false, message: 'Position must be manager or staff.' });
    }

    const employee = await User.findById(req.params.id);
    if (!employee || employee.role !== 'employee') {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }

    employee.employeeType = employeeType;
    await employee.save();

    res.status(200).json({
      success: true,
      message: 'Employee position updated',
      data: {
        id: employee._id,
        employeeType: employee.employeeType,
      },
    });
  } catch (error) {
    next(error);
  }
};
