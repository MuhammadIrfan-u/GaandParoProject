const User = require('../models/User');

// ─── GET /auth/profile ───────────────────────────────────────────────────────
// REQ-6.3: retrieve profile (protected)
const getProfile = async (req, res) => {
  try {
    return res.status(200).json({ user: req.user.toPublicProfile() });
  } catch (error) {
    return res.status(500).json({ message: 'Server error.' });
  }
};

// ─── PUT /auth/profile ───────────────────────────────────────────────────────
// REQ-6.2: update profile (protected)
// REQ-9: privacy controls
const updateProfile = async (req, res) => {
  try {
    const allowedFields = [
      'name',
      'phone',
      'address',
      'bio',
      'avatar',
      'privacy',
      'notifications',
    ];

    const updates = {};
    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    // Prevent role/admin escalation through this endpoint
    delete updates.role;
    delete updates.isAdmin;
    delete updates.verified;
    delete updates.reputation;
    delete updates.isFlagged;
    delete updates.moderationStatus;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    return res.status(200).json({
      message: 'Profile updated successfully.',
      user: user.toPublicProfile(),
    });
  } catch (error) {
    console.error('Update profile error:', error);
    return res.status(500).json({ message: 'Server error.' });
  }
};

// ─── DELETE /auth/profile ────────────────────────────────────────────────────
// REQ-6.4: delete profile (protected)
const deleteProfile = async (req, res) => {
  try {
    await User.findByIdAndDelete(req.user._id);
    return res.status(200).json({ message: 'Account deleted successfully.' });
  } catch (error) {
    console.error('Delete profile error:', error);
    return res.status(500).json({ message: 'Server error.' });
  }
};

// ─── GET /users/:id ──────────────────────────────────────────────────────────
// REQ-12: public profile retrieval for inter-module use
const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }
    return res.status(200).json({ user: user.toPublicProfile() });
  } catch (error) {
    console.error('Get user error:', error);
    return res.status(500).json({ message: 'Server error.' });
  }
};

// ─── PUT /auth/change-password ───────────────────────────────────────────────
// Allows authenticated user to change their password
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Current and new password are required.' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'New password must be at least 6 characters.' });
    }

    const user = await User.findById(req.user._id).select('+passwordHash');
    const isMatch = await user.comparePassword(currentPassword);

    if (!isMatch) {
      return res.status(401).json({ message: 'Current password is incorrect.' });
    }

    user.passwordHash = newPassword; // pre-save hook will hash this
    await user.save();

    return res.status(200).json({ message: 'Password changed successfully.' });
  } catch (error) {
    console.error('Change password error:', error);
    return res.status(500).json({ message: 'Server error.' });
  }
};

module.exports = { getProfile, updateProfile, deleteProfile, getUserById, changePassword };
