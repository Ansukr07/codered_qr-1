const mongoose = require('mongoose');

const AdminSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, unique: true, required: true, lowercase: true },
    password: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
});

// Indexes for faster queries
AdminSchema.index({ email: 1 });

module.exports = mongoose.models.Admin || mongoose.model('Admin', AdminSchema);

