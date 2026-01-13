import { NextRequest, NextResponse } from 'next/server';
import supabase from '@/lib/config/supabase';
import { requireRole } from '@/lib/middleware/rbac';

export async function GET(request: NextRequest) {
    try {
        if (!supabase) {
            return NextResponse.json({ message: 'Database connection error' }, { status: 500 });
        }

        const authResult = requireRole(request, ['admin']);
        if (authResult instanceof NextResponse) {
            return authResult;
        }

        const { searchParams } = new URL(request.url);
        const role = searchParams.get('role');

        let users: any[] = [];

        if (role === 'admin') {
            const { data, error } = await supabase.from('admins').select('id, name, email').order('created_at', { ascending: false });
            if (error) throw error;
            users = data.map(u => ({ ...u, role: 'admin' }));
        } else if (role === 'volunteer') {
            const { data, error } = await supabase.from('volunteers').select('id, name, email').order('created_at', { ascending: false });
            if (error) throw error;
            users = data.map(u => ({ ...u, role: 'volunteer' }));
        } else if (role === 'participant') {
            const { data, error } = await supabase.from('participants').select('id, name, email, team_id, qr_code').order('created_at', { ascending: false });
            if (error) throw error;
            users = data.map(u => ({ ...u, role: 'participant' }));
        } else {
            // Fetch all if no role specified (though role is usually expected)
            const [admins, volunteers, participants] = await Promise.all([
                supabase.from('admins').select('id, name, email'),
                supabase.from('volunteers').select('id, name, email'),
                supabase.from('participants').select('id, name, email, team_id, qr_code')
            ]);
            users = [
                ...(admins.data || []).map(u => ({ ...u, role: 'admin' })),
                ...(volunteers.data || []).map(u => ({ ...u, role: 'volunteer' })),
                ...(participants.data || []).map(u => ({ ...u, role: 'participant' }))
            ].sort((a, b) => b.name.localeCompare(a.name));
        }

        return NextResponse.json({ users });
    } catch (error: any) {
        console.error('Admin users error:', error);
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}


