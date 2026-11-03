import mongoose from 'mongoose';

const upstoxAuthSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      trim: true,
    },
    userName: {
      type: String,
      default: 'Upstox Trader',
      trim: true,
    },
    email: {
      type: String,
      default: '',
      trim: true,
    },
    accessToken: {
      type: String,
      required: true,
    },
    tokenType: {
      type: String,
      default: 'Bearer',
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isSimulated: {
      type: Boolean,
      default: false,
    },
    lastLoginAt: {
      type: Date,
      default: Date.now,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

// Helper method to check if token is expired
upstoxAuthSchema.methods.isExpired = function () {
  return new Date() >= this.expiresAt;
};

// Static helper to retrieve the current valid active session
upstoxAuthSchema.statics.getActiveAuth = async function () {
  const auth = await this.findOne({ isActive: true }).sort({ createdAt: -1 });
  if (!auth) return null;

  // If expired, automatically mark inactive
  if (auth.isExpired()) {
    auth.isActive = false;
    await auth.save();
    return null;
  }

  return auth;
};

// Static helper to save new token and revoke previous ones
upstoxAuthSchema.statics.saveAuth = async function ({
  userId,
  userName,
  email,
  accessToken,
  expiresAt,
  isSimulated = false,
  metadata = {},
}) {
  // Deactivate any previous active sessions
  await this.updateMany({ isActive: true }, { isActive: false });

  return await this.create({
    userId,
    userName,
    email,
    accessToken,
    expiresAt,
    isActive: true,
    isSimulated,
    lastLoginAt: new Date(),
    metadata,
  });
};

export const UpstoxAuth = mongoose.model('UpstoxAuth', upstoxAuthSchema);
