import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import supabase from '@/lib/config/supabase';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export async function POST(request: NextRequest) {
    try {
        const { email, password, role } = await request.json();

        if (!email || !password) {
            return NextResponse.json(
                { message: 'Email and password are required' },
                { status: 400 }
            );
        }

        const emailLower = email.toLowerCase();

        // 1. Check if Supabase is initialized
        if (!supabase) {
            return NextResponse.json(
                { message: 'Database connection error' },
                { status: 500 }
            );
        }

        let user: any = null;
        let userRole: string = '';

        // 2. Try Admin Login
        if (!role || role === 'admin') {
            const { data: admin, error: adminError } = await supabase
                .from('admins')
                .select('*')
                .eq('email', emailLower)
                .single();

            if (admin && !adminError) {
                const isMatch = await bcrypt.compare(password, admin.password);
                if (isMatch) {
                    user = admin;
                    userRole = 'admin';
                }
            }
        }

        // 3. Try Volunteer Login if no admin found
        if (!user && (!role || role === 'volunteer')) {
            const { data: volunteer, error: volunteerError } = await supabase
                .from('volunteers')
                .select('*')
                .eq('email', emailLower)
                .single();

            if (volunteer && !volunteerError) {
                const isMatch = await bcrypt.compare(password, volunteer.password);
                if (isMatch) {
                    user = volunteer;
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

        // 4. Generate JWT Token
        const token = jwt.sign(
            { 
                userId: user.id, 
                role: userRole, 
                name: user.name, 
                email: user.email 
            },
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
        console.error('Login error:', error);
        return NextResponse.json(
            { message: error.message },
            { status: 500 }
        );
    }
}


