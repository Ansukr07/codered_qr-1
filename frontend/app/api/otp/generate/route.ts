import { NextRequest, NextResponse } from 'next/server';
import supabase from '@/lib/config/supabase';

export async function POST(request: NextRequest) {
    try {
        if (!supabase) {
            return NextResponse.json(
                { message: 'Supabase is not configured. Please check your environment variables.' },
                { status: 500 }
            );
        }

        const { email } = await request.json();

        if (!email) {
            return NextResponse.json(
                { message: 'Email is required' },
                { status: 400 }
            );
        }

        const normalizedEmail = String(email).trim().toLowerCase();
        const [{ data: participant }, { data: admin }, { data: volunteer }] = await Promise.all([
            supabase.from('participants').select('id').eq('email', normalizedEmail).maybeSingle(),
            supabase.from('admins').select('id').eq('email', normalizedEmail).maybeSingle(),
            supabase.from('volunteers').select('id').eq('email', normalizedEmail).maybeSingle(),
        ]);

        if (!participant && !admin && !volunteer) {
            return NextResponse.json(
                { message: 'No registered CodeRed account found with this email' },
                { status: 404 }
            );
        }

        // Supabase Auth owns OTP generation, rate limiting, expiry, and email delivery.
        const { error: otpError } = await supabase.auth.signInWithOtp({
            email: normalizedEmail,
            // The application tables are checked above, so only registered users
            // can create a Supabase Auth identity through this endpoint.
            options: { shouldCreateUser: true }
        });

        if (otpError) {
            console.error('Supabase Auth OTP error:', otpError);
            return NextResponse.json(
                { message: 'Failed to send OTP' },
                { status: 500 }
            );
        }

        return NextResponse.json({ message: 'OTP sent to your email' });
    } catch (error: any) {
        console.error('OTP generation error:', error);
        return NextResponse.json(
            { message: error.message },
            { status: 500 }
        );
    }
}
