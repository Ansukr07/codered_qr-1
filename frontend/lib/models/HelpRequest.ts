import mongoose from 'mongoose';

const HelpRequestSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    description: { type: String, required: true },
    category: { type: String, enum: ['technical', 'food', 'supplies', 'general'], default: 'general' },
    priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
    status: { type: String, enum: ['pending', 'resolved'], default: 'pending' },
    resolvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    resolvedAt: { type: Date },
}, {
    timestamps: true
});

export default mongoose.models.HelpRequest || mongoose.model('HelpRequest', HelpRequestSchema);

