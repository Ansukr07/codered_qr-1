import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import supabase from '@/lib/config/supabase';

const JWT_SECRET = process.env.JWT_SECRET;

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

        const normalizedEmail = String(email).trim().toLowerCase();
        const { data: authData, error: otpError } = await supabase.auth.verifyOtp({
            email: normalizedEmail,
            token: otp,
            type: 'email'
        });

        if (otpError || !authData.user) {
            return NextResponse.json(
                { message: 'Invalid or expired OTP' },
                { status: 401 }
            );
        }

        const [{ data: participant }, { data: admin }, { data: volunteer }] = await Promise.all([
            supabase.from('participants').select('*').eq('email', normalizedEmail).maybeSingle(),
            supabase.from('admins').select('id, name, email').eq('email', normalizedEmail).maybeSingle(),
            supabase.from('volunteers').select('id, name, email, qr_code').eq('email', normalizedEmail).maybeSingle(),
        ]);

        const account = participant || admin || volunteer;
        if (!account) {
            return NextResponse.json({ message: 'Registered account not found' }, { status: 404 });
        }

        const role = participant ? 'participant' : admin ? 'admin' : 'volunteer';

        if (participant && !participant.is_email_verified) {
            await supabase
                .from('participants')
                .update({ is_email_verified: true })
                .eq('id', participant.id);
        }

        // Generate JWT token
        if (!JWT_SECRET) {
            throw new Error('JWT_SECRET is required in production');
        }

        const token = jwt.sign(
            {
                userId: account.id,
                role,
                name: account.name,
                email: account.email
            },
            JWT_SECRET,
            { expiresIn: '1d' }
        );

        const response = NextResponse.json({
            message: 'Login successful',
            user: {
                name: account.name,
                role,
                email: account.email,
                ...(participant ? {
                    participantId: participant.participant_id,
                    onboardingCompleted: participant.onboarding_completed === true && Boolean(participant.github_profile || participant.linkedin_url || participant.portfolio_url),
                    avatarKey: participant.avatar_key || 'byte',
                    username: participant.username || null
                } : {}),
                ...(volunteer ? { qrCode: volunteer.qr_code } : {})
            }
        });

        response.cookies.set('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            // Next.js cookies.set takes maxAge in SECONDS (not ms).
            maxAge: 24 * 60 * 60, // 1 day
            path: '/',
            sameSite: 'lax',
        });

        // Keep the Supabase session available for future server-side Auth calls.
        if (authData.session?.access_token) {
            response.cookies.set('sb-access-token', authData.session.access_token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                maxAge: authData.session.expires_in || 3600,
                path: '/',
                sameSite: 'lax'
            });
        }

        return response;
    } catch (error: any) {
        console.error('OTP verification error:', error);
        return NextResponse.json(
            { message: error.message },
            { status: 500 }
        );
    }
}
