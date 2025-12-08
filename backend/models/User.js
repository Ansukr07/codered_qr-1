const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, unique: true, sparse: true }, // sparse allows multiple null/undefined
    password: { type: String },
    role: { type: String, enum: ['admin', 'volunteer', 'participant'], default: 'participant' },
    teamId: { type: String },
    qrCode: { type: String, unique: true, required: true },
    track: { type: String }, // CRU or CR
    createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.models.User || mongoose.model('User', UserSchema);
