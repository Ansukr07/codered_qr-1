'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { QrCode, LogOut, Package, History } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/contexts/AuthContext'
import QRCodeSVG from 'react-qr-code'

interface Transaction {
    _id: string
    resourceId: { name: string }
    action: string
    timestamp: string
}

export default function ParticipantDashboard() {
    const { user, logout, loading } = useAuth()
    const router = useRouter()
    const [qrCode, setQrCode] = useState('')
    const [transactions, setTransactions] = useState<Transaction[]>([])

    useEffect(() => {
        if (!loading && (!user || user.role !== 'participant')) {
            router.push('/login')
        }
    }, [user, loading, router])

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                // Fetch full user details including QR code
                const res = await fetch('/api/auth/me')
                if (res.ok) {
                    const data = await res.json()
                    setQrCode(data.user.qrCode || '')
                }
            } catch (error) {
                console.error('Failed to fetch user data:', error)
            }
        }

        if (user) {
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
        <div className="min-h-screen bg-background p-6">
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold">Participant Dashboard</h1>
                        <p className="text-muted-foreground">Welcome, {user.name}</p>
                    </div>
                    <Button onClick={logout} variant="outline">
                        <LogOut className="mr-2 h-4 w-4" />
                        Logout
                    </Button>
                </div>

                {/* QR Code Card */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center">
                            <QrCode className="mr-2 h-5 w-5" />
                            Your QR Code
                        </CardTitle>
                        <CardDescription>
                            Show this QR code to volunteers to claim resources
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-col items-center space-y-4">
                        {qrCode ? (
                            <>
                                <div className="p-4 bg-white rounded-lg">
                                    <QRCodeSVG value={qrCode} size={200} level="H" />
                                </div>
                                <p className="text-xs text-muted-foreground font-mono">{qrCode}</p>
                            </>
                        ) : (
                            <p className="text-muted-foreground">Loading QR code...</p>
                        )}
                    </CardContent>
                </Card>

                {/* Recent Activity */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center">
                            <History className="mr-2 h-5 w-5" />
                            Recent Activity
                        </CardTitle>
                        <CardDescription>
                            Your resource claim history
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {transactions.length === 0 ? (
                            <p className="text-center text-muted-foreground py-8">
                                No activity yet. Claim resources to see them here.
                            </p>
                        ) : (
                            <div className="space-y-2">
                                {transactions.map((tx) => (
                                    <div key={tx._id} className="flex justify-between items-center p-3 bg-secondary/50 rounded-lg">
                                        <div>
                                            <p className="font-medium">{tx.resourceId.name}</p>
                                            <p className="text-xs text-muted-foreground">
                                                {new Date(tx.timestamp).toLocaleString()}
                                            </p>
                                        </div>
                                        <span className="text-xs bg-green-500/10 text-green-500 px-2 py-1 rounded">
                                            {tx.action}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
