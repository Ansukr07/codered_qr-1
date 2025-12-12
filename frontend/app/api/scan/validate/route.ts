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

        const existingTransaction = await Transaction.findOne({
            userId: userRecord._id,
            resourceId: resource._id,
        }).populate('volunteerId', 'name');

        if (existingTransaction) {
            return NextResponse.json({
                status: 'claimed',
                message: `Already claimed: ${resource.name}`,
                member: {
                    name: userRecord.name,
                    teamId: userRecord.teamId,
                    email: userRecord.email
                },
                transaction: {
                    timestamp: existingTransaction.timestamp,
                    volunteerName: existingTransaction.volunteerId ? (existingTransaction.volunteerId as any).name : 'Unknown'
                }
            });
        }

        return NextResponse.json({
            status: 'allowed',
            message: 'Ready to claim',
            member: {
                name: userRecord.name,
                teamId: userRecord.teamId,
                email: userRecord.email
            }
        });
    } catch (error: any) {
        return NextResponse.json(
            { message: error.message },
            { status: 500 }
        );
    }
}


