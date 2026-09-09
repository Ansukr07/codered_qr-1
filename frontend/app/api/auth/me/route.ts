import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import supabase from '@/lib/config/supabase';

const JWT_SECRET = process.env.JWT_SECRET;

export async function GET(request: NextRequest) {
    const token = request.cookies.get('token')?.value;

    if (!token) {
        return NextResponse.json(
            { user: null, authenticated: false },
            { status: 200 }
        );
    }

    try {
        if (!JWT_SECRET) return NextResponse.json({ message: 'Server authentication is not configured' }, { status: 500 });
        const decoded = jwt.verify(token, JWT_SECRET) as any;

        if (decoded.demo === true && decoded.userId === '00000000-0000-0000-0000-000000000001') {
            return NextResponse.json({ user: {
                userId: decoded.userId,
                name: 'Demo Participant',
                email: 'demo.participant@codered.local',
                role: 'participant',
                onboardingCompleted: true,
                avatarKey: 'byte',
                username: 'demo-player',
                teamId: 'DEMO-TEAM',
                participantId: 'DEMO-PLAYER',
            } });
        }

        if (!supabase) {
            return NextResponse.json(
                { message: 'Database connection error' },
                { status: 500 }
            );
        }

        let userData: any = null;

        // 1. Fetch data based on role
        if (decoded.role === 'admin') {
            let { data: admin } = await supabase
                .from('admins')
                .select('id, name, email')
                .eq('id', decoded.userId)
                .maybeSingle();

            // A deployment may still hold a valid cookie created before demo
            // accounts were reseeded. Recover the account using the email that
            // is already protected by the signed JWT, then return its current ID.
            if (!admin && decoded.email) {
                const result = await supabase
                    .from('admins')
                    .select('id, name, email')
                    .ilike('email', decoded.email)
                    .maybeSingle();
                admin = result.data;
            }

            if (admin) {
                userData = {
                    userId: admin.id,
                    name: admin.name,
                    email: admin.email,
                    role: 'admin',
                };
            }
        } else if (decoded.role === 'volunteer') {
            let { data: volunteer } = await supabase
                .from('volunteers')
                .select('id, name, email, qr_code')
                .eq('id', decoded.userId)
                .maybeSingle();

            if (!volunteer && decoded.email) {
                const result = await supabase
                    .from('volunteers')
                    .select('id, name, email, qr_code')
                    .ilike('email', decoded.email)
                    .maybeSingle();
                volunteer = result.data;
            }

            if (volunteer) {
                userData = {
                    userId: volunteer.id,
                    name: volunteer.name,
                    email: volunteer.email,
                    role: 'volunteer',
                    qrCode: volunteer.qr_code
                };
            }
        } else if (decoded.role === 'participant') {
            const { data: participant, error } = await supabase
                .from('participants')
                .select('*')
                .eq('id', decoded.userId)
                .single();

            if (participant && !error) {
                userData = {
                    userId: participant.id,
                    name: participant.name,
                    email: participant.email,
                    role: 'participant',
                    qrCode: participant.qr_code,
                    teamId: participant.team_id,
                    participantId: participant.participant_id,
                    track: participant.track,
                    hall: participant.hall,
                    seatNumber: participant.seat_number,
                    onboardingCompleted: participant.onboarding_completed === true && Boolean(participant.github_profile || participant.linkedin_url || participant.portfolio_url),
                    avatarKey: participant.avatar_key || 'byte',
                    username: participant.username || null
                };
            } else if (process.env.NODE_ENV !== 'production' && error?.message?.toLowerCase().includes('fetch failed')) {
                // Local development fallback: the JWT was already verified with
                // JWT_SECRET, so preserve the existing session while Supabase is
                // temporarily unreachable. Production always requires the DB.
                userData = {
                    userId: decoded.userId,
                    name: decoded.name || 'Participant',
                    email: decoded.email,
                    role: 'participant',
                    onboardingCompleted: true,
                    avatarKey: 'byte',
                    username: null,
                };
            }
        }

        if (!userData) {
            return NextResponse.json(
                { message: 'User not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({ user: userData });
    } catch (error: any) {
        console.error('Error in /me endpoint:', error);
        return NextResponse.json(
            { message: 'Invalid token' },
            { status: 401 }
        );
    }
}
