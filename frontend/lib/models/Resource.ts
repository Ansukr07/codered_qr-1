import mongoose from 'mongoose';

const ResourceSchema = new mongoose.Schema({
    name: { type: String, required: true },
    totalQuantity: { type: Number, required: true },
    distributedQuantity: { type: Number, default: 0 },
    category: { type: String, enum: ['food', 'accommodation', 'chill_room', 'coffee', 'other'], default: 'other' },
});

export default mongoose.models.Resource || mongoose.model('Resource', ResourceSchema);


