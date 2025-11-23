import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import dbConnect from '@/lib/db';
import User from '@/models/User';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export async function GET() {
    const cookieStore = await cookies();
    const token = cookieStore.get('token');

    if (!token) {
        return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
    }

    try {
        const decoded: any = jwt.verify(token.value, JWT_SECRET);

        // Fetch full user details from database including QR code
        await dbConnect();
        const user = await User.findById(decoded.userId).select('-password');

        if (!user) {
            return NextResponse.json({ message: 'User not found' }, { status: 404 });
        }

        return NextResponse.json({
            user: {
                userId: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                qrCode: user.qrCode,
                teamId: user.teamId
            }
        });
    } catch (error) {
        return NextResponse.json({ message: 'Invalid token' }, { status: 401 });
    }
}
