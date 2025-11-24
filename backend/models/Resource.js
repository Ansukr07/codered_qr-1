const mongoose = require('mongoose');

const ResourceSchema = new mongoose.Schema({
    name: { type: String, required: true },
    totalQuantity: { type: Number, required: true },
    distributedQuantity: { type: Number, default: 0 },
    category: { type: String, enum: ['food', 'accommodation', 'chill_room', 'other'], default: 'other' },
});

module.exports = mongoose.models.Resource || mongoose.model('Resource', ResourceSchema);
