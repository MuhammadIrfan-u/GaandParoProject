import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import nodemailer from 'nodemailer';
import supabase from '../supabaseClient.js';

const generateToken = (userId) =>
  jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });

const createTransporter = () =>
  nodemailer.createTransport({
    service: 'gmail',
    auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
  });

// ── POST /auth/register ───────────────────────────────────────────────────────
// REQ-1: unique email + password, REQ-2: bcrypt hashing, REQ-5: role via isServiceProvider
export const register = async (req, res) => {
  try {
    const { name, email, password, phone, address, role } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required.' });
    }

    // Check duplicate email
    const { data: existing } = await supabase
      .from('users')
      .select('id')
      .eq('email', email.toLowerCase())
      .single();

    if (existing) {
      return res.status(409).json({ message: 'An account with this email already exists.' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const avatar = name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
    const isServiceProvider = role === 'business_owner';

    const { data: user, error } = await supabase
      .from('users')
      .insert({
        name,
        email: email.toLowerCase(),
        password_hash: passwordHash,
        phone: phone || '',
        address: address || '',
        avatar,
        bio: '',
        verified: false,
        reputation: 0,
        is_admin: false,
        is_flagged: false,
        flag_reason: '',
        moderation_status: 'active',
        "isServiceProvider": isServiceProvider,
        joined_date: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('Register DB error:', error);
      return res.status(500).json({ message: 'Failed to create account.' });
    }

    const token = generateToken(user.id);
    return res.status(201).json({
      message: 'Account created successfully.',
      token,
      user: toPublicProfile(user),
    });
  } catch (error) {
    console.error('Register error:', error);
    return res.status(500).json({ message: 'Server error during registration.' });
  }
};

// ── POST /auth/login ──────────────────────────────────────────────────────────
// REQ-3, REQ-4
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }

    const { data: user, error } = await supabase
      .from('users')
      .select('*, password_hash')
      .eq('email', email.toLowerCase())
      .single();

    if (error || !user) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    if (user.moderation_status === 'banned') {
      return res.status(403).json({ message: 'Your account has been banned.' });
    }

    const token = generateToken(user.id);
    return res.status(200).json({
      message: 'Login successful.',
      token,
      user: toPublicProfile(user),
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ message: 'Server error during login.' });
  }
};

// ── POST /auth/forgot-password ────────────────────────────────────────────────
// REQ-7, REQ-8
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Email is required.' });

    const { data: user } = await supabase
      .from('users')
      .select('id, name, email')
      .eq('email', email.toLowerCase())
      .single();

    // Always return 200 to prevent email enumeration
    if (!user) {
      return res.status(200).json({ message: 'If an account with that email exists, a reset link has been sent.' });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    const expires = new Date(Date.now() + 60 * 60 * 1000).toISOString();

    await supabase
      .from('users')
      .update({ reset_password_token: hashedToken, reset_password_expires: expires })
      .eq('id', user.id);

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
      await supabase
        .from('users')
        .update({ reset_password_token: null, reset_password_expires: null })
        .eq('id', user.id);
      console.error('Email send error:', emailError);
      return res.status(500).json({ message: 'Failed to send reset email. Please try again.' });
    }

    return res.status(200).json({ message: 'If an account with that email exists, a reset link has been sent.' });
  } catch (error) {
    console.error('Forgot password error:', error);
    return res.status(500).json({ message: 'Server error.' });
  }
};

// ── POST /auth/reset-password ─────────────────────────────────────────────────
// REQ-7, REQ-8
export const resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;
    if (!token || !password) {
      return res.status(400).json({ message: 'Token and new password are required.' });
    }

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const { data: user } = await supabase
      .from('users')
      .select('id, reset_password_expires')
      .eq('reset_password_token', hashedToken)
      .single();

    if (!user || new Date(user.reset_password_expires) < new Date()) {
      return res.status(400).json({ message: 'Reset token is invalid or has expired.' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const { data: updated } = await supabase
      .from('users')
      .update({
        password_hash: passwordHash,
        reset_password_token: null,
        reset_password_expires: null,
      })
      .eq('id', user.id)
      .select()
      .single();

    const newToken = generateToken(updated.id);
    return res.status(200).json({
      message: 'Password reset successful.',
      token: newToken,
      user: toPublicProfile(updated),
    });
  } catch (error) {
    console.error('Reset password error:', error);
    return res.status(500).json({ message: 'Server error.' });
  }
};

// ── GET /auth/me ──────────────────────────────────────────────────────────────
// REQ-13: session validation
export const getMe = async (req, res) => {
  try {
    return res.status(200).json({ user: toPublicProfile(req.user) });
  } catch (error) {
    return res.status(500).json({ message: 'Server error.' });
  }
};

// ── Helper: strip sensitive fields ───────────────────────────────────────────
export const toPublicProfile = (user) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  phone: user.phone || '',
  address: user.address || '',
  avatar: user.avatar || '',
  bio: user.bio || '',
  verified: user.verified || false,
  reputation: user.reputation || 0,
  isAdmin: user.is_admin || false,
  isFlagged: user.is_flagged || false,
  flagReason: user.flag_reason || '',
  moderationStatus: user.moderation_status || 'active',
  isServiceProvider: user.isServiceProvider || false,
  joinedDate: user.joined_date,
});
