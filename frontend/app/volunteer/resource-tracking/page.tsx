'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Search, Users, CheckCircle, Clock, ArrowLeft, Package } from 'lucide-react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/contexts/AuthContext'

interface Resource {
    _id: string
    name: string
    category: string
    participantCount?: number
    totalQuantity?: number
}

interface Participant {
    _id: string
    name: string
    email: string
    teamId?: string
    timestamp?: string
    volunteer?: string
    qrCode?: string
    claimCount?: number
    maxClaims?: number
}

interface Stats {
    total: number
    completed: number
    pending: number
}

export default function ResourceTracking() {
    const { user, loading } = useAuth()
    const router = useRouter()
    const [resources, setResources] = useState<Resource[]>([])
    const [selectedResourceId, setSelectedResourceId] = useState<string>('')
    const [resourceSearchQuery, setResourceSearchQuery] = useState('')
    const [participantSearchQuery, setParticipantSearchQuery] = useState('')
    const [stats, setStats] = useState<Stats>({ total: 0, completed: 0, pending: 0 })
    const [completed, setCompleted] = useState<Participant[]>([])
    const [pending, setPending] = useState<Participant[]>([])
    const [resourceName, setResourceName] = useState('')
    const [isLoading, setIsLoading] = useState(false)

    useEffect(() => {
        if (!loading && (!user || (user.role !== 'volunteer' && user.role !== 'admin'))) {
            router.push('/login')
        }
    }, [user, loading, router])

    useEffect(() => {
        fetchResources()
    }, [])

    useEffect(() => {
        if (selectedResourceId) {
            fetchResourceStatus()
            // Poll every 5 seconds
            const interval = setInterval(fetchResourceStatus, 5000)
            return () => clearInterval(interval)
        }
    }, [selectedResourceId, participantSearchQuery])

    const fetchResources = async () => {
        try {
            console.log('Fetching resources from /api/volunteers/resources')
            const res = await fetch('/api/volunteers/resources')
            console.log('Response status:', res.status)
            if (res.ok) {
                const data = await res.json()
                console.log('Resources fetched from volunteers endpoint:', data.resources)

                if (data.resources && data.resources.length > 0) {
                    setResources(data.resources)
                } else {
                    // Try fallback to regular resources endpoint
                    console.log('No resources from volunteers endpoint, trying /api/resources')
                    const fallbackRes = await fetch('/api/resources')
                    if (fallbackRes.ok) {
                        const fallbackData = await fallbackRes.json()
                        console.log('Resources fetched from regular endpoint:', fallbackData.resources)
                        setResources(fallbackData.resources || [])
                    }
                }
            } else {
                console.error('Failed to fetch resources, status:', res.status)
                // Try fallback
                const fallbackRes = await fetch('/api/resources')
                if (fallbackRes.ok) {
                    const fallbackData = await fallbackRes.json()
                    console.log('Fallback resources:', fallbackData.resources)
                    setResources(fallbackData.resources || [])
                }
            }
        } catch (error) {
            console.error('Failed to fetch resources:', error)
        }
    }

    const fetchResourceStatus = async () => {
        if (!selectedResourceId) return

        setIsLoading(true)
        try {
            const url = `/api/volunteers/resource-status/${selectedResourceId}${participantSearchQuery ? `?search=${encodeURIComponent(participantSearchQuery)}` : ''}`
            console.log('Fetching resource status from:', url)
            const res = await fetch(url)
            console.log('Resource status response status:', res.status)

            if (res.ok) {
                const data = await res.json()
                console.log('Resource status data received:', data)
                console.log('Stats:', data.stats)
                console.log('Completed count:', data.completed?.length)
                console.log('Pending count:', data.pending?.length)

                setStats(data.stats)
                setCompleted(data.completed)
                setPending(data.pending)
                setResourceName(data.resource.name)
            } else {
                console.error('Failed to fetch resource status, status:', res.status)
                const errorText = await res.text()
                console.error('Error response:', errorText)
            }
        } catch (error) {
            console.error('Failed to fetch resource status:', error)
        } finally {
            setIsLoading(false)
        }
    }

    const handleResourceClick = (resourceId: string) => {
        setSelectedResourceId(resourceId)
        setParticipantSearchQuery('')
    }

    if (loading || !user) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <p>Loading...</p>
            </div>
        )
    }

    // Filter resources based on search
    const filteredResources = resources.filter(resource =>
        resource.name.toLowerCase().includes(resourceSearchQuery.toLowerCase()) ||
        resource.category.toLowerCase().includes(resourceSearchQuery.toLowerCase())
    )

    // Get category color
    const getCategoryColor = (category: string) => {
        const colors: { [key: string]: { bg: string; text: string } } = {
            food: { bg: 'bg-orange-500/10', text: 'text-orange-500' },
            'sleeping-bag': { bg: 'bg-blue-500/10', text: 'text-blue-500' },
            'chill-room': { bg: 'bg-purple-500/10', text: 'text-purple-500' },
            coffee: { bg: 'bg-amber-500/10', text: 'text-amber-500' },
            other: { bg: 'bg-gray-500/10', text: 'text-gray-500' }
        }
        return colors[category] || colors.other
    }

    return (
        <div className="min-h-screen bg-background relative">
            {/* White Grid Background */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff_1px,transparent_1px),linear-gradient(to_bottom,#ffffff_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-20 pointer-events-none" />

            <div className="relative z-10 p-6">
                <div className="max-w-7xl mx-auto space-y-6">
                    {/* Header */}
                    <div className="flex items-center gap-4">
                        <Link href="/volunteer">
                            <Button variant="default" size="icon">
                                <ArrowLeft className="h-4 w-4 text-white" />
                            </Button>
                        </Link>
                        <div className="flex-1">
                            <h1 className="text-3xl font-bold text-foreground">Resource Tracking</h1>
                            <p className="text-muted-foreground">Click on a resource to view distribution status</p>
                        </div>
                    </div>

                    {/* Search Bar for Resources */}
                    <Card>
                        <CardContent className="p-4">
                            <div className="relative">
                                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search resources..."
                                    value={resourceSearchQuery}
                                    onChange={(e) => setResourceSearchQuery(e.target.value)}
                                    className="pl-10"
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Resource Cards Grid */}
                    {!selectedResourceId && (
                        <>
                            {filteredResources.length === 0 ? (
                                <Card>
                                    <CardContent className="p-8">
                                        <p className="text-center text-muted-foreground">
                                            {resources.length === 0
                                                ? 'No resources available. Please add resources from the admin panel.'
                                                : 'No resources match your search.'}
                                        </p>
                                    </CardContent>
                                </Card>
                            ) : (
                                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {filteredResources.map((resource) => {
                                        const colors = getCategoryColor(resource.category)
                                        return (
                                            <Card
                                                key={resource._id}
                                                className="cursor-pointer hover:border-primary/50 transition-all"
                                                onClick={() => handleResourceClick(resource._id)}
                                            >
                                                <CardContent className="p-6">
                                                    <div className="flex items-start gap-4">
                                                        <div className={`p-3 ${colors.bg}`}>
                                                            <Package className={`h-6 w-6 ${colors.text}`} />
                                                        </div>
                                                        <div className="flex-1">
                                                            <h3 className="font-semibold text-lg text-card-foreground">
                                                                {resource.name}
                                                            </h3>
                                                            <p className="text-sm text-muted-foreground mt-1">
                                                                {resource.participantCount || 0}/{resource.totalQuantity || 0} distributed
                                                            </p>
                                                        </div>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        )
                                    })}
                                </div>
                            )}
                        </>
                    )}

                    {/* Participant Tracking View (when resource selected) */}
                    {selectedResourceId && (
                        <>
                            {/* Back to Resources */}
                            <Button
                                variant="default"
                                onClick={() => setSelectedResourceId('')}
                                className="mb-4"
                            >
                                <ArrowLeft className="mr-2 h-4 w-4 text-white" />
                                Back to Resources
                            </Button>

                            {/* Statistics */}
                            <div className="grid md:grid-cols-3 gap-4">
                                <Card>
                                    <CardContent className="p-6">
                                        <div className="flex items-center gap-4">
                                            <div className="p-3 bg-blue-500/10">
                                                <Users className="h-6 w-6 text-blue-500" />
                                            </div>
                                            <div>
                                                <p className="text-2xl font-bold text-foreground">{stats.total}</p>
                                                <p className="text-xs text-muted-foreground">Total Participants</p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardContent className="p-6">
                                        <div className="flex items-center gap-4">
                                            <div className="p-3 bg-green-500/10">
                                                <CheckCircle className="h-6 w-6 text-green-500" />
                                            </div>
                                            <div>
                                                <p className="text-2xl font-bold text-green-500">{stats.completed}</p>
                                                <p className="text-xs text-muted-foreground">Completed</p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardContent className="p-6">
                                        <div className="flex items-center gap-4">
                                            <div className="p-3 bg-orange-500/10">
                                                <Clock className="h-6 w-6 text-orange-500" />
                                            </div>
                                            <div>
                                                <p className="text-2xl font-bold text-orange-500">{stats.pending}</p>
                                                <p className="text-xs text-muted-foreground">Pending</p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Search Bar for Participants */}
                            <Card>
                                <CardHeader>
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <CardTitle>Participants - {resourceName}</CardTitle>
                                            <CardDescription>Search and filter participants by name, email, or team</CardDescription>
                                        </div>
                                        <div className="relative w-64">
                                            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                            <Input
                                                placeholder="Search participants..."
                                                value={participantSearchQuery}
                                                onChange={(e) => setParticipantSearchQuery(e.target.value)}
                                                className="pl-8"
                                            />
                                        </div>
                                    </div>
                                </CardHeader>
                            </Card>

                            {/* Completed Section */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <CheckCircle className="h-5 w-5 text-green-500" />
                                        Completed ({completed.length})
                                    </CardTitle>
                                    <CardDescription>Participants who have received this resource</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    {completed.length === 0 ? (
                                        <p className="text-center text-muted-foreground py-8">
                                            No participants have received this resource yet
                                        </p>
                                    ) : (
                                        <div className="space-y-2">
                                            {completed.map((participant) => (
                                                <div key={participant._id} className="flex justify-between items-center p-3 bg-secondary/50">
                                                    <div className="flex-1">
                                                        <p className="font-medium text-card-foreground">{participant.name}</p>
                                                        <p className="text-xs text-muted-foreground">{participant.email}</p>
                                                        {participant.teamId && (
                                                            <Badge variant="outline" className="text-xs mt-1">
                                                                Team: {participant.teamId}
                                                            </Badge>
                                                        )}
                                                        {participant.claimCount !== undefined && participant.maxClaims !== undefined && participant.maxClaims > 1 && (
                                                            <Badge variant="secondary" className="text-xs mt-1 ml-1">
                                                                Consumed: {participant.claimCount}/{participant.maxClaims}
                                                            </Badge>
                                                        )}
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-xs text-green-600 font-medium">
                                                            by {participant.volunteer}
                                                        </p>
                                                        <p className="text-xs text-muted-foreground">
                                                            {participant.timestamp ? new Date(participant.timestamp).toLocaleString() : 'N/A'}
                                                        </p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>

                            {/* Pending Section */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Clock className="h-5 w-5 text-orange-500" />
                                        Pending ({pending.length})
                                    </CardTitle>
                                    <CardDescription>Participants who haven't received this resource</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    {pending.length === 0 ? (
                                        <p className="text-center text-muted-foreground py-8">
                                            All participants have received this resource!
                                        </p>
                                    ) : (
                                        <div className="space-y-2">
                                            {pending.map((participant) => (
                                                <div key={participant._id} className="flex justify-between items-center p-3 bg-secondary/50">
                                                    <div className="flex-1">
                                                        <p className="font-medium text-card-foreground">{participant.name}</p>
                                                        <p className="text-xs text-muted-foreground">{participant.email}</p>
                                                        {participant.teamId && (
                                                            <Badge variant="outline" className="text-xs mt-1">
                                                                Team: {participant.teamId}
                                                            </Badge>
                                                        )}
                                                        {participant.claimCount !== undefined && participant.maxClaims !== undefined && participant.maxClaims > 1 && (
                                                            <Badge variant="secondary" className="text-xs mt-1 ml-1">
                                                                Consumed: {participant.claimCount}/{participant.maxClaims}
                                                            </Badge>
                                                        )}
                                                    </div>
                                                    <Badge variant="secondary">
                                                        Not Claimed
                                                    </Badge>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </>
                    )}
                </div>
            </div>
        </div>
    )
}
