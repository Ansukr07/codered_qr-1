'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, HelpCircle, CheckCircle, Clock } from 'lucide-react'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface HelpRequest {
  _id: string
  userId: { name: string; email: string; teamId?: string; qrCode: string } | null
  description: string
  category: string
  priority: string
  status: string
  createdAt: string
  resolvedBy?: { name: string }
  resolvedAt?: string
}

export default function HelpPage() {
  const [helpRequests, setHelpRequests] = useState<HelpRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [resolving, setResolving] = useState<string | null>(null)

  useEffect(() => {
    fetchHelpRequests()

    // Poll every 5 seconds
    const interval = setInterval(fetchHelpRequests, 5000)
    return () => clearInterval(interval)
  }, [])

  const fetchHelpRequests = async () => {
    try {
      const res = await fetch('/api/help-requests')
      if (res.ok) {
        const data = await res.json()
        setHelpRequests(data.helpRequests)
      }
    } catch (error) {
      console.error('Failed to fetch help requests:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleResolve = async (requestId: string) => {
    setResolving(requestId)
    try {
      const res = await fetch(`/api/help-requests/${requestId}/resolve`, {
        method: 'PATCH'
      })

      if (res.ok) {
        toast.success('Help request resolved!')
        fetchHelpRequests()
      } else {
        const data = await res.json()
        toast.error(data.message || 'Failed to resolve request')
      }
    } catch (error) {
      console.error('Resolve error:', error)
      toast.error('Failed to resolve request')
    } finally {
      setResolving(null)
    }
  }

  const pendingRequests = helpRequests.filter(r => r.status === 'pending')
  const resolvedRequests = helpRequests.filter(r => r.status === 'resolved')

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-600'
      case 'medium': return 'text-orange-600'
      case 'low': return 'text-blue-600'
      default: return 'text-foreground'
    }
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto flex items-center justify-center h-64">
        <p>Loading help requests...</p>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/volunteer">
          <Button variant="outline" size="sm" className="gap-2 text-foreground">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-foreground">Help Requests</h1>
          <p className="text-muted-foreground">Manage participant assistance requests</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Pending</CardDescription>
            <CardTitle className="text-3xl text-foreground">{pendingRequests.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Resolved Today</CardDescription>
            <CardTitle className="text-3xl text-foreground">{resolvedRequests.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Total</CardDescription>
            <CardTitle className="text-3xl text-foreground">{helpRequests.length}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Tabs defaultValue="pending" className="space-y-4">
        <TabsList>
          <TabsTrigger value="pending">
            <Clock className="h-4 w-4 mr-2" />
            Pending ({pendingRequests.length})
          </TabsTrigger>
          <TabsTrigger value="resolved">
            <CheckCircle className="h-4 w-4 mr-2" />
            Resolved ({resolvedRequests.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending">
          <Card className="bg-card/50 backdrop-blur border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <HelpCircle className="h-5 w-5 text-orange-500" />
                Pending Requests
              </CardTitle>
            </CardHeader>
            <CardContent>
              {pendingRequests.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No pending help requests
                </p>
              ) : (
                <div className="space-y-3">
                  {pendingRequests.map((request) => (
                    <div key={request._id} className="p-4 bg-secondary/50 rounded-lg border border-border">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <p className="font-semibold text-card-foreground">{request.userId?.name || 'Unknown User'}</p>
                          <p className="text-sm text-muted-foreground">{request.userId?.email || 'No email'}</p>
                          {request.userId?.teamId && (
                            <p className="text-xs text-muted-foreground">Team: {request.userId.teamId}</p>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Badge variant="outline" className="capitalize">{request.category}</Badge>
                          <Badge variant="outline" className={`capitalize ${getPriorityColor(request.priority)}`}>
                            {request.priority}
                          </Badge>
                        </div>
                      </div>
                      <p className="text-card-foreground mb-3">{request.description}</p>
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-muted-foreground">
                          {new Date(request.createdAt).toLocaleString()}
                        </span>
                        <Button
                          size="sm"
                          onClick={() => handleResolve(request._id)}
                          disabled={resolving === request._id}
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          {resolving === request._id ? 'Resolving...' : 'Mark Resolved'}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="resolved">
          <Card className="bg-card/50 backdrop-blur border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                Resolved Requests
              </CardTitle>
            </CardHeader>
            <CardContent>
              {resolvedRequests.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No resolved requests yet
                </p>
              ) : (
                <div className="space-y-3">
                  {resolvedRequests.map((request) => (
                    <div key={request._id} className="p-4 bg-green-500/10 rounded-lg border border-green-500/20">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <p className="font-semibold text-card-foreground">{request.userId?.name || 'Unknown User'}</p>
                          <p className="text-sm text-muted-foreground">{request.userId?.email || 'No email'}</p>
                        </div>
                        <div className="flex gap-2">
                          <Badge variant="outline" className="capitalize">{request.category}</Badge>
                          <Badge variant="default" className="bg-green-600">Resolved</Badge>
                        </div>
                      </div>
                      <p className="text-card-foreground mb-3">{request.description}</p>
                      <div className="text-xs text-muted-foreground space-y-1">
                        <p>Submitted: {new Date(request.createdAt).toLocaleString()}</p>
                        {request.resolvedBy && request.resolvedAt && (
                          <p className="text-green-600">
                            Resolved by {request.resolvedBy.name} • {new Date(request.resolvedAt).toLocaleString()}
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
