import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
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

export async function GET(request: NextRequest) {
    try {
        await connectDB();
        
        const authResult = requireRole(request, ['volunteer', 'admin']);
        if (authResult instanceof NextResponse) {
            return authResult;
        }

        console.log('Fetching resources for volunteer...');
        const resources = await Resource.find({}).select('name category totalQuantity');

        // Get participant counts for each resource
        const resourcesWithCounts = await Promise.all(resources.map(async (resource) => {
            const count = await Transaction.countDocuments({
                resourceId: resource._id,
                action: 'claim'
            });

            return {
                _id: resource._id.toString(),
                name: resource.name,
                category: resource.category,
                participantCount: count,
                totalQuantity: resource.totalQuantity
            };
        }));

        console.log(`Found ${resourcesWithCounts.length} resources with counts:`, resourcesWithCounts);
        return NextResponse.json({ resources: resourcesWithCounts });
    } catch (error: any) {
        console.error('Error fetching resources:', error);
        return NextResponse.json(
            { message: error.message },
            { status: 500 }
        );
    }
}


