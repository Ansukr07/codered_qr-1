'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { QrCode, LogOut, Package, History, HelpCircle, Send, Megaphone, Trophy, Map } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/contexts/AuthContext'
import QRCodeSVG from 'react-qr-code'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'

interface Transaction {
    _id: string
    resourceId: { name: string } | null
    action: string
    timestamp: string
}

interface HelpRequest {
    _id: string
    description: string
    category: string
    priority: string
    status: string
    createdAt: string
    resolvedAt?: string
    resolvedBy?: { name: string }
}

interface Announcement {
    _id: string
    title: string
    message: string
    priority: string
    audience: string
    createdAt: string
}

export default function ParticipantDashboard() {
    const { user, logout, loading } = useAuth()
    const router = useRouter()
    const [qrCode, setQrCode] = useState('')
    const [transactions, setTransactions] = useState<Transaction[]>([])
    const [helpRequests, setHelpRequests] = useState<HelpRequest[]>([])
    const [helpDescription, setHelpDescription] = useState('')
    const [helpCategory, setHelpCategory] = useState('general')
    const [helpPriority, setHelpPriority] = useState('medium')
    const [submitting, setSubmitting] = useState(false)
    const [announcements, setAnnouncements] = useState<Announcement[]>([])

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

        const fetchTransactions = async () => {
            try {
                const res = await fetch('/api/transactions')
                if (res.ok) {
                    const data = await res.json()
                    setTransactions(data.transactions)
                }
            } catch (error) {
                console.error('Failed to fetch transactions:', error)
            }
        }

        const fetchHelpRequests = async () => {
            try {
                const res = await fetch('/api/help-requests/my-requests')
                if (res.ok) {
                    const data = await res.json()
                    setHelpRequests(data.helpRequests)
                }
            } catch (error) {
                console.error('Failed to fetch help requests:', error)
            }
        }

        const fetchAnnouncements = async () => {
            try {
                const res = await fetch('/api/announcements')
                if (res.ok) {
                    const data = await res.json()
                    setAnnouncements(data.announcements)
                }
            } catch (error) {
                console.error('Failed to fetch announcements:', error)
            }
        }

        if (user && user.role === 'participant') {
            fetchUserData()
            fetchTransactions()
            fetchHelpRequests()
            fetchAnnouncements()
        }
    }, [user])

    const handleSubmitHelpRequest = async (e: React.FormEvent) => {
        e.preventDefault()
        setSubmitting(true)

        try {
            const res = await fetch('/api/help-requests', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    description: helpDescription,
                    category: helpCategory,
                    priority: helpPriority
                })
            })

            if (res.ok) {
                toast.success('Help request submitted successfully!')
                setHelpDescription('')
                setHelpCategory('general')
                setHelpPriority('medium')

                // Refresh help requests
                const helpRes = await fetch('/api/help-requests/my-requests')
                if (helpRes.ok) {
                    const data = await helpRes.json()
                    setHelpRequests(data.helpRequests)
                }
            } else {
                const data = await res.json()
                toast.error(data.message || 'Failed to submit help request')
            }
        } catch (error) {
            console.error('Submit help request error:', error)
            toast.error('Failed to submit help request')
        } finally {
            setSubmitting(false)
        }
    }

    if (loading || !user) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <p>Loading...</p>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-background relative">
            {/* White Grid Background */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff_1px,transparent_1px),linear-gradient(to_bottom,#ffffff_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-80 pointer-events-none" />

            <div className="relative z-10 p-4 md:p-6">
                <div className="max-w-7xl mx-auto space-y-4 md:space-y-6">
                    {/* Header */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <h1 className="text-2xl md:text-3xl font-bold text-foreground">Participant Dashboard</h1>
                            <p className="text-xs md:text-sm text-muted-foreground">Welcome, {user.name}</p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            <Link href="/participant/tasks">
                                <Button variant="default" size="sm" className="h-9 md:h-10 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 border-none text-white">
                                    <Trophy className="mr-2 h-4 w-4" />
                                    <span className="hidden md:inline">Tasks</span>
                                    <span className="md:hidden">Tasks</span>
                                </Button>
                            </Link>
                            <Link href="/participant/qr">
                                <Button variant="secondary" size="sm" className="h-9 md:h-10">
                                    <QrCode className="mr-2 h-4 w-4" />
                                    <span className="hidden md:inline">View QR</span>
                                    <span className="md:hidden">QR</span>
                                </Button>
                            </Link>
                            <Link href="/participant/seating">
                                <Button variant="secondary" size="sm" className="h-9 md:h-10">
                                    <Map className="mr-2 h-4 w-4" />
                                    <span className="hidden md:inline">Seating Map</span>
                                    <span className="md:hidden">Map</span>
                                </Button>
                            </Link>
                            <Button onClick={logout} variant="outline" size="sm" className="text-foreground h-9 md:h-10">
                                <LogOut className="mr-2 h-4 w-4" />
                                <span className="hidden md:inline">Logout</span>
                            </Button>
                        </div>
                    </div>



                    <div className="grid md:grid-cols-2 gap-4 md:gap-6">
                        {/* Announcements */}
                        <Card className="h-full">
                            <CardHeader className="p-4 md:p-6">
                                <CardTitle className="flex items-center text-lg md:text-xl">
                                    <Megaphone className="mr-2 h-5 w-5" />
                                    Announcements
                                </CardTitle>
                                <CardDescription className="text-xs md:text-sm">
                                    Latest updates from organizers
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="p-4 md:p-6 pt-0 md:pt-0">
                                {announcements.length > 0 ? (
                                    <div className="space-y-2">
                                        {announcements.slice(0, 5).map((announcement) => (
                                            <div key={announcement._id} className="flex justify-between items-start p-3 bg-secondary/50 rounded-md">
                                                <div className="flex-1">
                                                    <p className="font-medium text-sm md:text-base text-card-foreground">{announcement.title}</p>
                                                    <p className="text-xs md:text-sm text-muted-foreground mt-1">{announcement.message}</p>
                                                    <p className="text-[10px] md:text-xs text-muted-foreground mt-1">
                                                        {new Date(announcement.createdAt).toLocaleString()}
                                                    </p>
                                                </div>
                                                <Badge variant={announcement.priority === 'high' ? 'destructive' : announcement.priority === 'medium' ? 'default' : 'secondary'} className="text-[10px] md:text-xs">
                                                    {announcement.priority}
                                                </Badge>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-muted-foreground text-center py-4 text-sm">No announcements yet.</p>
                                )}
                            </CardContent>
                        </Card>

                        {/* Help Request Form */}
                        <Card>
                            <CardHeader className="p-4 md:p-6">
                                <CardTitle className="flex items-center text-lg md:text-xl">
                                    <HelpCircle className="mr-2 h-5 w-5" />
                                    Request Help
                                </CardTitle>
                                <CardDescription className="text-xs md:text-sm">
                                    Submit a help request to volunteers
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="p-4 md:p-6 pt-0 md:pt-0">
                                <form onSubmit={handleSubmitHelpRequest} className="space-y-4">
                                    <div className="space-y-2 border-white">
                                        <Label htmlFor="description" className="text-xs md:text-sm">Description</Label>
                                        <Textarea
                                            id="description"
                                            placeholder="Describe your issue..."
                                            value={helpDescription}
                                            onChange={(e) => setHelpDescription(e.target.value)}
                                            required
                                            className="min-h-[80px] border-white text-sm"
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="space-y-2">
                                            <Label htmlFor="category" className="text-xs md:text-sm">Category</Label>
                                            <select
                                                id="category"
                                                value={helpCategory}
                                                onChange={(e) => setHelpCategory(e.target.value)}
                                                className="flex h-9 md:h-10 w-full rounded-md border border-white bg-background px-3 py-2 text-xs md:text-sm"
                                            >
                                                <option value="general">General</option>
                                                <option value="technical">Technical</option>
                                                <option value="food">Food</option>
                                                <option value="supplies">Supplies</option>
                                            </select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="priority" className="text-xs md:text-sm">Priority</Label>
                                            <select
                                                id="priority"
                                                value={helpPriority}
                                                onChange={(e) => setHelpPriority(e.target.value)}
                                                className="flex h-9 md:h-10 w-full rounded-md border border-white bg-background px-3 py-2 text-xs md:text-sm"
                                            >
                                                <option value="low">Low</option>
                                                <option value="medium">Medium</option>
                                                <option value="high">High</option>
                                            </select>
                                        </div>
                                    </div>
                                    <Button type="submit" className="w-full h-9 md:h-10 text-sm" disabled={submitting}>
                                        <Send className="mr-2 h-4 w-4" />
                                        {submitting ? 'Submitting...' : 'Submit Request'}
                                    </Button>
                                </form>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Help Request History */}
                    {helpRequests.length > 0 && (
                        <Card>
                            <CardHeader className="p-4 md:p-6">
                                <CardTitle className="flex items-center text-lg md:text-xl">
                                    <HelpCircle className="mr-2 h-5 w-5" />
                                    My Help Requests
                                </CardTitle>
                                <CardDescription className="text-xs md:text-sm">
                                    Your help request history
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="p-4 md:p-6 pt-0 md:pt-0">
                                <div className="space-y-2">
                                    {helpRequests.map((req) => (
                                        <div key={req._id} className="flex justify-between items-start p-3 bg-secondary/50 rounded-md">
                                            <div className="flex-1">
                                                <p className="font-medium text-sm md:text-base text-card-foreground">{req.description}</p>
                                                <div className="flex gap-2 mt-1">
                                                    <Badge variant="outline" className="text-[10px] md:text-xs capitalize">{req.category}</Badge>
                                                    <Badge variant="outline" className="text-[10px] md:text-xs capitalize">{req.priority}</Badge>
                                                </div>
                                                <p className="text-[10px] md:text-xs text-muted-foreground mt-1">
                                                    {new Date(req.createdAt).toLocaleString()}
                                                </p>
                                                {req.status === 'resolved' && req.resolvedBy && (
                                                    <p className="text-[10px] md:text-xs text-green-600 mt-1">
                                                        Resolved by {req.resolvedBy.name}
                                                    </p>
                                                )}
                                            </div>
                                            <Badge variant={req.status === 'resolved' ? 'default' : 'secondary'} className="text-[10px] md:text-xs">
                                                {req.status}
                                            </Badge>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Recent Activity */}
                    <Card>
                        <CardHeader className="p-4 md:p-6">
                            <CardTitle className="flex items-center text-lg md:text-xl">
                                <History className="mr-2 h-5 w-5" />
                                Recent Activity
                            </CardTitle>
                            <CardDescription className="text-xs md:text-sm">
                                Your resource claim history
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="p-4 md:p-6 pt-0 md:pt-0">
                            {transactions.length === 0 ? (
                                <p className="text-center text-muted-foreground py-8 text-sm">
                                    No activity yet. Claim resources to see them here.
                                </p>
                            ) : (
                                <div className="space-y-2">
                                    {transactions.map((tx) => (
                                        <div key={tx._id} className="flex justify-between items-center p-3 bg-secondary/50 rounded-md">
                                            <div>
                                                <p className="font-medium text-sm md:text-base text-card-foreground">
                                                    {tx.resourceId?.name || 'Resource Unavailable'}
                                                </p>
                                                <p className="text-[10px] md:text-xs text-muted-foreground">
                                                    {new Date(tx.timestamp).toLocaleString()}
                                                </p>
                                            </div>
                                            <span className="text-[10px] md:text-xs bg-green-500/10 text-green-500 px-2 py-1 rounded">
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
        </div>
    )
}
