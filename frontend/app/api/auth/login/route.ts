import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import Admin from '@/lib/models/Admin';
import Volunteer from '@/lib/models/Volunteer';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

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
        const { email, password, role } = await request.json();

        if (!email || !password) {
            return NextResponse.json(
                { message: 'Email and password are required' },
                { status: 400 }
            );
        }

        let user: any;
        let userRole: string;

        // Check based on role parameter or try all
        if (role === 'admin') {
            user = await Admin.findOne({ email: email.toLowerCase() });
            userRole = 'admin';
        } else if (role === 'volunteer') {
            user = await Volunteer.findOne({ email: email.toLowerCase() });
            userRole = 'volunteer';
        } else {
            // Try admin first, then volunteer
            user = await Admin.findOne({ email: email.toLowerCase() });
            if (user) {
                userRole = 'admin';
            } else {
                user = await Volunteer.findOne({ email: email.toLowerCase() });
                if (user) {
                    userRole = 'volunteer';
                }
            }
        }

        if (!user) {
            return NextResponse.json(
                { message: 'Invalid credentials' },
                { status: 401 }
            );
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return NextResponse.json(
                { message: 'Invalid credentials' },
                { status: 401 }
            );
        }

        const token = jwt.sign(
            { userId: user._id.toString(), role: userRole, name: user.name, email: user.email },
            JWT_SECRET,
            { expiresIn: '1d' }
        );

        const response = NextResponse.json({
            message: 'Login successful',
            user: {
                name: user.name,
                role: userRole,
                email: user.email
            }
        });

        response.cookies.set('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 24 * 60 * 60 * 1000, // 1 day
            path: '/',
            sameSite: 'lax',
        });

        return response;
    } catch (error: any) {
        return NextResponse.json(
            { message: error.message },
            { status: 500 }
        );
    }
}


