import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import Resource from '@/lib/models/Resource';
import { requireAuth, requireRole } from '@/lib/middleware/rbac';

// Connect to MongoDB if not already connected
async function connectDB() {
    if (mongoose.connections[0].readyState) return;
    const mongoUri = process.env.MONGODB_URI;
    if (mongoUri) {
        await mongoose.connect(mongoUri);
    }
}

// Get all resources - Authenticated users only
export async function GET(request: NextRequest) {
    try {
        await connectDB();
        
        const authResult = requireAuth(request);
        if (authResult instanceof NextResponse) {
            return authResult;
        }

        const resources = await Resource.find({});
        return NextResponse.json({ resources });
    } catch (error: any) {
        return NextResponse.json(
            { message: error.message },
            { status: 500 }
        );
    }
}

// Create resource (Admin only)
export async function POST(request: NextRequest) {
    try {
        await connectDB();
        
        const authResult = requireRole(request, ['admin']);
        if (authResult instanceof NextResponse) {
            return authResult;
        }

        const { name, totalQuantity, category } = await request.json();
        const resource = await Resource.create({
            name,
            totalQuantity,
            distributedQuantity: 0,
            category: category || 'other'
        });

        return NextResponse.json(
            { message: 'Resource created', resource },
            { status: 201 }
        );
    } catch (error: any) {
        return NextResponse.json(
            { message: error.message },
            { status: 500 }
        );
    }
}



