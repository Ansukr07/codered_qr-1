'use client'

import { useState, useEffect, createContext, useContext, ReactNode } from 'react'
import { useRouter } from 'next/navigation'

interface User {
    userId: string
    name: string
    role: 'admin' | 'volunteer' | 'participant'
    email?: string
}

interface AuthContextType {
    user: User | null
    loading: boolean
    login: (email: string, password: string, role?: string) => Promise<void>
    register: (name: string, email: string, password: string, role: string, teamId?: string) => Promise<any>
    logout: (redirectPath?: string) => Promise<void>
    refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null)
    const [loading, setLoading] = useState(true)
    const router = useRouter()

    const refreshUser = async () => {
        try {
            const res = await fetch('/api/auth/me')
            if (res.ok) {
                const data = await res.json()
                setUser(data.user)
            } else {
                setUser(null)
            }
        } catch (error) {
            setUser(null)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        refreshUser()
    }, [])

    const login = async (email: string, password: string, role?: string) => {
        const res = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password, role }),
        })

        if (!res.ok) {
            const data = await res.json()
            throw new Error(data.message || 'Login failed')
        }

        const data = await res.json()
        await refreshUser()

        // Redirect based on role
        const userData = data.user
        if (userData.role === 'admin') {
            router.push('/admin')
        } else if (userData.role === 'volunteer') {
            router.push('/volunteer')
        } else {
            router.push('/participant')
        }
    }

    const register = async (name: string, email: string, password: string, role: string, teamId?: string) => {
        const res = await fetch('/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, password, role, teamId }),
        })

        if (!res.ok) {
            const data = await res.json()
            throw new Error(data.message || 'Registration failed')
        }

        return await res.json()
    }

    const logout = async (redirectPath: string = '/login') => {
        try {
            await fetch('/api/auth/logout', {
                method: 'POST',
            })
        } catch (error) {
            console.error('Logout error:', error)
        } finally {
            setUser(null)
            router.push(redirectPath)
        }
    }

    return (
        <AuthContext.Provider value={{ user, loading, login, register, logout, refreshUser }}>
            {children}
        </AuthContext.Provider>
    )
}

export function useAuth() {
    const context = useContext(AuthContext)
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider')
    }
    return context
}
