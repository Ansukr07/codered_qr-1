import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, unique: true, sparse: true }, // sparse allows multiple null/undefined
    password: { type: String },
    role: { type: String, enum: ['admin', 'volunteer', 'participant'], default: 'participant' },
    teamId: { type: String },
    qrCode: { type: String, unique: true, required: true },
    track: { type: String }, // CRU or CR
    hall: { type: String }, // Main Hall, Small Hall 1, Small Hall 2
    seatNumber: { type: String }, // e.g. M-T6, S2-T12
    createdAt: { type: Date, default: Date.now },
});

export default mongoose.models.User || mongoose.model('User', UserSchema);


