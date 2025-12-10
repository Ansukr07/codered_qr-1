const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    points: {
        type: Number,
        default: 1
    },
    category: {
        type: String,
        enum: ['general', 'fun', 'technical', 'social'],
        default: 'general'
    },
    proofType: {
        type: String,
        enum: ['image', 'link', 'text'],
        default: 'image'
    },
    requiresProof: {
        type: Boolean,
        default: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Task', taskSchema);
