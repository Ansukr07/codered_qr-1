import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import supabase from '@/lib/config/supabase';
import { requireRole } from '@/lib/middleware/rbac';

// Create an admin or volunteer account. Admin-only.
// Self-registration of elevated roles is blocked elsewhere; this endpoint is
// the canonical way an existing admin onboards new staff.
export async function POST(request: NextRequest) {
    try {
        if (!supabase) {
            return NextResponse.json({ message: 'Database connection error' }, { status: 500 });
        }

        const authResult = requireRole(request, ['admin']);
        if (authResult instanceof NextResponse) {
            return authResult;
        }

        const { name, email, password, role } = await request.json();

        if (!name || !email || !password || !role) {
            return NextResponse.json({ message: 'All fields are required' }, { status: 400 });
        }

        if (role !== 'admin' && role !== 'volunteer') {
            return NextResponse.json(
                { message: 'Invalid role. Only admin and volunteer accounts can be created here.' },
                { status: 400 }
            );
        }

        const normalizedEmail = String(email).toLowerCase().trim();
        const table = role === 'admin' ? 'admins' : 'volunteers';

        // Ensure the email is not already taken in either staff table — a single
        // person should not be both admin and volunteer, and JWT lookups assume
        // emails are unique per role.
        const [{ data: existingAdmin }, { data: existingVolunteer }] = await Promise.all([
            supabase.from('admins').select('id').eq('email', normalizedEmail).maybeSingle(),
            supabase.from('volunteers').select('id').eq('email', normalizedEmail).maybeSingle(),
        ]);

        if (existingAdmin || existingVolunteer) {
            return NextResponse.json(
                { message: 'User with this email already exists' },
                { status: 400 }
            );
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        // The `volunteers` table has a `qr_code` column (volunteers scan into
        // resources via their own QR), but `admins` does not. Build the insert
        // payload conditionally so Postgres doesn't reject an unknown column.
        const insertPayload: Record<string, unknown> = {
            name,
            email: normalizedEmail,
            password: hashedPassword,
        };
        const selectColumns = role === 'volunteer' ? 'id, name, email, qr_code' : 'id, name, email';
        if (role === 'volunteer') {
            insertPayload.qr_code = uuidv4();
        }

        const { data: created, error } = await supabase
            .from(table)
            .insert(insertPayload)
            .select(selectColumns)
            .single();

        if (error) {
            console.error(`Create ${role} error:`, error);
            return NextResponse.json({ message: error.message }, { status: 500 });
        }

        return NextResponse.json(
            {
                message: 'User created successfully',
                user: {
                    id: (created as any)?.id,
                    name: (created as any)?.name,
                    email: (created as any)?.email,
                    role,
                    qrCode: (created as any)?.qr_code ?? null,
                },
            },
            { status: 201 }
        );
    } catch (error: any) {
        console.error('Create user error:', error);
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}
