const mongoose = require('mongoose');

const OTPSchema = new mongoose.Schema({
    email: { type: String, required: true, lowercase: true },
    otp: { type: String, required: true },
    expiresAt: { type: Date, required: true },
    isUsed: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
});

// Indexes for faster queries
OTPSchema.index({ email: 1 });
OTPSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // Auto-delete expired OTPs

module.exports = mongoose.models.OTP || mongoose.model('OTP', OTPSchema);



