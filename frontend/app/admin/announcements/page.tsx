'use client'

import { useState } from "react"
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

const announcements = [
  {
    id: 1,
    title: "Hackathon Kickoff",
    message: "Welcome to Codered 3.0! The hackathon officially begins now. Good luck to all teams!",
    time: "2 hours ago",
    priority: "high"
  },
  {
    id: 2,
    title: "Lunch is Ready",
    message: "Lunch is now being served in the main hall. Please collect your meals using your QR codes.",
    time: "4 hours ago",
    priority: "medium"
  },
  {
    id: 3,
    title: "Workshop at 3 PM",
    message: "Join us for a workshop on AI/ML at 3 PM in Room 201. Don't miss it!",
    time: "6 hours ago",
    priority: "low"
  },
]

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
              <DialogTitle>Create Announcement</DialogTitle>
              <DialogDescription>
                Send a new announcement to all participants.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="title">Title</Label>
                <Input id="title" placeholder="Announcement title" className="bg-secondary/50" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="message">Message</Label>
                <Textarea
                  id="message"
                  placeholder="Type your announcement here..."
                  className="bg-secondary/50 min-h-[120px]"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="priority">Priority</Label>
                <select
                  id="priority"
                  className="flex h-10 w-full rounded-md border border-input bg-secondary/50 px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button onClick={() => setOpen(false)}>Send Announcement</Button>
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
            {announcements.map((announcement) => (
              <div
                key={announcement.id}
                className="p-4 rounded-lg bg-secondary/30 border border-border/30 space-y-2"
              >
                <div className="flex items-start justify-between">
                  <h3 className="font-semibold">{announcement.title}</h3>
                  <Badge
                    variant={
                      announcement.priority === "high" ? "destructive" :
                        announcement.priority === "medium" ? "warning" :
                          "secondary"
                    }
                  >
                    {announcement.priority}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">{announcement.message}</p>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  {announcement.time}
                </div>
              </div>
            ))}
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
