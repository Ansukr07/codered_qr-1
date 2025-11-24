'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { HelpCircle, CheckCircle, Clock } from 'lucide-react'
import { toast } from 'sonner'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface HelpRequest {
  _id: string
  userId: { name: string; email: string; teamId?: string; qrCode: string }
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
      case 'high': return 'text-red-600 bg-red-600'
      case 'medium': return 'text-orange-600 bg-orange-600'
      case 'low': return 'text-blue-600 bg-blue-600'
      default: return 'text-foreground bg-foreground'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p>Loading help requests...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-primary">Help Requests</h1>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-orange-500" />
            <span className="text-sm text-muted-foreground">{pendingRequests.length} Pending</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500" />
            <span className="text-sm text-muted-foreground">{resolvedRequests.length} Resolved</span>
          </div>
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
            <CardDescription>Resolved</CardDescription>
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
          <div className="grid gap-4">
            {pendingRequests.length === 0 ? (
              <Card className="bg-card/50 backdrop-blur border-border/50">
                <CardContent className="py-8">
                  <p className="text-center text-muted-foreground">
                    No pending help requests
                  </p>
                </CardContent>
              </Card>
            ) : (
              pendingRequests.map((request) => (
                <Card
                  key={request._id}
                  className="bg-card/50 backdrop-blur border-border/50 border-l-4 border-l-orange-500"
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <CardTitle className="text-lg text-card-foreground">{request.userId.name}</CardTitle>
                          {request.userId.teamId && (
                            <Badge variant="outline" className="text-xs">
                              {request.userId.teamId}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">{request.userId.email}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="capitalize">{request.category}</Badge>
                        <div className={`w-2 h-2 rounded-full ${getPriorityColor(request.priority).split(' ')[1]}`} />
                        <span className="text-xs text-muted-foreground">{new Date(request.createdAt).toLocaleString()}</span>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-start gap-2">
                      <HelpCircle className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <p className="text-sm text-card-foreground">{request.description}</p>
                    </div>

                    <div className="flex gap-2 pt-2 border-t border-border/30">
                      <Button
                        size="sm"
                        className="gap-2"
                        onClick={() => handleResolve(request._id)}
                        disabled={resolving === request._id}
                      >
                        <CheckCircle className="h-4 w-4" />
                        {resolving === request._id ? 'Resolving...' : 'Mark as Resolved'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="resolved">
          <div className="grid gap-4">
            {resolvedRequests.length === 0 ? (
              <Card className="bg-card/50 backdrop-blur border-border/50">
                <CardContent className="py-8">
                  <p className="text-center text-muted-foreground">
                    No resolved requests yet
                  </p>
                </CardContent>
              </Card>
            ) : (
              resolvedRequests.map((request) => (
                <Card
                  key={request._id}
                  className="bg-card/50 backdrop-blur border-border/50 border-l-4 border-l-green-500 opacity-80"
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <CardTitle className="text-lg text-card-foreground">{request.userId.name}</CardTitle>
                          {request.userId.teamId && (
                            <Badge variant="outline" className="text-xs">
                              {request.userId.teamId}
                            </Badge>
                          )}
                          <Badge className="bg-green-600">Resolved</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{request.userId.email}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="capitalize">{request.category}</Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex items-start gap-2">
                      <HelpCircle className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <p className="text-sm text-card-foreground">{request.description}</p>
                    </div>
                    <div className="text-xs text-muted-foreground space-y-1 pt-2 border-t border-border/30">
                      <p>Submitted: {new Date(request.createdAt).toLocaleString()}</p>
                      {request.resolvedBy && request.resolvedAt && (
                        <p className="text-green-600">
                          Resolved by {request.resolvedBy.name} • {new Date(request.resolvedAt).toLocaleString()}
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
