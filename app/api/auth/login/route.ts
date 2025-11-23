import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { serialize } from 'cookie';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export async function POST(req: Request) {
    try {
        await dbConnect();
        const { email, password } = await req.json();

        const user = await User.findOne({ email });
        if (!user) {
            return NextResponse.json({ message: 'Invalid credentials' }, { status: 401 });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return NextResponse.json({ message: 'Invalid credentials' }, { status: 401 });
        }

        const token = jwt.sign(
            { userId: user._id, role: user.role, name: user.name },
            JWT_SECRET,
            { expiresIn: '1d' }
        );

        const cookie = serialize('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 60 * 60 * 24, // 1 day
            path: '/',
        });

        const response = NextResponse.json({ message: 'Login successful', user: { name: user.name, role: user.role } });
        response.headers.set('Set-Cookie', cookie);

        return response;
    } catch (error: any) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}
