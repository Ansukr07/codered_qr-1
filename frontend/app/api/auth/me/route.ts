import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import Admin from '@/lib/models/Admin';
import Volunteer from '@/lib/models/Volunteer';
import supabase from '@/lib/config/supabase';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Connect to MongoDB if not already connected
async function connectDB() {
    if (mongoose.connections[0].readyState) return;
    const mongoUri = process.env.MONGODB_URI;
    if (mongoUri) {
        await mongoose.connect(mongoUri);
    }
}

export async function GET(request: NextRequest) {
    const token = request.cookies.get('token')?.value;

    if (!token) {
        return NextResponse.json(
            { message: 'Not authenticated' },
            { status: 401 }
        );
    }

    try {
        await connectDB();
        const decoded = jwt.verify(token, JWT_SECRET) as any;
        let user: any;
        let userData: any;

        // Find user based on role
        if (decoded.role === 'admin') {
            user = await Admin.findById(decoded.userId).select('-password');
            if (!user) {
                return NextResponse.json(
                    { message: 'User not found' },
                    { status: 404 }
                );
            }
            userData = {
                userId: user._id.toString(),
                name: user.name,
                email: user.email,
                role: decoded.role,
            };
            if (user.teamId) {
                userData.teamId = user.teamId;
            }
        } else if (decoded.role === 'volunteer') {
            user = await Volunteer.findById(decoded.userId).select('-password');
            if (!user) {
                return NextResponse.json(
                    { message: 'User not found' },
                    { status: 404 }
                );
            }
            userData = {
                userId: user._id.toString(),
                name: user.name,
                email: user.email,
                role: decoded.role,
            };
            if (user.qrCode) {
                userData.qrCode = user.qrCode;
            }
            if (user.teamId) {
                userData.teamId = user.teamId;
            }
        } else if (decoded.role === 'participant') {
            // Use Supabase for participants
            if (supabase) {
                const { data: participant, error } = await supabase
                    .from('participants')
                    .select('*')
                    .eq('id', decoded.userId)
                    .single();

                if (error || !participant) {
                    console.error('Error fetching participant from Supabase:', error);
                    return NextResponse.json(
                        { message: 'Participant not found' },
                        { status: 404 }
                    );
                }

                userData = {
                    userId: participant.id,
                    name: participant.name,
                    email: participant.email,
                    role: decoded.role,
                };

                if (participant.qr_code) {
                    userData.qrCode = participant.qr_code;
                }
                if (participant.team_id) {
                    userData.teamId = participant.team_id;
                }
                if (participant.participant_id) {
                    userData.participantId = participant.participant_id;
                }
            } else {
                return NextResponse.json(
                    { message: 'Supabase not configured' },
                    { status: 500 }
                );
            }
        } else {
            return NextResponse.json(
                { message: 'Unknown user role' },
                { status: 400 }
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


