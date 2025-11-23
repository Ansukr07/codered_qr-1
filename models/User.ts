import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
    name: string;
    email: string;
    password?: string;
    role: 'admin' | 'volunteer' | 'participant';
    teamId?: string;
    qrCode: string;
    createdAt: Date;
}

const UserSchema: Schema = new Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String },
    role: { type: String, enum: ['admin', 'volunteer', 'participant'], default: 'participant' },
    teamId: { type: String },
    qrCode: { type: String, unique: true, required: true },
    createdAt: { type: Date, default: Date.now },
});

export default mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
