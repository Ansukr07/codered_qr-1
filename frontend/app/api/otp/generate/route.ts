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

        // Check if participant exists with this email in Supabase
        const { data: participant, error: participantError } = await supabase
            .from('participants')
            .select('*')
            .eq('email', email.toLowerCase())
            .single();

        if (participantError || !participant) {
            return NextResponse.json(
                { message: 'No participant found with this email' },
                { status: 404 }
            );
        }

        // Supabase Auth owns OTP generation, rate limiting, expiry, and email delivery.
        const { error: otpError } = await supabase.auth.signInWithOtp({
            email: email.toLowerCase(),
            // The participant table is checked above, so only known participants
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

