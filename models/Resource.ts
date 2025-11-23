import mongoose, { Schema, Document } from 'mongoose';

export interface IResource extends Document {
    name: string;
    totalQuantity: number;
    distributedQuantity: number;
    type: 'consumable' | 'returnable';
    createdAt: Date;
}

const ResourceSchema: Schema = new Schema({
    name: { type: String, required: true },
    totalQuantity: { type: Number, required: true, default: 0 },
    distributedQuantity: { type: Number, required: true, default: 0 },
    type: { type: String, enum: ['consumable', 'returnable'], required: true },
    createdAt: { type: Date, default: Date.now },
});

export default mongoose.models.Resource || mongoose.model<IResource>('Resource', ResourceSchema);
