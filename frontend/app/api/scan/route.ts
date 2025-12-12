import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import User from '@/lib/models/User';
import Resource from '@/lib/models/Resource';
import Transaction from '@/lib/models/Transaction';
import { requireAuth, requireRole } from '@/lib/middleware/rbac';

// Connect to MongoDB if not already connected
async function connectDB() {
    if (mongoose.connections[0].readyState) return;
    const mongoUri = process.env.MONGODB_URI;
    if (mongoUri) {
        await mongoose.connect(mongoUri);
    }
}

export async function POST(request: NextRequest) {
    try {
        await connectDB();
        
        const authResult = requireRole(request, ['volunteer', 'admin']);
        if (authResult instanceof NextResponse) {
            return authResult;
        }
        const { user } = authResult;

        const { qr_code, resource_id } = await request.json();

        const userRecord = await User.findOne({ qrCode: qr_code });
        if (!userRecord) {
            return NextResponse.json(
                { message: 'Invalid QR Code' },
                { status: 404 }
            );
        }

        const resource = await Resource.findById(resource_id);
        if (!resource) {
            return NextResponse.json(
                { message: 'Resource not found' },
                { status: 404 }
            );
        }

        if (resource.distributedQuantity >= resource.totalQuantity) {
            return NextResponse.json(
                { message: 'Resource out of stock' },
                { status: 400 }
            );
        }

        const existingTransaction = await Transaction.findOne({
            userId: userRecord._id,
            resourceId: resource._id,
        });

        if (existingTransaction) {
            return NextResponse.json(
                { message: `Already claimed: ${resource.name}. This resource was already distributed to this participant.` },
                { status: 400 }
            );
        }

        resource.distributedQuantity += 1;
        await resource.save();

        const transaction = await Transaction.create({
            userId: userRecord._id,
            resourceId: resource._id,
            volunteerId: user.userId,
            action: 'claim',
        });

        return NextResponse.json({
            message: 'Scan successful',
            transaction,
            memberName: userRecord.name
        });
    } catch (error: any) {
        return NextResponse.json(
            { message: error.message },
            { status: 500 }
        );
    }
}


