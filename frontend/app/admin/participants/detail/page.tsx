'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ArrowLeft, User, Mail, Hash, QrCode, History, HelpCircle, Package } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import Link from 'next/link'

interface Transaction {
    _id: string
    resourceId: { name: string; type: string }
    action: string
    timestamp: string
    volunteerId?: { name: string }
}

interface HelpRequest {
    _id: string
    description: string
    category: string
    priority: string
    status: string
    createdAt: string
    resolvedBy?: { name: string }
    resolvedAt?: string
}

interface Participant {
    _id: string
    name: string
    email: string
    teamId?: string
    qrCode: string
    resourcesClaimed: number
    createdAt: string
}

export default function ParticipantDetailPage() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const participantId = searchParams.get('id')

    const [participant, setParticipant] = useState<Participant | null>(null)
    const [transactions, setTransactions] = useState<Transaction[]>([])
    const [helpRequests, setHelpRequests] = useState<HelpRequest[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (participantId) {
            fetchParticipantDetails()
        }
    }, [participantId])

    const fetchParticipantDetails = async () => {
        try {
            // Fetch participant info
            const participantRes = await fetch(`/api/admin/participants/${participantId}`)
            if (participantRes.ok) {
                const data = await participantRes.json()
                setParticipant(data.participant)
            }

            // Fetch transactions
            const transactionsRes = await fetch(`/api/admin/participants/${participantId}/transactions`)
            if (transactionsRes.ok) {
                const data = await transactionsRes.json()
                setTransactions(data.transactions)
            }

            // Fetch help requests
            const helpRes = await fetch(`/api/admin/participants/${participantId}/help-requests`)
            if (helpRes.ok) {
                const data = await helpRes.json()
                setHelpRequests(data.helpRequests)
            }
        } catch (error) {
            console.error('Failed to fetch participant details:', error)
        } finally {
            setLoading(false)
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <p>Loading participant details...</p>
            </div>
        )
    }

    if (!participant) {
        return (
            <div className="space-y-4">
                <Link href="/admin/participants">
                    <Button variant="default" className="gap-2">
                        <ArrowLeft className="h-4 w-4" />
                        Back to Participants
                    </Button>
                </Link>
                <p className="text-center text-muted-foreground">Participant not found</p>
            </div>
        )
    }

    const foodTransactions = transactions.filter(t =>
        t.resourceId.name.toLowerCase().includes('lunch') ||
        t.resourceId.name.toLowerCase().includes('dinner') ||
        t.resourceId.name.toLowerCase().includes('breakfast') ||
        t.resourceId.name.toLowerCase().includes('food')
    )
    const bagTransactions = transactions.filter(t =>
        t.resourceId.name.toLowerCase().includes('bag') ||
        t.resourceId.name.toLowerCase().includes('sleep')
    )
    const chillTransactions = transactions.filter(t =>
        t.resourceId.name.toLowerCase().includes('chill')
    )

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Link href="/admin/participants">
                    <Button variant="default" size="sm" className="gap-2">
                        <ArrowLeft className="h-4 w-4" />
                        Back
                    </Button>
                </Link>
                <div>
                    <h1 className="text-3xl font-bold text-foreground">Participant Details</h1>
                    <p className="text-muted-foreground">Complete history and information</p>
                </div>
            </div>

            {/* Participant Info Card */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <User className="h-5 w-5" />
                        {participant.name}
                    </CardTitle>
                    <CardDescription>Registered on {new Date(participant.createdAt).toLocaleDateString()}</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                                <Mail className="h-4 w-4" />
                                Email
                            </div>
                            <p className="text-sm font-medium text-card-foreground">{participant.email}</p>
                        </div>
                        <div>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                                <Hash className="h-4 w-4" />
                                Team ID
                            </div>
                            <p className="text-sm font-medium text-card-foreground">
                                {participant.teamId || '-'}
                            </p>
                        </div>
                        <div>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                                <QrCode className="h-4 w-4" />
                                QR Code
                            </div>
                            <p className="text-sm font-medium font-mono text-card-foreground">{participant.qrCode}</p>
                        </div>
                        <div>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                                <Package className="h-4 w-4" />
                                Resources Claimed
                            </div>
                            <Badge variant="default" className="text-sm">{participant.resourcesClaimed}</Badge>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                    <CardHeader className="pb-3">
                        <CardDescription>Food Claims</CardDescription>
                        <CardTitle className="text-3xl text-foreground">{foodTransactions.length}</CardTitle>
                    </CardHeader>
                </Card>
                <Card>
                    <CardHeader className="pb-3">
                        <CardDescription>Sleeping Bags</CardDescription>
                        <CardTitle className="text-3xl text-foreground">{bagTransactions.length}</CardTitle>
                    </CardHeader>
                </Card>
                <Card>
                    <CardHeader className="pb-3">
                        <CardDescription>Chill Room Access</CardDescription>
                        <CardTitle className="text-3xl text-foreground">{chillTransactions.length}</CardTitle>
                    </CardHeader>
                </Card>
                <Card>
                    <CardHeader className="pb-3">
                        <CardDescription>Help Requests</CardDescription>
                        <CardTitle className="text-3xl text-foreground">{helpRequests.length}</CardTitle>
                    </CardHeader>
                </Card>
            </div>

            {/* Detailed History Tabs */}
            <Tabs defaultValue="all" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="all">
                        All Activity ({transactions.length})
                    </TabsTrigger>
                    <TabsTrigger value="food">
                        Food ({foodTransactions.length})
                    </TabsTrigger>
                    <TabsTrigger value="bags">
                        Sleeping Bags ({bagTransactions.length})
                    </TabsTrigger>
                    <TabsTrigger value="chill">
                        Chill Room ({chillTransactions.length})
                    </TabsTrigger>
                    <TabsTrigger value="help">
                        Help Requests ({helpRequests.length})
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="all">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <History className="h-5 w-5" />
                                All Activity
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {transactions.length === 0 ? (
                                <p className="text-center text-muted-foreground py-8">No activity yet</p>
                            ) : (
                                <div className="space-y-2">
                                    {transactions.map((tx) => (
                                        <div key={tx._id} className="flex justify-between items-center p-3 bg-secondary/50 rounded-lg">
                                            <div>
                                                <p className="font-medium text-card-foreground">{tx.resourceId.name}</p>
                                                <p className="text-xs text-muted-foreground">
                                                    {new Date(tx.timestamp).toLocaleString()}
                                                    {tx.volunteerId && ` • By ${tx.volunteerId.name}`}
                                                </p>
                                            </div>
                                            <Badge variant="default">{tx.action}</Badge>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="food">
                    <Card>
                        <CardHeader>
                            <CardTitle>Food Claims History</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {foodTransactions.length === 0 ? (
                                <p className="text-center text-muted-foreground py-8">No food claims yet</p>
                            ) : (
                                <div className="space-y-2">
                                    {foodTransactions.map((tx) => (
                                        <div key={tx._id} className="flex justify-between items-center p-3 bg-secondary/50 rounded-lg">
                                            <div>
                                                <p className="font-medium text-card-foreground">{tx.resourceId.name}</p>
                                                <p className="text-xs text-muted-foreground">
                                                    {new Date(tx.timestamp).toLocaleString()}
                                                    {tx.volunteerId && ` • By ${tx.volunteerId.name}`}
                                                </p>
                                            </div>
                                            <Badge variant="default">{tx.action}</Badge>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="bags">
                    <Card>
                        <CardHeader>
                            <CardTitle>Sleeping Bag Claims</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {bagTransactions.length === 0 ? (
                                <p className="text-center text-muted-foreground py-8">No sleeping bag claims yet</p>
                            ) : (
                                <div className="space-y-2">
                                    {bagTransactions.map((tx) => (
                                        <div key={tx._id} className="flex justify-between items-center p-3 bg-secondary/50 rounded-lg">
                                            <div>
                                                <p className="font-medium text-card-foreground">{tx.resourceId.name}</p>
                                                <p className="text-xs text-muted-foreground">
                                                    {new Date(tx.timestamp).toLocaleString()}
                                                    {tx.volunteerId && ` • By ${tx.volunteerId.name}`}
                                                </p>
                                            </div>
                                            <Badge variant="default">{tx.action}</Badge>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="chill">
                    <Card>
                        <CardHeader>
                            <CardTitle>Chill Room Access History</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {chillTransactions.length === 0 ? (
                                <p className="text-center text-muted-foreground py-8">No chill room access yet</p>
                            ) : (
                                <div className="space-y-2">
                                    {chillTransactions.map((tx) => (
                                        <div key={tx._id} className="flex justify-between items-center p-3 bg-secondary/50 rounded-lg">
                                            <div>
                                                <p className="font-medium text-card-foreground">{tx.resourceId.name}</p>
                                                <p className="text-xs text-muted-foreground">
                                                    {new Date(tx.timestamp).toLocaleString()}
                                                    {tx.volunteerId && ` • By ${tx.volunteerId.name}`}
                                                </p>
                                            </div>
                                            <Badge variant="default">{tx.action}</Badge>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="help">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <HelpCircle className="h-5 w-5" />
                                Help Requests
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {helpRequests.length === 0 ? (
                                <p className="text-center text-muted-foreground py-8">No help requests yet</p>
                            ) : (
                                <div className="space-y-2">
                                    {helpRequests.map((req) => (
                                        <div key={req._id} className={`p-3 rounded-lg border ${req.status === 'resolved'
                                                ? 'bg-green-500/10 border-green-500/20'
                                                : 'bg-secondary/50 border-border'
                                            }`}>
                                            <div className="flex justify-between items-start mb-2">
                                                <div className="flex gap-2">
                                                    <Badge variant="outline" className="capitalize">{req.category}</Badge>
                                                    <Badge variant="outline" className="capitalize">{req.priority}</Badge>
                                                </div>
                                                <Badge variant={req.status === 'resolved' ? 'default' : 'secondary'}>
                                                    {req.status}
                                                </Badge>
                                            </div>
                                            <p className="text-card-foreground mb-2">{req.description}</p>
                                            <div className="text-xs text-muted-foreground">
                                                <p>Submitted: {new Date(req.createdAt).toLocaleString()}</p>
                                                {req.status === 'resolved' && req.resolvedBy && req.resolvedAt && (
                                                    <p className="text-green-600 mt-1">
                                                        Resolved by {req.resolvedBy.name} • {new Date(req.resolvedAt).toLocaleString()}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    )
}
