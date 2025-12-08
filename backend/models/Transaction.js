const mongoose = require('mongoose');

const TransactionSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    resourceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Resource' }, // Optional for verification
    volunteerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    action: { type: String, enum: ['claim', 'return', 'verify'], required: true },
    timestamp: { type: Date, default: Date.now },
});

module.exports = mongoose.models.Transaction || mongoose.model('Transaction', TransactionSchema);
