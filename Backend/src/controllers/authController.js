import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';
import User from '../models/User.js';

const generateToken = (userId) =>
  jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });

const createTransporter = () =>
  nodemailer.createTransport({
    service: 'gmail',
    auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
  });

// POST /auth/register — REQ-1, REQ-2, REQ-5
export const register = async (req, res) => {
  try {
    const { name, email, password, phone, address, role } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required.' });
    }
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(409).json({ message: 'An account with this email already exists.' });
    }
    const initials = name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
    const user = await User.create({
      name, email, passwordHash: password,
      phone: phone || '', address: address || '',
      avatar: initials, role: role || 'resident',
    });
    const token = generateToken(user._id);
    return res.status(201).json({ message: 'Account created successfully.', token, user: user.toPublicProfile() });
  } catch (error) {
    console.error('Register error:', error);
    return res.status(500).json({ message: 'Server error during registration.' });
  }
};

// POST /auth/login — REQ-3, REQ-4
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }
    const user = await User.findOne({ email: email.toLowerCase() }).select('+passwordHash');
    if (!user) return res.status(401).json({ message: 'Invalid email or password.' });
    const isMatch = await user.comparePassword(password);
    if (!isMatch) return res.status(401).json({ message: 'Invalid email or password.' });
    if (user.moderationStatus === 'banned') {
      return res.status(403).json({ message: 'Your account has been banned.' });
    }
    const token = generateToken(user._id);
    return res.status(200).json({ message: 'Login successful.', token, user: user.toPublicProfile() });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ message: 'Server error during login.' });
  }
};

// POST /auth/forgot-password — REQ-7, REQ-8
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Email is required.' });

    const user = await User.findOne({ email: email.toLowerCase() })
      .select('+resetPasswordToken +resetPasswordExpires');

    if (!user) {
      return res.status(200).json({ message: 'If an account with that email exists, a reset link has been sent.' });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    user.resetPasswordExpires = Date.now() + 60 * 60 * 1000;
    await user.save({ validateBeforeSave: false });

    const resetUrl = `${process.env.CLIENT_URL}/reset-password?token=${resetToken}`;

    const emailConfigured =
      process.env.EMAIL_USER &&
      process.env.EMAIL_USER !== 'your_email@gmail.com' &&
      process.env.EMAIL_PASS &&
      process.env.EMAIL_PASS !== 'your_email_app_password';

    if (!emailConfigured) {
      console.log(`[DEV] Password reset URL for ${user.email}: ${resetUrl}`);
      return res.status(200).json({
        message: 'If an account with that email exists, a reset link has been sent.',
        devResetUrl: resetUrl,
      });
    }

    try {
      const transporter = createTransporter();
      await transporter.sendMail({
        from: `"NeighborHub" <${process.env.EMAIL_USER}>`,
        to: user.email,
        subject: 'Password Reset Request',
        html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
          <h2 style="color:#4f46e5">Reset Your Password</h2>
          <p>Hi ${user.name},</p>
          <p>Click the button below to reset your password. This link expires in <strong>1 hour</strong>.</p>
          <a href="${resetUrl}" style="display:inline-block;padding:12px 24px;background:#4f46e5;color:#fff;border-radius:8px;text-decoration:none;margin:16px 0">Reset Password</a>
          <p>If you did not request this, please ignore this email.</p>
        </div>`,
      });
    } catch (emailError) {
      user.resetPasswordToken = undefined;
      user.resetPasswordExpires = undefined;
      await user.save({ validateBeforeSave: false });
      console.error('Email send error:', emailError);
      return res.status(500).json({ message: 'Failed to send reset email. Please try again.' });
    }

    return res.status(200).json({ message: 'If an account with that email exists, a reset link has been sent.' });
  } catch (error) {
    console.error('Forgot password error:', error);
    return res.status(500).json({ message: 'Server error.' });
  }
};

// POST /auth/reset-password — REQ-7, REQ-8
export const resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;
    if (!token || !password) {
      return res.status(400).json({ message: 'Token and new password are required.' });
    }
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() },
    }).select('+resetPasswordToken +resetPasswordExpires');

    if (!user) return res.status(400).json({ message: 'Reset token is invalid or has expired.' });

    user.passwordHash = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    const newToken = generateToken(user._id);
    return res.status(200).json({ message: 'Password reset successful.', token: newToken, user: user.toPublicProfile() });
  } catch (error) {
    console.error('Reset password error:', error);
    return res.status(500).json({ message: 'Server error.' });
  }
};

// GET /auth/me — REQ-13
export const getMe = async (req, res) => {
  try {
    return res.status(200).json({ user: req.user.toPublicProfile() });
  } catch (error) {
    return res.status(500).json({ message: 'Server error.' });
  }
};
