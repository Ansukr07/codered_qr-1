'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Utensils, Package, BedDouble, HandHelping, TrendingUp, ChevronRight, Search, Megaphone } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { useAuth } from '@/contexts/AuthContext'

interface Resource {
  _id: string
  name: string
  totalQuantity: number
  distributedQuantity: number
  type: string
}

interface HelpRequest {
  _id: string
  status: string
}

interface Announcement {
  _id: string
  title: string
  message: string
  priority: string
  audience: string
  createdAt: string
}

export default function VolunteerDashboard() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [resources, setResources] = useState<Resource[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [helpRequests, setHelpRequests] = useState<HelpRequest[]>([])

  useEffect(() => {
    if (!loading && (!user || (user.role !== 'volunteer' && user.role !== 'admin'))) {
      router.push('/login')
    }
  }, [user, loading, router])

  useEffect(() => {
    fetchResources()
    fetchAnnouncements()
    fetchHelpRequests()
  }, [])

  const fetchResources = async () => {
    try {
      const res = await fetch('/api/resources')
      const data = await res.json()
      setResources(data.resources)
    } catch (error) {
      console.error('Failed to fetch resources:', error)
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

  const fetchHelpRequests = async () => {
    try {
      const res = await fetch('/api/help-requests')
      if (res.ok) {
        const data = await res.json()
        setHelpRequests(data.helpRequests)
      }
    } catch (error) {
      console.error('Failed to fetch help requests:', error)
    }
  }

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </div>
    )
  }

  // Group resources by type
  const foodResources = resources.filter(r => r.name.toLowerCase().includes('lunch') || r.name.toLowerCase().includes('dinner') || r.name.toLowerCase().includes('breakfast') || r.name.toLowerCase().includes('food'))
  const bagResources = resources.filter(r => r.name.toLowerCase().includes('bag') || r.name.toLowerCase().includes('sleep'))
  const chillResources = resources.filter(r => r.name.toLowerCase().includes('chill'))

  const totalFood = foodResources.reduce((sum, r) => sum + r.distributedQuantity, 0)
  const totalBags = bagResources.reduce((sum, r) => sum + r.distributedQuantity, 0)
  const totalChill = chillResources.reduce((sum, r) => sum + r.distributedQuantity, 0)
  const totalHelp = helpRequests.length

  // Deduplicate and aggregate resources by name
  const uniqueResourcesMap = new Map<string, Resource>()

  resources.forEach(r => {
    const existing = uniqueResourcesMap.get(r.name)
    if (existing) {
      uniqueResourcesMap.set(r.name, {
        ...existing,
        totalQuantity: existing.totalQuantity + r.totalQuantity,
        distributedQuantity: existing.distributedQuantity + r.distributedQuantity
      })
    } else {
      uniqueResourcesMap.set(r.name, { ...r })
    }
  })

  const uniqueResources = Array.from(uniqueResourcesMap.values())

  const filteredResources = uniqueResources.filter(resource =>
    resource.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    resource.type.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const scanOptions = [
    {
      title: 'Food Distribution',
      description: 'Scan for meals',
      icon: Utensils,
      href: '/volunteer/scan-food',
      color: 'text-orange-500',
      bgColor: 'bg-orange-500/10',
      count: totalFood,
      resources: foodResources
    },
    {
      title: 'Sleeping Bag',
      description: 'Track sleeping bags',
      icon: BedDouble,
      href: '/volunteer/scan-bag',
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
      count: totalBags,
      resources: bagResources
    },
    {
      title: 'Chill Room',
      description: 'Manage room access',
      icon: Package,
      href: '/volunteer/scan-chill',
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10',
      count: totalChill,
      resources: chillResources
    },
    {
      title: 'Help Request',
      description: 'Log support needs',
      icon: HandHelping,
      href: '/volunteer/help',
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
      count: totalHelp,
      resources: [] // Help requests are not resources
    },
  ]

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Volunteer Dashboard</h1>
        <p className="text-muted-foreground">Select a scanning option below</p>
      </div>

      {/* Quick Stats */}
      <Card className="bg-card/50 backdrop-blur border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Today's Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-orange-500">{totalFood}</p>
              <p className="text-xs text-muted-foreground">Meals Served</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-500">{totalBags}</p>
              <p className="text-xs text-muted-foreground">Bags Issued</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-purple-500">{totalChill}</p>
              <p className="text-xs text-muted-foreground">Chill Access</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-500">{totalHelp}</p>
              <p className="text-xs text-muted-foreground">Help Requests</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Scanning Options */}
      <div className="grid md:grid-cols-2 gap-4">
        {scanOptions.map((option) => (
          <Link key={option.href} href={option.href}>
            <Card className="bg-card/50 backdrop-blur border-border/50 hover:border-primary/50 transition-all cursor-pointer group h-full">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-lg ${option.bgColor}`}>
                      <option.icon className={`h-6 w-6 ${option.color}`} />
                    </div>
                    <div className="space-y-1">
                      <h3 className="font-semibold text-lg text-card-foreground">{option.title}</h3>
                      <p className="text-sm text-muted-foreground">{option.description}</p>
                      {option.resources.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {option.resources.map(r => (
                            <Badge key={r._id} variant="secondary" className="text-xs">
                              {r.name}: {r.distributedQuantity}/{r.totalQuantity}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* All Resources */}
      {resources.length > 0 && (
        <Card className="bg-card/50 backdrop-blur border-border/50">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>All Resources</CardTitle>
                <CardDescription>Current inventory status</CardDescription>
              </div>
              <div className="relative w-64">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search resources..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {filteredResources.map((resource) => {
                let href = '/volunteer'
                const name = resource.name.toLowerCase()
                if (name.includes('lunch') || name.includes('dinner') || name.includes('breakfast') || name.includes('food')) href = '/volunteer/scan-food'
                else if (name.includes('bag') || name.includes('sleep')) href = '/volunteer/scan-bag'
                else if (name.includes('chill')) href = '/volunteer/scan-chill'
                else if (name.includes('help')) href = '/volunteer/help'

                return (
                  <Link key={resource._id} href={href}>
                    <div className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg hover:bg-secondary transition-colors cursor-pointer mb-3">
                      <div className="flex-1">
                        <p className="font-medium text-card-foreground">{resource.name}</p>
                        <p className="text-xs text-muted-foreground capitalize">{resource.type}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <p className="text-sm font-medium text-foreground">
                            {resource.distributedQuantity}/{resource.totalQuantity}
                          </p>
                          <div className="w-24 bg-secondary rounded-full h-1.5 mt-1">
                            <div
                              className="bg-primary h-1.5 rounded-full transition-all"
                              style={{
                                width: `${Math.min((resource.distributedQuantity / resource.totalQuantity) * 100, 100)}%`,
                              }}
                            />
                          </div>
                        </div>
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </div>
                  </Link>
                )
              })}
              {filteredResources.length === 0 && (
                <p className="text-center text-muted-foreground py-4">No resources found</p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Announcements */}
      {announcements.length > 0 && (
        <Card className="bg-card/50 backdrop-blur border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Megaphone className="h-5 w-5" />
              Announcements
            </CardTitle>
            <CardDescription>Latest updates from organizers</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {announcements.slice(0, 5).map((announcement) => (
                <div key={announcement._id} className="flex justify-between items-start p-3 bg-secondary/50 rounded-lg">
                  <div className="flex-1">
                    <p className="font-medium text-card-foreground">{announcement.title}</p>
                    <p className="text-sm text-muted-foreground mt-1">{announcement.message}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(announcement.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <Badge variant={announcement.priority === 'high' ? 'destructive' : announcement.priority === 'medium' ? 'default' : 'secondary'}>
                    {announcement.priority}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
