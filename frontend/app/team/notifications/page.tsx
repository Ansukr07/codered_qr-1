'use client'

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Bell, Check, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

const notifications = [
  {
    id: 1,
    title: "Mentor Assigned",
    message: "A mentor has been assigned to your team for the first round of reviews.",
    time: "10 mins ago",
    read: false,
    type: "info"
  },
  {
    id: 2,
    title: "Food Scan Successful",
    message: "Lunch scan recorded for Alex Johnson.",
    time: "1 hour ago",
    read: true,
    type: "success"
  },
  {
    id: 3,
    title: "Submission Deadline Warning",
    message: "Project submission deadline is in 2 hours. Please ensure your repo is up to date.",
    time: "2 hours ago",
    read: true,
    type: "warning"
  },
  {
    id: 4,
    title: "Welcome to Code Red 3.0",
    message: "Thanks for checking in! Your team table is #42.",
    time: "5 hours ago",
    read: true,
    type: "info"
  }
]

export default function NotificationsPage() {
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/team">
          <Button variant="ghost" size="sm" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Notifications</h1>
          <p className="text-muted-foreground">Stay updated with latest alerts</p>
        </div>
      </div>

      <Card className="bg-card/50 backdrop-blur border-border/50">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            All Notifications
          </CardTitle>
          <Button variant="ghost" size="sm" className="text-xs">
            Mark all as read
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              className={`p-4 rounded-lg border transition-all ${notification.read
                  ? "bg-secondary/20 border-border/30 opacity-70"
                  : "bg-secondary/50 border-primary/30 shadow-sm"
                }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold">{notification.title}</h3>
                    {!notification.read && (
                      <span className="w-2 h-2 rounded-full bg-primary" />
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">{notification.message}</p>
                  <p className="text-xs text-muted-foreground pt-1">{notification.time}</p>
                </div>
                {!notification.read && (
                  <Button size="icon" variant="ghost" className="h-8 w-8">
                    <Check className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
