const mongoose = require('mongoose');

const TransactionSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    resourceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Resource', required: true },
    volunteerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    action: { type: String, enum: ['claim', 'return'], required: true },
    timestamp: { type: Date, default: Date.now },
});

module.exports = mongoose.models.Transaction || mongoose.model('Transaction', TransactionSchema);
