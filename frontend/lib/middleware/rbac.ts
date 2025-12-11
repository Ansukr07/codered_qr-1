import { NextRequest, NextResponse } from 'next/server';
import { AuthUser, getAuthUser } from './auth';

/**
 * Require specific role(s) - checks if user has one of the allowed roles
 */
export function requireRole(
    request: NextRequest,
    allowedRoles: string[]
): { user: AuthUser } | NextResponse {
    const user = getAuthUser(request);
    
    if (!user) {
        return NextResponse.json(
            { message: 'Not authenticated. Please log in.' },
            { status: 401 }
        );
    }
    
    if (!allowedRoles.includes(user.role)) {
        return NextResponse.json(
            { message: 'Access denied. Insufficient permissions.' },
            { status: 403 }
        );
    }
    
    return { user };
}

/**
 * Require authentication - returns user or sends 401 response
 */
export function requireAuth(request: NextRequest): { user: AuthUser } | NextResponse {
    const user = getAuthUser(request);
    
    if (!user) {
        return NextResponse.json(
            { message: 'Not authenticated. Please log in.' },
            { status: 401 }
        );
    }
    
    return { user };
}

