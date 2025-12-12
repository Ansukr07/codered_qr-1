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

        const resource = await Resource.findById(resource_id);
        if (!resource) {
            return NextResponse.json(
                { message: 'Resource not found' },
                { status: 404 }
            );
        }

        // Check if this is coffee (allows multiple claims)
        const isCoffee = resource.category === 'coffee' || resource.name.toLowerCase().includes('coffee');
        const maxClaims = isCoffee ? 3 : 1;

        // Count existing claim transactions for this user and resource
        const claimCount = await Transaction.countDocuments({
            userId: userRecord._id,
            resourceId: resource._id,
            action: 'claim'
        });

        // Get the most recent transaction for display
        const lastTransaction = await Transaction.findOne({
            userId: userRecord._id,
            resourceId: resource._id,
            action: 'claim'
        }).sort({ timestamp: -1 }).populate('volunteerId', 'name');

        if (claimCount >= maxClaims) {
            return NextResponse.json({
                status: 'limit_reached',
                message: `Maximum limit reached: ${resource.name}. This participant has already claimed ${claimCount} out of ${maxClaims} allowed.`,
                member: {
                    name: userRecord.name,
                    teamId: userRecord.teamId,
                    email: userRecord.email
                },
                claimCount,
                maxClaims,
                transaction: lastTransaction ? {
                    timestamp: lastTransaction.timestamp,
                    volunteerName: lastTransaction.volunteerId ? (lastTransaction.volunteerId as any).name : 'Unknown'
                } : undefined
            });
        }

        if (claimCount > 0) {
            return NextResponse.json({
                status: 'claimed',
                message: `Already claimed: ${resource.name}. This participant can claim up to ${maxClaims} times.`,
                member: {
                    name: userRecord.name,
                    teamId: userRecord.teamId,
                    email: userRecord.email
                },
                claimCount,
                maxClaims,
                transaction: lastTransaction ? {
                    timestamp: lastTransaction.timestamp,
                    volunteerName: lastTransaction.volunteerId ? (lastTransaction.volunteerId as any).name : 'Unknown'
                } : undefined
            });
        }

        return NextResponse.json({
            status: 'allowed',
            message: 'Ready to claim',
            member: {
                name: userRecord.name,
                teamId: userRecord.teamId,
                email: userRecord.email
            },
            claimCount: 0,
            maxClaims
        });
    } catch (error: any) {
        return NextResponse.json(
            { message: error.message },
            { status: 500 }
        );
    }
}


