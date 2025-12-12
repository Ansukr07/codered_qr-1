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
        const { email, password, role } = await request.json();

        if (!email || !password) {
            return NextResponse.json(
                { message: 'Email and password are required' },
                { status: 400 }
            );
        }

        // Hardcoded volunteer login (no database required)
        const VOLUNTEER_EMAIL = 'vol@vol.in';
        const VOLUNTEER_PASSWORD = 'volcom@1999';
        const VOLUNTEER_USER_ID = 'volunteer-stock-user';
        
        if (email.toLowerCase() === VOLUNTEER_EMAIL && password === VOLUNTEER_PASSWORD) {
            // Allow login if role is volunteer or not specified
            if (!role || role === 'volunteer') {
                const token = jwt.sign(
                    { 
                        userId: VOLUNTEER_USER_ID, 
                        role: 'volunteer', 
                        name: 'Volunteer User', 
                        email: VOLUNTEER_EMAIL 
                    },
                    JWT_SECRET,
                    { expiresIn: '1d' }
                );

                const response = NextResponse.json({
                    message: 'Login successful',
                    user: {
                        name: 'Volunteer User',
                        role: 'volunteer',
                        email: VOLUNTEER_EMAIL
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
            }
        }

        // For other users, connect to database
        await connectDB();
        let user: any;
        let userRole: string;

        // Allowed admin emails
        const ALLOWED_ADMIN_EMAILS = ['ecell@bmsit.in', 'milangs4606@gmail.com'];

        // Check based on role parameter or try all
        if (role === 'admin') {
            // Check if email is in whitelist for admin
            const emailLower = email.toLowerCase();
            if (!ALLOWED_ADMIN_EMAILS.includes(emailLower)) {
                return NextResponse.json(
                    { message: 'Access denied. This email is not authorized for admin access.' },
                    { status: 403 }
                );
            }
            user = await Admin.findOne({ email: emailLower });
            userRole = 'admin';
        } else if (role === 'volunteer') {
            user = await Volunteer.findOne({ email: email.toLowerCase() });
            userRole = 'volunteer';
        } else {
            // Try admin first, then volunteer
            const emailLower = email.toLowerCase();
            if (ALLOWED_ADMIN_EMAILS.includes(emailLower)) {
                user = await Admin.findOne({ email: emailLower });
                if (user) {
                    userRole = 'admin';
                }
            }
            if (!user) {
                user = await Volunteer.findOne({ email: emailLower });
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


