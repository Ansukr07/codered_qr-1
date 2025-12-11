import mongoose from 'mongoose';

const VolunteerSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, unique: true, required: true, lowercase: true },
    password: { type: String, required: true },
    qrCode: { type: String, unique: true, sparse: true }, // Optional for volunteers
    createdAt: { type: Date, default: Date.now },
});

// Indexes for faster queries
VolunteerSchema.index({ email: 1 });

export default mongoose.models.Volunteer || mongoose.model('Volunteer', VolunteerSchema);

