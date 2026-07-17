const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
require('dotenv').config();

const signToken = (id, email, role) => {
  return jwt.sign(
    { id, email, role },
    process.env.JWT_SECRET || 'supersecretkeychangeinproduction',
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

exports.register = async (req, res) => {
  const { name, email, password, role } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({
      success: false,
      message: 'Please provide name, email, and password.'
    });
  }

  try {
    // Check if user already exists
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'Email already registered.'
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Default role to Citizen if not specified or invalid
    const assignedRole = ['Citizen', 'Visitor', 'Operator', 'Admin'].includes(role) ? role : 'Citizen';

    // Insert user
    const newUser = await User.create({
      name,
      email,
      password: hashedPassword,
      role: assignedRole
    });

    const token = signToken(newUser._id, email, assignedRole);

    return res.status(201).json({
      success: true,
      message: 'User registered successfully.',
      token,
      user: { id: newUser._id, name, email, role: assignedRole }
    });
  } catch (error) {
    console.error('Registration Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error during registration.'
    });
  }
};

exports.login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: 'Please provide email and password.'
    });
  }

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials.'
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials.'
      });
    }

    const token = signToken(user._id, user.email, user.role);

    return res.status(200).json({
      success: true,
      message: 'Logged in successfully.',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Login Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error during login.'
    });
  }
};

exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('name email role created_at');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.'
      });
    }
    return res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Internal server error.'
    });
  }
};

// Forgot Password Flow
exports.forgotPassword = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({
      success: false,
      message: 'Please provide your email address.'
    });
  }

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'No user registered with this email address.'
      });
    }

    // Generate crypto token
    const rawResetToken = crypto.randomBytes(32).toString('hex');

    // Hash token to store in DB
    const hashedResetToken = crypto
      .createHash('sha256')
      .update(rawResetToken)
      .digest('hex');

    // Set expiration to 1 hour from now
    const expires = new Date(Date.now() + 3600000); // 1 hour

    user.reset_token = hashedResetToken;
    user.reset_token_expires = expires;
    await user.save();

    // Return raw token in response so the frontend user can proceed without a mail server setup
    return res.status(200).json({
      success: true,
      message: 'Password reset token generated.',
      resetToken: rawResetToken, // ❗ Included for dev/evaluation testing convenience
      emailMessage: `Demo: Password reset token has been sent. Use link /reset-password/${rawResetToken}`
    });
  } catch (error) {
    console.error('ForgotPassword Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error.'
    });
  }
};

// Reset Password Flow
exports.resetPassword = async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;

  if (!password) {
    return res.status(400).json({
      success: false,
      message: 'Please provide a new password.'
    });
  }

  try {
    // Hash token parameter to match DB storage
    const hashedResetToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    // Query active tokens
    const user = await User.findOne({
      reset_token: hashedResetToken,
      reset_token_expires: { $gt: new Date() }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired password reset token.'
      });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Update password and clear tokens
    user.password = hashedPassword;
    user.reset_token = null;
    user.reset_token_expires = null;
    await user.save();

    return res.status(200).json({
      success: true,
      message: 'Password updated successfully. You can now log in.'
    });
  } catch (error) {
    console.error('ResetPassword Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error.'
    });
  }
};
