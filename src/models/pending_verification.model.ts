import mongoose from 'mongoose';

const schema = new mongoose.Schema({
  verification_type: {
    type: String,
    enum: ["ACCOUNT_CREATION", "PASSWORD_RESET", "OTHER"],
    default: "OTHER",
  },
  verification_code: {
    type: String,
    required: true,
    unique: true,
  },
  user: {
    type: mongoose.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  additional_data: {
    type: Object,
    default: null,
  },
  created_on: {
    type: Date,
    default: Date.now,
  },
});

export const PendingVerification = mongoose.model('PendingVerification', schema, 'pending_verifications');