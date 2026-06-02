import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import EmployeeProfile from '../models/EmployeeProfile.js';
import { assertValidPassword, PASSWORD_RULES, validatePassword } from '../../../utils/passwordValidation.js';
import { buildResetPasswordUrl, sendPasswordResetEmail } from '../../../utils/passwordResetEmail.js';
import { publishRealtimeEvent } from '../../../services/realtimeHub.js';

const JWT_EXPIRES_IN = process.env.JWT_EXPIRE || '30d';

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
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

const buildAuthResponse = (user) => {
  const token = generateToken(user._id);
  const decoded = jwt.decode(token);
  const expiresAt =
    decoded?.exp != null ? new Date(decoded.exp * 1000).toISOString() : null;

  return {
    success: true,
    token,
    expiresAt,
    expiresIn: JWT_EXPIRES_IN,
    user: formatAuthUser(user),
  };
};

// @desc    Password strength rules (for UI)
// @route   GET /api/auth/password-rules
// @access  Public
export const getPasswordRules = (req, res) => {
  res.status(200).json({
    success: true,
    rules: PASSWORD_RULES,
    hints: [
      `At least ${PASSWORD_RULES.minLength} characters`,
      'One uppercase letter (A–Z)',
      'One lowercase letter (a–z)',
      'One number (0–9)',
      'One special character (!@#$…)',
    ],
  });
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
export const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    assertValidPassword(password);

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

    res.status(201).json(buildAuthResponse(user));
    publishRealtimeEvent('auth:changed', { userId: user._id.toString(), reason: 'customer_registered' });
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

    res.status(200).json(buildAuthResponse(user));
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

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (user.isActive === false) {
      return res.status(401).json({ success: false, message: 'Not authorized, account is deactivated' });
    }

    res.status(200).json({
      success: true,
      user: formatAuthUser(user),
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

    assertValidPassword(password);

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

    await EmployeeProfile.create({
      user: user._id,
      phone: '',
      operationalRole: employeeType === 'manager' ? 'Store Manager' : 'Sales Staff',
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
    publishRealtimeEvent('auth:changed', { userId: user._id.toString(), reason: 'employee_created' });
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
    assertValidPassword(newPassword);

    const employee = await User.findById(req.params.id);
    if (!employee || employee.role !== 'employee') {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }

    employee.password = newPassword;
    await employee.save();

    res.status(200).json({ success: true, message: 'Employee password reset successfully!' });
    publishRealtimeEvent('auth:changed', { userId: employee._id.toString(), reason: 'employee_password_reset' });
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
    publishRealtimeEvent('auth:changed', { userId: employee._id.toString(), reason: 'employee_status_changed' });
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
    publishRealtimeEvent('auth:changed', { userId: employee._id.toString(), reason: 'employee_position_changed' });
  } catch (error) {
    next(error);
  }
};

// @desc    Request password reset email
// @route   POST /api/auth/forgot-password
// @access  Public
export const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Please provide your email address' });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });

    const genericMessage =
      'If an account exists with that email, you will receive password reset instructions shortly.';

    if (!user || user.isActive === false) {
      return res.status(200).json({ success: true, message: genericMessage });
    }

    const resetToken = user.getResetPasswordToken();
    await user.save({ validateBeforeSave: false });

    const resetUrl = buildResetPasswordUrl(resetToken);
    await sendPasswordResetEmail({ to: user.email, resetUrl });

    const payload = { success: true, message: genericMessage };
    if (process.env.PASSWORD_RESET_DEV_EXPOSE === 'true') {
      payload.resetUrl = resetUrl;
    }

    res.status(200).json(payload);
  } catch (error) {
    next(error);
  }
};

// @desc    Reset password with token from email
// @route   PUT /api/auth/reset-password/:token
// @access  Public
export const resetPassword = async (req, res, next) => {
  try {
    const { password } = req.body;
    assertValidPassword(password);

    const hashedToken = crypto
      .createHash('sha256')
      .update(req.params.token)
      .digest('hex');

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpire: { $gt: Date.now() },
    }).select('+password +resetPasswordToken +resetPasswordExpire');

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset link. Please request a new one.',
      });
    }

    if (user.isActive === false) {
      return res.status(400).json({
        success: false,
        message: 'This account is deactivated. Contact your administrator.',
      });
    }

    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password reset successful. You can now sign in.',
    });
  } catch (error) {
    if (error.statusCode === 400) {
      return res.status(400).json({ success: false, message: error.message });
    }
    next(error);
  }
};

// @desc    Change password for logged-in user
// @route   PUT /api/auth/change-password
// @access  Private
export const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Please provide your current password and a new password',
      });
    }

    assertValidPassword(newPassword);

    const user = await User.findById(req.user.id).select('+password');

    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Current password is incorrect' });
    }

    const sameAsOld = await user.matchPassword(newPassword);
    if (sameAsOld) {
      return res.status(400).json({
        success: false,
        message: 'New password must be different from your current password',
      });
    }

    user.password = newPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password changed successfully',
    });
  } catch (error) {
    if (error.statusCode === 400) {
      return res.status(400).json({ success: false, message: error.message });
    }
    next(error);
  }
};

// @desc    Validate password strength (client helper)
// @route   POST /api/auth/validate-password
// @access  Public
export const validatePasswordEndpoint = (req, res) => {
  const { password } = req.body;
  const result = validatePassword(password);
  res.status(200).json({ success: true, ...result });
};

// @desc    Get employee profile
// @route   GET /api/auth/profile
// @access  Private (Employee/Admin)
export const getEmployeeProfile = async (req, res, next) => {
  try {
    const profile = await EmployeeProfile.findOne({ user: req.user._id }).populate('user', 'name email role employeeType');
    
    if (profile) {
      res.json({ success: true, data: profile });
    } else {
      res.status(404).json({ success: false, message: 'Profile not found' });
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Update employee profile
// @route   PUT /api/auth/profile
// @access  Private (Employee/Admin)
export const updateEmployeeProfile = async (req, res, next) => {
  try {
    const { name, phone } = req.body;
    
    // Update User
    const user = await User.findById(req.user._id);
    if (user && name) {
      user.name = name;
      await user.save();
    }

    // Update Profile
    let profile = await EmployeeProfile.findOne({ user: req.user._id });
    if (profile) {
      if (phone) profile.phone = phone;
      await profile.save();
    } else {
      profile = await EmployeeProfile.create({ user: req.user._id, phone });
    }

    res.json({ success: true, data: profile });
    publishRealtimeEvent('auth:changed', { userId: req.user._id.toString(), reason: 'employee_profile_updated' });
  } catch (error) {
    next(error);
  }
};

// @desc    Update employee email
// @route   PUT /api/auth/employees/:id/email
// @access  Private/Admin
export const updateEmployeeEmail = async (req, res, next) => {
  try {
    const { email } = req.body;
    const employee = await User.findById(req.params.id);
    
    if (!employee || employee.role !== 'employee') {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }

    const userExists = await User.findOne({ email });
    if (userExists && userExists._id.toString() !== employee._id.toString()) {
      return res.status(400).json({ success: false, message: 'Email already in use' });
    }

    employee.email = email;
    await employee.save();
    res.json({ success: true, message: 'Employee email updated', data: employee });
    publishRealtimeEvent('auth:changed', { userId: employee._id.toString(), reason: 'employee_email_updated' });
  } catch (error) {
    next(error);
  }
};

// @desc    Update employee role/type
// @route   PUT /api/auth/employees/:id/role
// @access  Private/Admin
export const updateEmployeeRole = async (req, res, next) => {
  try {
    const { role, employeeType } = req.body;
    const employee = await User.findById(req.params.id);
    
    if (!employee) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }

    if (role) employee.role = role;
    if (employeeType) employee.employeeType = employeeType;

    await employee.save();
    res.json({ success: true, message: 'Employee role updated', data: employee });
    publishRealtimeEvent('auth:changed', { userId: employee._id.toString(), reason: 'employee_role_updated' });
  } catch (error) {
    next(error);
  }
};
