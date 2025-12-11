import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export interface AuthUser {
    userId: string;
    role: string;
    name?: string;
    email?: string;
}

/**
 * Authentication Middleware for Next.js API routes
 * Verifies JWT token from cookies and returns user info
 */
export function getAuthUser(request: NextRequest): AuthUser | null {
    try {
        const token = request.cookies.get('token')?.value;

        if (!token) {
            return null;
        }

        // Verify and decode token
        const decoded = jwt.verify(token, JWT_SECRET) as AuthUser;
        return decoded;
    } catch (error: any) {
        if (error.name === 'TokenExpiredError') {
            return null;
        }
        return null;
    }
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

