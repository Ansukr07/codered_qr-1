'use client'

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Utensils, BedDouble, Coffee, Github, Megaphone, Calendar, Clock, ExternalLink } from 'lucide-react'
import Link from 'next/link'

const announcements = [
  {
    id: 1,
    title: "Hackathon Kickoff",
    message: "Welcome to Code Red 3.0! The hackathon officially begins now.",
    time: "2 hours ago",
    priority: "high"
  },
  {
    id: 2,
    title: "Lunch is Ready",
    message: "Lunch is now being served in the main hall.",
    time: "4 hours ago",
    priority: "medium"
  },
]

const schedule = [
  { time: "03:00 PM", event: "AI/ML Workshop", status: "ongoing" },
  { time: "06:00 PM", event: "Mentor Round 1", status: "upcoming" },
  { time: "08:00 PM", event: "Dinner", status: "upcoming" },
]

export default function TeamPage() {
  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold">Team Dashboard</h1>
          <p className="text-muted-foreground">Welcome back, <span className="text-primary font-semibold">Code Ninjas</span></p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="px-3 py-1 text-sm">
            Table #42
          </Badge>
          <Badge variant="success" className="px-3 py-1 text-sm">
            Checked In
          </Badge>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column - Status & Resources */}
        <div className="lg:col-span-2 space-y-6">
          {/* Resource Status Grid */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card className="bg-card/50 backdrop-blur border-border/50">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Food Status</CardTitle>
                <Utensils className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">2/3</div>
                <p className="text-xs text-muted-foreground mt-1">Meals claimed</p>
                <div className="flex gap-1 mt-3">
                  <div className="h-1.5 flex-1 rounded-full bg-primary" />
                  <div className="h-1.5 flex-1 rounded-full bg-primary" />
                  <div className="h-1.5 flex-1 rounded-full bg-secondary" />
                </div>
              </CardContent>
            </Card>
            <Card className="bg-card/50 backdrop-blur border-border/50">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Sleeping Bag</CardTitle>
                <BedDouble className="h-4 w-4 text-indigo-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-500">Issued</div>
                <p className="text-xs text-muted-foreground mt-1">ID: BAG-145</p>
              </CardContent>
            </Card>
            <Card className="bg-card/50 backdrop-blur border-border/50">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Chill Room</CardTitle>
                <Coffee className="h-4 w-4 text-accent" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">45m</div>
                <p className="text-xs text-muted-foreground mt-1">Time spent today</p>
              </CardContent>
            </Card>
          </div>

          {/* GitHub Repo Status */}
          <Card className="bg-card/50 backdrop-blur border-border/50">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Github className="h-5 w-5" />
                  Repository Status
                </CardTitle>
                <Badge variant="success">Active</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-4 rounded-lg bg-secondary/30 border border-border/30">
                <div className="space-y-1">
                  <p className="font-semibold flex items-center gap-2">
                    hackathon-project
                    <ExternalLink className="h-3 w-3 text-muted-foreground" />
                  </p>
                  <p className="text-sm text-muted-foreground">Last push: 2 mins ago by Alex</p>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex flex-col items-center">
                    <span className="font-bold text-lg">45</span>
                    <span className="text-muted-foreground text-xs">Commits</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <span className="font-bold text-lg">3</span>
                    <span className="text-muted-foreground text-xs">Stars</span>
                  </div>
                  <div className="flex flex-col items-center">
                    <span className="font-bold text-lg">2</span>
                    <span className="text-muted-foreground text-xs">Issues</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recent Announcements */}
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
                      className="text-xs"
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
              <Button variant="ghost" className="w-full text-sm text-muted-foreground">
                View All Announcements
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Schedule & Quick Actions */}
        <div className="space-y-6">
          {/* Upcoming Schedule */}
          <Card className="bg-card/50 backdrop-blur border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Upcoming Events
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {schedule.map((item, index) => (
                  <div key={index} className="flex items-start gap-4">
                    <div className="flex flex-col items-center">
                      <div className={`w-3 h-3 rounded-full ${item.status === "ongoing" ? "bg-primary animate-pulse" :
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

          {/* Quick Actions */}
          <Card className="bg-gradient-to-br from-primary/10 to-accent/10 border-primary/20">
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button className="w-full justify-start" variant="outline">
                Request Help
              </Button>
              <Button className="w-full justify-start" variant="outline">
                Submit Project
              </Button>
              <Button className="w-full justify-start" variant="outline">
                View Rules
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
