const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const User = require('../models/User');

// ─── Helper: generate signed JWT ────────────────────────────────────────────
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
};

// ─── Helper: nodemailer transporter ─────────────────────────────────────────
const createTransporter = () => {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
};

// ─── POST /auth/register ─────────────────────────────────────────────────────
// REQ-1: unique email + password
// REQ-2: password hashed (handled in User model pre-save hook)
// REQ-5: role-based personas
const register = async (req, res) => {
  try {
    const { name, email, password, phone, address, role } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required.' });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(409).json({ message: 'An account with this email already exists.' });
    }

    // Generate avatar initials from name
    const initials = name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);

    const user = await User.create({
      name,
      email,
      passwordHash: password, // pre-save hook will hash this
      phone: phone || '',
      address: address || '',
      avatar: initials,
      role: role || 'resident',
    });

    const token = generateToken(user._id);

    return res.status(201).json({
      message: 'Account created successfully.',
      token,
      user: user.toPublicProfile(),
    });
  } catch (error) {
    console.error('Register error:', error);
    return res.status(500).json({ message: 'Server error during registration.' });
  }
};

// ─── POST /auth/login ────────────────────────────────────────────────────────
// REQ-3: login with registered credentials
// REQ-4: generate JWT after successful login
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }

    // Explicitly select passwordHash since it's excluded by default
    const user = await User.findOne({ email: email.toLowerCase() }).select('+passwordHash');
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    if (user.moderationStatus === 'banned') {
      return res.status(403).json({ message: 'Your account has been banned.' });
    }

    const token = generateToken(user._id);

    return res.status(200).json({
      message: 'Login successful.',
      token,
      user: user.toPublicProfile(),
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ message: 'Server error during login.' });
  }
};

// ─── POST /auth/forgot-password ──────────────────────────────────────────────
// REQ-7: forgot password workflow
// REQ-8: generate and email a secure reset link
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email is required.' });
    }

    const user = await User.findOne({ email: email.toLowerCase() }).select(
      '+resetPasswordToken +resetPasswordExpires'
    );

    // Always return 200 to prevent email enumeration attacks
    if (!user) {
      return res.status(200).json({
        message: 'If an account with that email exists, a reset link has been sent.',
      });
    }

    // Generate a secure random token
    const resetToken = crypto.randomBytes(32).toString('hex');
    user.resetPasswordToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');
    user.resetPasswordExpires = Date.now() + 60 * 60 * 1000; // 1 hour
    await user.save({ validateBeforeSave: false });

    const resetUrl = `${process.env.CLIENT_URL}/reset-password?token=${resetToken}`;

    // In development (email not configured), return the reset URL directly
    const emailConfigured =
      process.env.EMAIL_USER &&
      process.env.EMAIL_USER !== 'your_email@gmail.com' &&
      process.env.EMAIL_PASS &&
      process.env.EMAIL_PASS !== 'your_email_app_password';

    if (!emailConfigured) {
      console.log(`[DEV] Password reset URL for ${user.email}: ${resetUrl}`);
      return res.status(200).json({
        message: 'If an account with that email exists, a reset link has been sent.',
        // Only exposed in dev when email not configured — remove before production
        devResetUrl: resetUrl,
      });
    }

    try {
      const transporter = createTransporter();
      await transporter.sendMail({        from: `"NeighborHub" <${process.env.EMAIL_USER}>`,
        to: user.email,
        subject: 'Password Reset Request',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #4f46e5;">Reset Your Password</h2>
            <p>Hi ${user.name},</p>
            <p>You requested a password reset for your NeighborHub account.</p>
            <p>Click the button below to reset your password. This link expires in <strong>1 hour</strong>.</p>
            <a href="${resetUrl}"
               style="display:inline-block;padding:12px 24px;background:#4f46e5;color:#fff;border-radius:8px;text-decoration:none;margin:16px 0;">
              Reset Password
            </a>
            <p>If you did not request this, please ignore this email. Your password will remain unchanged.</p>
            <hr/>
            <p style="color:#888;font-size:12px;">NeighborHub — Verified Neighborhood Community</p>
          </div>
        `,
      });
    } catch (emailError) {
      // Roll back token if email fails
      user.resetPasswordToken = undefined;
      user.resetPasswordExpires = undefined;
      await user.save({ validateBeforeSave: false });
      console.error('Email send error:', emailError);
      return res.status(500).json({ message: 'Failed to send reset email. Please try again.' });
    }

    return res.status(200).json({
      message: 'If an account with that email exists, a reset link has been sent.',
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    return res.status(500).json({ message: 'Server error.' });
  }
};

// ─── POST /auth/reset-password ───────────────────────────────────────────────
// REQ-7, REQ-8: validate token and update password
const resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return res.status(400).json({ message: 'Token and new password are required.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters.' });
    }

    // Hash the incoming token to compare with stored hash
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() },
    }).select('+resetPasswordToken +resetPasswordExpires');

    if (!user) {
      return res.status(400).json({ message: 'Reset token is invalid or has expired.' });
    }

    user.passwordHash = password; // pre-save hook will hash this
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    const newToken = generateToken(user._id);

    return res.status(200).json({
      message: 'Password reset successful.',
      token: newToken,
      user: user.toPublicProfile(),
    });
  } catch (error) {
    console.error('Reset password error:', error);
    return res.status(500).json({ message: 'Server error.' });
  }
};

// ─── GET /auth/me ────────────────────────────────────────────────────────────
// REQ-13: session validation endpoint — verify token and return current user
const getMe = async (req, res) => {
  try {
    return res.status(200).json({ user: req.user.toPublicProfile() });
  } catch (error) {
    return res.status(500).json({ message: 'Server error.' });
  }
};

module.exports = { register, login, forgotPassword, resetPassword, getMe };
