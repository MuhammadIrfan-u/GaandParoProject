const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
    },
    passwordHash: {
      type: String,
      required: [true, 'Password is required'],
      minlength: 6,
      select: false, // never returned in queries by default
    },
    phone: {
      type: String,
      trim: true,
      default: '',
    },
    address: {
      type: String,
      trim: true,
      default: '',
    },
    avatar: {
      type: String,
      default: '',
    },
    bio: {
      type: String,
      default: '',
    },
    role: {
      type: String,
      enum: ['resident', 'business_owner', 'moderator'],
      default: 'resident',
    },
    verified: {
      type: Boolean,
      default: false,
    },
    reputation: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    isAdmin: {
      type: Boolean,
      default: false,
    },
    isFlagged: {
      type: Boolean,
      default: false,
    },
    flagReason: {
      type: String,
      default: '',
    },
    moderationStatus: {
      type: String,
      enum: ['active', 'suspended', 'banned'],
      default: 'active',
    },
    // Privacy settings
    privacy: {
      showPhone: { type: Boolean, default: false },
      showAddress: { type: Boolean, default: true },
      profileVisible: { type: Boolean, default: true },
    },
    // Notification preferences
    notifications: {
      push: { type: Boolean, default: true },
      email: { type: Boolean, default: true },
      communityAlerts: { type: Boolean, default: true },
    },
    // Account recovery
    resetPasswordToken: {
      type: String,
      select: false,
    },
    resetPasswordExpires: {
      type: Date,
      select: false,
    },
    joinedDate: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true, // adds createdAt and updatedAt
  }
);

// Hash password before saving
userSchema.pre('save', async function () {
  // Only hash if passwordHash field was modified
  if (!this.isModified('passwordHash')) return;
  this.passwordHash = await bcrypt.hash(this.passwordHash, 10);
});

// Instance method: compare plain password with stored hash
userSchema.methods.comparePassword = async function (plainPassword) {
  return bcrypt.compare(plainPassword, this.passwordHash);
};

// Instance method: return safe public profile (no sensitive fields)
userSchema.methods.toPublicProfile = function () {
  return {
    id: this._id,
    name: this.name,
    email: this.email,
    phone: this.privacy.showPhone ? this.phone : undefined,
    address: this.address,
    avatar: this.avatar,
    bio: this.bio,
    role: this.role,
    verified: this.verified,
    reputation: this.reputation,
    isAdmin: this.isAdmin,
    isFlagged: this.isFlagged,
    moderationStatus: this.moderationStatus,
    privacy: this.privacy,
    notifications: this.notifications,
    joinedDate: this.joinedDate,
  };
};

module.exports = mongoose.model('User', userSchema);
