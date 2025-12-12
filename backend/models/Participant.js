const mongoose = require('mongoose');

const ParticipantSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, unique: true, required: true, lowercase: true },
    participantId: { type: String, unique: true, required: true }, // e.g., CRU-T01-P01
    qrCode: { type: String, unique: true, required: true },
    teamId: { type: String },
    track: { type: String }, // CRU or CR
    hall: { type: String }, // Main Hall, Small Hall 1, Small Hall 2
    seatNumber: { type: String }, // e.g. M-T6, S2-T12
    isEmailVerified: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
});

// Indexes for faster queries
ParticipantSchema.index({ email: 1 });
ParticipantSchema.index({ participantId: 1 });
ParticipantSchema.index({ qrCode: 1 });

module.exports = mongoose.models.Participant || mongoose.model('Participant', ParticipantSchema);



