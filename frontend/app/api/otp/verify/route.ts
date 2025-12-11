import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import supabase from '@/lib/config/supabase';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export async function POST(request: NextRequest) {
    try {
        if (!supabase) {
            return NextResponse.json(
                { message: 'Supabase is not configured. Please check your environment variables.' },
                { status: 500 }
            );
        }

        const { email, otp } = await request.json();

        if (!email || !otp) {
            return NextResponse.json(
                { message: 'Email and OTP are required' },
                { status: 400 }
            );
        }

        // Find valid OTP in Supabase
        const { data: otpRecord, error: otpError } = await supabase
            .from('otps')
            .select('*')
            .eq('email', email.toLowerCase())
            .eq('otp', otp)
            .eq('is_used', false)
            .gt('expires_at', new Date().toISOString())
            .single();

        if (otpError || !otpRecord) {
            return NextResponse.json(
                { message: 'Invalid or expired OTP' },
                { status: 401 }
            );
        }

        // Find participant in Supabase
        const { data: participant, error: participantError } = await supabase
            .from('participants')
            .select('*')
            .eq('email', email.toLowerCase())
            .single();

        if (participantError || !participant) {
            return NextResponse.json(
                { message: 'Participant not found' },
                { status: 404 }
            );
        }

        // Mark OTP as used
        await supabase
            .from('otps')
            .update({ is_used: true })
            .eq('id', otpRecord.id);

        // Mark email as verified if not already
        if (!participant.is_email_verified) {
            await supabase
                .from('participants')
                .update({ is_email_verified: true })
                .eq('id', participant.id);
        }

        // Generate JWT token
        const token = jwt.sign(
            {
                userId: participant.id,
                role: 'participant',
                name: participant.name,
                email: participant.email
            },
            JWT_SECRET,
            { expiresIn: '1d' }
        );

        const response = NextResponse.json({
            message: 'Login successful',
            user: {
                name: participant.name,
                role: 'participant',
                email: participant.email,
                participantId: participant.participant_id
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
        console.error('OTP verification error:', error);
        return NextResponse.json(
            { message: error.message },
            { status: 500 }
        );
    }
}

