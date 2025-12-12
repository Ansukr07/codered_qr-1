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

        // Normalize QR code: trim whitespace and handle URL format
        let normalizedQrCode = qr_code ? qr_code.trim() : '';
        
        // Extract ID from URL if present (e.g., "https://example.com/verify?id=CR-T75-P01")
        if (normalizedQrCode.includes('http') || normalizedQrCode.includes('?')) {
            try {
                const url = new URL(normalizedQrCode);
                const idParam = url.searchParams.get('id');
                if (idParam) {
                    normalizedQrCode = idParam.trim();
                }
            } catch (e) {
                // If URL parsing fails, try to extract manually
                const idMatch = normalizedQrCode.match(/[?&]id=([^&]+)/);
                if (idMatch) {
                    normalizedQrCode = idMatch[1].trim();
                }
            }
        }

        // Try exact match first
        let userRecord = await User.findOne({ qrCode: normalizedQrCode });
        
        // If not found, try case-insensitive match
        if (!userRecord) {
            userRecord = await User.findOne({ 
                qrCode: { $regex: new RegExp(`^${normalizedQrCode.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') }
            });
        }
        
        if (!userRecord) {
            return NextResponse.json(
                { message: 'Invalid QR Code' },
                { status: 404 }
            );
        }

        if (!resource_id) {
            return NextResponse.json(
                { message: 'Resource ID is required' },
                { status: 400 }
            );
        }

        const resource = await Resource.findById(resource_id);
        if (!resource) {
            console.error(`Resource not found with ID: ${resource_id}`);
            return NextResponse.json(
                { message: 'Resource not found. Please ensure the resource exists in the database.' },
                { status: 404 }
            );
        }

        // Check if this is a sleeping bag (team-based resource)
        const isSleepingBag = resource.name.toLowerCase().includes('bag') || 
                             resource.name.toLowerCase().includes('sleep') ||
                             resource.category === 'accommodation';
        
        let claimTransaction;
        
        if (isSleepingBag && userRecord.teamId) {
            // For sleeping bags, check if any team member has claimed it
            const teamMembers = await User.find({ 
                teamId: userRecord.teamId,
                role: 'participant'
            }).select('_id');
            
            const teamMemberIds = teamMembers.map(m => m._id);
            
            claimTransaction = await Transaction.findOne({
                userId: { $in: teamMemberIds },
                resourceId: resource._id,
                action: 'claim'
            });
            
            if (!claimTransaction) {
                return NextResponse.json(
                    { message: `No active claim found. Your team "${userRecord.teamId}" has not claimed ${resource.name}.` },
                    { status: 400 }
                );
            }
        } else {
            // For non-sleeping bag resources, check individual participant claim
            claimTransaction = await Transaction.findOne({
                userId: userRecord._id,
                resourceId: resource._id,
                action: 'claim'
            });

            if (!claimTransaction) {
                return NextResponse.json(
                    { message: `No active claim found. This participant has not claimed ${resource.name}.` },
                    { status: 400 }
                );
            }
        }

        // Check if already returned (team-based for sleeping bags)
        let returnTransaction;
        
        if (isSleepingBag && userRecord.teamId) {
            // For sleeping bags, check if any team member has returned it
            const teamMembers = await User.find({ 
                teamId: userRecord.teamId,
                role: 'participant'
            }).select('_id');
            
            const teamMemberIds = teamMembers.map(m => m._id);
            
            returnTransaction = await Transaction.findOne({
                userId: { $in: teamMemberIds },
                resourceId: resource._id,
                action: 'return'
            });
            
            if (returnTransaction) {
                return NextResponse.json(
                    { message: `Already returned: ${resource.name} was already returned by your team "${userRecord.teamId}".` },
                    { status: 400 }
                );
            }
        } else {
            // For non-sleeping bag resources, check individual participant return
            returnTransaction = await Transaction.findOne({
                userId: userRecord._id,
                resourceId: resource._id,
                action: 'return'
            });

            if (returnTransaction) {
                return NextResponse.json(
                    { message: `Already returned: ${resource.name} was already returned by this participant.` },
                    { status: 400 }
                );
            }
        }

        // Decrement distributed quantity
        if (resource.distributedQuantity > 0) {
            resource.distributedQuantity -= 1;
            await resource.save();
        }

        // Create return transaction
        const transaction = await Transaction.create({
            userId: userRecord._id,
            resourceId: resource._id,
            volunteerId: user.userId,
            action: 'return',
        });

        return NextResponse.json({
            message: 'Return successful',
            transaction,
            memberName: userRecord.name,
            claimedAt: claimTransaction.timestamp,
            returnedAt: transaction.timestamp
        });
    } catch (error: any) {
        return NextResponse.json(
            { message: error.message },
            { status: 500 }
        );
    }
}


