'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, QrCode } from 'lucide-react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/contexts/AuthContext'
import QRCodeSVG from 'react-qr-code'

export default function ParticipantQRPage() {
    const { user, loading } = useAuth()
    const router = useRouter()
    const [qrCode, setQrCode] = useState('')

    useEffect(() => {
        if (!loading && (!user || user.role !== 'participant')) {
            router.push('/login')
        }
    }, [user, loading, router])

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const res = await fetch('/api/auth/me')
                if (res.ok) {
                    const data = await res.json()
                    setQrCode(data.user.qrCode || '')
                }
            } catch (error) {
                console.error('Failed to fetch user data:', error)
            }
        }

        if (user && user.role === 'participant') {
            fetchUserData()
        }
    }, [user])

    if (loading || !user) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <p>Loading...</p>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-background relative">
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff_1px,transparent_1px),linear-gradient(to_bottom,#ffffff_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-20 pointer-events-none" />

            <div className="relative z-10 p-6">
                <div className="max-w-md mx-auto space-y-6">
                    {/* Header */}
                    <div className="flex items-center gap-4">
                        <Link href="/participant">
                            <Button variant="default" size="icon">
                                <ArrowLeft className="h-4 w-4 text-white" />
                            </Button>
                        </Link>
                        <div>
                            <h1 className="text-2xl font-bold text-foreground">Your QR Code</h1>
                            <p className="text-muted-foreground">Show this to volunteers</p>
                        </div>
                    </div>

                    <Card className="border-2 border-primary/20 shadow-lg">
                        <CardHeader className="text-center">
                            <CardTitle className="flex items-center justify-center gap-2">
                                <QrCode className="h-6 w-6 text-primary" />
                                {user.name}
                            </CardTitle>
                            <CardDescription>
                                {user.email}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="flex flex-col items-center space-y-6 pb-8">
                            {qrCode ? (
                                <>
                                    <div className="p-6 bg-white rounded-xl shadow-inner">
                                        <QRCodeSVG value={qrCode} size={250} level="H" />
                                    </div>
                                    <div className="text-center space-y-1">
                                        <p className="text-sm text-muted-foreground font-mono bg-secondary/50 px-3 py-1 rounded">
                                            {qrCode}
                                        </p>
                                        <p className="text-xs text-muted-foreground mt-2">
                                            Scan this code to claim food, kits, and access areas.
                                        </p>
                                    </div>
                                </>
                            ) : (
                                <div className="py-12 text-muted-foreground">Loading QR code...</div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
