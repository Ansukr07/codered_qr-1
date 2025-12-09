'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react'
import { extractIdFromQr } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/contexts/AuthContext'

function VerifyContent() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const { user, loading } = useAuth()

    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
    const [message, setMessage] = useState('Verifying...')
    const [memberData, setMemberData] = useState<any>(null)

    // Removed local extractIdFromQr definition

    const rawId = searchParams.get('id')
    const id = rawId ? extractIdFromQr(rawId) : null

    useEffect(() => {
        if (!loading) {
            if (!user || (user.role !== 'volunteer' && user.role !== 'admin')) {
                // Redirect to login if not authenticated as volunteer/admin
                // Pass the return URL so they come back to this verification page
                router.push(`/login?returnUrl=/verify?id=${id || ''}`)
                return
            }

            if (id) {
                verifyId(id)
            } else {
                setStatus('error')
                setMessage('No ID provided in the URL.')
            }
        }
    }, [id, user, loading, router])

    const verifyId = async (participantId: string) => {
        try {
            const res = await fetch('/api/scan/verify-participant', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ qr_code: participantId })
            })

            const data = await res.json()

            if (res.ok) {
                setStatus('success')
                setMessage('Verification Successful')
                setMemberData(data.user)
            } else {
                setStatus('error')
                setMessage(data.message || 'Verification Failed')
            }

        } catch (error) {
            console.error(error)
            setStatus('error')
            setMessage('An error occurred during verification.')
        }
    }

    if (loading) {
        return (
            <div className="flex justify-center p-8">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        )
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle className="text-center">Participant Verification</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col items-center space-y-4">
                    {status === 'loading' && (
                        <div className="flex flex-col items-center">
                            <Loader2 className="h-12 w-12 animate-spin text-primary mb-2" />
                            <p>{message}</p>
                        </div>
                    )}

                    {status === 'success' && (
                        <div className="flex flex-col items-center text-center space-y-2">
                            <CheckCircle2 className="h-16 w-16 text-green-500" />
                            <h2 className="text-xl font-bold text-green-500">{message}</h2>
                            {memberData && (
                                <div className="bg-secondary/50 p-4 rounded-lg w-full mt-4 text-left">
                                    <p><span className="font-semibold">Name:</span> {memberData.name}</p>
                                    <p><span className="font-semibold">Team:</span> {memberData.teamId}</p>
                                    <p><span className="font-semibold">Track:</span> {memberData.track}</p>
                                    <p><span className="font-semibold">Code:</span> {memberData.qrCode}</p>
                                </div>
                            )}
                        </div>
                    )}

                    {status === 'error' && (
                        <div className="flex flex-col items-center text-center space-y-2">
                            <XCircle className="h-16 w-16 text-destructive" />
                            <h2 className="text-xl font-bold text-destructive">{message}</h2>
                        </div>
                    )}

                    <Button className="w-full" onClick={() => router.push('/volunteer')}>
                        Back to Dashboard
                    </Button>
                </CardContent>
            </Card>
        </div>
    )
}

export default function VerifyPage() {
    return (
        <Suspense fallback={<div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>}>
            <VerifyContent />
        </Suspense>
    )
}
