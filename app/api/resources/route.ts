import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Resource from '@/models/Resource';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export async function GET() {
    try {
        await dbConnect();
        const resources = await Resource.find({});
        return NextResponse.json({ resources });
    } catch (error: any) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        await dbConnect();
        const cookieStore = await cookies();
        const token = cookieStore.get('token');

        if (!token) {
            return NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
        }

        const decoded: any = jwt.verify(token.value, JWT_SECRET);
        if (decoded.role !== 'admin') {
            return NextResponse.json({ message: 'Not authorized' }, { status: 403 });
        }

        const { name, totalQuantity, type } = await req.json();
        const resource = await Resource.create({
            name,
            totalQuantity,
            distributedQuantity: 0,
            type,
        });

        return NextResponse.json({ message: 'Resource created', resource }, { status: 201 });
    } catch (error: any) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}
