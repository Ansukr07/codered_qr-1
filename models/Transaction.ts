import mongoose, { Schema, Document } from 'mongoose';

export interface ITransaction extends Document {
    userId: mongoose.Types.ObjectId;
    resourceId: mongoose.Types.ObjectId;
    volunteerId: mongoose.Types.ObjectId;
    action: 'claim' | 'return';
    timestamp: Date;
}

const TransactionSchema: Schema = new Schema({
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    resourceId: { type: Schema.Types.ObjectId, ref: 'Resource', required: true },
    volunteerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    action: { type: String, enum: ['claim', 'return'], required: true },
    timestamp: { type: Date, default: Date.now },
});

export default mongoose.models.Transaction || mongoose.model<ITransaction>('Transaction', TransactionSchema);
