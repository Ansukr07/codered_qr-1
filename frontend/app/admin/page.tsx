'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { LogOut, Package, Users, TrendingUp, Plus, Eye, UserCog, HandHelping, Github, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { useAuth } from '@/contexts/AuthContext'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'

interface Resource {
  _id: string
  name: string
  totalQuantity: number
  distributedQuantity: number
  remaining: number
  type: string
  category: string
}

interface Participant {
  _id: string
  name: string
  email: string
  teamId?: string
  qrCode: string
  githubLink?: string | null
  resourcesClaimed: number
  createdAt: string
}

interface User {
  _id: string
  name: string
  email: string
  role: string
  teamId?: string
  createdAt: string
}

interface ResourceParticipant {
  name: string
  email: string
  teamId?: string
  githubLink?: string | null
  timestamp?: string
  volunteer?: string
  qrCode?: string
  claimCount?: number
  maxClaims?: number
}

interface HelpRequest {
  _id: string
  userId: { name: string; email: string; teamId?: string }
  description: string
  category: string
  priority: string
  status: string
  createdAt: string
  resolvedBy?: { name: string }
  resolvedAt?: string
}

export default function AdminDashboard() {
  const { user, logout, loading } = useAuth()
  const router = useRouter()
  const [resources, setResources] = useState<Resource[]>([])
  const [participants, setParticipants] = useState<Participant[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [helpRequests, setHelpRequests] = useState<HelpRequest[]>([])
  const [stats, setStats] = useState({
    totalResources: 0,
    totalParticipants: 0,
    totalDistributed: 0,
    totalCapacity: 0,
    totalTransactions: 0
  })

  const [selectedResource, setSelectedResource] = useState<Resource | null>(null)
  const [resourceDetails, setResourceDetails] = useState<{
    completed: ResourceParticipant[]
    remaining: ResourceParticipant[]
  } | null>(null)
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [newResource, setNewResource] = useState({
    name: '',
    totalQuantity: 0,
    category: 'other',
  })

  useEffect(() => {
    if (!loading && (!user || user.role !== 'admin')) {
      router.push('/admin-login')
    }
  }, [user, loading, router])

  useEffect(() => {
    if (user && user.role === 'admin') {
      fetchAdminData()
      fetchGithubStatus()
    }
  }, [user])

  // Refresh GitHub status periodically
  useEffect(() => {
    if (user && user.role === 'admin') {
      const interval = setInterval(() => {
        fetchGithubStatus()
      }, 30000) // Refresh every 30 seconds

      return () => clearInterval(interval)
    }
  }, [user])

  const fetchAdminData = async () => {
    try {
      // Fetch stats and resources
      const statsRes = await fetch('/api/admin/stats')
      if (statsRes.ok) {
        const data = await statsRes.json()
        setStats(data)
        setResources(data.resources)
      }

      // Fetch participants
      const participantsRes = await fetch('/api/admin/participants')
      if (participantsRes.ok) {
        const data = await participantsRes.json()
        setParticipants(data.participants)
      }

      // Fetch users
      const usersRes = await fetch('/api/admin/users')
      if (usersRes.ok) {
        const data = await usersRes.json()
        setUsers(data.users)
      }

      // Fetch help requests
      const helpRes = await fetch('/api/help-requests')
      if (helpRes.ok) {
        const data = await helpRes.json()
        setHelpRequests(data.helpRequests)
      }
    } catch (error) {
      console.error('Failed to fetch admin data:', error)
    }
  }

  const fetchResources = async () => {
    try {
      const res = await fetch('/api/resources')
      const data = await res.json()
      setResources(data.resources)
    } catch (error) {
      console.error('Failed to fetch resources:', error)
    }
  }

  const createResource = async () => {
    try {
      const res = await fetch('/api/resources', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newResource),
      })

      if (res.ok) {
        setIsCreateDialogOpen(false)
        setNewResource({ name: '', totalQuantity: 0, category: 'other' })
        fetchAdminData()
      } else {
        const data = await res.json()
        alert('Error: ' + data.message)
      }
    } catch (error) {
      console.error('Failed to create resource:', error)
      alert('Failed to create resource')
    }
  }

  const viewResourceDetails = async (resource: Resource) => {
    try {
      const res = await fetch(`/api/admin/resource/${resource._id}/participants`)
      if (res.ok) {
        const data = await res.json()
        setResourceDetails(data)
        setSelectedResource(resource)
        setIsDetailDialogOpen(true)
      }
    } catch (error) {
      console.error('Failed to fetch resource details:', error)
    }
  }

  const [githubStatus, setGithubStatus] = useState<{
    participants: Array<{
      _id: string
      name: string
      email: string
      teamId?: string
      githubLink: string | null
      status: string
    }>
    stats: {
      total: number
      submitted: number
      pending: number
    }
  } | null>(null)

  const fetchGithubStatus = async () => {
    try {
      const res = await fetch('/api/admin/participants/github-status', {
        cache: 'no-store', // Ensure fresh data
        headers: {
          'Cache-Control': 'no-cache'
        }
      })
      if (res.ok) {
        const data = await res.json()
        console.log('GitHub status fetched:', data.stats)
        setGithubStatus(data)
      } else {
        console.error('Failed to fetch GitHub status:', res.status, res.statusText)
      }
    } catch (error) {
      console.error('Failed to fetch GitHub status:', error)
    }
  }

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </div>
    )
  }

  const totalResources = resources.length
  const totalDistributed = resources.reduce((sum, r) => sum + r.distributedQuantity, 0)
  const totalCapacity = resources.reduce((sum, r) => sum + r.totalQuantity, 0)

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-primary">Admin Dashboard</h1>
            <p className="text-muted-foreground">Welcome, {user.name}</p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Resources</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{totalResources}</div>
              <p className="text-xs text-muted-foreground">Active resource types</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Distributed</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{totalDistributed}</div>
              <p className="text-xs text-muted-foreground">Out of {totalCapacity} total</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Participants</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{participants.length}</div>
              <p className="text-xs text-muted-foreground">Registered teams</p>
            </CardContent>
          </Card>
        </div>



        <Tabs defaultValue="resources" className="space-y-4">
          <TabsList>
            <TabsTrigger value="resources">Resources</TabsTrigger>
            <TabsTrigger value="participants">Participants</TabsTrigger>
            <TabsTrigger value="github">GitHub Status</TabsTrigger>
            <TabsTrigger value="users">User Management</TabsTrigger>
          </TabsList>

          {/* Resources Tab */}
          <TabsContent value="resources" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle className="flex items-center">
                      <Package className="mr-2 h-5 w-5" />
                      Resource Management
                    </CardTitle>
                    <CardDescription>Manage hackathon resources</CardDescription>
                  </div>
                  <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                    <DialogTrigger asChild>
                      <Button>
                        <Plus className="mr-2 h-4 w-4" />
                        Create Resource
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Create New Resource</DialogTitle>
                        <DialogDescription>
                          Add a new resource for the hackathon
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="name">Resource Name</Label>
                          <Input
                            id="name"
                            placeholder="e.g., Lunch - Day 1"
                            value={newResource.name}
                            onChange={(e) => setNewResource({ ...newResource, name: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="quantity">Total Quantity</Label>
                          <Input
                            id="quantity"
                            type="number"
                            placeholder="100"
                            value={newResource.totalQuantity}
                            onChange={(e) =>
                              setNewResource({ ...newResource, totalQuantity: parseInt(e.target.value) || 0 })
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="category">Resource Category</Label>
                          <Select
                            value={newResource.category}
                            onValueChange={(value) => setNewResource({ ...newResource, category: value })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="food">Food</SelectItem>
                              <SelectItem value="accommodation">Accommodation</SelectItem>
                              <SelectItem value="chill_room">Chill Room</SelectItem>
                              <SelectItem value="coffee">Coffee</SelectItem>
                              <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <DialogFooter>
                        <Button onClick={createResource}>Create Resource</Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {resources.map((resource) => (
                    <div key={resource._id} className="flex justify-between items-center p-4 bg-secondary/50 rounded-lg hover:bg-secondary/70 transition-colors cursor-pointer"
                      onClick={() => viewResourceDetails(resource)}>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium text-card-foreground">{resource.name}</h3>
                          <Button variant="ghost" size="sm" className="h-6">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                        <p className="text-sm text-muted-foreground capitalize">{resource.category || 'other'}</p>
                        <div className="mt-2">
                          <div className="flex justify-between text-sm mb-1 text-foreground">
                            <span>Distributed</span>
                            <span>
                              {resource.distributedQuantity}/{resource.totalQuantity}
                            </span>
                          </div>
                          <div className="w-full bg-secondary rounded-full h-2">
                            <div
                              className={`h-2 rounded-full ${resource.distributedQuantity >= resource.totalQuantity
                                ? 'bg-destructive'
                                : 'bg-primary'
                                }`}
                              style={{
                                width: `${Math.min(
                                  (resource.distributedQuantity / resource.totalQuantity) * 100,
                                  100
                                )}%`,
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  {resources.length === 0 && (
                    <p className="text-center text-muted-foreground py-8">
                      No resources yet. Create one to get started.
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Participants Tab */}
          <TabsContent value="participants">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Users className="mr-2 h-5 w-5" />
                  All Participants ({participants.length})
                </CardTitle>
                <CardDescription>View all registered participants and their transactions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {participants.map((participant) => (
                    <div key={participant._id} className="flex justify-between items-center p-3 bg-secondary/50 rounded-lg">
                      <div className="flex-1">
                        <p className="font-medium text-card-foreground">{participant.name}</p>
                        <p className="text-sm text-muted-foreground">{participant.email}</p>
                        {participant.teamId && (
                          <p className="text-xs text-muted-foreground">Team: {participant.teamId}</p>
                        )}
                        {participant.githubLink && (
                          <a
                            href={participant.githubLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-blue-500 hover:underline flex items-center gap-1 mt-1"
                          >
                            <Github className="h-3 w-3" />
                            GitHub Repository
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        )}
                      </div>
                      <div className="text-right">
                        <Badge variant="secondary">{participant.resourcesClaimed} claimed</Badge>
                        <p className="text-xs text-muted-foreground mt-1">{participant.qrCode}</p>
                      </div>
                    </div>
                  ))}
                  {participants.length === 0 && (
                    <p className="text-center text-muted-foreground py-8">
                      No participants registered yet.
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* GitHub Status Tab */}
          <TabsContent value="github">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center">
                      <Github className="mr-2 h-5 w-5" />
                      GitHub Repository Status
                    </CardTitle>
                    <CardDescription>
                      {githubStatus ? (
                        <>
                          {githubStatus.stats.submitted} submitted • {githubStatus.stats.pending} pending
                        </>
                      ) : (
                        'View GitHub repository submission status'
                      )}
                    </CardDescription>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={fetchGithubStatus}
                    className="gap-2"
                  >
                    <TrendingUp className="h-4 w-4" />
                    Refresh
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {githubStatus ? (
                  <div className="space-y-2">
                    {githubStatus.participants.length > 0 ? (
                      githubStatus.participants.map((participant) => (
                        <div key={participant._id} className="flex justify-between items-center p-3 bg-secondary/50 rounded-lg">
                          <div className="flex-1">
                            <p className="font-medium text-card-foreground">{participant.name}</p>
                            <p className="text-sm text-muted-foreground">{participant.email}</p>
                            {participant.teamId && (
                              <p className="text-xs text-muted-foreground">Team: {participant.teamId}</p>
                            )}
                            {participant.githubLink ? (
                              <a
                                href={participant.githubLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-blue-500 hover:underline flex items-center gap-1 mt-1 break-all"
                              >
                                <Github className="h-3 w-3 flex-shrink-0" />
                                <span className="break-all">{participant.githubLink}</span>
                                <ExternalLink className="h-3 w-3 flex-shrink-0" />
                              </a>
                            ) : (
                              <p className="text-xs text-muted-foreground mt-1">No repository link submitted</p>
                            )}
                          </div>
                          <Badge variant={participant.status === 'submitted' ? 'default' : 'secondary'}>
                            {participant.status === 'submitted' ? 'Submitted' : 'Pending'}
                          </Badge>
                        </div>
                      ))
                    ) : (
                      <p className="text-center text-muted-foreground py-8">No participants found</p>
                    )}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-8">Loading GitHub status...</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* User Management Tab */}
          <TabsContent value="users">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <UserCog className="mr-2 h-5 w-5" />
                  User Management ({users.length})
                </CardTitle>
                <CardDescription>View and manage all users</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {users.map((usr) => (
                    <div key={usr._id} className="flex justify-between items-center p-3 bg-secondary/50 rounded-lg">
                      <div>
                        <p className="font-medium text-card-foreground">{usr.name}</p>
                        <p className="text-sm text-muted-foreground">{usr.email}</p>
                      </div>
                      <Badge variant={
                        usr.role === 'admin' ? 'default' :
                          usr.role === 'volunteer' ? 'secondary' :
                            'outline'
                      }>
                        {usr.role}
                      </Badge>
                    </div>
                  ))}
                  {users.length === 0 && (
                    <p className="text-center text-muted-foreground py-8">
                      No users found.
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Resource Detail Dialog */}
        <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
          <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{selectedResource?.name} - Participant Details</DialogTitle>
              <DialogDescription>
                {resourceDetails?.completed.length || 0} completed • {resourceDetails?.remaining.length || 0} remaining
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              {/* Completed */}
              <div>
                <h4 className="font-semibold mb-2 text-green-600">Completed ({resourceDetails?.completed.length || 0})</h4>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {resourceDetails?.completed.map((p, idx) => (
                    <div key={idx} className="flex justify-between items-center p-2 bg-green-500/10 rounded">
                      <div className="flex-1">
                        <p className="font-medium text-sm">{p.name}</p>
                        <p className="text-xs text-muted-foreground">{p.email}</p>
                        {p.teamId && <p className="text-xs text-muted-foreground">Team: {p.teamId}</p>}
                        {p.githubLink && (
                          <a
                            href={p.githubLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-blue-500 hover:underline flex items-center gap-1 mt-1"
                          >
                            <Github className="h-3 w-3" />
                            GitHub
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        )}
                        {p.claimCount !== undefined && p.maxClaims !== undefined && p.maxClaims > 1 && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Claims: {p.claimCount}/{p.maxClaims}
                          </p>
                        )}
                      </div>
                      <div className="text-right text-xs text-muted-foreground">
                        {p.timestamp && <p>{new Date(p.timestamp).toLocaleString()}</p>}
                        {p.volunteer && <p>by {p.volunteer}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Remaining */}
              <div>
                <h4 className="font-semibold mb-2 text-orange-600">Remaining ({resourceDetails?.remaining.length || 0})</h4>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {resourceDetails?.remaining.map((p, idx) => (
                    <div key={idx} className="flex justify-between items-center p-2 bg-orange-500/10 rounded">
                      <div>
                        <p className="font-medium text-sm">{p.name}</p>
                        <p className="text-xs text-muted-foreground">{p.email}</p>
                      </div>
                      <p className="text-xs text-muted-foreground">{p.qrCode}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
