import mongoose from 'mongoose';

const AnnouncementSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    message: {
        type: String,
        required: true,
        trim: true
    },
    priority: {
        type: String,
        enum: ['low', 'medium', 'high'],
        default: 'medium'
    },
    audience: {
        type: String,
        enum: ['all', 'volunteers', 'participants'],
        default: 'all'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

export default mongoose.models.Announcement || mongoose.model('Announcement', AnnouncementSchema);

