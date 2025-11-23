import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import Resource from '@/models/Resource';
import Transaction from '@/models/Transaction';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export async function POST(req: Request) {
    try {
        await dbConnect();
        const cookieStore = await cookies();
        const token = cookieStore.get('token');

        if (!token) {
            return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
        }

        const decoded: any = jwt.verify(token.value, JWT_SECRET);
        // Only volunteers and admins can scan
        if (decoded.role !== 'volunteer' && decoded.role !== 'admin') {
            return NextResponse.json({ message: 'Not authorized' }, { status: 403 });
        }

        const { qr_code, resource_id } = await req.json();

        const user = await User.findOne({ qrCode: qr_code });
        if (!user) {
            return NextResponse.json({ message: 'Invalid QR Code' }, { status: 404 });
        }

        const resource = await Resource.findById(resource_id);
        if (!resource) {
            return NextResponse.json({ message: 'Resource not found' }, { status: 404 });
        }

        // Check if resource is available
        if (resource.distributedQuantity >= resource.totalQuantity) {
            return NextResponse.json({ message: 'Resource out of stock' }, { status: 400 });
        }

        // DUPLICATE PREVENTION: Check if user already claimed this resource
        const existingTransaction = await Transaction.findOne({
            userId: user._id,
            resourceId: resource._id,
        });

        if (existingTransaction) {
            return NextResponse.json({
                message: `Already claimed: ${resource.name}. This resource was already distributed to this participant.`
            }, { status: 400 });
        }

        // All checks passed - proceed with distribution
        resource.distributedQuantity += 1;
        await resource.save();

        const transaction = await Transaction.create({
            userId: user._id,
            resourceId: resource._id,
            volunteerId: decoded.userId,
            action: 'claim',
        });

        return NextResponse.json({ message: 'Scan successful', transaction }, { status: 200 });
    } catch (error: any) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}
