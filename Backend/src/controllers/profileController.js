import User from '../models/User.js';

// GET /auth/profile — REQ-6.3
export const getProfile = async (req, res) => {
  try {
    return res.status(200).json({ user: req.user.toPublicProfile() });
  } catch (error) {
    return res.status(500).json({ message: 'Server error.' });
  }
};

// PUT /auth/profile — REQ-6.2, REQ-9
export const updateProfile = async (req, res) => {
  try {
    const allowedFields = ['name', 'phone', 'address', 'bio', 'avatar', 'role', 'privacy', 'notifications'];
    const updates = {};
    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    });

    delete updates.isAdmin;
    delete updates.verified;
    delete updates.reputation;
    delete updates.isFlagged;
    delete updates.moderationStatus;

    const user = await User.findByIdAndUpdate(req.user._id, { $set: updates }, { new: true, runValidators: true });
    if (!user) return res.status(404).json({ message: 'User not found.' });

    return res.status(200).json({ message: 'Profile updated successfully.', user: user.toPublicProfile() });
  } catch (error) {
    console.error('Update profile error:', error);
    return res.status(500).json({ message: 'Server error.' });
  }
};

// DELETE /auth/profile — REQ-6.4
export const deleteProfile = async (req, res) => {
  try {
    await User.findByIdAndDelete(req.user._id);
    return res.status(200).json({ message: 'Account deleted successfully.' });
  } catch (error) {
    console.error('Delete profile error:', error);
    return res.status(500).json({ message: 'Server error.' });
  }
};

// GET /users/:id — REQ-12
export const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found.' });
    return res.status(200).json({ user: user.toPublicProfile() });
  } catch (error) {
    console.error('Get user error:', error);
    return res.status(500).json({ message: 'Server error.' });
  }
};

// PUT /auth/change-password
export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Current and new password are required.' });
    }
    const user = await User.findById(req.user._id).select('+passwordHash');
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) return res.status(401).json({ message: 'Current password is incorrect.' });

    user.passwordHash = newPassword;
    await user.save();
    return res.status(200).json({ message: 'Password changed successfully.' });
  } catch (error) {
    console.error('Change password error:', error);
    return res.status(500).json({ message: 'Server error.' });
  }
};
