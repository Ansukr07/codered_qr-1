import { NextRequest, NextResponse } from 'next/server';
import supabase from '@/lib/config/supabase';
import { sendOTPEmail } from '@/lib/config/email';

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

        // Generate 6-digit OTP
        const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        // Invalidate any existing OTPs for this email
        await supabase
            .from('otps')
            .update({ is_used: true })
            .eq('email', email.toLowerCase())
            .eq('is_used', false);

        // Create new OTP in Supabase
        const { error: otpError } = await supabase
            .from('otps')
            .insert({
                email: email.toLowerCase(),
                otp: otpCode,
                expires_at: expiresAt.toISOString(),
                is_used: false
            });

        if (otpError) {
            console.error('Error creating OTP:', otpError);
            return NextResponse.json(
                { message: 'Failed to generate OTP' },
                { status: 500 }
            );
        }

        // Send OTP via email
        const emailResult = await sendOTPEmail(email, otpCode, participant.name);
        
        // In development, also return OTP in response for testing
        const response: any = {
            message: emailResult.success 
                ? 'OTP sent to your email' 
                : 'OTP generated (email failed, check console)',
        };

        // Only include OTP in response for development
        if (process.env.NODE_ENV === 'development') {
            response.otp = otpCode;
        }

        return NextResponse.json(response);
    } catch (error: any) {
        console.error('OTP generation error:', error);
        return NextResponse.json(
            { message: error.message },
            { status: 500 }
        );
    }
}

