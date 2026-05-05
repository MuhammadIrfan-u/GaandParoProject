import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

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
      minlength: 8,
      select: false,
    },
    phone: { type: String, trim: true, default: '' },
    address: { type: String, trim: true, default: '' },
    avatar: { type: String, default: '' },
    bio: { type: String, default: '' },
    role: {
      type: String,
      enum: ['resident', 'business_owner', 'moderator'],
      default: 'resident',
    },
    verified: { type: Boolean, default: false },
    reputation: { type: Number, default: 0, min: 0, max: 5 },
    isAdmin: { type: Boolean, default: false },
    isFlagged: { type: Boolean, default: false },
    flagReason: { type: String, default: '' },
    moderationStatus: {
      type: String,
      enum: ['active', 'suspended', 'banned'],
      default: 'active',
    },
    privacy: {
      showPhone:      { type: Boolean, default: false },
      showAddress:    { type: Boolean, default: true },
      profileVisible: { type: Boolean, default: true },
    },
    notifications: {
      push:            { type: Boolean, default: true },
      email:           { type: Boolean, default: true },
      communityAlerts: { type: Boolean, default: true },
    },
    resetPasswordToken:   { type: String, select: false },
    resetPasswordExpires: { type: Date,   select: false },
    joinedDate: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

userSchema.pre('save', async function () {
  if (!this.isModified('passwordHash')) return;
  this.passwordHash = await bcrypt.hash(this.passwordHash, 10);
});

userSchema.methods.comparePassword = async function (plainPassword) {
  return bcrypt.compare(plainPassword, this.passwordHash);
};

userSchema.methods.toPublicProfile = function () {
  return {
    id: this._id,
    name: this.name,
    email: this.email,
    phone: this.phone,
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

export default mongoose.model('User', userSchema);
