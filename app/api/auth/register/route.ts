import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

export async function POST(req: Request) {
    try {
        await dbConnect();
        const { name, email, password, role, teamId } = await req.json();

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return NextResponse.json({ message: 'User already exists' }, { status: 400 });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const qrCode = uuidv4();

        const user = await User.create({
            name,
            email,
            password: hashedPassword,
            role: role || 'participant',
            teamId,
            qrCode,
        });

        return NextResponse.json({ message: 'User created successfully', user }, { status: 201 });
    } catch (error: any) {
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}
