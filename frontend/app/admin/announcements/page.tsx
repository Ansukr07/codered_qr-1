'use client'

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Megaphone, Clock, Calendar } from 'lucide-react'
import { toast } from 'sonner'

interface Announcement {
  _id: string
  title: string
  message: string
  priority: string
  audience: string
  createdAt: string
}

const schedule = [
  { time: "09:00 AM", event: "Registration & Check-in", status: "completed" },
  { time: "10:00 AM", event: "Opening Ceremony", status: "completed" },
  { time: "11:00 AM", event: "Hackathon Begins", status: "completed" },
  { time: "01:00 PM", event: "Lunch Break", status: "completed" },
  { time: "03:00 PM", event: "AI/ML Workshop", status: "ongoing" },
  { time: "06:00 PM", event: "Mentor Round 1", status: "upcoming" },
  { time: "08:00 PM", event: "Dinner", status: "upcoming" },
]

export default function AnnouncementsPage() {
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [message, setMessage] = useState('')
  const [priority, setPriority] = useState('medium')
  const [audience, setAudience] = useState('all')
  const [announcements, setAnnouncements] = useState<Announcement[]>([])

  useEffect(() => {
    fetchAnnouncements()

    // Poll for new announcements every 5 seconds
    const interval = setInterval(() => {
      fetchAnnouncements()
    }, 5000)

    return () => clearInterval(interval)
  }, [])

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

  const handleSendAnnouncement = async () => {
    try {
      const res = await fetch('/api/announcements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, message, priority, audience })
      })
      if (res.ok) {
        toast.success('Announcement sent successfully!')
        setOpen(false)
        setTitle('')
        setMessage('')
        setPriority('medium')
        setAudience('all')
        // Refresh announcements list
        fetchAnnouncements()
      } else {
        const data = await res.json()
        toast.error(data.message || 'Failed to send announcement')
      }
    } catch (error) {
      console.error('Failed to send announcement:', error)
      toast.error('Failed to send announcement')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-primary">Announcements & Schedule</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Megaphone className="h-4 w-4" />
              New Announcement
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[525px] bg-card border-border/50">
            <DialogHeader>
              <DialogTitle className="text-primary">Create Announcement</DialogTitle>
              <DialogDescription className="text-red-500">
                Send a new announcement to all participants.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="title" className="text-red-500">Title</Label>
                <Input id="title" placeholder="Announcement title" className="bg-secondary/50 text-white" value={title} onChange={(e) => setTitle(e.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="message" className="text-red-500">Message</Label>
                <Textarea
                  id="message"
                  placeholder="Type your announcement here..."
                  className="bg-secondary/50 min-h-[120px] text-white"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="priority" className="text-red-500">Priority</Label>
                <select
                  id="priority"
                  className="flex h-10 w-full rounded-md border border-input bg-secondary/50 px-3 py-2 text-sm text-white ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="audience" className="text-red-500">Audience</Label>
                <select
                  id="audience"
                  className="flex h-10 w-full rounded-md border border-input bg-secondary/50 px-3 py-2 text-sm text-white ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  value={audience}
                  onChange={(e) => setAudience(e.target.value)}
                >
                  <option value="all">All (Volunteers & Participants)</option>
                  <option value="volunteers">Volunteers Only</option>
                  <option value="participants">Participants Only</option>
                </select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)} className="text-white">Cancel</Button>
              <Button onClick={handleSendAnnouncement}>Send Announcement</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Announcements */}
        <Card className="bg-card/50 backdrop-blur border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Megaphone className="h-5 w-5" />
              Recent Announcements
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {announcements.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No announcements yet. Create one to get started!
              </p>
            ) : (
              announcements.map((announcement) => (
                <div
                  key={announcement._id}
                  className="p-4 rounded-lg bg-secondary/30 border border-border/30 space-y-2"
                >
                  <div className="flex items-start justify-between">
                    <h3 className="font-semibold">{announcement.title}</h3>
                    <Badge
                      variant={
                        announcement.priority === "high" ? "destructive" :
                          announcement.priority === "medium" ? "default" :
                            "secondary"
                      }
                    >
                      {announcement.priority}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{announcement.message}</p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {new Date(announcement.createdAt).toLocaleString()}
                    </div>
                    <Badge variant="outline" className="text-xs capitalize">
                      {announcement.audience}
                    </Badge>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Schedule */}
        <Card className="bg-card/50 backdrop-blur border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Event Schedule
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {schedule.map((item, index) => (
                <div key={index} className="flex items-start gap-4">
                  <div className="flex flex-col items-center">
                    <div className={`w-3 h-3 rounded-full ${item.status === "completed" ? "bg-green-500" :
                      item.status === "ongoing" ? "bg-primary animate-pulse" :
                        "bg-muted"
                      }`} />
                    {index < schedule.length - 1 && (
                      <div className="w-0.5 h-12 bg-border/50 my-1" />
                    )}
                  </div>
                  <div className="flex-1 pb-4">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium">{item.time}</span>
                      <Badge
                        variant={
                          item.status === "completed" ? "success" :
                            item.status === "ongoing" ? "default" :
                              "outline"
                        }
                        className="text-xs"
                      >
                        {item.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{item.event}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
