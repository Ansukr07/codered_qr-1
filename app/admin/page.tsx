'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { LogOut, Package, Users, TrendingUp, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { useAuth } from '@/contexts/AuthContext'

interface Resource {
  _id: string
  name: string
  totalQuantity: number
  distributedQuantity: number
  type: string
}

export default function AdminDashboard() {
  const { user, logout, loading } = useAuth()
  const router = useRouter()
  const [resources, setResources] = useState<Resource[]>([])
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [newResource, setNewResource] = useState({
    name: '',
    totalQuantity: 0,
    type: 'consumable',
  })

  useEffect(() => {
    if (!loading && (!user || user.role !== 'admin')) {
      router.push('/login')
    }
  }, [user, loading, router])

  useEffect(() => {
    fetchResources()
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

  const createResource = async () => {
    try {
      const res = await fetch('/api/resources', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newResource),
      })

      if (res.ok) {
        setIsCreateDialogOpen(false)
        setNewResource({ name: '', totalQuantity: 0, type: 'consumable' })
        fetchResources()
      } else {
        const data = await res.json()
        alert('Error: ' + data.message)
      }
    } catch (error) {
      console.error('Failed to create resource:', error)
      alert('Failed to create resource')
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
            <h1 className="text-3xl font-bold">Admin Dashboard</h1>
            <p className="text-muted-foreground">Welcome, {user.name}</p>
          </div>
          <Button onClick={logout} variant="outline">
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Resources</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalResources}</div>
              <p className="text-xs text-muted-foreground">Active resource types</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Distributed</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalDistributed}</div>
              <p className="text-xs text-muted-foreground">Out of {totalCapacity} total</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Utilization</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {totalCapacity > 0 ? Math.round((totalDistributed / totalCapacity) * 100) : 0}%
              </div>
              <p className="text-xs text-muted-foreground">Resource usage</p>
            </CardContent>
          </Card>
        </div>

        {/* Resources Management */}
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
                      <Label htmlFor="type">Resource Type</Label>
                      <Select
                        value={newResource.type}
                        onValueChange={(value) => setNewResource({ ...newResource, type: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="consumable">Consumable</SelectItem>
                          <SelectItem value="returnable">Returnable</SelectItem>
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
                <div key={resource._id} className="flex justify-between items-center p-4 bg-secondary/50 rounded-lg">
                  <div className="flex-1">
                    <h3 className="font-medium">{resource.name}</h3>
                    <p className="text-sm text-muted-foreground capitalize">{resource.type}</p>
                    <div className="mt-2">
                      <div className="flex justify-between text-sm mb-1">
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
      </div>
    </div>
  )
}
