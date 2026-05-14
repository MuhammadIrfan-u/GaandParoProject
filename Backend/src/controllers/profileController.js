import bcrypt from 'bcryptjs';
import supabase from '../supabaseClient.js';
import { toPublicProfile } from './authController.js';

// ── GET /auth/profile — REQ-6.3 ───────────────────────────────────────────────
export const getProfile = async (req, res) => {
  try {
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', req.user.id)
      .single();
    if (error || !user) return res.status(404).json({ message: 'User not found.' });
    return res.status(200).json({ user: toPublicProfile(user) });
  } catch (error) {
    return res.status(500).json({ message: 'Server error.' });
  }
};

// ── PUT /auth/profile — REQ-6.2, REQ-9 ───────────────────────────────────────
export const updateProfile = async (req, res) => {
  try {
    const allowedFields = ['name', 'phone', 'address', 'bio', 'avatar', 'isServiceProvider'];
    const updates = {};
    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    });

    // Map camelCase to DB column names
    const dbUpdates = {};
    if (updates.name !== undefined)              dbUpdates.name = updates.name;
    if (updates.phone !== undefined)             dbUpdates.phone = updates.phone;
    if (updates.address !== undefined)           dbUpdates.address = updates.address;
    if (updates.bio !== undefined)               dbUpdates.bio = updates.bio;
    if (updates.avatar !== undefined)            dbUpdates.avatar = updates.avatar;
    if (updates.isServiceProvider !== undefined) dbUpdates.isServiceProvider = updates.isServiceProvider;

    const { data: user, error } = await supabase
      .from('users')
      .update(dbUpdates)
      .eq('id', req.user.id)
      .select()
      .single();

    if (error || !user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    return res.status(200).json({
      message: 'Profile updated successfully.',
      user: toPublicProfile(user),
    });
  } catch (error) {
    console.error('Update profile error:', error);
    return res.status(500).json({ message: 'Server error.' });
  }
};

// ── DELETE /auth/profile — REQ-6.4 ───────────────────────────────────────────
export const deleteProfile = async (req, res) => {
  try {
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', req.user.id);

    if (error) return res.status(500).json({ message: 'Failed to delete account.' });
    return res.status(200).json({ message: 'Account deleted successfully.' });
  } catch (error) {
    console.error('Delete profile error:', error);
    return res.status(500).json({ message: 'Server error.' });
  }
};

// ── GET /api/users/:id — REQ-12: inter-module user lookup ─────────────────────
export const getUserById = async (req, res) => {
  try {
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (error || !user) {
      return res.status(404).json({ message: 'User not found.' });
    }
    return res.status(200).json({ user: toPublicProfile(user) });
  } catch (error) {
    console.error('Get user error:', error);
    return res.status(500).json({ message: 'Server error.' });
  }
};

// ── PUT /auth/change-password ─────────────────────────────────────────────────
export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Current and new password are required.' });
    }

    // Fetch password_hash explicitly
    const { data: user } = await supabase
      .from('users')
      .select('password_hash')
      .eq('id', req.user.id)
      .single();

    const isMatch = await bcrypt.compare(currentPassword, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ message: 'Current password is incorrect.' });
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await supabase
      .from('users')
      .update({ password_hash: passwordHash })
      .eq('id', req.user.id);

    return res.status(200).json({ message: 'Password changed successfully.' });
  } catch (error) {
    console.error('Change password error:', error);
    return res.status(500).json({ message: 'Server error.' });
  }
};
