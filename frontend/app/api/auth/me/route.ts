import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import supabase from '@/lib/config/supabase';

const JWT_SECRET = process.env.JWT_SECRET;

export async function GET(request: NextRequest) {
    const token = request.cookies.get('token')?.value;

    if (!token) {
        return NextResponse.json(
            { message: 'Not authenticated' },
            { status: 401 }
        );
    }

    try {
        if (!JWT_SECRET) return NextResponse.json({ message: 'Server authentication is not configured' }, { status: 500 });
        const decoded = jwt.verify(token, JWT_SECRET) as any;

        if (!supabase) {
            return NextResponse.json(
                { message: 'Database connection error' },
                { status: 500 }
            );
        }

        let userData: any = null;

        // 1. Fetch data based on role
        if (decoded.role === 'admin') {
            const { data: admin, error } = await supabase
                .from('admins')
                .select('id, name, email')
                .eq('id', decoded.userId)
                .single();

            if (admin && !error) {
                userData = {
                    userId: admin.id,
                    name: admin.name,
                    email: admin.email,
                    role: 'admin',
                };
            }
        } else if (decoded.role === 'volunteer') {
            const { data: volunteer, error } = await supabase
                .from('volunteers')
                .select('id, name, email, qr_code')
                .eq('id', decoded.userId)
                .single();

            if (volunteer && !error) {
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
                    seatNumber: participant.seat_number
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

